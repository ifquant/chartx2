import type {
  ChartBarSequence,
  PaneModelState,
  PriceScale,
  TimeScale,
} from "../model";

type Layout = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type PanePoint = {
  x: number;
  y: number;
} | null;

type DrawingSnapGuideLike = {
  paneId: string;
  price: number | null;
  time: number | null;
};

type ContextSnapshot = {
  mainSourceId: string | null;
  barSequence: ChartBarSequence<number> & {
    axisBars: readonly unknown[];
  };
};

type ChartLayoutOptions = {
  backgroundColor: string;
  paneBackgroundColor: string;
  gridColor: string;
  frameColor: string;
  paneGap: number;
  axisTextColor: string;
  axisLabelBackground: string;
  axisLabelBorder: string;
  axisActiveBackground: string;
  axisActiveText: string;
};

type ChartCrosshairOptions = {
  lineColor: string;
  pointColor: string;
};

type ChartDrawingOptions = {
  magnetLabelVisible: boolean;
  timeMagnetLabelVisible: boolean;
};

export function createChartRenderInputOwner<
  MainSource,
  SeriesSource,
  Drawing,
  TradeLocationState,
>(deps: {
  dpr(): number;
  getLayout(canvas: HTMLCanvasElement): Layout;
  getChartOptions(): ChartLayoutOptions;
  getCrosshairOptions(): ChartCrosshairOptions;
  getDrawingOptions(): ChartDrawingOptions;
  getCrosshair(): PanePoint;
  getSelectedDrawingId(): string | null;
  getHoveredDrawingId(): string | null;
  getHoveredDrawingHandle(): "start" | "end" | null;
  getDrawingSnapGuide(): DrawingSnapGuideLike | null;
  getManualBarSpacing(): number | null;
  getRightOffset(): number;
  getPrimaryScaleSeriesOnly(): boolean;
  getPaneSpecs(): readonly PaneModelState[];
  getMainSource(): MainSource | null;
  createMainBarSequenceFromSource(source: MainSource): ChartBarSequence<number>;
  getContextSnapshot(): ContextSnapshot;
  getPrimaryStudies(): readonly SeriesSource[];
  buildPrimaryPaneSeries(mainSource: MainSource | null): readonly SeriesSource[];
  getStudySources(): readonly SeriesSource[];
  getSecondarySeriesForPane(paneId: string): readonly SeriesSource[];
  getDrawingsByPane(paneId: string): readonly Drawing[];
  getPaneIndex(paneId: string): number;
  getSecondaryScale(paneId: string): PriceScale | undefined;
  getPrimaryPriceScale(): PriceScale;
  getPrimaryPriceRangeOverride(): { toRaw(): { minValue: number; maxValue: number } } | null;
  getActiveTradeLocationState(): TradeLocationState | null;
  getTimeScale(): TimeScale;
  getTimeAxisFormatter(): ((time: number) => string) | null;
  getPriceAxisFormatter(): ((price: number) => string) | null;
}) {
  return {
    dpr: deps.dpr,
    getLayout: deps.getLayout,
    getChartOptions: deps.getChartOptions,
    getCrosshairOptions: deps.getCrosshairOptions,
    getDrawingOptions: deps.getDrawingOptions,
    getCrosshair: deps.getCrosshair,
    getSelectedDrawingId: deps.getSelectedDrawingId,
    getHoveredDrawingId: deps.getHoveredDrawingId,
    getHoveredDrawingHandle: deps.getHoveredDrawingHandle,
    getDrawingSnapGuide: deps.getDrawingSnapGuide,
    getManualBarSpacing: deps.getManualBarSpacing,
    getRightOffset: deps.getRightOffset,
    getPrimaryScaleSeriesOnly: deps.getPrimaryScaleSeriesOnly,
    getPaneSpecs: deps.getPaneSpecs,
    getMainSource: deps.getMainSource,
    createMainBarSequenceFromSource: deps.createMainBarSequenceFromSource,
    getContextSnapshot: deps.getContextSnapshot,
    getPrimaryStudies: deps.getPrimaryStudies,
    buildPrimaryPaneSeries: deps.buildPrimaryPaneSeries,
    getStudySources: deps.getStudySources,
    getSecondarySeriesForPane: deps.getSecondarySeriesForPane,
    getDrawingsByPane: deps.getDrawingsByPane,
    getPaneIndex: deps.getPaneIndex,
    getSecondaryScale: deps.getSecondaryScale,
    getPrimaryPriceScale: deps.getPrimaryPriceScale,
    getPrimaryPriceRangeOverride: deps.getPrimaryPriceRangeOverride,
    getActiveTradeLocationState: deps.getActiveTradeLocationState,
    getTimeScale: deps.getTimeScale,
    getTimeAxisFormatter: deps.getTimeAxisFormatter,
    getPriceAxisFormatter: deps.getPriceAxisFormatter,
  };
}
