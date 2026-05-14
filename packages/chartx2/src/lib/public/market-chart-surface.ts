import type {
  PhaseOneCandlestickData,
  PhaseOneChartOptions,
  PhaseOneHistogramData,
  PhaseOneLineData,
  PhaseOneVolumeData,
} from "./market";

export type PhaseOneMarketChartSurfaceIndicatorSeries =
  | {
      id: string;
      kind: "volume";
      label: string;
      color?: string;
      data: readonly PhaseOneVolumeData[];
      latestLabel?: string;
    }
  | {
      id: string;
      kind: "histogram";
      label: string;
      color?: string;
      data: readonly PhaseOneHistogramData[];
      latestLabel?: string;
    }
  | {
      id: string;
      kind: "line";
      label: string;
      color?: string;
      data: readonly PhaseOneLineData[];
      latestLabel?: string;
    };

export interface PhaseOneMarketChartSurfaceIndicatorPane {
  id: string;
  title: string;
  subtitle?: string;
  height?: number;
  series: readonly PhaseOneMarketChartSurfaceIndicatorSeries[];
}

export interface PhaseOneMarketChartSurfaceIndicatorReadout {
  id: string;
  label: string;
  valueLabel: string;
  color?: string;
}

export interface PhaseOneMarketChartSurfaceResolvedIndicatorPane
  extends PhaseOneMarketChartSurfaceIndicatorPane {
  height: number;
  readouts: readonly PhaseOneMarketChartSurfaceIndicatorReadout[];
}

export interface PhaseOneMarketChartSurfaceModel {
  symbol: string;
  timeframeLabel: string;
  bars: readonly PhaseOneCandlestickData[];
  volume?: readonly PhaseOneVolumeData[];
  overlayLine?: readonly PhaseOneLineData[];
  indicatorPanes?: readonly PhaseOneMarketChartSurfaceIndicatorPane[];
  statusLabel?: string;
  emptyLabel?: string;
  chartOptions?: PhaseOneChartOptions;
}

function latestValueLabel(series: PhaseOneMarketChartSurfaceIndicatorSeries): string {
  if (series.latestLabel !== undefined) {
    return series.latestLabel;
  }
  const latest = series.data.at(-1);
  if (latest === undefined) {
    return "--";
  }
  return latest.value.toFixed(2);
}

export function resolvePhaseOneMarketChartIndicatorPanes(
  model: PhaseOneMarketChartSurfaceModel,
): PhaseOneMarketChartSurfaceResolvedIndicatorPane[] {
  return (model.indicatorPanes ?? []).map((pane) => ({
    ...pane,
    height: pane.height ?? 96,
    readouts: pane.series.map((series) => ({
      id: series.id,
      label: series.label,
      valueLabel: latestValueLabel(series),
      color: series.color,
    })),
  }));
}
