import { describe, expect, it } from "vitest";

import {
  applyMainSeriesStyleOptions,
  mainSeriesChartTypeSpec,
  mainSeriesStyleSchemaSpec,
  projectMainSeriesStyleOptions,
} from "../../src/lib/chartx/internal/model";
import {
  buildHeikinAshiData,
  buildKagiData,
  buildLineBreakData,
  buildPointFigureData,
  buildRenkoData,
} from "../../src/lib/chartx/internal/views/chart-harness";

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

  it("applies style-specific main-series options through the model-layer style registry", () => {
    const styleTarget = {
      renkoOptions: {
        boxSize: null,
        boxSizeMode: "auto" as const,
      },
      pointFigureOptions: {
        boxSize: null,
        boxSizeMode: "auto" as const,
        reversalBoxes: 3,
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
      applyMainSeriesStyleOptions("pnfStyle", styleTarget, {
        pointFigureBoxSizeMode: "fixed",
        pointFigureBoxSize: 24,
        pointFigureReversalBoxes: 5,
      }),
    ).toBe(true);
    expect(styleTarget.pointFigureOptions).toEqual({
      boxSize: 24,
      boxSizeMode: "fixed",
      reversalBoxes: 5,
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
        "pointFigureReversalBoxes",
      ],
      typeSpecificOptionKeys: ["pointFigureBoxSize", "pointFigureBoxSizeMode", "pointFigureReversalBoxes"],
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

  it("builds point-figure boxes from canonical ohlc input without mutating the source", () => {
    const input = [
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 100, high: 105, low: 99, close: 104 },
      { time: 3, open: 104, high: 109, low: 103, close: 108 },
      { time: 4, open: 108, high: 113, low: 107, close: 112 },
      { time: 5, open: 112, high: 113, low: 103, close: 104 },
    ] as const;

    const result = buildPointFigureData(input);

    expect(result).toEqual([
      { time: 3, open: 100, high: 105, low: 100, close: 105, volume: undefined },
      { time: 4, open: 105, high: 110, low: 105, close: 110, volume: undefined },
    ]);
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
      reversalBoxes: 3,
    });

    expect(result).toEqual([
      { time: 2, open: 100, high: 104, low: 100, close: 104, volume: undefined },
      { time: 3, open: 104, high: 108, low: 104, close: 108, volume: undefined },
      { time: 4, open: 108, high: 112, low: 108, close: 112, volume: undefined },
    ]);
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
      { time: 3, open: 100, high: 108, low: 100, close: 108, volume: undefined },
      { time: 5, open: 108, high: 108, low: 98, close: 98, volume: undefined },
      { time: 6, open: 98, high: 105, low: 98, close: 105, volume: undefined },
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
});
