import { describe, expect, it } from "vitest";

import {
  createCompareStudySeriesApi,
  createMovingAverageStudySeriesApi,
  createScriptedStudySeriesApi,
  createSecondaryLineSeriesApi,
  createSecondaryVolumeSeriesApi,
} from "../../src/lib/internal/views/chart-secondary-series-api";

function createDeps() {
  const calls: string[] = [];
  const source = {
    options: {
      color: "#000000",
      lineWidth: 1,
      upColor: "#0c8f62",
      downColor: "#c7543e",
    },
    priceLines: new Map<string, unknown>(),
  };

  const deps = {
    assertSeriesActive: () => calls.push("assert"),
    getSource: () => source,
    applySeriesFormatterOptions: () => calls.push("formatter"),
    render: () => calls.push("render"),
    setSecondaryData: (_api: unknown, data: readonly { time: number; close: number }[]) =>
      calls.push(`set-secondary:${data.length}`),
    updateSecondary: (_api: unknown, bar: { time: number; close: number }) =>
      calls.push(`update-secondary:${bar.close}`),
    setSecondaryHistogramLikeData: (_api: unknown, data: readonly { time: number; value: number }[]) =>
      calls.push(`set-hist:${data.length}`),
    updateSecondaryHistogramLike: (_api: unknown, bar: { time: number; value: number }) =>
      calls.push(`update-hist:${bar.value}`),
    normalizeLineData: (data: readonly { time: number; value: number }[]) =>
      data.map((row) => ({ time: row.time, open: row.value, high: row.value, low: row.value, close: row.value })),
    normalizeLineBar: (bar: { time: number; value: number }) =>
      ({ time: bar.time, open: bar.value, high: bar.value, low: bar.value, close: bar.value }),
    setMarkers: (_api: unknown, markers: readonly unknown[], kind: string) =>
      calls.push(`markers:${kind}:${markers.length}`),
    createPriceLine: (_api: unknown, kind: string) => {
      calls.push(`create-price-line:${kind}`);
      return { remove() {}, applyOptions() {} };
    },
    removePriceLine: (_api: unknown, kind: string) => calls.push(`remove-price-line:${kind}`),
    applyCompareOptions: (_api: unknown, options: { requestedSymbol?: string | null }) =>
      calls.push(`compare:${options.requestedSymbol}`),
    getCompareOptions: () => ({
      affectMainScale: true,
      inputContextMode: "chart-context" as const,
      requestedSymbol: "ES1!",
      requestedResolution: null,
      requestedSession: null,
      requestedTimezone: null,
      mergePolicy: "carry-forward" as const,
    }),
    applyMovingAverageStudyOptions: (_api: unknown, options: { length?: number }) =>
      calls.push(`moving-average:${options.length}`),
    getMovingAverageStudyOptions: () => ({
      length: 5,
      inputContextMode: "chart-context" as const,
      requestedSymbol: null,
      requestedResolution: null,
      requestedSession: null,
      requestedTimezone: null,
      mergePolicy: "carry-forward" as const,
    }),
    applyScriptedStudyOptions: (_api: unknown, options: { scriptId: string }) =>
      calls.push(`scripted-study:${options.scriptId}`),
    getScriptedStudyOptions: () => ({
      scriptId: "script-1",
      inputValues: { length: 21 },
      inputContextMode: "chart-context" as const,
      requestedSymbol: null,
      requestedResolution: null,
      requestedSession: null,
      requestedTimezone: null,
      mergePolicy: "carry-forward" as const,
    }),
  };

  return { calls, source, deps };
}

describe("chart secondary series api use-case", () => {
  it("routes plain line series through normalization and local option updates", () => {
    const { calls, source, deps } = createDeps();
    const api = createSecondaryLineSeriesApi(deps);

    api.setData([{ time: 1, value: 10 }]);
    api.update({ time: 2, value: 12 });
    api.applyOptions({ color: "#3b82f6", lineWidth: 3 });

    expect(source.options).toMatchObject({ color: "#3b82f6", lineWidth: 3 });
    expect(calls).toEqual([
      "assert",
      "set-secondary:1",
      "assert",
      "update-secondary:12",
      "assert",
      "formatter",
      "render",
    ]);
  });

  it("routes compare and moving-average study hooks through dedicated study option handlers", () => {
    const compareState = createDeps();
    const compareApi = createCompareStudySeriesApi(compareState.deps);
    compareApi.applyCompareOptions({ requestedSymbol: "NQ1!" });
    expect(compareApi.getCompareOptions().requestedSymbol).toBe("ES1!");
    expect(compareState.calls).toEqual(["assert", "compare:NQ1!", "assert"]);

    const movingAverageState = createDeps();
    const movingAverageApi = createMovingAverageStudySeriesApi(movingAverageState.deps);
    movingAverageApi.applyStudyOptions({ length: 9 });
    expect(movingAverageApi.getStudyOptions().length).toBe(5);
    expect(movingAverageState.calls).toEqual(["assert", "moving-average:9", "assert"]);

    const scriptedStudyState = createDeps();
    const scriptedStudyApi = createScriptedStudySeriesApi(scriptedStudyState.deps);
    scriptedStudyApi.applyStudyOptions({
      scriptId: "script-2",
      inputValues: { length: 13 },
      inputContextMode: "chart-context",
      requestedSymbol: null,
      requestedResolution: null,
      requestedSession: null,
      requestedTimezone: null,
      mergePolicy: "carry-forward",
    });
    expect(scriptedStudyApi.getStudyOptions().scriptId).toBe("script-1");
    expect(scriptedStudyState.calls).toEqual(["assert", "scripted-study:script-2", "assert"]);
  });

  it("routes volume series through histogram-like mutation hooks", () => {
    const { calls, deps } = createDeps();
    const api = createSecondaryVolumeSeriesApi(deps);

    api.setData([{ time: 1, value: 11 }]);
    api.update({ time: 2, value: 13 });
    api.createPriceLine();

    expect(calls).toEqual([
      "assert",
      "set-hist:1",
      "assert",
      "update-hist:13",
      "assert",
      "create-price-line:volume",
    ]);
  });
});
