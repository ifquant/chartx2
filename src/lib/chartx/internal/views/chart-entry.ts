import type { PhaseOneChartApi } from "./chart-api-types";
import { mountPhaseOneChartDemo } from "./chart-demo-mount";
import { createAttachedChart } from "./chart-factory";
import { createChartEntryShellOwner } from "./chart-entry-shell-owner";
import { PhaseOneChartHarness } from "./chart-harness";

const chartEntryShellOwner = createChartEntryShellOwner({
  createAttachedChart,
  mountChartDemo: mountPhaseOneChartDemo,
  createHarness: () => new PhaseOneChartHarness(),
});

export function createPhaseOneChart(canvas: HTMLCanvasElement): PhaseOneChartApi {
  return chartEntryShellOwner.createChart(canvas);
}

export function mountPhaseOneChartHarness(canvas: HTMLCanvasElement): () => void {
  return chartEntryShellOwner.mountChartHarness(canvas);
}
