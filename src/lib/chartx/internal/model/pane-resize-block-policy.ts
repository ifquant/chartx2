import { resolvePaneResizeTargetId, type PaneResizeTargetCandidate } from "./pane-linked-resize-policy";

type PaneFrameLike = {
  id: string;
  height: number;
};

export type PaneResizeBlockSnapshot = {
  controlledPaneId: string;
  startControlledHeight: number;
  startVariableSpan: number;
  minOpposingHeight: number;
};

const MIN_PRIMARY_HEIGHT = 160;
const MIN_CONTROLLED_HEIGHT = 72;

export function resolvePaneResizeBlockSnapshot<PaneType extends PaneResizeTargetCandidate>(
  panes: readonly PaneType[],
  paneFrames: readonly PaneFrameLike[],
  upperPaneId: string,
  lowerPaneId: string,
  controlledPaneId: string,
): PaneResizeBlockSnapshot | null {
  const upperPane = panes.find((pane) => pane.id === upperPaneId);
  const lowerPane = panes.find((pane) => pane.id === lowerPaneId);
  if (upperPane === undefined || lowerPane === undefined) {
    return null;
  }

  const resolvedControlledPaneId = resolvePaneResizeTargetId(panes, upperPaneId, lowerPaneId);
  if (resolvedControlledPaneId === null || resolvedControlledPaneId !== controlledPaneId) {
    return null;
  }

  const primaryFrame = paneFrames.find((pane) => pane.id === "primary");
  const upperFrame = paneFrames.find((pane) => pane.id === upperPaneId);
  const lowerFrame = paneFrames.find((pane) => pane.id === lowerPaneId);
  const controlledFrame = paneFrames.find((pane) => pane.id === controlledPaneId);
  if (upperFrame === undefined || lowerFrame === undefined || controlledFrame === undefined) {
    return null;
  }

  const downstreamControlled = controlledPaneId !== upperPaneId && controlledPaneId !== lowerPaneId;
  const controlsUpperPane = controlledPaneId === upperPaneId;
  const startVariableSpan = downstreamControlled
    ? (primaryFrame?.height ?? 0) + controlledFrame.height
    : controlsUpperPane
      ? controlledFrame.height + lowerFrame.height
      : upperFrame.height + controlledFrame.height;

  return {
    controlledPaneId,
    startControlledHeight: controlledFrame.height,
    startVariableSpan,
    minOpposingHeight:
      downstreamControlled || upperPane.kind === "primary" || lowerPane.kind === "primary"
        ? MIN_PRIMARY_HEIGHT
        : MIN_CONTROLLED_HEIGHT,
  };
}
