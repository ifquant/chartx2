import {
  getEngineBoundarySummary,
  type EngineBoundarySummary,
} from "../internal/foundation";
import {
  createPhaseOneChart,
  mountPhaseOneChartHarness,
  type PhaseOneBarSeriesApi,
  type PhaseOneCandlestickData,
  type PhaseOneCandlestickSeriesApi,
  type PhaseOneChartApi,
  type PhaseOneCrosshairMoveEvent,
  type PhaseOneCrosshairMoveHandler,
  type PhaseOneLineData,
  type PhaseOneLineSeriesApi,
  type PhaseOneReadoutDetail,
} from "../internal/views";

export type {
  EngineBoundarySummary,
  PhaseOneBarSeriesApi,
  PhaseOneCandlestickData,
  PhaseOneCandlestickSeriesApi,
  PhaseOneChartApi,
  PhaseOneCrosshairMoveEvent,
  PhaseOneCrosshairMoveHandler,
  PhaseOneLineData,
  PhaseOneLineSeriesApi,
  PhaseOneReadoutDetail,
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
