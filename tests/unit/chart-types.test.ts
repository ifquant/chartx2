import { describe, expect, it } from "vitest";

import {
  buildHeikinAshiData,
  buildLineBreakData,
  buildPointFigureData,
  buildRenkoData,
} from "../../src/lib/chartx/internal/views/chart-harness";

describe("chart type builders", () => {
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
});
