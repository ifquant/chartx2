import {
  applyMainSeriesBuilder,
  PlotRowValueIndex,
  SeriesDataStore,
  type OhlcDataPoint,
} from "../model";

type LineDataPoint = {
  time: number;
  value: number;
};

type HistogramLikeDataPoint = {
  time: number;
  value: number;
  color?: string;
  up?: boolean;
};

type MainSeriesBuilderSource = Parameters<typeof applyMainSeriesBuilder>[2] & {
  builder: Parameters<typeof applyMainSeriesBuilder>[0];
};

export type HistogramVisual = {
  color?: string;
  isUp: boolean;
};

export function normalizeLineData(data: readonly LineDataPoint[]): readonly OhlcDataPoint<number>[] {
  return data.map(normalizeLineBar);
}

export function normalizeLineBar(bar: LineDataPoint): OhlcDataPoint<number> {
  return {
    time: bar.time,
    open: bar.value,
    high: bar.value,
    low: bar.value,
    close: bar.value,
  };
}

export function normalizeHistogramData(
  data: readonly HistogramLikeDataPoint[],
): readonly OhlcDataPoint<number>[] {
  return data.map(normalizeHistogramBar);
}

export function normalizeHistogramBar(
  bar: HistogramLikeDataPoint,
): OhlcDataPoint<number> {
  return {
    time: bar.time,
    open: 0,
    high: Math.max(0, bar.value),
    low: Math.min(0, bar.value),
    close: bar.value,
  };
}

export function updateCanonicalData(
  data: readonly OhlcDataPoint<number>[],
  bar: OhlcDataPoint<number>,
): readonly OhlcDataPoint<number>[] {
  const store = new SeriesDataStore<number>();
  store.setData(data);
  return store.update(bar).map((row) => ({
    time: row.time,
    open: row.value[PlotRowValueIndex.Open],
    high: row.value[PlotRowValueIndex.High],
    low: row.value[PlotRowValueIndex.Low],
    close: row.value[PlotRowValueIndex.Close],
  }));
}

export function applyMainSeriesBuilderData(
  data: readonly OhlcDataPoint<number>[],
  source: MainSeriesBuilderSource,
): readonly OhlcDataPoint<number>[] {
  return applyMainSeriesBuilder(source.builder, data, {
    lineBreakOptions: source.lineBreakOptions,
    renkoOptions: source.renkoOptions,
    pointFigureOptions: source.pointFigureOptions,
    kagiOptions: source.kagiOptions,
  });
}

export function buildHistogramVisuals(
  data: readonly HistogramLikeDataPoint[],
): Map<number, HistogramVisual> {
  const visuals = new Map<number, HistogramVisual>();

  for (let index = 0; index < data.length; index += 1) {
    const item = data[index];
    const previous = index === 0 ? null : data[index - 1];
    visuals.set(item.time, {
      color: item.color,
      isUp: item.up ?? (previous === null ? true : item.value >= previous.value),
    });
  }

  return visuals;
}
