import { describe, expect, it, vi } from "vitest";

import type { PhaseOneTradeLocationRequest } from "../../src/lib/internal/model";
import type { PhaseOneChartStateSnapshot } from "../../src/lib/internal/views/chart-api-types";
import { createChartStateCoordinator } from "../../src/lib/internal/views/chart-state-coordinator";

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
  preferredHeight: number | null;
  resizable: boolean;
};

function createTradeRequest(tradeId: string): PhaseOneTradeLocationRequest {
  return {
    kind: "locate-trade",
    tradeId,
    symbol: "rb2401",
    entryTime: 1,
    exitTime: 2,
    entryPrice: 100,
    exitPrice: 110,
    side: "long",
    quantity: 1,
    realizedPnl: 10,
  };
}

function createTradeOverlay(longColor: string) {
  return {
    fitRange: true,
    showMarkers: true,
    showSpan: true,
    showConnector: true,
    entryLabel: "Entry",
    exitLabel: "Exit",
    longColor,
    shortColor: "#dc2626",
    spanOpacity: 0.12,
    connectorLineWidth: 2,
  };
}

function createSeriesApi(log: string[]) {
  return {
    applyOptions(options: unknown) {
      log.push(`series:options:${JSON.stringify(options)}`);
    },
    setData(data: readonly unknown[]) {
      log.push(`series:data:${data.length}`);
    },
  };
}

function createCompareApi(log: string[]) {
  return {
    applyOptions(options: unknown) {
      log.push(`compare:series:${JSON.stringify(options)}`);
    },
    applyCompareOptions(options: unknown) {
      log.push(`compare:study:${JSON.stringify(options)}`);
    },
    setData(data: readonly unknown[]) {
      log.push(`compare:data:${data.length}`);
    },
  };
}

function createMovingAverageApi(log: string[]) {
  return {
    applyOptions(options: unknown) {
      log.push(`moving-average:series:${JSON.stringify(options)}`);
    },
    applyStudyOptions(options: unknown) {
      log.push(`moving-average:study:${JSON.stringify(options)}`);
    },
  };
}

function createScriptedStudyApi(log: string[]) {
  return {
    applyOptions(options: unknown) {
      log.push(`scripted-study:series:${JSON.stringify(options)}`);
    },
    applyStudyOptions(options: unknown) {
      log.push(`scripted-study:study:${JSON.stringify(options)}`);
    },
  };
}

describe("chart state coordinator", () => {
  it("builds chart state snapshots through one coordinator surface", () => {
    const coordinator = createChartStateCoordinator({
      getOptions: () => ({
        layout: {
          backgroundColor: "#101010",
          paneBackgroundColor: "#111111",
          gridColor: "#222222",
          frameColor: "#333333",
          paneGap: 10,
          axisTextColor: "#444444",
          axisLabelBackground: "#555555",
          axisLabelBorder: "#666666",
          axisActiveBackground: "#777777",
          axisActiveText: "#888888",
          fitContainerHeight: true,
          plotInsets: { top: 0, right: 0, bottom: 0, left: 0 },
        },
        crosshair: {
          lineColor: "#999999",
          pointColor: "#aaaaaa",
        },
      }),
      getTimeScaleState: () => ({
        barSpacing: 12,
        rightOffset: 3,
        visibleLogicalRange: { from: 1, to: 8 },
      }),
      getPriceScaleState: () => ({
        visibleRange: { minValue: 100, maxValue: 200 },
        scaleSeriesOnly: true,
      }),
      listPanes: () => [
        { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false },
        { id: "pane-1", kind: "secondary" as const, preferredHeight: 120, resizable: true },
      ],
      getMainSeriesState: () => ({ chartType: "candlestick" } as never),
      listStudySources: () => [],
      getPaneIndex: (paneId) => paneId === "pane-1" ? 1 : 0,
      getDefaultCompareOptions: () => ({}),
      getTradeLocationState: () => ({
        request: createTradeRequest("trade-1"),
        overlay: createTradeOverlay("#3b82f6"),
      }),
      listDrawings: () => [],
      resolveDrawingMagnetOptions: () => ({}),
      validateDrawings() {},
      applyOptions() {},
      clearSelection() {},
      clearTradeLocation() {},
      removeSourcesWhere() {},
      removeDrawingByApi() {},
      removeDrawing() {},
      getSecondarySeriesCountForPane: () => 0,
      removeSecondaryPane() {},
      addPane() {},
      emitPaneEvent() {},
      applyMainSeriesState() {},
      getPaneByIndex: () => undefined,
      createPaneTarget: () => ({ pane: 0 }),
      addCandlestickSeries: () => createSeriesApi([]),
      addBarSeries: () => createSeriesApi([]),
      addLineSeries: () => createSeriesApi([]),
      addAreaSeries: () => createSeriesApi([]),
      addBaselineSeries: () => createSeriesApi([]),
      addHistogramSeries: () => createSeriesApi([]),
      addVolumeSeries: () => createSeriesApi([]),
      addOverlaySeries: () => createSeriesApi([]),
      addCompareSeries: () => createCompareApi([]),
      addMovingAverageStudy: () => createMovingAverageApi([]),
      addScriptedStudy: (_paneId) => createScriptedStudyApi([]),
      locateTrade() {},
      restoreDrawings() {},
      applyTimeScaleOptions() {},
      setVisibleLogicalRange() {},
      applyPriceScaleOptions() {},
      setVisibleRange() {},
      hasCanvas: () => false,
      render() {},
    });

    expect(coordinator.getChartState()).toEqual({
      options: {
        layout: {
          backgroundColor: "#101010",
          paneBackgroundColor: "#111111",
          gridColor: "#222222",
          frameColor: "#333333",
          paneGap: 10,
          axisTextColor: "#444444",
          axisLabelBackground: "#555555",
          axisLabelBorder: "#666666",
          axisActiveBackground: "#777777",
          axisActiveText: "#888888",
          fitContainerHeight: true,
          plotInsets: { top: 0, right: 0, bottom: 0, left: 0 },
        },
        crosshair: {
          lineColor: "#999999",
          pointColor: "#aaaaaa",
        },
      },
      timeScale: {
        barSpacing: 12,
        rightOffset: 3,
        visibleLogicalRange: { from: 1, to: 8 },
      },
      priceScale: {
        visibleRange: { minValue: 100, maxValue: 200 },
        scaleSeriesOnly: true,
      },
      panes: [
        { height: 120, resizable: true },
      ],
      mainSeries: { chartType: "candlestick" },
      series: [],
      studies: [],
      tradeLocation: {
        request: createTradeRequest("trade-1"),
        overlay: createTradeOverlay("#3b82f6"),
      },
      drawings: [],
    });
  });

  it("applies chart state restore through shared clearing, content, scale, and finalize wiring", () => {
    const panes: PaneLike[] = [
      { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false },
    ];
    const drawings = [{ api: { id: "drawing-1" } }] as { api: { id: string } }[];
    const log: string[] = [];
    const validateDrawings = vi.fn();
    const restoreDrawings = vi.fn((nextDrawings: readonly unknown[]) => {
      log.push(`drawings:restore:${nextDrawings.length}`);
    });

    const coordinator = createChartStateCoordinator({
      getOptions: () => ({
        layout: {
          backgroundColor: "#000000",
          paneBackgroundColor: "#010101",
          gridColor: "#020202",
          frameColor: "#030303",
          paneGap: 10,
          axisTextColor: "#040404",
          axisLabelBackground: "#050505",
          axisLabelBorder: "#060606",
          axisActiveBackground: "#070707",
          axisActiveText: "#080808",
          fitContainerHeight: false,
          plotInsets: { top: 28, right: 18, bottom: 34, left: 18 },
        },
        crosshair: {
          lineColor: "#090909",
          pointColor: "#0a0a0a",
        },
      }),
      getTimeScaleState: () => ({
        barSpacing: null,
        rightOffset: 0,
        visibleLogicalRange: null,
      }),
      getPriceScaleState: () => ({
        visibleRange: null,
        scaleSeriesOnly: false,
      }),
      listPanes: () => panes,
      getMainSeriesState: () => null,
      listStudySources: () => [],
      getPaneIndex: (paneId) => paneId === "pane-1" ? 1 : 0,
      getDefaultCompareOptions: () => ({}),
      getTradeLocationState: () => null,
      listDrawings: () => drawings as never,
      resolveDrawingMagnetOptions: () => ({}),
      validateDrawings,
      applyOptions: (options) => {
        log.push(`options:${options.layout?.backgroundColor}:${options.crosshair?.lineColor}`);
      },
      clearSelection: () => {
        log.push("selection:clear");
      },
      clearTradeLocation: () => {
        log.push("trade:clear");
      },
      removeSourcesWhere: () => {
        log.push("sources:clear");
      },
      removeDrawingByApi: (api) => {
        log.push(`drawing:remove:${(api as { id: string }).id}`);
        const index = drawings.findIndex((drawing) => drawing.api === api);
        if (index >= 0) {
          drawings.splice(index, 1);
        }
      },
      removeDrawing() {},
      getSecondarySeriesCountForPane: () => 0,
      removeSecondaryPane: (paneId) => {
        log.push(`pane:remove:${paneId}`);
      },
      addPane: (options) => {
        const id = `pane-${panes.length}`;
        panes.push({
          id,
          kind: "secondary" as const,
          preferredHeight: options?.height ?? null,
          resizable: options?.resizable ?? true,
        });
        log.push(`pane:add:${id}`);
      },
      emitPaneEvent: (type, paneId) => {
        log.push(`pane:event:${type}:${paneId}`);
      },
      applyMainSeriesState: (state) => {
        log.push(`main:${state.chartType}`);
      },
      getPaneByIndex: (index) => panes[index],
      createPaneTarget: (pane) => ({ pane: pane.id === "primary" ? 0 : 1 }),
      addCandlestickSeries: () => createSeriesApi(log),
      addBarSeries: () => createSeriesApi(log),
      addLineSeries: (target) => {
        log.push(`series:add:line:${(target?.pane as number | undefined) ?? -1}`);
        return createSeriesApi(log);
      },
      addAreaSeries: () => createSeriesApi(log),
      addBaselineSeries: () => createSeriesApi(log),
      addHistogramSeries: () => createSeriesApi(log),
      addVolumeSeries: () => createSeriesApi(log),
      addOverlaySeries: (paneId) => {
        log.push(`study:add:overlay:${paneId}`);
        return createSeriesApi(log);
      },
      addCompareSeries: (paneId) => {
        log.push(`study:add:compare:${paneId}`);
        return createCompareApi(log);
      },
      addMovingAverageStudy: (paneId) => {
        log.push(`study:add:moving-average:${paneId}`);
        return createMovingAverageApi(log);
      },
      addScriptedStudy: (paneId) => {
        log.push(`study:add:scripted:${paneId}`);
        return createScriptedStudyApi(log);
      },
      locateTrade: (request, overlay) => {
        log.push(`trade:locate:${request.tradeId}:${overlay.longColor}`);
      },
      restoreDrawings,
      applyTimeScaleOptions: (options) => {
        log.push(`time:options:${options.barSpacing}:${options.rightOffset}`);
      },
      setVisibleLogicalRange: (range) => {
        log.push(`time:range:${range.from}:${range.to}`);
      },
      applyPriceScaleOptions: (options) => {
        log.push(`price:options:${options.scaleSeriesOnly}`);
      },
      setVisibleRange: (range) => {
        log.push(`price:range:${range?.minValue}:${range?.maxValue}`);
      },
      hasCanvas: () => true,
      render: () => {
        log.push("render");
      },
    });

    const state: PhaseOneChartStateSnapshot = {
      options: {
        layout: {
          backgroundColor: "#111111",
          paneBackgroundColor: "#121212",
          gridColor: "#131313",
          frameColor: "#141414",
          paneGap: 10,
          axisTextColor: "#151515",
          axisLabelBackground: "#161616",
          axisLabelBorder: "#171717",
          axisActiveBackground: "#181818",
          axisActiveText: "#191919",
        },
        crosshair: {
          lineColor: "#202020",
          pointColor: "#212121",
        },
      },
      panes: [
        { height: 180, resizable: false },
      ],
      mainSeries: { chartType: "line" } as never,
      series: [
        {
          kind: "line",
          paneIndex: 1,
          options: { color: "#22c55e" },
          data: [{ value: 10 }],
        },
      ] as never,
      studies: [
        {
          type: "overlay",
          paneIndex: 1,
          seriesOptions: { color: "#3b82f6" },
          data: [{ value: 12 }],
        },
        {
          type: "scripted-study",
          paneIndex: 1,
          seriesOptions: { color: "#14b8a6" },
          studyOptions: {
            scriptId: "close-sma-20-v0",
            inputValues: { length: 20 },
            inputContextMode: "requested-context",
            requestedSymbol: "ES1!",
            requestedResolution: "5",
            requestedSession: "regular",
            requestedTimezone: "UTC",
            mergePolicy: "exact",
          },
        },
      ] as never,
      tradeLocation: {
        request: createTradeRequest("trade-2"),
        overlay: createTradeOverlay("#f97316"),
      },
      drawings: [
        {
          type: "horizontal-line",
          paneIndex: 1,
          options: { price: 18 },
        },
      ] as never,
      timeScale: {
        barSpacing: 9,
        rightOffset: 2,
        visibleLogicalRange: { from: 1, to: 5 },
      },
      priceScale: {
        visibleRange: { minValue: 8, maxValue: 21 },
        scaleSeriesOnly: true,
      },
    };

    coordinator.applyChartState(state);

    expect(validateDrawings).toHaveBeenCalledWith(state.drawings, 1);
    expect(restoreDrawings).toHaveBeenCalledWith(state.drawings);
    expect(panes).toMatchObject([
      { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
      { id: "pane-1", kind: "secondary", preferredHeight: 180, resizable: false },
    ]);
    expect(log).toEqual([
      "options:#111111:#202020",
      "selection:clear",
      "drawing:remove:drawing-1",
      "sources:clear",
      "sources:clear",
      "trade:clear",
      "pane:add:pane-1",
      "pane:event:options:pane-1",
      "main:line",
      "series:add:line:1",
      "series:options:{\"color\":\"#22c55e\"}",
      "series:data:1",
      "study:add:overlay:pane-1",
      "series:options:{\"color\":\"#3b82f6\"}",
      "series:data:1",
      "study:add:scripted:pane-1",
      "scripted-study:study:{\"scriptId\":\"close-sma-20-v0\",\"inputValues\":{\"length\":20},\"inputContextMode\":\"requested-context\",\"requestedSymbol\":\"ES1!\",\"requestedResolution\":\"5\",\"requestedSession\":\"regular\",\"requestedTimezone\":\"UTC\",\"mergePolicy\":\"exact\"}",
      "scripted-study:series:{\"color\":\"#14b8a6\"}",
      "trade:locate:trade-2:#f97316",
      "drawings:restore:1",
      "time:options:9:2",
      "time:range:1:5",
      "price:options:true",
      "price:range:8:21",
      "render",
    ]);
  });

  it("normalizes chart templates before applying chart state", () => {
    const applyOptions = vi.fn();
    const coordinator = createChartStateCoordinator({
      getOptions: () => ({
        layout: {
          backgroundColor: "#ffffff",
          paneBackgroundColor: "#f5f5f5",
          gridColor: "#e5e5e5",
          frameColor: "#d4d4d4",
          paneGap: 10,
          axisTextColor: "#262626",
          axisLabelBackground: "#ffffff",
          axisLabelBorder: "#d4d4d4",
          axisActiveBackground: "#171717",
          axisActiveText: "#fafafa",
          fitContainerHeight: false,
          plotInsets: { top: 28, right: 18, bottom: 34, left: 18 },
        },
        crosshair: {
          lineColor: "#0f172a",
          pointColor: "#1e293b",
        },
      }),
      getTimeScaleState: () => ({
        barSpacing: null,
        rightOffset: 0,
        visibleLogicalRange: null,
      }),
      getPriceScaleState: () => ({
        visibleRange: null,
        scaleSeriesOnly: false,
      }),
      listPanes: () => [{ id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false }],
      getMainSeriesState: () => null,
      listStudySources: () => [],
      getPaneIndex: () => 0,
      getDefaultCompareOptions: () => ({}),
      getTradeLocationState: () => null,
      listDrawings: () => [],
      resolveDrawingMagnetOptions: () => ({}),
      validateDrawings: vi.fn(),
      applyOptions,
      clearSelection() {},
      clearTradeLocation() {},
      removeSourcesWhere() {},
      removeDrawingByApi() {},
      removeDrawing() {},
      getSecondarySeriesCountForPane: () => 0,
      removeSecondaryPane() {},
      addPane() {},
      emitPaneEvent() {},
      applyMainSeriesState() {},
      getPaneByIndex: () => undefined,
      createPaneTarget: () => ({ pane: 0 }),
      addCandlestickSeries: () => createSeriesApi([]),
      addBarSeries: () => createSeriesApi([]),
      addLineSeries: () => createSeriesApi([]),
      addAreaSeries: () => createSeriesApi([]),
      addBaselineSeries: () => createSeriesApi([]),
      addHistogramSeries: () => createSeriesApi([]),
      addVolumeSeries: () => createSeriesApi([]),
      addOverlaySeries: () => createSeriesApi([]),
      addCompareSeries: () => createCompareApi([]),
      addMovingAverageStudy: () => createMovingAverageApi([]),
      addScriptedStudy: (_paneId) => createScriptedStudyApi([]),
      locateTrade() {},
      restoreDrawings() {},
      applyTimeScaleOptions() {},
      setVisibleLogicalRange() {},
      applyPriceScaleOptions() {},
      setVisibleRange() {},
      hasCanvas: () => false,
      render() {},
    });

    const templateState: PhaseOneChartStateSnapshot = {
      options: {
        layout: {
          backgroundColor: "#abcdef",
          paneBackgroundColor: "#bcdef0",
          gridColor: "#cdef01",
          frameColor: "#def012",
          paneGap: 10,
          axisTextColor: "#ef0123",
          axisLabelBackground: "#f01234",
          axisLabelBorder: "#012345",
          axisActiveBackground: "#123456",
          axisActiveText: "#234567",
        },
        crosshair: {
          lineColor: "#345678",
          pointColor: "#456789",
        },
      },
      panes: [],
      mainSeries: null,
      series: [],
      studies: [],
      tradeLocation: null,
      drawings: [],
      timeScale: {
        barSpacing: null,
        rightOffset: 0,
        visibleLogicalRange: null,
      },
      priceScale: {
        visibleRange: null,
        scaleSeriesOnly: false,
      },
    };

    expect(coordinator.getChartTemplate()).toEqual({
      kind: "chart-template",
      version: 1,
      chart: coordinator.getChartState(),
    });

    coordinator.applyChartTemplate({
      kind: "chart-template",
      version: 1,
      chart: templateState,
    });

    expect(applyOptions).toHaveBeenCalledWith(templateState.options);
  });
});
