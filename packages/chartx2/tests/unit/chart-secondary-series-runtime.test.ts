import { describe, expect, it, vi } from "vitest";

import {
  setSecondaryData,
  setSecondaryHistogramLikeData,
  updateSecondaryData,
  updateSecondaryHistogramLikeData,
} from "../../src/lib/internal/views/chart-secondary-series-runtime";

describe("chart secondary series runtime use-cases", () => {
  it("replaces secondary study data and resets viewport", () => {
    const state = {
      role: "study",
      inputData: [] as Array<{ time: number; close: number }>,
      data: [] as Array<{ time: number; close: number }>,
      visuals: new Map<number, { color?: string; isUp: boolean }>(),
    };
    const resetViewport = vi.fn();
    const render = vi.fn();

    setSecondaryData(state, [{ time: 1, close: 10 }], {
      resolveDisplayData: (source) => source.inputData,
      resetViewport,
      render,
    });

    expect(state.inputData).toEqual([{ time: 1, close: 10 }]);
    expect(state.data).toEqual([{ time: 1, close: 10 }]);
    expect(resetViewport).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("updates secondary study data through canonical update", () => {
    const state = {
      role: "study",
      inputData: [{ time: 1, close: 10 }],
      data: [{ time: 1, close: 10 }],
      visuals: new Map<number, { color?: string; isUp: boolean }>(),
    };
    const render = vi.fn();

    updateSecondaryData(state, { time: 2, close: 11 }, {
      updateCanonical: (existing, bar) => [...existing, bar],
      resolveDisplayData: (source) => source.inputData,
      render,
    });

    expect(state.inputData).toEqual([{ time: 1, close: 10 }, { time: 2, close: 11 }]);
    expect(state.data).toEqual([{ time: 1, close: 10 }, { time: 2, close: 11 }]);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("replaces and updates histogram-like secondary study data", () => {
    const state = {
      role: "study",
      inputData: [] as Array<{ time: number; close: number }>,
      data: [] as Array<{ time: number; close: number }>,
      visuals: new Map<number, { color?: string; isUp: boolean }>(),
    };
    const resetViewport = vi.fn();
    const render = vi.fn();

    setSecondaryHistogramLikeData(state, [{ time: 1, value: 10, color: "#111", up: true }], {
      buildVisuals: (rows) =>
        new Map(rows.map((row) => [row.time, { color: row.color, isUp: row.up ?? true }])),
      normalizeData: (rows) => rows.map((row) => ({ time: row.time, close: row.value })),
      resolveDisplayData: (source) => source.inputData,
      resetViewport,
      render,
    });

    expect(state.inputData).toEqual([{ time: 1, close: 10 }]);
    expect(state.visuals.get(1)).toEqual({ color: "#111", isUp: true });
    expect(resetViewport).toHaveBeenCalledTimes(1);

    updateSecondaryHistogramLikeData(state, { time: 2, value: 12, color: "#222", up: false }, {
      normalizeBar: (bar) => ({ time: bar.time, close: bar.value }),
      updateCanonical: (existing, bar) => [...existing, bar],
      resolveDisplayData: (source) => source.inputData,
      render,
    });

    expect(state.inputData).toEqual([{ time: 1, close: 10 }, { time: 2, close: 12 }]);
    expect(state.visuals.get(2)).toEqual({ color: "#222", isUp: false });
    expect(render).toHaveBeenCalled();
  });
});
