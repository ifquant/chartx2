import { describe, expect, it } from "vitest";

import {
  moveKeyboardMarker,
  orderedKeyboardMarkerTargets,
  resolvePointerMarkerActivation,
} from "../../src/lib/internal/views/market-chart-marker-activation";

const early = { markerId: "early", time: 1, text: "Early", tooltip: "first" } as const;
const overlapA = { markerId: "a", time: 2, text: "A" } as const;
const overlapB = { markerId: "b", time: 2, text: "B" } as const;

describe("market chart marker activation coordinator", () => {
  it("uses nearest, later draw order and markerId then cycles only for an unchanged signature", () => {
    const targets = [
      { marker: overlapA, inputIndex: 0, centerX: 100, centerY: 100 },
      { marker: overlapB, inputIndex: 1, centerX: 100, centerY: 100 },
      { marker: early, inputIndex: 2, centerX: 108, centerY: 100 },
    ];
    const first = resolvePointerMarkerActivation(targets, { x: 100, y: 100 }, "same", null);
    expect(first.target?.marker.markerId).toBe("b");
    const second = resolvePointerMarkerActivation(targets, { x: 100, y: 100 }, "same", first.cycle);
    expect(second.target?.marker.markerId).toBe("a");
    const third = resolvePointerMarkerActivation(targets, { x: 100, y: 100 }, "same", second.cycle);
    expect(third.target?.marker.markerId).toBe("early");
    expect(resolvePointerMarkerActivation(targets, { x: 100, y: 100 }, "new-generation", third.cycle).target?.marker.markerId).toBe("b");
    expect(resolvePointerMarkerActivation(targets, { x: 140, y: 140 }, "moved", null).target).toBeNull();
  });

  it("provides chronological roving order and overlap-only vertical navigation", () => {
    const ordered = orderedKeyboardMarkerTargets([overlapB, early, overlapA]);
    expect(ordered.map((marker) => marker.markerId)).toEqual(["early", "b", "a"]);
    expect(moveKeyboardMarker(ordered, "early", "ArrowRight")?.markerId).toBe("b");
    expect(moveKeyboardMarker(ordered, "b", "ArrowDown")?.markerId).toBe("a");
    expect(moveKeyboardMarker(ordered, "a", "ArrowUp")?.markerId).toBe("b");
    expect(moveKeyboardMarker(ordered, "a", "Home")?.markerId).toBe("early");
    expect(moveKeyboardMarker(ordered, "early", "End")?.markerId).toBe("a");
  });
});
