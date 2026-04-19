import type { PaneFrame, PlotRow } from "../model";
import type { PhaseOneReadoutSeriesDetail } from "./chart-harness";
import { resolveLocalPanePoint } from "./chart-layout-geometry";
import { buildPaneLegendEntries } from "./chart-pane-legend";

type PanePoint = {
  x: number;
  y: number;
};

type RowSet = readonly PlotRow<number>[];

export function renderPaneChrome<
  PrimarySource,
  PaneSeries,
>(params: {
  pane: PaneFrame;
  activePane: PaneFrame | null;
  crosshair: PanePoint | null;
  primarySources: readonly PrimarySource[];
  primaryRowSets: ReadonlyMap<string, RowSet>;
  getSecondarySeriesForPane(paneId: string): readonly PaneSeries[];
  buildReadoutSeriesForPrimary(
    primarySources: readonly PrimarySource[],
    rowSets: ReadonlyMap<string, RowSet>,
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[];
  buildReadoutSeriesForPane(
    paneSeries: readonly PaneSeries[],
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[];
  drawLegend(entries: readonly PhaseOneReadoutSeriesDetail[]): void;
  drawCrosshair(crosshair: PanePoint | null): void;
  drawFrameBorder(): void;
}): void {
  const legendEntries = buildPaneLegendEntries({
    pane: params.pane,
    activePane: params.activePane,
    crosshair: params.crosshair,
    primarySources: params.primarySources,
    primaryRowSets: params.primaryRowSets,
    getSecondarySeriesForPane: params.getSecondarySeriesForPane,
    buildReadoutSeriesForPrimary: params.buildReadoutSeriesForPrimary,
    buildReadoutSeriesForPane: params.buildReadoutSeriesForPane,
  });
  params.drawLegend(legendEntries);
  params.drawCrosshair(
    resolveLocalPanePoint(
      params.activePane?.id === params.pane.id ? params.activePane : null,
      params.crosshair,
    ),
  );
  params.drawFrameBorder();
}
