import {
  buildPaneStateById,
  buildPaneStateSnapshotByIds,
  getPaneSeriesStates,
} from "./chart-pane-management";
import type {
  PhaseOnePaneSeriesState,
  PhaseOnePaneState,
} from "./chart-harness";

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
  resizable: boolean;
};

export function getPaneSeriesStatesRuntime(
  paneId: string,
  deps: {
    listSourcesByPane(paneId: string): readonly unknown[];
  },
): readonly PhaseOnePaneSeriesState[] {
  return getPaneSeriesStates(paneId, deps);
}

export function buildPaneStateRuntime(
  paneId: string,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    getPaneIndex(paneId: string): number;
    getPaneHeight(paneId: string): number;
    getPaneSeriesStates(paneId: string): readonly PhaseOnePaneSeriesState[];
  },
): PhaseOnePaneState | null {
  return buildPaneStateById(paneId, deps);
}

export function buildPaneStateSnapshotRuntime(
  paneIds: readonly string[],
  deps: {
    buildPaneState(paneId: string): PhaseOnePaneState | null;
  },
): readonly PhaseOnePaneState[] {
  return buildPaneStateSnapshotByIds(paneIds, deps);
}
