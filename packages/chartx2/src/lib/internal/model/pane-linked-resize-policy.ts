export type PaneResizeTargetCandidate = {
  id: string;
  kind: "primary" | "secondary";
  resizable: boolean;
};

export function resolvePaneResizeTargetId<PaneType extends PaneResizeTargetCandidate>(
  panes: readonly PaneType[],
  upperPaneId: string,
  lowerPaneId: string,
): string | null {
  const upperPane = panes.find((pane) => pane.id === upperPaneId);
  const lowerPane = panes.find((pane) => pane.id === lowerPaneId);
  if (upperPane === undefined || lowerPane === undefined) {
    return null;
  }

  const upperControls = upperPane.kind === "secondary" && upperPane.resizable;
  const lowerControls = lowerPane.kind === "secondary" && lowerPane.resizable;
  if (upperControls || lowerControls) {
    return upperControls ? upperPane.id : lowerPane.id;
  }

  const lowerIndex = panes.findIndex((pane) => pane.id === lowerPaneId);
  if (lowerIndex === -1) {
    return null;
  }

  const downstreamPane = panes
    .slice(lowerIndex)
    .find((pane) => pane.kind === "secondary" && pane.resizable);
  return downstreamPane?.id ?? null;
}
