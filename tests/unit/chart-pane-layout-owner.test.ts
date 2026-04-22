import { describe, expect, it } from "vitest";

import type { PaneModelState } from "../../src/lib/chartx/internal/model";
import { createChartPaneLayoutOwner } from "../../src/lib/chartx/internal/views/chart-pane-layout-owner";

describe("chart pane layout owner", () => {
  it("builds pane frames and resolves the active pane through one shared surface", () => {
    const panes = [
      { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
      { id: "pane-1", kind: "secondary", preferredHeight: 100, resizable: true },
    ] satisfies PaneModelState[];

    const owner = createChartPaneLayoutOwner({
      listPanes: () => panes,
      paneGap: 12,
    });

    const frames = owner.paneFrames(320);
    expect(frames).toHaveLength(2);
    expect(owner.resolveActivePane({ x: 10, y: 250 }, 320, frames)?.id).toBe("pane-1");
    expect(owner.resolveActivePane(null, 320, frames)).toBeNull();
  });

  it("resolves resizable dividers from the same pane-frame model", () => {
    const panes = [
      { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
      { id: "pane-1", kind: "secondary", preferredHeight: 100, resizable: true },
    ] satisfies PaneModelState[];

    const owner = createChartPaneLayoutOwner({
      listPanes: () => panes,
      paneGap: 10,
    });

    const frames = owner.paneFrames(320);
    const dividerY = frames[0]!.top + frames[0]!.height + 5;
    const divider = owner.resolvePaneDivider(dividerY, 320, 6, frames);

    expect(divider?.upperPaneId).toBe("primary");
    expect(divider?.lowerPaneId).toBe("pane-1");
  });

  it("keeps secondary-secondary dividers available when the lower pane is the resizable side", () => {
    const panes = [
      { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
      { id: "pane-1", kind: "secondary", preferredHeight: 100, resizable: false },
      { id: "pane-2", kind: "secondary", preferredHeight: 120, resizable: true },
    ] satisfies PaneModelState[];

    const owner = createChartPaneLayoutOwner({
      listPanes: () => panes,
      paneGap: 10,
    });

    const frames = owner.paneFrames(420);
    const dividerY = frames[1]!.top + frames[1]!.height + 5;
    const divider = owner.resolvePaneDivider(dividerY, 420, 6, frames);

    expect(divider?.upperPaneId).toBe("pane-1");
    expect(divider?.lowerPaneId).toBe("pane-2");
  });
});
