import { describe, expect, it, vi } from "vitest";

import { createChartMainSeriesStateOwner } from "../../src/lib/chartx/internal/views/chart-main-series-state-owner";

describe("chart main series state owner", () => {
  it("builds state from the active main source", () => {
    const source = createSource();
    const owner = createChartMainSeriesStateOwner({
      getMainSource: () => source,
      getMainSourceOrThrow: () => source,
      attachMainSeries: vi.fn() as never,
      switchChartType: vi.fn() as never,
      createOptions: () => ({}),
      rebuildData: vi.fn(),
      syncContext: vi.fn(),
      resetPrimaryPriceRangeOverride: vi.fn(),
      render: vi.fn(),
    });

    expect(owner.getState()).toMatchObject({
      chartType: "line",
      styleOptions: { color: "#2563eb", lineWidth: 2 },
      lineBreakOptions: { lineCount: 3 },
    });
  });

  it("applies state through attach/switch and rebuild callbacks", () => {
    const source = createSource();
    const calls: string[] = [];
    const owner = createChartMainSeriesStateOwner({
      getMainSource: () => source,
      getMainSourceOrThrow: () => source,
      attachMainSeries: () => {
        calls.push("attach");
        return { id: "attached" };
      },
      switchChartType: () => {
        calls.push("switch");
        return { id: "switched" };
      },
      createOptions: () => ({ color: "#000000" }),
      rebuildData: () => calls.push("rebuild"),
      syncContext: () => calls.push("sync"),
      resetPrimaryPriceRangeOverride: () => calls.push("reset"),
      render: () => calls.push("render"),
    });

    const api = owner.applyState({
      chartType: "candlestick",
      inputCapability: "ohlc",
      builder: "time-bars",
      renderer: "candles",
      styleSchemaId: "candleStyle",
      styleOptionSurface: "candlestick",
      styleOptions: { upColor: "#10b981" },
      lineBreakOptions: { lineCount: 4 },
      renkoOptions: { boxSize: -1, boxSizeMode: "fixed" },
      pointFigureOptions: {
        boxSize: -1,
        boxSizeMode: "percentage",
        boxSizeScale: 10,
        reversalBoxes: 0,
        atrLength: 1,
        percentageValue: 99,
      },
      kagiOptions: {
        reversalMode: "percentage",
        reversalSize: -1,
        reversalScale: 10,
        atrLength: 1,
        percentageValue: 99,
      },
    });

    expect(api).toEqual({ id: "switched" });
    expect(calls).toEqual(["switch", "rebuild", "sync", "reset", "render"]);
    expect(source.options).toEqual({ color: "#000000", upColor: "#10b981" });
    expect(source.lineBreakOptions).toEqual({ lineCount: 4 });
    expect(source.renkoOptions).toEqual({ boxSize: null, boxSizeMode: "fixed" });
  });
});

function createSource() {
  return {
    api: { id: "main-api" },
    chartType: "line" as const,
    styleSchemaId: "lineStyle" as const,
    options: { color: "#2563eb", lineWidth: 2 },
    inputData: [],
    data: [],
    lineBreakOptions: { lineCount: 3 },
    renkoOptions: { boxSize: null, boxSizeMode: "auto" as const },
    pointFigureOptions: {
      boxSize: null,
      boxSizeMode: "atr" as const,
      boxSizeScale: 1,
      reversalBoxes: 3,
      atrLength: 14,
      percentageValue: 1,
    },
    kagiOptions: {
      reversalMode: "fixed" as const,
      reversalSize: null,
      reversalScale: 1,
      atrLength: 14,
      percentageValue: 1,
    },
  };
}

