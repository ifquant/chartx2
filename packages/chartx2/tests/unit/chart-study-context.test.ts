import { describe, expect, it } from "vitest";

import {
  resolveStudyDisplayData,
  syncStudyContextData,
} from "../../src/lib/internal/views/chart-study-context";

describe("chart study context use-case", () => {
  it("merges chart-context series studies onto a price-based axis", () => {
    const state = {
      studyKind: "series" as const,
      inputContext: {
        mode: "chart-context" as const,
        symbol: null,
        resolution: null,
        session: null,
        timezone: null,
        mergePolicy: "carry-forward" as const,
      },
      inputData: [{ time: 2, open: 20, high: 22, low: 18, close: 21 }],
      data: [],
    };
    const calls: string[] = [];

    const resolved = resolveStudyDisplayData(state, {
      contextBarSequence: {
        kind: "price-based",
        bars: [{ time: 1, open: 10, high: 11, low: 9, close: 10 }],
      },
      mergeToChartContext: (inputData, mergePolicy) => {
        calls.push(`merge:${mergePolicy}:${inputData.length}`);
        return [{ time: 1, open: 20, high: 22, low: 18, close: 21 }];
      },
    });

    expect(resolved).toEqual([{ time: 1, open: 20, high: 22, low: 18, close: 21 }]);
    expect(calls).toEqual(["merge:carry-forward:1"]);
  });

  it("builds moving-average studies from main chart bars when using chart-context mode", () => {
    const state = {
      studyKind: "indicator" as const,
      inputContext: {
        mode: "chart-context" as const,
        symbol: null,
        resolution: null,
        session: null,
        timezone: null,
        mergePolicy: "carry-forward" as const,
      },
      indicator: { kind: "moving-average" as const, length: 2 },
      inputData: [],
      data: [],
    };

    const resolved = resolveStudyDisplayData(state, {
      contextBarSequence: {
        kind: "time-based",
        bars: [
          { time: 1, open: 10, high: 10, low: 10, close: 10 },
          { time: 2, open: 20, high: 20, low: 20, close: 20 },
          { time: 3, open: 30, high: 30, low: 30, close: 30 },
        ],
      },
      mergeToChartContext: () => {
        throw new Error("should not merge requested context for chart-context moving-average");
      },
    });

    expect(resolved).toEqual([
      { time: 2, open: 15, high: 15, low: 15, close: 15 },
      { time: 3, open: 25, high: 25, low: 25, close: 25 },
    ]);
  });

  it("syncs requested-context compare studies through the shared resolver", () => {
    const states = [
      {
        studyKind: "compare" as const,
        inputContext: {
          mode: "requested-context" as const,
          symbol: "ES1!",
          resolution: "5",
          session: "regular",
          timezone: "UTC",
          mergePolicy: "exact" as const,
        },
        inputData: [{ time: 5, open: 50, high: 55, low: 45, close: 52 }],
        data: [],
      },
    ];

    syncStudyContextData(states, {
      resolveDisplayData: (state) => {
        expect(state.inputContext.symbol).toBe("ES1!");
        return [{ time: 6, open: 60, high: 65, low: 55, close: 62 }];
      },
    });

    expect(states[0]?.data).toEqual([{ time: 6, open: 60, high: 65, low: 55, close: 62 }]);
  });
});
