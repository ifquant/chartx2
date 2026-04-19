import { describe, expect, it } from "vitest";

import type { PlotRow, TimePointIndex } from "../../src/lib/chartx/internal/model";
import {
  createDrawingMeta,
  createHorizontalLineDrawingState,
  createTrendLineDrawingState,
  resolveTrendLineDefaults,
} from "../../src/lib/chartx/internal/views/chart-drawing-state";

describe("chart drawing state use-case", () => {
  it("creates drawing meta with stable ids and titles", () => {
    const meta = createDrawingMeta("horizontal-line", 7, {
      formatSeriesKindLabel: (kind) => (kind === "horizontal-line" ? "Horizontal Line" : "Trend Line"),
    });

    expect(meta).toEqual({
      id: "drawing-7",
      title: "Horizontal Line 7",
    });
  });

  it("builds horizontal-line state from a price-line factory and magnet overrides", () => {
    const state = createHorizontalLineDrawingState(
      {
        price: 12,
        color: "#3b82f6",
        lineWidth: 0,
        magnetTolerancePx: -3,
      },
      {
        title: "Horizontal Line 3",
        createPriceLineState: (options) => ({
          id: "price-line-1",
          price: options.price ?? 10,
          color: options.color ?? "#111111",
          lineWidth: Math.max(1, options.lineWidth ?? 1),
          title: options.title ?? "fallback",
        }),
      },
    );

    expect(state).toEqual({
      line: {
        id: "price-line-1",
        price: 12,
        color: "#3b82f6",
        lineWidth: 1,
        title: "Horizontal Line 3",
      },
      magnetTolerancePx: 0,
    });
  });

  it("builds trend-line state from defaults and line color fallback", () => {
    const state = createTrendLineDrawingState(
      {
        endPrice: 25,
        lineWidth: 0,
        timeMagnetPolicy: "previous",
      },
      {
        lineColor: "#0c8f62",
        resolveDefaults: () => ({
          startTime: 1,
          startPrice: 10,
          endTime: 3,
          endPrice: 20,
        }),
      },
    );

    expect(state).toEqual({
      startTime: 1,
      startPrice: 10,
      endTime: 3,
      endPrice: 25,
      color: "#0c8f62",
      lineWidth: 1,
      timeMagnetPolicy: "previous",
    });
  });

  it("derives trend-line defaults from the main bar sequence close prices", () => {
    const bars: readonly PlotRow<number>[] = [
      {
        index: 0 as TimePointIndex,
        time: 100,
        originalTime: 100,
        value: [10, 12, 9, 11],
      },
      {
        index: 1 as TimePointIndex,
        time: 200,
        originalTime: 200,
        value: [11, 13, 10, 12],
      },
    ];

    expect(resolveTrendLineDefaults(bars)).toEqual({
      startTime: 100,
      startPrice: 11,
      endTime: 200,
      endPrice: 12,
    });
    expect(resolveTrendLineDefaults([])).toEqual({
      startTime: 0,
      startPrice: 0,
      endTime: 1,
      endPrice: 1,
    });
  });
});
