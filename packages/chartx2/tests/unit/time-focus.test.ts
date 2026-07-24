import { describe, expect, it } from "vitest";

import { resolveTimeFocus } from "../../src/lib/internal/model/time-focus";

const rows = [
  { time: 10, index: 0 },
  { time: 20, index: 1 },
  { time: 30, index: 2 },
];

describe("time focus resolution", () => {
  it("resolves no data, exact, nearest, earlier ties, and domain boundaries", () => {
    expect(resolveTimeFocus([], { time: 10, maxDistance: 0 }).result).toEqual({ kind: "noData", requestedTime: 10 });
    expect(resolveTimeFocus(rows, { time: 20, maxDistance: 0 }).result).toEqual({
      kind: "exact", requestedTime: 20, resolvedTime: 20, distance: 0,
    });
    expect(resolveTimeFocus(rows, { time: 16, maxDistance: 4 }).result).toEqual({
      kind: "nearest", requestedTime: 16, resolvedTime: 20, distance: 4,
    });
    expect(resolveTimeFocus(rows, { time: 15, maxDistance: 5 }).result).toEqual({
      kind: "nearest", requestedTime: 15, resolvedTime: 10, distance: 5,
    });
    expect(resolveTimeFocus(rows, { time: 9, maxDistance: 99 }).result).toEqual({
      kind: "outOfDomain", requestedTime: 9, reason: "beforeFirst",
    });
    expect(resolveTimeFocus(rows, { time: 31, maxDistance: 99 }).result).toEqual({
      kind: "outOfDomain", requestedTime: 31, reason: "afterLast",
    });
  });

  it("enforces explicit bounded nearest and reports duplicate candidates as ambiguous", () => {
    expect(resolveTimeFocus(rows, { time: 14, maxDistance: 3 }).result).toEqual({
      kind: "outOfDomain", requestedTime: 14, reason: "maxDistanceExceeded",
    });
    expect(resolveTimeFocus(rows, { time: 14, maxDistance: 4 }).result.kind).toBe("nearest");
    expect(resolveTimeFocus(rows, { time: 14, maxDistance: 0 }).result.kind).toBe("outOfDomain");

    const duplicates = [
      { time: 10, index: 0 }, { time: 20, index: 1 }, { time: 20, index: 2 }, { time: 30, index: 3 },
    ];
    expect(resolveTimeFocus(duplicates, { time: 20, maxDistance: 0 }).result).toEqual({
      kind: "ambiguous", requestedTime: 20, resolvedTime: 20,
    });
    expect(resolveTimeFocus(duplicates, { time: 19, maxDistance: 1 }).result).toEqual({
      kind: "ambiguous", requestedTime: 19, resolvedTime: 20,
    });
    expect(resolveTimeFocus(duplicates, { time: 19, maxDistance: 0 }).result).toEqual({
      kind: "outOfDomain", requestedTime: 19, reason: "maxDistanceExceeded",
    });
  });

  it("calculates clamped padding only after a unique accepted row", () => {
    expect(resolveTimeFocus(rows, { time: 10, maxDistance: 0 }).logicalRange).toEqual({ from: -0.5, to: 2.5 });
    expect(resolveTimeFocus(rows, { time: 20, maxDistance: 0, paddingBeforeBars: 0, paddingAfterBars: 0 }).logicalRange).toEqual({ from: 0.5, to: 1.5 });
    expect(resolveTimeFocus(rows, { time: 30, maxDistance: 0, paddingBeforeBars: 1, paddingAfterBars: 0 }).logicalRange).toEqual({ from: 0.5, to: 2.5 });
    expect(resolveTimeFocus([{ time: 10, index: 7 }], { time: 10, maxDistance: 0, paddingBeforeBars: 0, paddingAfterBars: 0 }).logicalRange).toEqual({ from: 6.5, to: 7.5 });
  });

  it("throws before results for invalid requests and invalid active-axis invariants", () => {
    expect(() => resolveTimeFocus(rows, { time: Number.NaN, maxDistance: 0 })).toThrow("finite time");
    expect(() => resolveTimeFocus(rows, { time: 10, maxDistance: -1 })).toThrow("non-negative");
    expect(() => resolveTimeFocus(rows, { time: 10, maxDistance: 0, paddingBeforeBars: 0.5 })).toThrow("safe integer");
    expect(() => resolveTimeFocus([{ time: 10, index: 1 }, { time: 9, index: 2 }], { time: 10, maxDistance: 0 })).toThrow("times must not decrease");
    expect(() => resolveTimeFocus([{ time: 10, index: 1 }, { time: 20, index: 1 }], { time: 10, maxDistance: 0 })).toThrow("strictly increase");
    expect(() => resolveTimeFocus([{ time: Number.POSITIVE_INFINITY, index: 1 }], { time: 10, maxDistance: 0 })).toThrow("finite time and logical index");
  });
});
