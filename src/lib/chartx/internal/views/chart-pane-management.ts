import { emitPaneEventRuntime, emitPaneResizeEvent } from "./chart-event-runtime";
import {
  buildPaneSeriesStates,
  buildPaneState,
  buildPaneStateSnapshot,
} from "./chart-pane-state";
import type {
  PhaseOnePaneEventHandler,
  PhaseOnePaneEventType,
  PhaseOnePaneResizeHandler,
  PhaseOnePaneSeriesState,
  PhaseOnePaneState,
} from "./chart-harness";

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
  resizable: boolean;
};

export function getPaneSeriesStates(
  paneId: string,
  deps: {
    listSourcesByPane(paneId: string): readonly unknown[];
  },
): readonly PhaseOnePaneSeriesState[] {
  return buildPaneSeriesStates(deps.listSourcesByPane(paneId) as never);
}

export function buildPaneStateById(
  paneId: string,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    getPaneIndex(paneId: string): number;
    getPaneHeight(paneId: string): number;
    getPaneSeriesStates(paneId: string): readonly PhaseOnePaneSeriesState[];
  },
): PhaseOnePaneState | null {
  return buildPaneState(paneId, deps);
}

export function buildPaneStateSnapshotByIds(
  paneIds: readonly string[],
  deps: {
    buildPaneState(paneId: string): PhaseOnePaneState | null;
  },
): readonly PhaseOnePaneState[] {
  return buildPaneStateSnapshot(paneIds, deps);
}

export function emitPaneResize(
  handlers: ReadonlySet<PhaseOnePaneResizeHandler> | undefined,
  paneId: string,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    getPaneIndex(paneId: string): number;
    getPaneHeight(paneId: string): number;
  },
): void {
  emitPaneResizeEvent(handlers, paneId, deps);
}

export function emitPaneEvent(
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
  emitPaneEventRuntime(
    handlers,
    type,
    paneId,
    deps,
    explicitPaneState,
    explicitSnapshot,
  );
}

export function removePane(
  paneId: string,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    getSeriesCount(paneId: string): number;
    getDrawingCount(paneId: string): number;
    buildPaneState(paneId: string): PhaseOnePaneState | null;
    buildPaneSnapshot(): readonly PhaseOnePaneState[];
    removePaneById(paneId: string): void;
    clearPaneResizeHandlers(paneId: string): void;
    removeSecondaryScale(paneId: string): void;
    emitPaneEvent(
      type: PhaseOnePaneEventType,
      paneId: string,
      explicitPaneState?: PhaseOnePaneState | null,
      explicitSnapshot?: readonly PhaseOnePaneState[],
    ): void;
    render(): void;
  },
): void {
  const pane = deps.getPaneById(paneId);
  if (pane === undefined) {
    throw new Error("chartx phase-one pane has been removed");
  }
  if (pane.kind === "primary") {
    throw new Error("chartx phase-one chart cannot remove the primary pane");
  }
  if (deps.getSeriesCount(paneId) > 0) {
    throw new Error("chartx phase-one chart cannot remove a pane while a series is still attached");
  }
  if (deps.getDrawingCount(paneId) > 0) {
    throw new Error("chartx phase-one chart cannot remove a pane while a drawing is still attached");
  }

  const removedPaneState = deps.buildPaneState(paneId);
  deps.removePaneById(paneId);
  deps.clearPaneResizeHandlers(paneId);
  deps.removeSecondaryScale(paneId);
  deps.emitPaneEvent("removed", paneId, removedPaneState, deps.buildPaneSnapshot());
  deps.render();
}
