import { findNearestRowByLogical, PriceScale, TimeScale, type Coordinate } from "../model";
import {
  formatPriceAxisLabel,
  formatTimeAxisLabel,
  formatVolumeAxisLabel,
} from "./chart-axis-format";
import { resolveDrawingTimeCoordinate } from "./chart-drawing-geometry";

type Layout = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type PanePoint = {
  x: number;
  y: number;
};

type DrawingSnapGuideState = {
  paneId: string;
  color: string;
  price: number | null;
  source: "open" | "high" | "low" | "close" | null;
  time: number | null;
};

type AxisStyleOptions = {
  axisLabelBackground: string;
  axisLabelBorder: string;
  axisTextColor: string;
  axisActiveBackground: string;
  axisActiveText: string;
};

type LayoutOptions = AxisStyleOptions & {
  priceAxisPosition: "left" | "right";
};

const AXIS_TAG_HEIGHT = 18;

export type AxisTag = {
  text: string;
  x: number;
  y: number;
  maxWidth?: number;
  active?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
};

export function drawPriceAxis(
  context: CanvasRenderingContext2D,
  layout: Layout,
  paneTop: number,
  paneHeight: number,
  priceScale: PriceScale,
  crosshair: PanePoint | null,
  options: LayoutOptions,
  axisType: "primary" | "volume",
  formatter: ((value: number) => string) | null,
  overlayTag: AxisTag | null = null,
): void {
  const range = priceScale.getPriceRange();
  if (range === null) {
    return;
  }

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "middle";

  const tickCount = clamp(Math.floor(paneHeight / 76), 3, 7);
  const paneLabelTop = layout.top + paneTop;
  const paneLabelBottom = paneLabelTop + paneHeight - AXIS_TAG_HEIGHT;
  const labels: AxisTag[] = Array.from({ length: tickCount }, (_, index) => {
    const ratio = tickCount === 1 ? 0 : index / (tickCount - 1);
    const price = range.maxValue() - range.length() * ratio;
    const text =
      axisType === "volume"
        ? formatVolumeAxisLabel(price)
        : formatPriceAxisLabel(price, formatter);
    return {
      text,
      x: resolvePriceAxisTagX(context, layout, options, text),
      y: resolvePriceAxisTagY(layout.top + paneTop + paneHeight * ratio, paneLabelTop, paneLabelBottom),
      maxWidth: options.priceAxisPosition === "left" ? resolveLeftPriceAxisTagMaxWidth(layout) : undefined,
    };
  });

  for (const label of labels) {
    drawAxisTag(context, label, options);
  }

  if (crosshair !== null) {
    const price = priceScale.coordinateToPrice(crosshair.y);
    if (price !== null) {
      const text =
        axisType === "volume"
          ? formatVolumeAxisLabel(price)
          : formatPriceAxisLabel(price, formatter);
      drawAxisTag(context, {
        text,
        x: resolvePriceAxisTagX(context, layout, options, text),
        y: resolvePriceAxisTagY(layout.top + paneTop + crosshair.y, paneLabelTop, paneLabelBottom),
        maxWidth: options.priceAxisPosition === "left" ? resolveLeftPriceAxisTagMaxWidth(layout) : undefined,
        active: true,
      }, options);
    }
  }

  if (overlayTag !== null) {
    drawAxisTag(context, overlayTag, options);
  }

  context.restore();
}

export function buildMagnetAxisTag(
  layout: Layout,
  paneTop: number,
  priceScale: PriceScale,
  guide: DrawingSnapGuideState,
  formatter: ((value: number) => string) | null,
  axisPosition: "left" | "right" = "right",
): AxisTag | null {
  if (guide.price === null) {
    return null;
  }
  const y = priceScale.priceToCoordinate(guide.price);
  if (y === null) {
    return null;
  }

  return {
    text: `MAG ${guide.source?.toUpperCase() ?? "PRICE"} ${formatPriceAxisLabel(guide.price, formatter)}`,
    x: axisPosition === "left" ? 4 : layout.width - layout.right + 6,
    y: layout.top + paneTop + y - 9,
    maxWidth: axisPosition === "left" ? resolveLeftPriceAxisTagMaxWidth(layout) : undefined,
    backgroundColor: guide.color,
    borderColor: guide.color,
    textColor: "#fffdf7",
  };
}

export function drawTimeAxis(
  context: CanvasRenderingContext2D,
  layout: Layout,
  rows: readonly { time: number; index: number }[],
  timeScale: TimeScale,
  crosshair: PanePoint | null,
  options: LayoutOptions,
  formatter: ((time: number) => string) | null,
  overlayTag: AxisTag | null = null,
): void {
  if (rows.length === 0) {
    return;
  }

  const paneHeight = layout.height - layout.top - layout.bottom;
  const visible = timeScale.visibleStrictRange();
  const minIndex = rows[0]?.index ?? 0;
  const maxIndex = rows[rows.length - 1]?.index ?? 0;
  const start = visible === null ? minIndex : clamp(visible.left(), minIndex, maxIndex);
  const end = visible === null ? maxIndex : clamp(visible.right(), minIndex, maxIndex);
  const tickCount = clamp(Math.floor((layout.width - layout.left - layout.right) / 140), 3, 7);
  const anchors = collectVisibleTimeAnchors(rows, start, end, tickCount);

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "top";
  context.fillStyle = options.axisTextColor;

  for (const row of anchors) {
    const text = formatTimeAxisLabel(row.time, formatter);
    const x = layout.left + timeScale.indexToCoordinate(row.index as never);
    drawAxisTag(context, {
      text,
      x: clampCenterTag(x, context.measureText(text).width, layout.left, layout.width - layout.right),
      y: layout.top + paneHeight + 8,
    }, options);
  }

  if (crosshair !== null) {
    const logical = Math.round(timeScale.coordinateToLogical(crosshair.x));
    const row = findNearestRowByLogical(rows, logical);
    if (row === null) {
      context.restore();
      return;
    }
    const text = formatTimeAxisLabel(row.time, formatter);
    drawAxisTag(context, {
      text,
      x: clampCenterTag(layout.left + crosshair.x, context.measureText(text).width, layout.left, layout.width - layout.right),
      y: layout.top + paneHeight + 8,
      active: true,
    }, options);
  }

  if (overlayTag !== null) {
    drawAxisTag(context, overlayTag, options);
  }

  context.restore();
}

export function buildMagnetTimeAxisTag(
  layout: Layout,
  rows: readonly { time: number; index: number }[],
  timeScale: TimeScale,
  guide: DrawingSnapGuideState,
  formatter: ((time: number) => string) | null,
): AxisTag | null {
  if (guide.time === null || rows.length === 0) {
    return null;
  }
  const x = resolveDrawingTimeCoordinate(guide.time, rows, timeScale);
  const text = `MAG ${formatTimeAxisLabel(guide.time, formatter)}`;
  const estimatedWidth = text.length * 7;
  return {
    text,
    x: clampCenterTag(layout.left + x, estimatedWidth, layout.left, layout.width - layout.right),
    y: layout.top + (layout.height - layout.top - layout.bottom) + 8,
    backgroundColor: guide.color,
    borderColor: guide.color,
    textColor: "#fffdf7",
  };
}

export function drawAxisTag(
  context: CanvasRenderingContext2D,
  tag: AxisTag,
  options: AxisStyleOptions,
): void {
  const displayText = fitAxisTagText(context, tag.text, tag.maxWidth);
  const textWidth = context.measureText(displayText).width;
  const boxWidth = Math.min(Math.ceil(textWidth + 12), tag.maxWidth ?? Number.POSITIVE_INFINITY);
  const boxHeight = AXIS_TAG_HEIGHT;

  context.fillStyle = tag.backgroundColor ?? (tag.active ? options.axisActiveBackground : options.axisLabelBackground);
  context.strokeStyle = tag.borderColor ?? (tag.active ? options.axisActiveBackground : options.axisLabelBorder);
  context.lineWidth = 1;
  context.fillRect(tag.x, tag.y, boxWidth, boxHeight);
  context.strokeRect(tag.x + 0.5, tag.y + 0.5, boxWidth - 1, boxHeight - 1);
  context.fillStyle = tag.textColor ?? (tag.active ? options.axisActiveText : options.axisTextColor);
  context.fillText(
    displayText,
    tag.x + 6,
    tag.y + (context.textBaseline === "middle" ? boxHeight / 2 : 4),
  );
}

function resolvePriceAxisTagY(centerY: number, minTop: number, maxTop: number): number {
  return clamp(centerY - AXIS_TAG_HEIGHT / 2, minTop, Math.max(minTop, maxTop));
}

function collectVisibleTimeAnchors(
  rows: readonly { time: number; index: number }[],
  start: number,
  end: number,
  tickCount: number,
): readonly { time: number; index: number }[] {
  const visible = rows.filter((row) => row.index >= start && row.index <= end);
  if (visible.length === 0) {
    return [];
  }
  if (visible.length <= tickCount) {
    return visible;
  }

  const lastIndex = visible.length - 1;
  const anchors: { time: number; index: number }[] = [];
  for (let tick = 0; tick < tickCount; tick += 1) {
    const ratio = tickCount === 1 ? 0 : tick / (tickCount - 1);
    const candidate = visible[Math.round(lastIndex * ratio)];
    if (candidate !== undefined && anchors.at(-1)?.index !== candidate.index) {
      anchors.push(candidate);
    }
  }
  return anchors;
}

function clampCenterTag(
  centerX: number,
  textWidth: number,
  minX: number,
  maxX: number,
): number {
  const boxWidth = Math.ceil(textWidth + 12);
  return clamp(centerX - boxWidth / 2, minX, maxX - boxWidth);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolvePriceAxisTagX(
  context: CanvasRenderingContext2D,
  layout: Layout,
  options: Pick<LayoutOptions, "priceAxisPosition">,
  text: string,
): number {
  if (options.priceAxisPosition === "right") {
    return layout.width - layout.right + 6;
  }
  const boxWidth = Math.ceil(context.measureText(text).width + 12);
  return Math.max(4, layout.left - boxWidth - 6);
}

function resolveLeftPriceAxisTagMaxWidth(layout: Layout): number {
  return Math.max(18, layout.left - 10);
}

function fitAxisTagText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number | undefined,
): string {
  if (maxWidth === undefined || context.measureText(text).width + 12 <= maxWidth) {
    return text;
  }
  const availableTextWidth = Math.max(0, maxWidth - 12);
  const ellipsis = "...";
  if (context.measureText(ellipsis).width > availableTextWidth) {
    return "";
  }
  let low = 0;
  let high = text.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (context.measureText(`${text.slice(0, middle)}${ellipsis}`).width <= availableTextWidth) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }
  return `${text.slice(0, low)}${ellipsis}`;
}

function toCoordinate(value: Coordinate | null): Coordinate {
  return (value ?? 0) as Coordinate;
}
