import { describe, expect, it } from "vitest";

import {
  calculateBaseBarSpacing,
  resolveActivePane,
  resolveBarSpacing,
  resolveLocalPanePoint,
} from "../../src/lib/chartx/internal/views/chart-layout-geometry";

describe("chart layout geometry helpers", () => {
  it("resolves the active pane and local pane point from a crosshair position", () => {
    const panes = [
      { id: "primary", top: 0, height: 120 },
      { id: "pane-2", top: 120, height: 80 },
    ] as const;

    const activePane = resolveActivePane(panes, 150);
    const localPoint = resolveLocalPanePoint(activePane, { x: 40, y: 150 });

    expect(activePane).toEqual({ id: "pane-2", top: 120, height: 80 });
    expect(localPoint).toEqual({ x: 40, y: 30 });
  });

  it("resolves bar spacing from either current spacing or the base layout spacing", () => {
    expect(calculateBaseBarSpacing(240, 10)).toBe(20);
    expect(resolveBarSpacing(3, 240, 10, { minBarSpacing: 4, maxBarSpacing: 36 })).toBe(4);
    expect(resolveBarSpacing(null, 240, 10, { minBarSpacing: 4, maxBarSpacing: 36 })).toBe(20);
    expect(resolveBarSpacing(null, 1200, 4, { minBarSpacing: 4, maxBarSpacing: 36 })).toBe(36);
  });
});
