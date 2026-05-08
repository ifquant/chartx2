import { describe, expect, it } from "vitest";

import {
  resolvePaneResizeBlock,
  resolvePaneResizeBlockFromState,
  resolvePaneResizeGroupFromBlock,
  resolvePaneResizeBlockSnapshot,
} from "../../src/lib/internal/model";

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

    expect(resolvePaneResizeBlock(panes, "primary", "pane-1", "pane-1")).toEqual({
      upperPaneId: "primary",
      lowerPaneId: "pane-1",
      controlledPaneId: "pane-1",
      opposingPaneId: "primary",
      blockPaneIds: ["primary", "pane-1"],
      mode: "adjacent-lower",
    });

    expect(resolvePaneResizeBlockSnapshot(panes, frames, "primary", "pane-1", "pane-1")).toEqual({
      controlledPaneId: "pane-1",
      blockPaneIds: ["primary", "pane-1"],
      startControlledHeight: 136,
      startVariableSpan: 356,
      minOpposingHeight: 160,
    });

    expect(resolvePaneResizeGroupFromBlock({
      upperPaneId: "primary",
      lowerPaneId: "pane-1",
      controlledPaneId: "pane-1",
      opposingPaneId: "primary",
      blockPaneIds: ["primary", "pane-1"],
      mode: "adjacent-lower",
    })).toEqual({
      controlledPaneId: "pane-1",
      opposingPaneId: "primary",
      blockPaneIds: ["primary", "pane-1"],
      participatingPaneIds: ["primary", "pane-1"],
      variablePaneIds: ["primary", "pane-1"],
      fixedPaneIds: [],
      mode: "adjacent-lower",
    });
  });

  it("builds an adjacent secondary-secondary block when the upper pane is resizable", () => {
    const panes = [
      { id: "primary", kind: "primary" as const, resizable: false },
      { id: "pane-1", kind: "secondary" as const, resizable: true },
      { id: "pane-2", kind: "secondary" as const, resizable: false },
    ];
    const frames = [
      { id: "primary", height: 220 },
      { id: "pane-1", height: 100 },
      { id: "pane-2", height: 90 },
    ];

    expect(resolvePaneResizeBlock(panes, "pane-1", "pane-2", "pane-1")).toEqual({
      upperPaneId: "pane-1",
      lowerPaneId: "pane-2",
      controlledPaneId: "pane-1",
      opposingPaneId: "pane-2",
      blockPaneIds: ["pane-1", "pane-2"],
      mode: "adjacent-upper",
    });

    expect(resolvePaneResizeBlockSnapshot(panes, frames, "pane-1", "pane-2", "pane-1")).toEqual({
      controlledPaneId: "pane-1",
      blockPaneIds: ["pane-1", "pane-2"],
      startControlledHeight: 100,
      startVariableSpan: 190,
      minOpposingHeight: 72,
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

    expect(resolvePaneResizeBlock(panes, "pane-1", "pane-2", "pane-3")).toEqual({
      upperPaneId: "pane-1",
      lowerPaneId: "pane-2",
      controlledPaneId: "pane-3",
      opposingPaneId: "primary",
      blockPaneIds: ["pane-1", "pane-2", "pane-3"],
      mode: "downstream",
    });

    expect(resolvePaneResizeBlockSnapshot(panes, frames, "pane-1", "pane-2", "pane-3")).toEqual({
      controlledPaneId: "pane-3",
      blockPaneIds: ["pane-1", "pane-2", "pane-3"],
      startControlledHeight: 120,
      startVariableSpan: 420,
      minOpposingHeight: 160,
    });

    expect(resolvePaneResizeGroupFromBlock({
      upperPaneId: "pane-1",
      lowerPaneId: "pane-2",
      controlledPaneId: "pane-3",
      opposingPaneId: "primary",
      blockPaneIds: ["pane-1", "pane-2", "pane-3"],
      mode: "downstream",
    })).toEqual({
      controlledPaneId: "pane-3",
      opposingPaneId: "primary",
      blockPaneIds: ["pane-1", "pane-2", "pane-3"],
      participatingPaneIds: ["primary", "pane-1", "pane-2", "pane-3"],
      variablePaneIds: ["primary", "pane-3"],
      fixedPaneIds: ["pane-1", "pane-2"],
      mode: "downstream",
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

  it("rebuilds a resize block from pointer state when block membership still matches", () => {
    const panes = [
      { id: "primary", kind: "primary" as const, resizable: false },
      { id: "pane-1", kind: "secondary" as const, resizable: false },
      { id: "pane-2", kind: "secondary" as const, resizable: false },
      { id: "pane-3", kind: "secondary" as const, resizable: true },
    ];

    expect(resolvePaneResizeBlockFromState(panes, {
      dividerAfterPaneId: "pane-1",
      dividerBeforePaneId: "pane-2",
      controlledPaneId: "pane-3",
      blockPaneIds: ["pane-1", "pane-2", "pane-3"],
    })).toEqual({
      upperPaneId: "pane-1",
      lowerPaneId: "pane-2",
      controlledPaneId: "pane-3",
      opposingPaneId: "primary",
      blockPaneIds: ["pane-1", "pane-2", "pane-3"],
      mode: "downstream",
    });
  });

  it("rejects pointer state whose block membership drifted from the current pane block", () => {
    const panes = [
      { id: "primary", kind: "primary" as const, resizable: false },
      { id: "pane-1", kind: "secondary" as const, resizable: false },
      { id: "pane-2", kind: "secondary" as const, resizable: false },
      { id: "pane-3", kind: "secondary" as const, resizable: true },
    ];

    expect(resolvePaneResizeBlockFromState(panes, {
      dividerAfterPaneId: "pane-1",
      dividerBeforePaneId: "pane-2",
      controlledPaneId: "pane-3",
      blockPaneIds: ["pane-1", "pane-3"],
    })).toBeNull();
  });
});
