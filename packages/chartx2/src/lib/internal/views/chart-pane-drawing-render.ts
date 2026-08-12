import { PriceScale, TimeScale, type Coordinate } from "../model";

type DrawingDragHandle = "start" | "end";

type HorizontalLineDrawing = {
  id: string;
  kind: "horizontal-line";
  visible: boolean;
  line: {
    price: number;
    lineWidth: number;
  };
};

type TrendLineDrawing = {
  id: string;
  kind: "trend-line";
  visible: boolean;
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
  color: string;
  lineWidth: number;
};

type DrawingSnapGuideState = {
  color: string;
  price: number | null;
  time: number | null;
};

export function drawPaneDrawings(
  context: CanvasRenderingContext2D,
  drawings: readonly (HorizontalLineDrawing | TrendLineDrawing)[],
  deps: {
    resolveDrawingTimeCoordinate(time: number): number;
    priceScale: PriceScale;
    selectedDrawingId: string | null;
    hoveredDrawingId: string | null;
    hoveredDrawingHandle: DrawingDragHandle | null;
    selectionColor: string;
    handleBackgroundColor: string;
  },
): void {
  for (const drawing of drawings) {
    if (!drawing.visible) {
      continue;
    }

    if (drawing.kind === "horizontal-line") {
      if (deps.selectedDrawingId === drawing.id) {
        const y = toCoordinate(deps.priceScale.priceToCoordinate(drawing.line.price));
        context.save();
        context.strokeStyle = deps.selectionColor;
        context.lineWidth = drawing.line.lineWidth + 6;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(context.canvas.width, y);
        context.stroke();
        context.restore();
      }
      continue;
    }

    const startX = deps.resolveDrawingTimeCoordinate(drawing.startTime);
    const endX = deps.resolveDrawingTimeCoordinate(drawing.endTime);
    const startY = toCoordinate(deps.priceScale.priceToCoordinate(drawing.startPrice));
    const endY = toCoordinate(deps.priceScale.priceToCoordinate(drawing.endPrice));

    context.save();
    context.strokeStyle = drawing.color;
    context.lineWidth = drawing.lineWidth;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
    if (deps.selectedDrawingId === drawing.id) {
      context.strokeStyle = deps.selectionColor;
      context.lineWidth = drawing.lineWidth + 6;
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.stroke();
      context.fillStyle = drawing.color;
      context.beginPath();
      context.arc(startX, startY, 3.5, 0, Math.PI * 2);
      context.arc(endX, endY, 3.5, 0, Math.PI * 2);
      context.fill();
      if (deps.hoveredDrawingId === drawing.id && deps.hoveredDrawingHandle !== null) {
        const hoveredX = deps.hoveredDrawingHandle === "start" ? startX : endX;
        const hoveredY = deps.hoveredDrawingHandle === "start" ? startY : endY;
        context.fillStyle = deps.handleBackgroundColor;
        context.strokeStyle = drawing.color;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(hoveredX, hoveredY, 6, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    }
    context.restore();
  }
}

export function drawDrawingSnapGuide(
  context: CanvasRenderingContext2D,
  paneWidth: number,
  paneHeight: number,
  guide: DrawingSnapGuideState | null,
  deps: {
    priceScale: PriceScale;
    resolveDrawingTimeCoordinate(time: number): number;
  },
): void {
  if (guide === null) {
    return;
  }

  context.save();
  context.strokeStyle = guide.color;
  context.lineWidth = 1;
  context.setLineDash([6, 4]);
  if (guide.price !== null) {
    const y = deps.priceScale.priceToCoordinate(guide.price);
    if (y !== null) {
      context.beginPath();
      context.moveTo(0, Math.round(y) + 0.5);
      context.lineTo(paneWidth, Math.round(y) + 0.5);
      context.stroke();
    }
  }
  if (guide.time !== null) {
    const x = deps.resolveDrawingTimeCoordinate(guide.time);
    context.beginPath();
    context.moveTo(Math.round(x) + 0.5, 0);
    context.lineTo(Math.round(x) + 0.5, paneHeight);
    context.stroke();
  }
  context.restore();
}

function toCoordinate(value: Coordinate | null): Coordinate {
  return (value ?? 0) as Coordinate;
}
