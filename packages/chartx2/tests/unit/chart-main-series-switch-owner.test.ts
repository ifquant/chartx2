import { describe, expect, it, vi } from "vitest";

import { createChartMainSeriesSwitchOwner } from "../../src/lib/internal/views/chart-main-series-switch-owner";

describe("chart main series switch owner", () => {
  it("builds preserved state and routes switch callbacks", () => {
    const calls: string[] = [];
    const nextApi = { id: "next-api" };
    const owner = createChartMainSeriesSwitchOwner<{ id: string }>({
      removeCurrent: (api) => {
        calls.push(`remove:${api.id}`);
        return true;
      },
      clearPriceRangeOverride: () => calls.push("clear-range"),
      attachSeries: (type, preserved) => {
        calls.push(`attach:${type}`);
        expect(preserved).toMatchObject({
          id: "main-1",
          label: "Main 1",
          data: [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
          markers: [{ time: 1, text: "A" }],
          options: { color: "#2563eb" },
          previousStyleSchemaId: "lineStyle",
        });
        return nextApi;
      },
      render: () => calls.push("render"),
      emitChartTypeChange: (type) => calls.push(`emit:${type}`),
    });

    const source = {
      id: "main-1",
      label: "Main 1",
      inputData: [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
      visuals: new Map([[1, { color: "#10b981", isUp: true }]]),
      markers: [{ time: 1, text: "A" }],
      priceLines: new Map([[
        "line-1",
        { id: "line-1", price: 10, color: "#111111", lineWidth: 1, title: "Entry" },
      ]]),
      options: { color: "#2563eb" },
      styleSchemaId: "lineStyle",
    };

    const preserved = owner.mainSeriesSwitch.buildPreservedState(source) as {
      priceLines: Map<string, { price: number }>;
      visuals: Map<number, { isUp: boolean }>;
    };
    preserved.priceLines.get("line-1")!.price = 20;
    preserved.visuals.set(2, { isUp: false });

    expect(source.priceLines.get("line-1")!.price).toBe(10);
    expect(source.visuals.has(2)).toBe(false);
    expect(owner.mainSeriesSwitch.removeCurrent({ id: "old-api" })).toBe(true);
    owner.mainSeriesSwitch.clearPriceRangeOverride();
    expect(owner.mainSeriesSwitch.attachSeries("line", owner.mainSeriesSwitch.buildPreservedState(source))).toBe(nextApi);
    owner.mainSeriesSwitch.render();
    owner.mainSeriesSwitch.emitChartTypeChange("line");

    expect(calls).toEqual([
      "remove:old-api",
      "clear-range",
      "attach:line",
      "render",
      "emit:line",
    ]);
  });

  it("preserves remove failure for sourceOwner chart-type replacement", () => {
    const owner = createChartMainSeriesSwitchOwner<{ id: string }>({
      removeCurrent: vi.fn(() => false),
      clearPriceRangeOverride: vi.fn(),
      attachSeries: vi.fn(),
      render: vi.fn(),
      emitChartTypeChange: vi.fn(),
    });

    expect(owner.mainSeriesSwitch.removeCurrent({ id: "missing" })).toBe(false);
  });
});
