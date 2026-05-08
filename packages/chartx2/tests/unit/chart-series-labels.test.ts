import { describe, expect, it } from "vitest";

import { formatSeriesKindLabel } from "../../src/lib/internal/views/chart-series-labels";

describe("chart series labels", () => {
  it("formats supported series and chart-type labels", () => {
    expect(formatSeriesKindLabel("candlestick")).toBe("Candlestick");
    expect(formatSeriesKindLabel("line-break")).toBe("Line Break");
    expect(formatSeriesKindLabel("point-figure")).toBe("Point Figure");
    expect(formatSeriesKindLabel("volume-candles")).toBe("Volume Candles");
    expect(formatSeriesKindLabel("hlc-bars")).toBe("HLC Bars");
    expect(formatSeriesKindLabel("baseline")).toBe("Baseline");
    expect(formatSeriesKindLabel("volume")).toBe("Volume");
  });

  it("falls back to a generic series label for unknown kinds", () => {
    expect(formatSeriesKindLabel("custom-study")).toBe("Series");
  });
});
