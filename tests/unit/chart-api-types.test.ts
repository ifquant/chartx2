import { describe, expect, it } from "vitest";

import {
  createPhaseOneChartTemplate,
  normalizePhaseOneChartTemplate,
  type PhaseOneChartApi,
  type PhaseOneChartStateSnapshot,
} from "../../src/lib/chartx/internal/views/chart-api-types";
import {
  createPhaseOneChartTemplate as createPhaseOneChartTemplateFromHarness,
  normalizePhaseOneChartTemplate as normalizePhaseOneChartTemplateFromHarness,
} from "../../src/lib/chartx/internal/views/chart-api-types";

const emptyChartState: PhaseOneChartStateSnapshot = {
  options: {},
  timeScale: {
    barSpacing: null,
    rightOffset: 0.8,
    visibleLogicalRange: null,
  },
  priceScale: {
    visibleRange: null,
    scaleSeriesOnly: false,
  },
  panes: [{ height: null, resizable: false }],
  mainSeries: null,
  series: [],
  studies: [],
  tradeLocation: null,
  drawings: [],
};

describe("chart api types module", () => {
  it("owns template helpers directly", () => {
    const template = createPhaseOneChartTemplate(emptyChartState);
    const harnessTemplate = createPhaseOneChartTemplateFromHarness(emptyChartState);

    expect(template).toEqual(harnessTemplate);
    expect(normalizePhaseOneChartTemplate(template)).toEqual(template);
    expect(normalizePhaseOneChartTemplateFromHarness(template)).toEqual(template);
  });

  it("exports the public api type", () => {
    const methodName: keyof PhaseOneChartApi = "addCandlestickSeries";

    expect(methodName).toBe("addCandlestickSeries");
  });
});
