import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  CircleDollarSign,
  MessageCircleMore,
  ReceiptText,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
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
      { name: "description", content: "Dashboard de métricas de performance, vendas e criativos de marketing." },
      { property: "og:title", content: "Pulse — Performance & Vendas" },
      { property: "og:description", content: "Acompanhe receita, conversão, leads e performance de criativos em tempo real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const periods = ["Hoje", "Ontem", "7 dias", "30 dias", "Total"] as const;
type Period = (typeof periods)[number];

const performanceData: Record<Period, { day: string; value: number }[]> = {
  Hoje: [{ day: "08h", value: 1250 }, { day: "10h", value: 2100 }, { day: "12h", value: 1840 }, { day: "14h", value: 3270 }, { day: "16h", value: 4130 }, { day: "18h", value: 4680 }],
  Ontem: [{ day: "08h", value: 980 }, { day: "10h", value: 1720 }, { day: "12h", value: 2410 }, { day: "14h", value: 2180 }, { day: "16h", value: 3650 }, { day: "18h", value: 3920 }],
  "7 dias": [{ day: "Seg", value: 9100 }, { day: "Ter", value: 12400 }, { day: "Qua", value: 10800 }, { day: "Qui", value: 15900 }, { day: "Sex", value: 14200 }, { day: "Sáb", value: 18300 }, { day: "Dom", value: 21700 }],
  "30 dias": [{ day: "01", value: 38200 }, { day: "05", value: 44700 }, { day: "10", value: 42100 }, { day: "15", value: 58900 }, { day: "20", value: 53400 }, { day: "25", value: 67200 }, { day: "30", value: 74800 }],
  Total: [{ day: "Mai", value: 184000 }, { day: "Jun", value: 212000 }, { day: "Jul", value: 198000 }, { day: "Ago", value: 247000 }, { day: "Set", value: 286000 }, { day: "Out", value: 318000 }],
};

const activities = [
  { title: "Venda aprovada", detail: "PIX • R$ 297,00", time: "há 1 min", icon: CircleDollarSign, tone: "positive" },
  { title: "Novo lead", detail: "Campanha Black Friday", time: "há 3 min", icon: UsersRound, tone: "info" },
  { title: "Venda aprovada", detail: "Cartão • R$ 497,00", time: "há 8 min", icon: CircleDollarSign, tone: "positive" },
  { title: "Conversa iniciada", detail: "Criativo VSL #04", time: "há 12 min", icon: MessageCircleMore, tone: "info" },
];

const creatives = [
  { name: "ugc_depoimento_01", sales: 48, revenue: "14.256", spend: "2.180", cpa: "45,42", roas: "6,54", status: "Bom" },
  { name: "vsl_hook_dor_04", sales: 31, revenue: "9.207", spend: "2.940", cpa: "94,84", roas: "3,13", status: "Atenção" },
  { name: "review_produto_07", sales: 23, revenue: "6.831", spend: "1.420", cpa: "61,74", roas: "4,81", status: "Bom" },
  { name: "trend_oferta_02", sales: 7, revenue: "2.079", spend: "1.680", cpa: "240,00", roas: "1,24", status: "Ruim" },
];

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

function Index() {
  const [period, setPeriod] = useState<Period>("7 dias");
  const chartData = performanceData[period];
  const total = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-6 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow"><Sparkles className="size-5" /></div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pulse analytics</p>
              <h1 className="truncate text-xl font-semibold sm:text-2xl">Performance & Vendas</h1>
            </div>
          </div>
          <div className="col-span-2 flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 sm:col-span-1">
            {periods.map((item) => (
              <Button key={item} variant="period" size="sm" data-active={period === item} onClick={() => setPeriod(item)}>{item}</Button>
            ))}
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Vendas aprovadas" icon={BadgeDollarSign} badge="+18,2%" value={currency(total)} detail="127 pagamentos confirmados" delay="delay-1" />
          <article className="metric-card animate-rise delay-2">
            <div className="metric-head"><span>Taxa de conversão</span><ArrowUpRight className="size-4 text-positive" /></div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div><strong className="metric-value">8,74%</strong><p className="metric-detail">de 1.453 pagamentos</p></div>
              <div className="gauge" aria-label="Taxa de conversão de 8,74 por cento"><div><span>8,74%</span></div></div>
            </div>
          </article>
          <article className="metric-card animate-rise delay-3">
            <div className="metric-head"><span>Total starts / leads</span><MessageCircleMore className="size-4 text-primary" /></div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div><strong className="metric-value">1.453</strong><p className="metric-detail">+214 nesta semana</p></div>
              <div className="flex h-14 items-end gap-1" aria-hidden="true">{[35, 52, 42, 68, 58, 82, 100].map((height, i) => <span key={i} className="w-1.5 rounded-full bg-primary/35 last:bg-primary" style={{ height: `${height}%` }} />)}</div>
            </div>
          </article>
          <MetricCard label="Ticket médio" icon={ReceiptText} value="R$ 297,43" detail="89 pagamentos via PIX" badge="+4,8%" delay="delay-4" />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article className="panel animate-rise delay-3 min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0"><p className="section-label">Receita</p><h2 className="section-title">Desempenho de faturamento</h2></div>
              <div className="text-right"><strong className="text-lg font-semibold sm:text-xl">{currency(total)}</strong><p className="text-xs text-positive">↑ 12,6%</p></div>
            </div>
            <div className="mt-7 h-[300px] w-full sm:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 6, left: -16, bottom: 0 }}>
                  <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.38} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
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
            <div className="flex items-center justify-between"><div><p className="section-label">Ao vivo</p><h2 className="section-title">Atividade recente</h2></div><span className="live-dot"><i /> Live</span></div>
            <div className="mt-6 space-y-1">
              {activities.map(({ title, detail, time, icon: Icon, tone }) => (
                <div key={`${title}-${time}`} className="activity-row">
                  <div className={`activity-icon ${tone}`}><Icon className="size-4" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{title}</p><p className="truncate text-xs text-muted-foreground">{detail}</p></div>
                  <time className="shrink-0 text-[11px] text-muted-foreground">{time}</time>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel animate-rise delay-4 mt-4 overflow-hidden p-0">
          <div className="px-5 py-5 sm:px-6"><p className="section-label">TikTok Promover</p><h2 className="section-title">Performance dos criativos</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead><tr>{["Criativo (UTM Content)", "Vendas", "Faturamento", "Gasto manual", "CPA", "ROAS", "Status"].map((head) => <th key={head}>{head}</th>)}</tr></thead>
              <tbody>{creatives.map((row) => <tr key={row.name}><td className="font-medium text-foreground">{row.name}</td><td>{row.sales}</td><td>R$ {row.revenue}</td><td>R$ {row.spend}</td><td>R$ {row.cpa}</td><td className="font-semibold text-foreground">{row.roas}x</td><td><span className={`status status-${row.status.toLowerCase().replace("ç", "c")}`}><i />{row.status}</span></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, icon: Icon, value, detail, badge, delay }: { label: string; icon: typeof BadgeDollarSign; value: string; detail: string; badge: string; delay: string }) {
  return <article className={`metric-card animate-rise ${delay}`}><div className="metric-head"><span>{label}</span><span className="metric-icon"><Icon className="size-4" /></span></div><div className="mt-4"><strong className="metric-value">{value}</strong><div className="mt-2 flex items-center justify-between gap-2"><p className="metric-detail">{detail}</p><span className="trend"><ArrowUpRight className="size-3" />{badge}</span></div></div></article>;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><p className="text-xs text-muted-foreground">{label}</p><strong className="text-sm">{currency(payload[0]?.value ?? 0)}</strong></div>;
}
