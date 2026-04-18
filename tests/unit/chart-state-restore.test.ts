import { describe, expect, it } from "vitest";

import { restoreChartState, type RestorableChartState } from "../../src/lib/chartx/internal/views/chart-state-restore";

type TestChartState = RestorableChartState<
  { theme: string },
  { chartType: string },
  { kind: string },
  { study: string },
  { drawing: string },
  { tradeId: string },
  { color: string }
>;

function createState(): TestChartState {
  return {
    options: { theme: "paper" },
    panes: [
      { height: 120, resizable: true },
      { height: 96, resizable: false },
    ],
    mainSeries: { chartType: "candlestick" },
    series: [{ kind: "line" }],
    studies: [{ study: "ma" }],
    drawings: [{ drawing: "hl" }],
    tradeLocation: {
      request: { tradeId: "t-1" },
      overlay: { color: "#9333ea" },
    },
    timeScale: {
      barSpacing: 12,
      rightOffset: 1.5,
      visibleLogicalRange: { from: 3, to: 8 },
    },
    priceScale: {
      visibleRange: { minValue: 100, maxValue: 150 },
      scaleSeriesOnly: true,
    },
  };
}

describe("chart state restore", () => {
  it("applies restore steps in a stable chart-state order", () => {
    const calls: string[] = [];
    const secondaryPaneIds: string[] = ["pane-old-1", "pane-old-2", "pane-old-3"];
    const paneSeriesCounts = new Map<string, number>([
      ["pane-old-1", 0],
      ["pane-old-2", 0],
      ["pane-old-3", 0],
    ]);

    restoreChartState(createState(), {
      applyOptions: () => calls.push("applyOptions"),
      clearSelection: () => calls.push("clearSelection"),
      clearDrawings: () => calls.push("clearDrawings"),
      clearStudies: () => calls.push("clearStudies"),
      clearSeries: () => calls.push("clearSeries"),
      clearTradeLocation: () => calls.push("clearTradeLocation"),
      listSecondaryPaneIds: () => [...secondaryPaneIds],
      getSecondarySeriesCountForPane: (paneId) => paneSeriesCounts.get(paneId) ?? 0,
      removeSecondaryPane: (paneId) => {
        calls.push(`remove:${paneId}`);
        const index = secondaryPaneIds.indexOf(paneId);
        if (index >= 0) {
          secondaryPaneIds.splice(index, 1);
        }
      },
      addSecondaryPane: (paneState) => {
        calls.push(`add:${paneState.height ?? "null"}:${paneState.resizable}`);
        secondaryPaneIds.push(`pane-new-${secondaryPaneIds.length + 1}`);
      },
      applySecondaryPaneState: (index, paneState) => {
        calls.push(`pane:${index}:${paneState.height ?? "null"}:${paneState.resizable}`);
      },
      applyMainSeriesState: () => calls.push("mainSeries"),
      restoreSeries: () => calls.push("series"),
      restoreStudies: () => calls.push("studies"),
      locateTrade: () => calls.push("trade"),
      restoreDrawings: () => calls.push("drawings"),
      applyTimeScaleState: () => calls.push("timeScale"),
      applyPriceScaleState: () => calls.push("priceScale"),
      finalize: () => calls.push("finalize"),
    });

    expect(calls).toEqual([
      "applyOptions",
      "clearSelection",
      "clearDrawings",
      "clearStudies",
      "clearSeries",
      "clearTradeLocation",
      "remove:pane-old-3",
      "pane:0:120:true",
      "pane:1:96:false",
      "mainSeries",
      "series",
      "studies",
      "trade",
      "drawings",
      "timeScale",
      "priceScale",
      "finalize",
    ]);
  });

  it("rejects removing excess panes while series are still attached", () => {
    const secondaryPaneIds = ["pane-old-1", "pane-old-2", "pane-old-3"];

    expect(() =>
      restoreChartState(createState(), {
        applyOptions: () => {},
        clearSelection: () => {},
        clearDrawings: () => {},
        clearStudies: () => {},
        clearSeries: () => {},
        clearTradeLocation: () => {},
        listSecondaryPaneIds: () => [...secondaryPaneIds],
        getSecondarySeriesCountForPane: (paneId) => (paneId === "pane-old-3" ? 1 : 0),
        removeSecondaryPane: () => {},
        addSecondaryPane: () => {},
        applySecondaryPaneState: () => {},
        applyMainSeriesState: () => {},
        restoreSeries: () => {},
        restoreStudies: () => {},
        locateTrade: () => {},
        restoreDrawings: () => {},
        applyTimeScaleState: () => {},
        applyPriceScaleState: () => {},
        finalize: () => {},
      }),
    ).toThrow("chartx phase-one chart cannot remove snapshot-excess panes while series are attached");
  });
});
