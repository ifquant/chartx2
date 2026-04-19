import { describe, expect, it, vi } from "vitest";

import {
  setPrimaryData,
  setPrimaryHistogramLikeData,
  updatePrimaryData,
  updatePrimaryHistogramLikeData,
} from "../../src/lib/chartx/internal/views/chart-main-series-runtime";

describe("chart main series runtime use-cases", () => {
  it("replaces primary data, clears visuals, and resets viewport", () => {
    const state = {
      inputData: [] as Array<{ time: number; close: number }>,
      data: [] as Array<{ time: number; close: number }>,
      visuals: new Map<number, { color?: string; isUp: boolean }>([
        [1, { color: "#111", isUp: true }],
      ]),
    };
    const resetViewport = vi.fn();
    const render = vi.fn();

    setPrimaryData(state, [{ time: 1, close: 10 }], {
      rebuild: (source) => {
        source.data = source.inputData;
      },
      syncContext: vi.fn(),
      resetViewport,
      render,
    });

    expect(state.inputData).toEqual([{ time: 1, close: 10 }]);
    expect(state.data).toEqual([{ time: 1, close: 10 }]);
    expect(state.visuals.size).toBe(0);
    expect(resetViewport).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("updates primary data through canonical update and clears price-range override", () => {
    const state = {
      inputData: [{ time: 1, close: 10 }],
      data: [{ time: 1, close: 10 }],
      visuals: new Map<number, { color?: string; isUp: boolean }>(),
    };
    const clearPriceRangeOverride = vi.fn();
    const render = vi.fn();

    updatePrimaryData(state, { time: 2, close: 11 }, {
      updateCanonical: (existing, bar) => [...existing, bar],
      rebuild: (source) => {
        source.data = source.inputData;
      },
      syncContext: vi.fn(),
      clearPriceRangeOverride,
      render,
    });

    expect(state.inputData).toEqual([{ time: 1, close: 10 }, { time: 2, close: 11 }]);
    expect(state.data).toEqual([{ time: 1, close: 10 }, { time: 2, close: 11 }]);
    expect(clearPriceRangeOverride).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("replaces and updates histogram-like primary data", () => {
    const state = {
      inputData: [] as Array<{ time: number; close: number }>,
      data: [] as Array<{ time: number; close: number }>,
      visuals: new Map<number, { color?: string; isUp: boolean }>(),
    };
    const resetViewport = vi.fn();
    const clearPriceRangeOverride = vi.fn();
    const render = vi.fn();

    setPrimaryHistogramLikeData(state, [{ time: 1, value: 10, color: "#111", up: true }], {
      buildVisuals: (rows) =>
        new Map(rows.map((row) => [row.time, { color: row.color, isUp: row.up ?? true }])),
      normalizeData: (rows) => rows.map((row) => ({ time: row.time, close: row.value })),
      rebuild: (source) => {
        source.data = source.inputData;
      },
      syncContext: vi.fn(),
      resetViewport,
      render,
    });

    expect(state.inputData).toEqual([{ time: 1, close: 10 }]);
    expect(state.visuals.size).toBe(0);
    expect(resetViewport).toHaveBeenCalledTimes(1);

    updatePrimaryHistogramLikeData(state, { time: 2, value: 12, color: "#222", up: false }, {
      normalizeBar: (bar) => ({ time: bar.time, close: bar.value }),
      updateCanonical: (existing, bar) => [...existing, bar],
      rebuild: (source) => {
        source.data = source.inputData;
      },
      syncContext: vi.fn(),
      clearPriceRangeOverride,
      render,
    });

    expect(state.inputData).toEqual([{ time: 1, close: 10 }, { time: 2, close: 12 }]);
    expect(state.visuals.get(2)).toEqual({ color: "#222", isUp: false });
    expect(clearPriceRangeOverride).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalled();
  });
});
