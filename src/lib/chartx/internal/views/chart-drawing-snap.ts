import { findNearestRowByLogical, PlotRowValueIndex, type ChartBarSequence, type Logical, type PriceScale, type TimePointIndex, type TimeScale } from "../model";

type DrawingMagnetSources = {
  open: boolean;
  high: boolean;
  low: boolean;
  close: boolean;
};

type DrawingMagnetOptions = {
  magnetEnabled: boolean;
  magnetTolerancePx: number;
  timeMagnetEnabled: boolean;
  timeMagnetPolicy: "nearest" | "previous" | "next";
  timeMagnetTolerancePx: number;
  magnetSources: DrawingMagnetSources;
};

type DrawingMagnetOverrides = {
  magnetEnabled?: boolean;
  magnetTolerancePx?: number;
  timeMagnetEnabled?: boolean;
  timeMagnetPolicy?: "nearest" | "previous" | "next";
  timeMagnetTolerancePx?: number;
  magnetSources?: Partial<DrawingMagnetSources>;
};

type AxisBar = {
  time: number;
  index: TimePointIndex;
};

export function resolveDrawingMagnetOptions(
  drawing: DrawingMagnetOverrides,
  chartOptions: DrawingMagnetOptions,
): DrawingMagnetOptions {
  return {
    ...chartOptions,
    magnetEnabled: drawing.magnetEnabled ?? chartOptions.magnetEnabled,
    magnetTolerancePx: drawing.magnetTolerancePx ?? chartOptions.magnetTolerancePx,
    timeMagnetEnabled: drawing.timeMagnetEnabled ?? chartOptions.timeMagnetEnabled,
    timeMagnetPolicy: drawing.timeMagnetPolicy ?? chartOptions.timeMagnetPolicy,
    timeMagnetTolerancePx: drawing.timeMagnetTolerancePx ?? chartOptions.timeMagnetTolerancePx,
    magnetSources: {
      ...chartOptions.magnetSources,
      ...(drawing.magnetSources ?? {}),
    },
  };
}

export function resolveSnappedDrawingTime(
  x: number,
  axisBars: readonly AxisBar[],
  timeScale: TimeScale,
  magnetEnabled: boolean,
  magnetPolicy: "nearest" | "previous" | "next",
  magnetTolerancePx: number,
): { time: number; snapped: boolean } {
  if (axisBars.length === 0) {
    return { time: 0, snapped: false };
  }

  const logicalCoordinate = timeScale.coordinateToLogical(x);
  if (!magnetEnabled) {
    return {
      time: logicalCoordinateToInterpolatedTime(logicalCoordinate, axisBars),
      snapped: false,
    };
  }

  const targetBar = resolveTimeMagnetTargetBar(axisBars, logicalCoordinate, magnetPolicy);
  const snappedCoordinate = timeScale.indexToCoordinate(targetBar.index);
  const snapped = Math.abs(snappedCoordinate - x) <= magnetTolerancePx;
  return {
    time: snapped ? targetBar.time : logicalCoordinateToInterpolatedTime(logicalCoordinate, axisBars),
    snapped,
  };
}

export function resolveSnappedDrawingPrice(
  localX: number,
  localY: number,
  barSequence: ChartBarSequence<number>,
  priceScale: PriceScale,
  timeScale: TimeScale,
  magnetEnabled: boolean,
  magnetTolerancePx: number,
  magnetSources: DrawingMagnetSources,
): { price: number; snapped: boolean; source: "open" | "high" | "low" | "close" } | null {
  const rawPrice = priceScale.coordinateToPrice(localY);
  if (rawPrice === null) {
    return null;
  }
  if (!magnetEnabled) {
    return { price: rawPrice, snapped: false, source: "close" };
  }

  const nearestRow = findNearestRowByLogical(
    barSequence.bars,
    Math.round(timeScale.coordinateToLogical(localX)),
  );
  if (nearestRow === null) {
    return { price: rawPrice, snapped: false, source: "close" };
  }

  const candidates: Array<{ price: number; source: "open" | "high" | "low" | "close" }> = [];
  if (magnetSources.open) {
    candidates.push({ price: nearestRow.value[PlotRowValueIndex.Open], source: "open" });
  }
  if (magnetSources.high) {
    candidates.push({ price: nearestRow.value[PlotRowValueIndex.High], source: "high" });
  }
  if (magnetSources.low) {
    candidates.push({ price: nearestRow.value[PlotRowValueIndex.Low], source: "low" });
  }
  if (magnetSources.close) {
    candidates.push({ price: nearestRow.value[PlotRowValueIndex.Close], source: "close" });
  }
  if (candidates.length === 0) {
    return { price: rawPrice, snapped: false, source: "close" };
  }

  let bestPrice = rawPrice;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestSource: "open" | "high" | "low" | "close" = candidates[0]!.source;
  for (const candidate of candidates) {
    const candidateY = priceScale.priceToCoordinate(candidate.price);
    if (candidateY === null) {
      continue;
    }
    const distance = Math.abs(candidateY - localY);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestPrice = candidate.price;
      bestSource = candidate.source;
    }
  }

  if (bestDistance <= magnetTolerancePx) {
    return { price: bestPrice, snapped: true, source: bestSource };
  }
  return { price: rawPrice, snapped: false, source: bestSource };
}

function resolveTimeMagnetTargetBar(
  axisBars: readonly AxisBar[],
  logicalCoordinate: Logical,
  magnetPolicy: "nearest" | "previous" | "next",
): AxisBar {
  if (magnetPolicy === "previous") {
    for (let index = axisBars.length - 1; index >= 0; index -= 1) {
      const bar = axisBars[index]!;
      if (bar.index <= logicalCoordinate) {
        return bar;
      }
    }
    return axisBars[0]!;
  }

  if (magnetPolicy === "next") {
    for (const bar of axisBars) {
      if (bar.index >= logicalCoordinate) {
        return bar;
      }
    }
    return axisBars[axisBars.length - 1]!;
  }

  const logical = Math.round(logicalCoordinate);
  let nearest = axisBars[0]!;
  let nearestDistance = Math.abs(nearest.index - logical);
  for (const bar of axisBars) {
    const distance = Math.abs(bar.index - logical);
    if (distance < nearestDistance) {
      nearest = bar;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function logicalCoordinateToInterpolatedTime(
  logical: Logical,
  axisBars: readonly AxisBar[],
): number {
  if (axisBars.length === 0) {
    return 0;
  }
  if (logical <= axisBars[0]!.index) {
    return axisBars[0]!.time;
  }
  if (logical >= axisBars[axisBars.length - 1]!.index) {
    return axisBars[axisBars.length - 1]!.time;
  }

  for (let index = 1; index < axisBars.length; index += 1) {
    const previous = axisBars[index - 1]!;
    const next = axisBars[index]!;
    if (logical <= next.index) {
      if (next.index === previous.index) {
        return previous.time;
      }
      const ratio = (logical - previous.index) / (next.index - previous.index);
      return previous.time + (next.time - previous.time) * ratio;
    }
  }

  return axisBars[axisBars.length - 1]!.time;
}
