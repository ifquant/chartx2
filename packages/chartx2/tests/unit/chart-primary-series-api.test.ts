import { describe, expect, it } from "vitest";

import { createPrimarySeriesApi } from "../../src/lib/internal/views/chart-primary-series-api";

describe("chart primary series api use-case", () => {
  it("routes line-series style changes through main-series rebuild when type-specific options change", () => {
    const calls: string[] = [];
    const source = {
      role: "main-series" as const,
      options: {
        color: "#000000",
        lineWidth: 1,
        kagiYangColor: "#111111",
      },
      inputData: [],
      data: [],
      priceLines: new Map<string, unknown>(),
    };

    const api = createPrimarySeriesApi("line", {
      assertSeriesActive: () => calls.push("assert"),
      getSource: () => source,
      applySeriesFormatterOptions: () => calls.push("formatter"),
      applyMainSeriesTypeSpecificOptions: () => {
        calls.push("type-specific");
        return true;
      },
      rebuildMainSource: () => calls.push("rebuild"),
      render: () => calls.push("render"),
      setPrimaryData: () => calls.push("set-data"),
      updatePrimary: () => calls.push("update"),
      setPrimaryHistogramLikeData: () => calls.push("set-hist"),
      updatePrimaryHistogramLike: () => calls.push("update-hist"),
      normalizeLineData: (data) => data as never,
      normalizeLineBar: (bar) => bar as never,
      setMarkers: () => calls.push("markers"),
      createPriceLine: () => {
        calls.push("create-price-line");
        return { remove() {}, applyOptions() {} };
      },
      removePriceLine: () => calls.push("remove-price-line"),
    });

    api.applyOptions({
      color: "#3b82f6",
      lineWidth: 3,
      kagiYangColor: "#10b981",
    });

    expect(source.options).toMatchObject({
      color: "#3b82f6",
      lineWidth: 3,
      kagiYangColor: "#10b981",
    });
    expect(calls).toEqual(["assert", "formatter", "type-specific", "rebuild", "render"]);
  });

  it("keeps area-series option updates local and avoids main-series rebuild", () => {
    const calls: string[] = [];
    const source = {
      role: "study" as const,
      options: {
        lineColor: "#000000",
        lineWidth: 1,
        topColor: "#111111",
        bottomColor: "#222222",
      },
      inputData: [],
      data: [],
      priceLines: new Map<string, unknown>(),
    };

    const api = createPrimarySeriesApi("area", {
      assertSeriesActive: () => calls.push("assert"),
      getSource: () => source,
      applySeriesFormatterOptions: () => calls.push("formatter"),
      applyMainSeriesTypeSpecificOptions: () => {
        calls.push("type-specific");
        return true;
      },
      rebuildMainSource: () => calls.push("rebuild"),
      render: () => calls.push("render"),
      setPrimaryData: () => calls.push("set-data"),
      updatePrimary: () => calls.push("update"),
      setPrimaryHistogramLikeData: () => calls.push("set-hist"),
      updatePrimaryHistogramLike: () => calls.push("update-hist"),
      normalizeLineData: (data) => data as never,
      normalizeLineBar: (bar) => bar as never,
      setMarkers: () => calls.push("markers"),
      createPriceLine: () => {
        calls.push("create-price-line");
        return { remove() {}, applyOptions() {} };
      },
      removePriceLine: () => calls.push("remove-price-line"),
    });

    api.applyOptions({
      lineColor: "#3b82f6",
      lineWidth: 2,
      topColor: "#10b981",
      bottomColor: "#ef4444",
    });

    expect(source.options).toMatchObject({
      lineColor: "#3b82f6",
      lineWidth: 2,
      topColor: "#10b981",
      bottomColor: "#ef4444",
    });
    expect(calls).toEqual(["assert", "formatter", "render"]);
  });

  it("preserves the existing chart-type to api-family mapping", () => {
    const api = createPrimarySeriesApi("hlc-area", {
      assertSeriesActive: () => {},
      getSource: () => ({
        role: "main-series" as const,
        options: {},
        inputData: [],
        data: [],
        priceLines: new Map<string, unknown>(),
      }),
      applySeriesFormatterOptions: () => {},
      applyMainSeriesTypeSpecificOptions: () => false,
      rebuildMainSource: () => {},
      render: () => {},
      setPrimaryData: () => {},
      updatePrimary: () => {},
      setPrimaryHistogramLikeData: () => {},
      updatePrimaryHistogramLike: () => {},
      normalizeLineData: (data) => data as never,
      normalizeLineBar: (bar) => bar as never,
      setMarkers: () => {},
      createPriceLine: () => ({ remove() {}, applyOptions() {} }),
      removePriceLine: () => {},
    });

    expect(typeof api.setData).toBe("function");
    expect(typeof api.update).toBe("function");
    expect(typeof api.applyOptions).toBe("function");
  });
});
