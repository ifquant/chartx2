import { describe, expect, it } from "vitest";

import { buildHeikinAshiData } from "../../src/lib/chartx/internal/views/chart-harness";

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
});
