import type {
  PhaseOneChartApi,
  PhaseOneChartStateSnapshot,
  PhaseOneChartTemplateInput,
  PhaseOneClickHandler,
  PhaseOneDrawingSelectionChangeHandler,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOneMainSeriesStateSnapshot,
  PhaseOnePaneApi,
  PhaseOnePaneEventHandler,
  PhaseOnePaneOptions,
  PhaseOneSeriesTarget,
  PhaseOneTrendLineDrawingOptions,
  PhaseOneVolumeSeriesTarget,
  PhaseOneCrosshairMoveHandler,
} from "./chart-harness";

export type ChartHarnessPublicLike = {
  addCandlestickSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addCandlestickSeries"]>;
  addBarSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addBarSeries"]>;
  addLineSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addLineSeries"]>;
  addAreaSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addAreaSeries"]>;
  addBaselineSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addBaselineSeries"]>;
  addHistogramSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addHistogramSeries"]>;
  addVolumeSeries(target?: PhaseOneVolumeSeriesTarget): ReturnType<PhaseOneChartApi["addVolumeSeries"]>;
  addOverlaySeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addOverlaySeries"]>;
  addCompareSeries(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addCompareSeries"]>;
  addMovingAverageStudy(target?: PhaseOneSeriesTarget): ReturnType<PhaseOneChartApi["addMovingAverageStudy"]>;
  addHorizontalLineDrawing(
    target?: PhaseOneSeriesTarget,
    options?: PhaseOneHorizontalLineDrawingOptions,
  ): ReturnType<PhaseOneChartApi["addHorizontalLineDrawing"]>;
  addTrendLineDrawing(
    target?: PhaseOneSeriesTarget,
    options?: PhaseOneTrendLineDrawingOptions,
  ): ReturnType<PhaseOneChartApi["addTrendLineDrawing"]>;
  getSelectedDrawing(): ReturnType<PhaseOneChartApi["getSelectedDrawing"]>;
  getSelectedDrawingState(): ReturnType<PhaseOneChartApi["getSelectedDrawingState"]>;
  getSelectedDrawingPropertySchema(): ReturnType<PhaseOneChartApi["getSelectedDrawingPropertySchema"]>;
  applySelectedDrawingOptions(options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions): void;
  clearSelectedDrawing(): void;
  subscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void;
  unsubscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void;
  panesApi(): readonly PhaseOnePaneApi[];
  addPane(options?: PhaseOnePaneOptions): PhaseOnePaneApi;
  removePaneByHandle(pane: PhaseOnePaneApi): void;
  applyOptions(options: Parameters<PhaseOneChartApi["applyOptions"]>[0]): void;
  getChartType(): ReturnType<PhaseOneChartApi["getChartType"]>;
  getMainSeriesState(): PhaseOneMainSeriesStateSnapshot | null;
  applyMainSeriesState(state: PhaseOneMainSeriesStateSnapshot): ReturnType<PhaseOneChartApi["applyMainSeriesState"]>;
  getChartState(): PhaseOneChartStateSnapshot;
  applyChartState(state: PhaseOneChartStateSnapshot): void;
  getChartTemplate(): ReturnType<PhaseOneChartApi["getChartTemplate"]>;
  applyChartTemplate(template: PhaseOneChartTemplateInput): void;
  setChartType(type: Parameters<PhaseOneChartApi["setChartType"]>[0]): ReturnType<PhaseOneChartApi["setChartType"]>;
  locateTrade(
    request: Parameters<PhaseOneChartApi["locateTrade"]>[0],
    options?: Parameters<PhaseOneChartApi["locateTrade"]>[1],
  ): ReturnType<PhaseOneChartApi["locateTrade"]>;
  clearTradeLocation(): void;
  getTradeLocationState(): ReturnType<PhaseOneChartApi["getTradeLocationState"]>;
  subscribeChartTypeChange(handler: Parameters<PhaseOneChartApi["subscribeChartTypeChange"]>[0]): void;
  unsubscribeChartTypeChange(handler: Parameters<PhaseOneChartApi["unsubscribeChartTypeChange"]>[0]): void;
  removeSeries(series: Parameters<PhaseOneChartApi["removeSeries"]>[0]): void;
  resize(width: number, height: number): void;
  timeScaleApi(): ReturnType<PhaseOneChartApi["timeScale"]>;
  priceScaleApi(): ReturnType<PhaseOneChartApi["priceScale"]>;
  subscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void;
  unsubscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void;
  subscribeClick(handler: PhaseOneClickHandler): void;
  unsubscribeClick(handler: PhaseOneClickHandler): void;
  subscribePaneEvents(handler: PhaseOnePaneEventHandler): void;
  unsubscribePaneEvents(handler: PhaseOnePaneEventHandler): void;
  detach(): void;
};

export function createChartPublicApi(harness: ChartHarnessPublicLike): PhaseOneChartApi {
  return {
    addCandlestickSeries(target) {
      return harness.addCandlestickSeries(target);
    },
    addBarSeries(target) {
      return harness.addBarSeries(target);
    },
    addLineSeries(target) {
      return harness.addLineSeries(target);
    },
    addAreaSeries(target) {
      return harness.addAreaSeries(target);
    },
    addBaselineSeries(target) {
      return harness.addBaselineSeries(target);
    },
    addHistogramSeries(target) {
      return harness.addHistogramSeries(target);
    },
    addVolumeSeries(target) {
      return harness.addVolumeSeries(target);
    },
    addOverlaySeries(target) {
      return harness.addOverlaySeries(target);
    },
    addCompareSeries(target) {
      return harness.addCompareSeries(target);
    },
    addMovingAverageStudy(target) {
      return harness.addMovingAverageStudy(target);
    },
    addHorizontalLineDrawing(target, options) {
      return harness.addHorizontalLineDrawing(target, options);
    },
    addTrendLineDrawing(target, options) {
      return harness.addTrendLineDrawing(target, options);
    },
    getSelectedDrawing() {
      return harness.getSelectedDrawing();
    },
    getSelectedDrawingState() {
      return harness.getSelectedDrawingState();
    },
    getSelectedDrawingPropertySchema() {
      return harness.getSelectedDrawingPropertySchema();
    },
    applySelectedDrawingOptions(options) {
      harness.applySelectedDrawingOptions(options);
    },
    clearSelectedDrawing() {
      harness.clearSelectedDrawing();
    },
    subscribeDrawingSelectionChange(handler) {
      harness.subscribeDrawingSelectionChange(handler);
    },
    unsubscribeDrawingSelectionChange(handler) {
      harness.unsubscribeDrawingSelectionChange(handler);
    },
    panes() {
      return harness.panesApi();
    },
    addPane(options) {
      return harness.addPane(options);
    },
    removePane(pane) {
      harness.removePaneByHandle(pane);
    },
    applyOptions(options) {
      harness.applyOptions(options);
    },
    getChartType() {
      return harness.getChartType();
    },
    getMainSeriesState() {
      return harness.getMainSeriesState();
    },
    applyMainSeriesState(state) {
      return harness.applyMainSeriesState(state);
    },
    getChartState() {
      return harness.getChartState();
    },
    applyChartState(state) {
      harness.applyChartState(state);
    },
    getChartTemplate() {
      return harness.getChartTemplate();
    },
    applyChartTemplate(template) {
      harness.applyChartTemplate(template);
    },
    setChartType(type) {
      return harness.setChartType(type);
    },
    locateTrade(request, options) {
      return harness.locateTrade(request, options);
    },
    clearTradeLocation() {
      harness.clearTradeLocation();
    },
    getTradeLocationState() {
      return harness.getTradeLocationState();
    },
    subscribeChartTypeChange(handler) {
      harness.subscribeChartTypeChange(handler);
    },
    unsubscribeChartTypeChange(handler) {
      harness.unsubscribeChartTypeChange(handler);
    },
    removeSeries(series) {
      harness.removeSeries(series);
    },
    resize(width, height) {
      harness.resize(width, height);
    },
    timeScale() {
      return harness.timeScaleApi();
    },
    priceScale() {
      return harness.priceScaleApi();
    },
    subscribeCrosshairMove(handler) {
      harness.subscribeCrosshairMove(handler);
    },
    unsubscribeCrosshairMove(handler) {
      harness.unsubscribeCrosshairMove(handler);
    },
    subscribeClick(handler) {
      harness.subscribeClick(handler);
    },
    unsubscribeClick(handler) {
      harness.unsubscribeClick(handler);
    },
    subscribePaneEvents(handler) {
      harness.subscribePaneEvents(handler);
    },
    unsubscribePaneEvents(handler) {
      harness.unsubscribePaneEvents(handler);
    },
    destroy() {
      harness.detach();
    },
  };
}
