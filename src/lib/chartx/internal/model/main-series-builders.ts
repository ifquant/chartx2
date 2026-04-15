import type { OhlcDataPoint } from "./series-data";
import type { PhaseOneMainSeriesBuilder } from "./main-series-chart-types";
import type {
  KagiStyleOptionsState,
  LineBreakStyleOptionsState,
  PointFigureStyleOptionsState,
  RenkoStyleOptionsState,
} from "./main-series-style-options";

export type MainSeriesBuilderDataPoint = OhlcDataPoint<number>;

export type MainSeriesBuilderContext = {
  lineBreakOptions: LineBreakStyleOptionsState;
  renkoOptions: RenkoStyleOptionsState;
  pointFigureOptions: PointFigureStyleOptionsState;
  kagiOptions: KagiStyleOptionsState;
};

export type MainSeriesBuilderExecutor = (
  data: readonly MainSeriesBuilderDataPoint[],
  context: MainSeriesBuilderContext,
) => readonly MainSeriesBuilderDataPoint[];

export const MAIN_SERIES_BUILDERS: Record<PhaseOneMainSeriesBuilder, MainSeriesBuilderExecutor> = {
  "time-bars": (data) => [...data],
  "heikin-ashi": (data) => buildHeikinAshiData(data),
  renko: (data, context) => buildRenkoData(data, context.renkoOptions),
  "line-break": (data, context) => buildLineBreakData(data, context.lineBreakOptions.lineCount),
  kagi: (data, context) => buildKagiData(data, context.kagiOptions),
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

function roundBoxSize(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  if (value >= 100) {
    return Math.round(value);
  }
  if (value >= 10) {
    return Math.round(value * 2) / 2;
  }
  return Math.round(value * 10) / 10;
}

export function inferPointFigureBoxSize(
  data: readonly MainSeriesBuilderDataPoint[],
  reversalBoxes = 3,
): number {
  if (data.length < 2) {
    return 1;
  }

  const sampleSize = Math.min(data.length, 240);
  const sample = data.slice(-sampleSize);

  let minLow = sample[0]?.low ?? sample[0]?.close ?? 0;
  let maxHigh = sample[0]?.high ?? sample[0]?.close ?? 0;
  let totalDelta = 0;
  let totalTrueRange = 0;

  for (let index = 0; index < sample.length; index += 1) {
    const bar = sample[index];
    minLow = Math.min(minLow, bar.low);
    maxHigh = Math.max(maxHigh, bar.high);
    const previousClose = index === 0 ? sample[0]?.open ?? bar.close : sample[index - 1].close;
    totalTrueRange += Math.max(
      bar.high - bar.low,
      Math.abs(bar.high - previousClose),
      Math.abs(bar.low - previousClose),
    );
    if (index > 0) {
      totalDelta += Math.abs(bar.close - sample[index - 1].close);
    }
  }

  const averageDelta = totalDelta / Math.max(sample.length - 1, 1);
  const averageTrueRange = totalTrueRange / sample.length;
  const priceRange = Math.max(maxHigh - minLow, Number.EPSILON);
  const traditionalBoxSize = inferTraditionalPointFigureBoxSize(sample);
  const targetColumns = Math.min(30, Math.max(4, Math.round(Math.sqrt(sample.length) * 1.7)));
  const targetBoxes = targetColumns * Math.min(10, Math.max(6, reversalBoxes + 4));
  const candidateValues = new Set<number>();
  const baseCandidates = [
    traditionalBoxSize,
    priceRange / Math.max(targetColumns * 1.2, 1),
    priceRange / Math.max(targetColumns * 1.8, 1),
    averageTrueRange * 0.45,
    averageTrueRange * 0.7,
    averageDelta * 0.55,
    averageDelta * 0.85,
  ];

  for (const base of baseCandidates) {
    if (!Number.isFinite(base) || base <= 0) {
      continue;
    }
    for (const scale of [0.5, 0.75, 1, 1.25, 1.5, 2]) {
      candidateValues.add(roundBoxSize(Math.max(base * scale, Number.EPSILON)));
    }
  }

  let bestBoxSize = roundBoxSize(Math.max(traditionalBoxSize, Number.EPSILON));
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of [...candidateValues].sort((left, right) => left - right)) {
    const result = buildPointFigureBoxes(sample, candidate, reversalBoxes);
    if (result.columnCount === 0 || result.boxCount === 0) {
      continue;
    }

    const columnPenalty = Math.abs(result.columnCount - targetColumns) * 10;
    const boxPenalty = Math.abs(result.boxCount - targetBoxes) * 0.2;
    const sparsePenalty = result.columnCount < Math.max(8, Math.floor(targetColumns * 0.6))
      ? 120
      : 0;
    const densePenalty = result.columnCount > targetColumns * 2.2 ? 80 : 0;
    const score = columnPenalty + boxPenalty + sparsePenalty + densePenalty;

    if (score < bestScore) {
      bestScore = score;
      bestBoxSize = candidate;
    }
  }

  return roundBoxSize(Math.max(bestBoxSize, Number.EPSILON));
}

export function inferAverageTrueRange(
  data: readonly MainSeriesBuilderDataPoint[],
  length = 14,
): number {
  if (data.length === 0) {
    return 1;
  }

  const period = Math.min(data.length, Math.max(2, Math.floor(length)));
  let atr: number | null = null;

  for (let index = 0; index < data.length; index += 1) {
    const bar = data[index];
    const previousClose = index === 0 ? bar.close : data[index - 1].close;
    const trueRange = Math.max(
      bar.high - bar.low,
      Math.abs(bar.high - previousClose),
      Math.abs(bar.low - previousClose),
    );

    if (atr === null) {
      atr = trueRange;
      continue;
    }

    atr = ((atr * (period - 1)) + trueRange) / period;
  }

  return roundBoxSize(atr ?? 1);
}

export function inferPercentageBoxSize(
  data: readonly MainSeriesBuilderDataPoint[],
  percentageValue = 1,
): number {
  if (data.length === 0) {
    return 1;
  }

  const referenceClose = data[data.length - 1]?.close ?? data[0]?.close ?? 1;
  return roundBoxSize(referenceClose * Math.max(percentageValue, 0.1) / 100);
}

export function inferTraditionalPointFigureBoxSize(
  data: readonly MainSeriesBuilderDataPoint[],
): number {
  if (data.length === 0) {
    return 1;
  }

  const referenceClose = data[data.length - 1]?.close ?? data[0]?.close ?? 1;
  const magnitude = Math.abs(referenceClose);

  if (magnitude < 1) {
    return 0.0625;
  }
  if (magnitude < 5) {
    return 0.125;
  }
  if (magnitude < 20) {
    return 0.25;
  }
  if (magnitude < 100) {
    return 0.5;
  }
  if (magnitude < 200) {
    return 1;
  }
  if (magnitude < 500) {
    return 2;
  }
  if (magnitude < 1_000) {
    return 4;
  }
  if (magnitude < 5_000) {
    return 5;
  }
  if (magnitude < 10_000) {
    return 10;
  }
  if (magnitude < 25_000) {
    return 25;
  }
  if (magnitude < 100_000) {
    return 50;
  }
  return 100;
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
    boxSizeScale: 1,
    reversalBoxes: 3,
    atrLength: 14,
    percentageValue: 1,
  },
): readonly MainSeriesBuilderDataPoint[] {
  if (data.length === 0) {
    return [];
  }

  const inferredBoxSize = inferPointFigureBoxSize(data, options.reversalBoxes);
  const atrBoxSize = inferAverageTrueRange(data, options.atrLength);
  const percentageBoxSize = inferPercentageBoxSize(data, options.percentageValue);
  const traditionalBoxSize = inferTraditionalPointFigureBoxSize(data);
  const boxSizeBase =
    options.boxSizeMode === "fixed" && options.boxSize !== null && options.boxSize > 0
      ? options.boxSize
      : options.boxSizeMode === "atr"
        ? atrBoxSize
        : options.boxSizeMode === "percentage"
          ? percentageBoxSize
          : options.boxSizeMode === "traditional"
            ? traditionalBoxSize
          : inferredBoxSize;
  const boxSize =
    options.boxSizeMode === "fixed"
      ? Math.max(boxSizeBase, Number.EPSILON)
      : Math.max(boxSizeBase * options.boxSizeScale, Number.EPSILON);
  const result = buildPointFigureBoxes(data, boxSize, options.reversalBoxes);

  if (result.boxes.length > 0) {
    return result.boxes;
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

type PointFigureBuildResult = {
  readonly boxes: readonly MainSeriesBuilderDataPoint[];
  readonly columnCount: number;
  readonly boxCount: number;
};

function buildPointFigureBoxes(
  data: readonly MainSeriesBuilderDataPoint[],
  boxSize: number,
  reversalBoxes: number,
): PointFigureBuildResult {
  const reversal = Math.max(1, Math.floor(reversalBoxes));
  const boxes: MainSeriesBuilderDataPoint[] = [];
  let anchor = data[0]?.close ?? 0;
  let columnDirection: 1 | -1 | null = null;
  let columnHigh = anchor;
  let columnLow = anchor;
  let columnCount = 0;

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

    const extendColumn = (direction: 1 | -1, extremePrice: number) => {
      const previousLength = boxes.length;
      if (direction === 1) {
        while (extremePrice >= columnHigh + boxSize) {
          pushBox(1);
        }
      } else {
        while (extremePrice <= columnLow - boxSize) {
          pushBox(-1);
        }
      }
      return boxes.length > previousLength;
    };

    if (columnDirection === null) {
      const upBoxes = Math.floor((input.high - anchor) / boxSize);
      const downBoxes = Math.floor((anchor - input.low) / boxSize);
      if (upBoxes <= 0 && downBoxes <= 0) {
        continue;
      }
      columnDirection =
        upBoxes === downBoxes ? (input.close >= anchor ? 1 : -1) : upBoxes > downBoxes ? 1 : -1;
      const extended = columnDirection === 1 ? extendColumn(1, input.high) : extendColumn(-1, input.low);
      if (extended) {
        columnCount = 1;
      } else {
        columnDirection = null;
      }
      continue;
    }

    if (columnDirection === 1) {
      extendColumn(1, input.high);
      if (input.low <= columnHigh - reversal * boxSize) {
        columnDirection = -1;
        anchor = columnHigh;
        columnLow = columnHigh;
        if (extendColumn(-1, input.low)) {
          columnCount += 1;
        } else {
          columnDirection = 1;
          anchor = columnHigh;
        }
      }
      continue;
    }

    extendColumn(-1, input.low);
    if (input.high >= columnLow + reversal * boxSize) {
      columnDirection = 1;
      anchor = columnLow;
      columnHigh = columnLow;
      if (extendColumn(1, input.high)) {
        columnCount += 1;
      } else {
        columnDirection = -1;
        anchor = columnLow;
      }
    }
  }

  return {
    boxes,
    columnCount,
    boxCount: boxes.length,
  };
}

export function buildKagiData(
  data: readonly MainSeriesBuilderDataPoint[],
  options: KagiStyleOptionsState = {
    reversalMode: "auto",
    reversalSize: null,
    reversalScale: 1,
    atrLength: 14,
    percentageValue: 1,
  },
): readonly MainSeriesBuilderDataPoint[] {
  if (data.length === 0) {
    return [];
  }

  const autoReversal = inferKagiReversalSize(data);
  const atrReversal = inferAverageTrueRange(data, options.atrLength);
  const percentageReversal = inferPercentageBoxSize(data, options.percentageValue);
  const reversalBase =
    options.reversalMode === "fixed" && options.reversalSize !== null && options.reversalSize > 0
      ? options.reversalSize
      : options.reversalMode === "atr"
        ? atrReversal
        : options.reversalMode === "percentage"
          ? percentageReversal
          : autoReversal;
  const reversalSize =
    options.reversalMode === "fixed"
      ? Math.max(reversalBase, Number.EPSILON)
      : Math.max(reversalBase * options.reversalScale, Number.EPSILON);
  const segments = buildKagiSegments(data, reversalSize);

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

export function inferKagiReversalSize(data: readonly MainSeriesBuilderDataPoint[]): number {
  if (data.length < 2) {
    return 1;
  }

  const sampleSize = Math.min(data.length, 240);
  const sample = data.slice(-sampleSize);
  let minLow = sample[0]?.low ?? sample[0]?.close ?? 0;
  let maxHigh = sample[0]?.high ?? sample[0]?.close ?? 0;
  let totalDelta = 0;
  let totalTrueRange = 0;

  for (let index = 0; index < sample.length; index += 1) {
    const bar = sample[index]!;
    minLow = Math.min(minLow, bar.low);
    maxHigh = Math.max(maxHigh, bar.high);
    const previousClose = index === 0 ? bar.open : sample[index - 1]!.close;
    totalTrueRange += Math.max(
      bar.high - bar.low,
      Math.abs(bar.high - previousClose),
      Math.abs(bar.low - previousClose),
    );
    if (index > 0) {
      totalDelta += Math.abs(bar.close - sample[index - 1]!.close);
    }
  }

  const averageDelta = totalDelta / Math.max(sample.length - 1, 1);
  const averageTrueRange = totalTrueRange / sample.length;
  const priceRange = Math.max(maxHigh - minLow, Number.EPSILON);
  const reversalSize = Math.max(
    averageTrueRange * 1.15,
    averageDelta * 1.75,
    priceRange / 18,
  );
  const baseline = roundBoxSize(Math.max(reversalSize, Number.EPSILON));
  if (data.length <= 64) {
    return baseline;
  }

  const targetSegmentCount = Math.max(12, Math.min(26, Math.round(Math.sqrt(data.length) * 1.9)));
  const candidateMultipliers = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8, 10, 12, 14, 16];
  const candidates = Array.from(
    new Set(
      candidateMultipliers
        .map((multiplier) => roundBoxSize(baseline * multiplier))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  ).sort((left, right) => left - right);

  let best = baseline;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const segmentCount = buildKagiSegments(data, candidate).length;
    if (segmentCount === 0) {
      continue;
    }

    const score =
      Math.abs(segmentCount - targetSegmentCount) +
      Math.max(0, 10 - segmentCount) * 4 +
      Math.max(0, segmentCount - 36) * 1.5;
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

function buildKagiSegments(
  data: readonly MainSeriesBuilderDataPoint[],
  reversalSize: number,
): readonly MainSeriesBuilderDataPoint[] {
  const segments: MainSeriesBuilderDataPoint[] = [];
  let anchor = data[0]?.close ?? 0;
  let direction: 1 | -1 | null = null;
  let currentSegmentOpen = anchor;

  const upsertSegment = (
    input: MainSeriesBuilderDataPoint,
    nextClose: number,
    nextDirection: 1 | -1,
    syntheticOrdinal: number,
  ) => {
    if (direction !== nextDirection) {
      currentSegmentOpen = anchor;
    }

    const segment: MainSeriesBuilderDataPoint = {
      time: input.time + syntheticOrdinal * 0.001,
      open: currentSegmentOpen,
      high: Math.max(currentSegmentOpen, nextClose),
      low: Math.min(currentSegmentOpen, nextClose),
      close: nextClose,
      volume: input.volume,
    };

    if (segments.length > 0 && direction === nextDirection) {
      segments[segments.length - 1] = segment;
    } else {
      segments.push(segment);
    }
    anchor = nextClose;
    direction = nextDirection;
  };

  for (let index = 1; index < data.length; index += 1) {
    const input = data[index]!;
    let syntheticOrdinal = 0;

    if (direction === null) {
      const upwardDistance = input.high - anchor;
      const downwardDistance = anchor - input.low;
      if (Math.max(upwardDistance, downwardDistance) < reversalSize) {
        continue;
      }

      if (upwardDistance >= downwardDistance) {
        upsertSegment(input, input.high, 1, syntheticOrdinal);
      } else {
        upsertSegment(input, input.low, -1, syntheticOrdinal);
      }
      continue;
    }

    if (direction === 1) {
      if (input.close >= anchor && input.high > anchor) {
        upsertSegment(input, input.high, 1, syntheticOrdinal);
      }
      if (input.close < anchor && anchor - input.close >= reversalSize) {
        syntheticOrdinal += 1;
        upsertSegment(input, input.low, -1, syntheticOrdinal);
      }
      continue;
    }

    if (input.close <= anchor && input.low < anchor) {
      upsertSegment(input, input.low, -1, syntheticOrdinal);
    }
    if (input.close > anchor && input.close - anchor >= reversalSize) {
      syntheticOrdinal += 1;
      upsertSegment(input, input.high, 1, syntheticOrdinal);
    }
  }

  return segments;
}
