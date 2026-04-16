import { PerformanceDatasetRegistry } from "./dataset-registry";
import { PerformanceMetricEngine } from "./metric-engine";
import { createTradeLocationIntent } from "./trade-location";
import type {
  ClosedTrade,
  MetricCardModel,
  PerformanceReportSnapshot,
  PerformanceReportView,
  SideSlice,
  StrategyRunModel,
  TradeLocationIntent,
} from "./types";

const DEFAULT_SECTION_ID = "overview";

function formatMetricValue(value: number | string): number | string {
  if (typeof value === "string") {
    return value;
  }
  return Number(value.toFixed(2));
}

export class PerformanceReportModel {
  readonly datasetRegistry: PerformanceDatasetRegistry;
  readonly metricEngine: PerformanceMetricEngine;

  private selectedSectionId = DEFAULT_SECTION_ID;
  private selectedTradeId: string | null = null;
  private filters: PerformanceReportSnapshot["filters"] = { side: "all" };
  private hiddenVisuals: string[] = [];
  private chartStates: Record<string, unknown> = {};

  constructor(readonly run: StrategyRunModel, readonly sourceChartId = "performance-report") {
    this.datasetRegistry = new PerformanceDatasetRegistry(run);
    this.metricEngine = new PerformanceMetricEngine(run);
    this.selectedTradeId = run.closedTrades[0]?.id ?? null;
  }

  selectTrade(tradeId: string | null): void {
    if (tradeId === null) {
      this.selectedTradeId = null;
      return;
    }
    if (this.run.closedTrades.some((trade) => trade.id === tradeId)) {
      this.selectedTradeId = tradeId;
    }
  }

  getSelectedTrade(): ClosedTrade | null {
    return this.run.closedTrades.find((trade) => trade.id === this.selectedTradeId) ?? null;
  }

  getSelectedTradeIntent(): TradeLocationIntent | null {
    const selected = this.getSelectedTrade();
    return selected === null ? null : createTradeLocationIntent(selected, this.sourceChartId);
  }

  setSideFilter(side: SideSlice): void {
    this.filters = { ...this.filters, side };
  }

  snapshot(): PerformanceReportSnapshot {
    return {
      selectedSectionId: this.selectedSectionId,
      selectedTradeId: this.selectedTradeId,
      filters: { ...this.filters },
      hiddenVisuals: [...this.hiddenVisuals],
      chartStates: { ...this.chartStates },
    };
  }

  restoreSnapshot(snapshot: PerformanceReportSnapshot): void {
    this.selectedSectionId = snapshot.selectedSectionId;
    this.selectedTradeId = snapshot.selectedTradeId;
    this.filters = { ...snapshot.filters };
    this.hiddenVisuals = [...snapshot.hiddenVisuals];
    this.chartStates = { ...snapshot.chartStates };
  }

  view(): PerformanceReportView {
    const side = this.filters.side;
    const metrics: MetricCardModel[] = [
      {
        id: "net-profit",
        metricKey: "netProfit",
        label: "Net profit",
        unit: "currency",
        value: formatMetricValue(this.metricEngine.getMetric("netProfit", side)),
      },
      {
        id: "total-trades",
        metricKey: "totalTrades",
        label: "Trades",
        unit: "count",
        value: formatMetricValue(this.metricEngine.getMetric("totalTrades", side)),
      },
      {
        id: "win-rate",
        metricKey: "winRate",
        label: "Win rate",
        unit: "percent",
        value: formatMetricValue(this.metricEngine.getMetric("winRate", side)),
      },
      {
        id: "avg-trade",
        metricKey: "avgTrade",
        label: "Avg trade",
        unit: "currency",
        value: formatMetricValue(this.metricEngine.getMetric("avgTrade", side)),
      },
      {
        id: "max-drawdown",
        metricKey: "maxDrawdown",
        label: "Max drawdown",
        unit: "currency",
        value: formatMetricValue(this.metricEngine.getMetric("maxDrawdown", side)),
      },
    ];

    return {
      id: "performance-report",
      title: this.run.name,
      summary: "Closed-trade performance report derived from one strategy run.",
      metrics,
      equity: this.datasetRegistry.getEquitySeries({
        runId: this.run.id,
        scope: this.run.scope,
        side,
        basis: "closed-trade",
        normalization: "absolute",
        xDomain: "trade-index",
      }),
      pnlDistribution: this.datasetRegistry.getDistribution({
        runId: this.run.id,
        field: "trade-net-pnl",
        bins: 8,
        side,
      }),
      winLossBreakdown: this.datasetRegistry.getBreakdown({
        runId: this.run.id,
        kind: "win-loss-breakeven",
      }),
      tradeRows: this.datasetRegistry.getTradeRows(side),
      selectedTrade: this.getSelectedTrade(),
      selectedTradeIntent: this.getSelectedTradeIntent(),
    };
  }
}

export function createPerformanceReportModel(
  run: StrategyRunModel,
  sourceChartId?: string,
): PerformanceReportModel {
  return new PerformanceReportModel(run, sourceChartId);
}
