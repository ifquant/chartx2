import type { PhaseOneChartApi } from "./chart-harness";
import {
  buildDemoBars,
  buildDemoVolumeBars,
} from "./chart-demo-data";

export function mountPhaseOneChartDemo(
  canvas: HTMLCanvasElement,
  createChart: (canvas: HTMLCanvasElement) => PhaseOneChartApi,
): () => void {
  const chart = createChart(canvas);
  const bars = buildDemoBars();
  const volumePane = chart.addPane({ height: 136 });
  const series = chart.addCandlestickSeries();
  const volume = chart.addVolumeSeries({ pane: volumePane });
  series.setData(bars);
  volume.setData(buildDemoVolumeBars(bars));

  return () => {
    chart.destroy();
  };
}
