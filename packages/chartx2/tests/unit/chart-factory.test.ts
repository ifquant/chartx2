import { describe, expect, it, vi } from "vitest";

import { createAttachedChart } from "../../src/lib/internal/views/chart-factory";

describe("chart factory", () => {
  it("creates a harness, attaches it to the canvas, and returns the public API", () => {
    const attach = vi.fn();
    const detach = vi.fn();
    const previousCanvasElement = globalThis.HTMLCanvasElement;
    class CanvasStub {}
    globalThis.HTMLCanvasElement = CanvasStub as unknown as typeof HTMLCanvasElement;
    const canvas = new CanvasStub() as unknown as HTMLCanvasElement;
    Object.assign(canvas, {
      getContext: () => ({}),
    });

    try {
      const publicApiSurface = {
        detach,
        addCandlestickSeries: vi.fn(),
        addBarSeries: vi.fn(),
        addLineSeries: vi.fn(),
        addAreaSeries: vi.fn(),
        addBaselineSeries: vi.fn(),
        addHistogramSeries: vi.fn(),
        addVolumeSeries: vi.fn(),
        addOverlaySeries: vi.fn(),
        addCompareSeries: vi.fn(),
        addMovingAverageStudy: vi.fn(),
        addHorizontalLineDrawing: vi.fn(),
        addTrendLineDrawing: vi.fn(),
        getSelectedDrawing: vi.fn(),
        getSelectedDrawingState: vi.fn(),
        getSelectedDrawingPropertySchema: vi.fn(),
        applySelectedDrawingOptions: vi.fn(),
        clearSelectedDrawing: vi.fn(),
        subscribeDrawingSelectionChange: vi.fn(),
        unsubscribeDrawingSelectionChange: vi.fn(),
        panesApi: vi.fn(() => []),
        addPane: vi.fn(),
        removePaneByHandle: vi.fn(),
        applyOptions: vi.fn(),
        applyVisualTheme: vi.fn(),
        getChartType: vi.fn(),
        getMainSeriesState: vi.fn(),
        applyMainSeriesState: vi.fn(),
        getChartState: vi.fn(),
        applyChartState: vi.fn(),
        getChartTemplate: vi.fn(),
        applyChartTemplate: vi.fn(),
        setChartType: vi.fn(),
        locateTrade: vi.fn(),
        clearTradeLocation: vi.fn(),
        getTradeLocationState: vi.fn(),
        subscribeChartTypeChange: vi.fn(),
        unsubscribeChartTypeChange: vi.fn(),
        removeSeries: vi.fn(),
        resize: vi.fn(),
        timeScaleApi: vi.fn(),
        priceScaleApi: vi.fn(),
        subscribeCrosshairMove: vi.fn(),
        unsubscribeCrosshairMove: vi.fn(),
        subscribeClick: vi.fn(),
        unsubscribeClick: vi.fn(),
        subscribePaneEvents: vi.fn(),
        unsubscribePaneEvents: vi.fn(),
      };
      const api = createAttachedChart(canvas, () => ({
        attach,
        publicApiSurface: () => publicApiSurface,
      }));

      expect(attach).toHaveBeenCalledWith(canvas);
      api.destroy();
      expect(detach).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.HTMLCanvasElement = previousCanvasElement;
    }
  });
});
