import { applyChartTemplate, createChartTemplate, normalizeChartTemplate } from "./chart-template";
import { createValidatedChartStateApplicationDeps } from "./chart-state-apply-runtime";
import { applyValidatedChartState, createChartStateSnapshot } from "./chart-state";
import {
  applyRestorableMainSeriesState,
  applyRestorablePriceScaleState,
  applyRestorableTimeScaleState,
  applySecondaryPaneState as applySecondaryPaneStateUseCase,
  finalizeRestoredChart,
  listSecondaryPaneIds as listSecondaryPaneIdsUseCase,
  locateRestorableTrade,
} from "./chart-state-runtime";
import {
  clearRestorableDrawings as clearRestorableDrawingsUseCase,
  clearRestorableSeries as clearRestorableSeriesUseCase,
  clearRestorableStudies as clearRestorableStudiesUseCase,
} from "./chart-state-content-runtime";
import {
  restoreStateSeriesContent as restoreStateSeriesContentUseCase,
  restoreStateStudiesContent as restoreStateStudiesContentUseCase,
} from "./chart-state-restore-content";
import {
  buildDrawingStateSnapshots,
  buildSeriesStateSnapshots,
  buildStudyStateSnapshots,
  type SnapshotDrawingLike,
  type SnapshotSeriesSourceLike,
  type SnapshotStudySourceLike,
} from "./chart-state-snapshot-builders";
import type {
  PhaseOneChartOptions,
  PhaseOneChartStateSnapshot,
  PhaseOneChartTemplate,
  PhaseOneChartTemplateInput,
  PhaseOneMainSeriesStateSnapshot,
  PhaseOnePaneEventType,
  PhaseOneSeriesTarget,
} from "./chart-api-types";

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
  preferredHeight: number | null;
  resizable: boolean;
};

type ChartStateSeriesSnapshots = PhaseOneChartStateSnapshot["series"];
type ChartStateStudiesSnapshots = PhaseOneChartStateSnapshot["studies"];
type RestorableChartStateStudiesSnapshots = Extract<
  ChartStateStudiesSnapshots[number],
  { type: "overlay" | "compare" | "moving-average" }
>[];
type ChartStateDrawingSnapshots = PhaseOneChartStateSnapshot["drawings"];

type RestorableDataSeriesApi = {
  applyOptions(options: unknown): void;
  setData(data: readonly unknown[]): void;
};

type RestorableCompareApi = RestorableDataSeriesApi & {
  applyCompareOptions(options: unknown): void;
};

type RestorableMovingAverageApi = {
  applyOptions(options: unknown): void;
  applyStudyOptions(options: unknown): void;
};

type StudySourceLike = (
  | SnapshotSeriesSourceLike<string>
  | SnapshotStudySourceLike<string>
) & {
  role: string;
  indicator?: { kind?: string } | null;
};

type DrawingDescriptor = SnapshotDrawingLike<string> & {
  api: unknown;
};

export function createChartStateCoordinator(deps: {
  getOptions(): {
    layout: Required<NonNullable<PhaseOneChartOptions["layout"]>>;
    crosshair: Required<NonNullable<PhaseOneChartOptions["crosshair"]>>;
  };
  getTimeScaleState(): PhaseOneChartStateSnapshot["timeScale"];
  getPriceScaleState(): PhaseOneChartStateSnapshot["priceScale"];
  listPanes(): readonly PaneLike[];
  getMainSeriesState(): PhaseOneMainSeriesStateSnapshot | null;
  listStudySources(): readonly StudySourceLike[];
  getPaneIndex(paneId: string): number;
  getDefaultCompareOptions(): unknown;
  getTradeLocationState(): PhaseOneChartStateSnapshot["tradeLocation"];
  listDrawings(): readonly DrawingDescriptor[];
  resolveDrawingMagnetOptions(drawing: DrawingDescriptor): unknown;
  validateDrawings(drawings: ChartStateDrawingSnapshots, secondaryPaneCount: number): void;
  applyOptions(options: PhaseOneChartStateSnapshot["options"]): void;
  clearSelection(): void;
  clearTradeLocation(): void;
  removeSourcesWhere(predicate: (source: StudySourceLike) => boolean): void;
  removeDrawingByApi(api: unknown): void;
  removeDrawing(api: unknown): void;
  getSecondarySeriesCountForPane(paneId: string): number;
  removeSecondaryPane(paneId: string): void;
  addPane(options?: { height?: number; resizable?: boolean }): void;
  emitPaneEvent(type: PhaseOnePaneEventType, paneId: string): void;
  applyMainSeriesState(state: PhaseOneMainSeriesStateSnapshot): void;
  getPaneByIndex(index: number): PaneLike | undefined;
  createPaneTarget(pane: PaneLike): PhaseOneSeriesTarget;
  addCandlestickSeries(target?: PhaseOneSeriesTarget): RestorableDataSeriesApi;
  addBarSeries(target?: PhaseOneSeriesTarget): RestorableDataSeriesApi;
  addLineSeries(target?: PhaseOneSeriesTarget): RestorableDataSeriesApi;
  addAreaSeries(target?: PhaseOneSeriesTarget): RestorableDataSeriesApi;
  addBaselineSeries(target?: PhaseOneSeriesTarget): RestorableDataSeriesApi;
  addHistogramSeries(target?: PhaseOneSeriesTarget): RestorableDataSeriesApi;
  addVolumeSeries(target?: PhaseOneSeriesTarget): RestorableDataSeriesApi;
  addOverlaySeries(paneId: string): RestorableDataSeriesApi;
  addCompareSeries(paneId: string): RestorableCompareApi;
  addMovingAverageStudy(paneId: string): RestorableMovingAverageApi;
  locateTrade(
    request: NonNullable<PhaseOneChartStateSnapshot["tradeLocation"]>["request"],
    overlay: NonNullable<PhaseOneChartStateSnapshot["tradeLocation"]>["overlay"],
  ): void;
  restoreDrawings(drawings: ChartStateDrawingSnapshots): void;
  applyTimeScaleOptions(options: { barSpacing?: number; rightOffset?: number }): void;
  setVisibleLogicalRange(range: { from: number; to: number }): void;
  applyPriceScaleOptions(options: { scaleSeriesOnly: boolean }): void;
  setVisibleRange(range: { minValue: number; maxValue: number } | null): void;
  hasCanvas(): boolean;
  render(): void;
}) {
  return {
    getChartState(): PhaseOneChartStateSnapshot {
      return createChartStateSnapshot({
        getOptions: () => ({
          layout: { ...deps.getOptions().layout },
          crosshair: { ...deps.getOptions().crosshair },
        }),
        getTimeScaleState: () => deps.getTimeScaleState(),
        getPriceScaleState: () => deps.getPriceScaleState(),
        getPanesState: () =>
          deps
            .listPanes()
            .filter((pane) => pane.kind === "secondary")
            .map((pane) => ({
              height: pane.preferredHeight,
              resizable: pane.resizable,
            })),
        getMainSeriesState: () => deps.getMainSeriesState(),
        getSeriesState: () =>
          buildSeriesStateSnapshots(deps.listStudySources() as readonly SnapshotSeriesSourceLike<string>[], {
            getPaneIndex: (paneId) => deps.getPaneIndex(paneId),
          }),
        getStudiesState: () =>
          buildStudyStateSnapshots(deps.listStudySources() as readonly SnapshotStudySourceLike<string>[], {
            getPaneIndex: (paneId) => deps.getPaneIndex(paneId),
            defaultCompareOptions: deps.getDefaultCompareOptions() as never,
          }),
        getTradeLocationState: () => deps.getTradeLocationState(),
        getDrawingsState: () =>
          buildDrawingStateSnapshots(deps.listDrawings(), {
            getPaneIndex: (paneId) => deps.getPaneIndex(paneId),
            resolveMagnetOptions: (drawing) => deps.resolveDrawingMagnetOptions(drawing as DrawingDescriptor) as never,
          }),
      }) as PhaseOneChartStateSnapshot;
    },

    clearRestorableChartStudies(): void {
      clearRestorableStudiesUseCase({
        removeSourcesWhere: (predicate) => deps.removeSourcesWhere(predicate),
      });
    },

    clearRestorableChartSeries(): void {
      clearRestorableSeriesUseCase({
        removeSourcesWhere: (predicate) => deps.removeSourcesWhere(predicate),
      });
    },

    clearRestorableChartDrawings(): void {
      clearRestorableDrawingsUseCase({
        listDrawings: () => deps.listDrawings(),
        removeByApi: (api) => {
          deps.removeDrawingByApi(api);
          return undefined;
        },
      });
    },

    restoreChartSeries(series: ChartStateSeriesSnapshots): void {
      restoreStateSeriesContentUseCase([...series] as never, {
        getPaneByIndex: (paneIndex) => deps.getPaneByIndex(paneIndex),
        createPaneTarget: (pane) => deps.createPaneTarget(pane as PaneLike),
        addCandlestick: (target) => deps.addCandlestickSeries(target),
        addBar: (target) => deps.addBarSeries(target),
        addLine: (target) => deps.addLineSeries(target),
        addArea: (target) => deps.addAreaSeries(target),
        addBaseline: (target) => deps.addBaselineSeries(target),
        addHistogram: (target) => deps.addHistogramSeries(target),
        addVolume: (target) => deps.addVolumeSeries(target),
      });
    },

    restoreChartStudies(studies: ChartStateStudiesSnapshots): void {
      const restorableStudies = studies.filter(
        (study): study is RestorableChartStateStudiesSnapshots[number] =>
          study.type === "overlay" ||
          study.type === "compare" ||
          study.type === "moving-average",
      );

      restoreStateStudiesContentUseCase(restorableStudies, {
        getPaneByIndex: (paneIndex) => deps.getPaneByIndex(paneIndex),
        getPaneId: (pane) => (pane as PaneLike).id,
        addOverlay: (paneId) => deps.addOverlaySeries(paneId),
        addCompare: (paneId) => deps.addCompareSeries(paneId),
        addMovingAverage: (paneId) => deps.addMovingAverageStudy(paneId),
      });
    },

    restoreChartDrawings(drawings: ChartStateDrawingSnapshots): void {
      deps.restoreDrawings([...drawings] as ChartStateDrawingSnapshots);
    },

    applyChartState(state: PhaseOneChartStateSnapshot): void {
      applyValidatedChartState(state, createValidatedChartStateApplicationDeps({
        validateDrawings: deps.validateDrawings,
        options: {
          applyOptions: (options) => {
            deps.applyOptions(options);
          },
        },
        clearing: {
          clearSelection: () => {
            deps.clearSelection();
          },
          clearDrawings: () => this.clearRestorableChartDrawings(),
          clearStudies: () => this.clearRestorableChartStudies(),
          clearSeries: () => this.clearRestorableChartSeries(),
          clearTradeLocation: () => {
            deps.clearTradeLocation();
          },
        },
        panes: {
          listSecondaryPaneIds: () => listSecondaryPaneIdsUseCase({
            listPanes: () => deps.listPanes(),
          }),
          getSecondarySeriesCountForPane: (paneId) => deps.getSecondarySeriesCountForPane(paneId),
          removeSecondaryPane: (paneId) => {
            deps.removeSecondaryPane(paneId);
          },
          addSecondaryPane: (paneState) => {
            deps.addPane({
              height: paneState.height ?? undefined,
              resizable: paneState.resizable,
            });
          },
          applySecondaryPaneState: (index, paneState) => applySecondaryPaneStateUseCase(index, paneState, {
            listPanes: () => deps.listPanes(),
            emitPaneEvent: (type, paneId) => deps.emitPaneEvent(type, paneId),
          }),
        },
        content: {
          applyMainSeriesState: (mainSeriesState) => applyRestorableMainSeriesState(mainSeriesState, {
            applyMainSeriesState: (nextState) => {
              deps.applyMainSeriesState(nextState);
            },
          }),
          restoreSeries: (series) => this.restoreChartSeries(series as ChartStateSeriesSnapshots),
          restoreStudies: (studies) => this.restoreChartStudies(studies as ChartStateStudiesSnapshots),
          locateTrade: (request, overlay) => locateRestorableTrade({ request, overlay }, {
            locateTrade: (nextRequest, nextOverlay) => {
              deps.locateTrade(nextRequest, nextOverlay);
            },
          }),
          restoreDrawings: (drawings) => this.restoreChartDrawings(drawings as ChartStateDrawingSnapshots),
        },
        scales: {
          applyTimeScaleState: (timeScaleState) => applyRestorableTimeScaleState(timeScaleState, {
            applyOptions: (options) => deps.applyTimeScaleOptions(options),
            setVisibleLogicalRange: (range) => deps.setVisibleLogicalRange(range),
          }),
          applyPriceScaleState: (priceScaleState) => applyRestorablePriceScaleState(priceScaleState, {
            applyOptions: (options) => deps.applyPriceScaleOptions(options),
            setVisibleRange: (range) => deps.setVisibleRange(range),
          }),
        },
        finalize: {
          finalize: () => finalizeRestoredChart({
            hasCanvas: () => deps.hasCanvas(),
            render: () => {
              deps.render();
            },
          }),
        },
      }));
    },

    getChartTemplate(): PhaseOneChartTemplate {
      return createChartTemplate(this.getChartState());
    },

    applyChartTemplate(template: PhaseOneChartTemplateInput): void {
      applyChartTemplate(template, {
        normalize: normalizeChartTemplate,
        applyChartState: (state) => {
          this.applyChartState(state);
        },
      });
    },
  };
}
