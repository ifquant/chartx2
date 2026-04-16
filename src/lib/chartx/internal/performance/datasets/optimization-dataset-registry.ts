import type {
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

      const colorValue =
        spec.colorMetric === undefined ? undefined : metricValue(run, spec.colorMetric) ?? undefined;

      return [
        {
          runId: run.runId,
          params: { ...run.params },
          metrics: { ...run.metrics },
          xValue: run.params[spec.xParam]!,
          yValue: run.params[spec.yParam]!,
          zValue,
          colorValue,
        },
      ];
    });

    const xValues = Array.from(new Set(points.map((point) => point.xValue))).sort(compareParameterValue);
    const yValues = Array.from(new Set(points.map((point) => point.yValue))).sort(compareParameterValue);

    return {
      spec,
      points,
      xValues,
      yValues,
      zRange: computeRange(points.map((point) => point.zValue)),
      colorRange: computeRange(
        points.flatMap((point) => (typeof point.colorValue === "number" ? [point.colorValue] : [])),
      ),
    };
  }
}
