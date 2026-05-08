import {
  subscribeHandler as subscribeHandlerUseCase,
  unsubscribeHandler as unsubscribeHandlerUseCase,
} from "./chart-runtime-commands";
import type {
  PhaseOneDrawingSelectionChangeHandler,
  PhaseOnePaneEventHandler,
  PhaseOneChartTypeChangeHandler,
  PhaseOneCrosshairMoveHandler,
  PhaseOneClickHandler,
} from "./chart-api-types";

export function subscribePublicHandler<Handler>(
  handlers: Set<Handler>,
  handler: Handler,
): void {
  subscribeHandlerUseCase(handlers, handler);
}

export function unsubscribePublicHandler<Handler>(
  handlers: Set<Handler>,
  handler: Handler,
): void {
  unsubscribeHandlerUseCase(handlers, handler);
}

export type PublicChartHandler =
  | PhaseOneCrosshairMoveHandler
  | PhaseOneClickHandler
  | PhaseOneDrawingSelectionChangeHandler
  | PhaseOnePaneEventHandler
  | PhaseOneChartTypeChangeHandler;
