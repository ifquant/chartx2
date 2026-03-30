import {
  getEngineBoundarySummary,
  type EngineBoundarySummary,
} from "../internal/foundation";
import {
  createPhaseOneChart,
  mountPhaseOneChartHarness,
  type PhaseOneBarSeriesOptions,
  type PhaseOneBarSeriesApi,
  type PhaseOneCandlestickData,
  type PhaseOneCandlestickSeriesApi,
  type PhaseOneCandlestickSeriesOptions,
  type PhaseOneChartApi,
  type PhaseOneChartOptions,
  type PhaseOneClickEvent,
  type PhaseOneClickHandler,
  type PhaseOneCrosshairMoveEvent,
  type PhaseOneCrosshairMoveHandler,
  type PhaseOneHistogramData,
  type PhaseOneHistogramSeriesApi,
  type PhaseOneHistogramSeriesOptions,
  type PhaseOneLineData,
  type PhaseOneLineSeriesApi,
  type PhaseOneLineSeriesOptions,
  type PhaseOnePriceScaleApi,
  type PhaseOneReadoutDetail,
  type PhaseOneTimeScaleApi,
  type PhaseOneVolumeData,
  type PhaseOneVolumeSeriesApi,
  type PhaseOneVolumeSeriesOptions,
} from "../internal/views";

export type {
  EngineBoundarySummary,
  PhaseOneBarSeriesOptions,
  PhaseOneBarSeriesApi,
  PhaseOneCandlestickData,
  PhaseOneCandlestickSeriesApi,
  PhaseOneCandlestickSeriesOptions,
  PhaseOneChartApi,
  PhaseOneChartOptions,
  PhaseOneClickEvent,
  PhaseOneClickHandler,
  PhaseOneCrosshairMoveEvent,
  PhaseOneCrosshairMoveHandler,
  PhaseOneHistogramData,
  PhaseOneHistogramSeriesApi,
  PhaseOneHistogramSeriesOptions,
  PhaseOneLineData,
  PhaseOneLineSeriesApi,
  PhaseOneLineSeriesOptions,
  PhaseOnePriceScaleApi,
  PhaseOneReadoutDetail,
  PhaseOneTimeScaleApi,
  PhaseOneVolumeData,
  PhaseOneVolumeSeriesApi,
  PhaseOneVolumeSeriesOptions,
};

export function getChartxFoundation(): EngineBoundarySummary {
  return getEngineBoundarySummary();
}

export function mountChartxPhaseOneHarness(canvas: HTMLCanvasElement): () => void {
  return mountPhaseOneChartHarness(canvas);
}

export function createChartxPhaseOneChart(canvas: HTMLCanvasElement): PhaseOneChartApi {
  return createPhaseOneChart(canvas);
}
