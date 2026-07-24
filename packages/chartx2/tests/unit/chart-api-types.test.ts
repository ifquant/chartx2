import { describe, expect, it } from "vitest";

import {
  createPhaseOneChartTemplate,
  normalizePhaseOneChartTemplate,
  type PhaseOneChartApi,
  type PhaseOneChartStateSnapshot,
  type PhaseOneTimeScaleApi,
} from "../../src/lib/internal/views/chart-api-types";
import {
  createPhaseOneChartTemplate as createPhaseOneChartTemplateFromHarness,
  normalizePhaseOneChartTemplate as normalizePhaseOneChartTemplateFromHarness,
} from "../../src/lib/internal/views/chart-api-types";

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
  it("accepts scripted study snapshots in chart state", () => {
    const state: PhaseOneChartStateSnapshot = {
      ...emptyChartState,
      studies: [
        {
          type: "scripted-study",
          paneIndex: 1,
          seriesOptions: { color: "#0af", lineWidth: 2 },
          studyOptions: {
            scriptId: "close-sma-20-v0",
            inputValues: { length: 20 },
            inputContextMode: "requested-context",
            requestedSymbol: "SPY",
            requestedResolution: "1D",
            requestedSession: "regular",
            requestedTimezone: "America/New_York",
            mergePolicy: "exact",
          },
        },
      ],
    };

    expect(state.studies[0]).toMatchObject({
      type: "scripted-study",
      paneIndex: 1,
    });
  });

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

  it("requires the complete time-scale focus contract", () => {
    const timeScale = {
      getVisibleLogicalRange: () => null,
      setVisibleLogicalRange: () => undefined,
      focusTime: (_request) => ({ kind: "noData" as const, requestedTime: 0 }),
      applyOptions: () => undefined,
    } satisfies PhaseOneTimeScaleApi;

    expect(timeScale.focusTime({ time: 0, maxDistance: 0 }).kind).toBe("noData");
  });
});
