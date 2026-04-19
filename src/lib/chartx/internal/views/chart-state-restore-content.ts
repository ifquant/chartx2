import { restoreDrawingCollection, type RestorableDrawingSnapshot } from "./chart-drawing-restore";
import {
  type RestorableSeriesSnapshot,
  type RestorableStudySnapshot,
} from "./chart-content-restore";
import { requireRestorablePane } from "./chart-restore-pane";
import { restoreChartSeries } from "./chart-series-restore";
import { restoreChartStudies } from "./chart-study-restore";

type RestorableDataSeriesApi = {
  applyOptions(options: unknown): void;
  setData(data: readonly unknown[]): void;
};

type RestorableMovingAverageApi = {
  applyOptions(options: unknown): void;
  applyStudyOptions(options: unknown): void;
};

type RestorableCompareApi = RestorableDataSeriesApi & {
  applyCompareOptions(options: unknown): void;
};

export function restoreStateSeriesContent<
  PaneState,
  PaneTarget,
  SeriesSnapshot extends RestorableSeriesSnapshot,
>(
  series: readonly SeriesSnapshot[],
  deps: {
    getPaneByIndex(index: number): PaneState | undefined;
    createPaneTarget(pane: PaneState): PaneTarget;
    addCandlestick(target: PaneTarget): RestorableDataSeriesApi;
    addBar(target: PaneTarget): RestorableDataSeriesApi;
    addLine(target: PaneTarget): RestorableDataSeriesApi;
    addArea(target: PaneTarget): RestorableDataSeriesApi;
    addBaseline(target: PaneTarget): RestorableDataSeriesApi;
    addHistogram(target: PaneTarget): RestorableDataSeriesApi;
    addVolume(target: PaneTarget): RestorableDataSeriesApi;
  },
): void {
  restoreChartSeries(series, {
    getPaneByIndex: deps.getPaneByIndex,
    createPaneTarget: deps.createPaneTarget,
    restoreCandlestick: (target, snapshot) => {
      const restored = deps.addCandlestick(target);
      restored.applyOptions(snapshot.options);
      restored.setData(snapshot.data);
    },
    restoreBar: (target, snapshot) => {
      const restored = deps.addBar(target);
      restored.applyOptions(snapshot.options);
      restored.setData(snapshot.data);
    },
    restoreLine: (target, snapshot) => {
      const restored = deps.addLine(target);
      restored.applyOptions(snapshot.options);
      restored.setData(snapshot.data);
    },
    restoreArea: (target, snapshot) => {
      const restored = deps.addArea(target);
      restored.applyOptions(snapshot.options);
      restored.setData(snapshot.data);
    },
    restoreBaseline: (target, snapshot) => {
      const restored = deps.addBaseline(target);
      restored.applyOptions(snapshot.options);
      restored.setData(snapshot.data);
    },
    restoreHistogram: (target, snapshot) => {
      const restored = deps.addHistogram(target);
      restored.applyOptions(snapshot.options);
      restored.setData(snapshot.data);
    },
    restoreVolume: (target, snapshot) => {
      const restored = deps.addVolume(target);
      restored.applyOptions(snapshot.options);
      restored.setData(snapshot.data);
    },
  });
}

export function restoreStateStudiesContent<
  PaneState,
  PaneId,
  StudySnapshot extends RestorableStudySnapshot,
>(
  studies: readonly StudySnapshot[],
  deps: {
    getPaneByIndex(index: number): PaneState | undefined;
    getPaneId(pane: PaneState): PaneId;
    addOverlay(paneId: PaneId): RestorableDataSeriesApi;
    addCompare(paneId: PaneId): RestorableCompareApi;
    addMovingAverage(paneId: PaneId): RestorableMovingAverageApi;
  },
): void {
  restoreChartStudies(studies, {
    getPaneByIndex: deps.getPaneByIndex,
    getPaneId: deps.getPaneId,
    restoreOverlay: (paneId, snapshot) => {
      const overlay = deps.addOverlay(paneId);
      overlay.applyOptions(snapshot.seriesOptions);
      overlay.setData(snapshot.data);
    },
    restoreCompare: (paneId, snapshot) => {
      const compare = deps.addCompare(paneId);
      compare.applyOptions(snapshot.seriesOptions);
      compare.applyCompareOptions(snapshot.compareOptions);
      compare.setData(snapshot.data);
    },
    restoreMovingAverage: (paneId, snapshot) => {
      const movingAverage = deps.addMovingAverage(paneId);
      movingAverage.applyOptions(snapshot.seriesOptions);
      movingAverage.applyStudyOptions(snapshot.studyOptions);
    },
  });
}

export function restoreStateDrawingsContent<
  PaneState,
  PaneTarget,
  DrawingSnapshot extends RestorableDrawingSnapshot,
>(
  drawings: readonly DrawingSnapshot[],
  deps: {
    getPaneByIndex(index: number): PaneState | undefined;
    createPaneTarget(pane: PaneState): PaneTarget;
    addHorizontalLine(target: PaneTarget, options: Extract<DrawingSnapshot, { type: "horizontal-line" }>["options"]): void;
    addTrendLine(target: PaneTarget, options: Extract<DrawingSnapshot, { type: "trend-line" }>["options"]): void;
  },
): void {
  restoreDrawingCollection(drawings, {
    resolvePaneTarget: (paneIndex) => deps.createPaneTarget(requireRestorablePane(paneIndex, deps)),
    restoreHorizontalLine: (target, snapshot) => {
      deps.addHorizontalLine(target, snapshot.options);
    },
    restoreTrendLine: (target, snapshot) => {
      deps.addTrendLine(target, snapshot.options);
    },
  });
}
