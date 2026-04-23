import { describe, expect, it } from "vitest";

import { createChartPaneResizeBlockOwner } from "../../src/lib/chartx/internal/views/chart-pane-resize-block-owner";

describe("chart pane resize block owner", () => {
  it("owns controlled-pane and pointer-down resize-state composition", () => {
    const owner = createChartPaneResizeBlockOwner();
    const primary = { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false };
    const fixedSecondary = { id: "pane-1", kind: "secondary" as const, preferredHeight: 100, resizable: false };
    const resizableSecondary = { id: "pane-2", kind: "secondary" as const, preferredHeight: 120, resizable: true };
    const panes = [primary, fixedSecondary, resizableSecondary];
    const paneFrames = [
      { id: "primary", height: 220 },
      { id: "pane-1", height: 100 },
      { id: "pane-2", height: 120 },
    ];

    expect(owner.resolveControlledPaneId("primary", "pane-1", {
      getPaneById: (paneId) => panes.find((pane) => pane.id === paneId),
      listPanes: () => panes,
    })).toBe("pane-2");

    expect(owner.resolvePaneResizeState("primary", "pane-1", 24, {
      getPaneById: (paneId) => panes.find((pane) => pane.id === paneId),
      listPanes: () => panes,
      paneFrames: () => paneFrames,
    })).toEqual({
      startClientY: 24,
      activeBlock: {
        handle: {
          dividerAfterPaneId: "primary",
          dividerBeforePaneId: "pane-1",
          block: {
            controlledPaneId: "pane-2",
            blockPaneIds: ["primary", "pane-1", "pane-2"],
            startControlledHeight: 120,
            startVariableSpan: 340,
            minOpposingHeight: 160,
          },
        },
        group: {
          controlledPaneId: "pane-2",
          opposingPaneId: "primary",
          blockPaneIds: ["primary", "pane-1", "pane-2"],
          participatingPaneIds: ["primary", "primary", "pane-1", "pane-2"],
          variablePaneIds: ["primary", "pane-2"],
          fixedPaneIds: ["pane-1"],
          mode: "downstream",
        },
        controlledPaneId: "pane-2",
        controlsUpperPane: false,
      },
    });
  });

  it("owns move-time pane resize group validation from pointer state", () => {
    const owner = createChartPaneResizeBlockOwner();
    const panes = [
      { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false },
      { id: "pane-1", kind: "secondary" as const, preferredHeight: 100, resizable: false },
      { id: "pane-2", kind: "secondary" as const, preferredHeight: 90, resizable: false },
      { id: "pane-3", kind: "secondary" as const, preferredHeight: 120, resizable: true },
    ];

    expect(owner.resolvePaneResizeGroup({
      startClientY: 20,
      activeBlock: {
        handle: {
          dividerAfterPaneId: "pane-1",
          dividerBeforePaneId: "pane-2",
          block: {
            controlledPaneId: "pane-3",
            blockPaneIds: ["pane-1", "pane-2", "pane-3"],
            startControlledHeight: 120,
            startVariableSpan: 420,
            minOpposingHeight: 160,
          },
        },
        group: {
          controlledPaneId: "pane-3",
          opposingPaneId: "primary",
          blockPaneIds: ["pane-1", "pane-2", "pane-3"],
          participatingPaneIds: ["primary", "pane-1", "pane-2", "pane-3"],
          variablePaneIds: ["primary", "pane-3"],
          fixedPaneIds: ["pane-1", "pane-2"],
          mode: "downstream",
        },
        controlledPaneId: "pane-3",
        controlsUpperPane: false,
      },
    }, {
      listPanes: () => panes,
    })).toEqual({
      controlledPaneId: "pane-3",
      opposingPaneId: "primary",
      blockPaneIds: ["pane-1", "pane-2", "pane-3"],
      participatingPaneIds: ["primary", "pane-1", "pane-2", "pane-3"],
      variablePaneIds: ["primary", "pane-3"],
      fixedPaneIds: ["pane-1", "pane-2"],
      mode: "downstream",
    });

    expect(owner.resolvePaneResizeGroup({
      startClientY: 20,
      activeBlock: {
        handle: {
          dividerAfterPaneId: "pane-1",
          dividerBeforePaneId: "pane-2",
          block: {
            controlledPaneId: "pane-3",
            blockPaneIds: ["pane-1", "pane-3"],
            startControlledHeight: 120,
            startVariableSpan: 420,
            minOpposingHeight: 160,
          },
        },
        group: {
          controlledPaneId: "pane-3",
          opposingPaneId: "primary",
          blockPaneIds: ["pane-1", "pane-3"],
          participatingPaneIds: ["primary", "pane-1", "pane-3"],
          variablePaneIds: ["primary", "pane-3"],
          fixedPaneIds: ["pane-1"],
          mode: "downstream",
        },
        controlledPaneId: "pane-3",
        controlsUpperPane: false,
      },
    }, {
      listPanes: () => panes,
    })).toBeNull();
  });

  it("owns active resize block resolution from a handle", () => {
    const owner = createChartPaneResizeBlockOwner();
    const panes = [
      { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false },
      { id: "pane-1", kind: "secondary" as const, preferredHeight: 100, resizable: false },
      { id: "pane-2", kind: "secondary" as const, preferredHeight: 90, resizable: false },
      { id: "pane-3", kind: "secondary" as const, preferredHeight: 120, resizable: true },
    ];

    expect(owner.resolveActiveResizeBlock({
      dividerAfterPaneId: "pane-1",
      dividerBeforePaneId: "pane-2",
      block: {
        controlledPaneId: "pane-3",
        blockPaneIds: ["pane-1", "pane-2", "pane-3"],
        startControlledHeight: 120,
        startVariableSpan: 420,
        minOpposingHeight: 160,
      },
    }, {
      getPaneById: (paneId) => panes.find((pane) => pane.id === paneId),
      listPanes: () => panes,
    })).toEqual({
      handle: {
        dividerAfterPaneId: "pane-1",
        dividerBeforePaneId: "pane-2",
        block: {
          controlledPaneId: "pane-3",
          blockPaneIds: ["pane-1", "pane-2", "pane-3"],
          startControlledHeight: 120,
          startVariableSpan: 420,
          minOpposingHeight: 160,
        },
      },
      group: {
        controlledPaneId: "pane-3",
        opposingPaneId: "primary",
        blockPaneIds: ["pane-1", "pane-2", "pane-3"],
        participatingPaneIds: ["primary", "pane-1", "pane-2", "pane-3"],
        variablePaneIds: ["primary", "pane-3"],
        fixedPaneIds: ["pane-1", "pane-2"],
        mode: "downstream",
      },
      controlledPaneId: "pane-3",
      controlsUpperPane: false,
    });
  });

  it("owns controlled resize height resolution from handle plus drag delta", () => {
    const owner = createChartPaneResizeBlockOwner();
    const primary = { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false };
    const fixedSecondary = { id: "pane-1", kind: "secondary" as const, preferredHeight: 100, resizable: false };
    const resizableSecondary = { id: "pane-2", kind: "secondary" as const, preferredHeight: 120, resizable: true };
    const panes = [primary, fixedSecondary, resizableSecondary];

    expect(owner.resolveControlledResizeHeight(40, {
      dividerAfterPaneId: "primary",
      dividerBeforePaneId: "pane-1",
      block: {
        controlledPaneId: "pane-2",
        blockPaneIds: ["primary", "pane-1", "pane-2"],
        startControlledHeight: 120,
        startVariableSpan: 340,
        minOpposingHeight: 160,
      },
    }, {
      getPaneById: (paneId) => panes.find((pane) => pane.id === paneId),
      listPanes: () => panes,
      normalizeHeight: (height) => height,
    })).toEqual({
      paneId: "pane-2",
      nextHeight: 80,
    });
  });
});
