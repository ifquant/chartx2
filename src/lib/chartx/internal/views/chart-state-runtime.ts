import { normalizePaneHeight } from "../model";

import type { PhaseOnePaneEventType } from "./chart-harness";
import type {
  RestorablePriceScaleState,
  RestorableSecondaryPaneState,
  RestorableTimeScaleState,
} from "./chart-state-restore";

type SecondaryPaneLike = {
  id: string;
  kind: "primary" | "secondary";
  preferredHeight: number | null;
  resizable: boolean;
};

export function listSecondaryPaneIds(
  deps: {
    listPanes(): readonly SecondaryPaneLike[];
  },
): readonly string[] {
  return deps
    .listPanes()
    .filter((pane) => pane.kind === "secondary")
    .map((pane) => pane.id);
}

export function applySecondaryPaneState(
  index: number,
  paneState: RestorableSecondaryPaneState,
  deps: {
    listPanes(): readonly SecondaryPaneLike[];
    emitPaneEvent(type: PhaseOnePaneEventType, paneId: string): void;
  },
): void {
  const pane = deps.listPanes().filter((entry) => entry.kind === "secondary")[index];
  if (pane === undefined) {
    return;
  }

  pane.preferredHeight = normalizePaneHeight(paneState.height ?? undefined);
  pane.resizable = paneState.resizable;
  deps.emitPaneEvent("options", pane.id);
}

export function applyRestorableTimeScaleState(
  state: RestorableTimeScaleState,
  deps: {
    applyOptions(options: {
      barSpacing?: number;
      rightOffset?: number;
    }): void;
    setVisibleLogicalRange(range: { from: number; to: number }): void;
  },
): void {
  deps.applyOptions({
    barSpacing: state.barSpacing ?? undefined,
    rightOffset: state.rightOffset,
  });

  if (state.visibleLogicalRange !== null) {
    deps.setVisibleLogicalRange(state.visibleLogicalRange);
  }
}

export function applyRestorablePriceScaleState(
  state: RestorablePriceScaleState,
  deps: {
    applyOptions(options: {
      scaleSeriesOnly: boolean;
    }): void;
    setVisibleRange(range: { minValue: number; maxValue: number } | null): void;
  },
): void {
  deps.applyOptions({
    scaleSeriesOnly: state.scaleSeriesOnly,
  });
  deps.setVisibleRange(state.visibleRange);
}
