import type { PaneFrame, PriceScale, TimePointIndex, TimeScale } from "../model";

import {
  applyTrendLineDrag,
} from "./chart-drawing-drag";
import {
  requireDrawingByApi,
  removeDrawing,
  removeSelectedDrawing,
  selectDrawing,
} from "./chart-drawing-session";
import {
  resolveSelectedTrendLineDragHandle,
} from "./chart-drawing-hit-test";
import {
  type DrawingDragState,
  type DrawingSnapGuideState,
} from "./chart-view-state";

type PanePoint = {
  x: number;
  y: number;
};

type ChartDrawingDescriptor<Api = unknown> = {
  id: string;
  kind: "horizontal-line" | "trend-line";
  paneId: string;
  visible: boolean;
  api: Api;
};

type TrendLineDrawing<Api = unknown> = ChartDrawingDescriptor<Api> & {
  kind: "trend-line";
  color: string;
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
};

export function requireActiveDrawingByApi<Api, Drawing extends ChartDrawingDescriptor<Api>>(
  api: Api,
  deps: {
    getByApi(nextApi: Api): Drawing | undefined;
  },
): Drawing {
  return requireDrawingByApi(api, deps);
}

export function selectActiveDrawing<Drawing extends ChartDrawingDescriptor>(
  params: {
    selectedDrawingId: string | null;
    nextId: string | null;
    shouldRender: boolean;
    getById(id: string): Drawing | undefined;
    getPaneIndex(paneId: string): number;
    notifySelectionChange(selection: {
      id: string;
      kind: "horizontal-line" | "trend-line";
      paneIndex: number;
    } | null): void;
    render(): void;
    setSelectedDrawingId(id: string | null): void;
  },
): void {
  params.setSelectedDrawingId(selectDrawing(params));
}

export function removeActiveDrawing<Api, Drawing extends ChartDrawingDescriptor<Api>>(
  params: {
    api: Api;
    selectedDrawingId: string | null;
    removeByApi(nextApi: Api): Drawing | undefined;
    clearSelection(shouldRender: boolean): void;
    render(): void;
  },
): void {
  removeDrawing({
    api: params.api,
    selectedDrawingId: params.selectedDrawingId,
    registry: {
      removeByApi: params.removeByApi,
    },
    clearSelection: params.clearSelection,
    render: params.render,
  });
}

export function removeSelectedActiveDrawing<Drawing extends ChartDrawingDescriptor>(
  params: {
    selectedDrawingId: string | null;
    getById(id: string): Drawing | undefined;
    clearSelection(shouldRender: boolean): void;
    removeByApi(api: Drawing["api"]): void;
    render(): void;
  },
): void {
  removeSelectedDrawing(params);
}

export function resolveSelectedTrendLineDrag<Drawing extends TrendLineDrawing>(
  params: {
    point: PanePoint;
    paneFrames: readonly PaneFrame[];
    selectedDrawingId: string | null;
    getById(id: string): Drawing | undefined;
    primaryPriceScale: PriceScale;
    getSecondaryPriceScale(paneId: string): PriceScale | undefined;
    axisBars: readonly { time: number; index: TimePointIndex }[];
    timeScale: TimeScale;
    hitTolerance: number;
  },
): DrawingDragState | null {
  const selectedDrawing =
    params.selectedDrawingId === null
      ? null
      : params.getById(params.selectedDrawingId);
  return resolveSelectedTrendLineDragHandle({
    point: params.point,
    paneFrames: params.paneFrames,
    selectedDrawing: selectedDrawing?.kind === "trend-line" ? selectedDrawing : null,
    primaryPriceScale: params.primaryPriceScale,
    getSecondaryPriceScale: params.getSecondaryPriceScale,
    axisBars: params.axisBars,
    timeScale: params.timeScale,
    hitTolerance: params.hitTolerance,
  });
}

export function applyActiveTrendLineDrag<Drawing extends TrendLineDrawing>(
  params: {
    drag: DrawingDragState;
    point: PanePoint;
    paneFrames: readonly PaneFrame[];
    getById(id: string): Drawing | undefined;
    primaryPriceScale: PriceScale;
    getSecondaryPriceScale(paneId: string): PriceScale | undefined;
    drawingOptions: {
      magnetGuideVisible: boolean;
      timeMagnetGuideVisible: boolean;
    };
    resolveSnappedTime(localX: number, drawing: Drawing): { time: number; snapped: boolean };
    resolveSnappedPrice(
      localX: number,
      localY: number,
      drawing: Drawing,
      priceScale: PriceScale,
    ): {
      price: number;
      snapped: boolean;
      source: "open" | "high" | "low" | "close";
    } | null;
    clearDrawingSnapGuide(): void;
    setDrawingSnapGuide(guide: DrawingSnapGuideState | null): void;
  },
): void {
  const drawing = params.getById(params.drag.drawingId);
  if (drawing === undefined || drawing.kind !== "trend-line") {
    params.clearDrawingSnapGuide();
    return;
  }

  const nextState = applyTrendLineDrag({
    drag: params.drag,
    point: params.point,
    paneFrames: params.paneFrames,
    drawing,
    primaryPriceScale: params.primaryPriceScale,
    getSecondaryPriceScale: params.getSecondaryPriceScale,
    drawingOptions: params.drawingOptions,
    resolveSnappedTime: params.resolveSnappedTime,
    resolveSnappedPrice: params.resolveSnappedPrice,
  });

  params.setDrawingSnapGuide(nextState.snapGuide);
  if (nextState.nextDrawing === null) {
    return;
  }

  drawing.startTime = nextState.nextDrawing.startTime;
  drawing.startPrice = nextState.nextDrawing.startPrice;
  drawing.endTime = nextState.nextDrawing.endTime;
  drawing.endPrice = nextState.nextDrawing.endPrice;
}
