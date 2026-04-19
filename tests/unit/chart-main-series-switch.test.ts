import { describe, expect, it, vi } from "vitest";

import { setChartType } from "../../src/lib/chartx/internal/views/chart-main-series-switch";

describe("chart main series switch use-case", () => {
  it("returns the current api when the chart type is unchanged", () => {
    const currentApi = { id: "same-api" };
    const current = {
      chartType: "candlestick",
      api: currentApi,
    };

    const nextApi = setChartType(current, "candlestick", {
      currentType: (source) => source.chartType,
      currentApi: (source) => source.api,
      removeCurrent: vi.fn(() => true),
      clearPriceRangeOverride: vi.fn(),
      buildPreservedState: vi.fn(() => ({})),
      attachSeries: vi.fn(() => ({ id: "new-api" })),
      render: vi.fn(),
      emitChartTypeChange: vi.fn(),
    });

    expect(nextApi).toBe(currentApi);
  });

  it("replaces the current main source and emits chart-type change", () => {
    const currentApi = { id: "old-api" };
    const nextApi = { id: "new-api" };
    const preservedState = { id: "main-1", data: [{ time: 1, close: 10 }] };
    const clearPriceRangeOverride = vi.fn();
    const buildPreservedState = vi.fn(() => preservedState);
    const attachSeries = vi.fn(() => nextApi);
    const render = vi.fn();
    const emitChartTypeChange = vi.fn();
    const current = {
      chartType: "candlestick",
      api: currentApi,
    };

    const result = setChartType(current, "line", {
      currentType: (source) => source.chartType,
      currentApi: (source) => source.api,
      removeCurrent: vi.fn(() => true),
      clearPriceRangeOverride,
      buildPreservedState,
      attachSeries,
      render,
      emitChartTypeChange,
    });

    expect(result).toBe(nextApi);
    expect(clearPriceRangeOverride).toHaveBeenCalledTimes(1);
    expect(buildPreservedState).toHaveBeenCalledWith(current);
    expect(attachSeries).toHaveBeenCalledWith("line", preservedState);
    expect(render).toHaveBeenCalledTimes(1);
    expect(emitChartTypeChange).toHaveBeenCalledWith("line");
  });

  it("throws when the current main source cannot be removed", () => {
    const current = {
      chartType: "candlestick",
      api: { id: "old-api" },
    };

    expect(() =>
      setChartType(current, "line", {
        currentType: (source) => source.chartType,
        currentApi: (source) => source.api,
        removeCurrent: vi.fn(() => false),
        clearPriceRangeOverride: vi.fn(),
        buildPreservedState: vi.fn(() => ({})),
        attachSeries: vi.fn(() => ({ id: "new-api" })),
        render: vi.fn(),
        emitChartTypeChange: vi.fn(),
      }),
    ).toThrow("chartx phase-one chart could not replace the active main series");
  });
});
