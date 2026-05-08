import { describe, expect, it, vi } from "vitest";

import {
  createMainSeriesOptions,
  createMainSourceState,
  createSeriesLabel,
  createSeriesMeta,
  createSeriesOptions,
} from "../../src/lib/internal/views/chart-series-builders";
import type {
  PhaseOneMainStyleSchemaId,
  PriceScale,
} from "../../src/lib/internal/model";

describe("chart series builders use-cases", () => {
  const defaults = {
    candlestickOptions: {
      upColor: "#0f0",
      downColor: "#f00",
      wickColor: "#999",
      lineBreakCount: 3,
      renkoBoxSize: 2,
      renkoBoxSizeMode: "fixed" as const,
      pointFigureBoxSize: 3,
      pointFigureBoxSizeMode: "fixed" as const,
      pointFigureBoxSizeScale: 1,
      pointFigureReversalBoxes: 3,
      pointFigureAtrLength: 14,
      pointFigurePercentageValue: 1,
      valueFormatter: null,
    },
    barOptions: {
      upColor: "#0f0",
      downColor: "#f00",
      valueFormatter: null,
    },
    lineOptions: {
      color: "#00f",
      lineWidth: 2,
      kagiYangColor: "#0f0",
      kagiYinColor: "#f00",
      kagiYangLineWidth: 2,
      kagiYinLineWidth: 2,
      kagiReversalMode: "fixed" as const,
      kagiReversalSize: 1,
      kagiReversalScale: 1,
      kagiAtrLength: 14,
      kagiPercentageValue: 1,
      valueFormatter: null,
    },
    areaOptions: {
      lineColor: "#00f",
      lineWidth: 2,
      topColor: "#0ff",
      bottomColor: "#00a",
      valueFormatter: null,
    },
    baselineOptions: {
      baseValue: 0,
      topFillTopColor: "#fff",
      topFillBottomColor: "#eee",
      topLineColor: "#0f0",
      bottomFillTopColor: "#111",
      bottomFillBottomColor: "#222",
      bottomLineColor: "#f00",
      lineWidth: 2,
      valueFormatter: null,
    },
    histogramOptions: {
      upColor: "#999",
      downColor: "#666",
      valueFormatter: null,
    },
    volumeOptions: {
      upColor: "#0f0",
      downColor: "#f00",
      valueFormatter: null,
    },
  };

  it("builds series labels and metadata with formatted ordinals", () => {
    expect(createSeriesLabel("candlestick", "series-4", {
      formatSeriesKindLabel: (kind) => kind.toUpperCase(),
    })).toBe("CANDLESTICK 4");

    expect(createSeriesMeta("line", 7, {
      formatSeriesKindLabel: (kind) => kind.toUpperCase(),
    })).toEqual({
      id: "series-7",
      label: "LINE 7",
    });
  });

  it("clones default series options for generic and main-series builders", () => {
    expect(createSeriesOptions("volume", defaults)).toEqual(defaults.volumeOptions);
    expect(createMainSeriesOptions("line" as PhaseOneMainStyleSchemaId, defaults, {
      optionSurface: () => "line",
    })).toEqual(defaults.lineOptions);
  });

  it("builds main-source state with chart-type-specific defaults", () => {
    const priceScale = { marker: "primary" } as unknown as PriceScale;
    const state = createMainSourceState({
      paneId: "primary",
      chartType: "line",
      kind: "line",
      api: { id: "api-1" },
      meta: { id: "series-1", label: "LINE 1" },
      priceScale,
      priceScaleId: "primary-right",
    }, {
      candlestickOptions: defaults.candlestickOptions,
      lineOptions: defaults.lineOptions,
    }, {
      createMainSeriesOptions: vi.fn(() => ({ ...defaults.lineOptions })),
    });

    expect(state.lineBreakOptions.lineCount).toBe(3);
    expect(state.renkoOptions.boxSize).toBe(2);
    expect(state.kagiOptions.reversalMode).toBe("fixed");
    expect(state.options).toEqual(defaults.lineOptions);
  });
});
