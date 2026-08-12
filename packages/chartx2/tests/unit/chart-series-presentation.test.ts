import { describe, expect, it, vi } from "vitest";

import {
  applySeriesFormatterOptions,
  formatSeriesReadoutValue,
  normalizeSeriesMarkers,
  setSeriesMarkers,
} from "../../src/lib/internal/views/chart-series-presentation";

describe("chart series presentation use-cases", () => {
  it("applies formatter options only when explicitly provided", () => {
    const options = {
      valueFormatter: null as ((value: number) => string) | null,
    };

    applySeriesFormatterOptions(options, {});
    expect(options.valueFormatter).toBeNull();

    const formatter = vi.fn((value: number) => `v:${value}`);
    applySeriesFormatterOptions(options, {
      valueFormatter: formatter,
    });
    expect(options.valueFormatter).toBe(formatter);
  });

  it("normalizes markers and triggers render", () => {
    const state = {
      markers: [],
    };
    const render = vi.fn();

    setSeriesMarkers(state, [{ markerId: "marker-a", time: 1 }], {
      normalizeMarkers: () => [{
        time: 1,
        markerId: "marker-a",
        position: "aboveBar",
        shape: "circle",
        color: "#111",
        text: "A",
      }],
      render,
    });

    expect(state.markers).toEqual([{
      markerId: "marker-a",
      time: 1,
      position: "aboveBar",
      shape: "circle",
      color: "#111",
      text: "A",
    }]);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("normalizes marker defaults and stable display order", () => {
    expect(normalizeSeriesMarkers([
      { markerId: "marker-b", time: 3, text: "B", color: "#f00", position: "belowBar", shape: "arrowDown" },
      { markerId: "marker-early", time: 1 },
      { markerId: "marker-a", time: 3, text: "A" },
    ], "#marker-default")).toEqual([
      {
        markerId: "marker-early",
        time: 1,
        position: "aboveBar",
        shape: "circle",
        color: "#marker-default",
        text: "",
        usesDefaultColor: true,
      },
      {
        markerId: "marker-b",
        time: 3,
        position: "belowBar",
        shape: "arrowDown",
        color: "#f00",
        text: "B",
        usesDefaultColor: false,
      },
      {
        markerId: "marker-a",
        time: 3,
        position: "aboveBar",
        shape: "circle",
        color: "#marker-default",
        text: "A",
        usesDefaultColor: true,
      },
    ]);
  });

  it("formats series readout values with formatter or fallback", () => {
    expect(formatSeriesReadoutValue({
      kind: "line",
      options: {
        valueFormatter: (value) => `fmt:${value}`,
      },
    }, 12, {
      formatPrice: (value) => `p:${value}`,
      formatVolume: (value) => `v:${value}`,
    })).toBe("fmt:12");

    expect(formatSeriesReadoutValue({
      kind: "volume",
      options: {
        valueFormatter: null,
      },
    }, 7, {
      formatPrice: (value) => `p:${value}`,
      formatVolume: (value) => `v:${value}`,
    })).toBe("v:7");

    expect(formatSeriesReadoutValue({
      kind: "line",
      options: {
        valueFormatter: null,
      },
    }, null, {
      formatPrice: (value) => `p:${value}`,
      formatVolume: (value) => `v:${value}`,
    })).toBe("--");
  });
});
