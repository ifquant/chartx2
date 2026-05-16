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

export type PhaseOneMarketChartDisplayMode = "candlestick" | "intraday-timeshare";
export type PhaseOneMarketChartReadoutMode = "ohlc" | "timeshare";

export interface PhaseOneIntradayTimesharePoint {
  time: number;
  price: number;
  averagePrice?: number;
  volume?: number;
  openInterest?: number;
}

export interface PhaseOneIntradayTimeshareModel {
  points: readonly PhaseOneIntradayTimesharePoint[];
  previousClose?: number;
  settlementPrice?: number;
  sessionLabel?: string;
}

export interface PhaseOneMarketChartSurfaceModel {
  symbol: string;
  timeframeLabel: string;
  displayMode?: PhaseOneMarketChartDisplayMode;
  bars: readonly PhaseOneCandlestickData[];
  intradayTimeshare?: PhaseOneIntradayTimeshareModel;
  volume?: readonly PhaseOneVolumeData[];
  overlayLine?: readonly PhaseOneLineData[];
  indicatorPanes?: readonly PhaseOneMarketChartSurfaceIndicatorPane[];
  statusLabel?: string;
  emptyLabel?: string;
  chartOptions?: PhaseOneChartOptions;
}

export type PhaseOneMarketChartSurfaceChrome = "card" | "integrated";
export type PhaseOneMarketChartSurfaceDensity = "default" | "compact";
export type PhaseOneMarketChartSurfaceReadoutPosition = "bottom" | "top";
export type PhaseOneMarketChartSurfaceRightDockMode = "none" | "overlay" | "inline";

export interface PhaseOneMarketChartSurfaceLayout {
  chrome?: PhaseOneMarketChartSurfaceChrome;
  density?: PhaseOneMarketChartSurfaceDensity;
  readoutPosition?: PhaseOneMarketChartSurfaceReadoutPosition;
  rightDockMode?: PhaseOneMarketChartSurfaceRightDockMode;
}

export function normalizePhaseOneMarketChartSurfaceLayout(
  layout: PhaseOneMarketChartSurfaceLayout = {},
): Required<PhaseOneMarketChartSurfaceLayout> {
  return {
    chrome: layout.chrome ?? "card",
    density: layout.density ?? "default",
    readoutPosition: layout.readoutPosition ?? "bottom",
    rightDockMode: layout.rightDockMode ?? "none",
  };
}

export function resolvePhaseOneMarketChartDisplayMode(
  model: PhaseOneMarketChartSurfaceModel,
): PhaseOneMarketChartDisplayMode {
  return model.displayMode ?? "candlestick";
}

export function resolvePhaseOneMarketChartReadoutMode(
  model: PhaseOneMarketChartSurfaceModel,
): PhaseOneMarketChartReadoutMode {
  return resolvePhaseOneMarketChartDisplayMode(model) === "intraday-timeshare" ? "timeshare" : "ohlc";
}

export function resolvePhaseOneMarketChartActiveDataLength(
  model: PhaseOneMarketChartSurfaceModel,
): number {
  if (resolvePhaseOneMarketChartDisplayMode(model) === "intraday-timeshare") {
    return model.intradayTimeshare?.points.length ?? 0;
  }
  return model.bars.length;
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
