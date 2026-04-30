import type { TradeLocationIntent } from "./performance";

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

export interface StrategyTesterFilterOption {
  id: string;
  label: string;
  badgeLabel?: string;
  tradeIds?: readonly string[];
  disabled?: boolean;
}

export interface StrategyTesterRunMetric {
  id: string;
  label: string;
  valueLabel: string;
}

export interface StrategyTesterParameterFieldOption {
  value: string;
  label: string;
}

export interface StrategyTesterParameterField {
  id: string;
  label: string;
  value: string;
  kind: "number" | "select";
  step?: number;
  suffixLabel?: string;
  options?: readonly StrategyTesterParameterFieldOption[];
}

export interface StrategyTesterRunOption {
  id: string;
  label: string;
  badgeLabel?: string;
  runLabel?: string;
  runMetrics?: readonly StrategyTesterRunMetric[];
  parameterFields?: readonly StrategyTesterParameterField[];
  summaryMetrics: readonly StrategyTesterSummaryMetric[];
  filterOptions?: readonly StrategyTesterFilterOption[];
  activeFilterId?: string;
  trades: readonly StrategyTesterTradeRow[];
  tradeDetails?: readonly StrategyTesterTradeDetail[];
  equityCurve: readonly StrategyTesterEquityPoint[];
}

export interface StrategyTesterTradeDetailField {
  id: string;
  label: string;
  valueLabel: string;
}

export interface StrategyTesterTradeDetail {
  tradeId: string;
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  fields: readonly StrategyTesterTradeDetailField[];
  locateIntent?: TradeLocationIntent;
  locateLabel?: string;
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
  runMetrics?: readonly StrategyTesterRunMetric[];
  runOptions?: readonly StrategyTesterRunOption[];
  activeRunOptionId?: string;
  summaryMetrics: readonly StrategyTesterSummaryMetric[];
  tabs: readonly StrategyTesterTabModel[];
  filterOptions?: readonly StrategyTesterFilterOption[];
  activeFilterId?: string;
  trades: readonly StrategyTesterTradeRow[];
  tradeDetails?: readonly StrategyTesterTradeDetail[];
  equityCurve: readonly StrategyTesterEquityPoint[];
  state: StrategyTesterPanelStateModel;
}
