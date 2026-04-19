import {
  restoreSeriesCollection,
  type RestorableAreaSeriesSnapshot,
  type RestorableBarSeriesSnapshot,
  type RestorableBaselineSeriesSnapshot,
  type RestorableCandlestickSeriesSnapshot,
  type RestorableHistogramSeriesSnapshot,
  type RestorableLineSeriesSnapshot,
  type RestorableSeriesSnapshot,
  type RestorableVolumeSeriesSnapshot,
} from "./chart-content-restore";
import { requireRestorablePane } from "./chart-restore-pane";

export function restoreChartSeries<
  PaneState,
  PaneTarget,
  SeriesSnapshot extends RestorableSeriesSnapshot,
>(
  series: readonly SeriesSnapshot[],
  deps: {
    getPaneByIndex(index: number): PaneState | undefined;
    createPaneTarget(pane: PaneState): PaneTarget;
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
  },
): void {
  restoreSeriesCollection(series, {
    resolvePaneTarget: (paneIndex) => deps.createPaneTarget(requireRestorablePane(paneIndex, deps)),
    restoreCandlestick: deps.restoreCandlestick,
    restoreBar: deps.restoreBar,
    restoreLine: deps.restoreLine,
    restoreArea: deps.restoreArea,
    restoreBaseline: deps.restoreBaseline,
    restoreHistogram: deps.restoreHistogram,
    restoreVolume: deps.restoreVolume,
  });
}
