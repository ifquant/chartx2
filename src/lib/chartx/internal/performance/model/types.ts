export type PerformanceScope = "strategy" | "trading" | "portfolio";
export type SideSlice = "all" | "long" | "short";
export type TradeSide = "long" | "short";

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop" | "stop-limit";

export type EquityBasis =
  | "closed-trade"
  | "mark-to-market"
  | "close-to-close"
  | "benchmark";

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

export type NormalizationMode = "absolute" | "percent" | "indexed" | "vami";

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

export type OrderEvent = {
  id: string;
  time: number;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
};

export type FillEvent = {
  id: string;
  orderId: string;
  time: number;
  symbol: string;
  side: OrderSide;
  qty: number;
  price: number;
  commission?: number;
  slippage?: number;
};

export type ClosedTrade = {
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
};

export type EquitySnapshot = {
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
};

export type BenchmarkSeries = {
  id: string;
  kind: "buy-hold" | "index" | "custom-strategy";
  points: Array<{ time: number; value: number; tradeIndex?: number }>;
};

export type StrategyRunModel = {
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
  orders: OrderEvent[];
  fills: FillEvent[];
  closedTrades: ClosedTrade[];
  equitySnapshots: EquitySnapshot[];
  benchmarks: BenchmarkSeries[];
};

export type ParameterValue = number | string | boolean;

export type ParameterAssignment = Record<string, ParameterValue>;

export type OptimizationMetricKey =
  | "netProfit"
  | "objectiveScore"
  | "grossProfit"
  | "grossLoss"
  | "winRate"
  | "avgTrade"
  | "maxDrawdown"
  | "profitFactor"
  | "sharpe"
  | "sortino"
  | "tradeCount"
  | "stabilityScore";

export type StrategyRunSummary = {
  runId: string;
  strategyId: string;
  scope: PerformanceScope;
  params: ParameterAssignment;
  metrics: Partial<Record<OptimizationMetricKey, number>> & {
    oosAgreement?: number;
  };
  period?: {
    from: number;
    to: number;
  };
};

export type ParameterSweepModel = {
  id: string;
  strategyId: string;
  name: string;
  parameterKeys: string[];
  runs: StrategyRunSummary[];
};

export type ThresholdPlane = {
  metric: OptimizationMetricKey;
  value: number;
  label: string;
};

export type RobustnessField = {
  neighborhoodRadius: number;
  scoreByRunId: Record<string, number>;
  range: { min: number; max: number } | null;
};

export type AxisModel = {
  id: string;
  domainKind: XDomainKind;
  label?: string;
};

export type NumericScaleModel = {
  id: string;
  unit: MeasureUnit;
  autoRange: boolean;
  manualRange?: { min: number; max: number };
  inverted?: boolean;
};

export type EquitySeriesSpec = {
  runId: string;
  scope: PerformanceScope;
  side: SideSlice;
  basis: EquityBasis;
  normalization: NormalizationMode;
  xDomain: "time" | "trade-index" | "bar-index";
  benchmarkId?: string;
};

export type EquitySeriesPoint = {
  x: number;
  time: number;
  tradeIndex: number;
  tradeId: string;
  equity: number;
  netPnl: number;
};

export type EquitySeries = {
  spec: EquitySeriesSpec;
  points: EquitySeriesPoint[];
};

export type DistributionSpec = {
  runId: string;
  field: "trade-net-pnl" | "trade-gross-pnl" | "bars-held" | "mfe" | "mae" | "runup" | "drawdown";
  bins: number;
  side: SideSlice;
};

export type DistributionBin = {
  index: number;
  from: number;
  to: number;
  count: number;
};

export type DistributionDataset = {
  spec: DistributionSpec;
  bins: DistributionBin[];
};

export type BreakdownSpec = {
  runId: string;
  kind: "profit-structure" | "win-loss-breakeven" | "long-short" | "fees-vs-gross";
};

export type BreakdownSlice = {
  key: "win" | "loss" | "breakeven" | "long" | "short" | "profit" | "loss-total" | "fees" | "open-pnl";
  label: string;
  count: number;
  value: number;
  color: string;
};

export type BreakdownDataset = {
  spec: BreakdownSpec;
  slices: BreakdownSlice[];
};

export type TradeListRow = {
  tradeId: string;
  tradeIndex: number;
  symbol: string;
  side: TradeSide;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  netPnl: number;
  barsHeld: number;
};

export type MetricCardModel = {
  id: string;
  metricKey: PerformanceMetricKey;
  label: string;
  unit: MeasureUnit;
  value: number | string;
};

export type TradeLocationIntent = {
  kind: "locate-trade";
  tradeId: string;
  symbol: string;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  side: TradeSide;
  quantity: number;
  realizedPnl: number;
  sourceChartId: string;
};

export type RunLocationIntent = {
  kind: "locate-run";
  runId: string;
  strategyId: string;
  params: ParameterAssignment;
  sourceReportId: string;
};

export type ParameterSurfaceSpec = {
  sweepId: string;
  xParam: string;
  yParam: string;
  zMetric: OptimizationMetricKey;
  colorMetric?: "topology" | "robustness";
  filter?: ParameterAssignment;
};

export type ParameterSurfacePoint = {
  runId: string;
  params: ParameterAssignment;
  metrics: Partial<Record<OptimizationMetricKey, number>> & {
    oosAgreement?: number;
  };
  xValue: ParameterValue;
  yValue: ParameterValue;
  zValue: number;
  colorValue?: number;
  robustnessScore?: number;
};

export type ParameterSurfaceDataset = {
  spec: ParameterSurfaceSpec;
  points: ParameterSurfacePoint[];
  xValues: ParameterValue[];
  yValues: ParameterValue[];
  zRange: { min: number; max: number } | null;
  colorRange: { min: number; max: number } | null;
  robustnessField: RobustnessField;
};

export type OptimizationSurfaceView = {
  id: string;
  title: string;
  summary: string;
  dataset: ParameterSurfaceDataset;
  selectedRunId: string | null;
  selectedRunIntent: RunLocationIntent | null;
  renderMode: "heatmap" | "scatter-3d" | "wireframe-3d" | "surface-3d" | "surface-zero-3d";
  thresholdPlane: ThresholdPlane | null;
  camera: {
    yaw: number;
    pitch: number;
  };
};

export type PerformanceReportSnapshot = {
  selectedSectionId: string;
  selectedTradeId: string | null;
  filters: {
    side: SideSlice;
    symbols?: string[];
    dateRange?: { from: number; to: number };
  };
  hiddenVisuals: string[];
  chartStates: Record<string, unknown>;
};

export type PerformanceReportView = {
  id: string;
  title: string;
  summary: string;
  metrics: MetricCardModel[];
  equity: EquitySeries;
  pnlDistribution: DistributionDataset;
  winLossBreakdown: BreakdownDataset;
  tradeRows: TradeListRow[];
  selectedTrade: ClosedTrade | null;
  selectedTradeIntent: TradeLocationIntent | null;
};
