import { describe, expect, it } from "vitest";

import { PriceRangeImpl, PriceScale } from "../../src/lib/internal/model";
import {
  applyPrimaryPaneScale,
  applySecondaryPaneScale,
} from "../../src/lib/internal/views/chart-pane-scale";

function createRangeSource(id: string, min: number, max: number) {
  return {
    id,
    store: {
      priceRange: () => new PriceRangeImpl(min, max),
    },
  };
}

describe("chart pane scale use-case", () => {
  it("computes the primary range from projected rows instead of compact store indices", () => {
    const priceScale = new PriceScale();

    const result = applyPrimaryPaneScale({
      mainSource: createRangeSource("main", 1, 2),
      primaryStudies: [{
        ...createRangeSource("study", 1, 2),
        studyKind: "overlay",
      }],
      primaryRowSets: new Map([
        ["main", [
          { index: 0, value: [10, 12, 9, 11] },
          { index: 1, value: [11, 13, 10, 12] },
        ]],
        ["study", [
          { index: 2, value: [30, 30, 30, 30] },
          { index: 3, value: [40, 40, 40, 40] },
        ]],
      ]),
      primaryScaleSeriesOnly: false,
      priceRangeOverride: null,
      paneHeight: 180,
      priceScale,
    });

    expect(result.range?.minValue()).toBe(9);
    expect(result.range?.maxValue()).toBe(40);
  });

  it("applies the merged primary-pane range while skipping compare studies that should not affect the main scale", () => {
    const priceScale = new PriceScale();
    const mainSource = createRangeSource("main", 10, 20);
    const compareSkipped = {
      ...createRangeSource("compare-skip", 100, 200),
      studyKind: "compare",
      compareOptions: { affectMainScale: false },
    };
    const compareIncluded = {
      ...createRangeSource("compare-keep", 5, 25),
      studyKind: "compare",
      compareOptions: { affectMainScale: true },
    };

    const result = applyPrimaryPaneScale({
      mainSource,
      primaryStudies: [compareSkipped, compareIncluded],
      primaryRowSets: new Map([
        ["main", [{ index: 0 }, { index: 1 }]],
        ["compare-skip", [{ index: 0 }, { index: 1 }]],
        ["compare-keep", [{ index: 0 }, { index: 1 }]],
      ]),
      primaryScaleSeriesOnly: false,
      priceRangeOverride: null,
      paneHeight: 180,
      priceScale,
    });

    expect(result.range?.minValue()).toBe(5);
    expect(result.range?.maxValue()).toBe(25);
    expect(result.rangeMin).toBe(5);
    expect(priceScale.getPriceRange()?.minValue()).toBe(5);
    expect(priceScale.getPriceRange()?.maxValue()).toBe(25);
  });

  it("lets the override replace the computed primary-pane range", () => {
    const priceScale = new PriceScale();
    const override = new PriceRangeImpl(50, 60);

    const result = applyPrimaryPaneScale({
      mainSource: createRangeSource("main", 10, 20),
      primaryStudies: [],
      primaryRowSets: new Map([["main", [{ index: 0 }, { index: 1 }]]]),
      primaryScaleSeriesOnly: false,
      priceRangeOverride: override,
      paneHeight: 100,
      priceScale,
    });

    expect(result.range).toBe(override);
    expect(result.rangeMin).toBe(50);
    expect(priceScale.getPriceRange()).toBe(override);
  });

  it("applies the merged secondary-pane range when rows are available", () => {
    const paneScale = new PriceScale();
    const paneSeries = [
      createRangeSource("s1", 30, 40),
      createRangeSource("s2", 25, 45),
    ];

    const result = applySecondaryPaneScale({
      paneSeries,
      secondaryRows: new Map([
        ["s1", [{ index: 0 }, { index: 1 }]],
        ["s2", [{ index: 0 }, { index: 1 }]],
      ]),
      paneHeight: 120,
      priceScale: paneScale,
    });

    expect(result.hasPriceScale).toBe(true);
    expect(result.range?.minValue()).toBe(25);
    expect(result.range?.maxValue()).toBe(45);
    expect(result.rangeMin).toBe(25);
    expect(paneScale.getPriceRange()?.minValue()).toBe(25);
    expect(paneScale.getPriceRange()?.maxValue()).toBe(45);
  });

  it("reports missing secondary pane scale when no rows are renderable", () => {
    const paneScale = new PriceScale();

    const result = applySecondaryPaneScale({
      paneSeries: [createRangeSource("s1", 30, 40)],
      secondaryRows: new Map([["s1", []]]),
      paneHeight: 120,
      priceScale: paneScale,
    });

    expect(result.hasPriceScale).toBe(false);
    expect(result.range).toBeNull();
    expect(result.rangeMin).toBe(0);
    expect(paneScale.getPriceRange()).toBeNull();
  });
});
