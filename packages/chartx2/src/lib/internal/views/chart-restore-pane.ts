export const INVALID_RESTORABLE_PANE_INDEX_ERROR =
  "chartx phase-one chart state refers to a pane index that does not exist";

export function requireRestorablePane<PaneState>(
  paneIndex: number,
  deps: {
    getPaneByIndex(index: number): PaneState | undefined;
  },
): PaneState {
  const pane = deps.getPaneByIndex(paneIndex);
  if (pane === undefined) {
    throw new Error(INVALID_RESTORABLE_PANE_INDEX_ERROR);
  }
  return pane;
}
