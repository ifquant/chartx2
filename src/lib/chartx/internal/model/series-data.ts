import { assert } from "../helpers";
import { PlotRowValueIndex, type PlotRow } from "./plot-data";
import { PlotList } from "./plot-list";
import { PriceRangeImpl } from "./price-range-impl";
import type { TimePointIndex } from "./time-data";

export type ChartTime = number | string | Date;

export interface OhlcDataPoint<TTime extends ChartTime = ChartTime> {
  readonly time: TTime;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export class SeriesDataStore<TTime extends ChartTime = ChartTime> {
  private readonly plots = new PlotList<PlotRow<TTime>>();
  private sourceData: readonly OhlcDataPoint<TTime>[] = [];

  public setData(data: readonly OhlcDataPoint<TTime>[]): readonly PlotRow<TTime>[] {
    validateOrderedBars(data);
    this.sourceData = [...data];
    const rows = createPlotRows(data);
    this.plots.setData(rows);
    return rows;
  }

  public update(bar: OhlcDataPoint<TTime>): readonly PlotRow<TTime>[] {
    if (this.sourceData.length === 0) {
      return this.setData([bar]);
    }

    const next = [...this.sourceData];
    const last = next[next.length - 1];
    const comparison = compareTimes(last.time, bar.time);

    if (comparison === 0) {
      next[next.length - 1] = bar;
      return this.setData(next);
    }

    assert(comparison < 0, "series update must append a new bar or replace the latest bar");
    next.push(bar);
    return this.setData(next);
  }

  public rows(): readonly PlotRow<TTime>[] {
    return this.plots.rows();
  }

  public source(): readonly OhlcDataPoint<TTime>[] {
    return this.sourceData;
  }

  public priceRange(
    start: TimePointIndex,
    end: TimePointIndex,
  ): PriceRangeImpl | null {
    const minMax = this.plots.minMaxOnRangeCached(start, end, [
      PlotRowValueIndex.Low,
      PlotRowValueIndex.High,
    ]);

    return minMax === null ? null : new PriceRangeImpl(minMax.min, minMax.max);
  }
}

export function createPlotRows<TTime extends ChartTime>(
  data: readonly OhlcDataPoint<TTime>[],
): readonly PlotRow<TTime>[] {
  return data.map((item, index) => ({
    index: index as TimePointIndex,
    time: item.time,
    originalTime: item.time,
    value: [item.open, item.high, item.low, item.close],
  }));
}

export function validateOrderedBars<TTime extends ChartTime>(
  data: readonly OhlcDataPoint<TTime>[],
): void {
  for (let index = 1; index < data.length; index += 1) {
    const previous = data[index - 1];
    const current = data[index];
    assert(
      compareTimes(previous.time, current.time) < 0,
      "series data must be strictly ordered by time",
    );
  }
}

function compareTimes(left: ChartTime, right: ChartTime): number {
  const leftKey = normalizeTime(left);
  const rightKey = normalizeTime(right);

  if (leftKey < rightKey) {
    return -1;
  }

  if (leftKey > rightKey) {
    return 1;
  }

  return 0;
}

function normalizeTime(value: ChartTime): number | string {
  return value instanceof Date ? value.getTime() : value;
}
