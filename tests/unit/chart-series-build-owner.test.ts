import { describe, expect, it } from "vitest";

import { createChartSeriesBuildOwner } from "../../src/lib/chartx/internal/views/chart-series-build-owner";
import type {
  PhaseOneMainStyleSchemaId,
  PriceScale,
} from "../../src/lib/chartx/internal/model";

describe("chart series build owner", () => {
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

  it("allocates stable series metadata from one ordinal stream", () => {
    const owner = createChartSeriesBuildOwner({
      defaults,
      initialOrdinal: 5,
    });

    expect(owner.createMeta("line")).toEqual({
      id: "series-5",
      label: "Line 5",
    });
    expect(owner.createMeta("histogram")).toEqual({
      id: "series-6",
      label: "Histogram 6",
    });
    expect(owner.createLabel("volume", "series-9")).toBe("Volume 9");
  });

  it("clones generic and main-series default option surfaces", () => {
    const owner = createChartSeriesBuildOwner({ defaults });

    const volumeOptions = owner.createOptions("volume");
    const lineOptions = owner.createMainOptions("lineStyle" as PhaseOneMainStyleSchemaId);

    expect(volumeOptions).toEqual(defaults.volumeOptions);
    expect(volumeOptions).not.toBe(defaults.volumeOptions);
    expect(lineOptions).toEqual(defaults.lineOptions);
    expect(lineOptions).not.toBe(defaults.lineOptions);
  });

  it("creates main source state with price-scale identity and builder defaults", () => {
    const owner = createChartSeriesBuildOwner({ defaults });
    const priceScale = { marker: "primary" } as unknown as PriceScale;

    const state = owner.createMainSource({
      paneId: "primary",
      chartType: "line",
      kind: "line",
      api: { id: "api-1" },
      meta: { id: "series-1", label: "Line 1" },
      priceScale,
      priceScaleId: "primary-right",
    });

    expect(state.priceScale).toBe(priceScale);
    expect(state.priceScaleId).toBe("primary-right");
    expect(state.lineBreakOptions.lineCount).toBe(3);
    expect(state.kagiOptions.reversalMode).toBe("fixed");
    expect(state.options).toEqual(defaults.lineOptions);
  });
});
