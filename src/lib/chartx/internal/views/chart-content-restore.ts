export type RestorableCandlestickSeriesSnapshot = {
  kind: "candlestick";
  paneIndex: number;
  options: unknown;
  data: readonly unknown[];
};

export type RestorableBarSeriesSnapshot = {
  kind: "bar";
  paneIndex: number;
  options: unknown;
  data: readonly unknown[];
};

export type RestorableLineSeriesSnapshot = {
  kind: "line";
  paneIndex: number;
  options: unknown;
  data: readonly unknown[];
};

export type RestorableAreaSeriesSnapshot = {
  kind: "area";
  paneIndex: number;
  options: unknown;
  data: readonly unknown[];
};

export type RestorableBaselineSeriesSnapshot = {
  kind: "baseline";
  paneIndex: number;
  options: unknown;
  data: readonly unknown[];
};

export type RestorableHistogramSeriesSnapshot = {
  kind: "histogram";
  paneIndex: number;
  options: unknown;
  data: readonly unknown[];
};

export type RestorableVolumeSeriesSnapshot = {
  kind: "volume";
  paneIndex: number;
  options: unknown;
  data: readonly unknown[];
};

export type RestorableSeriesSnapshot =
  | RestorableCandlestickSeriesSnapshot
  | RestorableBarSeriesSnapshot
  | RestorableLineSeriesSnapshot
  | RestorableAreaSeriesSnapshot
  | RestorableBaselineSeriesSnapshot
  | RestorableHistogramSeriesSnapshot
  | RestorableVolumeSeriesSnapshot;

export type RestorableOverlayStudySnapshot = {
  type: "overlay";
  paneIndex: number;
  seriesOptions: unknown;
  data: readonly unknown[];
};

export type RestorableCompareStudySnapshot = {
  type: "compare";
  paneIndex: number;
  seriesOptions: unknown;
  compareOptions: unknown;
  data: readonly unknown[];
};

export type RestorableMovingAverageStudySnapshot = {
  type: "moving-average";
  paneIndex: number;
  seriesOptions: unknown;
  studyOptions: unknown;
};

export type RestorableStudySnapshot =
  | RestorableOverlayStudySnapshot
  | RestorableCompareStudySnapshot
  | RestorableMovingAverageStudySnapshot;

export type SeriesRestoreDependencies<
  PaneTarget,
  SeriesSnapshot extends RestorableSeriesSnapshot,
> = {
  resolvePaneTarget(paneIndex: number): PaneTarget;
  restoreCandlestick(
    target: PaneTarget,
    snapshot: Extract<SeriesSnapshot, RestorableCandlestickSeriesSnapshot>,
  ): void;
  restoreBar(
    target: PaneTarget,
    snapshot: Extract<SeriesSnapshot, RestorableBarSeriesSnapshot>,
  ): void;
  restoreLine(
    target: PaneTarget,
    snapshot: Extract<SeriesSnapshot, RestorableLineSeriesSnapshot>,
  ): void;
  restoreArea(
    target: PaneTarget,
    snapshot: Extract<SeriesSnapshot, RestorableAreaSeriesSnapshot>,
  ): void;
  restoreBaseline(
    target: PaneTarget,
    snapshot: Extract<SeriesSnapshot, RestorableBaselineSeriesSnapshot>,
  ): void;
  restoreHistogram(
    target: PaneTarget,
    snapshot: Extract<SeriesSnapshot, RestorableHistogramSeriesSnapshot>,
  ): void;
  restoreVolume(
    target: PaneTarget,
    snapshot: Extract<SeriesSnapshot, RestorableVolumeSeriesSnapshot>,
  ): void;
};

export type StudyRestoreDependencies<
  PaneId,
  StudySnapshot extends RestorableStudySnapshot,
> = {
  resolvePaneId(paneIndex: number): PaneId;
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
};

export function restoreSeriesCollection<
  PaneTarget,
  SeriesSnapshot extends RestorableSeriesSnapshot,
>(
  series: readonly SeriesSnapshot[],
  deps: SeriesRestoreDependencies<PaneTarget, SeriesSnapshot>,
): void {
  for (const item of series) {
    const target = deps.resolvePaneTarget(item.paneIndex);

    switch (item.kind) {
      case "candlestick":
        deps.restoreCandlestick(target, item as Extract<SeriesSnapshot, RestorableCandlestickSeriesSnapshot>);
        break;
      case "bar":
        deps.restoreBar(target, item as Extract<SeriesSnapshot, RestorableBarSeriesSnapshot>);
        break;
      case "line":
        deps.restoreLine(target, item as Extract<SeriesSnapshot, RestorableLineSeriesSnapshot>);
        break;
      case "area":
        deps.restoreArea(target, item as Extract<SeriesSnapshot, RestorableAreaSeriesSnapshot>);
        break;
      case "baseline":
        deps.restoreBaseline(target, item as Extract<SeriesSnapshot, RestorableBaselineSeriesSnapshot>);
        break;
      case "histogram":
        deps.restoreHistogram(target, item as Extract<SeriesSnapshot, RestorableHistogramSeriesSnapshot>);
        break;
      case "volume":
        deps.restoreVolume(target, item as Extract<SeriesSnapshot, RestorableVolumeSeriesSnapshot>);
        break;
    }
  }
}

export function restoreStudyCollection<
  PaneId,
  StudySnapshot extends RestorableStudySnapshot,
>(
  studies: readonly StudySnapshot[],
  deps: StudyRestoreDependencies<PaneId, StudySnapshot>,
): void {
  for (const study of studies) {
    const paneId = deps.resolvePaneId(study.paneIndex);

    switch (study.type) {
      case "overlay":
        deps.restoreOverlay(paneId, study as Extract<StudySnapshot, RestorableOverlayStudySnapshot>);
        break;
      case "compare":
        deps.restoreCompare(paneId, study as Extract<StudySnapshot, RestorableCompareStudySnapshot>);
        break;
      case "moving-average":
        deps.restoreMovingAverage(paneId, study as Extract<StudySnapshot, RestorableMovingAverageStudySnapshot>);
        break;
    }
  }
}
