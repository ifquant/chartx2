import {
  restoreStudyCollection,
  type RestorableCompareStudySnapshot,
  type RestorableMovingAverageStudySnapshot,
  type RestorableOverlayStudySnapshot,
  type RestorableStudySnapshot,
} from "./chart-content-restore";

export function restoreChartStudies<
  PaneState,
  PaneId,
  StudySnapshot extends RestorableStudySnapshot,
>(
  studies: readonly StudySnapshot[],
  deps: {
    getPaneByIndex(index: number): PaneState | undefined;
    getPaneId(pane: PaneState): PaneId;
    restoreOverlay(
      paneId: PaneId,
      snapshot: Extract<StudySnapshot, RestorableOverlayStudySnapshot>,
    ): void;
    restoreCompare(
      paneId: PaneId,
      snapshot: Extract<StudySnapshot, RestorableCompareStudySnapshot>,
    ): void;
    restoreMovingAverage(
      paneId: PaneId,
      snapshot: Extract<StudySnapshot, RestorableMovingAverageStudySnapshot>,
    ): void;
  },
): void {
  restoreStudyCollection(studies, {
    resolvePaneId: (paneIndex) => {
      const pane = deps.getPaneByIndex(paneIndex);
      if (pane === undefined) {
        throw new Error("chartx phase-one chart state refers to a pane index that does not exist");
      }
      return deps.getPaneId(pane);
    },
    restoreOverlay: deps.restoreOverlay,
    restoreCompare: deps.restoreCompare,
    restoreMovingAverage: deps.restoreMovingAverage,
  });
}
