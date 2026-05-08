import type {
  PhaseOneCandlestickData,
  PhaseOneChartOptions,
  PhaseOneLineData,
  PhaseOneVolumeData,
} from "./market";

export interface PhaseOneMarketChartSurfaceModel {
  symbol: string;
  timeframeLabel: string;
  bars: readonly PhaseOneCandlestickData[];
  volume?: readonly PhaseOneVolumeData[];
  overlayLine?: readonly PhaseOneLineData[];
  statusLabel?: string;
  emptyLabel?: string;
  chartOptions?: PhaseOneChartOptions;
}
