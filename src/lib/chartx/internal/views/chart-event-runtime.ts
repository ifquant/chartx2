import { buildCrosshairMoveEvent as buildCrosshairMoveEventUseCase } from "./chart-render-tail";
import type {
  PhaseOneChartApi,
  PhaseOneClickEvent,
  PhaseOneClickHandler,
  PhaseOneCrosshairMoveEvent,
  PhaseOneCrosshairMoveHandler,
  PhaseOnePaneEvent,
  PhaseOnePaneEventHandler,
  PhaseOnePaneEventType,
  PhaseOnePaneResizeEvent,
  PhaseOnePaneResizeHandler,
  PhaseOnePaneState,
  PhaseOneReadoutDetail,
} from "./chart-harness";

type PaneLike = { kind: "primary" | "secondary" };
type PanePointLike = { x: number; y: number } | null;

export function notifyHandlers<T>(handlers: Iterable<(payload: T) => void>, payload: T): void {
  for (const handler of handlers) {
    handler(payload);
  }
}

export function emitPaneResizeEvent(
  handlers: ReadonlySet<PhaseOnePaneResizeHandler> | undefined,
  paneId: string,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    getPaneIndex(paneId: string): number;
    getPaneHeight(paneId: string): number;
  },
): void {
  if (handlers === undefined || handlers.size === 0) {
    return;
  }
  const pane = deps.getPaneById(paneId);
  if (pane === undefined) {
    return;
  }
  const event: PhaseOnePaneResizeEvent = {
    paneIndex: deps.getPaneIndex(paneId),
    height: deps.getPaneHeight(paneId),
    isPrimary: pane.kind === "primary",
  };
  notifyHandlers(handlers, event);
}

export function emitPaneEventRuntime(
  handlers: ReadonlySet<PhaseOnePaneEventHandler>,
  type: PhaseOnePaneEventType,
  paneId: string,
  deps: {
    buildPaneState(paneId: string): PhaseOnePaneState | null;
    buildPaneSnapshot(): readonly PhaseOnePaneState[];
  },
  explicitPaneState?: PhaseOnePaneState | null,
  explicitSnapshot?: readonly PhaseOnePaneState[],
): void {
  if (handlers.size === 0) {
    return;
  }
  const paneState = explicitPaneState ?? deps.buildPaneState(paneId);
  if (paneState === null) {
    return;
  }
  const event: PhaseOnePaneEvent = {
    type,
    pane: paneState,
    panes: explicitSnapshot ?? deps.buildPaneSnapshot(),
  };
  notifyHandlers(handlers, event);
}

export function emitCrosshairMoveEventRuntime(
  handlers: ReadonlySet<PhaseOneCrosshairMoveHandler>,
  readout: PhaseOneReadoutDetail,
  point: PanePointLike,
): void {
  const event: PhaseOneCrosshairMoveEvent = buildCrosshairMoveEventUseCase(readout, point);
  notifyHandlers(handlers, event);
}

export function emitChartTypeChangeRuntime(
  handlers: ReadonlySet<(type: Parameters<PhaseOneChartApi["setChartType"]>[0]) => void>,
  type: Parameters<PhaseOneChartApi["setChartType"]>[0],
): void {
  notifyHandlers(handlers, type);
}

export function emitClickRuntime(
  handlers: ReadonlySet<PhaseOneClickHandler>,
  readout: PhaseOneReadoutDetail,
  point: PanePointLike,
): void {
  const event: PhaseOneClickEvent = {
    ...readout,
    point,
  };
  notifyHandlers(handlers, event);
}
