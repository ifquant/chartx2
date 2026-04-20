import type {
  PhaseOnePaneEventType,
  PhaseOnePaneState,
} from "./chart-harness";

type PaneLike = {
  kind: "primary" | "secondary";
};

type PaneEventRegistry = {
  emitPaneResize(
    paneId: string,
    deps: {
      getPaneById(nextPaneId: string): PaneLike | undefined;
      getPaneIndex(nextPaneId: string): number;
      getPaneHeight(nextPaneId: string): number;
    },
  ): void;
  emitPaneEvent(
    type: PhaseOnePaneEventType,
    paneId: string,
    deps: {
      buildPaneState(nextPaneId: string): PhaseOnePaneState | null;
      buildPaneSnapshot(): readonly PhaseOnePaneState[];
    },
    explicitPaneState?: PhaseOnePaneState | null,
    explicitSnapshot?: readonly PhaseOnePaneState[],
  ): void;
};

export function emitPaneResizeRuntime(
  registry: PaneEventRegistry,
  paneId: string,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    getPaneIndex(paneId: string): number;
    getPaneHeight(paneId: string): number;
  },
): void {
  registry.emitPaneResize(paneId, deps);
}

export function emitPaneEventRuntime(
  registry: PaneEventRegistry,
  type: PhaseOnePaneEventType,
  paneId: string,
  deps: {
    buildPaneState(paneId: string): PhaseOnePaneState | null;
    buildPaneSnapshot(): readonly PhaseOnePaneState[];
  },
  explicitPaneState?: PhaseOnePaneState | null,
  explicitSnapshot?: readonly PhaseOnePaneState[],
): void {
  registry.emitPaneEvent(
    type,
    paneId,
    deps,
    explicitPaneState,
    explicitSnapshot,
  );
}
