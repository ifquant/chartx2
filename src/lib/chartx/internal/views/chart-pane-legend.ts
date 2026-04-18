import type { PaneFrame } from "../model";
import type { PhaseOneReadoutSeriesDetail } from "./chart-harness";

type PanePoint = {
  x: number;
  y: number;
};

export function buildPaneLegendEntries<
  PrimarySource,
  PaneSource,
>(params: {
  pane: PaneFrame;
  activePane: PaneFrame | null;
  crosshair: PanePoint | null;
  primarySources: readonly PrimarySource[];
  primaryRowSets: ReadonlyMap<string, unknown>;
  getSecondarySeriesForPane(paneId: string): readonly PaneSource[];
  buildReadoutSeriesForPrimary(
    primarySources: readonly PrimarySource[],
    rowSets: ReadonlyMap<string, unknown>,
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[];
  buildReadoutSeriesForPane(
    paneSeries: readonly PaneSource[],
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[];
}): readonly PhaseOneReadoutSeriesDetail[] {
  const paneCrosshair = resolveLocalPanePoint(
    params.activePane?.id === params.pane.id ? params.activePane : null,
    params.crosshair,
  );

  return params.pane.kind === "primary"
    ? params.buildReadoutSeriesForPrimary(
        params.primarySources,
        params.primaryRowSets,
        paneCrosshair,
      )
    : params.buildReadoutSeriesForPane(
        params.getSecondarySeriesForPane(params.pane.id),
        paneCrosshair,
      );
}

function resolveLocalPanePoint(
  pane: PaneFrame | null | undefined,
  point: PanePoint | null,
): PanePoint | null {
  if (pane === null || pane === undefined || point === null) {
    return null;
  }

  return {
    x: point.x,
    y: point.y - pane.top,
  };
}
