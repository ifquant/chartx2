import { describe, expect, it } from "vitest";

import {
  PaneCollection,
  buildPaneFrames,
  normalizePaneHeight,
  resolvePaneDivider,
  resolvePaneDividerByIds,
} from "../../src/lib/chartx/internal/model";

describe("pane model", () => {
  it("creates a primary pane by default and appends secondary panes with stable ids", () => {
    const panes = new PaneCollection();

    const first = panes.addSecondaryPane({ height: 120, resizable: true });
    const second = panes.addSecondaryPane({ height: 96, resizable: false });

    expect(panes.list().map((pane) => pane.id)).toEqual(["primary", "pane-1", "pane-2"]);
    expect(first.id).toBe("pane-1");
    expect(second.id).toBe("pane-2");
    expect(panes.getByIndex(0)?.kind).toBe("primary");
  });

  it("normalizes pane heights and preserves a minimum primary pane span in frame layout", () => {
    const panes = new PaneCollection();
    panes.addSecondaryPane({ height: 180, resizable: true });
    panes.addSecondaryPane({ height: 180, resizable: true });

    const frames = buildPaneFrames(panes.list(), 400, 10);
    const primary = frames.find((pane) => pane.id === "primary");

    expect(normalizePaneHeight(undefined)).toBe(136);
    expect(normalizePaneHeight(40)).toBe(72);
    expect(primary?.height).toBeGreaterThanOrEqual(160);
    expect(frames).toHaveLength(3);
  });

  it("resolves resizable pane dividers from geometry and from persisted ids", () => {
    const panes = new PaneCollection();
    const secondary = panes.addSecondaryPane({ height: 100, resizable: true });
    const frames = buildPaneFrames(panes.list(), 320, 10);
    const divider = resolvePaneDivider(
      panes.list(),
      frames,
      frames[0]!.top + frames[0]!.height + 5,
      10,
      6,
    );
    const persisted = resolvePaneDividerByIds(frames, "primary", secondary.id, 10);

    expect(divider?.upperPaneId).toBe("primary");
    expect(divider?.lowerPaneId).toBe(secondary.id);
    expect(persisted?.position).toBe(divider?.position);
  });

  it("keeps secondary-secondary dividers interactive when either adjacent pane is resizable", () => {
    const panes = new PaneCollection();
    panes.addSecondaryPane({ height: 120, resizable: false });
    panes.addSecondaryPane({ height: 100, resizable: true });

    const frames = buildPaneFrames(panes.list(), 420, 10);
    const divider = resolvePaneDivider(
      panes.list(),
      frames,
      frames[1]!.top + frames[1]!.height + 5,
      10,
      6,
    );

    expect(divider?.upperPaneId).toBe("pane-1");
    expect(divider?.lowerPaneId).toBe("pane-2");
  });

  it("keeps the primary divider interactive when a downstream secondary pane is resizable", () => {
    const panes = new PaneCollection();
    panes.addSecondaryPane({ height: 120, resizable: false });
    panes.addSecondaryPane({ height: 100, resizable: true });

    const frames = buildPaneFrames(panes.list(), 420, 10);
    const divider = resolvePaneDivider(
      panes.list(),
      frames,
      frames[0]!.top + frames[0]!.height + 5,
      10,
      6,
    );

    expect(divider?.upperPaneId).toBe("primary");
    expect(divider?.lowerPaneId).toBe("pane-1");
  });

  it("keeps a fixed secondary-secondary divider interactive when a downstream pane is resizable", () => {
    const panes = new PaneCollection();
    panes.addSecondaryPane({ height: 100, resizable: false });
    panes.addSecondaryPane({ height: 90, resizable: false });
    panes.addSecondaryPane({ height: 120, resizable: true });

    const frames = buildPaneFrames(panes.list(), 620, 10);
    const divider = resolvePaneDivider(
      panes.list(),
      frames,
      frames[1]!.top + frames[1]!.height + 5,
      10,
      6,
    );

    expect(divider?.upperPaneId).toBe("pane-1");
    expect(divider?.lowerPaneId).toBe("pane-2");
  });

  it("builds pane frames without biasing rounding remainder into the last pane", () => {
    const panes = new PaneCollection();
    panes.addSecondaryPane({ height: 101, resizable: true });
    panes.addSecondaryPane({ height: 101, resizable: true });
    panes.addSecondaryPane({ height: 101, resizable: true });

    const frames = buildPaneFrames(panes.list(), 470, 10);

    expect(frames.find((pane) => pane.id === "primary")?.height).toBe(160);
    expect(frames.find((pane) => pane.id === "pane-1")?.height).toBe(94);
    expect(frames.find((pane) => pane.id === "pane-2")?.height).toBe(93);
    expect(frames.find((pane) => pane.id === "pane-3")?.height).toBe(93);
  });
});
