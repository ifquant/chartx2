import type {
  RobustnessField,
  OptimizationMetricKey,
  ParameterAssignment,
  ParameterSurfaceDataset,
  ParameterSurfacePoint,
  ParameterSurfaceSpec,
  ParameterSweepModel,
  ParameterValue,
  StrategyRunSummary,
} from "../model/types";

type RawRobustnessSample = {
  runId: string;
  neighborhoodMean: number;
  stddev: number;
  slope: number;
  curvature: number;
  oosAgreement: number;
  constraintQuality: number;
  supportPenalty: number;
};

export function optimizationMetricLabel(metric: OptimizationMetricKey): string {
  switch (metric) {
    case "netProfit":
      return "Net profit";
    case "objectiveScore":
      return "Objective score";
    case "grossProfit":
      return "Gross profit";
    case "grossLoss":
      return "Gross loss";
    case "winRate":
      return "Win rate";
    case "avgTrade":
      return "Average trade";
    case "maxDrawdown":
      return "Max drawdown";
    case "profitFactor":
      return "Profit factor";
    case "sharpe":
      return "Sharpe ratio";
    case "sortino":
      return "Sortino ratio";
    case "tradeCount":
      return "Trade count";
    case "stabilityScore":
      return "Stability score";
  }
}

function matchesFilter(
  params: ParameterAssignment,
  filter: ParameterAssignment | undefined,
  xParam: string,
  yParam: string,
): boolean {
  if (filter === undefined) {
    return true;
  }

  for (const [key, value] of Object.entries(filter)) {
    if (key === xParam || key === yParam) {
      continue;
    }
    if (params[key] !== value) {
      return false;
    }
  }

  return true;
}

function compareParameterValue(left: ParameterValue, right: ParameterValue): number {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }
  return String(left).localeCompare(String(right));
}

function metricValue(run: StrategyRunSummary, key: OptimizationMetricKey): number | null {
  const value = run.metrics[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function computeRange(values: number[]): { min: number; max: number } | null {
  if (values.length === 0) {
    return null;
  }
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function normalizeMetric(value: number, range: { min: number; max: number } | null, invert = false): number {
  if (range === null || range.max === range.min) {
    return 0.5;
  }
  const normalized = (value - range.min) / (range.max - range.min);
  const clamped = Math.min(1, Math.max(0, normalized));
  return invert ? 1 - clamped : clamped;
}

function quantile(sortedValues: number[], fraction: number): number | null {
  if (sortedValues.length === 0) {
    return null;
  }
  const clamped = Math.min(1, Math.max(0, fraction));
  const index = (sortedValues.length - 1) * clamped;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sortedValues[lower] ?? null;
  }
  const lowerValue = sortedValues[lower]!;
  const upperValue = sortedValues[upper]!;
  const t = index - lower;
  return lowerValue + (upperValue - lowerValue) * t;
}

export function deriveOptimizationThresholdPlane(
  zMetric: OptimizationMetricKey,
  points: readonly ParameterSurfacePoint[],
): { metric: OptimizationMetricKey; value: number; label: string } | null {
  if (points.length === 0) {
    return null;
  }
  const sorted = points.map((point) => point.zValue).sort((left, right) => left - right);
  let value: number | null = null;

  switch (zMetric) {
    case "objectiveScore":
      value = Math.max(sorted[0]!, Math.min(sorted[sorted.length - 1]!, 0.6));
      break;
    case "netProfit":
      value = quantile(sorted, 0.6);
      break;
    case "sharpe":
      value = Math.max(sorted[0]!, Math.min(sorted[sorted.length - 1]!, 1.1));
      break;
    case "profitFactor":
      value = Math.max(sorted[0]!, Math.min(sorted[sorted.length - 1]!, 1.35));
      break;
    case "maxDrawdown":
      value = quantile(sorted, 0.45);
      break;
    default:
      value = quantile(sorted, 0.55);
      break;
  }

  return value === null
    ? null
    : {
        metric: zMetric,
        value: Number(value.toFixed(3)),
        label: `${optimizationMetricLabel(zMetric)} accepted zone`,
      };
}

export function computeRobustnessField(points: ParameterSurfacePoint[]): RobustnessField {
  const scoreByRunId: Record<string, number> = {};
  if (points.length === 0) {
    return {
      neighborhoodRadius: 1,
      scoreByRunId,
      range: null,
    };
  }

  const pointMap = new Map(points.map((point) => [`${String(point.xValue)}::${String(point.yValue)}`, point] as const));
  const xValues = Array.from(new Set(points.map((point) => point.xValue))).sort(compareParameterValue);
  const yValues = Array.from(new Set(points.map((point) => point.yValue))).sort(compareParameterValue);
  const xIndexByValue = new Map(xValues.map((value, index) => [String(value), index] as const));
  const yIndexByValue = new Map(yValues.map((value, index) => [String(value), index] as const));
  const rawSamples: RawRobustnessSample[] = [];
  const drawdownRange = computeRange(
    points
      .map((point) => point.metrics.maxDrawdown)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      .map((value) => Math.abs(value)),
  );

  const constraintQualityForPoint = (point: ParameterSurfacePoint): number => {
    const tradeCount = typeof point.metrics.tradeCount === "number" ? point.metrics.tradeCount : null;
    const sharpe = typeof point.metrics.sharpe === "number" ? point.metrics.sharpe : null;
    const profitFactor = typeof point.metrics.profitFactor === "number" ? point.metrics.profitFactor : null;
    const maxDrawdown = typeof point.metrics.maxDrawdown === "number" ? Math.abs(point.metrics.maxDrawdown) : null;

    const tradeQuality = tradeCount === null ? 0.5 : Math.min(1, Math.max(0, (tradeCount - 24) / 44));
    const sharpeQuality = sharpe === null ? 0.5 : Math.min(1, Math.max(0, (sharpe - 0.65) / 0.85));
    const profitFactorQuality = profitFactor === null ? 0.5 : Math.min(1, Math.max(0, (profitFactor - 1.0) / 0.6));
    const drawdownQuality =
      maxDrawdown === null
        ? 0.5
        : normalizeMetric(maxDrawdown, drawdownRange, true);

    return Number(
      (
        drawdownQuality * 0.38 +
        tradeQuality * 0.18 +
        sharpeQuality * 0.22 +
        profitFactorQuality * 0.22
      ).toFixed(4),
    );
  };

  for (const point of points) {
    const xIndex = xIndexByValue.get(String(point.xValue));
    const yIndex = yIndexByValue.get(String(point.yValue));
    if (xIndex === undefined || yIndex === undefined) {
      continue;
    }

    const neighborhood: number[] = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const neighborX = xValues[xIndex + dx];
        const neighborY = yValues[yIndex + dy];
        if (neighborX === undefined || neighborY === undefined) {
          continue;
        }
        const neighbor = pointMap.get(`${String(neighborX)}::${String(neighborY)}`);
        if (neighbor !== undefined) {
          neighborhood.push(neighbor.zValue);
        }
      }
    }

    if (neighborhood.length === 0) {
      rawSamples.push({
        runId: point.runId,
        neighborhoodMean: point.zValue,
        stddev: 0,
        slope: 0,
        curvature: 0,
        oosAgreement: typeof point.metrics.oosAgreement === "number" ? point.metrics.oosAgreement : 0.5,
        constraintQuality: constraintQualityForPoint(point),
        supportPenalty: 0.2,
      });
      continue;
    }

    const mean = neighborhood.reduce((sum, value) => sum + value, 0) / neighborhood.length;
    const variance =
      neighborhood.reduce((sum, value) => sum + (value - mean) ** 2, 0) / neighborhood.length;
    const stddev = Math.sqrt(variance);

    const left = xIndex > 0 ? pointMap.get(`${String(xValues[xIndex - 1])}::${String(point.yValue)}`) : undefined;
    const right = xIndex < xValues.length - 1 ? pointMap.get(`${String(xValues[xIndex + 1])}::${String(point.yValue)}`) : undefined;
    const down = yIndex > 0 ? pointMap.get(`${String(point.xValue)}::${String(yValues[yIndex - 1])}`) : undefined;
    const up = yIndex < yValues.length - 1 ? pointMap.get(`${String(point.xValue)}::${String(yValues[yIndex + 1])}`) : undefined;
    const slopeX = left !== undefined && right !== undefined ? Math.abs(right.zValue - left.zValue) / 2 : 0;
    const slopeY = down !== undefined && up !== undefined ? Math.abs(up.zValue - down.zValue) / 2 : 0;
    const slope = Math.sqrt(slopeX * slopeX + slopeY * slopeY);
    const curvature = Math.abs(point.zValue - mean);
    const supportPenalty = neighborhood.length < 5 ? (5 - neighborhood.length) * 0.06 : 0;

    rawSamples.push({
      runId: point.runId,
      neighborhoodMean: mean,
      stddev,
      slope,
      curvature,
      oosAgreement: typeof point.metrics.oosAgreement === "number" ? point.metrics.oosAgreement : 0.5,
      constraintQuality: constraintQualityForPoint(point),
      supportPenalty,
    });
  }

  const meanRange = computeRange(rawSamples.map((sample) => sample.neighborhoodMean));
  const stddevRange = computeRange(rawSamples.map((sample) => sample.stddev));
  const slopeRange = computeRange(rawSamples.map((sample) => sample.slope));
  const curvatureRange = computeRange(rawSamples.map((sample) => sample.curvature));

  rawSamples.forEach((sample) => {
    const meanScore = normalizeMetric(sample.neighborhoodMean, meanRange);
    const stabilityScore = normalizeMetric(sample.stddev, stddevRange, true);
    const flatnessScore = normalizeMetric(sample.slope, slopeRange, true);
    const plateauScore = normalizeMetric(sample.curvature, curvatureRange, true);
    const score =
      meanScore * 0.3 +
      stabilityScore * 0.2 +
      flatnessScore * 0.16 +
      plateauScore * 0.1 +
      sample.oosAgreement * 0.14 +
      sample.constraintQuality * 0.1 -
      sample.supportPenalty;
    scoreByRunId[sample.runId] = Number((Math.min(1, Math.max(0, score)) * 100).toFixed(3));
  });

  return {
    neighborhoodRadius: 1,
    scoreByRunId,
    range: computeRange(Object.values(scoreByRunId)),
  };
}

export class OptimizationDatasetRegistry {
  constructor(private readonly sweep: ParameterSweepModel) {}

  getParameterSurface(spec: ParameterSurfaceSpec): ParameterSurfaceDataset {
    const filteredRuns = this.sweep.runs.filter(
      (run) =>
        run.params[spec.xParam] !== undefined &&
        run.params[spec.yParam] !== undefined &&
        matchesFilter(run.params, spec.filter, spec.xParam, spec.yParam),
    );

    const points: ParameterSurfacePoint[] = filteredRuns.flatMap((run) => {
      const zValue = metricValue(run, spec.zMetric);
      if (zValue === null) {
        return [];
      }

      return [
        {
          runId: run.runId,
          params: { ...run.params },
          metrics: { ...run.metrics },
          xValue: run.params[spec.xParam]!,
          yValue: run.params[spec.yParam]!,
          zValue,
        },
      ];
    });

    const robustnessField = computeRobustnessField(points);
    const enrichedPoints = points.map((point) => {
      const robustnessScore = robustnessField.scoreByRunId[point.runId];
      const colorValue =
        spec.colorMetric === "robustness"
          ? robustnessScore
          : point.zValue;
      return {
        ...point,
        robustnessScore,
        colorValue,
      };
    });

    const xValues = Array.from(new Set(enrichedPoints.map((point) => point.xValue))).sort(compareParameterValue);
    const yValues = Array.from(new Set(enrichedPoints.map((point) => point.yValue))).sort(compareParameterValue);

    return {
      spec,
      points: enrichedPoints,
      xValues,
      yValues,
      zRange: computeRange(enrichedPoints.map((point) => point.zValue)),
      colorRange: computeRange(
        enrichedPoints.flatMap((point) => (typeof point.colorValue === "number" ? [point.colorValue] : [])),
      ),
      robustnessField,
    };
  }
}
