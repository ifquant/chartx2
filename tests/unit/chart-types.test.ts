import { describe, expect, it } from "vitest";

import {
  applyMainSeriesBuilder,
  createDirectionColumnPriceBasedChartBarSequence,
  createMainSeriesStateSnapshot,
  createPlotRows,
  applyMainSeriesStyleOptions,
  buildHeikinAshiData,
  inferAverageTrueRange,
  inferPercentageBoxSize,
  inferTraditionalPointFigureBoxSize,
  buildKagiData,
  buildLineBreakData,
  buildPointFigureData,
  buildRenkoData,
  buildMovingAverageStudyData,
  createVersionedChartTemplate,
  mainSeriesChartTypeSpec,
  mainSeriesStyleSchemaSpec,
  mergeStudyDataToChartContext,
  normalizeVersionedChartTemplate,
  projectMainSeriesStyleOptions,
} from "../../src/lib/chartx/internal/model";
import { MAIN_SERIES_RENDERERS } from "../../src/lib/chartx/internal/renderers";

describe("chart type builders", () => {
  it("maps main chart types through a unified chart-type registry", () => {
    expect(mainSeriesChartTypeSpec("renko")).toEqual({
      inputCapability: "ohlcv",
      builder: "renko",
      renderer: "brick",
      styleSchemaId: "renkoStyle",
    });
    expect(mainSeriesChartTypeSpec("point-figure")).toEqual({
      inputCapability: "ohlcv",
      builder: "point-figure",
      renderer: "point-figure",
      styleSchemaId: "pnfStyle",
    });
    expect(mainSeriesChartTypeSpec("line-markers")).toEqual({
      inputCapability: "c",
      builder: "time-bars",
      renderer: "line-markers",
      styleSchemaId: "lineWithMarkersStyle",
    });
  });

  it("routes main-series builder execution through a unified builder registry", () => {
    const input = [
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
    ] as const;

    expect(
      applyMainSeriesBuilder("heikin-ashi", input, {
        lineBreakOptions: { lineCount: 3 },
        renkoOptions: { boxSize: null, boxSizeMode: "auto" },
        pointFigureOptions: { boxSize: null, boxSizeMode: "auto", boxSizeScale: 1, reversalBoxes: 3, atrLength: 14, percentageValue: 1 },
        kagiOptions: { reversalMode: "auto", reversalSize: null, reversalScale: 1, atrLength: 14, percentageValue: 1 },
      }),
    ).toEqual(buildHeikinAshiData(input));

    expect(
      applyMainSeriesBuilder("time-bars", input, {
        lineBreakOptions: { lineCount: 3 },
        renkoOptions: { boxSize: null, boxSizeMode: "auto" },
        pointFigureOptions: { boxSize: null, boxSizeMode: "auto", boxSizeScale: 1, reversalBoxes: 3, atrLength: 14, percentageValue: 1 },
        kagiOptions: { reversalMode: "auto", reversalSize: null, reversalScale: 1, atrLength: 14, percentageValue: 1 },
      }),
    ).toEqual(input);
  });

  it("routes main-series renderer lookup through a unified renderer registry", () => {
    expect(typeof MAIN_SERIES_RENDERERS.candles).toBe("function");
    expect(typeof MAIN_SERIES_RENDERERS["point-figure"]).toBe("function");
    expect(typeof MAIN_SERIES_RENDERERS.kagi).toBe("function");
    expect(typeof MAIN_SERIES_RENDERERS["line-markers"]).toBe("function");
    expect(typeof MAIN_SERIES_RENDERERS.columns).toBe("function");
  });

  it("captures main-series chart type, style options, and builder-specific state in one snapshot", () => {
    expect(
      createMainSeriesStateSnapshot({
        chartType: "renko",
        options: {
          upColor: "#11aa66",
          downColor: "#dd5544",
          wickColor: "#222222",
          renkoBoxSize: 24,
          renkoBoxSizeMode: "fixed",
          ignored: "nope",
        },
        lineBreakOptions: {
          lineCount: 3,
        },
        renkoOptions: {
          boxSize: 24,
          boxSizeMode: "fixed",
        },
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
      }),
    ).toEqual({
      chartType: "renko",
      inputCapability: "ohlcv",
      builder: "renko",
      renderer: "brick",
      styleSchemaId: "renkoStyle",
      styleOptionSurface: "candlestick",
      styleOptions: {
        upColor: "#11aa66",
        downColor: "#dd5544",
        wickColor: "#222222",
        renkoBoxSize: 24,
        renkoBoxSizeMode: "fixed",
      },
      lineBreakOptions: {
        lineCount: 3,
      },
      renkoOptions: {
        boxSize: 24,
        boxSizeMode: "fixed",
      },
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
    });
  });

  it("normalizes versioned chart templates while keeping backward compatibility with raw chart state", () => {
    const rawState = {
      options: {
        layout: {
          backgroundColor: "#fffdf7",
          paneBackgroundColor: "#fffaf0",
          gridColor: "rgba(16, 16, 16, 0.08)",
        },
        crosshair: {
          lineColor: "rgba(16, 16, 16, 0.5)",
          pointColor: "#101010",
        },
      },
      timeScale: {
        barSpacing: 12,
        rightOffset: 1,
        visibleLogicalRange: { from: 1, to: 8 },
      },
      priceScale: {
        visibleRange: { minValue: 100, maxValue: 140 },
        scaleSeriesOnly: false,
      },
      panes: [{ height: 112, resizable: true }],
      mainSeries: null,
      series: [],
      studies: [],
      drawings: [],
    };

    expect(createVersionedChartTemplate(rawState)).toEqual({
      kind: "chart-template",
      version: 1,
      chart: rawState,
    });

    expect(normalizeVersionedChartTemplate(rawState)).toEqual({
      kind: "chart-template",
      version: 1,
      chart: rawState,
    });

    expect(
      normalizeVersionedChartTemplate({
        kind: "chart-template",
        version: 1,
        chart: rawState,
      }),
    ).toEqual({
      kind: "chart-template",
      version: 1,
      chart: rawState,
    });
  });

  it("applies style-specific main-series options through the model-layer style registry", () => {
    const styleTarget = {
      lineBreakOptions: {
        lineCount: 3,
      },
      renkoOptions: {
        boxSize: null,
        boxSizeMode: "auto" as const,
      },
      pointFigureOptions: {
        boxSize: null,
        boxSizeMode: "auto" as const,
        boxSizeScale: 1,
        reversalBoxes: 3,
        atrLength: 14,
        percentageValue: 1,
      },
      kagiOptions: {
        reversalMode: "auto" as const,
        reversalSize: null,
        reversalScale: 1,
        atrLength: 14,
        percentageValue: 1,
      },
    };

    expect(
      applyMainSeriesStyleOptions("renkoStyle", styleTarget, {
        renkoBoxSizeMode: "fixed",
        renkoBoxSize: 12,
      }),
    ).toBe(true);
    expect(styleTarget.renkoOptions).toEqual({
      boxSize: 12,
      boxSizeMode: "fixed",
    });

    expect(
      applyMainSeriesStyleOptions("lineBreakStyle", styleTarget, {
        lineBreakCount: 5,
      }),
    ).toBe(true);
    expect(styleTarget.lineBreakOptions).toEqual({
      lineCount: 5,
    });

    expect(
      applyMainSeriesStyleOptions("pnfStyle", styleTarget, {
        pointFigureBoxSizeMode: "fixed",
        pointFigureBoxSize: 24,
        pointFigureBoxSizeScale: 1.5,
        pointFigureReversalBoxes: 5,
        pointFigureAtrLength: 21,
        pointFigurePercentageValue: 1.8,
      }),
    ).toBe(true);
    expect(styleTarget.pointFigureOptions).toEqual({
      boxSize: 24,
      boxSizeMode: "fixed",
      boxSizeScale: 1.5,
      reversalBoxes: 5,
      atrLength: 21,
      percentageValue: 1.8,
    });

    expect(
      applyMainSeriesStyleOptions("kagiStyle", styleTarget, {
        kagiReversalMode: "atr",
        kagiReversalScale: 1.4,
        kagiAtrLength: 21,
        kagiPercentageValue: 1.8,
      }),
    ).toBe(true);
    expect(styleTarget.kagiOptions).toEqual({
      reversalMode: "atr",
      reversalSize: null,
      reversalScale: 1.4,
      atrLength: 21,
      percentageValue: 1.8,
    });
  });

  it("maps style schemas to explicit option surfaces and type-specific keys", () => {
    expect(mainSeriesStyleSchemaSpec("renkoStyle")).toEqual({
      optionSurface: "candlestick",
      optionKeys: ["upColor", "downColor", "wickColor", "renkoBoxSize", "renkoBoxSizeMode"],
      typeSpecificOptionKeys: ["renkoBoxSize", "renkoBoxSizeMode"],
    });
    expect(mainSeriesStyleSchemaSpec("pnfStyle")).toEqual({
      optionSurface: "candlestick",
      optionKeys: [
        "upColor",
        "downColor",
        "wickColor",
        "pointFigureBoxSize",
        "pointFigureBoxSizeMode",
        "pointFigureBoxSizeScale",
        "pointFigureReversalBoxes",
        "pointFigureAtrLength",
        "pointFigurePercentageValue",
      ],
      typeSpecificOptionKeys: [
        "pointFigureBoxSize",
        "pointFigureBoxSizeMode",
        "pointFigureBoxSizeScale",
        "pointFigureReversalBoxes",
        "pointFigureAtrLength",
        "pointFigurePercentageValue",
      ],
    });
    expect(mainSeriesStyleSchemaSpec("kagiStyle")).toEqual({
      optionSurface: "line",
      optionKeys: [
        "color",
        "lineWidth",
        "kagiYangColor",
        "kagiYinColor",
        "kagiYangLineWidth",
        "kagiYinLineWidth",
        "kagiReversalMode",
        "kagiReversalSize",
        "kagiReversalScale",
        "kagiAtrLength",
        "kagiPercentageValue",
      ],
      typeSpecificOptionKeys: [
        "kagiYangColor",
        "kagiYinColor",
        "kagiYangLineWidth",
        "kagiYinLineWidth",
        "kagiReversalMode",
        "kagiReversalSize",
        "kagiReversalScale",
        "kagiAtrLength",
        "kagiPercentageValue",
      ],
    });
    expect(mainSeriesStyleSchemaSpec("lineStyle")).toEqual({
      optionSurface: "line",
      optionKeys: ["color", "lineWidth"],
      typeSpecificOptionKeys: [],
    });
  });

  it("projects shared style options across chart-type schema switches while dropping incompatible fields", () => {
    expect(
      projectMainSeriesStyleOptions(
        "candleStyle",
        "renkoStyle",
        {
          upColor: "#11aa66",
          downColor: "#dd5544",
          wickColor: "#222222",
        },
        {
          upColor: "#0c8f62",
          downColor: "#c7543e",
          wickColor: "rgba(16, 16, 16, 0.72)",
          renkoBoxSize: null,
          renkoBoxSizeMode: "auto",
        },
      ),
    ).toEqual({
      upColor: "#11aa66",
      downColor: "#dd5544",
      wickColor: "#222222",
      renkoBoxSize: null,
      renkoBoxSizeMode: "auto",
    });

    expect(
      projectMainSeriesStyleOptions(
        "renkoStyle",
        "lineStyle",
        {
          upColor: "#11aa66",
          downColor: "#dd5544",
          wickColor: "#222222",
          renkoBoxSize: 24,
          renkoBoxSizeMode: "fixed",
        },
        {
          color: "#3f6fd8",
          lineWidth: 2,
        },
      ),
    ).toEqual({
      color: "#3f6fd8",
      lineWidth: 2,
    });
  });

  it("builds heikin-ashi bars from canonical ohlc input without mutating the source", () => {
    const input = [
      { time: 1, open: 100, high: 110, low: 90, close: 104 },
      { time: 2, open: 108, high: 120, low: 106, close: 118 },
      { time: 3, open: 116, high: 119, low: 100, close: 102 },
    ] as const;

    const result = buildHeikinAshiData(input);

    expect(result).toEqual([
      { time: 1, open: 102, high: 110, low: 90, close: 101 },
      { time: 2, open: 101.5, high: 120, low: 101.5, close: 113 },
      { time: 3, open: 107.25, high: 119, low: 100, close: 109.25 },
    ]);
    expect(input).toEqual([
      { time: 1, open: 100, high: 110, low: 90, close: 104 },
      { time: 2, open: 108, high: 120, low: 106, close: 118 },
      { time: 3, open: 116, high: 119, low: 100, close: 102 },
    ]);
  });

  it("builds renko bricks from canonical ohlc input without mutating the source", () => {
    const input = [
      { time: 1, open: 99, high: 101, low: 98, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 113, low: 107, close: 112 },
      { time: 5, open: 112, high: 113, low: 103, close: 104 },
    ] as const;

    const result = buildRenkoData(input);

    expect(result).toEqual([
      { time: 3, open: 100, high: 105, low: 100, close: 105 },
      { time: 4, open: 105, high: 110, low: 105, close: 110 },
      { time: 5, open: 110, high: 110, low: 105, close: 105 },
    ]);
    expect(input).toEqual([
      { time: 1, open: 99, high: 101, low: 98, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 113, low: 107, close: 112 },
      { time: 5, open: 112, high: 113, low: 103, close: 104 },
    ]);
  });

  it("builds renko bricks with a fixed box size when provided", () => {
    const input = [
      { time: 1, open: 99, high: 101, low: 98, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 113, low: 107, close: 112 },
      { time: 5, open: 112, high: 113, low: 103, close: 104 },
    ] as const;

    const result = buildRenkoData(input, {
      boxSizeMode: "fixed",
      boxSize: 4,
    });

    expect(result).toEqual([
      { time: 2, open: 100, high: 104, low: 100, close: 104 },
      { time: 3, open: 104, high: 108, low: 104, close: 108 },
      { time: 4, open: 108, high: 112, low: 108, close: 112 },
      { time: 5, open: 112, high: 112, low: 108, close: 108 },
      { time: 5.001, open: 108, high: 108, low: 104, close: 104 },
    ]);
  });

  it("merges requested-context moving-average data onto renko chart bars with deterministic parity", () => {
    const input = [
      { time: 1, open: 99, high: 101, low: 98, close: 100 },
      { time: 2, open: 100, high: 109, low: 99, close: 108 },
      { time: 3, open: 108, high: 113, low: 107, close: 112 },
      { time: 4, open: 112, high: 113, low: 103, close: 104 },
    ] as const;
    const requested = [
      { time: 2, open: 200, high: 200, low: 200, close: 200 },
      { time: 3, open: 260, high: 260, low: 260, close: 260 },
      { time: 4, open: 300, high: 300, low: 300, close: 300 },
    ] as const;

    const renkoBars = buildRenkoData(input, {
      boxSizeMode: "fixed",
      boxSize: 4,
    });
    const merged = mergeStudyDataToChartContext(requested, createPlotRows(renkoBars), "carry-forward");
    const movingAverage = buildMovingAverageStudyData(merged, 2);

    expect(renkoBars).toEqual([
      { time: 2, open: 100, high: 104, low: 100, close: 104 },
      { time: 2.001, open: 104, high: 108, low: 104, close: 108 },
      { time: 3, open: 108, high: 112, low: 108, close: 112 },
      { time: 4, open: 112, high: 112, low: 108, close: 108 },
      { time: 4.001, open: 108, high: 108, low: 104, close: 104 },
    ]);
    expect(merged).toEqual([
      { time: 2, open: 200, high: 200, low: 200, close: 200 },
      { time: 2.001, open: 200, high: 200, low: 200, close: 200 },
      { time: 3, open: 260, high: 260, low: 260, close: 260 },
      { time: 4, open: 300, high: 300, low: 300, close: 300 },
      { time: 4.001, open: 300, high: 300, low: 300, close: 300 },
    ]);
    expect(movingAverage).toEqual([
      { time: 2.001, open: 200, high: 200, low: 200, close: 200 },
      { time: 3, open: 230, high: 230, low: 230, close: 230 },
      { time: 4, open: 280, high: 280, low: 280, close: 280 },
      { time: 4.001, open: 300, high: 300, low: 300, close: 300 },
    ]);
  });

  it("builds line-break bars from canonical ohlc input without mutating the source", () => {
    const input = [
      { time: 1, open: 100, high: 104, low: 99, close: 102 },
      { time: 2, open: 102, high: 108, low: 101, close: 106 },
      { time: 3, open: 106, high: 109, low: 105, close: 108 },
      { time: 4, open: 108, high: 111, low: 107, close: 110 },
      { time: 5, open: 110, high: 111, low: 102, close: 103 },
      { time: 6, open: 103, high: 104, low: 97, close: 98 },
    ] as const;

    const result = buildLineBreakData(input);

    expect(result).toEqual([
      { time: 1, open: 100, high: 104, low: 99, close: 102 },
      { time: 2, open: 102, high: 106, low: 102, close: 106, volume: undefined },
      { time: 3, open: 106, high: 108, low: 106, close: 108, volume: undefined },
      { time: 4, open: 108, high: 110, low: 108, close: 110, volume: undefined },
      { time: 5, open: 110, high: 110, low: 103, close: 103, volume: undefined },
      { time: 6, open: 103, high: 103, low: 98, close: 98, volume: undefined },
    ]);
    expect(input).toEqual([
      { time: 1, open: 100, high: 104, low: 99, close: 102 },
      { time: 2, open: 102, high: 108, low: 101, close: 106 },
      { time: 3, open: 106, high: 109, low: 105, close: 108 },
      { time: 4, open: 108, high: 111, low: 107, close: 110 },
      { time: 5, open: 110, high: 111, low: 102, close: 103 },
      { time: 6, open: 103, high: 104, low: 97, close: 98 },
    ]);
  });

  it("merges requested-context moving-average data onto line-break chart bars with deterministic parity", () => {
    const input = [
      { time: 1, open: 100, high: 104, low: 99, close: 102 },
      { time: 2, open: 102, high: 108, low: 101, close: 106 },
      { time: 3, open: 106, high: 109, low: 105, close: 108 },
      { time: 4, open: 108, high: 111, low: 107, close: 110 },
      { time: 5, open: 110, high: 111, low: 102, close: 103 },
      { time: 6, open: 103, high: 104, low: 97, close: 98 },
    ] as const;
    const requested = [
      { time: 2, open: 200, high: 200, low: 200, close: 200 },
      { time: 4, open: 240, high: 240, low: 240, close: 240 },
      { time: 6, open: 300, high: 300, low: 300, close: 300 },
    ] as const;

    const lineBreakBars = buildLineBreakData(input, 3);
    const merged = mergeStudyDataToChartContext(requested, createPlotRows(lineBreakBars), "carry-forward");
    const movingAverage = buildMovingAverageStudyData(merged, 2);

    expect(lineBreakBars).toEqual([
      { time: 1, open: 100, high: 104, low: 99, close: 102 },
      { time: 2, open: 102, high: 106, low: 102, close: 106, volume: undefined },
      { time: 3, open: 106, high: 108, low: 106, close: 108, volume: undefined },
      { time: 4, open: 108, high: 110, low: 108, close: 110, volume: undefined },
      { time: 5, open: 110, high: 110, low: 103, close: 103, volume: undefined },
      { time: 6, open: 103, high: 103, low: 98, close: 98, volume: undefined },
    ]);
    expect(merged).toEqual([
      { time: 2, open: 200, high: 200, low: 200, close: 200 },
      { time: 3, open: 200, high: 200, low: 200, close: 200 },
      { time: 4, open: 240, high: 240, low: 240, close: 240 },
      { time: 5, open: 240, high: 240, low: 240, close: 240 },
      { time: 6, open: 300, high: 300, low: 300, close: 300 },
    ]);
    expect(movingAverage).toEqual([
      { time: 3, open: 200, high: 200, low: 200, close: 200 },
      { time: 4, open: 220, high: 220, low: 220, close: 220 },
      { time: 5, open: 240, high: 240, low: 240, close: 240 },
      { time: 6, open: 270, high: 270, low: 270, close: 270 },
    ]);
  });

  it("builds point-figure boxes from canonical ohlc input without mutating the source", () => {
    const input = [
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 113, low: 107, close: 112 },
      { time: 5, open: 112, high: 113, low: 103, close: 104 },
    ] as const;

    const result = buildPointFigureData(input, {
      boxSizeMode: "fixed",
      boxSize: 5.4,
      boxSizeScale: 1,
      reversalBoxes: 3,
      atrLength: 14,
      percentageValue: 1,
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ time: 3, open: 100, low: 100, close: 105.4 });
    expect(result[0]?.high).toBeCloseTo(105.4, 6);
    expect(result[1]).toMatchObject({ time: 4, open: 105.4, low: 105.4 });
    expect(result[1]?.high).toBeCloseTo(110.8, 6);
    expect(result[1]?.close).toBeCloseTo(110.8, 6);
    expect(input).toEqual([
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 113, low: 107, close: 112 },
      { time: 5, open: 112, high: 113, low: 103, close: 104 },
    ]);
  });

  it("builds point-figure boxes with a fixed box size when provided", () => {
    const input = [
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 113, low: 107, close: 112 },
      { time: 5, open: 112, high: 113, low: 103, close: 104 },
    ] as const;

    const result = buildPointFigureData(input, {
      boxSizeMode: "fixed",
      boxSize: 4,
      boxSizeScale: 1,
      reversalBoxes: 3,
      atrLength: 14,
      percentageValue: 1,
    });

    expect(result).toEqual([
      { time: 2, open: 100, high: 104, low: 100, close: 104, volume: undefined },
      { time: 3, open: 104, high: 108, low: 104, close: 108, volume: undefined },
      { time: 4, open: 108, high: 112, low: 108, close: 112, volume: undefined },
    ]);
  });

  it("derives point-figure box sizes from ATR and percentage modes", () => {
    const input = [
      { time: 1, open: 100, high: 106, low: 99, close: 104 },
      { time: 2, open: 104, high: 112, low: 103, close: 110 },
      { time: 3, open: 110, high: 118, low: 108, close: 116 },
      { time: 4, open: 116, high: 117, low: 104, close: 106 },
      { time: 5, open: 106, high: 108, low: 97, close: 100 },
    ] as const;

    expect(inferAverageTrueRange(input, 3)).toBeGreaterThan(0);
    expect(inferPercentageBoxSize(input, 1.5)).toBe(1.5);

    const atrResult = buildPointFigureData(input, {
      boxSize: null,
      boxSizeMode: "atr",
      boxSizeScale: 1,
      reversalBoxes: 3,
      atrLength: 3,
      percentageValue: 1,
    });
    const percentageResult = buildPointFigureData(input, {
      boxSize: null,
      boxSizeMode: "percentage",
      boxSizeScale: 1,
      reversalBoxes: 3,
      atrLength: 14,
      percentageValue: 1.5,
    });

    expect(atrResult.length).toBeGreaterThan(0);
    expect(percentageResult.length).toBeGreaterThan(0);
    expect(atrResult).not.toEqual(percentageResult);
  });

  it("keeps auto point-figure sizing in a readable default column range", () => {
    const input = Array.from({ length: 96 }, (_, index) => {
      const base = 18_000 + Math.sin(index / 4.5) * 260 + Math.cos(index / 8) * 410;
      const close = base + Math.sin(index / 2.8) * 90;
      return {
        time: index + 1,
        open: close - 55,
        high: close + 95 + (index % 3) * 12,
        low: close - 105 - (index % 4) * 10,
        close,
      };
    });

    const result = buildPointFigureData(input, {
      boxSize: null,
      boxSizeMode: "auto",
      boxSizeScale: 1,
      reversalBoxes: 3,
      atrLength: 14,
      percentageValue: 1,
    });
    const logicalLength = createDirectionColumnPriceBasedChartBarSequence(createPlotRows(result)).logicalLength;

    expect(result.length).toBeGreaterThan(0);
    expect(logicalLength).toBeGreaterThanOrEqual(12);
    expect(logicalLength).toBeLessThanOrEqual(36);
  });

  it("merges requested-context moving-average data onto kagi segments with deterministic parity", () => {
    const input = [
      { time: 1, open: 99, high: 101, low: 98, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 109, low: 103, close: 104 },
      { time: 5, open: 104, high: 105, low: 99, close: 100 },
      { time: 6, open: 100, high: 105, low: 99, close: 104 },
      { time: 7, open: 104, high: 109, low: 103, close: 108 },
    ] as const;
    const requested = [
      { time: 2, open: 200, high: 200, low: 200, close: 200 },
      { time: 5, open: 240, high: 240, low: 240, close: 240 },
      { time: 7, open: 300, high: 300, low: 300, close: 300 },
    ] as const;

    const kagiSegments = buildKagiData(input);
    const merged = mergeStudyDataToChartContext(requested, createPlotRows(kagiSegments), "carry-forward");
    const movingAverage = buildMovingAverageStudyData(merged, 2);

    expect(kagiSegments).toEqual([
      { time: 3, open: 100, high: 109, low: 100, close: 109, volume: undefined },
      { time: 5.001, open: 109, high: 109, low: 99, close: 99, volume: undefined },
      { time: 7.001, open: 99, high: 109, low: 99, close: 109, volume: undefined },
    ]);
    expect(merged).toEqual([
      { time: 3, open: 200, high: 200, low: 200, close: 200 },
      { time: 5.001, open: 240, high: 240, low: 240, close: 240 },
      { time: 7.001, open: 300, high: 300, low: 300, close: 300 },
    ]);
    expect(movingAverage).toEqual([
      { time: 5.001, open: 220, high: 220, low: 220, close: 220 },
      { time: 7.001, open: 270, high: 270, low: 270, close: 270 },
    ]);
  });

  it("derives a traditional point-figure box size from price magnitude", () => {
    const input = [
      { time: 1, open: 18_100, high: 18_180, low: 18_020, close: 18_150 },
      { time: 2, open: 18_150, high: 18_260, low: 18_120, close: 18_240 },
      { time: 3, open: 18_240, high: 18_420, low: 18_210, close: 18_380 },
    ] as const;

    expect(inferTraditionalPointFigureBoxSize(input)).toBe(25);

    const traditionalResult = buildPointFigureData(input, {
      boxSize: null,
      boxSizeMode: "traditional",
      boxSizeScale: 1,
      reversalBoxes: 3,
      atrLength: 14,
      percentageValue: 1,
    });

    expect(traditionalResult.length).toBeGreaterThan(0);
    expect(traditionalResult[0]?.close).toBeGreaterThan(traditionalResult[0]?.open ?? 0);
  });

  it("builds kagi segments from canonical ohlc input without mutating the source", () => {
    const input = [
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 109, low: 101, close: 103 },
      { time: 5, open: 103, high: 104, low: 96, close: 98 },
      { time: 6, open: 98, high: 106, low: 97, close: 105 },
    ] as const;

    const result = buildKagiData(input);

    expect(result).toEqual([
      { time: 3, open: 100, high: 109, low: 100, close: 109, volume: undefined },
      { time: 5.001, open: 109, high: 109, low: 96, close: 96, volume: undefined },
      { time: 6.001, open: 96, high: 106, low: 96, close: 106, volume: undefined },
    ]);
    expect(input).toEqual([
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 109, low: 101, close: 103 },
      { time: 5, open: 103, high: 104, low: 96, close: 98 },
      { time: 6, open: 98, high: 106, low: 97, close: 105 },
    ]);
  });

  it("supports configurable kagi reversal modes without mutating canonical input", () => {
    const input = Array.from({ length: 48 }, (_, index) => {
      const close = 18_000 + Math.sin(index / 2.6) * 220 + Math.cos(index / 6.2) * 380;
      return {
        time: index + 1,
        open: close - 35,
        high: close + 80 + (index % 4) * 9,
        low: close - 90 - (index % 3) * 12,
        close,
      };
    });

    const autoResult = buildKagiData(input, {
      reversalMode: "auto",
      reversalSize: null,
      reversalScale: 1,
      atrLength: 14,
      percentageValue: 1,
    });
    const atrResult = buildKagiData(input, {
      reversalMode: "atr",
      reversalSize: null,
      reversalScale: 0.8,
      atrLength: 21,
      percentageValue: 1,
    });
    const percentageResult = buildKagiData(input, {
      reversalMode: "percentage",
      reversalSize: null,
      reversalScale: 1,
      atrLength: 14,
      percentageValue: 1.5,
    });
    const fixedResult = buildKagiData(input, {
      reversalMode: "fixed",
      reversalSize: 180,
      reversalScale: 1,
      atrLength: 14,
      percentageValue: 1,
    });

    expect(autoResult.length).toBeGreaterThan(0);
    expect(atrResult.length).toBeGreaterThan(0);
    expect(percentageResult.length).toBeGreaterThan(0);
    expect(fixedResult.length).toBeGreaterThan(0);
    expect(autoResult).not.toEqual(atrResult);
    expect(percentageResult).not.toEqual(fixedResult);
  });
});
