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
