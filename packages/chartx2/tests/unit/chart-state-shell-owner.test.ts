import { describe, expect, it, vi } from "vitest";

import type { PhaseOneTradeLocationRequest } from "../../src/lib/internal/model";
import { createChartStateShellOwner } from "../../src/lib/internal/views/chart-state-shell-owner";

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

describe("chart state shell owner", () => {
  it("builds chart state snapshots through one shell composition surface", () => {
    const log: string[] = [];
    const owner = createChartStateShellOwner<never, never>({
      snapshotInput: {
        getLayoutOptions: () => ({
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
          priceAxisPosition: "right",
          fitContainerHeight: true,
          plotInsets: { top: 0, right: 0, bottom: 0, left: 0 },
        }),
        getCrosshairOptions: () => ({
          lineColor: "#999999",
          pointColor: "#aaaaaa",
        }),
        getBarSpacing: () => 12,
        getRightOffset: () => 3,
        getVisibleLogicalRange: () => ({ from: 1, to: 8 }),
        getVisiblePriceRange: () => ({ minValue: 100, maxValue: 200 }),
        getPrimaryScaleSeriesOnly: () => true,
        getActiveTradeLocation: () => ({
          request: createTradeRequest("trade-1"),
          options: createTradeOverlay("#3b82f6"),
        }),
        listDrawings: () => [],
        getDrawingOptions: () => ({
          magnetEnabled: true,
          magnetTolerancePx: 12,
          timeMagnetEnabled: true,
          timeMagnetPolicy: "nearest",
          timeMagnetTolerancePx: 12,
          magnetSources: { open: true, high: true, low: true, close: true },
        }),
      },
      coordinator: {
        listPanes: () => [
          { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false },
          { id: "pane-1", kind: "secondary" as const, preferredHeight: 120, resizable: true },
        ],
        getMainSeriesState: () => ({ chartType: "candlestick" } as never),
        listStudySources: () => [],
        getPaneIndex: (paneId) => (paneId === "pane-1" ? 1 : 0),
        getDefaultCompareOptions: () => ({}),
      },
      restoreCommands: {
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
        createPaneHandle: () => ({ pane: 0 }),
        addCandlestickSeries: () => createSeriesApi(log),
        addBarSeries: () => createSeriesApi(log),
        addLineSeries: () => createSeriesApi(log),
        addAreaSeries: () => createSeriesApi(log),
        addBaselineSeries: () => createSeriesApi(log),
        addHistogramSeries: () => createSeriesApi(log),
        addVolumeSeries: () => createSeriesApi(log),
        addOverlaySeries: () => createSeriesApi(log),
        addCompareSeries: () => ({
          ...createSeriesApi(log),
          applyCompareOptions: vi.fn(),
        }),
        addMovingAverageStudy: () => ({
          applyOptions: vi.fn(),
          applyStudyOptions: vi.fn(),
        }),
        addScriptedStudy: () => ({
          applyOptions: vi.fn(),
          applyStudyOptions: vi.fn(),
        }),
        locateTrade() {},
        restoreDrawings() {},
        applyTimeScaleOptions() {},
        setVisibleLogicalRange() {},
        applyPriceScaleOptions() {},
        setVisibleRange() {},
        hasCanvas: () => false,
        render() {},
      },
    });

    expect(owner.coordinator().getChartState()).toEqual({
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
          priceAxisPosition: "right",
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
      panes: [{ height: 120, resizable: true }],
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
});
