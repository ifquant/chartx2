import type { PaneFrame } from "../model";
import type { PhaseOneReadoutSeriesDetail } from "./chart-api-types";
import { resolveLocalPanePoint } from "./chart-layout-geometry";

type PanePoint = {
  x: number;
  y: number;
};

type RowSet = readonly unknown[];

export function buildPaneLegendEntries<
  PrimarySource,
  PaneSource,
>(params: {
  pane: PaneFrame;
  activePane: PaneFrame | null;
  crosshair: PanePoint | null;
  primarySources: readonly PrimarySource[];
  primaryRowSets: ReadonlyMap<string, unknown>;
  secondaryRows: ReadonlyMap<string, RowSet>;
  getSecondarySeriesForPane(paneId: string): readonly PaneSource[];
  buildReadoutSeriesForPrimary(
    primarySources: readonly PrimarySource[],
    rowSets: ReadonlyMap<string, unknown>,
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[];
  buildReadoutSeriesForPane(
    paneSeries: readonly PaneSource[],
    rowSets: ReadonlyMap<string, RowSet>,
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
        params.secondaryRows,
        paneCrosshair,
      );
}
