# Performance Chart Architecture

Date: 2026-04-16

This document defines the separate performance analytics chart line for `chartx2`. It intentionally keeps strategy/trading performance reports outside the technical-analysis main-series model.

## Core Decision

Performance charts are not technical-chart studies.

Technical analysis charts are organized around market series:

- symbol
- OHLCV bars
- chart-context bar sequence
- panes, price scales, indicators, drawings
- main-series chart type

Performance analytics are organized around strategy/trading results:

- strategy run
- orders and fills
- closed trades
- equity snapshots
- benchmarks
- metrics
- report sections

The two domains may share lower-level rendering primitives such as axes, scales, layout, tooltips, hit-testing, line/area/bar/histogram/donut/table renderers, and selection plumbing. They should not share the same domain model.

## External Product Signals

The research input points in one consistent direction:

- TradingView exposes performance analytics as a Strategy Report with overview, performance, trades analysis, risk-performance ratios, and trade list sections.
- TradingView equity charts are based on strategy results such as closed-trade PnL, buy-and-hold benchmarks, and MFE/MAE excursion context.
- MultiCharts exposes performance analytics as richer Strategy / Trading / Portfolio reports with many performance measures, run-up/drawdown analysis, trade-series analysis, equity variants, and interactive graphs.
- MultiCharts-style detailed equity charts can use trade number as the x-axis, which confirms that performance charts cannot assume a time-only horizontal axis.

These are design inputs, not an exact compatibility target. The internal conclusion is stable: the core object is `StrategyRunModel`, not `MainSeriesSource`.

## Target Layering

```text
Rendering Kernel
├─ generic axes / scales / layout / tooltip / hit-test
├─ line / area / bar / histogram / donut / fan / table primitives
├─ Market Domain
│  └─ ChartModel / PaneModel / PriceScaleModel / SourceModel / MainSeriesSource
└─ Performance Domain
   └─ StrategyRunModel / DatasetRegistry / MetricEngine / ReportModel
```

The market domain continues to specialize in time-price charts. The performance domain specializes in reports, metrics, distributions, and trade-result visualization.

## Strategy Run Truth Source

```ts
export type PerformanceScope = "strategy" | "trading" | "portfolio";
export type SideSlice = "all" | "long" | "short";

export type OrderSide = "buy" | "sell";
export type TradeSide = "long" | "short";

export interface StrategyRunModel {
  id: string;
  scope: PerformanceScope;
  strategyId: string;
  name: string;
  initialCapital: number;
  accountCurrency: string;
  assumptions: {
    commissionModelId?: string;
    slippageModelId?: string;
    marginModelId?: string;
    positionSizingModelId?: string;
  };
  period: {
    from: number;
    to: number;
  };
  orders: readonly OrderEvent[];
  fills: readonly FillEvent[];
  closedTrades: readonly ClosedTrade[];
  equitySnapshots: readonly EquitySnapshot[];
  benchmarks: readonly BenchmarkSeries[];
}

export interface OrderEvent {
  id: string;
  time: number;
  symbol: string;
  side: OrderSide;
  type: "market" | "limit" | "stop" | "stop-limit";
  qty: number;
}

export interface FillEvent {
  id: string;
  orderId: string;
  time: number;
  symbol: string;
  side: OrderSide;
  qty: number;
  price: number;
  commission?: number;
  slippage?: number;
}

export interface ClosedTrade {
  id: string;
  tradeIndex: number;
  symbol: string;
  side: TradeSide;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  grossPnl: number;
  netPnl: number;
  commission: number;
  barsHeld: number;
  mfe?: number;
  mae?: number;
  runup?: number;
  drawdown?: number;
}

export type EquityBasis =
  | "closed-trade"
  | "mark-to-market"
  | "close-to-close"
  | "benchmark";

export interface EquitySnapshot {
  time: number;
  tradeIndex?: number;
  barIndex?: number;
  basis: EquityBasis;
  equity: number;
  openPnl?: number;
  realizedPnl?: number;
  drawdown?: number;
  runup?: number;
  marginUsed?: number;
}

export interface BenchmarkSeries {
  id: string;
  kind: "buy-hold" | "index" | "custom-strategy";
  points: readonly Array<{
    time: number;
    value: number;
    tradeIndex?: number;
  }>;
}
```

This is the source of truth. Chart-ready datasets and metric cards are derived from it, not the other way around.

## Generic Analytics Axes

Performance charts need x domains that technical charts do not:

```ts
export type XDomainKind =
  | "time"
  | "trade-index"
  | "bar-index"
  | "bucket"
  | "category"
  | "simulation";

export type MeasureUnit =
  | "currency"
  | "percent"
  | "count"
  | "bars"
  | "duration"
  | "ratio"
  | "index";

export interface AxisModel {
  id: string;
  domainKind: XDomainKind;
  label?: string;
}

export interface NumericScaleModel {
  id: string;
  unit: MeasureUnit;
  autoRange: boolean;
  manualRange?: { min: number; max: number };
  inverted?: boolean;
}
```

Do not force performance charts through the current technical `TimeScale` / `PriceScale` model. The rendering kernel can eventually provide a generic scale layer that both domains specialize.

## Dataset Registry

Chart datasets and report metrics must stay separate. A report card can use a different accounting basis than an equity chart.

```ts
export type NormalizationMode = "absolute" | "percent" | "indexed" | "vami";
export type DrawdownMode =
  | "absolute"
  | "relative"
  | "underwater"
  | "intrabar"
  | "close-to-close";

export interface PerformanceDatasetRegistry {
  getEquitySeries(spec: EquitySeriesSpec): EquitySeries;
  getDrawdownSeries(spec: DrawdownSeriesSpec): DrawdownSeries;
  getExcursionSeries(spec: ExcursionSeriesSpec): ExcursionSeries;
  getDistribution(spec: DistributionSpec): DistributionDataset;
  getBreakdown(spec: BreakdownSpec): BreakdownDataset;
  getMonteCarlo(spec: MonteCarloSpec): MonteCarloDataset;
}

export interface EquitySeriesSpec {
  runId: string;
  scope: PerformanceScope;
  side: SideSlice;
  basis: EquityBasis;
  normalization: NormalizationMode;
  xDomain: "time" | "trade-index" | "bar-index";
  benchmarkId?: string;
}

export interface DrawdownSeriesSpec {
  runId: string;
  inputEquity: EquitySeriesSpec;
  mode: DrawdownMode;
}

export interface ExcursionSeriesSpec {
  runId: string;
  side: SideSlice;
  xDomain: "time" | "trade-index";
  valueMode: "currency" | "percent";
}

export interface DistributionSpec {
  runId: string;
  field:
    | "trade-net-pnl"
    | "trade-gross-pnl"
    | "bars-held"
    | "mfe"
    | "mae"
    | "runup"
    | "drawdown";
  bins: number;
  side: SideSlice;
}

export interface BreakdownSpec {
  runId: string;
  kind:
    | "profit-structure"
    | "win-loss-breakeven"
    | "long-short"
    | "fees-vs-gross";
}

export interface MonteCarloSpec {
  runId: string;
  iterations: number;
  method: "shuffle-trades" | "bootstrap-trades";
  normalization: NormalizationMode;
}
```

Dataset output types should be concrete once the first renderer slice lands. At this architecture level, their responsibility is clear: they are renderable derived datasets.

## Metric Engine

Metrics power cards and tables. They should not be back-calculated from whichever chart happens to be visible.

```ts
export interface PerformanceMetricEngine {
  getMetric(runId: string, metricKey: PerformanceMetricKey, side?: SideSlice): number | string;
}

export type PerformanceMetricKey =
  | "netProfit"
  | "openPnl"
  | "grossProfit"
  | "grossLoss"
  | "totalTrades"
  | "winRate"
  | "avgTrade"
  | "avgWin"
  | "avgLoss"
  | "maxDrawdown"
  | "maxRunup"
  | "sharpe"
  | "sortino"
  | "cagr"
  | "marginCalls"
  | "maxMarginUsed"
  | "buyHoldReturn"
  | "strategyOutperformance";
```

## Performance View Models

```ts
export type PerformanceVisualKind =
  | "equity-line"
  | "benchmark-line"
  | "excursion-whiskers"
  | "underwater-area"
  | "distribution-histogram"
  | "breakdown-bar"
  | "range-compare"
  | "donut"
  | "fan-chart"
  | "table";

export interface PerformanceChartModel {
  id: string;
  title: string;
  xAxis?: AxisModel;
  yAxis?: NumericScaleModel;
  visuals: readonly PerformanceVisualKind[];
  datasetRefs: readonly string[];
  tooltipSpec?: TooltipSpec;
  legendSpec?: LegendSpec;
}

export interface TooltipSpec {
  showTradeIndex?: boolean;
  showTime?: boolean;
  showEquity?: boolean;
  showBenchmark?: boolean;
  showMFE?: boolean;
  showMAE?: boolean;
}

export interface LegendSpec {
  items: readonly Array<{
    key: string;
    label: string;
    visible: boolean;
  }>;
}
```

## Report Model

Performance analytics should be a report, not a single chart.

```ts
export interface MetricCardModel {
  id: string;
  metricKey: PerformanceMetricKey;
  label: string;
  unit: MeasureUnit;
  value: number | string;
}

export interface TradeListTableModel {
  columns: readonly string[];
  rows: readonly Array<Record<string, string | number>>;
}

export interface ReportSectionModel {
  id: string;
  title: string;
  cards: readonly MetricCardModel[];
  charts: readonly PerformanceChartModel[];
  tables: readonly TradeListTableModel[];
}

export interface PerformanceReportModel {
  id: string;
  runId: string;
  sections: readonly ReportSectionModel[];
  filters: {
    side: SideSlice;
    symbols?: readonly string[];
    dateRange?: { from: number; to: number };
  };
  snapshot(): PerformanceReportSnapshot;
}

export interface PerformanceReportSnapshot {
  selectedSectionId: string;
  filters: PerformanceReportModel["filters"];
  hiddenVisuals: readonly string[];
  chartStates: Record<string, unknown>;
}
```

Initial sections:

- `Overview`
- `Performance`
- `TradesAnalysis`
- `Risk`
- `Robustness`
- `TradeList`

## Technical Chart Linking

The shared object between performance charts and technical charts is a trade location intent.

```ts
export interface TradeLocationIntent {
  kind: "trade-location";
  tradeId: string;
  symbol: string;
  entryTime: number;
  exitTime: number;
  entryPrice?: number;
  exitPrice?: number;
  side: TradeSide;
  quantity?: number;
  realizedPnl?: number;
  sourceChartId?: string;
}
```

Performance charts emit this intent when the user selects a trade, a drawdown segment, a histogram bucket, or a row in the trade list. Technical charts receive the intent and decide how to locate it:

- ensure the symbol/context
- fit the visible range to `entryTime -> exitTime`
- add temporary trade annotations
- optionally highlight entry/exit markers and entry-to-exit segment

Do not let the performance chart directly mutate the technical chart. Use a `ChartLinkController` or equivalent routing boundary.

```text
PerformanceChart
└─ select trade / segment / bucket
   └─ emits TradeLocationIntent

ChartLinkController
└─ routes intent

TechnicalChart
└─ locateTrade(intent)
   ├─ ensure symbol/context
   ├─ fit time range
   └─ render temporary trade annotations
```

This keeps the coupling explicit and testable.

## Implementation Phases

### Phase 1: TradingView-Level Core

Build enough to make a useful report:

- closed-trade equity line
- buy-and-hold benchmark line
- trade excursion whiskers
- profit-structure bar
- PnL distribution histogram
- win/loss/breakeven donut
- trade list table
- trade selection -> `TradeLocationIntent`

### Phase 2: Equity / Drawdown Variants

Add richer MultiCharts-style equity analysis:

- close-to-close equity
- absolute and relative drawdown
- underwater chart
- VAMI normalization
- strategy / trading / portfolio scopes

### Phase 3: Robustness / Research Tools

Add heavier analysis:

- Monte Carlo fan chart
- trade-series analysis extensions
- portfolio compare
- benchmark compare
- robustness sections

## Near-Term Work Items

1. Add `packages/chartx2/src/lib/internal/performance/` as a separate model namespace.
2. Add `StrategyRunModel` and sample fixture data for one strategy run.
3. Add `PerformanceDatasetRegistry` with closed-trade equity and PnL distribution first.
4. Add `PerformanceReportModel` with `Overview`, `TradesAnalysis`, and `TradeList` sections.
5. Add a workbench/demo tab for the first performance report.
6. Emit `TradeLocationIntent` from trade selection but do not wire technical-chart navigation until the intent contract is covered by tests.

## Explicit Non-Goals For The First Slice

- No Monte Carlo.
- No portfolio optimization.
- No execution blotter replacement.
- No direct reuse of technical `MainSeriesSource`.
- No assumption that performance x-axis is always time.
- No mutation of technical charts directly from performance charts.
