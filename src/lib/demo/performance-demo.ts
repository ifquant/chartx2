import {
  createPerformanceReportModel,
  createRunLocationIntent,
  createSampleParameterSweep,
  createSampleStrategyRunFromSummary,
  OptimizationDatasetRegistry,
  type OptimizationMetricKey,
  type OptimizationSurfaceView,
  type ParameterAssignment,
  type ParameterValue,
  type ParameterSweepModel,
  type PerformanceReportView,
  type RunLocationIntent,
  type StrategyRunSummary,
  type TradeLocationIntent,
} from "$lib/chartx/public/performance";
import { OptimizationCanvasHarness, PerformanceCanvasHarness } from "$lib/chartx/internal/performance";

export type PerformanceDemoSnapshot = {
  title: string;
  summary: string;
  metrics: readonly { label: string; value: string }[];
  eventLog: readonly string[];
  selectedTradeId: string | null;
  selectedTradeIntent: TradeLocationIntent | null;
  optimization: {
    title: string;
    summary: string;
    selectedRunId: string | null;
    selectedRunIntent: RunLocationIntent | null;
    renderMode: "heatmap" | "scatter-3d" | "surface-3d";
    xParam: string;
    yParam: string;
    zMetric: OptimizationMetricKey;
    filterKey: string | null;
    filterValue: string | null;
    filterOptions: readonly string[];
    runLabel: string;
  };
};

export type PerformanceDemoController = {
  snapshot(): PerformanceDemoSnapshot;
  setOptimizationRenderMode(value: "heatmap" | "scatter-3d" | "surface-3d"): void;
  setOptimizationXAxis(value: string): void;
  setOptimizationYAxis(value: string): void;
  setOptimizationZMetric(value: OptimizationMetricKey): void;
  setOptimizationFilterValue(value: string): void;
  destroy(): void;
};

type SnapshotPublisher = (snapshot: PerformanceDemoSnapshot) => void;
type TradeLocationPublisher = (intent: TradeLocationIntent) => void;

const OPTIMIZATION_METRICS: OptimizationMetricKey[] = [
  "netProfit",
  "sharpe",
  "maxDrawdown",
  "profitFactor",
  "stabilityScore",
];

function formatCurrency(value: number | string): string {
  if (typeof value === "string") {
    return value;
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatMetricValue(label: string, value: number | string): string {
  if (typeof value === "string") {
    return value;
  }
  if (label.toLowerCase().includes("rate")) {
    return `${value.toFixed(1)}%`;
  }
  if (label.toLowerCase().includes("trades")) {
    return String(Math.round(value));
  }
  return formatCurrency(value);
}

function formatParamValue(value: ParameterValue): string {
  return typeof value === "number" ? String(value) : String(value);
}

function summarizeRun(run: StrategyRunSummary | null): string {
  if (run === null) {
    return "--";
  }
  return Object.entries(run.params)
    .map(([key, value]) => `${key}=${value}`)
    .join(" / ");
}

function buildOptimizationView(
  sweep: ParameterSweepModel,
  renderMode: "heatmap" | "scatter-3d" | "surface-3d",
  camera: { yaw: number; pitch: number },
  xParam: string,
  yParam: string,
  zMetric: OptimizationMetricKey,
  filterKey: string | null,
  filterValue: string | null,
  selectedRunId: string | null,
): OptimizationSurfaceView {
  const registry = new OptimizationDatasetRegistry(sweep);
  const filter: ParameterAssignment | undefined =
    filterKey !== null && filterValue !== null
      ? {
          [filterKey]: Number.isNaN(Number(filterValue)) ? filterValue : Number(filterValue),
        }
      : undefined;
  const dataset = registry.getParameterSurface({
    sweepId: sweep.id,
    xParam,
    yParam,
    zMetric,
    filter,
  });
  const selectedRun = selectedRunId === null ? null : sweep.runs.find((run) => run.runId === selectedRunId) ?? null;
  const filterSummary = filterKey === null || filterValue === null ? "all rows" : `${filterKey}=${filterValue}`;
  return {
    id: "optimization-surface",
    title: "Parameter Surface",
    summary: `${xParam} × ${yParam} on ${zMetric}; ${filterSummary}.`,
    dataset,
    selectedRunId,
    selectedRunIntent: selectedRun === null ? null : createRunLocationIntent(selectedRun, "optimization-surface-demo"),
    renderMode,
    camera,
  };
}

function snapshotFromViews(
  reportView: PerformanceReportView,
  optimizationView: OptimizationSurfaceView,
  eventLog: readonly string[],
  filterKey: string | null,
  filterValue: string | null,
  filterOptions: readonly string[],
  selectedRun: StrategyRunSummary | null,
): PerformanceDemoSnapshot {
  return {
    title: reportView.title,
    summary: reportView.summary,
    metrics: reportView.metrics.map((metric) => ({
      label: metric.label,
      value: formatMetricValue(metric.label, metric.value),
    })),
    eventLog,
    selectedTradeId: reportView.selectedTrade?.id ?? null,
    selectedTradeIntent: reportView.selectedTradeIntent,
    optimization: {
      title: optimizationView.title,
      summary: optimizationView.summary,
      selectedRunId: optimizationView.selectedRunId,
      selectedRunIntent: optimizationView.selectedRunIntent,
      renderMode: optimizationView.renderMode,
      xParam: optimizationView.dataset.spec.xParam,
      yParam: optimizationView.dataset.spec.yParam,
      zMetric: optimizationView.dataset.spec.zMetric,
      filterKey,
      filterValue,
      filterOptions,
      runLabel: summarizeRun(selectedRun),
    },
  };
}

function availableFilterValues(sweep: ParameterSweepModel, filterKey: string | null): string[] {
  if (filterKey === null) {
    return [];
  }
  return Array.from(new Set(sweep.runs.map((run) => formatParamValue(run.params[filterKey]!))));
}

export function mountPerformanceReportDemo(
  optimizationCanvas: HTMLCanvasElement,
  reportCanvas: HTMLCanvasElement,
  publish: SnapshotPublisher,
  publishTradeIntent?: TradeLocationPublisher,
): PerformanceDemoController {
  const sweep = createSampleParameterSweep();
  let xParam = "fastLength";
  let yParam = "slowLength";
  let zMetric: OptimizationMetricKey = "netProfit";
  let renderMode: "heatmap" | "scatter-3d" | "surface-3d" = "heatmap";
  let camera = { yaw: 0.75, pitch: 0.58 };
  let selectedRun = sweep.runs[0] ?? null;
  let filterKey = sweep.parameterKeys.find((key) => key !== xParam && key !== yParam) ?? null;
  let filterValue = filterKey === null ? null : availableFilterValues(sweep, filterKey)[0] ?? null;
  let currentRun = createSampleStrategyRunFromSummary(selectedRun!);
  let report = createPerformanceReportModel(currentRun, "performance-report-demo");
  let reportView = report.view();
  let optimizationView = buildOptimizationView(
    sweep,
    renderMode,
    camera,
    xParam,
    yParam,
    zMetric,
    filterKey,
    filterValue,
    selectedRun?.runId ?? null,
  );
  const log: string[] = ["loaded parameter sweep and performance report"];

  const publishSnapshot = () => {
    publish(
      snapshotFromViews(
        reportView,
        optimizationView,
        log,
        filterKey,
        filterValue,
        availableFilterValues(sweep, filterKey),
        selectedRun,
      ),
    );
  };

  const updateReportFromSelection = (runId: string, logEntry: string) => {
    selectedRun = sweep.runs.find((run) => run.runId === runId) ?? selectedRun;
    if (selectedRun === null) {
      return;
    }
    currentRun = createSampleStrategyRunFromSummary(selectedRun);
    report = createPerformanceReportModel(currentRun, "performance-report-demo");
    reportView = report.view();
    optimizationView = buildOptimizationView(
      sweep,
      renderMode,
      camera,
      xParam,
      yParam,
      zMetric,
      filterKey,
      filterValue,
      selectedRun.runId,
    );
    log.unshift(logEntry);
    if (log.length > 8) {
      log.pop();
    }
    optimizationHarness.update(optimizationView);
    performanceHarness.update(reportView);
    publishSnapshot();
  };

  const performanceHarness = new PerformanceCanvasHarness(reportCanvas, reportView, (tradeId) => {
    report.selectTrade(tradeId);
    reportView = report.view();
    log.unshift(`selected trade ${tradeId}`);
    if (log.length > 8) {
      log.pop();
    }
    performanceHarness.update(reportView);
    if (reportView.selectedTradeIntent !== null) {
      publishTradeIntent?.(reportView.selectedTradeIntent);
    }
    publishSnapshot();
  });

  const optimizationHarness = new OptimizationCanvasHarness(
    optimizationCanvas,
    optimizationView,
    (runId) => {
      updateReportFromSelection(runId, `selected run ${runId}`);
    },
    (nextCamera) => {
      camera = nextCamera;
      optimizationView = {
        ...optimizationView,
        camera,
      };
      publishSnapshot();
    },
  );

  publishSnapshot();

  const refreshSurface = (logEntry: string) => {
    filterKey = sweep.parameterKeys.find((key) => key !== xParam && key !== yParam) ?? null;
    const options = availableFilterValues(sweep, filterKey);
    if (filterKey === null) {
      filterValue = null;
    } else if (filterValue === null || !options.includes(filterValue)) {
      filterValue = options[0] ?? null;
    }
    const nextView = buildOptimizationView(
      sweep,
      renderMode,
      camera,
      xParam,
      yParam,
      zMetric,
      filterKey,
      filterValue,
      selectedRun?.runId ?? null,
    );
    const nextSelectedRunId =
      nextView.selectedRunId !== null &&
      nextView.dataset.points.some((point) => point.runId === nextView.selectedRunId)
        ? nextView.selectedRunId
        : nextView.dataset.points[0]?.runId ?? null;
    optimizationView = buildOptimizationView(
      sweep,
      renderMode,
      camera,
      xParam,
      yParam,
      zMetric,
      filterKey,
      filterValue,
      nextSelectedRunId,
    );
    optimizationHarness.update(optimizationView);
    if (nextSelectedRunId !== null && nextSelectedRunId !== selectedRun?.runId) {
      updateReportFromSelection(nextSelectedRunId, logEntry);
      return;
    }
    log.unshift(logEntry);
    if (log.length > 8) {
      log.pop();
    }
    publishSnapshot();
  };

  return {
    snapshot() {
      return snapshotFromViews(
        reportView,
        optimizationView,
        log,
        filterKey,
        filterValue,
        availableFilterValues(sweep, filterKey),
        selectedRun,
      );
    },
    setOptimizationRenderMode(value) {
      renderMode = value;
      log.unshift(`changed surface mode to ${value}`);
      if (log.length > 8) {
        log.pop();
      }
      optimizationView = buildOptimizationView(
        sweep,
        renderMode,
        camera,
        xParam,
        yParam,
        zMetric,
        filterKey,
        filterValue,
        selectedRun?.runId ?? null,
      );
      optimizationHarness.update(optimizationView);
      publishSnapshot();
    },
    setOptimizationXAxis(value: string) {
      if (!sweep.parameterKeys.includes(value) || value === yParam) {
        return;
      }
      xParam = value;
      refreshSurface(`changed x axis to ${value}`);
    },
    setOptimizationYAxis(value: string) {
      if (!sweep.parameterKeys.includes(value) || value === xParam) {
        return;
      }
      yParam = value;
      refreshSurface(`changed y axis to ${value}`);
    },
    setOptimizationZMetric(value: OptimizationMetricKey) {
      if (!OPTIMIZATION_METRICS.includes(value)) {
        return;
      }
      zMetric = value;
      refreshSurface(`changed z metric to ${value}`);
    },
    setOptimizationFilterValue(value: string) {
      if (filterKey === null) {
        return;
      }
      filterValue = value;
      refreshSurface(`filtered ${filterKey}=${value}`);
    },
    destroy() {
      optimizationHarness.destroy();
      performanceHarness.destroy();
    },
  };
}
