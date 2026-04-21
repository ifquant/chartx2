import { describe, expect, it } from "vitest";

import {
  applyMainSeriesBuilderData,
  buildHistogramVisuals,
  normalizeHistogramBar,
  normalizeHistogramData,
  normalizeLineBar,
  normalizeLineData,
  updateCanonicalData,
} from "../../src/lib/chartx/internal/views/chart-series-data-transforms";

describe("chart series data transforms", () => {
  it("normalizes line points into canonical OHLC bars", () => {
    expect(normalizeLineBar({ time: 1, value: 12 })).toEqual({
      time: 1,
      open: 12,
      high: 12,
      low: 12,
      close: 12,
    });
    expect(normalizeLineData([{ time: 2, value: 18 }])).toEqual([{
      time: 2,
      open: 18,
      high: 18,
      low: 18,
      close: 18,
    }]);
  });

  it("normalizes histogram-like points around a zero baseline", () => {
    expect(normalizeHistogramBar({ time: 1, value: -4 })).toEqual({
      time: 1,
      open: 0,
      high: 0,
      low: -4,
      close: -4,
    });
    expect(normalizeHistogramData([{ time: 2, value: 7 }])).toEqual([{
      time: 2,
      open: 0,
      high: 7,
      low: 0,
      close: 7,
    }]);
  });

  it("updates canonical data through the series store ordering rules", () => {
    expect(updateCanonicalData([
      { time: 1, open: 1, high: 2, low: 0, close: 1.5 },
      { time: 2, open: 2, high: 3, low: 1, close: 2.5 },
    ], { time: 2, open: 4, high: 5, low: 3, close: 4.5 })).toEqual([
      { time: 1, open: 1, high: 2, low: 0, close: 1.5 },
      { time: 2, open: 4, high: 5, low: 3, close: 4.5 },
    ]);
  });

  it("applies main-series builder data and options through one transform helper", () => {
    const data = [
      { time: 1, open: 1, high: 2, low: 0, close: 1.5 },
      { time: 2, open: 2, high: 3, low: 1, close: 2.5 },
    ];

    expect(applyMainSeriesBuilderData(data, {
      builder: "time-bars",
      lineBreakOptions: { lineCount: 3 },
      renkoOptions: { boxSize: 2, boxSizeMode: "fixed" },
      pointFigureOptions: {
        boxSize: 1,
        boxSizeMode: "fixed",
        boxSizeScale: 1,
        reversalBoxes: 3,
        atrLength: 14,
        percentageValue: 1,
      },
      kagiOptions: {
        reversalMode: "fixed",
        reversalSize: 1,
        reversalScale: 1,
        atrLength: 14,
        percentageValue: 1,
      },
    })).toEqual(data);
  });

  it("builds histogram visuals from explicit colors and inferred direction", () => {
    expect(Array.from(buildHistogramVisuals([
      { time: 1, value: 10, color: "green" },
      { time: 2, value: 8 },
      { time: 3, value: 9, up: false },
    ]).entries())).toEqual([
      [1, { color: "green", isUp: true }],
      [2, { color: undefined, isUp: false }],
      [3, { color: undefined, isUp: false }],
    ]);
  });
});
