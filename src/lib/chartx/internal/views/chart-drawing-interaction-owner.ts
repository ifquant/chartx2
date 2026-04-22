import {
  type ChartBarSequence,
  type PaneFrame,
  type PriceScale,
  type TimePointIndex,
  type TimeScale,
} from "../model";
import { createChartPaneLayoutOwner } from "./chart-pane-layout-owner";

import { resolveHitDrawing } from "./chart-drawing-hit-test";
import {
  applyActiveTrendLineDrag,
  resolveSelectedTrendLineDrag,
} from "./chart-drawing-runtime";
import {
  resolveDrawingMagnetOptions,
  resolveSnappedDrawingPrice,
  resolveSnappedDrawingTime,
} from "./chart-drawing-snap";
import type {
  DrawingDragState,
  DrawingSnapGuideState,
} from "./chart-view-state";

type PanePoint = {
  x: number;
  y: number;
};

type LayoutLike = {
  height: number;
  top: number;
  bottom: number;
};

type BaseDrawingDescriptor = {
  id: string;
  paneId: string;
  visible: boolean;
  api: unknown;
};

type HorizontalLineDrawing = BaseDrawingDescriptor & {
  kind: "horizontal-line";
  line: {
    price: number;
  };
};

type TrendLineDrawing = BaseDrawingDescriptor & {
  kind: "trend-line";
  color: string;
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
};

type DrawingDescriptor = HorizontalLineDrawing | TrendLineDrawing;

type DrawingOptions = {
  magnetEnabled: boolean;
  magnetGuideVisible: boolean;
  magnetSources: {
    open: boolean;
    high: boolean;
    low: boolean;
    close: boolean;
  };
  magnetTolerancePx: number;
  timeMagnetEnabled: boolean;
  timeMagnetGuideVisible: boolean;
  timeMagnetPolicy: "nearest" | "previous" | "next";
  timeMagnetTolerancePx: number;
};

type AxisBar = {
  time: number;
  index: TimePointIndex;
};

export function createChartDrawingInteractionOwner<Drawing extends DrawingDescriptor>(deps: {
  listPanes(): readonly { id: string; kind: "primary" | "secondary"; preferredHeight: number | null; resizable: boolean }[];
  paneGap: number;
  getPrimaryPriceScale(): PriceScale;
  getSecondaryPriceScale(paneId: string): PriceScale | undefined;
  getAxisBars(): readonly AxisBar[];
  getBarSequence(): ChartBarSequence<number>;
  getTimeScale(): TimeScale;
  getDrawingOptions(): DrawingOptions;
  getDrawingById(id: string): Drawing | undefined;
  listDrawingsByPane(paneId: string): readonly Drawing[];
  getSelectedDrawingId(): string | null;
  clearDrawingSnapGuide(): void;
  setDrawingSnapGuide(guide: DrawingSnapGuideState | null): void;
  hitTolerance: number;
}) {
  const paneLayoutOwner = createChartPaneLayoutOwner({
    listPanes: () => deps.listPanes(),
    paneGap: deps.paneGap,
  });

  const resolvePaneFrames = (layout: LayoutLike, paneFrames?: readonly PaneFrame[]): readonly PaneFrame[] =>
    paneLayoutOwner.resolvePaneFrames(layout.height - layout.top - layout.bottom, paneFrames);

  const getTrendLineById = (id: string): (Drawing & TrendLineDrawing) | undefined => {
    const drawing = deps.getDrawingById(id);
    return drawing?.kind === "trend-line" ? drawing as Drawing & TrendLineDrawing : undefined;
  };

  return {
    resolveHitDrawing(
      point: PanePoint,
      layout: LayoutLike,
      paneFrames?: readonly PaneFrame[],
    ): Drawing | null {
      return resolveHitDrawing<Drawing>({
        point,
        paneFrames: resolvePaneFrames(layout, paneFrames),
        primaryPriceScale: deps.getPrimaryPriceScale(),
        getSecondaryPriceScale: deps.getSecondaryPriceScale,
        axisBars: deps.getAxisBars(),
        timeScale: deps.getTimeScale(),
        drawingsForPane: (paneId) => deps.listDrawingsByPane(paneId),
        hitTolerance: deps.hitTolerance,
      });
    },

    resolveSelectedTrendLineDragHandle(
      point: PanePoint,
      layout: LayoutLike,
      paneFrames?: readonly PaneFrame[],
    ): DrawingDragState | null {
      return resolveSelectedTrendLineDrag({
        point,
        paneFrames: resolvePaneFrames(layout, paneFrames),
        selectedDrawingId: deps.getSelectedDrawingId(),
        getById: getTrendLineById,
        primaryPriceScale: deps.getPrimaryPriceScale(),
        getSecondaryPriceScale: deps.getSecondaryPriceScale,
        axisBars: deps.getAxisBars(),
        timeScale: deps.getTimeScale(),
        hitTolerance: deps.hitTolerance,
      });
    },

    applyDrawingDrag(
      drag: DrawingDragState,
      point: PanePoint,
      layout: LayoutLike,
      paneFrames?: readonly PaneFrame[],
    ): void {
      const drawing = deps.getDrawingById(drag.drawingId);
      const drawingOptions =
        drawing === undefined
          ? deps.getDrawingOptions()
          : resolveDrawingMagnetOptions(
              drawing as Parameters<typeof resolveDrawingMagnetOptions>[0],
              deps.getDrawingOptions(),
            );
      applyActiveTrendLineDrag({
        drag,
        point,
        paneFrames: resolvePaneFrames(layout, paneFrames),
        getById: getTrendLineById,
        primaryPriceScale: deps.getPrimaryPriceScale(),
        getSecondaryPriceScale: deps.getSecondaryPriceScale,
        drawingOptions: {
          magnetGuideVisible: deps.getDrawingOptions().magnetGuideVisible,
          timeMagnetGuideVisible: deps.getDrawingOptions().timeMagnetGuideVisible,
        },
        resolveSnappedTime: (localX, nextDrawing) =>
          resolveSnappedDrawingTime(
            localX,
            deps.getAxisBars(),
            deps.getTimeScale(),
            drawingOptions.timeMagnetEnabled,
            drawingOptions.timeMagnetPolicy,
            drawingOptions.timeMagnetTolerancePx,
          ),
        resolveSnappedPrice: (localX, localY, _drawing, priceScale) =>
          resolveSnappedDrawingPrice(
            localX,
            localY,
            deps.getBarSequence(),
            priceScale,
            deps.getTimeScale(),
            drawingOptions.magnetEnabled,
            drawingOptions.magnetTolerancePx,
            drawingOptions.magnetSources,
          ),
        clearDrawingSnapGuide: deps.clearDrawingSnapGuide,
        setDrawingSnapGuide: deps.setDrawingSnapGuide,
      });
    },
  };
}
