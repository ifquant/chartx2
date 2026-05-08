import { describe, expect, it } from "vitest";

import {
  formatReadoutDetail,
  formatSeriesReadoutValue,
} from "../../src/lib/internal/views/chart-readout-format";

describe("chart readout format use-cases", () => {
  it("formats readout bodies without leaving null handling in the harness", () => {
    expect(formatReadoutDetail({
      active: true,
      paneIndex: 0,
      time: 1,
      open: 10,
      high: 12,
      low: 9,
      close: 11,
      price: null,
      series: [],
    }, {
      formatTime: (value) => `T:${value}`,
      formatPrice: (value) => `P:${value}`,
    })).toMatchObject({
      formatted: {
        time: "T:1",
        open: "P:10",
        high: "P:12",
        low: "P:9",
        close: "P:11",
        price: "--",
      },
    });
  });

  it("routes series readout formatting through shared price and volume formatters", () => {
    expect(formatSeriesReadoutValue({
      kind: "line",
      options: {},
    }, 42, {
      formatPrice: (value) => `P:${value}`,
      formatVolume: (value) => `V:${value}`,
    })).toBe("P:42");

    expect(formatSeriesReadoutValue({
      kind: "volume",
      options: {},
    }, 42, {
      formatPrice: (value) => `P:${value}`,
      formatVolume: (value) => `V:${value}`,
    })).toBe("V:42");
  });
});
