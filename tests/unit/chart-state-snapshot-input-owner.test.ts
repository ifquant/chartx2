import { describe, expect, it } from "vitest";

import { INVALID_DRAWING_PANE_INDEX_ERROR } from "../../src/lib/chartx/internal/views/chart-drawing-restore";
import { createChartStateSnapshotInputOwner } from "../../src/lib/chartx/internal/views/chart-state-snapshot-input-owner";
import type { PhaseOneChartStateSnapshot } from "../../src/lib/chartx/internal/views/chart-harness";

describe("chart state snapshot input owner", () => {
  it("groups chart options, scale state, drawings, and trade-location state", () => {
    const drawings = [{
      id: "drawing-1",
      magnetEnabled: false,
      magnetSources: { high: false },
    }];
    const owner = createChartStateSnapshotInputOwner({
      getLayoutOptions: () => ({
        backgroundColor: "#101010",
        paneBackgroundColor: "#111111",
        gridColor: "#222222",
        frameColor: "#333333",
        axisTextColor: "#444444",
        axisLabelBackground: "#555555",
        axisLabelBorder: "#666666",
        axisActiveBackground: "#777777",
        axisActiveText: "#888888",
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
        request: {
          kind: "locate-trade",
          tradeId: "trade-1",
          symbol: "rb2401",
          entryTime: 1,
          exitTime: 2,
          entryPrice: 100,
          exitPrice: 110,
          side: "long",
          quantity: 1,
          realizedPnl: 10,
        },
        options: {
          fitRange: true,
          showMarkers: true,
          showSpan: true,
          showConnector: true,
          entryLabel: "Entry",
          exitLabel: "Exit",
          longColor: "#16a34a",
          shortColor: "#dc2626",
          spanOpacity: 0.12,
          connectorLineWidth: 2,
        },
      }),
      listDrawings: () => drawings,
      getDrawingOptions: () => ({
        magnetEnabled: true,
        magnetTolerancePx: 8,
        timeMagnetEnabled: true,
        timeMagnetPolicy: "nearest",
        timeMagnetTolerancePx: 10,
        magnetSources: {
          open: true,
          high: true,
          low: true,
          close: true,
        },
      }),
    });

    expect(owner.getOptions().layout.backgroundColor).toBe("#101010");
    expect(owner.getTimeScaleState()).toEqual({
      barSpacing: 12,
      rightOffset: 3,
      visibleLogicalRange: { from: 1, to: 8 },
    });
    expect(owner.getPriceScaleState()).toEqual({
      visibleRange: { minValue: 100, maxValue: 200 },
      scaleSeriesOnly: true,
    });
    expect(owner.getTradeLocationState()?.request.tradeId).toBe("trade-1");
    expect(owner.listDrawings()).toBe(drawings);
    expect(owner.resolveDrawingMagnetOptions(drawings[0])).toMatchObject({
      magnetEnabled: false,
      magnetSources: {
        open: true,
        high: false,
        low: true,
        close: true,
      },
    });
  });

  it("validates restored drawing pane targets through the shared drawing validator", () => {
    const owner = createChartStateSnapshotInputOwner({
      getLayoutOptions: () => ({} as never),
      getCrosshairOptions: () => ({} as never),
      getBarSpacing: () => null,
      getRightOffset: () => 0,
      getVisibleLogicalRange: () => null,
      getVisiblePriceRange: () => null,
      getPrimaryScaleSeriesOnly: () => false,
      getActiveTradeLocation: () => null,
      listDrawings: () => [],
      getDrawingOptions: () => ({
        magnetEnabled: true,
        magnetTolerancePx: 8,
        timeMagnetEnabled: true,
        timeMagnetPolicy: "nearest",
        timeMagnetTolerancePx: 10,
        magnetSources: {
          open: true,
          high: true,
          low: true,
          close: true,
        },
      }),
    });

    const drawings = [{
      type: "horizontal-line",
      paneIndex: 2,
      options: { price: 10, lineWidth: 1 },
    }] as PhaseOneChartStateSnapshot["drawings"];

    expect(() => owner.validateDrawings(drawings, 1)).toThrow(INVALID_DRAWING_PANE_INDEX_ERROR);
  });
});
