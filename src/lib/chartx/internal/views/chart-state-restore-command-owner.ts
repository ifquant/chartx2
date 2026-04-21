import type {
  PhaseOneChartStateSnapshot,
  PhaseOnePaneEventType,
  PhaseOneSeriesTarget,
} from "./chart-harness";

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

export function createChartStateRestoreCommandOwner<
  Pane extends { id: string },
  Source,
>(deps: {
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
  getPaneByIndex(index: number): Pane | undefined;
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
}) {
  return {
    applyOptions: deps.applyOptions,
    clearSelection: deps.clearSelection,
    clearTradeLocation: deps.clearTradeLocation,
    removeSourcesWhere: deps.removeSourcesWhere,
    removeDrawingByApi: deps.removeDrawingByApi,
    removeDrawing: deps.removeDrawing,
    getSecondarySeriesCountForPane: deps.getSecondarySeriesCountForPane,
    removeSecondaryPane: deps.removeSecondaryPane,
    addPane: deps.addPane,
    emitPaneEvent: deps.emitPaneEvent,
    applyMainSeriesState: deps.applyMainSeriesState,
    getPaneByIndex: deps.getPaneByIndex,
    createPaneTarget: (pane: Pane): PhaseOneSeriesTarget => ({
      pane: deps.createPaneHandle(pane.id),
    }) as PhaseOneSeriesTarget,
    addCandlestickSeries: deps.addCandlestickSeries,
    addBarSeries: deps.addBarSeries,
    addLineSeries: deps.addLineSeries,
    addAreaSeries: deps.addAreaSeries,
    addBaselineSeries: deps.addBaselineSeries,
    addHistogramSeries: deps.addHistogramSeries,
    addVolumeSeries: deps.addVolumeSeries,
    addOverlaySeries: deps.addOverlaySeries,
    addCompareSeries: deps.addCompareSeries,
    addMovingAverageStudy: deps.addMovingAverageStudy,
    locateTrade: deps.locateTrade,
    restoreDrawings: deps.restoreDrawings,
    applyTimeScaleOptions: deps.applyTimeScaleOptions,
    setVisibleLogicalRange: deps.setVisibleLogicalRange,
    applyPriceScaleOptions: deps.applyPriceScaleOptions,
    setVisibleRange: deps.setVisibleRange,
    hasCanvas: deps.hasCanvas,
    render: deps.render,
  };
}
