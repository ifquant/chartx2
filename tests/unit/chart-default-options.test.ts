import { describe, expect, it } from "vitest";

import {
  DEFAULT_LAYOUT,
  DEFAULT_RIGHT_OFFSET,
  createDefaultChartOptionBundle,
  createDefaultDrawingOptions,
  createDefaultLayoutOptions,
} from "../../src/lib/chartx/internal/views/chart-default-options";

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
  });

  it("creates fresh mutable layout and drawing options", () => {
    const firstLayout = createDefaultLayoutOptions();
    const secondLayout = createDefaultLayoutOptions();
    firstLayout.backgroundColor = "#000000";

    const firstDrawing = createDefaultDrawingOptions();
    const secondDrawing = createDefaultDrawingOptions();
    firstDrawing.magnetSources.open = false;

    expect(secondLayout.backgroundColor).toBe("#fffdf7");
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
});
