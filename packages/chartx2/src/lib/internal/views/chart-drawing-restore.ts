import { assertDrawingTargetValid } from "../model";
import { INVALID_RESTORABLE_PANE_INDEX_ERROR } from "./chart-restore-pane";

export type RestorableHorizontalLineDrawingSnapshot = {
  type: "horizontal-line";
  paneIndex: number;
  options: unknown;
};

export type RestorableTrendLineDrawingSnapshot = {
  type: "trend-line";
  paneIndex: number;
  options: unknown;
};

export type RestorableDrawingSnapshot =
  | RestorableHorizontalLineDrawingSnapshot
  | RestorableTrendLineDrawingSnapshot;

export const INVALID_DRAWING_PANE_INDEX_ERROR = INVALID_RESTORABLE_PANE_INDEX_ERROR;

export type DrawingRestoreDependencies<
  PaneTarget,
  DrawingSnapshot extends RestorableDrawingSnapshot,
> = {
  resolvePaneTarget(paneIndex: number): PaneTarget;
  restoreHorizontalLine(
    target: PaneTarget,
    snapshot: Extract<DrawingSnapshot, RestorableHorizontalLineDrawingSnapshot>,
  ): void;
  restoreTrendLine(
    target: PaneTarget,
    snapshot: Extract<DrawingSnapshot, RestorableTrendLineDrawingSnapshot>,
  ): void;
};

export function restoreDrawingCollection<
  PaneTarget,
  DrawingSnapshot extends RestorableDrawingSnapshot,
>(
  drawings: readonly DrawingSnapshot[],
  deps: DrawingRestoreDependencies<PaneTarget, DrawingSnapshot>,
): void {
  for (const drawing of drawings) {
    const target = deps.resolvePaneTarget(drawing.paneIndex);

    switch (drawing.type) {
      case "horizontal-line":
        deps.restoreHorizontalLine(
          target,
          drawing as Extract<DrawingSnapshot, RestorableHorizontalLineDrawingSnapshot>,
        );
        break;
      case "trend-line":
        deps.restoreTrendLine(
          target,
          drawing as Extract<DrawingSnapshot, RestorableTrendLineDrawingSnapshot>,
        );
        break;
    }
  }
}

export function validateDrawingCollectionSnapshots<
  DrawingSnapshot extends RestorableDrawingSnapshot,
>(
  drawings: readonly DrawingSnapshot[],
  secondaryPaneCount: number,
): void {
  const maxPaneIndex = secondaryPaneCount;
  for (const drawing of drawings) {
    if (drawing.paneIndex < 0 || drawing.paneIndex > maxPaneIndex) {
      throw new Error(INVALID_DRAWING_PANE_INDEX_ERROR);
    }

    switch (drawing.type) {
      case "horizontal-line":
        assertDrawingTargetValid({
          kind: "horizontal-line",
          price: (drawing.options as { price?: number }).price ?? Number.NaN,
          lineWidth: (drawing.options as { lineWidth?: number }).lineWidth ?? 1,
        });
        break;
      case "trend-line":
        assertDrawingTargetValid({
          kind: "trend-line",
          startTime: (drawing.options as { startTime?: number }).startTime ?? Number.NaN,
          startPrice: (drawing.options as { startPrice?: number }).startPrice ?? Number.NaN,
          endTime: (drawing.options as { endTime?: number }).endTime ?? Number.NaN,
          endPrice: (drawing.options as { endPrice?: number }).endPrice ?? Number.NaN,
          lineWidth: (drawing.options as { lineWidth?: number }).lineWidth ?? 1,
        });
        break;
    }
  }
}
