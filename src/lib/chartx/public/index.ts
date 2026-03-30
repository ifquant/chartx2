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
  type PhaseOneLineData,
  type PhaseOneLineSeriesApi,
  type PhaseOneLineSeriesOptions,
  type PhaseOnePriceScaleApi,
  type PhaseOneReadoutDetail,
  type PhaseOneTimeScaleApi,
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
  PhaseOneLineData,
  PhaseOneLineSeriesApi,
  PhaseOneLineSeriesOptions,
  PhaseOnePriceScaleApi,
  PhaseOneReadoutDetail,
  PhaseOneTimeScaleApi,
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
