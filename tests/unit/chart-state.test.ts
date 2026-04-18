import { describe, expect, it } from "vitest";

import {
  applyValidatedChartState,
  createChartStateSnapshot,
  type ChartStateSnapshotDependencies,
} from "../../src/lib/chartx/internal/views/chart-state";

describe("chart state use-case", () => {
  it("builds a chart-state snapshot from dependency getters", () => {
    const snapshot = createChartStateSnapshot({
      getOptions: () => ({ theme: "paper" }),
      getTimeScaleState: () => ({
        barSpacing: 12,
        rightOffset: 1,
        visibleLogicalRange: { from: 2, to: 8 },
      }),
      getPriceScaleState: () => ({
        visibleRange: { minValue: 100, maxValue: 120 },
        scaleSeriesOnly: true,
      }),
      getPanesState: () => [{ height: 120, resizable: true }],
      getMainSeriesState: () => ({ chartType: "candlestick" }),
      getSeriesState: () => [{ kind: "line" }],
      getStudiesState: () => [{ type: "moving-average" }],
      getTradeLocationState: () => ({
        request: { tradeId: "t-1" },
        overlay: { color: "#3b82f6" },
      }),
      getDrawingsState: () => [{ type: "horizontal-line" }],
    } satisfies ChartStateSnapshotDependencies<
      { theme: string },
      { chartType: string },
      { kind: string },
      { type: string },
      { type: string },
      { tradeId: string },
      { color: string }
    >);

    expect(snapshot).toEqual({
      options: { theme: "paper" },
      timeScale: {
        barSpacing: 12,
        rightOffset: 1,
        visibleLogicalRange: { from: 2, to: 8 },
      },
      priceScale: {
        visibleRange: { minValue: 100, maxValue: 120 },
        scaleSeriesOnly: true,
      },
      panes: [{ height: 120, resizable: true }],
      mainSeries: { chartType: "candlestick" },
      series: [{ kind: "line" }],
      studies: [{ type: "moving-average" }],
      tradeLocation: {
        request: { tradeId: "t-1" },
        overlay: { color: "#3b82f6" },
      },
      drawings: [{ type: "horizontal-line" }],
    });
  });

  it("validates drawings before forwarding to restore dependencies", () => {
    const calls: string[] = [];
    const secondaryPaneIds: string[] = [];
    const state = {
      options: { theme: "paper" },
      panes: [{ height: 120, resizable: true }],
      mainSeries: null,
      series: [{ kind: "line" }],
      studies: [{ study: "ma" }],
      drawings: [{ type: "horizontal-line" }],
      tradeLocation: null,
      timeScale: {
        barSpacing: 12,
        rightOffset: 1,
        visibleLogicalRange: { from: 2, to: 8 },
      },
      priceScale: {
        visibleRange: { minValue: 100, maxValue: 120 },
        scaleSeriesOnly: true,
      },
    };

    applyValidatedChartState(state, {
      validateDrawings: (drawings, paneCount) => {
        calls.push(`validate:${drawings.length}:${paneCount}`);
      },
      restoreDeps: {
        applyOptions: () => calls.push("applyOptions"),
        clearSelection: () => calls.push("clearSelection"),
        clearDrawings: () => calls.push("clearDrawings"),
        clearStudies: () => calls.push("clearStudies"),
        clearSeries: () => calls.push("clearSeries"),
        clearTradeLocation: () => calls.push("clearTradeLocation"),
        listSecondaryPaneIds: () => [...secondaryPaneIds],
        getSecondarySeriesCountForPane: () => 0,
        removeSecondaryPane: () => calls.push("removePane"),
        addSecondaryPane: () => {
          calls.push("addPane");
          secondaryPaneIds.push(`pane-${secondaryPaneIds.length + 1}`);
        },
        applySecondaryPaneState: () => calls.push("applyPane"),
        applyMainSeriesState: () => calls.push("mainSeries"),
        restoreSeries: () => calls.push("series"),
        restoreStudies: () => calls.push("studies"),
        locateTrade: () => calls.push("trade"),
        restoreDrawings: () => calls.push("drawings"),
        applyTimeScaleState: () => calls.push("timeScale"),
        applyPriceScaleState: () => calls.push("priceScale"),
        finalize: () => calls.push("finalize"),
      },
    });

    expect(calls).toEqual([
      "validate:1:1",
      "applyOptions",
      "clearSelection",
      "clearDrawings",
      "clearStudies",
      "clearSeries",
      "clearTradeLocation",
      "addPane",
      "applyPane",
      "series",
      "studies",
      "drawings",
      "timeScale",
      "priceScale",
      "finalize",
    ]);
  });
});
