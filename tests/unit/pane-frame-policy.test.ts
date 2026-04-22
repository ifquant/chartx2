import { describe, expect, it } from "vitest";

import {
  normalizePaneHeight,
  resolvePaneFrameAllocation,
} from "../../src/lib/chartx/internal/model/pane-frame-policy";

describe("pane frame policy", () => {
  it("normalizes secondary pane heights through the shared frame policy", () => {
    expect(normalizePaneHeight(undefined)).toBe(136);
    expect(normalizePaneHeight(40)).toBe(72);
    expect(normalizePaneHeight(180.4)).toBe(180);
  });

  it("allocates secondary pane rounding remainder without forcing the last pane to absorb it", () => {
    const allocation = resolvePaneFrameAllocation([
      { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
      { id: "pane-1", kind: "secondary", preferredHeight: 101, resizable: true },
      { id: "pane-2", kind: "secondary", preferredHeight: 101, resizable: true },
      { id: "pane-3", kind: "secondary", preferredHeight: 101, resizable: true },
    ], 470, 10);

    expect(allocation.primaryHeight).toBe(160);
    expect(allocation.secondaryHeights.get("pane-1")).toBe(94);
    expect(allocation.secondaryHeights.get("pane-2")).toBe(93);
    expect(allocation.secondaryHeights.get("pane-3")).toBe(93);
  });
});
