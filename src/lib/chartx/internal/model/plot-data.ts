import type { TimePointIndex } from "./time-data";

export const enum PlotRowValueIndex {
  Open = 0,
  High = 1,
  Low = 2,
  Close = 3,
}

export type PlotRowValue = [number, number, number, number];

export interface PlotRow<TTime = unknown> {
  readonly index: TimePointIndex;
  readonly time: TTime;
  readonly originalTime: unknown;
  readonly value: PlotRowValue;
}
