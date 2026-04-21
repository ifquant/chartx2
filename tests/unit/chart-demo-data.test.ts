import { describe, expect, it } from "vitest";

import {
  buildDemoBars,
  buildDemoVolumeBars,
} from "../../src/lib/chartx/internal/views/chart-demo-data";

describe("chart demo data", () => {
  it("builds deterministic demo OHLC bars", () => {
    const bars = buildDemoBars();

    expect(bars).toHaveLength(42);
    expect(bars[0]).toMatchObject({
      time: Date.UTC(2025, 0, 2, 9, 30),
      open: 16518,
      high: 16544,
      low: 16494,
      close: 16518,
    });
    expect(bars[1].time - bars[0].time).toBe(60_000);
    expect(bars.every((bar) => bar.high >= Math.max(bar.open, bar.close))).toBe(true);
    expect(bars.every((bar) => bar.low <= Math.min(bar.open, bar.close))).toBe(true);
  });

  it("builds matching deterministic demo volume bars", () => {
    const bars = [
      { time: 1, open: 10, high: 15, low: 9, close: 12 },
      { time: 2, open: 12, high: 13, low: 8, close: 9 },
    ];

    expect(buildDemoVolumeBars(bars)).toEqual([
      {
        time: 1,
        value: 697_000,
        up: true,
      },
      {
        time: 2,
        value: 825_500,
        up: false,
      },
    ]);
  });
});
