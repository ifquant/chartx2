import { describe, expect, it } from "vitest";

import {
  createRunLocationIntent,
  createSampleParameterSweep,
  createSampleStrategyRunFromSummary,
  OptimizationDatasetRegistry,
} from "../../src/lib/chartx/internal/performance";

describe("performance optimization datasets", () => {
  it("builds a deterministic parameter surface from one sweep", () => {
    const sweep = createSampleParameterSweep();
    const registry = new OptimizationDatasetRegistry(sweep);
    const surface = registry.getParameterSurface({
      sweepId: sweep.id,
      xParam: "fastLength",
      yParam: "threshold",
      zMetric: "netProfit",
      colorMetric: "robustness",
      filter: {
        slowLength: 33,
      },
    });

    expect(surface.points).toHaveLength(45);
    expect(surface.xValues).toEqual([5, 7, 9, 11, 13, 15, 17, 19, 21]);
    expect(surface.yValues).toEqual([0.2, 0.35, 0.5, 0.65, 0.8]);
    expect(surface.zRange).not.toBeNull();
    expect(surface.colorRange).not.toBeNull();
    expect(surface.robustnessField.range).not.toBeNull();
    expect(surface.points[0]).toMatchObject({
      xValue: 5,
      yValue: 0.2,
    });
  });

  it("skips runs missing the requested z metric", () => {
    const sweep = createSampleParameterSweep();
    const targetIndex = sweep.runs.findIndex(
      (run) => run.params.slowLength === 33 && run.params.fastLength === 5 && run.params.threshold === 0.2,
    );
    sweep.runs[targetIndex] = {
      ...sweep.runs[targetIndex]!,
      metrics: {
        ...sweep.runs[targetIndex]!.metrics,
        netProfit: undefined,
      },
    };

    const registry = new OptimizationDatasetRegistry(sweep);
    const surface = registry.getParameterSurface({
      sweepId: sweep.id,
      xParam: "fastLength",
      yParam: "threshold",
      zMetric: "netProfit",
      filter: {
        slowLength: 33,
      },
    });

    expect(surface.points).toHaveLength(44);
  });

  it("creates a deterministic run location intent", () => {
    const sweep = createSampleParameterSweep();
    const run = sweep.runs[3]!;
    const intent = createRunLocationIntent(run, "optimization-report-demo");

    expect(intent).toEqual({
      kind: "locate-run",
      runId: run.runId,
      strategyId: run.strategyId,
      params: { ...run.params },
      sourceReportId: "optimization-report-demo",
    });
  });

  it("materializes a deterministic strategy run from one sweep summary", () => {
    const sweep = createSampleParameterSweep();
    const runSummary = sweep.runs[6]!;
    const run = createSampleStrategyRunFromSummary(runSummary);
    const netProfit = run.closedTrades.reduce((sum, trade) => sum + trade.netPnl, 0);

    expect(run.id).toBe(runSummary.runId);
    expect(run.closedTrades).toHaveLength(Math.round(runSummary.metrics.tradeCount!));
    expect(netProfit).toBe(Math.round(runSummary.metrics.netProfit!));
  });

  it("exposes objective score as a selectable optimization metric", () => {
    const sweep = createSampleParameterSweep();
    const registry = new OptimizationDatasetRegistry(sweep);
    const surface = registry.getParameterSurface({
      sweepId: sweep.id,
      xParam: "fastLength",
      yParam: "slowLength",
      zMetric: "objectiveScore",
      filter: {
        threshold: 0.5,
      },
    });

    expect(surface.points).not.toHaveLength(0);
    expect(surface.zRange).not.toBeNull();
    expect(surface.zRange!.min).toBeGreaterThanOrEqual(0);
    expect(surface.zRange!.max).toBeLessThanOrEqual(1);
  });
});
