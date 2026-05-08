import type { PaneModelState } from "./pane-model";

export const DEFAULT_SECONDARY_PANE_HEIGHT = 136;
export const MIN_SECONDARY_PANE_HEIGHT = 72;
export const MIN_PRIMARY_PANE_HEIGHT = 160;

export function normalizePaneHeight(height: number | undefined): number {
  if (height === undefined || !Number.isFinite(height)) {
    return DEFAULT_SECONDARY_PANE_HEIGHT;
  }
  return Math.max(MIN_SECONDARY_PANE_HEIGHT, Math.round(height));
}

export function resolvePaneFrameAllocation(
  panes: readonly PaneModelState[],
  plotHeight: number,
  gap: number,
): {
  effectiveGap: number;
  primaryHeight: number;
  secondaryHeights: ReadonlyMap<string, number>;
} {
  const effectiveGap = panes.length > 1 ? gap : 0;
  const totalGap = effectiveGap * Math.max(0, panes.length - 1);
  const secondaryPanes = panes.filter((pane) => pane.kind === "secondary");
  const preferredSecondaryTotal = secondaryPanes.reduce(
    (sum, pane) => sum + normalizePaneHeight(pane.preferredHeight ?? undefined),
    0,
  );
  const maxSecondaryTotal = Math.max(0, plotHeight - totalGap - MIN_PRIMARY_PANE_HEIGHT);
  const secondaryScale =
    preferredSecondaryTotal > 0 && preferredSecondaryTotal > maxSecondaryTotal
      ? maxSecondaryTotal / preferredSecondaryTotal
      : 1;
  const targetSecondaryTotal =
    secondaryScale < 1 ? maxSecondaryTotal : preferredSecondaryTotal;

  const rawAllocations = secondaryPanes.map((pane, index) => {
    const rawHeight = normalizePaneHeight(pane.preferredHeight ?? undefined) * secondaryScale;
    const baseHeight = Math.floor(rawHeight);
    return {
      id: pane.id,
      index,
      rawHeight,
      baseHeight,
      fractional: rawHeight - baseHeight,
    };
  });

  let remainingUnits = Math.max(
    0,
    Math.round(targetSecondaryTotal - rawAllocations.reduce((sum, entry) => sum + entry.baseHeight, 0)),
  );
  rawAllocations
    .slice()
    .sort((left, right) => {
      if (right.fractional !== left.fractional) {
        return right.fractional - left.fractional;
      }
      return left.index - right.index;
    })
    .forEach((entry) => {
      if (remainingUnits <= 0) {
        return;
      }
      entry.baseHeight += 1;
      remainingUnits -= 1;
    });

  const secondaryHeights = new Map<string, number>();
  for (const entry of rawAllocations) {
    secondaryHeights.set(entry.id, entry.baseHeight);
  }

  const secondaryTotal = Array.from(secondaryHeights.values()).reduce((sum, height) => sum + height, 0);
  const primaryHeight = Math.max(MIN_PRIMARY_PANE_HEIGHT, plotHeight - totalGap - secondaryTotal);

  return {
    effectiveGap,
    primaryHeight,
    secondaryHeights,
  };
}
