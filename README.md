# Neon Insights

Quero recriar o front-end de um Dashboard de Métricas de Performance e Vendas de Marketing no estilo Dark Mode moderno e premium (inspirado no Sharkbot / SaaS analytics modernos).

### Design System e Estilo Visual:

- Tema: Dark Mode nativo (fundo escuro #0B0E14, cards em #151921 com bordas finas sutis #222735).

- Cores de destaque: Azul neon (#3B82F6), verde para métricas positivas (#10B981) e acentos elegantes.

- Tipografia limpa e moderna (inter ou similar), números grandes e bem destacados.

- Cantos arredondados nos cards (border-radius suave, cerca de 12px a 16px).

### Componentes e Layout da Tela:

1. Header / Barra Superior:

   - Título do Painel com filtro de período no canto direito (Hoje, Ontem, 7 dias, 30 dias, Total).

2. Cards Superiores de Métricas (Grid 2x2 ou 4 colunas):

   - Card 1: Vendas Aprovadas (Destaque para o valor em R\(, badge com ícone\) e mini indicador de tendência).

   - Card 2: Taxa de Conversão (Gráfico semicircular/gauge do percentual de pagamentos).

   - Card 3: Total Starts / Leads (Número total de conversas iniciadas e barras verticais de volume).

   - Card 4: Ticket Médio (Valor em R$ e contagem total de PIX pagos).

3. Seção Principal (Lado Direito ou Destaque Central):

   - Gráfico de Desempenho / Receita: Gráfico de linha suave (area chart com gradiente azul neon brilhante na parte inferior) mostrando a evolução do faturamento nos últimos 7 dias.

4. Seção Inferior:

   - Log de Atividades em Tempo Real: Feed vertical estilo 'Recent Activity' mostrando entradas como "Novo Lead", "Venda Aprovada" com ícones e timestamp (ex: "há 1 min").

   - Tabela de Criativos (TikTok Promover): Tabela listando Criativo (UTM Content), Vendas, Faturamento, Gasto Manual, CPA, ROAS e uma tag visual de status (🟢 Bom, 🟡 Atenção, 🔴 Ruim).

A interface deve ser totalmente responsiva, limpa e com animações/transições suaves ao carregar os dados.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1e03fdde-26af-5d0e-8f41-c73015a04782).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
