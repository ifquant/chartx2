import { describe, expect, it } from "vitest";

import { createChartPaneLayoutPolicyOwner } from "../../src/lib/chartx/internal/views/chart-pane-layout-policy-owner";

describe("chart pane layout policy owner", () => {
  it("normalizes preferred heights through shared pane policy", () => {
    const owner = createChartPaneLayoutPolicyOwner();

    expect(owner.normalizePreferredHeight(undefined)).toBe(136);
    expect(owner.normalizePreferredHeight(40)).toBe(72);
    expect(owner.normalizePreferredHeight(180.4)).toBe(180);
  });

  it("resolves controlled resize heights for primary-secondary dividers", () => {
    const owner = createChartPaneLayoutPolicyOwner();
    const primary = { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false };
    const secondary = { id: "pane-1", kind: "secondary" as const, preferredHeight: 136, resizable: true };

    expect(owner.resolveControlledResizeHeight(40, {
      dividerAfterPaneId: "primary",
      dividerBeforePaneId: "pane-1",
      startClientY: 20,
      startUpperHeight: 220,
      startLowerHeight: 136,
    }, {
      getPaneById: (paneId) => paneId === "primary" ? primary : paneId === "pane-1" ? secondary : undefined,
    })).toEqual({
      paneId: "pane-1",
      nextHeight: 116,
    });
  });

  it("clamps resize output and ignores non-resizable dividers", () => {
    const owner = createChartPaneLayoutPolicyOwner();
    const upperSecondary = { id: "pane-1", kind: "secondary" as const, preferredHeight: 100, resizable: true };
    const lowerSecondary = { id: "pane-2", kind: "secondary" as const, preferredHeight: 100, resizable: false };

    expect(owner.resolveControlledResizeHeight(500, {
      dividerAfterPaneId: "pane-1",
      dividerBeforePaneId: "primary",
      startClientY: 20,
      startUpperHeight: 120,
      startLowerHeight: 220,
    }, {
      getPaneById: (paneId) =>
        paneId === "pane-1"
          ? upperSecondary
          : paneId === "primary"
            ? { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false }
            : undefined,
    })).toEqual({
      paneId: "pane-1",
      nextHeight: 180,
    });

    expect(owner.resolveControlledResizeHeight(40, {
      dividerAfterPaneId: "primary",
      dividerBeforePaneId: "pane-2",
      startClientY: 20,
      startUpperHeight: 220,
      startLowerHeight: 136,
    }, {
      getPaneById: (paneId) =>
        paneId === "pane-2"
          ? lowerSecondary
          : paneId === "primary"
            ? { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false }
            : undefined,
    })).toBeNull();
  });

  it("lets the lower secondary pane control a secondary-secondary divider when the upper pane is fixed", () => {
    const owner = createChartPaneLayoutPolicyOwner();
    const upperSecondary = { id: "pane-1", kind: "secondary" as const, preferredHeight: 100, resizable: false };
    const lowerSecondary = { id: "pane-2", kind: "secondary" as const, preferredHeight: 120, resizable: true };

    expect(owner.resolveControlledResizeHeight(60, {
      dividerAfterPaneId: "pane-1",
      dividerBeforePaneId: "pane-2",
      startClientY: 20,
      startUpperHeight: 100,
      startLowerHeight: 120,
    }, {
      getPaneById: (paneId) => paneId === "pane-1" ? upperSecondary : paneId === "pane-2" ? lowerSecondary : undefined,
    })).toEqual({
      paneId: "pane-2",
      nextHeight: 80,
    });
  });
});
