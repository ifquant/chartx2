import type { PhaseOneMainChartType } from "../model";
import type {
  ChartHarnessPublicLike,
} from "./chart-public-api";
import type {
  PhaseOneChartApi,
  PhaseOneChartOptions,
  PhaseOneChartStateSnapshot,
  PhaseOneChartTemplate,
  PhaseOneChartTemplateInput,
  PhaseOneClickHandler,
  PhaseOneCompareSeriesApi,
  PhaseOneCrosshairMoveHandler,
  PhaseOneDrawingPropertySchema,
  PhaseOneDrawingSelectionChangeHandler,
  PhaseOneDrawingStateSnapshot,
  PhaseOneHorizontalLineDrawingApi,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOneMainSeriesApi,
  PhaseOneMainSeriesStateSnapshot,
  PhaseOneMovingAverageStudyApi,
  PhaseOnePaneApi,
  PhaseOnePaneEventHandler,
  PhaseOnePaneOptions,
  PhaseOneSelectedDrawing,
  PhaseOneSeriesTarget,
  PhaseOneTrendLineDrawingApi,
  PhaseOneTrendLineDrawingOptions,
  PhaseOneVolumeSeriesTarget,
} from "./chart-api-types";

type SeriesCommandOwner = {
  addCandlestickSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addCandlestickSeries"]>;
  addBarSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addBarSeries"]>;
  addLineSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addLineSeries"]>;
  addAreaSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addAreaSeries"]>;
  addBaselineSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addBaselineSeries"]>;
  addHistogramSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addHistogramSeries"]>;
  addVolumeSeries(target?: PhaseOneVolumeSeriesTarget): ReturnType<PhaseOneChartApi["addVolumeSeries"]>;
  addOverlaySeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addOverlaySeries"]>;
  addCompareSeries(target?: PhaseOneSeriesTarget): PhaseOneCompareSeriesApi;
  addMovingAverageStudy(target?: PhaseOneSeriesTarget): PhaseOneMovingAverageStudyApi;
  removeSeries(series: Parameters<PhaseOneChartApi["removeSeries"]>[0]): void;
};

type DrawingOwner = {
  addHorizontalLine(
    target?: PhaseOneSeriesTarget,
    options?: PhaseOneHorizontalLineDrawingOptions,
  ): PhaseOneHorizontalLineDrawingApi;
  addTrendLine(
    target?: PhaseOneSeriesTarget,
    options?: PhaseOneTrendLineDrawingOptions,
  ): PhaseOneTrendLineDrawingApi;
  getSelectedDrawing(): PhaseOneSelectedDrawing;
  getSelectedDrawingState(): PhaseOneDrawingStateSnapshot | null;
  getSelectedDrawingPropertySchema(): PhaseOneDrawingPropertySchema | null;
  applySelectedDrawingOptions(options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions): void;
  clearSelectedDrawing(): void;
};

type PaneOwner = {
  listPaneHandles(): readonly PhaseOnePaneApi[];
  addPane(options?: PhaseOnePaneOptions): PhaseOnePaneApi;
  removePaneByHandle(paneHandle: PhaseOnePaneApi): void;
};

type ShellOwner = {
  applyOptions(options: PhaseOneChartOptions): void;
  resize(width: number, height: number): void;
};

type ScaleOwner = {
  timeScaleApi(): ReturnType<PhaseOneChartApi["timeScale"]>;
  priceScaleApi(): ReturnType<PhaseOneChartApi["priceScale"]>;
};

type EventSubscriptionOwner = {
  subscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void;
  unsubscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void;
  subscribeClick(handler: PhaseOneClickHandler): void;
  unsubscribeClick(handler: PhaseOneClickHandler): void;
  subscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void;
  unsubscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void;
  subscribePaneEvents(handler: PhaseOnePaneEventHandler): void;
  unsubscribePaneEvents(handler: PhaseOnePaneEventHandler): void;
  subscribeChartTypeChange(handler: Parameters<PhaseOneChartApi["subscribeChartTypeChange"]>[0]): void;
  unsubscribeChartTypeChange(handler: Parameters<PhaseOneChartApi["unsubscribeChartTypeChange"]>[0]): void;
};

type RuntimeQueryOwner = {
  getChartType(): unknown;
};

type MainSeriesStateOwner = {
  getState(): PhaseOneMainSeriesStateSnapshot | null;
  applyState(state: PhaseOneMainSeriesStateSnapshot): PhaseOneMainSeriesApi;
};

type StateCoordinator = {
  getChartState(): PhaseOneChartStateSnapshot;
  applyChartState(state: PhaseOneChartStateSnapshot): void;
  getChartTemplate(): PhaseOneChartTemplate;
  applyChartTemplate(template: PhaseOneChartTemplateInput): void;
};

type TradeLocationOwner = {
  locate(
    request: Parameters<PhaseOneChartApi["locateTrade"]>[0],
    options?: Parameters<PhaseOneChartApi["locateTrade"]>[1],
  ): ReturnType<PhaseOneChartApi["locateTrade"]>;
  clear(): void;
  getState(): ReturnType<PhaseOneChartApi["getTradeLocationState"]>;
};

type SourceOwner = {
  setChartType(type: PhaseOneMainChartType): unknown;
};

export function createChartPublicSurfaceOwner(deps: {
  detach(): void;
  seriesCommandOwner: SeriesCommandOwner;
  drawingOwner: DrawingOwner;
  paneOwner: PaneOwner;
  shellOwner: ShellOwner;
  scaleOwner: ScaleOwner;
  eventSubscriptionOwner: EventSubscriptionOwner;
  runtimeQueryOwner: RuntimeQueryOwner;
  mainSeriesStateOwner: MainSeriesStateOwner;
  stateCoordinator: StateCoordinator;
  tradeLocationOwner: TradeLocationOwner;
  sourceOwner: SourceOwner;
}): {
  publicApiSurface(): ChartHarnessPublicLike;
} {
  return {
    publicApiSurface(): ChartHarnessPublicLike {
      return {
        addCandlestickSeries: (target) => deps.seriesCommandOwner.addCandlestickSeries(target),
        addBarSeries: (target) => deps.seriesCommandOwner.addBarSeries(target),
        addLineSeries: (target) => deps.seriesCommandOwner.addLineSeries(target),
        addAreaSeries: (target) => deps.seriesCommandOwner.addAreaSeries(target),
        addBaselineSeries: (target) => deps.seriesCommandOwner.addBaselineSeries(target),
        addHistogramSeries: (target) => deps.seriesCommandOwner.addHistogramSeries(target),
        addVolumeSeries: (target) => deps.seriesCommandOwner.addVolumeSeries(target),
        addOverlaySeries: (target) => deps.seriesCommandOwner.addOverlaySeries(target),
        addCompareSeries: (target) => deps.seriesCommandOwner.addCompareSeries(target),
        addMovingAverageStudy: (target) => deps.seriesCommandOwner.addMovingAverageStudy(target),
        addHorizontalLineDrawing: (target, options) => deps.drawingOwner.addHorizontalLine(target, options),
        addTrendLineDrawing: (target, options) => deps.drawingOwner.addTrendLine(target, options),
        getSelectedDrawing: () => deps.drawingOwner.getSelectedDrawing(),
        getSelectedDrawingState: () => deps.drawingOwner.getSelectedDrawingState(),
        getSelectedDrawingPropertySchema: () => deps.drawingOwner.getSelectedDrawingPropertySchema(),
        applySelectedDrawingOptions: (options) => {
          deps.drawingOwner.applySelectedDrawingOptions(options);
        },
        clearSelectedDrawing: () => {
          deps.drawingOwner.clearSelectedDrawing();
        },
        subscribeDrawingSelectionChange: (handler) => {
          deps.eventSubscriptionOwner.subscribeDrawingSelectionChange(handler);
        },
        unsubscribeDrawingSelectionChange: (handler) => {
          deps.eventSubscriptionOwner.unsubscribeDrawingSelectionChange(handler);
        },
        panesApi: () => deps.paneOwner.listPaneHandles(),
        addPane: (options) => deps.paneOwner.addPane(options),
        removePaneByHandle: (paneHandle) => {
          deps.paneOwner.removePaneByHandle(paneHandle);
        },
        applyOptions: (options) => {
          deps.shellOwner.applyOptions(options);
        },
        getChartType: () => deps.runtimeQueryOwner.getChartType() as PhaseOneMainChartType | null,
        getMainSeriesState: () => deps.mainSeriesStateOwner.getState(),
        applyMainSeriesState: (state) => deps.mainSeriesStateOwner.applyState(state),
        getChartState: () => deps.stateCoordinator.getChartState(),
        applyChartState: (state) => {
          deps.stateCoordinator.applyChartState(state);
        },
        getChartTemplate: () => deps.stateCoordinator.getChartTemplate(),
        applyChartTemplate: (template) => {
          deps.stateCoordinator.applyChartTemplate(template);
        },
        setChartType: (type) => deps.sourceOwner.setChartType(type) as PhaseOneMainSeriesApi,
        locateTrade: (request, options) => deps.tradeLocationOwner.locate(request, options),
        clearTradeLocation: () => {
          deps.tradeLocationOwner.clear();
        },
        getTradeLocationState: () => deps.tradeLocationOwner.getState(),
        subscribeChartTypeChange: (handler) => {
          deps.eventSubscriptionOwner.subscribeChartTypeChange(handler);
        },
        unsubscribeChartTypeChange: (handler) => {
          deps.eventSubscriptionOwner.unsubscribeChartTypeChange(handler);
        },
        removeSeries: (series) => {
          deps.seriesCommandOwner.removeSeries(series);
        },
        resize: (width, height) => {
          deps.shellOwner.resize(width, height);
        },
        timeScaleApi: () => deps.scaleOwner.timeScaleApi(),
        priceScaleApi: () => deps.scaleOwner.priceScaleApi(),
        subscribeCrosshairMove: (handler) => {
          deps.eventSubscriptionOwner.subscribeCrosshairMove(handler);
        },
        unsubscribeCrosshairMove: (handler) => {
          deps.eventSubscriptionOwner.unsubscribeCrosshairMove(handler);
        },
        subscribeClick: (handler) => {
          deps.eventSubscriptionOwner.subscribeClick(handler);
        },
        unsubscribeClick: (handler) => {
          deps.eventSubscriptionOwner.unsubscribeClick(handler);
        },
        subscribePaneEvents: (handler) => {
          deps.eventSubscriptionOwner.subscribePaneEvents(handler);
        },
        unsubscribePaneEvents: (handler) => {
          deps.eventSubscriptionOwner.unsubscribePaneEvents(handler);
        },
        detach: () => {
          deps.detach();
        },
      };
    },
  };
}
