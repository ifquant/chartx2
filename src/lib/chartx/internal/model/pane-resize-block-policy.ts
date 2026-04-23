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
  blockPaneIds: readonly string[];
  mode: "adjacent-upper" | "adjacent-lower" | "downstream";
};

export type PaneResizeGroup = {
  controlledPaneId: string;
  opposingPaneId: string;
  blockPaneIds: readonly string[];
  participatingPaneIds: readonly string[];
  variablePaneIds: readonly string[];
  fixedPaneIds: readonly string[];
  mode: "adjacent-upper" | "adjacent-lower" | "downstream";
};

export type PaneResizeBlockSnapshot = {
  controlledPaneId: string;
  blockPaneIds: readonly string[];
  startControlledHeight: number;
  startVariableSpan: number;
  minOpposingHeight: number;
};

export type PaneResizeBlockStateLike = {
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  controlledPaneId: string;
  blockPaneIds: readonly string[];
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
      blockPaneIds: [upperPaneId, lowerPaneId],
      mode: "adjacent-upper",
    };
  }

  if (controlledPaneId === lowerPaneId) {
    return {
      upperPaneId,
      lowerPaneId,
      controlledPaneId,
      opposingPaneId: upperPaneId,
      blockPaneIds: [upperPaneId, lowerPaneId],
      mode: "adjacent-lower",
    };
  }

  const upperIndex = panes.findIndex((pane) => pane.id === upperPaneId);
  const controlledIndex = panes.findIndex((pane) => pane.id === controlledPaneId);
  if (upperIndex === -1 || controlledIndex === -1 || controlledIndex < upperIndex) {
    return null;
  }

  return {
    upperPaneId,
    lowerPaneId,
    controlledPaneId,
    opposingPaneId: "primary",
    blockPaneIds: panes.slice(upperIndex, controlledIndex + 1).map((pane) => pane.id),
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

  const resizeGroup = resolvePaneResizeGroupFromBlock(resizeBlock);
  const variableFrames = resizeGroup.variablePaneIds.map((paneId) =>
    paneFrames.find((pane) => pane.id === paneId),
  );
  if (variableFrames.some((frame) => frame === undefined)) {
    return null;
  }
  const controlledFrame = variableFrames.find((frame) => frame?.id === controlledPaneId);
  if (controlledFrame === undefined) {
    return null;
  }
  const opposingPane = panes.find((pane) => pane.id === resizeGroup.opposingPaneId);
  if (opposingPane === undefined) {
    return null;
  }

  return {
    controlledPaneId,
    blockPaneIds: resizeGroup.blockPaneIds,
    startControlledHeight: controlledFrame.height,
    startVariableSpan: variableFrames.reduce((sum, frame) => sum + (frame?.height ?? 0), 0),
    minOpposingHeight:
      opposingPane.kind === "primary"
        ? MIN_PRIMARY_HEIGHT
        : MIN_CONTROLLED_HEIGHT,
  };
}

export function resolvePaneResizeGroupFromBlock(
  resizeBlock: PaneResizeBlock,
): PaneResizeGroup {
  const variablePaneIds =
    resizeBlock.mode === "adjacent-upper"
      ? [resizeBlock.controlledPaneId, resizeBlock.opposingPaneId]
      : resizeBlock.mode === "adjacent-lower"
        ? [resizeBlock.opposingPaneId, resizeBlock.controlledPaneId]
        : [resizeBlock.opposingPaneId, resizeBlock.controlledPaneId];
  const participatingPaneIds =
    resizeBlock.mode === "downstream"
      ? [resizeBlock.opposingPaneId, ...resizeBlock.blockPaneIds]
      : resizeBlock.blockPaneIds;
  const fixedPaneIds = participatingPaneIds.filter((paneId) => !variablePaneIds.includes(paneId));

  return {
    controlledPaneId: resizeBlock.controlledPaneId,
    opposingPaneId: resizeBlock.opposingPaneId,
    blockPaneIds: resizeBlock.blockPaneIds,
    participatingPaneIds,
    variablePaneIds,
    fixedPaneIds,
    mode: resizeBlock.mode,
  };
}

export function resolvePaneResizeBlockFromState<PaneType extends PaneResizeTargetCandidate>(
  panes: readonly PaneType[],
  resizeState: PaneResizeBlockStateLike,
): PaneResizeBlock | null {
  const resizeBlock = resolvePaneResizeBlock(
    panes,
    resizeState.dividerAfterPaneId,
    resizeState.dividerBeforePaneId,
    resizeState.controlledPaneId,
  );
  if (resizeBlock === null) {
    return null;
  }
  if (resizeBlock.blockPaneIds.length !== resizeState.blockPaneIds.length) {
    return null;
  }
  return resizeBlock.blockPaneIds.every((paneId, index) => paneId === resizeState.blockPaneIds[index])
    ? resizeBlock
    : null;
}
