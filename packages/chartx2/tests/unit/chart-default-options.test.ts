import { describe, expect, it } from "vitest";

import {
  DEFAULT_LAYOUT,
  DEFAULT_RIGHT_OFFSET,
  LEFT_PRICE_AXIS_MIN_INSET,
  PANE_DIVIDER_HIT_SLOP,
  PANE_GAP,
  createDefaultChartOptionBundle,
  createDefaultDrawingOptions,
  createDefaultLayoutOptions,
} from "../../src/lib/internal/views/chart-default-options";
import { reservePriceAxisInset } from "../../src/lib/internal/views/chart-layout-geometry";

describe("chart default options", () => {
  it("keeps immutable viewport defaults stable", () => {
    expect(DEFAULT_LAYOUT).toEqual({
      width: 960,
      height: 520,
      top: 28,
      right: 18,
      bottom: 34,
      left: 18,
    });
    expect(DEFAULT_RIGHT_OFFSET).toBe(0.8);
    expect(PANE_GAP).toBe(10);
    expect(PANE_DIVIDER_HIT_SLOP).toBe(6);
  });

  it("creates fresh mutable layout and drawing options", () => {
    const firstLayout = createDefaultLayoutOptions();
    const secondLayout = createDefaultLayoutOptions();
    firstLayout.backgroundColor = "#000000";
    firstLayout.plotInsets.left = 0;

    const firstDrawing = createDefaultDrawingOptions();
    const secondDrawing = createDefaultDrawingOptions();
    firstDrawing.magnetSources.open = false;

    expect(secondLayout.backgroundColor).toBe("#fffdf7");
    expect(secondLayout.fitContainerHeight).toBe(false);
    expect(secondLayout.paneGap).toBe(PANE_GAP);
    expect(secondLayout.priceAxisPosition).toBe("right");
    expect(secondLayout.plotInsets).toEqual({
      top: DEFAULT_LAYOUT.top,
      right: DEFAULT_LAYOUT.right,
      bottom: DEFAULT_LAYOUT.bottom,
      left: DEFAULT_LAYOUT.left,
    });
    expect(secondDrawing.magnetSources.open).toBe(true);
  });

  it("creates fresh mutable series option bundles", () => {
    const firstBundle = createDefaultChartOptionBundle();
    const secondBundle = createDefaultChartOptionBundle();

    firstBundle.candlestickOptions.upColor = "#000000";
    firstBundle.defaultCompareOptions.mergePolicy = "exact";

    expect(secondBundle.candlestickOptions.upColor).toBe("#0c8f62");
    expect(secondBundle.defaultCompareOptions.mergePolicy).toBe("carry-forward");
  });

  it("reserves enough plot inset for the public left price axis default", () => {
    expect(reservePriceAxisInset(DEFAULT_LAYOUT, "left", LEFT_PRICE_AXIS_MIN_INSET)).toEqual({
      ...DEFAULT_LAYOUT,
      left: LEFT_PRICE_AXIS_MIN_INSET,
    });
    expect(reservePriceAxisInset(DEFAULT_LAYOUT, "right", LEFT_PRICE_AXIS_MIN_INSET)).toBe(DEFAULT_LAYOUT);
  });
});
