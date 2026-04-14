import { describe, expect, it } from "vitest";

import { assertDrawingTargetValid } from "../../src/lib/chartx/internal/model";

describe("drawing validation", () => {
  it("routes horizontal-line checks through the shared validator registry", () => {
    expect(() =>
      assertDrawingTargetValid({
        kind: "horizontal-line",
        price: Number.NaN,
        lineWidth: 2,
      }),
    ).toThrow("chartx phase-one horizontal-line price must be finite");

    expect(() =>
      assertDrawingTargetValid({
        kind: "horizontal-line",
        price: 132,
        lineWidth: 0,
      }),
    ).toThrow("chartx phase-one horizontal-line lineWidth must be at least 1");
  });

  it("routes trend-line checks through the shared validator registry", () => {
    expect(() =>
      assertDrawingTargetValid({
        kind: "trend-line",
        startTime: 4,
        startPrice: 131,
        endTime: 4,
        endPrice: 131,
        lineWidth: 2,
      }),
    ).toThrow("chartx phase-one trend-line endpoints must not overlap");

    expect(() =>
      assertDrawingTargetValid({
        kind: "trend-line",
        startTime: 4,
        startPrice: 131,
        endTime: 3,
        endPrice: 133,
        lineWidth: 2,
      }),
    ).toThrow("chartx phase-one trend-line startTime must be before endTime");
  });
});
