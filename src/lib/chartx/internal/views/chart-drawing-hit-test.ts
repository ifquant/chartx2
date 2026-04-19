import type { PaneFrame, PriceScale, TimeScale, TimePointIndex } from "../model";
import {
  distanceToLineSegment,
  resolveDrawingTimeCoordinate,
} from "./chart-drawing-geometry";

type PanePoint = {
  x: number;
  y: number;
};

type HorizontalLineDrawing = {
  id: string;
  kind: "horizontal-line";
  paneId: string;
  visible: boolean;
  line: {
    price: number;
  };
};

type TrendLineDrawing = {
  id: string;
  kind: "trend-line";
  paneId: string;
  visible: boolean;
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
};

type DrawingDescriptor = HorizontalLineDrawing | TrendLineDrawing;

type DrawingDragState = {
  drawingId: string;
  handle: "start" | "end";
};

type AxisBar = {
  time: number;
  index: TimePointIndex;
};

export function resolveHitDrawing<Drawing extends DrawingDescriptor>(
  params: {
    point: PanePoint;
    paneFrames: readonly PaneFrame[];
    primaryPriceScale: PriceScale;
    getSecondaryPriceScale(paneId: string): PriceScale | undefined;
    axisBars: readonly AxisBar[];
    timeScale: TimeScale;
    drawingsForPane(paneId: string): readonly Drawing[];
    hitTolerance: number;
  },
): Drawing | null {
  const activePane = resolveActivePane(params.paneFrames, params.point.y);
  if (activePane === null) {
    return null;
  }
  const localPoint = resolveLocalPanePoint(activePane, params.point);
  if (localPoint === null) {
    return null;
  }
  const priceScale = activePane.kind === "primary"
    ? params.primaryPriceScale
    : params.getSecondaryPriceScale(activePane.id);
  if (priceScale === undefined) {
    return null;
  }

  let best: { drawing: Drawing; distance: number } | null = null;
  for (const drawing of params.drawingsForPane(activePane.id)) {
    if (!drawing.visible) {
      continue;
    }
    const distance = drawingHitDistance(localPoint, drawing, params.axisBars, params.timeScale, priceScale);
    if (distance === null || distance > params.hitTolerance) {
      continue;
    }
    if (best === null || distance < best.distance) {
      best = { drawing, distance };
    }
  }

  return best?.drawing ?? null;
}

export function resolveSelectedTrendLineDragHandle(
  params: {
    point: PanePoint;
    paneFrames: readonly PaneFrame[];
    selectedDrawing: TrendLineDrawing | null;
    primaryPriceScale: PriceScale;
    getSecondaryPriceScale(paneId: string): PriceScale | undefined;
    axisBars: readonly AxisBar[];
    timeScale: TimeScale;
    hitTolerance: number;
  },
): DrawingDragState | null {
  const drawing = params.selectedDrawing;
  if (drawing === null || !drawing.visible) {
    return null;
  }

  const activePane = resolveActivePane(params.paneFrames, params.point.y);
  if (activePane === null || activePane.id !== drawing.paneId) {
    return null;
  }
  const localPoint = resolveLocalPanePoint(activePane, params.point);
  if (localPoint === null) {
    return null;
  }

  const priceScale = activePane.kind === "primary"
    ? params.primaryPriceScale
    : params.getSecondaryPriceScale(activePane.id);
  if (priceScale === undefined) {
    return null;
  }

  const startX = resolveDrawingTimeCoordinate(drawing.startTime, params.axisBars, params.timeScale);
  const endX = resolveDrawingTimeCoordinate(drawing.endTime, params.axisBars, params.timeScale);
  const startY = priceScale.priceToCoordinate(drawing.startPrice);
  const endY = priceScale.priceToCoordinate(drawing.endPrice);
  if (startY === null || endY === null) {
    return null;
  }

  const startDistance = Math.hypot(localPoint.x - startX, localPoint.y - startY);
  const endDistance = Math.hypot(localPoint.x - endX, localPoint.y - endY);
  if (startDistance <= params.hitTolerance) {
    return { drawingId: drawing.id, handle: "start" };
  }
  if (endDistance <= params.hitTolerance) {
    return { drawingId: drawing.id, handle: "end" };
  }

  const lineDistance = distanceToLineSegment(localPoint.x, localPoint.y, startX, startY, endX, endY);
  if (lineDistance <= params.hitTolerance) {
    return {
      drawingId: drawing.id,
      handle: startDistance <= endDistance ? "start" : "end",
    };
  }

  return null;
}

function resolveActivePane(
  panes: readonly PaneFrame[],
  y: number,
): PaneFrame | null {
  return panes.find((pane) => y >= pane.top && y <= pane.top + pane.height) ?? null;
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

function drawingHitDistance(
  point: PanePoint,
  drawing: DrawingDescriptor,
  axisBars: readonly AxisBar[],
  timeScale: TimeScale,
  priceScale: PriceScale,
): number | null {
  if (drawing.kind === "horizontal-line") {
    const y = priceScale.priceToCoordinate(drawing.line.price);
    return y === null ? null : Math.abs(point.y - y);
  }

  const startX = resolveDrawingTimeCoordinate(drawing.startTime, axisBars, timeScale);
  const endX = resolveDrawingTimeCoordinate(drawing.endTime, axisBars, timeScale);
  const startY = priceScale.priceToCoordinate(drawing.startPrice);
  const endY = priceScale.priceToCoordinate(drawing.endPrice);
  if (startY === null || endY === null) {
    return null;
  }

  return distanceToLineSegment(point.x, point.y, startX, startY, endX, endY);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
