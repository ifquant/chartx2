import { resolvePaneResizeTargetId, type PaneResizeTargetCandidate } from "./pane-linked-resize-policy";

type PaneFrameLike = {
  id: string;
  height: number;
};

export type PaneResizeBlock = {
  upperPaneId: string;
  lowerPaneId: string;
  controlledPaneId: string;
  opposingPaneId: string;
  mode: "adjacent-upper" | "adjacent-lower" | "downstream";
};

export type PaneResizeBlockSnapshot = {
  controlledPaneId: string;
  startControlledHeight: number;
  startVariableSpan: number;
  minOpposingHeight: number;
};

const MIN_PRIMARY_HEIGHT = 160;
const MIN_CONTROLLED_HEIGHT = 72;

export function resolvePaneResizeBlock<PaneType extends PaneResizeTargetCandidate>(
  panes: readonly PaneType[],
  upperPaneId: string,
  lowerPaneId: string,
  controlledPaneId: string,
): PaneResizeBlock | null {
  const upperPane = panes.find((pane) => pane.id === upperPaneId);
  const lowerPane = panes.find((pane) => pane.id === lowerPaneId);
  if (upperPane === undefined || lowerPane === undefined) {
    return null;
  }

  const resolvedControlledPaneId = resolvePaneResizeTargetId(panes, upperPaneId, lowerPaneId);
  if (resolvedControlledPaneId === null || resolvedControlledPaneId !== controlledPaneId) {
    return null;
  }

  if (controlledPaneId === upperPaneId) {
    return {
      upperPaneId,
      lowerPaneId,
      controlledPaneId,
      opposingPaneId: lowerPaneId,
      mode: "adjacent-upper",
    };
  }

  if (controlledPaneId === lowerPaneId) {
    return {
      upperPaneId,
      lowerPaneId,
      controlledPaneId,
      opposingPaneId: upperPaneId,
      mode: "adjacent-lower",
    };
  }

  return {
    upperPaneId,
    lowerPaneId,
    controlledPaneId,
    opposingPaneId: "primary",
    mode: "downstream",
  };
}

export function resolvePaneResizeBlockSnapshot<PaneType extends PaneResizeTargetCandidate>(
  panes: readonly PaneType[],
  paneFrames: readonly PaneFrameLike[],
  upperPaneId: string,
  lowerPaneId: string,
  controlledPaneId: string,
): PaneResizeBlockSnapshot | null {
  const resizeBlock = resolvePaneResizeBlock(panes, upperPaneId, lowerPaneId, controlledPaneId);
  if (resizeBlock === null) {
    return null;
  }

  const controlledFrame = paneFrames.find((pane) => pane.id === controlledPaneId);
  const opposingFrame = paneFrames.find((pane) => pane.id === resizeBlock.opposingPaneId);
  if (controlledFrame === undefined || opposingFrame === undefined) {
    return null;
  }
  const opposingPane = panes.find((pane) => pane.id === resizeBlock.opposingPaneId);
  if (opposingPane === undefined) {
    return null;
  }

  return {
    controlledPaneId,
    startControlledHeight: controlledFrame.height,
    startVariableSpan: controlledFrame.height + opposingFrame.height,
    minOpposingHeight:
      opposingPane.kind === "primary"
        ? MIN_PRIMARY_HEIGHT
        : MIN_CONTROLLED_HEIGHT,
  };
}
