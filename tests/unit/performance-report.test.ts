import { describe, expect, it } from "vitest";

import {
  createPerformanceReportModel,
  createSampleStrategyRun,
  createTradeLocationIntent,
  PerformanceDatasetRegistry,
  PerformanceMetricEngine,
} from "../../src/lib/chartx/internal/performance";

describe("performance report model", () => {
  it("builds closed-trade equity from one strategy run", () => {
    const run = createSampleStrategyRun();
    const registry = new PerformanceDatasetRegistry(run);
    const equity = registry.getEquitySeries({
      runId: run.id,
      scope: run.scope,
      side: "all",
      basis: "closed-trade",
      normalization: "absolute",
      xDomain: "trade-index",
    });

    expect(equity.points).toHaveLength(run.closedTrades.length);
    expect(equity.points[0]).toMatchObject({
      tradeIndex: 1,
      tradeId: "T-001",
      equity: 100_420,
      netPnl: 420,
    });
    expect(equity.points.at(-1)?.equity).toBe(103_510);
  });

  it("keeps P&L distribution counts equal to the closed trade count", () => {
    const run = createSampleStrategyRun();
    const registry = new PerformanceDatasetRegistry(run);
    const distribution = registry.getDistribution({
      runId: run.id,
      field: "trade-net-pnl",
      bins: 8,
      side: "all",
    });

    expect(distribution.bins.reduce((count, bin) => count + bin.count, 0)).toBe(
      run.closedTrades.length,
    );
  });

  it("classifies win loss and breakeven trades deterministically", () => {
    const run = createSampleStrategyRun();
    const registry = new PerformanceDatasetRegistry(run);
    const breakdown = registry.getBreakdown({
      runId: run.id,
      kind: "win-loss-breakeven",
    });

    expect(breakdown.slices.map((slice) => [slice.key, slice.count])).toEqual([
      ["win", 11],
      ["loss", 7],
      ["breakeven", 0],
    ]);
  });

  it("computes first-slice metrics from the strategy run", () => {
    const run = createSampleStrategyRun();
    const engine = new PerformanceMetricEngine(run);

    expect(engine.getMetric("netProfit")).toBe(3510);
    expect(engine.getMetric("totalTrades")).toBe(18);
    expect(engine.getMetric("winRate")).toBeCloseTo(61.111, 3);
    expect(engine.getMetric("avgTrade")).toBe(195);
    expect(engine.getMetric("maxDrawdown")).toBe(-540);
  });

  it("snapshots selected trade state and restores it", () => {
    const run = createSampleStrategyRun();
    const report = createPerformanceReportModel(run, "perf-test");
    report.selectTrade("T-006");
    const snapshot = report.snapshot();

    const restored = createPerformanceReportModel(run, "perf-test");
    restored.restoreSnapshot(snapshot);

    expect(restored.snapshot()).toEqual(snapshot);
    expect(restored.getSelectedTrade()?.id).toBe("T-006");
  });

  it("creates a deterministic trade location intent without mutating the market chart", () => {
    const run = createSampleStrategyRun();
    const trade = run.closedTrades[4]!;
    const intent = createTradeLocationIntent(trade, "performance-report-demo");

    expect(intent).toEqual({
      kind: "locate-trade",
      tradeId: "T-005",
      symbol: "NDX",
      entryTime: trade.entryTime,
      exitTime: trade.exitTime,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      side: trade.side,
      quantity: trade.qty,
      realizedPnl: trade.netPnl,
      sourceChartId: "performance-report-demo",
    });
  });
});
