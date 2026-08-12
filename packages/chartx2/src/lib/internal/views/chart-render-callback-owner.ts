import { drawPaneCrosshair, drawPaneLegend } from "./chart-pane-chrome";
import { emitReadoutEvent } from "./chart-render-tail";
import type { PhaseOneReadoutDetail, PhaseOneReadoutSeriesDetail } from "./chart-api-types";

type RendererRuntime = {
  lineRenderer: unknown;
  areaRenderer: unknown;
  baselineRenderer: unknown;
  barRenderer: unknown;
  candlesRenderer: unknown;
  pointFigureRenderer: unknown;
  histogramRenderer: unknown;
  kagiRenderer: unknown;
};

type PanePoint = {
  x: number;
  y: number;
} | null;

type CrosshairOptions = {
  lineColor: string;
  pointColor: string;
};

export function createChartRenderCallbackOwner(deps: {
  getRendererRuntime(): RendererRuntime;
  drawGrid(
    context: CanvasRenderingContext2D,
    params: { width: number; height: number; columns: number; rows: number; lineColor: string },
  ): void;
  emitCrosshairMove(readout: PhaseOneReadoutDetail, crosshair: PanePoint): void;
  getCrosshair(): PanePoint;
  backgroundColor(): string;
  resolveBarSpacing(currentSpacing: number | null, paneWidth: number, pointCount: number): number;
}) {
  return {
    getRendererRuntime: deps.getRendererRuntime,
    drawGrid: deps.drawGrid,
    drawPaneLegend: (
      context: CanvasRenderingContext2D,
      entries: readonly PhaseOneReadoutSeriesDetail[],
      options: { background: string; border: string; text: string; font: string },
    ) => {
      drawPaneLegend(context, entries, options);
    },
    drawCrosshair: (
      context: CanvasRenderingContext2D,
      paneWidth: number,
      paneHeight: number,
      crosshair: PanePoint,
      options: CrosshairOptions,
    ) => {
      drawPaneCrosshair(context, paneWidth, paneHeight, crosshair, options);
    },
    emitReadout: (canvas: HTMLCanvasElement, detail: PhaseOneReadoutDetail) => {
      emitReadoutEvent(canvas, detail);
    },
    emitCrosshairMove: (readout: PhaseOneReadoutDetail) => {
      deps.emitCrosshairMove(readout, deps.getCrosshair());
    },
    backgroundColor: deps.backgroundColor,
    resolveBarSpacing: deps.resolveBarSpacing,
  };
}
