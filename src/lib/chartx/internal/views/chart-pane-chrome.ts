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

export function drawPaneCrosshair(
  context: CanvasRenderingContext2D,
  paneWidth: number,
  paneHeight: number,
  crosshair: PanePoint | null,
  options: { lineColor: string; pointColor: string },
): void {
  if (crosshair === null) {
    return;
  }

  context.save();
  context.strokeStyle = options.lineColor;
  context.lineWidth = 1;
  context.setLineDash([4, 4]);

  context.beginPath();
  context.moveTo(Math.round(crosshair.x) + 0.5, 0);
  context.lineTo(Math.round(crosshair.x) + 0.5, paneHeight);
  context.stroke();

  context.beginPath();
  context.moveTo(0, Math.round(crosshair.y) + 0.5);
  context.lineTo(paneWidth, Math.round(crosshair.y) + 0.5);
  context.stroke();

  context.setLineDash([]);
  context.fillStyle = options.pointColor;
  context.beginPath();
  context.arc(crosshair.x, crosshair.y, 2.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export function drawPaneLegend(
  context: CanvasRenderingContext2D,
  entries: readonly PhaseOneReadoutSeriesDetail[],
): void {
  if (entries.length === 0) {
    return;
  }

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "top";

  let x = 10;
  for (const entry of entries) {
    const text = `${entry.label} ${entry.formattedValue}`;
    const textWidth = context.measureText(text).width;

    context.fillStyle = "rgba(255, 253, 247, 0.92)";
    context.strokeStyle = "rgba(16, 16, 16, 0.12)";
    context.lineWidth = 1;
    context.fillRect(x, 8, textWidth + 22, 18);
    context.strokeRect(x + 0.5, 8.5, textWidth + 21, 17);

    context.fillStyle = entry.color;
    context.beginPath();
    context.arc(x + 7, 17, 3, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(16, 16, 16, 0.78)";
    context.fillText(text, x + 13, 12);
    x += textWidth + 30;
  }

  context.restore();
}
