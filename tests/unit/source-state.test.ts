import { describe, expect, it } from "vitest";

import {
  PriceScale,
  createDefaultStudyInputContext,
  createMainSeriesDescriptor,
  createSeriesRuntimeFields,
} from "../../src/lib/chartx/internal/model";

describe("source state helpers", () => {
  it("creates empty runtime fields around a supplied api, scale, and options", () => {
    const api = { handle: "main" };
    const priceScale = new PriceScale();
    const runtime = createSeriesRuntimeFields<
      number,
      typeof api,
      { color: string },
      string,
      { price: number },
      { time: number }
    >({
      api,
      priceScale,
      options: { color: "#fff" },
    });

    expect(runtime.api).toBe(api);
    expect(runtime.priceScale).toBe(priceScale);
    expect(runtime.options).toEqual({ color: "#fff" });
    expect(runtime.data).toEqual([]);
    expect(runtime.markers).toEqual([]);
    expect(runtime.visuals.size).toBe(0);
    expect(runtime.priceLines.size).toBe(0);
  });

  it("provides the default chart-context study input state", () => {
    expect(createDefaultStudyInputContext()).toEqual({
      mode: "chart-context",
      symbol: null,
      resolution: null,
      session: null,
      timezone: null,
      mergePolicy: "carry-forward",
    });
  });

  it("resolves main series runtime descriptors from chart type", () => {
    expect(createMainSeriesDescriptor("candlestick")).toMatchObject({
      chartType: "candlestick",
      builder: "time-bars",
      renderer: "candles",
    });
    expect(createMainSeriesDescriptor("renko")).toMatchObject({
      chartType: "renko",
      builder: "renko",
      renderer: "brick",
    });
  });
});
