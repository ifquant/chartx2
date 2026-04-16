import type { ClosedTrade, PerformanceMetricKey, SideSlice, StrategyRunModel } from "./types";

function filterTrades(trades: readonly ClosedTrade[], side: SideSlice): ClosedTrade[] {
  if (side === "all") {
    return [...trades];
  }
  return trades.filter((trade) => trade.side === side);
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export class PerformanceMetricEngine {
  constructor(private readonly run: StrategyRunModel) {}

  getMetric(metricKey: PerformanceMetricKey, side: SideSlice = "all"): number | string {
    const trades = filterTrades(this.run.closedTrades, side);
    switch (metricKey) {
      case "netProfit":
        return sum(trades.map((trade) => trade.netPnl));
      case "grossProfit":
        return sum(trades.filter((trade) => trade.netPnl > 0).map((trade) => trade.grossPnl));
      case "grossLoss":
        return sum(trades.filter((trade) => trade.netPnl < 0).map((trade) => trade.grossPnl));
      case "totalTrades":
        return trades.length;
      case "winRate":
        return trades.length === 0
          ? 0
          : (trades.filter((trade) => trade.netPnl > 0).length / trades.length) * 100;
      case "avgTrade":
        return trades.length === 0 ? 0 : sum(trades.map((trade) => trade.netPnl)) / trades.length;
      case "avgWin": {
        const wins = trades.filter((trade) => trade.netPnl > 0);
        return wins.length === 0 ? 0 : sum(wins.map((trade) => trade.netPnl)) / wins.length;
      }
      case "avgLoss": {
        const losses = trades.filter((trade) => trade.netPnl < 0);
        return losses.length === 0 ? 0 : sum(losses.map((trade) => trade.netPnl)) / losses.length;
      }
      case "maxDrawdown": {
        if (this.run.equitySnapshots.length === 0) {
          return "unsupported";
        }
        return Math.min(...this.run.equitySnapshots.map((point) => point.drawdown ?? 0));
      }
      case "maxRunup": {
        if (this.run.equitySnapshots.length === 0) {
          return "unsupported";
        }
        return Math.max(...this.run.equitySnapshots.map((point) => point.runup ?? 0));
      }
      case "openPnl":
      case "sharpe":
      case "sortino":
      case "cagr":
      case "marginCalls":
      case "maxMarginUsed":
      case "buyHoldReturn":
      case "strategyOutperformance":
        return "unsupported";
      default:
        return "unsupported";
    }
  }
}
