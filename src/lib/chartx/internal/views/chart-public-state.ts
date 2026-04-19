import {
  clearSelectedDrawing as clearSelectedDrawingUseCase,
  getSelectedDrawingPropertySchema as getSelectedDrawingPropertySchemaUseCase,
  getSelectedDrawingState as getSelectedDrawingStateUseCase,
} from "./chart-drawing-commands";
import { buildSelectedDrawingState as buildSelectedDrawingStateUseCase } from "./chart-drawing-session";
import {
  subscribeHandler as subscribeHandlerUseCase,
  unsubscribeHandler as unsubscribeHandlerUseCase,
} from "./chart-runtime-commands";
import type {
  PhaseOneDrawingPropertySchema,
  PhaseOneDrawingSelectionChangeHandler,
  PhaseOneDrawingStateSnapshot,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOnePaneEventHandler,
  PhaseOneSelectedDrawing,
  PhaseOneTrendLineDrawingOptions,
  PhaseOneChartTypeChangeHandler,
  PhaseOneCrosshairMoveHandler,
  PhaseOneClickHandler,
} from "./chart-harness";

type SelectableDrawingLike = {
  id: string;
  kind: "horizontal-line" | "trend-line";
  paneId: string;
  visible: boolean;
  api: unknown;
};

type MutableDrawingLike = {
  api: {
    applyOptions(options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions): void;
  };
};

export function getSelectedDrawing<Drawing extends SelectableDrawingLike>(
  selectedDrawingId: string | null,
  deps: {
    getById(id: string): Drawing | undefined;
    getPaneIndex(paneId: string): number;
  },
): PhaseOneSelectedDrawing {
  return buildSelectedDrawingStateUseCase(selectedDrawingId, deps);
}

export function getSelectedDrawingState(
  params: Parameters<typeof getSelectedDrawingStateUseCase>[0],
): PhaseOneDrawingStateSnapshot | null {
  return getSelectedDrawingStateUseCase(params);
}

export function getSelectedDrawingPropertySchema(
  snapshot: PhaseOneDrawingStateSnapshot | null,
  resolvePropertySchema: (type: PhaseOneDrawingStateSnapshot["type"]) => PhaseOneDrawingPropertySchema,
): PhaseOneDrawingPropertySchema | null {
  return getSelectedDrawingPropertySchemaUseCase(snapshot, resolvePropertySchema);
}

export function applySelectedDrawingOptions(
  params: {
    selectedDrawingId: string | null;
    getDrawingById(id: string): MutableDrawingLike | undefined;
    options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions;
  },
): void {
  if (params.selectedDrawingId === null) {
    throw new Error("chartx phase-one chart has no selected drawing to update");
  }
  const drawing = params.getDrawingById(params.selectedDrawingId);
  if (drawing === undefined) {
    throw new Error("chartx phase-one chart has no selected drawing to update");
  }
  drawing.api.applyOptions(params.options);
}

export function clearSelectedDrawing(clearSelection: () => void): void {
  clearSelectedDrawingUseCase(clearSelection);
}

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
