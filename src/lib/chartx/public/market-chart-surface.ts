import type {
  PhaseOneCandlestickData,
  PhaseOneChartOptions,
  PhaseOneVolumeData,
} from "./market";

export interface PhaseOneMarketChartSurfaceModel {
  symbol: string;
  timeframeLabel: string;
  bars: readonly PhaseOneCandlestickData[];
  volume?: readonly PhaseOneVolumeData[];
  statusLabel?: string;
  emptyLabel?: string;
  chartOptions?: PhaseOneChartOptions;
}
