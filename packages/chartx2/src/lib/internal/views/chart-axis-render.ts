import type { PaneFrame } from "../model";
import { resolveLocalPanePoint } from "./chart-layout-geometry";

type PanePoint = {
  x: number;
  y: number;
};

export function renderPriceAxes<PaneState>(
  params: {
    paneFrames: readonly PaneFrame[];
    activePane: PaneFrame | null;
    crosshair: PanePoint | null;
    hasPrimaryRows: boolean;
    findPrimaryPane(panes: readonly PaneFrame[]): PaneFrame | undefined;
    drawPrimaryAxis(pane: PaneFrame, crosshair: PanePoint | null): void;
    getSecondaryAxisState(paneId: string): PaneState | undefined;
    secondaryPaneHasRows(paneId: string): boolean;
    drawSecondaryAxis(pane: PaneFrame, state: PaneState, crosshair: PanePoint | null): void;
  },
): void {
  if (params.hasPrimaryRows) {
    const primaryPane = params.findPrimaryPane(params.paneFrames);
    if (primaryPane !== undefined) {
      params.drawPrimaryAxis(
        primaryPane,
        resolveLocalPanePoint(params.activePane?.kind === "primary" ? params.activePane : null, params.crosshair),
      );
    }
  }

  for (const pane of params.paneFrames) {
    if (pane.kind !== "secondary") {
      continue;
    }
    const state = params.getSecondaryAxisState(pane.id);
    if (state === undefined || !params.secondaryPaneHasRows(pane.id)) {
      continue;
    }
    params.drawSecondaryAxis(
      pane,
      state,
      resolveLocalPanePoint(params.activePane?.id === pane.id ? params.activePane : null, params.crosshair),
    );
  }
}

export function renderTimeAxis<Rows>(
  params: {
    primaryRows: Rows;
    firstSecondaryRows: Rows | undefined;
    draw(rows: Rows): void;
    hasRows(rows: Rows | undefined): boolean;
  },
): void {
  const rows = params.hasRows(params.primaryRows)
    ? params.primaryRows
    : params.firstSecondaryRows;
  if (rows === undefined || !params.hasRows(rows)) {
    return;
  }
  params.draw(rows);
}
