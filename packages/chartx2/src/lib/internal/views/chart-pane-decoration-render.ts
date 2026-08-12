import { PriceScale, TimeScale, type Coordinate } from "../model";
import { drawAxisTag } from "./chart-axis-tags";
import { formatPriceAxisLabel } from "./chart-axis-format";
import type { PriceLineState } from "./chart-price-line-runtime";

type LayoutOptions = {
  axisLabelBackground: string;
  axisLabelBorder: string;
  axisTextColor: string;
  axisActiveBackground: string;
  axisActiveText: string;
};

type MarkerState = {
  time: number;
  position: "aboveBar" | "belowBar" | "inBar";
  shape: "circle" | "square" | "arrowUp" | "arrowDown";
  fill?: "solid" | "hollow";
  color: string;
  text: string;
};

type Row = {
  time: number;
  index: Parameters<TimeScale["indexToCoordinate"]>[0];
  value: readonly number[];
};

type TradeLocationState = {
  request: {
    side: "long" | "short";
  };
  overlay: {
    longColor: string;
    shortColor: string;
    spanOpacity: number;
    connectorLineWidth: number;
    showSpan: boolean;
    showConnector: boolean;
    showMarkers: boolean;
    entryLabel: string;
    exitLabel: string;
  };
  resolvedEntryLogical: number;
  resolvedExitLogical: number;
  resolvedEntryPrice: number;
  resolvedExitPrice: number;
};

type ChartSeriesKind = "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume";

export function drawPriceLines(
  context: CanvasRenderingContext2D,
  paneWidth: number,
  paneHeight: number,
  priceScale: PriceScale,
  priceLines: ReadonlyMap<string, PriceLineState>,
  options: LayoutOptions,
  formatter: ((value: number) => string) | null,
): void {
  if (priceLines.size === 0) {
    return;
  }

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "middle";
  context.setLineDash([4, 4]);

  for (const line of priceLines.values()) {
    const y = toCoordinate(priceScale.priceToCoordinate(line.price));
    if (y < 0 || y > paneHeight) {
      continue;
    }

    context.strokeStyle = line.color;
    context.lineWidth = line.lineWidth;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(paneWidth, y);
    context.stroke();

    const formattedPrice = formatPriceAxisLabel(line.price, formatter);
    const label = line.title.trim() === "" ? formattedPrice : `${line.title} ${formattedPrice}`;
    drawAxisTag(
      context,
      {
        text: label,
        x: Math.max(8, paneWidth - context.measureText(label).width - 22),
        y: y - 9,
      },
      {
        ...options,
        axisLabelBorder: line.color,
        axisTextColor: line.color,
      },
    );
  }

  context.restore();
}

export function drawSeriesMarkers(
  context: CanvasRenderingContext2D,
  rows: readonly Row[],
  markers: readonly MarkerState[],
  timeScale: TimeScale,
  priceScale: PriceScale,
  paneHeight: number,
  kind: ChartSeriesKind | null,
): void {
  if (markers.length === 0 || rows.length === 0 || kind === null) {
    return;
  }

  const rowsByTime = new Map(rows.map((row) => [row.time, row]));

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (const marker of markers) {
    const row = rowsByTime.get(marker.time);
    if (row === undefined) {
      continue;
    }

    const x = timeScale.indexToCoordinate(row.index);
    const y = markerYForRow(row, marker.position, priceScale, kind, paneHeight);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < -24 || x > 5000) {
      continue;
    }

    drawMarkerShape(context, x, y, marker.shape, marker.color, marker.fill ?? "solid");
    if (marker.text !== "") {
      const textY = marker.position === "belowBar" ? y + 13 : y - 13;
      context.fillStyle = marker.color;
      context.fillText(marker.text, x, textY);
    }
  }

  context.restore();
}

export function drawTradeLocationOverlay(
  context: CanvasRenderingContext2D,
  state: TradeLocationState | null,
  paneHeight: number,
  timeScale: TimeScale,
  priceScale: PriceScale,
  deps: {
    backgroundColor: string;
  },
): void {
  if (state === null) {
    return;
  }

  const x1 = timeScale.logicalToCoordinate(state.resolvedEntryLogical as never);
  const x2 = timeScale.logicalToCoordinate(state.resolvedExitLogical as never);
  const y1 = toCoordinate(priceScale.priceToCoordinate(state.resolvedEntryPrice));
  const y2 = toCoordinate(priceScale.priceToCoordinate(state.resolvedExitPrice));
  if (![x1, x2, y1, y2].every(Number.isFinite)) {
    return;
  }

  const isLong = state.request.side === "long";
  const color = isLong ? state.overlay.longColor : state.overlay.shortColor;
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";

  if (state.overlay.showSpan) {
    context.fillStyle = withAlpha(color, state.overlay.spanOpacity);
    context.fillRect(left, 0, Math.max(2, right - left), paneHeight);
  }

  if (state.overlay.showConnector) {
    context.strokeStyle = color;
    context.lineWidth = state.overlay.connectorLineWidth;
    context.setLineDash([6, 4]);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.setLineDash([]);
  }

  context.fillStyle = deps.backgroundColor;
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(x1, y1, 4.5, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.arc(x2, y2, 4.5, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  if (state.overlay.showMarkers) {
    drawMarkerShape(
      context,
      x1,
      isLong ? Math.min(paneHeight - 12, y1 + 18) : Math.max(12, y1 - 18),
      isLong ? "arrowUp" : "arrowDown",
      color,
    );
    drawMarkerShape(
      context,
      x2,
      isLong ? Math.max(12, y2 - 18) : Math.min(paneHeight - 12, y2 + 18),
      isLong ? "arrowDown" : "arrowUp",
      color,
    );
    context.fillStyle = color;
    context.fillText(
      state.overlay.entryLabel,
      x1,
      isLong ? Math.min(paneHeight - 10, y1 + 34) : Math.max(10, y1 - 34),
    );
    context.fillText(
      state.overlay.exitLabel,
      x2,
      isLong ? Math.max(10, y2 - 34) : Math.min(paneHeight - 10, y2 + 34),
    );
  }

  context.restore();
}

function markerYForRow(
  row: { value: readonly number[] },
  position: MarkerState["position"],
  priceScale: PriceScale,
  kind: ChartSeriesKind,
  paneHeight: number,
): number {
  const openY = toCoordinate(priceScale.priceToCoordinate(row.value[0]));
  const highY = toCoordinate(priceScale.priceToCoordinate(row.value[1]));
  const lowY = toCoordinate(priceScale.priceToCoordinate(row.value[2]));
  const closeY = toCoordinate(priceScale.priceToCoordinate(row.value[3]));

  if (position === "inBar") {
    if (kind === "histogram" || kind === "volume") {
      const range = priceScale.getPriceRange();
      const basePrice = range?.minValue() ?? 0;
      const baseY = toCoordinate(priceScale.priceToCoordinate(basePrice));
      return Math.max(12, Math.min(paneHeight - 12, (baseY + closeY) / 2));
    }
    return Math.max(12, Math.min(paneHeight - 12, closeY));
  }

  if (position === "aboveBar") {
    const anchor = kind === "line" || kind === "area" || kind === "baseline" ? closeY : highY;
    return Math.max(10, anchor - 14);
  }

  const anchor = kind === "line" || kind === "area" || kind === "baseline" ? closeY : lowY;
  return Math.min(paneHeight - 10, anchor + 14);
}

function drawMarkerShape(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  shape: MarkerState["shape"],
  color: string,
  fill: "solid" | "hollow" = "solid",
): void {
  context.save();
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = 1.5;

  if (shape === "circle") {
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    if (fill === "hollow") {
      context.stroke();
    } else {
      context.fill();
    }
    context.restore();
    return;
  }

  if (shape === "square") {
    if (fill === "hollow") {
      context.strokeRect(x - 4, y - 4, 8, 8);
    } else {
      context.fillRect(x - 4, y - 4, 8, 8);
    }
    context.restore();
    return;
  }

  context.beginPath();
  if (shape === "arrowUp") {
    context.moveTo(x, y - 6);
    context.lineTo(x + 6, y + 4);
    context.lineTo(x + 2, y + 4);
    context.lineTo(x + 2, y + 8);
    context.lineTo(x - 2, y + 8);
    context.lineTo(x - 2, y + 4);
    context.lineTo(x - 6, y + 4);
  } else {
    context.moveTo(x, y + 6);
    context.lineTo(x + 6, y - 4);
    context.lineTo(x + 2, y - 4);
    context.lineTo(x + 2, y - 8);
    context.lineTo(x - 2, y - 8);
    context.lineTo(x - 2, y - 4);
    context.lineTo(x - 6, y - 4);
  }
  context.closePath();
  if (fill === "hollow") {
    context.stroke();
  } else {
    context.fill();
  }
  context.restore();
}

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("#")) {
    const normalized = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
    const red = Number.parseInt(normalized.slice(1, 3), 16);
    const green = Number.parseInt(normalized.slice(3, 5), 16);
    const blue = Number.parseInt(normalized.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const rgbaMatch = color.match(/^rgba?\((.+)\)$/);
  if (rgbaMatch === null) {
    return color;
  }
  const [red = "0", green = "0", blue = "0"] = rgbaMatch[1].split(",").map((token) => token.trim());
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function toCoordinate(value: Coordinate | null): Coordinate {
  return (value ?? 0) as Coordinate;
}
