import { describe, expect, it } from "vitest";

import {
  replaceMainHistogramLikeData,
  replaceMainSeriesData,
  replaceStudyHistogramLikeData,
  replaceStudySeriesData,
  updateMainHistogramLikeData,
  updateMainSeriesData,
  updateStudyHistogramLikeData,
  updateStudySeriesData,
} from "../../src/lib/internal/views/chart-series-mutation";

describe("chart series mutation use-case", () => {
  it("replaces main-series canonical data, clears visuals, syncs context, and resets viewport", () => {
    const calls: string[] = [];
    const source: {
      inputData: readonly { time: number; close: number }[];
      data: readonly { time: number; close: number }[];
      visuals: Map<number, { color: string; isUp: boolean }>;
    } = {
      inputData: [{ time: 0, close: 1 }],
      data: [],
      visuals: new Map([[0, { color: "#000", isUp: true }]]),
    };

    replaceMainSeriesData(source, [{ time: 1, close: 2 }], {
      rebuild: (nextSource) => {
        calls.push(`rebuild:${nextSource.inputData.length}`);
        nextSource.data = [...nextSource.inputData];
      },
      syncContext: () => calls.push("sync"),
      resetViewport: () => calls.push("reset"),
      render: () => calls.push("render"),
    });

    expect(source.inputData).toEqual([{ time: 1, close: 2 }]);
    expect(source.data).toEqual([{ time: 1, close: 2 }]);
    expect(source.visuals.size).toBe(0);
    expect(calls).toEqual(["rebuild:1", "sync", "reset", "render"]);
  });

  it("updates main-series canonical data and only clears price-range override", () => {
    const calls: string[] = [];
    const source = {
      inputData: [{ time: 1, close: 2 }],
      data: [],
    };

    updateMainSeriesData(source, { time: 2, close: 3 }, {
      updateCanonical: (existing, bar) => [...existing, bar],
      rebuild: (nextSource) => {
        calls.push(`rebuild:${nextSource.inputData.length}`);
      },
      syncContext: () => calls.push("sync"),
      clearPriceRangeOverride: () => calls.push("clear-range"),
      render: () => calls.push("render"),
    });

    expect(source.inputData).toEqual([
      { time: 1, close: 2 },
      { time: 2, close: 3 },
    ]);
    expect(calls).toEqual(["rebuild:2", "sync", "clear-range", "render"]);
  });

  it("replaces study data through display resolution and rejects non-study paths", () => {
    const calls: string[] = [];
    const source = {
      role: "study",
      inputData: [] as readonly { time: number; close: number }[],
      data: [] as readonly { time: number; close: number }[],
      visuals: new Map<number, { color?: string; isUp: boolean }>(),
    };

    replaceStudySeriesData(source, [{ time: 1, close: 2 }], {
      resolveDisplayData: (nextSource) => {
        calls.push(`resolve:${nextSource.inputData.length}`);
        return [{ time: 1, close: 20 }];
      },
      resetViewport: () => calls.push("reset"),
      render: () => calls.push("render"),
    });

    expect(source.inputData).toEqual([{ time: 1, close: 2 }]);
    expect(source.data).toEqual([{ time: 1, close: 20 }]);
    expect(calls).toEqual(["resolve:1", "reset", "render"]);

    expect(() =>
      replaceStudySeriesData(
        { ...source, role: "main-series" },
        [{ time: 2, close: 3 }],
        {
          resolveDisplayData: () => [],
          resetViewport: () => {},
          render: () => {},
        },
      ),
    ).toThrow("chartx phase-one secondary data path expects a study source");
  });

  it("updates histogram-like visuals before delegating to canonical update paths", () => {
    const calls: string[] = [];
    const mainSource = {
      inputData: [{ time: 1, close: 10 }],
      data: [{ time: 1, close: 10 }],
      visuals: new Map<number, { color?: string; isUp: boolean }>([[1, { color: "#111", isUp: true }]]),
    };

    updateMainHistogramLikeData(mainSource, { time: 2, value: 11, color: "#10b981" }, {
      normalizeBar: (bar) => ({ time: bar.time, close: bar.value }),
      updateMainSeriesData: (_source, canonicalBar) => {
        calls.push(`main-update:${canonicalBar.close}`);
      },
    });

    expect(mainSource.visuals.get(2)).toEqual({ color: "#10b981", isUp: true });
    expect(calls).toEqual(["main-update:11"]);

    const studySource: {
      role: "study";
      inputData: readonly { time: number; close: number }[];
      data: readonly { time: number; close: number }[];
      visuals: Map<number, { color: string; isUp: boolean }>;
    } = {
      role: "study",
      inputData: [{ time: 1, close: 8 }],
      data: [{ time: 1, close: 8 }],
      visuals: new Map<number, { color: string; isUp: boolean }>(),
    };

    replaceStudyHistogramLikeData(studySource, [{ time: 1, value: 7, color: "#ef4444" }], {
      buildVisuals: (rows) => new Map(rows.map((row) => [row.time, { color: row.color, isUp: false }])),
      normalizeData: (rows) => rows.map((row) => ({ time: row.time, close: row.value })),
      replaceStudySeriesData: (_source, canonicalData) => {
        calls.push(`study-replace:${canonicalData.length}`);
      },
      render: () => calls.push("study-render"),
    });

    expect(studySource.visuals.get(1)).toEqual({ color: "#ef4444", isUp: false });
    expect(calls.slice(1)).toEqual(["study-replace:1", "study-render"]);

    updateStudyHistogramLikeData(studySource, { time: 2, value: 9, color: "#22c55e" }, {
      normalizeBar: (bar) => ({ time: bar.time, close: bar.value }),
      updateStudySeriesData: (_source, canonicalBar) => {
        calls.push(`study-update:${canonicalBar.close}`);
      },
    });

    expect(studySource.visuals.get(2)).toEqual({ color: "#22c55e", isUp: true });
    expect(calls.at(-1)).toBe("study-update:9");
  });
});
