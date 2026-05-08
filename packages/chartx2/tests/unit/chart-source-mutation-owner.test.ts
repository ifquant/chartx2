import { describe, expect, it, vi } from "vitest";

import { createChartSourceMutationOwner } from "../../src/lib/internal/views/chart-source-mutation-owner";

describe("chart source mutation owner", () => {
  it("groups primary source mutation callbacks", () => {
    const calls: string[] = [];
    const mainSource = {
      inputData: [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
      data: [] as unknown[],
      visuals: new Map<number, { color?: string; isUp: boolean }>(),
      builder: "time-bars" as const,
      lineBreakOptions: { lineCount: 3 },
      renkoOptions: { boxSize: null, boxSizeMode: "auto" as const },
      pointFigureOptions: {
        boxSize: null,
        boxSizeMode: "fixed" as const,
        boxSizeScale: 1,
        reversalBoxes: 3,
        atrLength: 14,
        percentageValue: 1,
      },
      kagiOptions: {
        reversalMode: "auto" as const,
        reversalSize: null,
        reversalScale: 1,
        atrLength: 14,
        percentageValue: 1,
      },
    };
    const owner = createOwner(calls);

    owner.primaryMutations.rebuild(mainSource);
    owner.primaryMutations.syncContext(mainSource);
    owner.primaryMutations.resetViewport();
    owner.primaryMutations.clearPriceRangeOverride();
    owner.primaryMutations.render();

    expect(mainSource.data).toEqual([{ time: 1, open: 9, high: 11, low: 8, close: 10 }]);
    expect(calls).toEqual([
      "sync-main",
      "reset-viewport",
      "clear-primary-price-range",
      "render",
    ]);
  });

  it("groups secondary mutation and histogram transform callbacks", () => {
    const calls: string[] = [];
    const studySource = {
      inputData: [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
    };
    const owner = createOwner(calls);

    expect(owner.secondaryMutations.resolveDisplayData(studySource)).toEqual([
      { time: 1, open: 9, high: 11, low: 8, close: 10, resolved: true },
    ]);
    expect(owner.secondaryMutations.updateCanonical(
      [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
      { time: 2, open: 10, high: 12, low: 9, close: 11 },
    )).toEqual([
      { time: 1, open: 9, high: 11, low: 8, close: 10 },
      { time: 2, open: 10, high: 12, low: 9, close: 11 },
    ]);
    expect(owner.secondaryMutations.normalizeHistogramData([
      { time: 3, value: 12, color: "#10b981", up: true },
    ])).toEqual([{ time: 3, open: 0, high: 12, low: 0, close: 12 }]);
    expect(owner.secondaryMutations.buildHistogramVisuals([
      { time: 3, value: 12, color: "#10b981", up: true },
    ]).get(3)).toEqual({ color: "#10b981", isUp: true });
    owner.secondarySeriesApiRuntime.resetViewport();
    owner.secondarySeriesApiRuntime.render();

    expect(calls).toEqual(["resolve-study", "reset-viewport", "render"]);
  });
});

function createOwner(calls: string[]) {
  return createChartSourceMutationOwner({
    syncMainSource: () => calls.push("sync-main"),
    resolveStudyDisplayData: (source) => {
      calls.push("resolve-study");
      return source.inputData.map((row) => ({ ...row, resolved: true }));
    },
    resetViewport: () => calls.push("reset-viewport"),
    clearPrimaryPriceRangeOverride: () => calls.push("clear-primary-price-range"),
    render: () => calls.push("render"),
  });
}
