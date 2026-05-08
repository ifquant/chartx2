import { describe, expect, it, vi } from "vitest";

import { createChartPublicApi } from "../../src/lib/internal/views/chart-public-api";

describe("chart public api wrapper", () => {
  it("routes public chart api calls through the harness contract", () => {
    const drawingSelectionHandler = vi.fn();
    const chartTypeHandler = vi.fn();
    const crosshairHandler = vi.fn();
    const clickHandler = vi.fn();
    const paneEventHandler = vi.fn();

    const harness = {
      addCandlestickSeries: vi.fn(() => "candlestick"),
      addBarSeries: vi.fn(() => "bar"),
      addLineSeries: vi.fn(() => "line"),
      addAreaSeries: vi.fn(() => "area"),
      addBaselineSeries: vi.fn(() => "baseline"),
      addHistogramSeries: vi.fn(() => "histogram"),
      addVolumeSeries: vi.fn(() => "volume"),
      addOverlaySeries: vi.fn(() => "overlay"),
      addCompareSeries: vi.fn(() => "compare"),
      addMovingAverageStudy: vi.fn(() => "ma"),
      addHorizontalLineDrawing: vi.fn(() => "hline"),
      addTrendLineDrawing: vi.fn(() => "tline"),
      getSelectedDrawing: vi.fn(() => ({ kind: "none" })),
      getSelectedDrawingState: vi.fn(() => null),
      getSelectedDrawingPropertySchema: vi.fn(() => null),
      applySelectedDrawingOptions: vi.fn(),
      clearSelectedDrawing: vi.fn(),
      subscribeDrawingSelectionChange: vi.fn(),
      unsubscribeDrawingSelectionChange: vi.fn(),
      panesApi: vi.fn(() => ["pane"]),
      addPane: vi.fn(() => "pane-handle"),
      removePaneByHandle: vi.fn(),
      applyOptions: vi.fn(),
      getChartType: vi.fn(() => "candlestick"),
      getMainSeriesState: vi.fn(() => null),
      applyMainSeriesState: vi.fn(() => "main-series"),
      getChartState: vi.fn(() => ({ version: 1 })),
      applyChartState: vi.fn(),
      getChartTemplate: vi.fn(() => ({ version: 1 })),
      applyChartTemplate: vi.fn(),
      setChartType: vi.fn(() => "main-series"),
      locateTrade: vi.fn(() => ({ kind: "trade" })),
      clearTradeLocation: vi.fn(),
      getTradeLocationState: vi.fn(() => ({ kind: "trade" })),
      subscribeChartTypeChange: vi.fn(),
      unsubscribeChartTypeChange: vi.fn(),
      removeSeries: vi.fn(),
      resize: vi.fn(),
      timeScaleApi: vi.fn(() => "time-scale"),
      priceScaleApi: vi.fn(() => "price-scale"),
      subscribeCrosshairMove: vi.fn(),
      unsubscribeCrosshairMove: vi.fn(),
      subscribeClick: vi.fn(),
      unsubscribeClick: vi.fn(),
      subscribePaneEvents: vi.fn(),
      unsubscribePaneEvents: vi.fn(),
      detach: vi.fn(),
    };

    const api = createChartPublicApi(harness as never);

    expect(api.addCandlestickSeries()).toBe("candlestick");
    expect(api.addBarSeries()).toBe("bar");
    expect(api.addLineSeries()).toBe("line");
    expect(api.addAreaSeries()).toBe("area");
    expect(api.addBaselineSeries()).toBe("baseline");
    expect(api.addHistogramSeries()).toBe("histogram");
    expect(api.addVolumeSeries()).toBe("volume");
    expect(api.addOverlaySeries()).toBe("overlay");
    expect(api.addCompareSeries()).toBe("compare");
    expect(api.addMovingAverageStudy()).toBe("ma");
    expect(api.addHorizontalLineDrawing()).toBe("hline");
    expect(api.addTrendLineDrawing()).toBe("tline");
    expect(api.getSelectedDrawing()).toEqual({ kind: "none" });
    expect(api.getSelectedDrawingState()).toBeNull();
    expect(api.getSelectedDrawingPropertySchema()).toBeNull();
    api.applySelectedDrawingOptions({});
    api.clearSelectedDrawing();
    api.subscribeDrawingSelectionChange(drawingSelectionHandler);
    api.unsubscribeDrawingSelectionChange(drawingSelectionHandler);
    expect(api.panes()).toEqual(["pane"]);
    expect(api.addPane()).toBe("pane-handle");
    api.removePane("pane-ref" as never);
    api.applyOptions({});
    expect(api.getChartType()).toBe("candlestick");
    expect(api.getMainSeriesState()).toBeNull();
    expect(api.applyMainSeriesState({} as never)).toBe("main-series");
    expect(api.getChartState()).toEqual({ version: 1 });
    api.applyChartState({} as never);
    expect(api.getChartTemplate()).toEqual({ version: 1 });
    api.applyChartTemplate({} as never);
    expect(api.setChartType("candlestick" as never)).toBe("main-series");
    expect(api.locateTrade({} as never)).toEqual({ kind: "trade" });
    api.clearTradeLocation();
    expect(api.getTradeLocationState()).toEqual({ kind: "trade" });
    api.subscribeChartTypeChange(chartTypeHandler);
    api.unsubscribeChartTypeChange(chartTypeHandler);
    api.removeSeries("series" as never);
    api.resize(100, 200);
    expect(api.timeScale()).toBe("time-scale");
    expect(api.priceScale()).toBe("price-scale");
    api.subscribeCrosshairMove(crosshairHandler);
    api.unsubscribeCrosshairMove(crosshairHandler);
    api.subscribeClick(clickHandler);
    api.unsubscribeClick(clickHandler);
    api.subscribePaneEvents(paneEventHandler);
    api.unsubscribePaneEvents(paneEventHandler);
    api.destroy();

    expect(harness.removePaneByHandle).toHaveBeenCalledWith("pane-ref");
    expect(harness.applySelectedDrawingOptions).toHaveBeenCalledTimes(1);
    expect(harness.clearSelectedDrawing).toHaveBeenCalledTimes(1);
    expect(harness.subscribeDrawingSelectionChange).toHaveBeenCalledWith(drawingSelectionHandler);
    expect(harness.unsubscribeDrawingSelectionChange).toHaveBeenCalledWith(drawingSelectionHandler);
    expect(harness.subscribeChartTypeChange).toHaveBeenCalledWith(chartTypeHandler);
    expect(harness.unsubscribeChartTypeChange).toHaveBeenCalledWith(chartTypeHandler);
    expect(harness.subscribeCrosshairMove).toHaveBeenCalledWith(crosshairHandler);
    expect(harness.unsubscribeCrosshairMove).toHaveBeenCalledWith(crosshairHandler);
    expect(harness.subscribeClick).toHaveBeenCalledWith(clickHandler);
    expect(harness.unsubscribeClick).toHaveBeenCalledWith(clickHandler);
    expect(harness.subscribePaneEvents).toHaveBeenCalledWith(paneEventHandler);
    expect(harness.unsubscribePaneEvents).toHaveBeenCalledWith(paneEventHandler);
    expect(harness.detach).toHaveBeenCalledTimes(1);
  });
});
