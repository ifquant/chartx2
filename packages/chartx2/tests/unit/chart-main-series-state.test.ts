import { describe, expect, it } from "vitest";

import {
  applyMainSeriesStateSnapshot,
  buildMainSeriesStateSnapshot,
} from "../../src/lib/internal/views/chart-main-series-state";

describe("chart main series state", () => {
  it("builds a main-series snapshot from the active source state", () => {
    const snapshot = buildMainSeriesStateSnapshot({
      chartType: "line",
      options: {
        color: "#3b82f6",
        lineWidth: 2,
      },
      lineBreakOptions: { lineCount: 3 },
      renkoOptions: { boxSize: 2, boxSizeMode: "fixed" },
      pointFigureOptions: {
        boxSize: 1,
        boxSizeMode: "fixed",
        boxSizeScale: 1,
        reversalBoxes: 3,
        atrLength: 14,
        percentageValue: 2,
      },
      kagiOptions: {
        reversalMode: "fixed",
        reversalSize: 4,
        reversalScale: 1,
        atrLength: 14,
        percentageValue: 2,
      },
    });

    expect(snapshot?.chartType).toBe("line");
    expect(snapshot?.styleOptions).toMatchObject({
      color: "#3b82f6",
      lineWidth: 2,
    });
  });

  it("reuses the current api when the chart type matches and applies sanitized style state", () => {
    const currentApi = { id: "main-api" };
    const source = {
      api: currentApi,
      chartType: "line" as const,
      styleSchemaId: "lineStyle" as const,
      options: {},
      inputData: [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
      lineBreakOptions: { lineCount: 1 },
      renkoOptions: { boxSize: null, boxSizeMode: "auto" as const },
      pointFigureOptions: {
        boxSize: null,
        boxSizeMode: "atr" as const,
        boxSizeScale: 1,
        reversalBoxes: 3,
        atrLength: 14,
        percentageValue: 1,
      },
      kagiOptions: {
        reversalMode: "fixed" as const,
        reversalSize: null,
        reversalScale: 1,
        atrLength: 14,
        percentageValue: 1,
      },
      data: [],
    };

    const calls: string[] = [];
    const nextApi = applyMainSeriesStateSnapshot(
      {
        chartType: "line",
        inputCapability: "c",
        builder: "time-bars",
        renderer: "line",
        styleSchemaId: "lineStyle",
        styleOptionSurface: "line",
        styleOptions: { color: "#10b981", lineWidth: 3 },
        lineBreakOptions: { lineCount: 4 },
        renkoOptions: { boxSize: -1, boxSizeMode: "fixed" },
        pointFigureOptions: {
          boxSize: -1,
          boxSizeMode: "percentage",
          boxSizeScale: 10,
          reversalBoxes: 0,
          atrLength: 1,
          percentageValue: 99,
        },
        kagiOptions: {
          reversalMode: "percentage",
          reversalSize: -1,
          reversalScale: 10,
          atrLength: 1,
          percentageValue: 99,
        },
      },
      {
        current: source,
        ensureAttached: () => {
          calls.push("ensure");
          return { id: "ensure" };
        },
        switchChartType: () => {
          calls.push("switch");
          return { id: "switch" };
        },
        getCurrentSource: () => source,
        createOptions: () => ({ color: "#000000" }),
        rebuildData: () => calls.push("rebuild"),
        syncContext: () => calls.push("sync"),
        resetPrimaryPriceRangeOverride: () => calls.push("reset"),
        finalize: () => calls.push("finalize"),
      },
    );

    expect(nextApi).toBe(currentApi);
    expect(calls).toEqual(["rebuild", "sync", "reset", "finalize"]);
    expect(source.options).toMatchObject({ color: "#10b981", lineWidth: 3 });
    expect(source.lineBreakOptions).toEqual({ lineCount: 4 });
    expect(source.renkoOptions).toEqual({ boxSize: null, boxSizeMode: "fixed" });
    expect(source.pointFigureOptions).toEqual({
      boxSize: null,
      boxSizeMode: "percentage",
      boxSizeScale: 4,
      reversalBoxes: 1,
      atrLength: 2,
      percentageValue: 25,
    });
    expect(source.kagiOptions).toEqual({
      reversalMode: "percentage",
      reversalSize: null,
      reversalScale: 4,
      atrLength: 2,
      percentageValue: 25,
    });
  });

  it("attaches or switches the main series when the target chart type changes", () => {
    const attachCalls: string[] = [];
    const attachedApi = { id: "attached" };
    const switchedApi = { id: "switched" };
    const current: {
      api: { id: string };
      chartType: "candlestick" | "line";
      styleSchemaId: "candleStyle" | "lineStyle";
      options: Record<string, unknown>;
      inputData: never[];
      lineBreakOptions: { lineCount: number };
      renkoOptions: { boxSize: null; boxSizeMode: "auto" };
      pointFigureOptions: {
        boxSize: null;
        boxSizeMode: "atr";
        boxSizeScale: number;
        reversalBoxes: number;
        atrLength: number;
        percentageValue: number;
      };
      kagiOptions: {
        reversalMode: "fixed";
        reversalSize: null;
        reversalScale: number;
        atrLength: number;
        percentageValue: number;
      };
      data: never[];
    } = {
      api: { id: "old" },
      chartType: "candlestick" as const,
      styleSchemaId: "candleStyle" as const,
      options: {},
      inputData: [],
      lineBreakOptions: { lineCount: 1 },
      renkoOptions: { boxSize: null, boxSizeMode: "auto" as const },
      pointFigureOptions: {
        boxSize: null,
        boxSizeMode: "atr" as const,
        boxSizeScale: 1,
        reversalBoxes: 3,
        atrLength: 14,
        percentageValue: 1,
      },
      kagiOptions: {
        reversalMode: "fixed" as const,
        reversalSize: null,
        reversalScale: 1,
        atrLength: 14,
        percentageValue: 1,
      },
      data: [],
    };

    const nextSource = { ...current, api: switchedApi, chartType: "line" as const, styleSchemaId: "lineStyle" as const };

    const switched = applyMainSeriesStateSnapshot(
      {
        chartType: "line",
        inputCapability: "c",
        builder: "time-bars",
        renderer: "line",
        styleSchemaId: "lineStyle",
        styleOptionSurface: "line",
        styleOptions: {},
        lineBreakOptions: { lineCount: 1 },
        renkoOptions: { boxSize: null, boxSizeMode: "auto" },
        pointFigureOptions: {
          boxSize: null,
          boxSizeMode: "atr",
          boxSizeScale: 1,
          reversalBoxes: 3,
          atrLength: 14,
          percentageValue: 1,
        },
        kagiOptions: {
          reversalMode: "fixed",
          reversalSize: null,
          reversalScale: 1,
          atrLength: 14,
          percentageValue: 1,
        },
      },
      {
        current,
        ensureAttached: (chartType) => {
          attachCalls.push(`ensure:${chartType}`);
          return attachedApi;
        },
        switchChartType: (chartType) => {
          attachCalls.push(`switch:${chartType}`);
          return switchedApi;
        },
        getCurrentSource: () => nextSource,
        createOptions: () => ({}),
        rebuildData: () => {},
        syncContext: () => {},
        resetPrimaryPriceRangeOverride: () => {},
        finalize: () => {},
      },
    );

    expect(switched).toBe(switchedApi);
    expect(attachCalls).toEqual(["switch:line"]);

    const ensured = applyMainSeriesStateSnapshot(
      {
        chartType: "line",
        inputCapability: "c",
        builder: "time-bars",
        renderer: "line",
        styleSchemaId: "lineStyle",
        styleOptionSurface: "line",
        styleOptions: {},
        lineBreakOptions: { lineCount: 1 },
        renkoOptions: { boxSize: null, boxSizeMode: "auto" },
        pointFigureOptions: {
          boxSize: null,
          boxSizeMode: "atr",
          boxSizeScale: 1,
          reversalBoxes: 3,
          atrLength: 14,
          percentageValue: 1,
        },
        kagiOptions: {
          reversalMode: "fixed",
          reversalSize: null,
          reversalScale: 1,
          atrLength: 14,
          percentageValue: 1,
        },
      },
      {
        current: null,
        ensureAttached: (chartType) => {
          attachCalls.push(`ensure:${chartType}`);
          return attachedApi;
        },
        switchChartType: (chartType) => {
          attachCalls.push(`switch:${chartType}`);
          return switchedApi;
        },
        getCurrentSource: () => nextSource,
        createOptions: () => ({}),
        rebuildData: () => {},
        syncContext: () => {},
        resetPrimaryPriceRangeOverride: () => {},
        finalize: () => {},
      },
    );

    expect(ensured).toBe(attachedApi);
    expect(attachCalls).toEqual(["switch:line", "ensure:line"]);
  });
});
