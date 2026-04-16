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

function computeRobustnessField(points: ParameterSurfacePoint[]): RobustnessField {
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
      scoreByRunId[point.runId] = 0;
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
    const slope = slopeX + slopeY;

    scoreByRunId[point.runId] = Number((mean - stddev * 0.85 - slope * 0.55).toFixed(3));
  }

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
