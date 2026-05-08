import {
  restoreChartState,
  type ChartStateRestoreDependencies,
  type RestorableChartState,
  type RestorablePriceScaleState,
  type RestorableSecondaryPaneState,
  type RestorableTimeScaleState,
  type RestorableTradeLocationState,
} from "./chart-state-restore";

export type ChartStateSnapshotDependencies<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay,
> = {
  getOptions(): Options;
  getTimeScaleState(): RestorableTimeScaleState;
  getPriceScaleState(): RestorablePriceScaleState;
  getPanesState(): readonly RestorableSecondaryPaneState[];
  getMainSeriesState(): MainSeriesState | null;
  getSeriesState(): readonly SeriesState[];
  getStudiesState(): readonly StudyState[];
  getTradeLocationState(): RestorableTradeLocationState<TradeRequest, TradeOverlay> | null;
  getDrawingsState(): readonly DrawingState[];
};

export function createChartStateSnapshot<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay,
>(
  deps: ChartStateSnapshotDependencies<
    Options,
    MainSeriesState,
    SeriesState,
    StudyState,
    DrawingState,
    TradeRequest,
    TradeOverlay
  >,
): RestorableChartState<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay
> {
  return {
    options: deps.getOptions(),
    timeScale: deps.getTimeScaleState(),
    priceScale: deps.getPriceScaleState(),
    panes: [...deps.getPanesState()],
    mainSeries: deps.getMainSeriesState(),
    series: [...deps.getSeriesState()],
    studies: [...deps.getStudiesState()],
    tradeLocation: deps.getTradeLocationState(),
    drawings: [...deps.getDrawingsState()],
  };
}

export type ValidatedChartStateApplicationDependencies<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay,
> = {
  validateDrawings(
    drawings: readonly DrawingState[],
    secondaryPaneCount: number,
  ): void;
  restoreDeps: ChartStateRestoreDependencies<
    Options,
    MainSeriesState,
    SeriesState,
    StudyState,
    DrawingState,
    TradeRequest,
    TradeOverlay
  >;
};

export function applyValidatedChartState<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay,
>(
  state: RestorableChartState<
    Options,
    MainSeriesState,
    SeriesState,
    StudyState,
    DrawingState,
    TradeRequest,
    TradeOverlay
  >,
  deps: ValidatedChartStateApplicationDependencies<
    Options,
    MainSeriesState,
    SeriesState,
    StudyState,
    DrawingState,
    TradeRequest,
    TradeOverlay
  >,
): void {
  deps.validateDrawings(state.drawings, state.panes.length);
  restoreChartState(state, deps.restoreDeps);
}
