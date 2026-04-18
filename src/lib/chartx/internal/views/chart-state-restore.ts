export type RestorableSecondaryPaneState = {
  height: number | null;
  resizable: boolean;
};

export type RestorableTimeScaleState = {
  barSpacing: number | null;
  rightOffset: number;
  visibleLogicalRange: { from: number; to: number } | null;
};

export type RestorablePriceScaleState = {
  visibleRange: { minValue: number; maxValue: number } | null;
  scaleSeriesOnly: boolean;
};

export type RestorableTradeLocationState<Request, Overlay> = {
  request: Request;
  overlay: Overlay;
};

export type RestorableChartState<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay,
> = {
  options: Options;
  panes: readonly RestorableSecondaryPaneState[];
  mainSeries: MainSeriesState | null;
  series: readonly SeriesState[];
  studies: readonly StudyState[];
  drawings: readonly DrawingState[];
  tradeLocation: RestorableTradeLocationState<TradeRequest, TradeOverlay> | null;
  timeScale: RestorableTimeScaleState;
  priceScale: RestorablePriceScaleState;
};

export type ChartStateRestoreDependencies<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay,
> = {
  applyOptions(options: Options): void;
  clearSelection(): void;
  clearDrawings(): void;
  clearStudies(): void;
  clearSeries(): void;
  clearTradeLocation(): void;
  listSecondaryPaneIds(): readonly string[];
  getSecondarySeriesCountForPane(paneId: string): number;
  removeSecondaryPane(paneId: string): void;
  addSecondaryPane(state: RestorableSecondaryPaneState): void;
  applySecondaryPaneState(index: number, state: RestorableSecondaryPaneState): void;
  applyMainSeriesState(state: MainSeriesState): void;
  restoreSeries(series: readonly SeriesState[]): void;
  restoreStudies(studies: readonly StudyState[]): void;
  locateTrade(request: TradeRequest, overlay: TradeOverlay): void;
  restoreDrawings(drawings: readonly DrawingState[]): void;
  applyTimeScaleState(state: RestorableTimeScaleState): void;
  applyPriceScaleState(state: RestorablePriceScaleState): void;
  finalize(): void;
};

export function restoreChartState<
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
  deps: ChartStateRestoreDependencies<
    Options,
    MainSeriesState,
    SeriesState,
    StudyState,
    DrawingState,
    TradeRequest,
    TradeOverlay
  >,
): void {
  deps.applyOptions(state.options);
  deps.clearSelection();
  deps.clearDrawings();
  deps.clearStudies();
  deps.clearSeries();
  deps.clearTradeLocation();

  reconcileSecondaryPanes(state.panes, deps);

  if (state.mainSeries !== null) {
    deps.applyMainSeriesState(state.mainSeries);
  }

  deps.restoreSeries(state.series);
  deps.restoreStudies(state.studies);

  if (state.tradeLocation !== null) {
    deps.locateTrade(state.tradeLocation.request, state.tradeLocation.overlay);
  }

  deps.restoreDrawings(state.drawings);
  deps.applyTimeScaleState(state.timeScale);
  deps.applyPriceScaleState(state.priceScale);
  deps.finalize();
}

function reconcileSecondaryPanes<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay,
>(
  panes: readonly RestorableSecondaryPaneState[],
  deps: Pick<
    ChartStateRestoreDependencies<
      Options,
      MainSeriesState,
      SeriesState,
      StudyState,
      DrawingState,
      TradeRequest,
      TradeOverlay
    >,
    | "listSecondaryPaneIds"
    | "getSecondarySeriesCountForPane"
    | "removeSecondaryPane"
    | "addSecondaryPane"
    | "applySecondaryPaneState"
  >,
): void {
  const currentSecondaryPaneIds = [...deps.listSecondaryPaneIds()];
  const targetPaneCount = panes.length;

  for (let index = currentSecondaryPaneIds.length - 1; index >= targetPaneCount; index -= 1) {
    const paneId = currentSecondaryPaneIds[index];
    if (paneId === undefined) {
      continue;
    }
    if (deps.getSecondarySeriesCountForPane(paneId) > 0) {
      throw new Error("chartx phase-one chart cannot remove snapshot-excess panes while series are attached");
    }
    deps.removeSecondaryPane(paneId);
  }

  while (deps.listSecondaryPaneIds().length < targetPaneCount) {
    const nextIndex = deps.listSecondaryPaneIds().length;
    deps.addSecondaryPane(panes[nextIndex] ?? { height: null, resizable: true });
  }

  panes.forEach((paneState, index) => {
    deps.applySecondaryPaneState(index, paneState);
  });
}
