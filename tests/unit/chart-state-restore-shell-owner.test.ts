import { describe, expect, it } from "vitest";

import { createChartStateRestoreShellOwner } from "../../src/lib/chartx/internal/views/chart-state-restore-shell-owner";

describe("chart state restore shell owner", () => {
  it("wraps restore command assembly behind one shell surface", () => {
    const log: string[] = [];
    const owner = createChartStateRestoreShellOwner<{ id: string }, { role: string }>({
      applyOptions: (options) => log.push(`options:${options.layout?.backgroundColor}`),
      clearSelection: () => log.push("selection:clear"),
      clearTradeLocation: () => log.push("trade:clear"),
      removeSourcesWhere: (predicate) => {
        log.push(`sources:${predicate({ role: "study" })}`);
      },
      removeDrawingByApi: (api) => log.push(`drawing-api:${(api as { id: string }).id}`),
      removeDrawing: (api) => log.push(`drawing:${(api as { id: string }).id}`),
      getSecondarySeriesCountForPane: (paneId) => {
        log.push(`series-count:${paneId}`);
        return 1;
      },
      removeSecondaryPane: (paneId) => log.push(`pane-remove:${paneId}`),
      addPane: (options) => log.push(`pane-add:${options?.height}:${options?.resizable}`),
      emitPaneEvent: (type, paneId) => log.push(`pane-event:${type}:${paneId}`),
      applyMainSeriesState: (state) => log.push(`main:${state?.chartType ?? "none"}`),
      getPaneByIndex: (index) => ({ id: `pane-${index}` }),
      createPaneHandle: (paneId) => ({ id: `handle-${paneId}` }),
      addCandlestickSeries: () => createSeriesApi(log, "candlestick"),
      addBarSeries: () => createSeriesApi(log, "bar"),
      addLineSeries: () => createSeriesApi(log, "line"),
      addAreaSeries: () => createSeriesApi(log, "area"),
      addBaselineSeries: () => createSeriesApi(log, "baseline"),
      addHistogramSeries: () => createSeriesApi(log, "histogram"),
      addVolumeSeries: () => createSeriesApi(log, "volume"),
      addOverlaySeries: (paneId) => createSeriesApi(log, `overlay:${paneId}`),
      addCompareSeries: (paneId) => ({
        ...createSeriesApi(log, `compare:${paneId}`),
        applyCompareOptions: (options) => log.push(`compare-options:${JSON.stringify(options)}`),
      }),
      addMovingAverageStudy: (paneId) => ({
        applyOptions: (options) => log.push(`ma-series:${paneId}:${JSON.stringify(options)}`),
        applyStudyOptions: (options) => log.push(`ma-study:${paneId}:${JSON.stringify(options)}`),
      }),
      addScriptedStudy: (paneId: string, _studyOptions) => ({
        applyOptions: (options: unknown) => log.push(`scripted-series:${paneId}:${JSON.stringify(options)}`),
        applyStudyOptions: (options: unknown) => log.push(`scripted-study:${paneId}:${JSON.stringify(options)}`),
      }),
      locateTrade: (request, overlay) => log.push(`trade:${request.tradeId}:${overlay.longColor}`),
      restoreDrawings: (drawings) => log.push(`drawings:${drawings.length}`),
      applyTimeScaleOptions: (options) => log.push(`time-options:${options.barSpacing}`),
      setVisibleLogicalRange: (range) => log.push(`time-range:${range.from}:${range.to}`),
      applyPriceScaleOptions: (options) => log.push(`price-options:${options.scaleSeriesOnly}`),
      setVisibleRange: (range) => log.push(`price-range:${range?.minValue}:${range?.maxValue}`),
      hasCanvas: () => true,
      render: () => log.push("render"),
    });

    const restoreCommands = owner.restoreCommands();
    restoreCommands.applyOptions({ layout: { backgroundColor: "#111111" } } as never);
    restoreCommands.clearSelection();
    restoreCommands.clearTradeLocation();
    restoreCommands.removeSourcesWhere((source) => (source as { role: string }).role === "study");
    restoreCommands.removeDrawingByApi({ id: "drawing-api-1" });
    restoreCommands.removeDrawing({ id: "drawing-1" });
    expect(restoreCommands.getSecondarySeriesCountForPane("pane-1")).toBe(1);
    restoreCommands.removeSecondaryPane("pane-1");
    restoreCommands.addPane({ height: 120, resizable: false });
    restoreCommands.emitPaneEvent("options", "pane-1");
    restoreCommands.applyMainSeriesState({ chartType: "line" } as never);
    expect(restoreCommands.getPaneByIndex(1)).toEqual({ id: "pane-1" });
    expect(restoreCommands.createPaneTarget({ id: "pane-1" }).pane).toEqual({ id: "handle-pane-1" });
    restoreCommands.addCompareSeries("pane-1").applyCompareOptions({ affectMainScale: true });
    restoreCommands.addMovingAverageStudy("pane-1").applyStudyOptions({ length: 20 });
    restoreCommands.addScriptedStudy("pane-1", {
      scriptId: "script-1",
      inputValues: {},
      inputContextMode: "chart-context",
      requestedSymbol: null,
      requestedResolution: null,
      requestedSession: null,
      requestedTimezone: null,
      mergePolicy: "carry-forward",
    }).applyStudyOptions({ scriptId: "script-1" });
    restoreCommands.locateTrade({
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
    }, {
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
    });
    restoreCommands.restoreDrawings([{ type: "horizontal-line", paneIndex: 0, options: { price: 10 } } as never]);
    restoreCommands.applyTimeScaleOptions({ barSpacing: 9 });
    restoreCommands.setVisibleLogicalRange({ from: 1, to: 5 });
    restoreCommands.applyPriceScaleOptions({ scaleSeriesOnly: true });
    restoreCommands.setVisibleRange({ minValue: 8, maxValue: 21 });
    expect(restoreCommands.hasCanvas()).toBe(true);
    restoreCommands.render();

    expect(log).toEqual([
      "options:#111111",
      "selection:clear",
      "trade:clear",
      "sources:true",
      "drawing-api:drawing-api-1",
      "drawing:drawing-1",
      "series-count:pane-1",
      "pane-remove:pane-1",
      "pane-add:120:false",
      "pane-event:options:pane-1",
      "main:line",
      "compare-options:{\"affectMainScale\":true}",
      "ma-study:pane-1:{\"length\":20}",
      "scripted-study:pane-1:{\"scriptId\":\"script-1\"}",
      "trade:trade-1:#16a34a",
      "drawings:1",
      "time-options:9",
      "time-range:1:5",
      "price-options:true",
      "price-range:8:21",
      "render",
    ]);
  });
});

function createSeriesApi(log: string[], label: string) {
  return {
    applyOptions(options: unknown) {
      log.push(`${label}:options:${JSON.stringify(options)}`);
    },
    setData(data: readonly unknown[]) {
      log.push(`${label}:data:${data.length}`);
    },
  };
}
