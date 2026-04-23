import { describe, expect, it } from "vitest";

import { resolvePaneResizeBlockSnapshot } from "../../src/lib/chartx/internal/model";

describe("pane resize block policy", () => {
  it("builds an adjacent primary-secondary resize block", () => {
    const panes = [
      { id: "primary", kind: "primary" as const, resizable: false },
      { id: "pane-1", kind: "secondary" as const, resizable: true },
    ];
    const frames = [
      { id: "primary", height: 220 },
      { id: "pane-1", height: 136 },
    ];

    expect(resolvePaneResizeBlockSnapshot(panes, frames, "primary", "pane-1", "pane-1")).toEqual({
      controlledPaneId: "pane-1",
      startControlledHeight: 136,
      startVariableSpan: 356,
      minOpposingHeight: 160,
    });
  });

  it("builds a downstream linked-resize block against primary plus controlled span", () => {
    const panes = [
      { id: "primary", kind: "primary" as const, resizable: false },
      { id: "pane-1", kind: "secondary" as const, resizable: false },
      { id: "pane-2", kind: "secondary" as const, resizable: false },
      { id: "pane-3", kind: "secondary" as const, resizable: true },
    ];
    const frames = [
      { id: "primary", height: 300 },
      { id: "pane-1", height: 100 },
      { id: "pane-2", height: 90 },
      { id: "pane-3", height: 120 },
    ];

    expect(resolvePaneResizeBlockSnapshot(panes, frames, "pane-1", "pane-2", "pane-3")).toEqual({
      controlledPaneId: "pane-3",
      startControlledHeight: 120,
      startVariableSpan: 420,
      minOpposingHeight: 160,
    });
  });

  it("rejects stale controlled pane ids that do not match the current resize target", () => {
    const panes = [
      { id: "primary", kind: "primary" as const, resizable: false },
      { id: "pane-1", kind: "secondary" as const, resizable: false },
      { id: "pane-2", kind: "secondary" as const, resizable: true },
    ];
    const frames = [
      { id: "primary", height: 220 },
      { id: "pane-1", height: 100 },
      { id: "pane-2", height: 120 },
    ];

    expect(resolvePaneResizeBlockSnapshot(panes, frames, "primary", "pane-1", "pane-1")).toBeNull();
  });
});
