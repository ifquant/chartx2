import { describe, expect, it } from "vitest";

import type { PriceScale } from "../../src/lib/chartx/internal/model";
import { createChartPrimarySeriesOwner } from "../../src/lib/chartx/internal/views/chart-primary-series-owner";
import type { PhaseOneMainSeriesApi } from "../../src/lib/chartx/internal/views/chart-harness";

describe("chart primary series owner", () => {
  it("attaches preserved primary series through one owner surface", () => {
    const calls: string[] = [];
    const source = createSource();
    const owner = createChartPrimarySeriesOwner<PhaseOneMainSeriesApi, ReturnType<typeof createSource>>({
      getCurrentMainSourceId: () => null,
      getPrimaryPriceScale: () => ({} as PriceScale),
      createMeta: () => ({ id: "generated", label: "Generated" }),
      createLabel: (_chartType, id) => `label:${id}`,
      createSourceState: (input) => {
        calls.push(`create:${input.chartType}:${input.kind}:${input.meta.id}:${input.meta.label}`);
        return source;
      },
      registerSource: () => calls.push("register"),
      syncMainSource: () => calls.push("sync"),
      assertSeriesActive: () => calls.push("assert"),
      getSourceByApi: () => source,
      render: () => calls.push("render"),
      setPrimaryData: () => calls.push("set-primary-data"),
      updatePrimaryData: () => calls.push("update-primary"),
      setPrimaryHistogramLikeData: () => calls.push("set-primary-histogram"),
      updatePrimaryHistogramLikeData: () => calls.push("update-primary-histogram"),
      createPriceLineState: (options = {}) => ({
        id: "price-line-2",
        price: options.price ?? 0,
        color: options.color ?? "#111111",
        lineWidth: options.lineWidth ?? 1,
        title: options.title ?? "Line 2",
      }),
      createPriceLine: (lines, state) => {
        lines.set(state.id, state);
        calls.push("create-price-line");
        return {
          applyOptions() {},
          remove() {},
        };
      },
      removePriceLine: () => calls.push("remove-price-line"),
    });

    const api = owner.attach("line", {
      id: "main-1",
      label: "ignored",
      data: [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
      visuals: new Map([[1, { color: "#10b981", isUp: true }]]),
      markers: [{ time: 1, position: "belowBar", shape: "circle", color: "#111111", text: "A" }],
      priceLines: new Map([[
        "price-line-1",
        { id: "price-line-1", price: 10, color: "#111111", lineWidth: 1, title: "Line 1" },
      ]]),
      options: { color: "#3b82f6", lineWidth: 3 },
      previousStyleSchemaId: "lineStyle",
    });

    const lineApi = api as {
      setData(data: readonly { time: number; value: number }[]): void;
      applyOptions(options: { color?: string; lineWidth?: number }): void;
      setMarkers(markers: readonly { time: number; text?: string }[]): void;
      createPriceLine(options: { price: number }): void;
    };

    lineApi.setData([{ time: 2, value: 11 }]);
    lineApi.applyOptions({ color: "#ef4444", lineWidth: 2 });
    lineApi.setMarkers([{ time: 3, text: "B" }]);
    lineApi.createPriceLine({ price: 12 });

    expect(source.inputData).toEqual([{ time: 1, open: 9, high: 11, low: 8, close: 10 }]);
    expect(source.data).toEqual([{ time: 1, open: 9, high: 11, low: 8, close: 10 }]);
    expect(source.options).toMatchObject({ color: "#ef4444", lineWidth: 2 });
    expect(source.markers).toEqual([
      { time: 3, position: "aboveBar", shape: "circle", color: "#2563eb", text: "B" },
    ]);
    expect(source.priceLines.get("price-line-2")).toEqual({
      id: "price-line-2",
      price: 12,
      color: "#111111",
      lineWidth: 1,
      title: "Line 2",
    });
    expect(calls).toEqual([
      "create:line:line:main-1:label:main-1",
      "register",
      "sync",
      "assert",
      "set-primary-data",
      "assert",
      "render",
      "assert",
      "render",
      "assert",
      "create-price-line",
    ]);
  });

  it("maps primary chart type to source kind when adding fresh series", () => {
    const calls: string[] = [];
    const source = createSource();
    const owner = createChartPrimarySeriesOwner<PhaseOneMainSeriesApi, ReturnType<typeof createSource>>({
      getCurrentMainSourceId: () => null,
      getPrimaryPriceScale: () => ({} as PriceScale),
      createMeta: () => ({ id: "main-1", label: "Main 1" }),
      createLabel: (_chartType, id) => id,
      createSourceState: (input) => {
        calls.push(`${input.chartType}:${input.kind}:${input.priceScaleId}`);
        return source;
      },
      registerSource: () => calls.push("register"),
      syncMainSource: () => calls.push("sync"),
      assertSeriesActive: () => {},
      getSourceByApi: () => source,
      render: () => {},
      setPrimaryData: () => {},
      updatePrimaryData: () => {},
      setPrimaryHistogramLikeData: () => {},
      updatePrimaryHistogramLikeData: () => {},
      createPriceLineState: (options = {}) => ({
        id: "price-line-1",
        price: options.price ?? 0,
        color: options.color ?? "#111111",
        lineWidth: options.lineWidth ?? 1,
        title: options.title ?? "Line 1",
      }),
      createPriceLine: () => ({
        applyOptions() {},
        remove() {},
      }),
      removePriceLine: () => {},
    });

    const api = owner.add("renko");

    expect(typeof api.setData).toBe("function");
    expect(calls).toEqual(["renko:candlestick:primary-right", "register", "sync"]);
  });
});

function createSource() {
  return {
    role: "main-series" as const,
    inputData: [] as Array<{ time: number; open: number; high: number; low: number; close: number }>,
    data: [] as Array<{ time: number; open: number; high: number; low: number; close: number }>,
    visuals: new Map<number, { color: string; isUp: boolean }>(),
    markers: [] as Array<{
      time: number;
      position: "aboveBar" | "belowBar" | "inBar";
      shape: "circle" | "square" | "arrowUp" | "arrowDown";
      color: string;
      text: string;
    }>,
    priceLines: new Map<string, { id: string; price: number; color: string; lineWidth: number; title: string }>(),
    options: { color: "#000000", lineWidth: 1 },
    styleSchemaId: "lineStyle" as const,
    builder: "time-bars" as const,
    lineBreakOptions: { lineCount: 3 },
    renkoOptions: { boxSize: null, boxSizeMode: "auto" as const },
    pointFigureOptions: {
      boxSize: null,
      boxSizeMode: "fixed" as const,
      boxSizeScale: 1,
      reversalBoxes: 3,
      atrLength: 14,
      percentageValue: 1,
    },
    kagiOptions: {
      reversalMode: "auto" as const,
      reversalSize: null,
      reversalScale: 1,
      atrLength: 14,
      percentageValue: 1,
    },
  };
}
