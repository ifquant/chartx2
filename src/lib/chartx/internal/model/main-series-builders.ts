import type { OhlcDataPoint } from "./series-data";
import type { PhaseOneMainSeriesBuilder } from "./main-series-chart-types";
import type { PointFigureStyleOptionsState, RenkoStyleOptionsState } from "./main-series-style-options";

export type MainSeriesBuilderDataPoint = OhlcDataPoint<number>;

export type MainSeriesBuilderContext = {
  renkoOptions: RenkoStyleOptionsState;
  pointFigureOptions: PointFigureStyleOptionsState;
};

export type MainSeriesBuilderExecutor = (
  data: readonly MainSeriesBuilderDataPoint[],
  context: MainSeriesBuilderContext,
) => readonly MainSeriesBuilderDataPoint[];

export const MAIN_SERIES_BUILDERS: Record<PhaseOneMainSeriesBuilder, MainSeriesBuilderExecutor> = {
  "time-bars": (data) => [...data],
  "heikin-ashi": (data) => buildHeikinAshiData(data),
  renko: (data, context) => buildRenkoData(data, context.renkoOptions),
  "line-break": (data) => buildLineBreakData(data),
  kagi: (data) => buildKagiData(data),
  "point-figure": (data, context) => buildPointFigureData(data, context.pointFigureOptions),
  range: (data) => [...data],
};

export function applyMainSeriesBuilder(
  builder: PhaseOneMainSeriesBuilder,
  data: readonly MainSeriesBuilderDataPoint[],
  context: MainSeriesBuilderContext,
): readonly MainSeriesBuilderDataPoint[] {
  return MAIN_SERIES_BUILDERS[builder](data, context);
}

export function buildHeikinAshiData(
  data: readonly MainSeriesBuilderDataPoint[],
): readonly MainSeriesBuilderDataPoint[] {
  let previousOpen: number | null = null;
  let previousClose: number | null = null;

  return data.map((bar) => {
    const close = (bar.open + bar.high + bar.low + bar.close) / 4;
    const open =
      previousOpen === null || previousClose === null
        ? (bar.open + bar.close) / 2
        : (previousOpen + previousClose) / 2;
    const high = Math.max(bar.high, open, close);
    const low = Math.min(bar.low, open, close);

    previousOpen = open;
    previousClose = close;

    return {
      time: bar.time,
      open,
      high,
      low,
      close,
    };
  });
}

function inferRenkoBoxSize(data: readonly MainSeriesBuilderDataPoint[]): number {
  if (data.length < 2) {
    return 1;
  }

  let totalDelta = 0;
  for (let index = 1; index < data.length; index += 1) {
    totalDelta += Math.abs(data[index].close - data[index - 1].close);
  }

  return Math.max(totalDelta / (data.length - 1), Number.EPSILON);
}

export function inferPointFigureBoxSize(
  data: readonly MainSeriesBuilderDataPoint[],
  reversalBoxes = 3,
): number {
  if (data.length < 2) {
    return 1;
  }

  let minLow = data[0]?.low ?? data[0]?.close ?? 0;
  let maxHigh = data[0]?.high ?? data[0]?.close ?? 0;
  let totalDelta = 0;
  let totalRange = 0;

  for (let index = 0; index < data.length; index += 1) {
    const bar = data[index];
    minLow = Math.min(minLow, bar.low);
    maxHigh = Math.max(maxHigh, bar.high);
    totalRange += Math.max(bar.high - bar.low, Math.abs(bar.close - bar.open));
    if (index > 0) {
      totalDelta += Math.abs(bar.close - data[index - 1].close);
    }
  }

  const averageDelta = totalDelta / (data.length - 1);
  const averageRange = totalRange / data.length;
  const priceRange = Math.max(maxHigh - minLow, Number.EPSILON);
  const targetColumns = Math.min(30, Math.max(16, Math.round(Math.sqrt(data.length) * 2.4)));
  const targetBoxesPerColumn = Math.min(9, Math.max(5, reversalBoxes + 3));
  const rangeDrivenBox = priceRange / Math.max(targetColumns + targetBoxesPerColumn, 1);
  const deltaDrivenBox = averageDelta * 0.85;
  const rangeVolatilityBox = averageRange * 0.6;
  const inferred = Math.max(
    Math.min(rangeDrivenBox, rangeVolatilityBox),
    deltaDrivenBox,
    Number.EPSILON,
  );

  return Math.max(1, Math.round(inferred));
}

export function buildRenkoData(
  data: readonly MainSeriesBuilderDataPoint[],
  options: RenkoStyleOptionsState = { boxSize: null, boxSizeMode: "auto" },
): readonly MainSeriesBuilderDataPoint[] {
  if (data.length === 0) {
    return [];
  }

  const inferredBoxSize = inferRenkoBoxSize(data);
  const boxSize =
    options.boxSizeMode === "fixed" && options.boxSize !== null && options.boxSize > 0
      ? options.boxSize
      : inferredBoxSize;
  const bricks: MainSeriesBuilderDataPoint[] = [];
  let anchor = data[0].close;

  for (let index = 1; index < data.length; index += 1) {
    const bar = data[index];
    let syntheticOrdinal = 0;

    while (Math.abs(bar.close - anchor) >= boxSize) {
      const direction = bar.close > anchor ? 1 : -1;
      const nextClose = anchor + direction * boxSize;
      const syntheticTime = bar.time + syntheticOrdinal * 0.001;
      const high = Math.max(anchor, nextClose);
      const low = Math.min(anchor, nextClose);

      bricks.push({
        time: syntheticTime,
        open: anchor,
        high,
        low,
        close: nextClose,
      });

      anchor = nextClose;
      syntheticOrdinal += 1;
    }
  }

  if (bricks.length > 0) {
    return bricks;
  }

  return [
    {
      time: data[0].time,
      open: data[0].close,
      high: data[0].close,
      low: data[0].close,
      close: data[0].close,
    },
  ];
}

export function buildLineBreakData(
  data: readonly MainSeriesBuilderDataPoint[],
  lineCount = 3,
): readonly MainSeriesBuilderDataPoint[] {
  if (data.length === 0) {
    return [];
  }

  const confirmed: MainSeriesBuilderDataPoint[] = [{ ...data[0] }];
  const threshold = Math.max(1, Math.floor(lineCount));

  for (let index = 1; index < data.length; index += 1) {
    const input = data[index];
    const last = confirmed[confirmed.length - 1];
    const recent = confirmed.slice(-threshold);
    const recentMaxClose = Math.max(...recent.map((bar) => bar.close));
    const recentMinClose = Math.min(...recent.map((bar) => bar.close));
    const lastIsUp = last.close >= last.open;
    const lastIsDown = last.close <= last.open;

    if (input.close > last.close && (lastIsUp || input.close > recentMaxClose)) {
      confirmed.push({
        time: input.time,
        open: last.close,
        high: Math.max(last.close, input.close),
        low: Math.min(last.close, input.close),
        close: input.close,
        volume: input.volume,
      });
      continue;
    }

    if (input.close < last.close && (lastIsDown || input.close < recentMinClose)) {
      confirmed.push({
        time: input.time,
        open: last.close,
        high: Math.max(last.close, input.close),
        low: Math.min(last.close, input.close),
        close: input.close,
        volume: input.volume,
      });
    }
  }

  return confirmed;
}

export function buildPointFigureData(
  data: readonly MainSeriesBuilderDataPoint[],
  options: PointFigureStyleOptionsState = {
    boxSize: null,
    boxSizeMode: "auto",
    reversalBoxes: 3,
  },
): readonly MainSeriesBuilderDataPoint[] {
  if (data.length === 0) {
    return [];
  }

  const inferredBoxSize = inferPointFigureBoxSize(data, options.reversalBoxes);
  const boxSize =
    options.boxSizeMode === "fixed" && options.boxSize !== null && options.boxSize > 0
      ? options.boxSize
      : inferredBoxSize;
  const reversal = Math.max(1, Math.floor(options.reversalBoxes));
  const boxes: MainSeriesBuilderDataPoint[] = [];
  let anchor = data[0].close;
  let columnDirection: 1 | -1 | null = null;
  let columnHigh = anchor;
  let columnLow = anchor;

  for (let index = 1; index < data.length; index += 1) {
    const input = data[index];
    let syntheticOrdinal = 0;

    const pushBox = (direction: 1 | -1) => {
      const nextClose = anchor + direction * boxSize;
      boxes.push({
        time: input.time + syntheticOrdinal * 0.001,
        open: anchor,
        high: Math.max(anchor, nextClose),
        low: Math.min(anchor, nextClose),
        close: nextClose,
        volume: input.volume,
      });
      anchor = nextClose;
      columnHigh = Math.max(columnHigh, nextClose);
      columnLow = Math.min(columnLow, nextClose);
      syntheticOrdinal += 1;
    };

    if (columnDirection === null) {
      while (Math.abs(input.close - anchor) >= boxSize) {
        columnDirection = input.close > anchor ? 1 : -1;
        pushBox(columnDirection);
      }
      continue;
    }

    if (columnDirection === 1) {
      while (input.close >= columnHigh + boxSize) {
        pushBox(1);
      }
      if (input.close <= columnHigh - reversal * boxSize) {
        columnDirection = -1;
        anchor = columnHigh;
        columnLow = columnHigh;
        while (input.close <= anchor - boxSize) {
          pushBox(-1);
        }
      }
      continue;
    }

    while (input.close <= columnLow - boxSize) {
      pushBox(-1);
    }
    if (input.close >= columnLow + reversal * boxSize) {
      columnDirection = 1;
      anchor = columnLow;
      columnHigh = columnLow;
      while (input.close >= anchor + boxSize) {
        pushBox(1);
      }
    }
  }

  if (boxes.length > 0) {
    return boxes;
  }

  return [
    {
      time: data[0].time,
      open: data[0].close,
      high: data[0].close,
      low: data[0].close,
      close: data[0].close,
      volume: data[0].volume,
    },
  ];
}

export function buildKagiData(
  data: readonly MainSeriesBuilderDataPoint[],
  reversalFactor = 1,
): readonly MainSeriesBuilderDataPoint[] {
  if (data.length === 0) {
    return [];
  }

  const reversalSize = inferRenkoBoxSize(data) * Math.max(1, Math.floor(reversalFactor));
  const segments: MainSeriesBuilderDataPoint[] = [];
  let anchor = data[0].close;
  let direction: 1 | -1 | null = null;

  for (let index = 1; index < data.length; index += 1) {
    const input = data[index];
    const close = input.close;

    if (direction === null) {
      if (Math.abs(close - anchor) < reversalSize) {
        continue;
      }

      direction = close > anchor ? 1 : -1;
      segments.push({
        time: input.time,
        open: anchor,
        high: Math.max(anchor, close),
        low: Math.min(anchor, close),
        close,
        volume: input.volume,
      });
      anchor = close;
      continue;
    }

    if (direction === 1) {
      if (close >= anchor) {
        const current = segments[segments.length - 1];
        segments[segments.length - 1] = {
          ...current,
          time: input.time,
          high: Math.max(current.open, close),
          low: Math.min(current.open, close),
          close,
          volume: input.volume,
        };
        anchor = close;
        continue;
      }

      if (anchor - close >= reversalSize) {
        direction = -1;
        segments.push({
          time: input.time,
          open: anchor,
          high: anchor,
          low: close,
          close,
          volume: input.volume,
        });
        anchor = close;
      }
      continue;
    }

    if (close <= anchor) {
      const current = segments[segments.length - 1];
      segments[segments.length - 1] = {
        ...current,
        time: input.time,
        high: Math.max(current.open, close),
        low: Math.min(current.open, close),
        close,
        volume: input.volume,
      };
      anchor = close;
      continue;
    }

    if (close - anchor >= reversalSize) {
      direction = 1;
      segments.push({
        time: input.time,
        open: anchor,
        high: close,
        low: anchor,
        close,
        volume: input.volume,
      });
      anchor = close;
    }
  }

  if (segments.length > 0) {
    return segments;
  }

  return [
    {
      time: data[0].time,
      open: data[0].close,
      high: data[0].close,
      low: data[0].close,
      close: data[0].close,
      volume: data[0].volume,
    },
  ];
}
