import { describe, expect, it, vi } from "vitest";

import type { PhaseOnePriceLineApi } from "../../src/lib/internal/views/chart-api-types";
import { createChartSecondarySeriesApiOwner } from "../../src/lib/internal/views/chart-secondary-series-api-owner";

describe("chart secondary series api owner", () => {
  it("owns secondary data mutation, markers, and price lines", () => {
    const source = createSource();
    const priceLineApi = { remove: vi.fn(), applyOptions: vi.fn() } as PhaseOnePriceLineApi;
    const calls: string[] = [];
    const owner = createOwner(source, calls, priceLineApi);

    owner.setSecondaryData("api-1", [{ time: 2, open: 9, high: 12, low: 8, close: 11 }], "line");
    owner.updateSecondary("api-1", { time: 3, open: 11, high: 13, low: 10, close: 12 }, "line");
    owner.setMarkers("api-1", [{ markerId: "marker-b", time: 4, text: "B" }, { markerId: "marker-a", time: 1, text: "A" }], "line");
    owner.createPriceLine(source, { price: 12, title: "Entry" });

    expect(source.inputData).toEqual([
      { time: 2, open: 9, high: 12, low: 8, close: 11 },
      { time: 3, open: 11, high: 13, low: 10, close: 12 },
    ]);
    expect(source.data).toEqual([
      { time: 2, open: 9, high: 12, low: 8, close: 11, resolved: true },
      { time: 3, open: 11, high: 13, low: 10, close: 12, resolved: true },
    ]);
    expect(source.markers).toEqual([
      { markerId: "marker-a", time: 1, position: "aboveBar", shape: "circle", color: "#2563eb", text: "A", usesDefaultColor: true },
      { markerId: "marker-b", time: 4, position: "aboveBar", shape: "circle", color: "#2563eb", text: "B", usesDefaultColor: true },
    ]);
    expect(source.priceLines.get("line-1")).toEqual({
      id: "line-1",
      price: 12,
      color: "#111111",
      lineWidth: 1,
      title: "Entry",
    });
    expect(calls).toEqual([
      "resolve",
      "reset-viewport",
      "render",
      "update-canonical",
      "resolve",
      "render",
      "render",
      "create-price-line",
    ]);
  });

  it("routes compare and moving-average options through study state", () => {
    const source = createSource();
    const calls: string[] = [];
    const owner = createOwner(source, calls, {
      remove: vi.fn(),
      applyOptions: vi.fn(),
    } as PhaseOnePriceLineApi);

    owner.applyCompareOptions(source, {
      affectMainScale: true,
      requestedSymbol: "ES",
      mergePolicy: "exact",
    });
    owner.applyMovingAverageStudyOptions(source, {
      length: 34,
      inputContextMode: "requested-context",
    });

    expect(owner.getCompareOptions(source)).toMatchObject({
      affectMainScale: true,
      requestedSymbol: "ES",
      mergePolicy: "exact",
    });
    expect(owner.getMovingAverageStudyOptions(source)).toMatchObject({
      length: 34,
      inputContextMode: "requested-context",
      requestedSymbol: "ES",
      mergePolicy: "exact",
    });
    expect(source.data.every((row) => (row as { resolved?: boolean }).resolved)).toBe(true);
    expect(calls).toEqual(["resolve", "render", "resolve", "render"]);
  });

  it("routes scripted-study options through study state", () => {
    const source = createSource();
    const calls: string[] = [];
    const owner = createOwner(source, calls, {
      remove: vi.fn(),
      applyOptions: vi.fn(),
    } as PhaseOnePriceLineApi);

    owner.applyScriptedStudyOptions(source, {
      scriptId: "script-1",
      inputValues: { length: 21 },
      inputContextMode: "requested-context",
      requestedSymbol: "CL1!",
      requestedResolution: "60",
      requestedSession: "regular",
      requestedTimezone: "UTC",
      mergePolicy: "exact",
    });

    expect(owner.getScriptedStudyOptions(source)).toEqual({
      scriptId: "script-1",
      inputValues: { length: 21 },
      inputContextMode: "requested-context",
      requestedSymbol: "CL1!",
      requestedResolution: "60",
      requestedSession: "regular",
      requestedTimezone: "UTC",
      mergePolicy: "exact",
    });
    expect(source.data.every((row) => (row as { resolved?: boolean }).resolved)).toBe(true);
    expect(calls).toEqual(["resolve", "render"]);
  });
});

function createOwner(
  source: ReturnType<typeof createSource>,
  calls: string[],
  priceLineApi: PhaseOnePriceLineApi,
) {
  return createChartSecondarySeriesApiOwner({
    assertSeriesActive: () => calls.push("assert"),
    getSourceByApiOrThrow: () => source,
    resolveDisplayData: (nextSource) => {
      calls.push("resolve");
      return nextSource.inputData.map((row) => ({ ...row, resolved: true }));
    },
    resetViewport: () => calls.push("reset-viewport"),
    render: () => calls.push("render"),
    updateCanonical: (existing, bar) => {
      calls.push("update-canonical");
      return [...existing, bar];
    },
    buildHistogramVisuals: (data) =>
      new Map(data.map((row) => [row.time, { color: row.color, isUp: row.up ?? true }])),
    normalizeHistogramData: (data) =>
      data.map((row) => ({ time: row.time, open: row.value, high: row.value, low: row.value, close: row.value })),
    normalizeHistogramBar: (bar) => ({
      time: bar.time,
      open: bar.value,
      high: bar.value,
      low: bar.value,
      close: bar.value,
    }),
    createPriceLineState: (options = {}) => ({
      id: "line-1",
      price: options.price ?? 0,
      color: options.color ?? "#111111",
      lineWidth: options.lineWidth ?? 1,
      title: options.title ?? "",
    }),
    createPriceLine: (lines, state) => {
      calls.push("create-price-line");
      lines.set(state.id, state);
      return priceLineApi;
    },
    removePriceLine: (lines, line) => {
      calls.push("remove-price-line");
      for (const [id] of lines) {
        lines.delete(id);
        break;
      }
      line.remove();
    },
    defaultCompareOptions: {
      affectMainScale: false,
      inputContextMode: "chart-context",
      requestedSymbol: null,
      requestedResolution: null,
      requestedSession: null,
      requestedTimezone: null,
      mergePolicy: "carry-forward",
    },
    defaultMovingAverageOptions: {
      length: 20,
      inputContextMode: "chart-context",
      requestedSymbol: null,
      requestedResolution: null,
      requestedSession: null,
      requestedTimezone: null,
      mergePolicy: "carry-forward",
    },
  });
}

function createSource() {
  return {
    role: "study" as const,
    inputData: [] as Array<{ time: number; open: number; high: number; low: number; close: number }>,
    data: [] as unknown[],
    visuals: new Map<number, { color?: string; isUp: boolean }>(),
    markers: [] as Array<{
      markerId: string;
      time: number;
      position: "aboveBar" | "belowBar" | "inBar";
      shape: "circle" | "square" | "arrowUp" | "arrowDown";
      color: string;
      text: string;
    }>,
    priceLines: new Map<string, { id: string; price: number; color: string; lineWidth: number; title: string }>(),
    options: {},
    inputContext: {
      mode: "chart-context" as const,
      symbol: null,
      resolution: null,
      session: null,
      timezone: null,
      mergePolicy: "carry-forward" as const,
    },
    compareOptions: undefined as undefined | { affectMainScale: boolean },
    indicator: undefined as
      | undefined
      | { kind: string; length?: number; scriptId?: string; inputValues?: Record<string, number> },
  };
}
