import { describe, expect, it } from "vitest";

import {
  applyChartTemplate,
  createChartTemplate,
  normalizeChartTemplate,
} from "../../src/lib/internal/views/chart-template";

describe("chart template view use-case", () => {
  it("creates a versioned chart template from raw chart state", () => {
    const template = createChartTemplate({
      options: { layout: {}, crosshair: {} },
      timeScale: { barSpacing: null, rightOffset: 0.8, visibleLogicalRange: null },
      priceScale: { visibleRange: null, scaleSeriesOnly: false },
      panes: [],
      mainSeries: null,
      series: [],
      studies: [],
      tradeLocation: null,
      drawings: [],
    });

    expect(template.kind).toBe("chart-template");
    expect(template.version).toBe(1);
    expect(template.chart.priceScale.scaleSeriesOnly).toBe(false);
  });

  it("normalizes raw chart state into the versioned template envelope", () => {
    const normalized = normalizeChartTemplate({
      options: { layout: {}, crosshair: {} },
      timeScale: { barSpacing: null, rightOffset: 0.8, visibleLogicalRange: null },
      priceScale: { visibleRange: null, scaleSeriesOnly: false },
      panes: [],
      mainSeries: null,
      series: [],
      studies: [],
      tradeLocation: null,
      drawings: [],
    });

    expect(normalized.kind).toBe("chart-template");
    expect(normalized.version).toBe(1);
  });

  it("applies the normalized chart state through the provided state applier", () => {
    const calls: string[] = [];

    applyChartTemplate(
      {
        options: { layout: {}, crosshair: {} },
        timeScale: { barSpacing: null, rightOffset: 0.8, visibleLogicalRange: null },
        priceScale: { visibleRange: null, scaleSeriesOnly: false },
        panes: [],
        mainSeries: null,
        series: [],
        studies: [],
        tradeLocation: null,
        drawings: [],
      },
      {
        normalize: (input) => {
          calls.push("normalize");
          return normalizeChartTemplate(input);
        },
        applyChartState: (state) => {
          calls.push(`apply:${state.priceScale.scaleSeriesOnly}`);
        },
      },
    );

    expect(calls).toEqual(["normalize", "apply:false"]);
  });
});
