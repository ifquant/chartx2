import type { ChartTime, OhlcDataPoint } from "./series-data";

export function buildMovingAverageStudyData<TTime extends ChartTime>(
  data: readonly OhlcDataPoint<TTime>[],
  length: number,
): readonly OhlcDataPoint<TTime>[] {
  if (data.length === 0) {
    return [];
  }

  const window = Math.max(1, length);
  const output: OhlcDataPoint<TTime>[] = [];
  let rolling = 0;

  for (let index = 0; index < data.length; index += 1) {
    rolling += data[index].close;
    if (index >= window) {
      rolling -= data[index - window].close;
    }
    if (index < window - 1) {
      continue;
    }
    const value = rolling / window;
    output.push({
      time: data[index].time,
      open: value,
      high: value,
      low: value,
      close: value,
    });
  }

  return output;
}
