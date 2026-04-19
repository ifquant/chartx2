import { describe, expect, it } from "vitest";

import {
  addPrimarySeries,
  attachPrimarySeries,
} from "../../src/lib/chartx/internal/views/chart-primary-series-factory";

describe("chart primary series factory use-case", () => {
  it("attaches a preserved primary series and wires the primary api callbacks", () => {
    const calls: string[] = [];
    const source = {
      role: "main-series" as const,
      inputData: [] as Array<{ time: number; open: number; high: number; low: number; close: number }>,
      data: [] as Array<{ time: number; open: number; high: number; low: number; close: number }>,
      visuals: new Map<number, { color: string; isUp: boolean }>(),
      markers: [] as Array<{ time: number }>,
      priceLines: new Map<string, { id: string; price: number }>(),
      options: { color: "#000000", lineWidth: 1 },
      styleSchemaId: "lineStyle" as const,
    };

    const api = attachPrimarySeries(
      "line",
      {
        id: "main-1",
        label: "ignored",
        data: [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
        visuals: new Map([[1, { color: "#10b981", isUp: true }]]),
        markers: [{ time: 1 }],
        priceLines: new Map([["price-line-1", { id: "price-line-1", price: 10 }]]),
        options: { color: "#3b82f6", lineWidth: 3 },
        previousStyleSchemaId: "lineStyle",
      },
      {
        currentMainSourceId: null,
        createMeta: () => ({ id: "generated", label: "Generated" }),
        createLabel: (_kind, id) => `label:${id}`,
        createSourceState: (_kind, _api, meta) => {
          calls.push(`create:${meta.id}:${meta.label}`);
          return source;
        },
        clonePriceLines: (lines) => new Map(lines),
        projectOptions: (_prev, _next, preservedOptions, currentOptions) => ({
          ...(currentOptions as { color: string; lineWidth: number }),
          ...preservedOptions,
        }),
        rebuildData: (nextSource) => {
          calls.push(`rebuild:${nextSource.inputData.length}`);
          nextSource.data = nextSource.inputData;
        },
        registerSource: () => calls.push("register"),
        syncContext: () => calls.push("sync"),
        assertSeriesActive: () => calls.push("assert"),
        getSource: () => source,
        applySeriesFormatterOptions: () => calls.push("formatter"),
        applyMainSeriesTypeSpecificOptions: () => {
          calls.push("type-specific");
          return true;
        },
        rebuildMainSource: () => calls.push("rebuild-main"),
        render: () => calls.push("render"),
        setPrimaryData: () => calls.push("set-primary-data"),
        updatePrimary: () => calls.push("update-primary"),
        setPrimaryHistogramLikeData: () => calls.push("set-primary-hist"),
        updatePrimaryHistogramLike: () => calls.push("update-primary-hist"),
        normalizeLineData: (data) =>
          data.map((row) => ({
            time: row.time,
            open: row.value,
            high: row.value,
            low: row.value,
            close: row.value,
          })),
        normalizeLineBar: (bar) => ({
          time: bar.time,
          open: bar.value,
          high: bar.value,
          low: bar.value,
          close: bar.value,
        }),
        setMarkers: () => calls.push("markers"),
        createPriceLineState: (options = {}) => ({
          id: "price-line-2",
          price: options.price ?? 0,
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
      },
    );

    (api as any).setData([{ time: 2, value: 11 }]);
    (api as any).applyOptions({ color: "#ef4444", lineWidth: 2 });

    expect(source.inputData).toEqual([{ time: 1, open: 9, high: 11, low: 8, close: 10 }]);
    expect(source.options).toMatchObject({ color: "#ef4444", lineWidth: 2 });
    expect(calls).toEqual([
      "create:main-1:label:main-1",
      "rebuild:1",
      "register",
      "sync",
      "assert",
      "set-primary-data",
      "assert",
      "formatter",
      "type-specific",
      "rebuild-main",
      "render",
    ]);
  });

  it("adds a fresh primary series without preserved state", () => {
    const source = {
      role: "main-series" as const,
      inputData: [] as Array<{ time: number; open: number; high: number; low: number; close: number }>,
      data: [] as Array<{ time: number; open: number; high: number; low: number; close: number }>,
      visuals: new Map<number, { color: string; isUp: boolean }>(),
      markers: [] as Array<{ time: number }>,
      priceLines: new Map<string, { id: string; price: number }>(),
      options: { upColor: "#26a69a" },
      styleSchemaId: "candleStyle" as const,
    };

    const api = addPrimarySeries("candlestick", {
      currentMainSourceId: null,
      createMeta: () => ({ id: "main-1", label: "Main 1" }),
      createLabel: (_kind, id) => id,
      createSourceState: () => source,
      clonePriceLines: (lines) => new Map(lines),
      projectOptions: (_prev, _next, _preserved, currentOptions) => currentOptions,
      rebuildData: (nextSource) => {
        nextSource.data = nextSource.inputData;
      },
      registerSource: () => {},
      syncContext: () => {},
      assertSeriesActive: () => {},
      getSource: () => source,
      applySeriesFormatterOptions: () => {},
      applyMainSeriesTypeSpecificOptions: () => false,
      rebuildMainSource: () => {},
      render: () => {},
      setPrimaryData: () => {},
      updatePrimary: () => {},
      setPrimaryHistogramLikeData: () => {},
      updatePrimaryHistogramLike: () => {},
      normalizeLineData: (data) =>
        data.map((row) => ({
          time: row.time,
          open: row.value,
          high: row.value,
          low: row.value,
          close: row.value,
        })),
      normalizeLineBar: (bar) => ({
        time: bar.time,
        open: bar.value,
        high: bar.value,
        low: bar.value,
        close: bar.value,
      }),
      setMarkers: () => {},
      createPriceLineState: (options = {}) => ({
        id: "price-line-1",
        price: options.price ?? 0,
      }),
      createPriceLine: () => ({
        applyOptions() {},
        remove() {},
      }),
      removePriceLine: () => {},
    });

    expect(typeof api.setData).toBe("function");
    expect(typeof api.applyOptions).toBe("function");
  });
});
