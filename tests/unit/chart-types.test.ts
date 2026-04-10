import { describe, expect, it } from "vitest";

import {
  buildHeikinAshiData,
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
});
