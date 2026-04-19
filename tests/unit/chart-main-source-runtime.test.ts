import { describe, expect, it, vi } from "vitest";

import {
  createMainBarSequenceFromSource,
  getMainSource,
  getMainSourceOrThrow,
  refreshTradeLocation,
  syncChartContextFromMainSource,
} from "../../src/lib/chartx/internal/views/chart-main-source-runtime";

describe("chart main-source runtime use-cases", () => {
  const source = {
    id: "series-1",
    chartType: "line" as const,
    inputData: [{ time: 1, open: 10, high: 11, low: 9, close: 10 }],
    data: [{ time: 1, close: 10 }],
    builder: "line-break" as const,
    lineBreakOptions: { lineCount: 3 },
    renkoOptions: { boxSize: 2, boxSizeMode: "fixed" as const },
    pointFigureOptions: {
      boxSize: 3,
      boxSizeMode: "fixed" as const,
      boxSizeScale: 1,
      reversalBoxes: 3,
      atrLength: 14,
      percentageValue: 1,
    },
    kagiOptions: {
      reversalMode: "fixed" as const,
      reversalSize: 1,
      reversalScale: 1,
      atrLength: 14,
      percentageValue: 1,
    },
    store: {
      setData: vi.fn((data) => data),
    },
  };

  it("looks up main source and throws when it is missing", () => {
    expect(getMainSource({
      mainSourceId: () => "series-1",
      getSourceByIdAndRole: (id) => id === "series-1" ? source : undefined,
    })).toBe(source);

    expect(() =>
      getMainSourceOrThrow({
        getMainSource: () => null,
      })
    ).toThrow("chartx phase-one chart requires a primary series before this operation");
  });

  it("builds main bar sequences and syncs chart context", () => {
    const bindMainSource = vi.fn();
    const clearMainSource = vi.fn();
    const syncStudyContextData = vi.fn();
    const refreshTradeLocationFn = vi.fn();

    const sequence = createMainBarSequenceFromSource(source);
    expect(sequence.kind).toBe("price-based");

    syncChartContextFromMainSource(source, {
      clearMainSource,
      bindMainSource,
      createMainBarSequenceFromSource,
      syncStudyContextData,
      refreshTradeLocation: refreshTradeLocationFn,
    });
    expect(bindMainSource).toHaveBeenCalledWith("series-1", "line", expect.objectContaining({
      kind: "price-based",
    }));
    expect(syncStudyContextData).toHaveBeenCalledTimes(1);
    expect(refreshTradeLocationFn).toHaveBeenCalledTimes(1);

    syncChartContextFromMainSource(null, {
      clearMainSource,
      bindMainSource,
      createMainBarSequenceFromSource,
      syncStudyContextData,
      refreshTradeLocation: refreshTradeLocationFn,
    });
    expect(clearMainSource).toHaveBeenCalledTimes(1);
  });

  it("refreshes trade location and fits ranges when requested", () => {
    const setActiveTradeLocation = vi.fn();
    const setVisibleLogicalRange = vi.fn();
    const setVisiblePriceRange = vi.fn();
    const render = vi.fn();

    refreshTradeLocation({
      request: {
        kind: "locate-trade",
        tradeId: "t-1",
        symbol: "TEST",
        entryTime: 1,
        exitTime: 2,
        entryPrice: 10,
        exitPrice: 11,
        side: "long",
        quantity: 1,
        realizedPnl: 1,
      },
      options: {
        fitRange: true,
        showMarkers: true,
        showSpan: true,
        showConnector: true,
        entryLabel: "Entry",
        exitLabel: "Exit",
        longColor: "#111",
        shortColor: "#222",
        spanOpacity: 0.12,
        connectorLineWidth: 2,
      },
      state: null,
    }, {
      getMainSource: () => source,
      setActiveTradeLocation,
      setVisibleLogicalRange,
      setVisiblePriceRange,
      render,
    });

    expect(setActiveTradeLocation).toHaveBeenCalledTimes(1);
    expect(setVisibleLogicalRange).toHaveBeenCalledTimes(1);
    expect(setVisiblePriceRange).toHaveBeenCalledTimes(1);
    expect(render).not.toHaveBeenCalled();
  });
});
