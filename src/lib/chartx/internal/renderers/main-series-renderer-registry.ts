import {
  PlotRowValueIndex,
  type OhlcDataPoint,
  type PlotRow,
  type PriceScale,
  type Coordinate,
} from "../model";
import type { PhaseOneMainSeriesRenderer } from "../model";
import {
  AreaRenderer,
  type AreaItem,
  BarRenderer,
  type BarItem,
  BaselineRenderer,
  type BaselineItem,
  CandlesticksRenderer,
  type CandlestickItem,
  HistogramRenderer,
  type HistogramItem,
  KagiRenderer,
  type KagiRendererItem,
  LineRenderer,
  type LineItem,
  PointFigureRenderer,
  type PointFigureItem,
} from ".";

type MainSeriesRendererRuntime = {
  lineRenderer: LineRenderer;
  areaRenderer: AreaRenderer;
  baselineRenderer: BaselineRenderer;
  barRenderer: BarRenderer;
  candlesRenderer: CandlesticksRenderer;
  pointFigureRenderer: PointFigureRenderer;
  histogramRenderer: HistogramRenderer;
  kagiRenderer: KagiRenderer;
};

export type MainSeriesRendererVisual = {
  isUp: boolean;
  color?: string;
};

export type MainSeriesRendererRequest = {
  context: CanvasRenderingContext2D;
  renderer: PhaseOneMainSeriesRenderer;
  rows: readonly PlotRow<number>[];
  paneHeight: number;
  barWidth: number;
  priceScale: PriceScale;
  rangeMin: number | null;
  timeToX: (index: PlotRow<number>["index"]) => Coordinate;
  priceToY: (value: number) => Coordinate;
  options: Record<string, unknown>;
  inputData: readonly OhlcDataPoint<number>[];
  visuals: ReadonlyMap<number, MainSeriesRendererVisual>;
  runtime: MainSeriesRendererRuntime;
};

type MainSeriesRendererExecutor = (request: MainSeriesRendererRequest) => void;

export const MAIN_SERIES_RENDERERS: Record<PhaseOneMainSeriesRenderer, MainSeriesRendererExecutor> = {
  line: (request) => {
    const options = request.options as { color: string; lineWidth: number };
    const lineItems = request.rows.map((row): LineItem => ({
      x: request.timeToX(row.index),
      y: request.priceToY(row.value[PlotRowValueIndex.Close]),
    }));

    request.runtime.lineRenderer.draw(request.context, {
      items: lineItems,
      lineColor: options.color,
      lineWidth: options.lineWidth,
      mode: "line",
      showMarkers: false,
    });
  },
  "line-markers": (request) => {
    const options = request.options as { color: string; lineWidth: number };
    const lineItems = request.rows.map((row): LineItem => ({
      x: request.timeToX(row.index),
      y: request.priceToY(row.value[PlotRowValueIndex.Close]),
    }));

    request.runtime.lineRenderer.draw(request.context, {
      items: lineItems,
      lineColor: options.color,
      lineWidth: options.lineWidth,
      mode: "line",
      showMarkers: true,
      markerRadius: Math.max(2, options.lineWidth + 1),
    });
  },
  stepline: (request) => {
    const options = request.options as { color: string; lineWidth: number };
    const lineItems = request.rows.map((row): LineItem => ({
      x: request.timeToX(row.index),
      y: request.priceToY(row.value[PlotRowValueIndex.Close]),
    }));

    request.runtime.lineRenderer.draw(request.context, {
      items: lineItems,
      lineColor: options.color,
      lineWidth: options.lineWidth,
      mode: "stepline",
      showMarkers: false,
    });
  },
  kagi: (request) => {
    const options = request.options as { color: string; lineWidth: number };
    const items = request.rows.map((row, index): KagiRendererItem => ({
      x: request.timeToX(row.index),
      openY: request.priceToY(row.value[PlotRowValueIndex.Open]),
      closeY: request.priceToY(row.value[PlotRowValueIndex.Close]),
      isYang: inferKagiLineState(request.rows, index),
    }));

    request.runtime.kagiRenderer.draw(request.context, {
      items,
      lineColor: options.color,
      lineWidth: options.lineWidth,
    });
  },
  segment: (request) => {
    const options = request.options as { color: string; lineWidth: number };
    const lineItems = request.rows.flatMap((row): LineItem[] => {
      const x = request.timeToX(row.index);
      return [
        { x, y: request.priceToY(row.value[PlotRowValueIndex.Open]) },
        { x, y: request.priceToY(row.value[PlotRowValueIndex.Close]) },
      ];
    });

    request.runtime.lineRenderer.draw(request.context, {
      items: lineItems,
      lineColor: options.color,
      lineWidth: options.lineWidth,
      mode: "line",
      showMarkers: false,
    });
  },
  area: (request) => {
    const options = request.options as {
      lineColor: string;
      lineWidth: number;
      topColor: string;
      bottomColor: string;
    };
    const areaItems = request.rows.map((row): AreaItem => ({
      x: request.timeToX(row.index),
      y: request.priceToY(row.value[PlotRowValueIndex.Close]),
    }));

    request.runtime.areaRenderer.draw(request.context, {
      items: areaItems,
      lineColor: options.lineColor,
      lineWidth: options.lineWidth,
      topColor: options.topColor,
      bottomColor: options.bottomColor,
      baseY: request.paneHeight,
    });
  },
  baseline: (request) => {
    const options = request.options as {
      baseValue: number;
      lineWidth: number;
      topLineColor: string;
      topFillTopColor: string;
      topFillBottomColor: string;
      bottomLineColor: string;
      bottomFillTopColor: string;
      bottomFillBottomColor: string;
    };
    const baselineItems = request.rows.map((row): BaselineItem => ({
      x: request.timeToX(row.index),
      y: request.priceToY(row.value[PlotRowValueIndex.Close]),
    }));

    request.runtime.baselineRenderer.draw(request.context, {
      items: baselineItems,
      baseY: request.priceToY(options.baseValue),
      height: request.paneHeight,
      lineWidth: options.lineWidth,
      topLineColor: options.topLineColor,
      topFillTopColor: options.topFillTopColor,
      topFillBottomColor: options.topFillBottomColor,
      bottomLineColor: options.bottomLineColor,
      bottomFillTopColor: options.bottomFillTopColor,
      bottomFillBottomColor: options.bottomFillBottomColor,
    });
  },
  bars: (request) => {
    const options = request.options as { upColor: string; downColor: string };
    const barItems = buildBarItems(request);
    request.runtime.barRenderer.draw(request.context, {
      items: barItems,
      barWidth: request.barWidth,
      upColor: options.upColor,
      downColor: options.downColor,
      mode: "bars",
    });
  },
  "hlc-bars": (request) => {
    const options = request.options as { upColor: string; downColor: string };
    const barItems = buildBarItems(request);
    request.runtime.barRenderer.draw(request.context, {
      items: barItems,
      barWidth: request.barWidth,
      upColor: options.upColor,
      downColor: options.downColor,
      mode: "hlc-bars",
    });
  },
  "high-low": (request) => {
    const options = request.options as { upColor: string; downColor: string };
    const barItems = buildBarItems(request);
    request.runtime.barRenderer.draw(request.context, {
      items: barItems,
      barWidth: request.barWidth,
      upColor: options.upColor,
      downColor: options.downColor,
      mode: "high-low",
    });
  },
  candles: (request) => {
    drawCandlestickFamily(request, "filled", false);
  },
  brick: (request) => {
    drawCandlestickFamily(request, "filled", true);
  },
  "hollow-candles": (request) => {
    drawCandlestickFamily(request, "hollow", false);
  },
  "volume-candles": (request) => {
    drawCandlestickFamily(request, "filled", false, true);
  },
  "point-figure": (request) => {
    const options = request.options as { upColor: string; downColor: string };
    const items = request.rows.map((row): PointFigureItem => ({
      x: request.timeToX(row.index),
      openY: request.priceToY(row.value[PlotRowValueIndex.Open]),
      closeY: request.priceToY(row.value[PlotRowValueIndex.Close]),
      isUp: row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
    }));

    request.runtime.pointFigureRenderer.draw(request.context, {
      items,
      barWidth: request.barWidth,
      upColor: options.upColor,
      downColor: options.downColor,
    });
  },
  columns: (request) => {
    const options = request.options as { upColor: string; downColor: string };
    const histogramRangeMin = request.rangeMin ?? 0;
    const items = request.rows.map((row): HistogramItem => ({
      x: request.timeToX(row.index),
      valueY: request.priceToY(row.value[PlotRowValueIndex.Close]),
      baseY: request.priceToY(histogramRangeMin),
      isUp:
        request.visuals.get(row.time)?.isUp ??
        row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
      color: request.visuals.get(row.time)?.color,
    }));

    request.runtime.histogramRenderer.draw(request.context, {
      items,
      barWidth: request.barWidth,
      upColor: options.upColor,
      downColor: options.downColor,
    });
  },
  "hlc-area": () => {},
};

export function drawMainSeriesRenderer(request: MainSeriesRendererRequest): void {
  MAIN_SERIES_RENDERERS[request.renderer](request);
}

function inferKagiLineState(rows: readonly PlotRow<number>[], index: number): boolean {
  const current = rows[index];
  if (current === undefined) {
    return false;
  }

  let highestUpClose = Number.NEGATIVE_INFINITY;
  let lowestDownClose = Number.POSITIVE_INFINITY;
  let isYang = current.value[PlotRowValueIndex.Close] >= current.value[PlotRowValueIndex.Open];

  for (let cursor = 0; cursor <= index; cursor += 1) {
    const row = rows[cursor]!;
    const close = row.value[PlotRowValueIndex.Close];
    const rowIsUp = close >= row.value[PlotRowValueIndex.Open];

    if (rowIsUp) {
      if (close >= lowestDownClose) {
        isYang = true;
      }
      highestUpClose = Math.max(highestUpClose, close);
      continue;
    }

    if (close <= highestUpClose) {
      isYang = false;
    }
    lowestDownClose = Math.min(lowestDownClose, close);
  }

  return isYang;
}

function buildBarItems(request: MainSeriesRendererRequest): BarItem[] {
  return request.rows.map((row): BarItem => ({
    x: request.timeToX(row.index),
    openY: request.priceToY(row.value[PlotRowValueIndex.Open]),
    highY: request.priceToY(row.value[PlotRowValueIndex.High]),
    lowY: request.priceToY(row.value[PlotRowValueIndex.Low]),
    closeY: request.priceToY(row.value[PlotRowValueIndex.Close]),
    isUp: row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
  }));
}

function drawCandlestickFamily(
  request: MainSeriesRendererRequest,
  bodyMode: "filled" | "hollow",
  hideWick: boolean,
  scaleVolumeWidth = false,
): void {
  const options = request.options as { upColor: string; downColor: string; wickColor: string };
  const volumeWidthScale = scaleVolumeWidth
    ? buildVolumeWidthScale(request.rows, request.inputData, request.barWidth)
    : null;
  const items = request.rows.map((row): CandlestickItem => ({
    x: request.timeToX(row.index),
    openY: request.priceToY(row.value[PlotRowValueIndex.Open]),
    highY: request.priceToY(row.value[PlotRowValueIndex.High]),
    lowY: request.priceToY(row.value[PlotRowValueIndex.Low]),
    closeY: request.priceToY(row.value[PlotRowValueIndex.Close]),
    isUp: row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
    bodyWidth: volumeWidthScale?.get(row.time),
  }));

  request.runtime.candlesRenderer.draw(request.context, {
    items,
    barWidth: request.barWidth,
    upColor: options.upColor,
    downColor: options.downColor,
    wickColor: hideWick ? "rgba(0, 0, 0, 0)" : options.wickColor,
    bodyMode,
  });
}

function buildVolumeWidthScale(
  rows: readonly { time: number }[],
  inputData: readonly OhlcDataPoint<number>[],
  barWidth: number,
): Map<number, number> {
  const volumes = inputData
    .map((item) => item.volume ?? null)
    .filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);

  if (volumes.length === 0) {
    return new Map();
  }

  const minVolume = Math.min(...volumes);
  const maxVolume = Math.max(...volumes);
  const minWidth = Math.max(3, Math.floor(barWidth * 0.55));
  const maxWidth = Math.max(minWidth + 1, Math.floor(barWidth * 1.55));
  const inputByTime = new Map(inputData.map((item) => [item.time, item] as const));

  return new Map(rows.map((row) => {
    const volume = inputByTime.get(row.time)?.volume ?? null;
    if (volume === null || !Number.isFinite(volume) || volume <= 0 || maxVolume === minVolume) {
      return [row.time, barWidth] as const;
    }

    const ratio = (volume - minVolume) / (maxVolume - minVolume);
    return [row.time, minWidth + (maxWidth - minWidth) * ratio] as const;
  }));
}
