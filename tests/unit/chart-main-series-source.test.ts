import { describe, expect, it } from "vitest";

import { PriceScale } from "../../src/lib/chartx/internal/model";
import {
  attachMainSeriesSource,
  createMainSeriesSourceState,
} from "../../src/lib/chartx/internal/views/chart-main-series-source";

describe("chart main series source use-case", () => {
  it("creates main-series source state from chart-type descriptor and defaults", () => {
    const priceScale = new PriceScale();
    const api = { handle: "main" };

    const source = createMainSeriesSourceState({
      paneId: "primary",
      chartType: "candlestick",
      kind: "candlestick" as const,
      api,
      meta: { id: "main-1", label: "Main 1" },
      priceScale,
      priceScaleId: "primary-right",
      defaults: {
        lineBreakOptions: { lineCount: 3 },
        renkoOptions: { boxSize: 2, boxSizeMode: "fixed" as const },
        pointFigureOptions: {
          boxSize: 1,
          boxSizeMode: "fixed" as const,
          boxSizeScale: 1,
          reversalBoxes: 3,
          atrLength: 14,
          percentageValue: 2,
        },
        kagiOptions: {
          reversalMode: "fixed" as const,
          reversalSize: 4,
          reversalScale: 1,
          atrLength: 14,
          percentageValue: 2,
        },
      },
      createOptions: () => ({ upColor: "#0c8f62" }),
    });

    expect(source.chartType).toBe("candlestick");
    expect(source.styleSchemaId).toBe("candleStyle");
    expect(source.api).toBe(api);
    expect(source.priceScale).toBe(priceScale);
    expect(source.options).toEqual({ upColor: "#0c8f62" });
    expect(source.lineBreakOptions).toEqual({ lineCount: 3 });
    expect(source.visible).toBe(true);
    expect(source.store).toBeDefined();
  });

  it("rejects duplicate main-source attach attempts", () => {
    expect(() =>
      attachMainSeriesSource("line", undefined, {
        currentMainSourceId: "existing-main",
        createMeta: () => ({ id: "new", label: "New" }),
        createLabel: (_kind, id) => id,
        createApi: () => ({ id: "api" }),
        createSourceState: () =>
          ({
            styleSchemaId: "lineStyle",
            options: {},
          }) as never,
        clonePriceLines: (lines) => new Map(lines),
        projectOptions: (_prev, _next, _preserved, current) => current,
        rebuildData: () => {},
        registerSource: () => {},
        syncContext: () => {},
      }),
    ).toThrow("chartx phase-one chart supports only one primary series");
  });

  it("restores preserved main-series payload before rebuild and registration", () => {
    const calls: string[] = [];
    const api = { id: "main-api" };
    const source: {
      inputData: readonly { time: number; open: number; high: number; low: number; close: number }[];
      visuals: Map<number, { color: string }>;
      markers: readonly { time: number }[];
      priceLines: Map<string, { price: number }>;
      options: { color: string; lineWidth: number };
      styleSchemaId: "lineStyle";
      data: readonly { time: number; value: number }[];
    } = {
      inputData: [],
      visuals: new Map<number, { color: string }>(),
      markers: [],
      priceLines: new Map<string, { price: number }>(),
      options: { color: "#000000", lineWidth: 1 },
      styleSchemaId: "lineStyle",
      data: [],
    };
    const preservedData = [{ time: 1, open: 9, high: 11, low: 8, close: 10 }];
    const preservedVisuals = new Map([[1, { color: "#10b981" }]]);
    const preservedMarkers = [{ time: 1 }];
    const preservedPriceLines = new Map([["line-1", { price: 10 }]]);

    const result = attachMainSeriesSource(
      "line",
      {
        id: "main-1",
        label: "ignored",
        data: preservedData,
        visuals: preservedVisuals,
        markers: preservedMarkers,
        priceLines: preservedPriceLines,
        options: { color: "#3b82f6", lineWidth: 3 },
        previousStyleSchemaId: "lineStyle",
      },
      {
        currentMainSourceId: null,
        createMeta: () => ({ id: "generated", label: "Generated" }),
        createLabel: (_kind, id) => `label:${id}`,
        createApi: () => api,
        createSourceState: (_kind, createdApi, meta) => {
          calls.push(`create:${meta.id}:${meta.label}:${createdApi.id}`);
          return source;
        },
        clonePriceLines: (lines) => {
          calls.push("clone-price-lines");
          return new Map(lines);
        },
        projectOptions: (previous, next, preservedOptions, currentOptions) => {
          calls.push(`project:${previous}->${next}`);
          return {
            ...(currentOptions as { color: string; lineWidth: number }),
            ...preservedOptions,
          };
        },
        rebuildData: (nextSource) => {
          calls.push(`rebuild:${nextSource.inputData.length}:${nextSource.markers.length}`);
        },
        registerSource: (nextSource) => {
          calls.push(`register:${nextSource.options.color}`);
        },
        syncContext: (nextSource) => {
          calls.push(`sync:${nextSource.priceLines.size}`);
        },
      },
    );

    expect(result).toBe(api);
    expect(source.inputData).toEqual([...preservedData]);
    expect(source.visuals).toEqual(new Map(preservedVisuals));
    expect(source.markers).toEqual([...preservedMarkers]);
    expect(source.priceLines).toEqual(new Map(preservedPriceLines));
    expect(source.options).toEqual({ color: "#3b82f6", lineWidth: 3 });
    expect(calls).toEqual([
      "create:main-1:label:main-1:main-api",
      "clone-price-lines",
      "project:lineStyle->lineStyle",
      "rebuild:1:1",
      "register:#3b82f6",
      "sync:1",
    ]);
  });
});
