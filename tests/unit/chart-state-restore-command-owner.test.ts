import { describe, expect, it } from "vitest";

import { createChartStateRestoreCommandOwner } from "../../src/lib/chartx/internal/views/chart-state-restore-command-owner";

describe("chart state restore command owner", () => {
  it("groups restore command callbacks behind one coordinator surface", () => {
    const log: string[] = [];
    const owner = createChartStateRestoreCommandOwner<{ id: string }, { role: string }>({
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
        return 2;
      },
      removeSecondaryPane: (paneId) => log.push(`pane-remove:${paneId}`),
      addPane: (options) => log.push(`pane-add:${options?.height}:${options?.resizable}`),
      emitPaneEvent: (type, paneId) => log.push(`pane-event:${type}:${paneId}`),
      applyMainSeriesState: (state) => log.push(`main:${state?.chartType ?? "none"}`),
      getPaneByIndex: (index) => ({ id: `pane-${index}` }),
      createPaneHandle: (paneId) => ({ id: `handle-${paneId}` }),
      addCandlestickSeries: (target) => createSeriesApi(log, `candlestick:${String(target?.pane)}`),
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
      locateTrade: (request, overlay) => log.push(`trade:${request.tradeId}:${overlay.longColor}`),
      restoreDrawings: (drawings) => log.push(`drawings:${drawings.length}`),
      applyTimeScaleOptions: (options) => log.push(`time-options:${options.barSpacing}`),
      setVisibleLogicalRange: (range) => log.push(`time-range:${range.from}:${range.to}`),
      applyPriceScaleOptions: (options) => log.push(`price-options:${options.scaleSeriesOnly}`),
      setVisibleRange: (range) => log.push(`price-range:${range?.minValue}:${range?.maxValue}`),
      hasCanvas: () => true,
      render: () => log.push("render"),
    });

    owner.applyOptions({ layout: { backgroundColor: "#111111" } } as never);
    owner.clearSelection();
    owner.clearTradeLocation();
    owner.removeSourcesWhere((source) => (source as { role: string }).role === "study");
    owner.removeDrawingByApi({ id: "drawing-api-1" });
    owner.removeDrawing({ id: "drawing-1" });
    expect(owner.getSecondarySeriesCountForPane("pane-1")).toBe(2);
    owner.removeSecondaryPane("pane-1");
    owner.addPane({ height: 120, resizable: false });
    owner.emitPaneEvent("options", "pane-1");
    owner.applyMainSeriesState({ chartType: "line" } as never);
    expect(owner.getPaneByIndex(1)).toEqual({ id: "pane-1" });
    expect(owner.createPaneTarget({ id: "pane-1" }).pane).toEqual({ id: "handle-pane-1" });
    owner.addCandlestickSeries({ pane: 1 }).setData([{}]);
    owner.addCompareSeries("pane-1").applyCompareOptions({ affectMainScale: true });
    owner.addMovingAverageStudy("pane-1").applyStudyOptions({ length: 20 });
    owner.locateTrade({
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
    owner.restoreDrawings([{ type: "horizontal-line", paneIndex: 0, options: { price: 10 } } as never]);
    owner.applyTimeScaleOptions({ barSpacing: 9 });
    owner.setVisibleLogicalRange({ from: 1, to: 5 });
    owner.applyPriceScaleOptions({ scaleSeriesOnly: true });
    owner.setVisibleRange({ minValue: 8, maxValue: 21 });
    expect(owner.hasCanvas()).toBe(true);
    owner.render();

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
      "candlestick:1:data:1",
      "compare-options:{\"affectMainScale\":true}",
      "ma-study:pane-1:{\"length\":20}",
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
