import { describe, expect, it } from "vitest";

import {
  createTimeBasedChartBarSequence,
  type PlotRow,
  type TimePointIndex,
} from "../../src/lib/internal/model";
import { createChartRenderCoordinator } from "../../src/lib/internal/views/chart-render-coordinator";

function createRow(index: number, time: number): PlotRow<number> {
  return {
    index: index as TimePointIndex,
    time,
    originalTime: time,
    value: [time, time + 1, time - 1, time],
  };
}

function createCoordinator(overrides: Partial<Parameters<typeof createChartRenderCoordinator>[0]> = {}) {
  const contextSequence = createTimeBasedChartBarSequence([createRow(0, 1), createRow(1, 2)]);

  return createChartRenderCoordinator({
    dpr: () => 2,
    getLayout: () => ({ width: 320, height: 240, top: 12, right: 10, bottom: 20, left: 8 }),
    getChartOptions: () => ({
      backgroundColor: "#fff",
      paneBackgroundColor: "#f8f8f8",
      gridColor: "#ddd",
      frameColor: "#333",
      paneGap: 10,
      axisTextColor: "#111",
      axisLabelBackground: "#fff",
      axisLabelBorder: "#ccc",
      axisActiveBackground: "#111",
      axisActiveText: "#fff",
      priceAxisPosition: "right",
    }),
    getCrosshairOptions: () => ({ lineColor: "#111", pointColor: "#222" }),
    getDrawingOptions: () => ({ magnetLabelVisible: true, timeMagnetLabelVisible: true }),
    getCrosshair: () => null,
    getSelectedDrawingId: () => null,
    getHoveredDrawingId: () => null,
    getHoveredDrawingHandle: () => null,
    getDrawingSnapGuide: () => null,
    getManualBarSpacing: () => null,
    getRightOffset: () => 0.8,
    getPrimaryScaleSeriesOnly: () => false,
    getPaneSpecs: () => [{ id: "primary", kind: "primary", preferredHeight: null, resizable: false }],
    getMainSource: () => null,
    createMainBarSequenceFromSource: () => contextSequence,
    getContextSnapshot: () => ({
      mainSourceId: "main-1",
      barSequence: contextSequence,
    }) as never,
    getPrimaryStudies: () => [],
    buildPrimaryPaneSeries: () => [],
    getStudySources: () => [],
    getSecondarySeriesForPane: () => [],
    getDrawingsByPane: () => [],
    getPaneIndex: () => 0,
    getSecondaryScale: () => undefined,
    getPrimaryPriceScale: () => ({
      applyOptions() {},
      getPriceRange() {
        return null;
      },
      priceToCoordinate() {
        return null;
      },
    }) as never,
    getPrimaryPriceRangeOverride: () => null,
    getActiveTradeLocationState: () => null,
    getTimeScale: () => ({
      applyOptions() {},
      indexToCoordinate(index: number) {
        return index as never;
      },
    }) as never,
    getTimeAxisFormatter: () => null,
    getPriceAxisFormatter: () => null,
    getRendererRuntime: () => ({
      lineRenderer: {},
      areaRenderer: {},
      baselineRenderer: {},
      barRenderer: {},
      candlesRenderer: {},
      pointFigureRenderer: {},
      histogramRenderer: {},
      kagiRenderer: {},
    }),
    drawGrid() {},
    drawPaneLegend() {},
    drawCrosshair() {},
    emitReadout() {},
    emitCrosshairMove() {},
    backgroundColor: () => "#fff",
    resolveBarSpacing: () => 6,
    ...overrides,
  });
}

describe("chart render coordinator", () => {
  it("reuses the chart context bar sequence for the active main source", () => {
    const cached = createTimeBasedChartBarSequence([createRow(0, 10), createRow(1, 20)]);
    const coordinator = createCoordinator({
      getContextSnapshot: () => ({
        mainSourceId: "main-1",
        barSequence: cached,
      }) as never,
    });

    const sequence = coordinator.buildMainBarSequence({
      id: "main-1",
      label: "Main 1",
      paneId: "primary",
      role: "main-series",
      kind: "candlestick",
      renderer: "candles",
      options: {},
      inputData: [],
      visuals: new Map(),
      markers: [],
      data: [],
      store: { setData: () => [] },
      priceScale: {} as never,
      chartType: "candlestick",
    });

    expect(sequence).toBe(cached);
  });

  it("rebuilds the main bar sequence when the requested source is not the bound main source", () => {
    const rebuilt = createTimeBasedChartBarSequence([createRow(0, 30), createRow(1, 40)]);
    let rebuiltSourceId: string | null = null;
    const coordinator = createCoordinator({
      createMainBarSequenceFromSource: (source) => {
        rebuiltSourceId = (source as { id: string }).id;
        return rebuilt;
      },
    });

    const sequence = coordinator.buildMainBarSequence({
      id: "other-main",
      label: "Other",
      paneId: "primary",
      role: "main-series",
      kind: "candlestick",
      renderer: "candles",
      options: {},
      inputData: [],
      visuals: new Map(),
      markers: [],
      data: [],
      store: { setData: () => [] },
      priceScale: {} as never,
      chartType: "candlestick",
    });

    expect(rebuiltSourceId).toBe("other-main");
    expect(sequence).toBe(rebuilt);
  });

  it("renders the empty frame path without publishing readout events", () => {
    const events: string[] = [];
    const coordinator = createCoordinator();

    const context = {
      setTransform() {},
      scale() {},
      clearRect() {},
      fillRect() {},
      save() {},
      restore() {},
      translate() {},
      strokeRect() {},
      beginPath() {},
      rect() {},
      clip() {},
      fillStyle: "",
      strokeStyle: "",
    };
    const canvas = {
      width: 0,
      height: 0,
      style: { width: "", height: "" },
      getContext: () => context,
    };

    coordinator.render(canvas as never);

    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(480);
    expect(canvas.style.width).toBe("320px");
    expect(canvas.style.height).toBe("240px");
    expect(events).toEqual([]);
  });
});
