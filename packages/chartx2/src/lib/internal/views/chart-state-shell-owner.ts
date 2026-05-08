import { createChartStateCoordinator } from "./chart-state-coordinator";
import { createChartStateRestoreCommandOwner } from "./chart-state-restore-command-owner";
import { createChartStateSnapshotInputOwner } from "./chart-state-snapshot-input-owner";
import type {
  SnapshotDrawingLike,
  SnapshotSeriesSourceLike,
  SnapshotStudySourceLike,
} from "./chart-state-snapshot-builders";
import type {
  PhaseOneChartOptions,
  PhaseOneChartStateSnapshot,
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

type TradeLocationSession = {
  request: NonNullable<PhaseOneChartStateSnapshot["tradeLocation"]>["request"];
  options: NonNullable<PhaseOneChartStateSnapshot["tradeLocation"]>["overlay"];
};

type DrawingMagnetSources = {
  open: boolean;
  high: boolean;
  low: boolean;
  close: boolean;
};

type DrawingMagnetOptions = {
  magnetEnabled: boolean;
  magnetTolerancePx: number;
  timeMagnetEnabled: boolean;
  timeMagnetPolicy: "nearest" | "previous" | "next";
  timeMagnetTolerancePx: number;
  magnetSources: DrawingMagnetSources;
};

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

type RestorableScriptedStudyApi = {
  applyOptions(options: unknown): void;
  applyStudyOptions(options: unknown): void;
};

type StateCoordinatorLike = ReturnType<typeof createChartStateCoordinator>;

export function createChartStateShellOwner<
  Drawing extends DrawingDescriptor,
  Source extends StudySourceLike,
>(deps: {
  snapshotInput: {
    getLayoutOptions(): Required<NonNullable<PhaseOneChartOptions["layout"]>>;
    getCrosshairOptions(): Required<NonNullable<PhaseOneChartOptions["crosshair"]>>;
    getBarSpacing(): number | null;
    getRightOffset(): number;
    getVisibleLogicalRange(): { from: number; to: number } | null;
    getVisiblePriceRange(): { minValue: number; maxValue: number } | null;
    getPrimaryScaleSeriesOnly(): boolean;
    getActiveTradeLocation(): TradeLocationSession | null;
    listDrawings(): readonly Drawing[];
    getDrawingOptions(): DrawingMagnetOptions;
  };
  coordinator: {
    listPanes(): readonly PaneLike[];
    getMainSeriesState(): PhaseOneMainSeriesStateSnapshot | null;
    listStudySources(): readonly Source[];
    getPaneIndex(paneId: string): number;
    getDefaultCompareOptions(): unknown;
  };
  restoreCommands: {
    applyOptions(options: PhaseOneChartStateSnapshot["options"]): void;
    clearSelection(): void;
    clearTradeLocation(): void;
    removeSourcesWhere(predicate: (source: Source) => boolean): void;
    removeDrawingByApi(api: unknown): void;
    removeDrawing(api: unknown): void;
    getSecondarySeriesCountForPane(paneId: string): number;
    removeSecondaryPane(paneId: string): void;
    addPane(options?: { height?: number; resizable?: boolean }): void;
    emitPaneEvent(type: PhaseOnePaneEventType, paneId: string): void;
    applyMainSeriesState(state: NonNullable<PhaseOneChartStateSnapshot["mainSeries"]>): void;
    getPaneByIndex(index: number): PaneLike | undefined;
    createPaneHandle(paneId: string): unknown;
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
    addScriptedStudy(
      paneId: string,
      studyOptions?: Extract<PhaseOneChartStateSnapshot["studies"][number], { type: "scripted-study" }>["studyOptions"],
    ): RestorableScriptedStudyApi;
    locateTrade(
      request: NonNullable<PhaseOneChartStateSnapshot["tradeLocation"]>["request"],
      overlay: NonNullable<PhaseOneChartStateSnapshot["tradeLocation"]>["overlay"],
    ): void;
    restoreDrawings(drawings: PhaseOneChartStateSnapshot["drawings"]): void;
    applyTimeScaleOptions(options: { barSpacing?: number; rightOffset?: number }): void;
    setVisibleLogicalRange(range: { from: number; to: number }): void;
    applyPriceScaleOptions(options: { scaleSeriesOnly: boolean }): void;
    setVisibleRange(range: { minValue: number; maxValue: number } | null): void;
    hasCanvas(): boolean;
    render(): void;
  };
}) : {
  coordinator(): StateCoordinatorLike;
} {
  const snapshotInputOwner = createChartStateSnapshotInputOwner<Drawing>(deps.snapshotInput);
  const restoreCommandOwner = createChartStateRestoreCommandOwner<PaneLike, Source>({
    ...deps.restoreCommands,
  });
  const stateCoordinator = createChartStateCoordinator({
    getOptions: snapshotInputOwner.getOptions,
    getTimeScaleState: snapshotInputOwner.getTimeScaleState,
    getPriceScaleState: snapshotInputOwner.getPriceScaleState,
    listPanes: deps.coordinator.listPanes,
    getMainSeriesState: deps.coordinator.getMainSeriesState,
    listStudySources: deps.coordinator.listStudySources,
    getPaneIndex: deps.coordinator.getPaneIndex,
    getDefaultCompareOptions: deps.coordinator.getDefaultCompareOptions,
    getTradeLocationState: snapshotInputOwner.getTradeLocationState,
    listDrawings: snapshotInputOwner.listDrawings,
    resolveDrawingMagnetOptions: snapshotInputOwner.resolveDrawingMagnetOptions,
    validateDrawings: snapshotInputOwner.validateDrawings,
    ...restoreCommandOwner,
  });

  return {
    coordinator: () => stateCoordinator,
  };
}
