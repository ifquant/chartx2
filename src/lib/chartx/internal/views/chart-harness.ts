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

export type PhaseOneCandlestickData = OhlcDataPoint<number>;

export type PhaseOneCandlestickSeriesApi = {
  setData(data: readonly PhaseOneCandlestickData[]): void;
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
  private readonly handleResize = () => {
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  };

  public attach(canvas: HTMLCanvasElement): void {
    assertCanvasElement(canvas);
    this.canvas = canvas;
    this.render(canvas);
    window.addEventListener("resize", this.handleResize);
  }

  public detach(): void {
    window.removeEventListener("resize", this.handleResize);
    this.canvas = null;
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
    };
  }

  public setData(data: readonly PhaseOneCandlestickData[]): void {
    if (!this.seriesAttached) {
      throw new Error("chartx phase-one chart requires addCandlestickSeries before setData");
    }

    this.data = [...data];
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
      barSpacing: paneWidth / Math.max(rows.length + 2, 12),
      rightOffset: 0.8,
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

    context.strokeStyle = FRAME_COLOR;
    context.strokeRect(0.5, 0.5, paneWidth - 1, paneHeight - 1);
    context.restore();
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

function assertCanvasElement(value: unknown): asserts value is HTMLCanvasElement {
  if (!(value instanceof HTMLCanvasElement)) {
    throw new Error("chartx phase-one chart requires an HTMLCanvasElement");
  }
}
