import type { PhaseOneChartApi } from "./chart-api-types";

export function createChartEntryShellOwner(deps: {
  createAttachedChart(
    canvas: HTMLCanvasElement,
    createHarness: () => {
      attach(canvas: HTMLCanvasElement): void;
      publicApiSurface(): unknown;
    },
  ): PhaseOneChartApi;
  mountChartDemo(
    canvas: HTMLCanvasElement,
    createChart: (canvas: HTMLCanvasElement) => PhaseOneChartApi,
  ): () => void;
  createHarness(): {
    attach(canvas: HTMLCanvasElement): void;
    publicApiSurface(): unknown;
  };
}) {
  const createChart = (canvas: HTMLCanvasElement): PhaseOneChartApi =>
    deps.createAttachedChart(canvas, () => deps.createHarness());
  const mountChartHarness = (canvas: HTMLCanvasElement): () => void =>
    deps.mountChartDemo(canvas, createChart);

  return {
    createChart,
    mountChartHarness,
  };
}
