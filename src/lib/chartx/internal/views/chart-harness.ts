import {
  PlotRowValueIndex,
  PriceScale,
  SeriesDataStore,
  TimeScale,
  type OhlcDataPoint,
} from "../model";
import {
  CandlesticksRenderer,
  GridRenderer,
  type CandlestickItem,
} from "../renderers";
import type { Coordinate } from "../model";

const CHART_BACKGROUND = "#fffdf7";
const PANE_BACKGROUND = "#fffaf0";
const GRID_COLOR = "rgba(16, 16, 16, 0.08)";
const FRAME_COLOR = "rgba(16, 16, 16, 0.18)";
const UP_COLOR = "#0c8f62";
const DOWN_COLOR = "#c7543e";
const WICK_COLOR = "rgba(16, 16, 16, 0.72)";
const CROSSHAIR_COLOR = "rgba(16, 16, 16, 0.5)";
const CROSSHAIR_POINT_COLOR = "#101010";
const DEFAULT_RIGHT_OFFSET = 0.8;
const MIN_BAR_SPACING = 4;
const MAX_BAR_SPACING = 36;

export type PhaseOneCandlestickData = OhlcDataPoint<number>;
export type PhaseOneReadoutDetail = {
  active: boolean;
  time: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  price: number | null;
};

export type PhaseOneCandlestickSeriesApi = {
  setData(data: readonly PhaseOneCandlestickData[]): void;
  update(bar: PhaseOneCandlestickData): void;
};

export type PhaseOneChartApi = {
  addCandlestickSeries(): PhaseOneCandlestickSeriesApi;
  destroy(): void;
};

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

type DragState = {
  startClientX: number;
  startRightOffset: number;
};

const DEFAULT_LAYOUT: Layout = {
  width: 960,
  height: 520,
  top: 28,
  right: 18,
  bottom: 34,
  left: 18,
};

export class PhaseOneChartHarness {
  private readonly store = new SeriesDataStore<number>();
  private readonly timeScale = new TimeScale();
  private readonly priceScale = new PriceScale();
  private readonly candlesRenderer = new CandlesticksRenderer();
  private readonly gridRenderer = new GridRenderer();
  private data: readonly PhaseOneCandlestickData[] = [];
  private seriesAttached = false;
  private canvas: HTMLCanvasElement | null = null;
  private crosshair: PanePoint | null = null;
  private barSpacing: number | null = null;
  private rightOffset = DEFAULT_RIGHT_OFFSET;
  private dragState: DragState | null = null;
  private readonly handleResize = () => {
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  };
  private readonly handlePointerMove = (event: PointerEvent) => {
    if (this.canvas === null) {
      return;
    }

    const layout = measureLayout(this.canvas);
    if (this.dragState !== null && this.data.length > 0) {
      const paneWidth = layout.width - layout.left - layout.right;
      const spacing = resolveBarSpacing(this.barSpacing, paneWidth, this.data.length);
      const deltaBars = (event.clientX - this.dragState.startClientX) / spacing;
      this.rightOffset = this.dragState.startRightOffset - deltaBars;
    }

    this.crosshair = resolvePanePoint(this.canvas, event, layout);
    this.render(this.canvas);
  };
  private readonly handlePointerLeave = () => {
    if (this.canvas === null || this.crosshair === null) {
      return;
    }

    this.crosshair = null;
    this.render(this.canvas);
  };
  private readonly handlePointerDown = (event: PointerEvent) => {
    if (this.canvas === null || this.data.length === 0) {
      return;
    }

    this.dragState = {
      startClientX: event.clientX,
      startRightOffset: this.rightOffset,
    };
    this.canvas.setPointerCapture(event.pointerId);
  };
  private readonly handlePointerUp = (event: PointerEvent) => {
    if (this.canvas === null) {
      return;
    }

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.dragState = null;
  };
  private readonly handleWheel = (event: WheelEvent) => {
    if (this.canvas === null || this.data.length === 0) {
      return;
    }

    event.preventDefault();
    const layout = measureLayout(this.canvas);
    const paneWidth = layout.width - layout.left - layout.right;
    const baseSpacing = calculateBaseBarSpacing(paneWidth, this.data.length);
    const currentSpacing = this.barSpacing ?? baseSpacing;
    const factor = event.deltaY < 0 ? 1.15 : 0.87;
    this.barSpacing = clamp(currentSpacing * factor, MIN_BAR_SPACING, MAX_BAR_SPACING);
    this.render(this.canvas);
  };

  public attach(canvas: HTMLCanvasElement): void {
    assertCanvasElement(canvas);
    this.canvas = canvas;
    this.render(canvas);
    window.addEventListener("resize", this.handleResize);
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("pointercancel", this.handlePointerUp);
    canvas.addEventListener("pointerleave", this.handlePointerLeave);
    canvas.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  public detach(): void {
    if (this.canvas !== null) {
      this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
      this.canvas.removeEventListener("pointermove", this.handlePointerMove);
      this.canvas.removeEventListener("pointerup", this.handlePointerUp);
      this.canvas.removeEventListener("pointercancel", this.handlePointerUp);
      this.canvas.removeEventListener("pointerleave", this.handlePointerLeave);
      this.canvas.removeEventListener("wheel", this.handleWheel);
    }
    window.removeEventListener("resize", this.handleResize);
    this.canvas = null;
    this.crosshair = null;
    this.dragState = null;
  }

  public addCandlestickSeries(): PhaseOneCandlestickSeriesApi {
    if (this.seriesAttached) {
      throw new Error("chartx phase-one chart supports only one candlestick series");
    }

    this.seriesAttached = true;
    return {
      setData: (data) => {
        this.setData(data);
      },
      update: (bar) => {
        this.update(bar);
      },
    };
  }

  public setData(data: readonly PhaseOneCandlestickData[]): void {
    if (!this.seriesAttached) {
      throw new Error("chartx phase-one chart requires addCandlestickSeries before setData");
    }

    this.data = [...data];
    this.barSpacing = null;
    this.rightOffset = DEFAULT_RIGHT_OFFSET;
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  public update(bar: PhaseOneCandlestickData): void {
    if (!this.seriesAttached) {
      throw new Error("chartx phase-one chart requires addCandlestickSeries before update");
    }

    this.data = this.store.update(bar).map((row) => ({
      time: row.time,
      open: row.value[PlotRowValueIndex.Open],
      high: row.value[PlotRowValueIndex.High],
      low: row.value[PlotRowValueIndex.Low],
      close: row.value[PlotRowValueIndex.Close],
    }));
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  public render(canvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    const layout = measureLayout(canvas);
    canvas.width = Math.round(layout.width * dpr);
    canvas.height = Math.round(layout.height * dpr);
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;

    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("Canvas 2D context is unavailable");
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
    context.clearRect(0, 0, layout.width, layout.height);
    context.fillStyle = CHART_BACKGROUND;
    context.fillRect(0, 0, layout.width, layout.height);

    const paneWidth = layout.width - layout.left - layout.right;
    const paneHeight = layout.height - layout.top - layout.bottom;
    context.save();
    context.translate(layout.left, layout.top);
    context.fillStyle = PANE_BACKGROUND;
    context.fillRect(0, 0, paneWidth, paneHeight);

    this.gridRenderer.draw(context, {
      width: paneWidth,
      height: paneHeight,
      columns: 8,
      rows: 5,
      lineColor: GRID_COLOR,
    });

    const rows = this.store.setData(this.data);
    if (rows.length === 0) {
      context.strokeStyle = FRAME_COLOR;
      context.strokeRect(0.5, 0.5, paneWidth - 1, paneHeight - 1);
      context.restore();
      return;
    }

    this.timeScale.applyOptions({
      width: paneWidth,
      pointCount: rows.length,
      barSpacing: resolveBarSpacing(this.barSpacing, paneWidth, rows.length),
      rightOffset: this.rightOffset,
    });

    const priceRange = this.store.priceRange(
      rows[0].index,
      rows[rows.length - 1].index,
    );
    this.priceScale.applyOptions({
      height: paneHeight,
      priceRange,
    });

    const items = rows.map((row): CandlestickItem => ({
      x: this.timeScale.indexToCoordinate(row.index),
      openY: toCoordinate(
        this.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Open]),
      ),
      highY: toCoordinate(
        this.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.High]),
      ),
      lowY: toCoordinate(
        this.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Low]),
      ),
      closeY: toCoordinate(
        this.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close]),
      ),
      isUp: row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
    }));

    this.candlesRenderer.draw(context, {
      items,
      barWidth: paneWidth / Math.max(rows.length * 1.8, 24),
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      wickColor: WICK_COLOR,
    });

    drawCrosshair(context, paneWidth, paneHeight, this.crosshair);
    context.strokeStyle = FRAME_COLOR;
    context.strokeRect(0.5, 0.5, paneWidth - 1, paneHeight - 1);
    context.restore();
    emitReadout(canvas, rows, this.crosshair, this.timeScale, this.priceScale);
  }
}

export function createPhaseOneChart(canvas: HTMLCanvasElement): PhaseOneChartApi {
  assertCanvasElement(canvas);

  const harness = new PhaseOneChartHarness();
  harness.attach(canvas);

  return {
    addCandlestickSeries() {
      return harness.addCandlestickSeries();
    },
    destroy() {
      harness.detach();
    },
  };
}

export function mountPhaseOneChartHarness(canvas: HTMLCanvasElement): () => void {
  const chart = createPhaseOneChart(canvas);
  const series = chart.addCandlestickSeries();
  series.setData(buildDemoBars());

  return () => {
    chart.destroy();
  };
}

function buildDemoBars(): readonly OhlcDataPoint<number>[] {
  let lastClose = 16_500;

  return Array.from({ length: 42 }, (_, index) => {
    const drift = Math.sin(index / 5) * 42;
    const open = lastClose + Math.cos(index / 3) * 18;
    const close = open + drift;
    const high = Math.max(open, close) + 26 + (index % 3) * 3;
    const low = Math.min(open, close) - 24 - (index % 4) * 2;
    lastClose = close;

    return {
      time: index,
      open,
      high,
      low,
      close,
    };
  });
}

function toCoordinate(value: Coordinate | null): Coordinate {
  return (value ?? 0) as Coordinate;
}

function measureLayout(canvas: HTMLCanvasElement): Layout {
  const container = canvas.parentElement;
  if (container === null) {
    return DEFAULT_LAYOUT;
  }

  const styles = window.getComputedStyle(container);
  const horizontalPadding =
    parseFloat(styles.paddingLeft || "0") + parseFloat(styles.paddingRight || "0");
  const availableWidth = Math.floor(container.clientWidth - horizontalPadding);
  const width = clamp(availableWidth, 480, DEFAULT_LAYOUT.width);
  const height = Math.round((width / DEFAULT_LAYOUT.width) * DEFAULT_LAYOUT.height);

  return {
    ...DEFAULT_LAYOUT,
    width,
    height: Math.max(320, height),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function calculateBaseBarSpacing(paneWidth: number, pointCount: number): number {
  return paneWidth / Math.max(pointCount + 2, 12);
}

function resolveBarSpacing(
  currentSpacing: number | null,
  paneWidth: number,
  pointCount: number,
): number {
  return clamp(
    currentSpacing ?? calculateBaseBarSpacing(paneWidth, pointCount),
    MIN_BAR_SPACING,
    MAX_BAR_SPACING,
  );
}

function resolvePanePoint(
  canvas: HTMLCanvasElement,
  event: PointerEvent,
  layout: Layout,
): PanePoint | null {
  const rect = canvas.getBoundingClientRect();
  const localX = event.clientX - rect.left - layout.left;
  const localY = event.clientY - rect.top - layout.top;
  const paneWidth = layout.width - layout.left - layout.right;
  const paneHeight = layout.height - layout.top - layout.bottom;

  if (localX < 0 || localX > paneWidth || localY < 0 || localY > paneHeight) {
    return null;
  }

  return {
    x: clamp(localX, 0, paneWidth),
    y: clamp(localY, 0, paneHeight),
  };
}

function drawCrosshair(
  context: CanvasRenderingContext2D,
  paneWidth: number,
  paneHeight: number,
  crosshair: PanePoint | null,
): void {
  if (crosshair === null) {
    return;
  }

  context.save();
  context.strokeStyle = CROSSHAIR_COLOR;
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
  context.fillStyle = CROSSHAIR_POINT_COLOR;
  context.beginPath();
  context.arc(crosshair.x, crosshair.y, 2.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function emitReadout(
  canvas: HTMLCanvasElement,
  rows: readonly { time: number; value: [number, number, number, number] }[],
  crosshair: PanePoint | null,
  timeScale: TimeScale,
  priceScale: PriceScale,
): void {
  canvas.dispatchEvent(
    new CustomEvent<PhaseOneReadoutDetail>("chartx:readout", {
      detail: buildCrosshairReadout(rows, crosshair, timeScale, priceScale),
    }),
  );
}

function buildCrosshairReadout(
  rows: readonly { time: number; value: [number, number, number, number] }[],
  crosshair: PanePoint | null,
  timeScale: TimeScale,
  priceScale: PriceScale,
): PhaseOneReadoutDetail {
  if (crosshair === null || rows.length === 0) {
    return {
      active: false,
      time: null,
      open: null,
      high: null,
      low: null,
      close: null,
      price: null,
    };
  }

  const logical = Math.round(timeScale.coordinateToLogical(crosshair.x));
  const row = rows[clamp(logical, 0, rows.length - 1)];

  return {
    active: true,
    time: row.time,
    open: row.value[PlotRowValueIndex.Open],
    high: row.value[PlotRowValueIndex.High],
    low: row.value[PlotRowValueIndex.Low],
    close: row.value[PlotRowValueIndex.Close],
    price: priceScale.coordinateToPrice(crosshair.y),
  };
}

function assertCanvasElement(value: unknown): asserts value is HTMLCanvasElement {
  if (!(value instanceof HTMLCanvasElement)) {
    throw new Error("chartx phase-one chart requires an HTMLCanvasElement");
  }
}
