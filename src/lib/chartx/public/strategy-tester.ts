export type StrategyTesterPanelStatus = "loading" | "ready" | "empty" | "error";
export type StrategyTesterTabId = string;
export type StrategyTesterTradeSide = "long" | "short";

export interface StrategyTesterSummaryMetric {
  id: string;
  label: string;
  valueLabel: string;
  detailLabel?: string;
  tone?: "positive" | "negative" | "neutral";
}

export interface StrategyTesterTabModel {
  id: StrategyTesterTabId;
  label: string;
  badgeLabel?: string;
  disabled?: boolean;
}

export interface StrategyTesterTradeRow {
  id: string;
  side: StrategyTesterTradeSide;
  symbolLabel?: string;
  entryTimeLabel: string;
  exitTimeLabel: string;
  entryPriceLabel?: string;
  exitPriceLabel?: string;
  quantityLabel?: string;
  durationLabel?: string;
  pnlLabel: string;
  statusLabel?: string;
}

export interface StrategyTesterEquityPoint {
  id: string;
  timeLabel: string;
  equityLabel: string;
  value: number;
  benchmarkValue?: number;
  drawdownLabel?: string;
  tradeId?: string;
  active?: boolean;
}

export interface StrategyTesterPanelStateModel {
  status: StrategyTesterPanelStatus;
  activeTabId: StrategyTesterTabId;
  statusLabel?: string;
  emptyLabel?: string;
  errorLabel?: string;
}

export interface StrategyTesterPanelModel {
  title: string;
  runLabel?: string;
  summaryMetrics: readonly StrategyTesterSummaryMetric[];
  tabs: readonly StrategyTesterTabModel[];
  trades: readonly StrategyTesterTradeRow[];
  equityCurve: readonly StrategyTesterEquityPoint[];
  state: StrategyTesterPanelStateModel;
}
