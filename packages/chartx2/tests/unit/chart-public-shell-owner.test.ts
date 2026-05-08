import { describe, expect, it, vi } from "vitest";

import { createChartPublicShellOwner } from "../../src/lib/internal/views/chart-public-shell-owner";

function createOwnerDeps(overrides: Record<string, unknown> = {}) {
  const seriesCommandOwner = {
    addCandlestickSeries: vi.fn(() => "candlestick"),
    addBarSeries: vi.fn(() => "bar"),
    addLineSeries: vi.fn(() => "line"),
    addAreaSeries: vi.fn(() => "area"),
    addBaselineSeries: vi.fn(() => "baseline"),
    addHistogramSeries: vi.fn(() => "histogram"),
    addVolumeSeries: vi.fn(() => "volume"),
    addOverlaySeries: vi.fn(() => "overlay"),
    addCompareSeries: vi.fn(() => "compare"),
    addMovingAverageStudy: vi.fn(() => "moving-average"),
    removeSeries: vi.fn(),
  };
  const drawingOwner = {
    addHorizontalLine: vi.fn(() => "horizontal-line"),
    addTrendLine: vi.fn(() => "trend-line"),
    getSelectedDrawing: vi.fn(() => null),
    getSelectedDrawingState: vi.fn(() => null),
    getSelectedDrawingPropertySchema: vi.fn(() => null),
    applySelectedDrawingOptions: vi.fn(),
    clearSelectedDrawing: vi.fn(),
  };
  const paneOwner = {
    listPaneHandles: vi.fn(() => ["pane"]),
    addPane: vi.fn(() => "new-pane"),
    removePaneByHandle: vi.fn(),
  };
  const shellOwner = {
    applyOptions: vi.fn(),
    resize: vi.fn(),
  };
  const scaleOwner = {
    timeScaleApi: vi.fn(() => "time-scale"),
    priceScaleApi: vi.fn(() => "price-scale"),
  };
  const eventSubscriptionOwner = {
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    subscribeClick: vi.fn(),
    unsubscribeClick: vi.fn(),
    subscribeDrawingSelectionChange: vi.fn(),
    unsubscribeDrawingSelectionChange: vi.fn(),
    subscribePaneEvents: vi.fn(),
    unsubscribePaneEvents: vi.fn(),
    subscribeChartTypeChange: vi.fn(),
    unsubscribeChartTypeChange: vi.fn(),
  };
  const runtimeQueryOwner = {
    getChartType: vi.fn(() => "line"),
  };
  const mainSeriesStateOwner = {
    getState: vi.fn(() => ({ chartType: "line" })),
    applyState: vi.fn(() => "main-series"),
  };
  const stateCoordinator = {
    getChartState: vi.fn(() => ({ version: 1 })),
    applyChartState: vi.fn(),
    getChartTemplate: vi.fn(() => ({ version: 1 })),
    applyChartTemplate: vi.fn(),
  };
  const tradeLocationOwner = {
    locate: vi.fn(() => ({ kind: "trade" })),
    clear: vi.fn(),
    getState: vi.fn(() => null),
  };
  const sourceOwner = {
    setChartType: vi.fn(() => "switched"),
  };

  return {
    detach: vi.fn(),
    seriesCommandOwner,
    drawingOwner,
    paneOwner,
    shellOwner,
    scaleOwner,
    eventSubscriptionOwner,
    runtimeQueryOwner,
    mainSeriesStateOwner,
    stateCoordinator,
    tradeLocationOwner,
    sourceOwner,
    ...overrides,
  };
}

describe("chart public shell owner", () => {
  it("exposes the same stable public surface through one shell owner", () => {
    const deps = createOwnerDeps();
    const surface = createChartPublicShellOwner(deps as never).publicApiSurface();

    expect(surface.addCandlestickSeries()).toBe("candlestick");
    expect(surface.addHorizontalLineDrawing()).toBe("horizontal-line");
    expect(surface.panesApi()).toEqual(["pane"]);
    expect(surface.timeScaleApi()).toBe("time-scale");
    expect(surface.priceScaleApi()).toBe("price-scale");
    expect(surface.getChartType()).toBe("line");
    expect(surface.applyMainSeriesState({ chartType: "line" } as never)).toBe("main-series");
    expect(surface.setChartType("bar" as never)).toBe("switched");
  });
});
