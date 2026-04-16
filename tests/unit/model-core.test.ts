import { describe, expect, it } from "vitest";

import {
  ChartContext,
  buildMovingAverageStudyData,
  createCompressedPriceBasedChartBarSequence,
  createDirectionColumnPriceBasedChartBarSequence,
  createProjectedPriceBasedChartBarSequence,
  createStudyMergeEngine,
  createTimeBasedChartBarSequence,
  findNearestRowByLogical,
  mergeStudyDataToChartContext,
  PlotRowValueIndex,
  PriceRangeImpl,
  PriceScale,
  RangeImpl,
  resolveTradeLocationState,
  resolveTradeOverlayOptions,
  SeriesDataStore,
  TimeScale,
  TimeScaleVisibleRange,
  visibleTimedValues,
  type TimedValue,
} from "../../src/lib/chartx/internal/model";

describe("model core scales and data", () => {
  it("strict visible range floors and ceils logical values", () => {
    const range = new TimeScaleVisibleRange(new RangeImpl(1.2 as never, 8.8 as never));
    const strict = range.strictRange();

    expect(strict?.left()).toBe(1);
    expect(strict?.right()).toBe(9);
  });

  it("time scale converts indexes to coordinates and back", () => {
    const scale = new TimeScale();
    scale.applyOptions({
      width: 600,
      pointCount: 60,
      barSpacing: 10,
      rightOffset: 0.5,
    });

    const coordinate = scale.indexToCoordinate(30 as never);
    const logical = scale.coordinateToLogical(coordinate);

    expect(Math.round(logical)).toBe(30);
    expect(scale.visibleStrictRange()).not.toBeNull();
  });

  it("price scale maps prices into pane coordinates", () => {
    const scale = new PriceScale();
    scale.applyOptions({
      height: 400,
      priceRange: new PriceRangeImpl(100, 200),
    });

    const top = scale.priceToCoordinate(200);
    const bottom = scale.priceToCoordinate(100);
    const midpoint = scale.coordinateToPrice(200);

    expect(top).toBe(0);
    expect(bottom).toBe(400);
    expect(midpoint).toBe(150);
  });

  it("series data store accepts empty and single-bar datasets", () => {
    const store = new SeriesDataStore<number>();

    expect(store.setData([])).toEqual([]);

    const rows = store.setData([
      { time: 1, open: 10, high: 12, low: 9, close: 11 },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].value).toEqual([10, 12, 9, 11]);
  });

  it("series data store rejects unordered bars", () => {
    const store = new SeriesDataStore<number>();

    expect(() =>
      store.setData([
        { time: 2, open: 10, high: 12, low: 9, close: 11 },
        { time: 1, open: 12, high: 13, low: 10, close: 11 },
      ]),
    ).toThrow(/strictly ordered/);
  });

  it("series data store returns a merged low/high price range", () => {
    const store = new SeriesDataStore<number>();
    const rows = store.setData([
      { time: 1, open: 10, high: 14, low: 8, close: 11 },
      { time: 2, open: 11, high: 15, low: 10, close: 14 },
      { time: 3, open: 14, high: 16, low: 12, close: 13 },
    ]);

    const range = store.priceRange(rows[0].index, rows[2].index);

    expect(range?.minValue()).toBe(8);
    expect(range?.maxValue()).toBe(16);
  });

  it("chart bar sequence keeps time-based rows as the canonical axis", () => {
    const store = new SeriesDataStore<number>();
    const rows = store.setData([
      { time: 1, open: 10, high: 12, low: 9, close: 11 },
      { time: 2, open: 11, high: 13, low: 10, close: 12 },
    ]);

    const sequence = createTimeBasedChartBarSequence(rows);

    expect(sequence.kind).toBe("time-based");
    expect(sequence.axisBars).toBe(rows);
    expect(sequence.logicalLength).toBe(2);
  });

  it("chart bar sequence can project price-based rows onto an input timeline", () => {
    const sequence = createProjectedPriceBasedChartBarSequence(
      [
        {
          index: 0 as never,
          time: 2,
          originalTime: 2,
          value: [11, 12, 11, 12],
        },
        {
          index: 1 as never,
          time: 2.001,
          originalTime: 2.001,
          value: [12, 13, 12, 13],
        },
        {
          index: 2 as never,
          time: 3,
          originalTime: 3,
          value: [13, 14, 13, 14],
        },
      ],
      [
        { time: 1, open: 10, high: 12, low: 9, close: 11 },
        { time: 2, open: 11, high: 13, low: 10, close: 12 },
        { time: 3, open: 12, high: 14, low: 11, close: 13 },
      ],
    );

    expect(sequence.kind).toBe("price-based");
    expect(sequence.axisBars.map((row) => row.index)).toEqual([0, 1, 2]);
    expect(sequence.bars.map((row) => Number(row.index.toFixed(3)))).toEqual([1.333, 1.667, 2.5]);
    expect(sequence.logicalLength).toBe(3);
  });

  it("chart bar sequence can keep price-based rows compressed as the canonical axis", () => {
    const sequence = createCompressedPriceBasedChartBarSequence([
      {
        index: 0 as never,
        time: 2,
        originalTime: 2,
        value: [11, 12, 11, 12],
      },
      {
        index: 1 as never,
        time: 2.001,
        originalTime: 2.001,
        value: [12, 13, 12, 13],
      },
    ]);

    expect(sequence.kind).toBe("price-based");
    expect(sequence.axisBars.map((row) => row.index)).toEqual([0, 1]);
    expect(sequence.bars.map((row) => row.index)).toEqual([0, 1]);
    expect(sequence.logicalLength).toBe(2);
  });

  it("chart bar sequence can collapse consecutive price-based rows into direction columns", () => {
    const sequence = createDirectionColumnPriceBasedChartBarSequence([
      {
        index: 0 as never,
        time: 2,
        originalTime: 2,
        value: [11, 12, 11, 12],
      },
      {
        index: 1 as never,
        time: 2.001,
        originalTime: 2.001,
        value: [12, 13, 12, 13],
      },
      {
        index: 2 as never,
        time: 3,
        originalTime: 3,
        value: [13, 13, 12, 12],
      },
      {
        index: 3 as never,
        time: 3.001,
        originalTime: 3.001,
        value: [12, 12, 11, 11],
      },
    ]);

    expect(sequence.bars.map((row) => row.index)).toEqual([0, 0, 1, 1]);
    expect(sequence.axisBars.map((row) => row.index)).toEqual([0, 1]);
    expect(sequence.axisBars.map((row) => row.time)).toEqual([2.001, 3.001]);
    expect(sequence.logicalLength).toBe(2);
  });

  it("finds the nearest projected row by logical index", () => {
    const row = findNearestRowByLogical(
      [
        { index: 1.333, value: 10 },
        { index: 1.667, value: 20 },
        { index: 2.5, value: 30 },
      ],
      1.6,
    );

    expect(row).toEqual({ index: 1.667, value: 20 });
  });

  it("resolves trade locations on time-based main series data", () => {
    const state = resolveTradeLocationState(
      {
        kind: "locate-trade",
        tradeId: "T-001",
        symbol: "NDX",
        entryTime: 2,
        exitTime: 4,
        entryPrice: 112,
        exitPrice: 118,
        side: "long",
        quantity: 1,
        realizedPnl: 6,
      },
      {
        chartType: "candlestick",
        inputData: [
          { time: 1, open: 100, high: 110, low: 95, close: 108 },
          { time: 2, open: 108, high: 114, low: 106, close: 112 },
          { time: 3, open: 112, high: 116, low: 109, close: 111 },
          { time: 4, open: 111, high: 119, low: 110, close: 118 },
        ],
        lineBreakOptions: { lineCount: 3 },
        renkoOptions: { boxSize: null, boxSizeMode: "auto" },
        pointFigureOptions: {
          boxSize: null,
          boxSizeMode: "auto",
          boxSizeScale: 1,
          reversalBoxes: 3,
          atrLength: 14,
          percentageValue: 1,
        },
        kagiOptions: {
          reversalMode: "auto",
          reversalSize: null,
          reversalScale: 1,
          atrLength: 14,
          percentageValue: 1,
        },
      },
      { showSpan: true, showConnector: true },
    );

    expect(state).not.toBeNull();
    expect(state?.resolvedEntryTime).toBe(2);
    expect(state?.resolvedExitTime).toBe(4);
    expect(state?.resolvedEntryLogical).toBe(1);
    expect(state?.resolvedExitLogical).toBe(3);
    expect(state?.overlay.showSpan).toBe(true);
  });

  it("resolves trade locations on point-and-figure columns with compressed logical indices", () => {
    const state = resolveTradeLocationState(
      {
        kind: "locate-trade",
        tradeId: "T-002",
        symbol: "NDX",
        entryTime: 4,
        exitTime: 7,
        entryPrice: 122,
        exitPrice: 114,
        side: "short",
        quantity: 1,
        realizedPnl: 8,
      },
      {
        chartType: "point-figure",
        inputData: [
          { time: 1, open: 100, high: 105, low: 99, close: 104 },
          { time: 2, open: 104, high: 109, low: 103, close: 108 },
          { time: 3, open: 108, high: 113, low: 107, close: 112 },
          { time: 4, open: 112, high: 123, low: 111, close: 122 },
          { time: 5, open: 122, high: 123, low: 117, close: 118 },
          { time: 6, open: 118, high: 119, low: 113, close: 114 },
          { time: 7, open: 114, high: 115, low: 109, close: 110 },
        ],
        lineBreakOptions: { lineCount: 3 },
        renkoOptions: { boxSize: null, boxSizeMode: "auto" },
        pointFigureOptions: {
          boxSize: 4,
          boxSizeMode: "fixed",
          boxSizeScale: 1,
          reversalBoxes: 2,
          atrLength: 14,
          percentageValue: 1,
        },
        kagiOptions: {
          reversalMode: "auto",
          reversalSize: null,
          reversalScale: 1,
          atrLength: 14,
          percentageValue: 1,
        },
      },
    );

    expect(state).not.toBeNull();
    expect(state?.resolvedEntryLogical).toBeLessThanOrEqual(state?.resolvedExitLogical ?? 0);
    expect(state?.overlay.showMarkers).toBe(true);
    expect(state?.request.side).toBe("short");
  });

  it("normalizes trade overlay options onto explicit defaults", () => {
    expect(resolveTradeOverlayOptions({ showSpan: false, longColor: "#123456" })).toEqual({
      fitRange: true,
      showMarkers: true,
      showSpan: false,
      showConnector: true,
      entryLabel: "Entry",
      exitLabel: "Exit",
      longColor: "#123456",
      shortColor: "#dc2626",
      spanOpacity: 0.12,
      connectorLineWidth: 2,
    });
  });

  it("chart context keeps descriptor metadata while main sources change", () => {
    const context = new ChartContext<number, string>();
    context.updateDescriptor({
      symbol: "NASDAQ:NDX",
      resolution: "1D",
      session: "regular",
      timezone: "America/New_York",
    });

    context.bindMainSource(
      "series-1",
      "candlestick",
      createTimeBasedChartBarSequence([]),
    );
    context.clearMainSource();

    expect(context.snapshot().descriptor).toEqual({
      symbol: "NASDAQ:NDX",
      resolution: "1D",
      session: "regular",
      timezone: "America/New_York",
    });
    expect(context.snapshot().mainSourceId).toBeNull();
    expect(context.snapshot().chartType).toBeNull();
  });

  it("merges requested-context study data back onto chart bars with carry-forward semantics", () => {
    const merged = mergeStudyDataToChartContext(
      [
        { time: 2, open: 20, high: 20, low: 20, close: 20 },
        { time: 4, open: 40, high: 40, low: 40, close: 40 },
      ],
      [
        { index: 0 as never, time: 1, originalTime: 1, value: [1, 1, 1, 1] },
        { index: 1 as never, time: 2, originalTime: 2, value: [2, 2, 2, 2] },
        { index: 2 as never, time: 3, originalTime: 3, value: [3, 3, 3, 3] },
        { index: 3 as never, time: 4, originalTime: 4, value: [4, 4, 4, 4] },
        { index: 4 as never, time: 5, originalTime: 5, value: [5, 5, 5, 5] },
      ],
      "carry-forward",
    );

    expect(merged).toEqual([
      { time: 2, open: 20, high: 20, low: 20, close: 20 },
      { time: 3, open: 20, high: 20, low: 20, close: 20 },
      { time: 4, open: 40, high: 40, low: 40, close: 40 },
      { time: 5, open: 40, high: 40, low: 40, close: 40 },
    ]);
  });

  it("routes requested-context merges through the study merge engine boundary", () => {
    const engine = createStudyMergeEngine();
    const axisBars = [
      { index: 0 as never, time: 1, originalTime: 1, value: [1, 1, 1, 1] as [number, number, number, number] },
      { index: 1 as never, time: 2, originalTime: 2, value: [2, 2, 2, 2] as [number, number, number, number] },
      { index: 2 as never, time: 3, originalTime: 3, value: [3, 3, 3, 3] as [number, number, number, number] },
    ];
    const inputData = [
      { time: 1, open: 10, high: 10, low: 10, close: 10 },
      { time: 3, open: 30, high: 30, low: 30, close: 30 },
    ];

    expect(engine.mergeToChartContext({ inputData, axisBars, mergePolicy: "exact" })).toEqual([
      { time: 1, open: 10, high: 10, low: 10, close: 10 },
      { time: 3, open: 30, high: 30, low: 30, close: 30 },
    ]);
    expect(engine.mergeToChartContext({ inputData, axisBars, mergePolicy: "carry-forward" })).toEqual([
      { time: 1, open: 10, high: 10, low: 10, close: 10 },
      { time: 2, open: 10, high: 10, low: 10, close: 10 },
      { time: 3, open: 30, high: 30, low: 30, close: 30 },
    ]);
  });

  it("builds a moving average study from chart-context closes", () => {
    const movingAverage = buildMovingAverageStudyData([
      { time: 1, open: 10, high: 10, low: 10, close: 10 },
      { time: 2, open: 20, high: 20, low: 20, close: 20 },
      { time: 3, open: 30, high: 30, low: 30, close: 30 },
      { time: 4, open: 40, high: 40, low: 40, close: 40 },
    ], 3);

    expect(movingAverage).toEqual([
      { time: 3, open: 20, high: 20, low: 20, close: 20 },
      { time: 4, open: 30, high: 30, low: 30, close: 30 },
    ]);
  });

  it("series data store appends a new bar through update", () => {
    const store = new SeriesDataStore<number>();
    store.setData([
      { time: 1, open: 10, high: 14, low: 8, close: 11 },
      { time: 2, open: 11, high: 15, low: 10, close: 14 },
    ]);

    const rows = store.update({ time: 3, open: 14, high: 18, low: 13, close: 17 });

    expect(rows).toHaveLength(3);
    expect(rows[2].time).toBe(3);
    expect(rows[2].value).toEqual([14, 18, 13, 17]);
  });

  it("series data store replaces the latest bar through update", () => {
    const store = new SeriesDataStore<number>();
    store.setData([
      { time: 1, open: 10, high: 14, low: 8, close: 11 },
      { time: 2, open: 11, high: 15, low: 10, close: 14 },
    ]);

    const rows = store.update({ time: 2, open: 12, high: 16, low: 11, close: 15 });

    expect(rows).toHaveLength(2);
    expect(rows[1].value).toEqual([12, 16, 11, 15]);
    expect(store.source()).toEqual([
      { time: 1, open: 10, high: 14, low: 8, close: 11 },
      { time: 2, open: 12, high: 16, low: 11, close: 15 },
    ]);
  });

  it("series data store rejects out-of-order updates", () => {
    const store = new SeriesDataStore<number>();
    store.setData([
      { time: 1, open: 10, high: 14, low: 8, close: 11 },
      { time: 2, open: 11, high: 15, low: 10, close: 14 },
    ]);

    expect(() =>
      store.update({ time: 1, open: 9, high: 13, low: 8, close: 10 }),
    ).toThrow(/append a new bar or replace the latest bar/);
  });

  it("visible timed values extends one item on both sides when requested", () => {
    const items: TimedValue[] = [
      { time: 0 as never, x: 0 as never },
      { time: 1 as never, x: 10 as never },
      { time: 2 as never, x: 20 as never },
      { time: 3 as never, x: 30 as never },
    ];

    const visible = visibleTimedValues(items, new RangeImpl(1 as never, 2 as never), true);

    expect(visible).toEqual({ from: 0, to: 4 });
  });

  it("plot list min max respects requested plot slots", () => {
    const store = new SeriesDataStore<number>();
    const rows = store.setData([
      { time: 1, open: 5, high: 8, low: 4, close: 7 },
      { time: 2, open: 7, high: 9, low: 6, close: 8 },
      { time: 3, open: 8, high: 10, low: 7, close: 9 },
    ]);

    const closeRange = store["plots"].minMaxOnRangeCached(rows[0].index, rows[2].index, [
      PlotRowValueIndex.Close,
    ]);

    expect(closeRange).toEqual({ min: 7, max: 9 });
  });
});
