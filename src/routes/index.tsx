import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  CircleDollarSign,
  KeyRound,
  Link2,
  MessageCircleMore,
  ReceiptText,
  RefreshCw,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Pulse — Performance & Vendas" },
      { name: "description", content: "Dashboard de métricas de performance, vendas e criativos em tempo real." },
      { property: "og:title", content: "Pulse — Performance & Vendas" },
      { property: "og:description", content: "Acompanhe receita, leads e criativos diretamente do Cloudflare Worker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const periods = ["Hoje", "Ontem", "7 dias", "30 dias", "Total"] as const;
type Period = (typeof periods)[number];

type Sale = { f?: string; c?: string; x?: string; t?: number; a?: number };
type Lead = { f?: string; c?: string; x?: string; t?: number };
type Meta = { spend?: Record<string, unknown>; nick?: Record<string, string>; [key: string]: unknown };
type WorkerData = { sales: Sale[]; leads: Lead[]; meta: Meta };

type Config = { url: string; key: string };

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value);

const compactMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

const number = (value: number) => new Intl.NumberFormat("pt-BR").format(value);

const normalizeUrl = (value: string) => value.trim().replace(/\\/+$/, "");

const getConfig = (): Config => ({
  url: localStorage.getItem("pulse.workerUrl") || import.meta.env.VITE_WORKER_URL || "",
  key: localStorage.getItem("pulse.panelKey") || "",
});

const saveConfig = (config: Config) => {
  localStorage.setItem("pulse.workerUrl", normalizeUrl(config.url));
  localStorage.setItem("pulse.panelKey", config.key);
};

async function workerRequest<T>(config: Config, path: string, init?: RequestInit): Promise<T> {
  if (!config.url || !config.key) throw new Error("Configure a URL do Worker e a PANEL_KEY.");
  const headers = new Headers(init?.headers);
  headers.set("x-k", config.key);
  headers.set("accept", "application/json");

  const response = await fetch(normalizeUrl(config.url) + path, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401) throw new Error("PANEL_KEY recusada pelo Worker.");
  if (!response.ok) throw new Error(`Worker respondeu HTTP ${response.status}.`);
  return response.json() as Promise<T>;
}

const fetchData = (config: Config) => workerRequest<WorkerData>(config, "/api/data");

const saveMeta = (config: Config, meta: Meta) =>
  workerRequest<{ ok: number }>(config, "/api/meta", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(meta),
  });

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const periodStart = (period: Period) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "Ontem") d.setDate(d.getDate() - 1);
  if (period === "7 dias") d.setDate(d.getDate() - 6);
  if (period === "30 dias") d.setDate(d.getDate() - 29);
  if (period === "Total") return 0;
  return d.getTime();
};

const periodEnd = (period: Period) => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  if (period === "Ontem") d.setDate(d.getDate() - 1);
  return d.getTime();
};

const inPeriod = (timestamp: number | undefined, period: Period) => {
  if (!timestamp) return false;
  return timestamp >= periodStart(period) && timestamp <= periodEnd(period);
};

const dateKey = (timestamp: number) => {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const displayDate = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(
    new Date(timestamp),
  );

const clean = (value?: string) => (value || "").trim() || "Sem identificação";

const displayName = (content: string, meta: Meta) =>
  meta.nick?.[content] || content || "Sem criativo";

function numericValue(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9,.-]/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function spendFromValue(value: unknown, campaign?: string, content?: string): number {
  if (typeof value === "number" || typeof value === "string") return numericValue(value);
  if (!value || typeof value !== "object") return 0;
  const record = value as Record<string, unknown>;
  const keys = [content, campaign].filter(Boolean) as string[];
  for (const key of keys) if (record[key] != null) return numericValue(record[key]);
  for (const key of ["amount", "value", "spend", "cost", "total"]) if (record[key] != null) return numericValue(record[key]);
  return 0;
}

function getSpend(meta: Meta, timestamp: number, campaign?: string, content?: string): number {
  const spend = meta.spend;
  if (!spend) return 0;

  const day = dateKey(timestamp);
  const candidates = [
    spend[day],
    spend[content || ""],
    spend[campaign || ""],
    (spend as Record<string, unknown>)[`${day}|${campaign || ""}`],
    (spend as Record<string, unknown>)[`${day}|${content || ""}`],
    (spend as Record<string, unknown>)[`${day}/${campaign || ""}`],
    (spend as Record<string, unknown>)[`${day}/${content || ""}`],
  ];

  for (const candidate of candidates) {
    const result = spendFromValue(candidate, campaign, content);
    if (result) return result;
  }
  return 0;
}

function groupByCampaign(sales: Sale[], leads: Lead[]) {
  const map = new Map<string, { sales: Sale[]; leads: Lead[] }>();
  for (const sale of sales) {
    const key = clean(sale.c);
    const row = map.get(key) || { sales: [], leads: [] };
    row.sales.push(sale);
    map.set(key, row);
  }
  for (const lead of leads) {
    const key = clean(lead.c);
    const row = map.get(key) || { sales: [], leads: [] };
    row.leads.push(lead);
    map.set(key, row);
  }
  return map;
}

function Index() {
  const [period, setPeriod] = useState<Period>("7 dias");
  const [config, setConfig] = useState<Config>(() => getConfig());
  const [data, setData] = useState<WorkerData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    if (!config.url || !config.key) return;
    setLoading(true);
    try {
      const next = await fetchData(config);
      setData({
        sales: Array.isArray(next.sales) ? next.sales : [],
        leads: Array.isArray(next.leads) ? next.leads : [],
        meta: next.meta || {},
      });
      setError("");
      setLastSync(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível conectar ao Worker.");
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    void load();
    if (!config.url || !config.key) return;
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [config, load]);

  const filtered = useMemo(() => {
    const sales = (data?.sales || []).filter((item) => inPeriod(item.t, period));
    const leads = (data?.leads || []).filter((item) => inPeriod(item.t, period));
    return { sales, leads };
  }, [data, period]);

  const revenue = useMemo(() => filtered.sales.reduce((sum, item) => sum + numericValue(item.a), 0), [filtered.sales]);
  const salesCount = filtered.sales.length;
  const leadsCount = filtered.leads.length;
  const conversion = leadsCount ? (salesCount / leadsCount) * 100 : 0;
  const ticket = salesCount ? revenue / salesCount : 0;

  const chartData = useMemo(() => {
    if (period === "Hoje" || period === "Ontem") {
      const buckets = Array.from({ length: 24 }, (_, hour) => ({ day: `${String(hour).padStart(2, "0")}h`, value: 0 }));
      for (const sale of filtered.sales) {
        const hour = new Date(sale.t || 0).getHours();
        if (buckets[hour]) buckets[hour].value += numericValue(sale.a);
      }
      return buckets.filter((item) => item.value > 0 || Number(item.day.slice(0, 2)) % 3 === 0);
    }

    const days = period === "7 dias" ? 7 : period === "30 dias" ? 30 : 14;
    const result: { day: string; value: number }[] = [];
    const end = new Date();
    end.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      const key = dateKey(d.getTime());
      const value = filtered.sales
        .filter((sale) => dateKey(sale.t || 0) === key)
        .reduce((sum, sale) => sum + numericValue(sale.a), 0);
      result.push({ day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(d), value });
    }

    if (period === "Total") {
      const months = new Map<string, number>();
      for (const sale of filtered.sales) {
        const key = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(new Date(sale.t || 0));
        months.set(key, (months.get(key) || 0) + numericValue(sale.a));
      }
      return Array.from(months.entries()).map(([day, value]) => ({ day, value })).slice(-12);
    }

    return result;
  }, [filtered.sales, period]);

  const activities = useMemo(() => {
    const events = [
      ...filtered.sales.map((sale) => ({
        title: "Venda aprovada",
        detail: `${clean(sale.f)} • ${money(numericValue(sale.a))}`,
        time: sale.t || 0,
        icon: CircleDollarSign,
        tone: "positive",
      })),
      ...filtered.leads.map((lead) => ({
        title: "Novo lead",
        detail: `${clean(lead.c)} • ${displayName(clean(lead.x), data?.meta || {})}`,
        time: lead.t || 0,
        icon: UsersRound,
        tone: "info",
      })),
    ];
    return events.sort((a, b) => b.time - a.time).slice(0, 6);
  }, [filtered, data?.meta]);

  const creatives = useMemo(() => {
    const keys = new Set<string>();
    filtered.sales.forEach((item) => keys.add(`${clean(item.c)}||${clean(item.x)}`));
    filtered.leads.forEach((item) => keys.add(`${clean(item.c)}||${clean(item.x)}`));

    return Array.from(keys).map((key) => {
      const [campaign, content] = key.split("||");
      const sales = filtered.sales.filter((item) => clean(item.c) === campaign && clean(item.x) === content);
      const leads = filtered.leads.filter((item) => clean(item.c) === campaign && clean(item.x) === content);
      const creativeRevenue = sales.reduce((sum, item) => sum + numericValue(item.a), 0);

      // The Worker stores spend in meta.spend. Prefer creative/date keys when present,
      // then fall back to the campaign/date structure used by the original Worker page.
      const spendByDate = new Map<string, number>();
      for (const sale of sales) {
        const keyDate = dateKey(sale.t || 0);
        spendByDate.set(keyDate, (spendByDate.get(keyDate) || 0) + getSpend(data?.meta || {}, sale.t || 0, campaign, content));
      }
      const spend = Array.from(spendByDate.values()).reduce((sum, value) => sum + value, 0);
      const cpa = sales.length ? spend / sales.length : 0;
      const roas = spend ? creativeRevenue / spend : 0;
      const status = spend === 0 ? "Sem gasto" : roas >= 3 ? "Bom" : roas >= 1 ? "Atenção" : "Ruim";

      return {
        campaign,
        content,
        name: displayName(content === "Sem identificação" ? "" : content, data?.meta || {}),
        sales: sales.length,
        leads: leads.length,
        revenue: creativeRevenue,
        spend,
        cpa,
        roas,
        status,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [filtered.sales, filtered.leads, data?.meta]);

  const totalSpend = useMemo(() => {
    const dates = new Set<number>();
    filtered.sales.forEach((sale) => {
      const day = new Date(sale.t || 0);
      day.setHours(12, 0, 0, 0);
      dates.add(day.getTime());
    });
    return Array.from(dates).reduce((sum, timestamp) => sum + getSpend(data?.meta || {}, timestamp), 0);
  }, [filtered.sales, data?.meta]);

  const roas = totalSpend ? revenue / totalSpend : 0;
  const profit = revenue - totalSpend;

  const saveSettings = (next: Config) => {
    const normalized = { ...next, url: normalizeUrl(next.url) };
    saveConfig(normalized);
    setConfig(normalized);
    setSettingsOpen(false);
  };

  if (!config.url || !config.key || settingsOpen) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center">
          <section className="panel w-full animate-rise">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="section-label">Pulse analytics</p>
                <h1 className="text-xl font-semibold">Conectar ao Cloudflare Worker</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              O React consulta diretamente <code>/api/data</code> e usa o mesmo <code>x-k</code> da PANEL_KEY do Worker.
              A configuração fica salva somente neste navegador.
            </p>
            <WorkerForm initial={config} onSave={saveSettings} />
            {error && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-6 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pulse analytics</p>
              <h1 className="truncate text-xl font-semibold sm:text-2xl">Performance & Vendas</h1>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {lastSync ? `Sincronizado às ${new Date(lastSync).toLocaleTimeString("pt-BR")}` : "Sincronizando…"}
              </p>
            </div>
          </div>
          <div className="col-span-2 flex max-w-full items-center gap-2 overflow-x-auto sm:col-span-1">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              {periods.map((item) => (
                <Button key={item} variant="period" size="sm" data-active={period === item} onClick={() => setPeriod(item)}>
                  {item}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Atualizar">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Configurações">
              <Settings2 className="size-4" />
            </Button>
          </div>
        </header>

        {error && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>Tentar novamente</Button>
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Faturamento" icon={BadgeDollarSign} value={compactMoney(revenue)} detail={`${number(salesCount)} vendas aprovadas`} badge={salesCount ? "LIVE" : "—"} delay="delay-1" />
          <MetricCard label="Leads" icon={UsersRound} value={number(leadsCount)} detail={`${number(salesCount)} vendas / ${number(leadsCount)} leads`} badge={`${conversion.toFixed(2).replace(".", ",")}%`} delay="delay-2" />
          <MetricCard label="Ticket médio" icon={ReceiptText} value={money(ticket)} detail="Por venda aprovada" badge={salesCount ? "ATUAL" : "—"} delay="delay-3" />
          <MetricCard label="ROAS" icon={ArrowUpRight} value={roas ? `${roas.toFixed(2).replace(".", ",")}x` : "—"} detail={`Gasto: ${money(totalSpend)}`} badge={profit >= 0 ? `+${money(profit)}` : money(profit)} delay="delay-4" />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article className="panel animate-rise delay-3 min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="section-label">Receita</p>
                <h2 className="section-title">Faturamento vindo do Worker</h2>
              </div>
              <div className="text-right">
                <strong className="text-lg font-semibold sm:text-xl">{compactMoney(revenue)}</strong>
                <p className="text-xs text-muted-foreground">{number(salesCount)} vendas</p>
              </div>
            </div>
            <div className="mt-7 h-[300px] w-full sm:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 6, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--primary)", strokeDasharray: "4 4" }} />
                  <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fill="url(#revenueFill)" activeDot={{ r: 5, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel animate-rise delay-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-label">Ao vivo</p>
                <h2 className="section-title">Atividade recente</h2>
              </div>
              <span className="live-dot"><i /> Live</span>
            </div>
            <div className="mt-6 space-y-1">
              {activities.length ? activities.map(({ title, detail, time, icon: Icon, tone }) => (
                <div key={`${title}-${time}`} className="activity-row">
                  <div className={`activity-icon ${tone}`}><Icon className="size-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="truncate text-xs text-muted-foreground">{detail}</p>
                  </div>
                  <time className="shrink-0 text-[11px] text-muted-foreground">{time ? displayDate(time) : "—"}</time>
                </div>
              )) : <EmptyState text="Nenhum evento neste período." />}
            </div>
          </article>
        </section>

        <section className="panel animate-rise delay-4 mt-4 overflow-hidden p-0">
          <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-5 sm:px-6">
            <div>
              <p className="section-label">TikTok Promover / UTMs</p>
              <h2 className="section-title">Performance dos criativos</h2>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{number(creatives.length)} criativos identificados</p>
              <p>Dados: sales + leads + meta do KV</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead>
                <tr>{["Criativo", "Campanha", "Leads", "Vendas", "Faturamento", "Gasto", "CPA", "ROAS", "Status"].map((head) => <th key={head}>{head}</th>)}</tr>
              </thead>
              <tbody>
                {creatives.map((row) => (
                  <tr key={`${row.campaign}-${row.content}`}>
                    <td className="max-w-[260px] font-medium text-foreground">
                      <p className="truncate">{row.name}</p>
                      {row.content !== row.name && <p className="truncate text-[10px] text-muted-foreground">{row.content}</p>}
                    </td>
                    <td className="max-w-[220px] truncate">{row.campaign}</td>
                    <td>{number(row.leads)}</td>
                    <td>{number(row.sales)}</td>
                    <td>{money(row.revenue)}</td>
                    <td>{money(row.spend)}</td>
                    <td>{row.sales ? money(row.cpa) : "—"}</td>
                    <td className="font-semibold text-foreground">{row.roas ? `${row.roas.toFixed(2).replace(".", ",")}x` : "—"}</td>
                    <td><span className={`status ${statusClass(row.status)}`}><i />{row.status}</span></td>
                  </tr>
                ))}
                {!creatives.length && <tr><td colSpan={9}><EmptyState text="Nenhum criativo encontrado no período." /></td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <InfoCard icon={ArrowDownRight} title="Gasto" value={money(totalSpend)} detail="Lido do meta.spend no KV." />
          <InfoCard icon={ArrowUpRight} title="Resultado" value={money(profit)} detail="Faturamento menos gasto informado." />
          <InfoCard icon={Link2} title="Origem" value="Cloudflare Worker" detail={`${config.url}`} />
        </section>

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          Atualização automática a cada 15 segundos • O Worker continua sendo a fonte dos dados.
        </p>
      </div>
    </main>
  );
}

function WorkerForm({ initial, onSave }: { initial: Config; onSave: (config: Config) => void }) {
  const [url, setUrl] = useState(initial.url);
  const [key, setKey] = useState(initial.key);

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ url, key });
      }}
    >
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">URL do Worker</span>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://seu-worker.seudominio.workers.dev" className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">PANEL_KEY</span>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="Valor da variável PANEL_KEY" className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </label>
      <div className="flex flex-wrap justify-end gap-2">
        {initial.url && <Button type="button" variant="outline" onClick={() => onSave({ url: "", key: "" })}>Desconectar</Button>}
        <Button type="submit"><Link2 className="size-4" />Conectar</Button>
      </div>
    </form>
  );
}

function MetricCard({ label, icon: Icon, value, detail, badge, delay }: { label: string; icon: typeof BadgeDollarSign; value: string; detail: string; badge: string; delay: string }) {
  return (
    <article className={`metric-card animate-rise ${delay}`}>
      <div className="metric-head"><span>{label}</span><span className="metric-icon"><Icon className="size-4" /></span></div>
      <div className="mt-4">
        <strong className="metric-value">{value}</strong>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="metric-detail">{detail}</p>
          <span className="trend">{badge}</span>
        </div>
      </div>
    </article>
  );
}

function InfoCard({ icon: Icon, title, value, detail }: { icon: typeof ArrowUpRight; title: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <div className="metric-head"><span>{title}</span><span className="metric-icon"><Icon className="size-4" /></span></div>
      <strong className="mt-4 block text-xl font-semibold">{value}</strong>
      <p className="mt-1 truncate text-xs text-muted-foreground" title={detail}>{detail}</p>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function statusClass(status: string) {
  if (status === "Bom") return "status-bom";
  if (status === "Atenção") return "status-atencao";
  if (status === "Ruim") return "status-ruim";
  return "status-atencao";
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="text-xs text-muted-foreground">{label}</p>
      <strong className="text-sm">{money(payload[0]?.value ?? 0)}</strong>
    </div>
  );
}
