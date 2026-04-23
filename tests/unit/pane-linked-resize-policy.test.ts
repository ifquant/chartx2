import { describe, expect, it } from "vitest";

import { resolvePaneResizeTargetId } from "../../src/lib/chartx/internal/model";

describe("pane linked resize policy", () => {
  it("prefers an adjacent resizable secondary pane before scanning downstream", () => {
    const panes = [
      { id: "primary", kind: "primary" as const, resizable: false },
      { id: "pane-1", kind: "secondary" as const, resizable: true },
      { id: "pane-2", kind: "secondary" as const, resizable: true },
    ];

    expect(resolvePaneResizeTargetId(panes, "primary", "pane-1")).toBe("pane-1");
    expect(resolvePaneResizeTargetId(panes, "pane-1", "pane-2")).toBe("pane-1");
  });

  it("falls through to the first downstream resizable secondary pane when adjacent panes are fixed", () => {
    const panes = [
      { id: "primary", kind: "primary" as const, resizable: false },
      { id: "pane-1", kind: "secondary" as const, resizable: false },
      { id: "pane-2", kind: "secondary" as const, resizable: false },
      { id: "pane-3", kind: "secondary" as const, resizable: true },
    ];

    expect(resolvePaneResizeTargetId(panes, "primary", "pane-1")).toBe("pane-3");
    expect(resolvePaneResizeTargetId(panes, "pane-1", "pane-2")).toBe("pane-3");
  });

  it("returns null when no resizable secondary pane exists at or below the divider", () => {
    const panes = [
      { id: "primary", kind: "primary" as const, resizable: false },
      { id: "pane-1", kind: "secondary" as const, resizable: false },
      { id: "pane-2", kind: "secondary" as const, resizable: false },
    ];

    expect(resolvePaneResizeTargetId(panes, "primary", "pane-1")).toBeNull();
    expect(resolvePaneResizeTargetId(panes, "pane-1", "pane-2")).toBeNull();
  });
});
