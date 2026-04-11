import type { PlotRow } from "./plot-data";
import { createPlotRows, type OhlcDataPoint } from "./series-data";
import type { TimePointIndex } from "./time-data";

export type ChartBarSequenceKind = "time-based" | "price-based";
export type ChartBarSequenceTimeDomain = "uniform" | "irregular";

export interface ChartBarSequence<TTime = unknown> {
  readonly kind: ChartBarSequenceKind;
  readonly timeDomain: ChartBarSequenceTimeDomain;
  readonly bars: readonly PlotRow<TTime>[];
  readonly axisBars: readonly PlotRow<TTime>[];
  readonly logicalLength: number;
}

export function createTimeBasedChartBarSequence<TTime>(
  rows: readonly PlotRow<TTime>[],
): ChartBarSequence<TTime> {
  return {
    kind: "time-based",
    timeDomain: "uniform",
    bars: rows,
    axisBars: rows,
    logicalLength: rows.length,
  };
}

export function createProjectedPriceBasedChartBarSequence<TTime extends number>(
  rows: readonly PlotRow<TTime>[],
  inputData: readonly OhlcDataPoint<TTime>[],
): ChartBarSequence<TTime> {
  if (rows.length === 0 || inputData.length === 0) {
    return {
      kind: "price-based",
      timeDomain: "irregular",
      bars: rows,
      axisBars: createPlotRows(inputData),
      logicalLength: inputData.length,
    };
  }

  const buckets = new Map<number, Array<PlotRow<TTime>>>();

  for (const row of rows) {
    const inputIndex = findLastInputIndexAtOrBeforeTime(inputData, row.time);
    const bucket = buckets.get(inputIndex);
    if (bucket === undefined) {
      buckets.set(inputIndex, [row]);
      continue;
    }
    bucket.push(row);
  }

  const projected: PlotRow<TTime>[] = [];
  for (const [inputIndex, bucket] of buckets.entries()) {
    const bucketSize = bucket.length;
    bucket.forEach((row, bucketIndex) => {
      projected.push({
        ...row,
        index: (inputIndex + (bucketIndex + 1) / (bucketSize + 1)) as TimePointIndex,
      });
    });
  }

  return {
    kind: "price-based",
    timeDomain: "irregular",
    bars: projected,
    axisBars: createPlotRows(inputData),
    logicalLength: inputData.length,
  };
}

export function createCompressedPriceBasedChartBarSequence<TTime>(
  rows: readonly PlotRow<TTime>[],
): ChartBarSequence<TTime> {
  return {
    kind: "price-based",
    timeDomain: "irregular",
    bars: rows,
    axisBars: rows,
    logicalLength: rows.length,
  };
}

export function findNearestRowByLogical<TRow extends { index: number }>(
  rows: readonly TRow[],
  logical: number,
): TRow | null {
  if (rows.length === 0) {
    return null;
  }

  let left = 0;
  let right = rows.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const row = rows[middle];
    if (row.index === logical) {
      return row;
    }
    if (row.index < logical) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  const lower = rows[Math.max(0, right)];
  const upper = rows[Math.min(rows.length - 1, left)];
  if (lower === undefined) {
    return upper ?? null;
  }
  if (upper === undefined) {
    return lower;
  }

  return Math.abs(lower.index - logical) <= Math.abs(upper.index - logical) ? lower : upper;
}

function findLastInputIndexAtOrBeforeTime<TTime extends number>(
  inputData: readonly OhlcDataPoint<TTime>[],
  time: TTime,
): number {
  let left = 0;
  let right = inputData.length - 1;
  let answer = 0;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const candidate = inputData[middle]?.time ?? time;
    if (candidate <= time) {
      answer = middle;
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return answer;
}
