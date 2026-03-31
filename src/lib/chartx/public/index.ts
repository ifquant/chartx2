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
  type PhaseOnePaneApi,
  type PhaseOnePaneEvent,
  type PhaseOnePaneEventHandler,
  type PhaseOnePaneEventType,
  type PhaseOnePaneKind,
  type PhaseOnePaneOptions,
  type PhaseOnePaneState,
  type PhaseOnePaneResizeEvent,
  type PhaseOnePaneResizeHandler,
  type PhaseOnePriceScaleApi,
  type PhaseOneReadoutDetail,
  type PhaseOneSeriesTarget,
  type PhaseOneTimeScaleApi,
  type PhaseOneVolumeData,
  type PhaseOneVolumeSeriesApi,
  type PhaseOneVolumeSeriesOptions,
  type PhaseOneVolumeSeriesTarget,
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
  PhaseOnePaneApi,
  PhaseOnePaneEvent,
  PhaseOnePaneEventHandler,
  PhaseOnePaneEventType,
  PhaseOnePaneKind,
  PhaseOnePaneOptions,
  PhaseOnePaneState,
  PhaseOnePaneResizeEvent,
  PhaseOnePaneResizeHandler,
  PhaseOnePriceScaleApi,
  PhaseOneReadoutDetail,
  PhaseOneSeriesTarget,
  PhaseOneTimeScaleApi,
  PhaseOneVolumeData,
  PhaseOneVolumeSeriesApi,
  PhaseOneVolumeSeriesOptions,
  PhaseOneVolumeSeriesTarget,
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
