import {
  createPerformanceReportModel,
  createSampleStrategyRun,
  type PerformanceReportView,
  type TradeLocationIntent,
} from "$lib/chartx/public/performance";
import { PerformanceCanvasHarness } from "$lib/chartx/internal/performance";

export type PerformanceDemoSnapshot = {
  title: string;
  summary: string;
  metrics: readonly { label: string; value: string }[];
  eventLog: readonly string[];
  selectedTradeId: string | null;
  selectedTradeIntent: TradeLocationIntent | null;
};

export type PerformanceDemoController = {
  snapshot(): PerformanceDemoSnapshot;
  destroy(): void;
};

type SnapshotPublisher = (snapshot: PerformanceDemoSnapshot) => void;
type TradeLocationPublisher = (intent: TradeLocationIntent) => void;

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

function snapshotFromView(view: PerformanceReportView, eventLog: readonly string[]): PerformanceDemoSnapshot {
  return {
    title: view.title,
    summary: view.summary,
    metrics: view.metrics.map((metric) => ({
      label: metric.label,
      value: formatMetricValue(metric.label, metric.value),
    })),
    eventLog,
    selectedTradeId: view.selectedTrade?.id ?? null,
    selectedTradeIntent: view.selectedTradeIntent,
  };
}

export function mountPerformanceReportDemo(
  canvas: HTMLCanvasElement,
  publish: SnapshotPublisher,
  publishTradeIntent?: TradeLocationPublisher,
): PerformanceDemoController {
  const run = createSampleStrategyRun();
  const report = createPerformanceReportModel(run, "performance-report-demo");
  const log: string[] = ["loaded sample strategy run"];
  let view = report.view();
  const harness = new PerformanceCanvasHarness(canvas, view, (tradeId) => {
    report.selectTrade(tradeId);
    view = report.view();
    log.unshift(`selected trade ${tradeId}`);
    if (log.length > 6) {
      log.pop();
    }
    harness.update(view);
    if (view.selectedTradeIntent !== null) {
      publishTradeIntent?.(view.selectedTradeIntent);
    }
    publish(snapshotFromView(view, log));
  });
  const initialSnapshot = snapshotFromView(view, log);
  publish(initialSnapshot);

  return {
    snapshot() {
      return snapshotFromView(view, log);
    },
    destroy() {
      harness.destroy();
    },
  };
}
