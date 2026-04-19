import type { PaneFrame, PriceScale } from "../model";

type PanePoint = {
  x: number;
  y: number;
};

type DrawingDragHandle = "start" | "end";

type DrawingDragState = {
  drawingId: string;
  handle: DrawingDragHandle;
};

type TrendLineDrawing = {
  id: string;
  kind: "trend-line";
  paneId: string;
  color: string;
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
};

type DrawingSnapGuideState = {
  paneId: string;
  color: string;
  price: number | null;
  source: "open" | "high" | "low" | "close" | null;
  time: number | null;
};

type ResolvedDrawingTime = {
  time: number;
  snapped: boolean;
};

type ResolvedDrawingPrice = {
  price: number;
  snapped: boolean;
  source: "open" | "high" | "low" | "close";
} | null;

type DrawingOptions = {
  magnetGuideVisible: boolean;
  timeMagnetGuideVisible: boolean;
};

export function applyTrendLineDrag(
  params: {
    drag: DrawingDragState;
    point: PanePoint;
    paneFrames: readonly PaneFrame[];
    drawing: TrendLineDrawing | null;
    primaryPriceScale: PriceScale;
    getSecondaryPriceScale(paneId: string): PriceScale | undefined;
    drawingOptions: DrawingOptions;
    resolveSnappedTime(localX: number, drawing: TrendLineDrawing): ResolvedDrawingTime;
    resolveSnappedPrice(localX: number, localY: number, drawing: TrendLineDrawing, priceScale: PriceScale): ResolvedDrawingPrice;
  },
): {
  nextDrawing: TrendLineDrawing | null;
  snapGuide: DrawingSnapGuideState | null;
} {
  const drawing = params.drawing;
  if (drawing === null) {
    return {
      nextDrawing: null,
      snapGuide: null,
    };
  }

  const paneFrame = params.paneFrames.find((entry) => entry.id === drawing.paneId);
  if (paneFrame === undefined) {
    return {
      nextDrawing: null,
      snapGuide: null,
    };
  }
  const localPoint = resolveLocalPanePoint(paneFrame, params.point);
  if (localPoint === null) {
    return {
      nextDrawing: null,
      snapGuide: null,
    };
  }

  const priceScale = paneFrame.kind === "primary"
    ? params.primaryPriceScale
    : params.getSecondaryPriceScale(paneFrame.id);
  if (priceScale === undefined) {
    return {
      nextDrawing: null,
      snapGuide: null,
    };
  }

  const nextTime = params.resolveSnappedTime(localPoint.x, drawing);
  const nextPrice = params.resolveSnappedPrice(localPoint.x, localPoint.y, drawing, priceScale);
  if (nextPrice === null) {
    return {
      nextDrawing: null,
      snapGuide: null,
    };
  }

  const showGuide =
    (params.drawingOptions.magnetGuideVisible && nextPrice.snapped)
    || (params.drawingOptions.timeMagnetGuideVisible && nextTime.snapped);

  const nextDrawing = { ...drawing };
  if (params.drag.handle === "start") {
    nextDrawing.startTime = nextTime.time;
    nextDrawing.startPrice = nextPrice.price;
  } else {
    nextDrawing.endTime = nextTime.time;
    nextDrawing.endPrice = nextPrice.price;
  }

  return {
    nextDrawing,
    snapGuide: showGuide
      ? {
          paneId: drawing.paneId,
          price: nextPrice.snapped ? nextPrice.price : null,
          color: drawing.color,
          source: nextPrice.snapped ? nextPrice.source : null,
          time: params.drawingOptions.timeMagnetGuideVisible && nextTime.snapped ? nextTime.time : null,
        }
      : null,
  };
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
