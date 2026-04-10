import type { PlotRow } from "./plot-data";
import type { OhlcDataPoint } from "./series-data";

export type StudyMergePolicy = "carry-forward" | "gaps" | "exact";

export function mergeStudyDataToChartContext<TTime extends number>(
  inputData: readonly OhlcDataPoint<TTime>[],
  axisBars: readonly PlotRow<TTime>[],
  mergePolicy: StudyMergePolicy,
): readonly OhlcDataPoint<TTime>[] {
  switch (mergePolicy) {
    case "carry-forward":
      return carryForwardStudyData(inputData, axisBars);
    case "gaps":
    case "exact":
      return exactStudyData(inputData, axisBars);
  }
}

function carryForwardStudyData<TTime extends number>(
  inputData: readonly OhlcDataPoint<TTime>[],
  axisBars: readonly PlotRow<TTime>[],
): readonly OhlcDataPoint<TTime>[] {
  if (inputData.length === 0 || axisBars.length === 0) {
    return [];
  }

  const merged: OhlcDataPoint<TTime>[] = [];
  let cursor = 0;
  let active: OhlcDataPoint<TTime> | null = null;

  for (const axisBar of axisBars) {
    while (cursor < inputData.length && inputData[cursor].time <= axisBar.time) {
      active = inputData[cursor];
      cursor += 1;
    }

    if (active !== null) {
      merged.push({
        time: axisBar.time,
        open: active.open,
        high: active.high,
        low: active.low,
        close: active.close,
      });
    }
  }

  return merged;
}

function exactStudyData<TTime extends number>(
  inputData: readonly OhlcDataPoint<TTime>[],
  axisBars: readonly PlotRow<TTime>[],
): readonly OhlcDataPoint<TTime>[] {
  if (inputData.length === 0 || axisBars.length === 0) {
    return [];
  }

  const inputByTime = new Map(inputData.map((bar) => [bar.time, bar] as const));
  const merged: OhlcDataPoint<TTime>[] = [];

  for (const axisBar of axisBars) {
    const match = inputByTime.get(axisBar.time);
    if (match !== undefined) {
      merged.push({
        time: axisBar.time,
        open: match.open,
        high: match.high,
        low: match.low,
        close: match.close,
      });
    }
  }

  return merged;
}
