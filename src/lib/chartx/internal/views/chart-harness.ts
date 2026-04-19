import {
  createCompressedPriceBasedChartBarSequence,
  createDirectionColumnPriceBasedChartBarSequence,
  createTimeBasedChartBarSequence,
  findNearestRowByLogical,
  applyMainSeriesStyleOptions,
  applyMainSeriesBuilder,
  buildHeikinAshiData,
  buildKagiData,
  buildLineBreakData,
  buildPointFigureData,
  buildRenkoData,
  assertDrawingTargetValid,
  ChartModel,
  createMainSeriesStateSnapshot,
  mainSeriesKindForChartType,
  mainSeriesStyleSchemaSpec,
  projectMainSeriesStyleOptions,
  resolveTradeLocationState,
  resolveTradeOverlayOptions,
  DrawingRegistry,
  DEFAULT_STUDY_MERGE_ENGINE,
  PaneCollection,
  PlotRowValueIndex,
  PriceRangeImpl,
  PriceScale,
  buildPaneFrames,
  normalizePaneHeight,
  resolvePaneDivider,
  resolvePaneDividerByIds,
  SeriesDataStore,
  TimeScale,
  type OhlcDataPoint,
  type ChartTemplateV1,
  type PhaseOneMainChartType,
  type PhaseOneMainSeriesBuilder,
  type PhaseOneMainSeriesInputCapability,
  type PhaseOneMainSeriesRenderer,
  type PhaseOneMainStyleSchemaId,
  type PhaseOneTradeLocationRequest,
  type PhaseOneTradeLocationState,
  type PhaseOneTradeOverlayOptions,
  type PhaseOneResolvedTradeOverlayOptions,
  type KagiStyleOptionsState,
  type PaneFrame,
  type PaneKind,
  type PaneModelState,
  type MainSeriesStyleOptionsPatch,
  type PointFigureStyleOptionsState,
  type MainSeriesStateSnapshot,
  type MovingAverageIndicatorState,
  type RenkoStyleOptionsState,
  type SeriesRuntimeFields,
  type SourceDescriptor,
  type StudyInputContextState,
  type StudySourceKind,
  type Logical,
  type TimePointIndex,
  type ChartBarSequence,
  type VersionedChartTemplateInput,
} from "../model";
import {
  AreaRenderer,
  BaselineRenderer,
  BarRenderer,
  CandlesticksRenderer,
  drawMainSeriesRenderer,
  GridRenderer,
  HistogramRenderer,
  KagiRenderer,
  LineRenderer,
  PointFigureRenderer,
} from "../renderers";
import type { Coordinate } from "../model";
import { restoreDrawingCollection, type RestorableDrawingSnapshot } from "./chart-drawing-restore";
import { createPrimarySeriesApi } from "./chart-primary-series-api";
import { attachMainSeriesSource, createMainSeriesSourceState } from "./chart-main-series-source";
import {
  createCompareStudySeriesApi,
  createMovingAverageStudySeriesApi,
  createSecondaryAreaSeriesApi,
  createSecondaryBarSeriesApi,
  createSecondaryBaselineSeriesApi,
  createSecondaryCandlestickSeriesApi,
  createSecondaryHistogramSeriesApi,
  createSecondaryLineSeriesApi,
  createSecondaryVolumeSeriesApi,
} from "./chart-secondary-series-api";
import {
  replaceMainHistogramLikeData,
  replaceMainSeriesData,
  replaceStudyHistogramLikeData,
  replaceStudySeriesData,
  updateMainHistogramLikeData,
  updateMainSeriesData,
  updateStudyHistogramLikeData,
  updateStudySeriesData,
} from "./chart-series-mutation";
import {
  applyCompareStudyOptions,
  applyMovingAverageStudyOptions,
  getCompareStudyOptions,
  getMovingAverageStudyOptions,
} from "./chart-study-options";
import {
  resolveStudyDisplayData as resolveStudyDisplayDataUseCase,
  syncStudyContextData as syncStudyContextDataUseCase,
} from "./chart-study-context";
import { applyMainSeriesStateSnapshot, buildMainSeriesStateSnapshot } from "./chart-main-series-state";
import { attachStudySource, createStudySourceState } from "./chart-study-source";
import { applyValidatedChartState, createChartStateSnapshot } from "./chart-state";
import {
  buildDrawingStateSnapshots,
  buildSeriesStateSnapshots,
  buildStudyStateSnapshots,
} from "./chart-state-snapshot-builders";
import { buildRawReadout as buildRawReadoutUseCase } from "./chart-readout";
import {
  renderPrimaryPaneContent as renderPrimaryPaneContentUseCase,
  renderSecondaryPaneContent as renderSecondaryPaneContentUseCase,
} from "./chart-pane-render";
import {
  renderPriceAxes as renderPriceAxesUseCase,
  renderTimeAxis as renderTimeAxisUseCase,
} from "./chart-axis-render";
import {
  buildCrosshairMoveEvent as buildCrosshairMoveEventUseCase,
  finishChartRender as finishChartRenderUseCase,
} from "./chart-render-tail";
import {
  prepareCanvasRenderSurface as prepareCanvasRenderSurfaceUseCase,
  renderEmptyPlotFrame as renderEmptyPlotFrameUseCase,
} from "./chart-render-surface";
import {
  applyPrimaryPaneScale as applyPrimaryPaneScaleUseCase,
  applySecondaryPaneScale as applySecondaryPaneScaleUseCase,
} from "./chart-pane-scale";
import {
  buildPrimaryPaneDecorations as buildPrimaryPaneDecorationsUseCase,
  buildSecondaryPaneDecorations as buildSecondaryPaneDecorationsUseCase,
  collectPanePriceLines as collectPanePriceLinesUseCase,
  selectPaneDrawingSnapGuide as selectPaneDrawingSnapGuideUseCase,
} from "./chart-pane-decorations";
import {
  resolveHitDrawing as resolveHitDrawingUseCase,
  resolveSelectedTrendLineDragHandle as resolveSelectedTrendLineDragHandleUseCase,
} from "./chart-drawing-hit-test";
import { applyTrendLineDrag as applyTrendLineDragUseCase } from "./chart-drawing-drag";
import {
  resolveDrawingMagnetOptions as resolveDrawingMagnetOptionsUseCase,
  resolveSnappedDrawingPrice as resolveSnappedDrawingPriceUseCase,
  resolveSnappedDrawingTime as resolveSnappedDrawingTimeUseCase,
} from "./chart-drawing-snap";
import {
  applyDrawingMagnetOverrides as applyDrawingMagnetOverridesUseCase,
  normalizeDrawingMagnetOverrides as normalizeDrawingMagnetOverridesUseCase,
} from "./chart-drawing-magnet";
import {
  applyHorizontalLineDrawingOptions as applyHorizontalLineDrawingOptionsUseCase,
  applyTrendLineDrawingOptions as applyTrendLineDrawingOptionsUseCase,
} from "./chart-drawing-options";
import {
  createDrawingMeta as createDrawingMetaUseCase,
  resolveTrendLineDefaults as resolveTrendLineDefaultsUseCase,
} from "./chart-drawing-state";
import {
  createHorizontalLineDrawing as createHorizontalLineDrawingUseCase,
  createTrendLineDrawing as createTrendLineDrawingUseCase,
} from "./chart-drawing-factory";
import {
  buildSelectedDrawingState as buildSelectedDrawingStateUseCase,
  removeDrawing as removeDrawingUseCase,
  removeSelectedDrawing as removeSelectedDrawingUseCase,
  requireDrawingByApi as requireDrawingByApiUseCase,
  selectDrawing as selectDrawingUseCase,
} from "./chart-drawing-session";
import { buildChartRenderState as buildChartRenderStateUseCase } from "./chart-render-state";
import { renderPaneChrome as renderPaneChromeUseCase } from "./chart-pane-chrome";
import {
  buildReadoutSeriesForPane as buildReadoutSeriesForPaneUseCase,
  buildReadoutSeriesForPrimary as buildReadoutSeriesForPrimaryUseCase,
} from "./chart-readout-series";
import { restoreChartSeries as restoreChartSeriesUseCase } from "./chart-series-restore";
import { restoreChartStudies as restoreChartStudiesUseCase } from "./chart-study-restore";
import { applyChartTemplate, createChartTemplate, normalizeChartTemplate } from "./chart-template";

const CHART_BACKGROUND = "#fffdf7";
const PANE_BACKGROUND = "#fffaf0";
const GRID_COLOR = "rgba(16, 16, 16, 0.08)";
const FRAME_COLOR = "rgba(16, 16, 16, 0.18)";
const UP_COLOR = "#0c8f62";
const DOWN_COLOR = "#c7543e";
const WICK_COLOR = "rgba(16, 16, 16, 0.72)";
const LINE_COLOR = "#3f6fd8";
const CROSSHAIR_COLOR = "rgba(16, 16, 16, 0.5)";
const CROSSHAIR_POINT_COLOR = "#101010";
const AXIS_TEXT_COLOR = "rgba(16, 16, 16, 0.72)";
const AXIS_LABEL_BACKGROUND = "rgba(255, 253, 247, 0.96)";
const AXIS_LABEL_BORDER = "rgba(16, 16, 16, 0.14)";
const AXIS_ACTIVE_BACKGROUND = "#101010";
const AXIS_ACTIVE_TEXT = "#fffdf7";
const DEFAULT_RIGHT_OFFSET = 0.8;
const MIN_BAR_SPACING = 4;
const MAX_BAR_SPACING = 36;
const DRAWING_HIT_TOLERANCE = 16;
const DRAWING_PRICE_SNAP_TOLERANCE = 8;
const DRAWING_TIME_SNAP_TOLERANCE = 10;

export type PhaseOneCandlestickData = OhlcDataPoint<number>;
export type PhaseOneLineData = {
  time: number;
  value: number;
};
export type PhaseOneHistogramData = {
  time: number;
  value: number;
  color?: string;
  up?: boolean;
};
export type PhaseOneVolumeData = {
  time: number;
  value: number;
  color?: string;
  up?: boolean;
};
export type PhaseOneReadoutSeriesDetail = {
  id: string;
  label: string;
  kind: string;
  value: number | null;
  formattedValue: string;
  color: string;
};
export type PhaseOneFormattedReadoutValues = {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  price: string;
};
export type PhaseOneReadoutDetail = {
  active: boolean;
  paneIndex: number | null;
  time: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  price: number | null;
  formatted: PhaseOneFormattedReadoutValues;
  series: readonly PhaseOneReadoutSeriesDetail[];
};

type PhaseOneReadoutBody = Omit<PhaseOneReadoutDetail, "formatted">;

export type PhaseOnePriceLineOptions = {
  price?: number;
  color?: string;
  lineWidth?: number;
  title?: string;
};

export type PhaseOnePriceLineApi = {
  applyOptions(options: PhaseOnePriceLineOptions): void;
  remove(): void;
};

export type PhaseOneDrawingMagnetOverrides = {
  magnetEnabled?: boolean;
  magnetTolerancePx?: number;
  timeMagnetEnabled?: boolean;
  timeMagnetPolicy?: "nearest" | "previous" | "next";
  timeMagnetTolerancePx?: number;
  magnetSources?: {
    open?: boolean;
    high?: boolean;
    low?: boolean;
    close?: boolean;
  };
};

export type PhaseOneHorizontalLineDrawingOptions = PhaseOnePriceLineOptions & PhaseOneDrawingMagnetOverrides & {
  visible?: boolean;
};

export type PhaseOneHorizontalLineDrawingApi = {
  applyOptions(options: PhaseOneHorizontalLineDrawingOptions): void;
  select(): void;
  remove(): void;
  paneIndex(): number;
};

export type PhaseOneTrendLineDrawingOptions = {
  startTime?: number;
  startPrice?: number;
  endTime?: number;
  endPrice?: number;
  color?: string;
  lineWidth?: number;
  visible?: boolean;
} & PhaseOneDrawingMagnetOverrides;

export type PhaseOneTrendLineDrawingApi = {
  applyOptions(options: PhaseOneTrendLineDrawingOptions): void;
  select(): void;
  remove(): void;
  paneIndex(): number;
};

export type PhaseOneSelectedDrawing =
  | {
      id: string;
      kind: "horizontal-line" | "trend-line";
      paneIndex: number;
    }
  | null;

export type PhaseOneDrawingSelectionChangeHandler = (selection: PhaseOneSelectedDrawing) => void;

export type PhaseOneSeriesMarkerPosition = "aboveBar" | "belowBar" | "inBar";
export type PhaseOneSeriesMarkerShape = "circle" | "square" | "arrowUp" | "arrowDown";

export type PhaseOneSeriesMarker = {
  time: number;
  position?: PhaseOneSeriesMarkerPosition;
  shape?: PhaseOneSeriesMarkerShape;
  color?: string;
  text?: string;
};

export type PhaseOneCrosshairMoveEvent = PhaseOneReadoutDetail & {
  point: PanePoint | null;
};

export type PhaseOneCrosshairMoveHandler = (event: PhaseOneCrosshairMoveEvent) => void;
export type PhaseOneClickEvent = PhaseOneReadoutDetail & {
  point: PanePoint | null;
};
export type PhaseOneClickHandler = (event: PhaseOneClickEvent) => void;
export type PhaseOneChartOptions = {
  layout?: {
    backgroundColor?: string;
    paneBackgroundColor?: string;
    gridColor?: string;
    frameColor?: string;
    axisTextColor?: string;
    axisLabelBackground?: string;
    axisLabelBorder?: string;
    axisActiveBackground?: string;
    axisActiveText?: string;
  };
  crosshair?: {
    lineColor?: string;
    pointColor?: string;
  };
  drawings?: {
    magnetEnabled?: boolean;
    magnetGuideVisible?: boolean;
    magnetLabelVisible?: boolean;
    magnetTolerancePx?: number;
    timeMagnetEnabled?: boolean;
    timeMagnetPolicy?: "nearest" | "previous" | "next";
    timeMagnetGuideVisible?: boolean;
    timeMagnetLabelVisible?: boolean;
    timeMagnetTolerancePx?: number;
    magnetSources?: {
      open?: boolean;
      high?: boolean;
      low?: boolean;
      close?: boolean;
    };
  };
};

type RequiredDrawingMagnetSources = Required<NonNullable<NonNullable<PhaseOneChartOptions["drawings"]>["magnetSources"]>>;

type RequiredDrawingOptions = {
  magnetEnabled: boolean;
  magnetGuideVisible: boolean;
  magnetLabelVisible: boolean;
  magnetTolerancePx: number;
  timeMagnetEnabled: boolean;
  timeMagnetPolicy: "nearest" | "previous" | "next";
  timeMagnetGuideVisible: boolean;
  timeMagnetLabelVisible: boolean;
  timeMagnetTolerancePx: number;
  magnetSources: RequiredDrawingMagnetSources;
};

type DrawingMagnetOverrideState = {
  magnetEnabled?: boolean;
  magnetTolerancePx?: number;
  timeMagnetEnabled?: boolean;
  timeMagnetPolicy?: "nearest" | "previous" | "next";
  timeMagnetTolerancePx?: number;
  magnetSources?: Partial<RequiredDrawingMagnetSources>;
};

export type PhaseOneSeriesValueFormatter = (value: number) => string;

type PhaseOneSeriesFormatterOptions = {
  valueFormatter?: PhaseOneSeriesValueFormatter | null;
};

export type PhaseOneCandlestickSeriesOptions = PhaseOneSeriesFormatterOptions & {
  upColor?: string;
  downColor?: string;
  wickColor?: string;
  lineBreakCount?: number;
  renkoBoxSize?: number | null;
  renkoBoxSizeMode?: "auto" | "fixed";
  pointFigureBoxSize?: number | null;
  pointFigureBoxSizeMode?: "auto" | "fixed" | "atr" | "percentage" | "traditional";
  pointFigureBoxSizeScale?: number;
  pointFigureReversalBoxes?: number;
  pointFigureAtrLength?: number;
  pointFigurePercentageValue?: number;
};

export type PhaseOneBarSeriesOptions = PhaseOneSeriesFormatterOptions & {
  upColor?: string;
  downColor?: string;
};

export type PhaseOneLineSeriesOptions = PhaseOneSeriesFormatterOptions & {
  color?: string;
  lineWidth?: number;
  kagiYangColor?: string;
  kagiYinColor?: string;
  kagiYangLineWidth?: number;
  kagiYinLineWidth?: number;
  kagiReversalMode?: "auto" | "fixed" | "atr" | "percentage";
  kagiReversalSize?: number | null;
  kagiReversalScale?: number;
  kagiAtrLength?: number;
  kagiPercentageValue?: number;
};

export type PhaseOneCompareSeriesOptions = {
  affectMainScale?: boolean;
  inputContextMode?: "chart-context" | "requested-context";
  requestedSymbol?: string | null;
  requestedResolution?: string | null;
  requestedSession?: string | null;
  requestedTimezone?: string | null;
  mergePolicy?: "carry-forward" | "gaps" | "exact";
};

export type PhaseOneMovingAverageStudyOptions = {
  length?: number;
  inputContextMode?: "chart-context" | "requested-context";
  requestedSymbol?: string | null;
  requestedResolution?: string | null;
  requestedSession?: string | null;
  requestedTimezone?: string | null;
  mergePolicy?: "carry-forward" | "gaps" | "exact";
};

export type PhaseOneAreaSeriesOptions = PhaseOneSeriesFormatterOptions & {
  lineColor?: string;
  lineWidth?: number;
  topColor?: string;
  bottomColor?: string;
};

export type PhaseOneBaselineSeriesOptions = PhaseOneSeriesFormatterOptions & {
  baseValue?: number;
  lineWidth?: number;
  topLineColor?: string;
  topFillTopColor?: string;
  topFillBottomColor?: string;
  bottomLineColor?: string;
  bottomFillTopColor?: string;
  bottomFillBottomColor?: string;
};

export type PhaseOneHistogramSeriesOptions = PhaseOneSeriesFormatterOptions & {
  upColor?: string;
  downColor?: string;
};

export type PhaseOneVolumeSeriesOptions = PhaseOneSeriesFormatterOptions & {
  upColor?: string;
  downColor?: string;
};

export type PhaseOnePaneKind = PaneKind;

export type PhaseOnePaneApi = {
  paneIndex(): number;
  getHeight(): number;
  getOptions(): Required<PhaseOnePaneOptions>;
  applyOptions(options: PhaseOnePaneOptions): void;
  setHeight(height: number): void;
  isPrimary(): boolean;
  isResizable(): boolean;
  subscribeResize(handler: PhaseOnePaneResizeHandler): void;
  unsubscribeResize(handler: PhaseOnePaneResizeHandler): void;
  hasSeries(): boolean;
  remove(): void;
};

export type PhaseOnePaneOptions = {
  height?: number;
  resizable?: boolean;
};

export type PhaseOneSeriesTarget = {
  pane?: number | PhaseOnePaneApi;
};

export type PhaseOneVolumeSeriesTarget = PhaseOneSeriesTarget;

export type PhaseOnePaneResizeEvent = {
  paneIndex: number;
  height: number;
  isPrimary: boolean;
};

export type PhaseOnePaneResizeHandler = (event: PhaseOnePaneResizeEvent) => void;

export type PhaseOnePaneEventType = "added" | "options" | "resized" | "removed";

export type PhaseOnePaneState = {
  paneIndex: number;
  height: number;
  isPrimary: boolean;
  resizable: boolean;
  hasSeries: boolean;
  seriesCount: number;
  seriesKinds: readonly string[];
  series: readonly PhaseOnePaneSeriesState[];
};

export type PhaseOnePaneSeriesState = {
  id: string;
  label: string;
  kind: string;
  chartType: PhaseOneMainChartType | null;
  sourceRole: "main-series" | "study";
  studyKind: "series" | "indicator" | "overlay" | "compare" | null;
  inputContextMode: "chart-context" | "requested-context" | null;
  priceScaleId: string;
  inputCapability: PhaseOneMainSeriesInputCapability | null;
  builder: PhaseOneMainSeriesBuilder | null;
  renderer: PhaseOneMainSeriesRenderer | null;
  styleSchemaId: string | null;
  styleOptionSurface: string | null;
  styleOptionKeys: readonly string[];
  styleTypeSpecificOptionKeys: readonly string[];
  pointCount: number;
};

export type PhaseOnePaneEvent = {
  type: PhaseOnePaneEventType;
  pane: PhaseOnePaneState;
  panes: readonly PhaseOnePaneState[];
};

export type PhaseOnePaneEventHandler = (event: PhaseOnePaneEvent) => void;

export type PhaseOneTimeScaleApi = {
  getVisibleLogicalRange(): { from: number; to: number } | null;
  setVisibleLogicalRange(range: { from: number; to: number }): void;
  applyOptions(options: {
    barSpacing?: number;
    rightOffset?: number;
    tickMarkFormatter?: ((time: number) => string) | null;
  }): void;
};

export type PhaseOnePriceScaleApi = {
  getVisibleRange(): { minValue: number; maxValue: number } | null;
  setVisibleRange(range: { minValue: number; maxValue: number } | null): void;
  applyOptions(options: {
    priceFormatter?: ((value: number) => string) | null;
    scaleSeriesOnly?: boolean;
  }): void;
};

export type PhaseOneCandlestickSeriesApi = {
  setData(data: readonly PhaseOneCandlestickData[]): void;
  update(bar: PhaseOneCandlestickData): void;
  applyOptions(options: PhaseOneCandlestickSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneBarSeriesApi = {
  setData(data: readonly PhaseOneCandlestickData[]): void;
  update(bar: PhaseOneCandlestickData): void;
  applyOptions(options: PhaseOneBarSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneLineSeriesApi = {
  setData(data: readonly PhaseOneLineData[]): void;
  update(bar: PhaseOneLineData): void;
  applyOptions(options: PhaseOneLineSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneAreaSeriesApi = {
  setData(data: readonly PhaseOneLineData[]): void;
  update(bar: PhaseOneLineData): void;
  applyOptions(options: PhaseOneAreaSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneBaselineSeriesApi = {
  setData(data: readonly PhaseOneLineData[]): void;
  update(bar: PhaseOneLineData): void;
  applyOptions(options: PhaseOneBaselineSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneHistogramSeriesApi = {
  setData(data: readonly PhaseOneHistogramData[]): void;
  update(bar: PhaseOneHistogramData): void;
  applyOptions(options: PhaseOneHistogramSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneVolumeSeriesApi = {
  setData(data: readonly PhaseOneVolumeData[]): void;
  update(bar: PhaseOneVolumeData): void;
  applyOptions(options: PhaseOneVolumeSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneOverlaySeriesApi = PhaseOneLineSeriesApi;
export type PhaseOneCompareSeriesApi = PhaseOneLineSeriesApi & {
  applyCompareOptions(options: PhaseOneCompareSeriesOptions): void;
  getCompareOptions(): Required<PhaseOneCompareSeriesOptions>;
};
export type PhaseOneMovingAverageStudyApi = PhaseOneLineSeriesApi & {
  applyStudyOptions(options: PhaseOneMovingAverageStudyOptions): void;
  getStudyOptions(): Required<PhaseOneMovingAverageStudyOptions>;
};
export type PhaseOneMainSeriesApi =
  | PhaseOneCandlestickSeriesApi
  | PhaseOneBarSeriesApi
  | PhaseOneLineSeriesApi
  | PhaseOneAreaSeriesApi
  | PhaseOneBaselineSeriesApi
  | PhaseOneHistogramSeriesApi;
export type PhaseOneMainSeriesStateSnapshot = MainSeriesStateSnapshot;
export type PhaseOneChartStateSnapshot = {
  options: PhaseOneChartOptions;
  timeScale: {
    barSpacing: number | null;
    rightOffset: number;
    visibleLogicalRange: { from: number; to: number } | null;
  };
  priceScale: {
    visibleRange: { minValue: number; maxValue: number } | null;
    scaleSeriesOnly: boolean;
  };
  panes: Array<{
    height: number | null;
    resizable: boolean;
  }>;
  mainSeries: PhaseOneMainSeriesStateSnapshot | null;
  series: Array<
    | {
        kind: "candlestick" | "bar";
        paneIndex: number;
        options: PhaseOneCandlestickSeriesOptions | PhaseOneBarSeriesOptions;
        data: readonly PhaseOneCandlestickData[];
      }
    | {
        kind: "line";
        paneIndex: number;
        options: PhaseOneLineSeriesOptions;
        data: readonly PhaseOneLineData[];
      }
    | {
        kind: "area";
        paneIndex: number;
        options: PhaseOneAreaSeriesOptions;
        data: readonly PhaseOneLineData[];
      }
    | {
        kind: "baseline";
        paneIndex: number;
        options: PhaseOneBaselineSeriesOptions;
        data: readonly PhaseOneLineData[];
      }
    | {
        kind: "histogram" | "volume";
        paneIndex: number;
        options: PhaseOneHistogramSeriesOptions | PhaseOneVolumeSeriesOptions;
        data: readonly (PhaseOneHistogramData | PhaseOneVolumeData)[];
      }
  >;
  studies: Array<
    | {
        type: "overlay";
        paneIndex: number;
        seriesOptions: PhaseOneLineSeriesOptions;
        data: readonly PhaseOneLineData[];
      }
    | {
        type: "compare";
        paneIndex: number;
        seriesOptions: PhaseOneLineSeriesOptions;
        compareOptions: Required<PhaseOneCompareSeriesOptions>;
        data: readonly PhaseOneLineData[];
      }
    | {
        type: "moving-average";
        paneIndex: number;
        seriesOptions: PhaseOneLineSeriesOptions;
        studyOptions: Required<PhaseOneMovingAverageStudyOptions>;
      }
  >;
  tradeLocation:
    | {
        request: PhaseOneTradeLocationRequest;
        overlay: PhaseOneResolvedTradeOverlayOptions;
      }
    | null;
  drawings: Array<
    | {
        type: "horizontal-line";
        paneIndex: number;
        options: Required<PhaseOneHorizontalLineDrawingOptions>;
      }
    | {
        type: "trend-line";
        paneIndex: number;
        options: Required<PhaseOneTrendLineDrawingOptions>;
      }
  >;
};
export type PhaseOneChartTemplateV1 = ChartTemplateV1<PhaseOneChartStateSnapshot>;
export type PhaseOneChartTemplate = PhaseOneChartTemplateV1;
export type PhaseOneChartTemplateInput = VersionedChartTemplateInput<PhaseOneChartStateSnapshot>;
export type PhaseOneDrawingStateSnapshot = PhaseOneChartStateSnapshot["drawings"][number];
export type PhaseOneDrawingPropertyField =
  | "price"
  | "title"
  | "color"
  | "lineWidth"
  | "startTime"
  | "startPrice"
  | "endTime"
  | "endPrice"
  | "visible"
  | "magnetEnabled"
  | "magnetTolerancePx"
  | "timeMagnetEnabled"
  | "timeMagnetPolicy"
  | "timeMagnetTolerancePx"
  | "magnetSources.open"
  | "magnetSources.high"
  | "magnetSources.low"
  | "magnetSources.close";
export type PhaseOneDrawingPropertySectionId = "appearance" | "geometry" | "magnet";
export type PhaseOneDrawingPropertyFieldSchema = {
  key: PhaseOneDrawingPropertyField;
  label: string;
  control:
    | "color"
    | "number"
    | "text"
    | "toggle"
    | "select"
    | "time";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: ReadonlyArray<{ value: string; label: string }>;
};
export type PhaseOneDrawingPropertySectionSchema = {
  id: PhaseOneDrawingPropertySectionId;
  label: string;
  fields: readonly PhaseOneDrawingPropertyFieldSchema[];
};
export type PhaseOneDrawingPropertySchema = {
  kind: PhaseOneDrawingStateSnapshot["type"];
  sections: readonly PhaseOneDrawingPropertySectionSchema[];
};
export type PhaseOneChartTypeChangeHandler = (type: PhaseOneMainChartType) => void;

export function createPhaseOneChartTemplate(chart: PhaseOneChartStateSnapshot): PhaseOneChartTemplateV1 {
  return createChartTemplate(chart);
}

export function normalizePhaseOneChartTemplate(
  input: PhaseOneChartTemplateInput,
): PhaseOneChartTemplateV1 {
  return normalizeChartTemplate(input);
}

const COMMON_DRAWING_MAGNET_PROPERTY_FIELDS = [
  { key: "magnetEnabled", label: "Price Magnet", control: "toggle" },
  { key: "magnetTolerancePx", label: "Price Magnet Tolerance", control: "number", min: 0, step: 1 },
  { key: "timeMagnetEnabled", label: "Time Magnet", control: "toggle" },
  {
    key: "timeMagnetPolicy",
    label: "Time Magnet Policy",
    control: "select",
    options: [
      { value: "nearest", label: "nearest" },
      { value: "previous", label: "previous" },
      { value: "next", label: "next" },
    ],
  },
  { key: "timeMagnetTolerancePx", label: "Time Magnet Tolerance", control: "number", min: 0, step: 1 },
  { key: "magnetSources.open", label: "Snap Open", control: "toggle" },
  { key: "magnetSources.high", label: "Snap High", control: "toggle" },
  { key: "magnetSources.low", label: "Snap Low", control: "toggle" },
  { key: "magnetSources.close", label: "Snap Close", control: "toggle" },
] as const satisfies readonly PhaseOneDrawingPropertyFieldSchema[];

const DRAWING_PROPERTY_SCHEMAS: Record<
  PhaseOneDrawingStateSnapshot["type"],
  PhaseOneDrawingPropertySchema
> = {
  "horizontal-line": {
    kind: "horizontal-line",
    sections: [
      {
        id: "appearance",
        label: "Appearance",
        fields: [
          { key: "title", label: "Title", control: "text", required: true },
          { key: "color", label: "Color", control: "color" },
          { key: "lineWidth", label: "Line Width", control: "number", min: 1, step: 1 },
          { key: "visible", label: "Visible", control: "toggle" },
        ],
      },
      {
        id: "geometry",
        label: "Geometry",
        fields: [{ key: "price", label: "Price", control: "number", step: 0.01 }],
      },
      {
        id: "magnet",
        label: "Magnet",
        fields: COMMON_DRAWING_MAGNET_PROPERTY_FIELDS,
      },
    ],
  },
  "trend-line": {
    kind: "trend-line",
    sections: [
      {
        id: "appearance",
        label: "Appearance",
        fields: [
          { key: "color", label: "Color", control: "color" },
          { key: "lineWidth", label: "Line Width", control: "number", min: 1, step: 1 },
          { key: "visible", label: "Visible", control: "toggle" },
        ],
      },
      {
        id: "geometry",
        label: "Geometry",
        fields: [
          { key: "startTime", label: "Start Time", control: "time", step: 60000 },
          { key: "startPrice", label: "Start Price", control: "number", step: 0.01 },
          { key: "endTime", label: "End Time", control: "time", step: 60000 },
          { key: "endPrice", label: "End Price", control: "number", step: 0.01 },
        ],
      },
      {
        id: "magnet",
        label: "Magnet",
        fields: COMMON_DRAWING_MAGNET_PROPERTY_FIELDS,
      },
    ],
  },
};

export type PhaseOneChartApi = {
  addCandlestickSeries(target?: PhaseOneSeriesTarget): PhaseOneCandlestickSeriesApi;
  addBarSeries(target?: PhaseOneSeriesTarget): PhaseOneBarSeriesApi;
  addLineSeries(target?: PhaseOneSeriesTarget): PhaseOneLineSeriesApi;
  addAreaSeries(target?: PhaseOneSeriesTarget): PhaseOneAreaSeriesApi;
  addBaselineSeries(target?: PhaseOneSeriesTarget): PhaseOneBaselineSeriesApi;
  addHistogramSeries(target?: PhaseOneSeriesTarget): PhaseOneHistogramSeriesApi;
  addVolumeSeries(target?: PhaseOneVolumeSeriesTarget): PhaseOneVolumeSeriesApi;
  addOverlaySeries(target?: PhaseOneSeriesTarget): PhaseOneOverlaySeriesApi;
  addCompareSeries(target?: PhaseOneSeriesTarget): PhaseOneCompareSeriesApi;
  addMovingAverageStudy(target?: PhaseOneSeriesTarget): PhaseOneMovingAverageStudyApi;
  addHorizontalLineDrawing(
    target?: PhaseOneSeriesTarget,
    options?: PhaseOneHorizontalLineDrawingOptions,
  ): PhaseOneHorizontalLineDrawingApi;
  addTrendLineDrawing(
    target?: PhaseOneSeriesTarget,
    options?: PhaseOneTrendLineDrawingOptions,
  ): PhaseOneTrendLineDrawingApi;
  getSelectedDrawing(): PhaseOneSelectedDrawing;
  getSelectedDrawingState(): PhaseOneDrawingStateSnapshot | null;
  getSelectedDrawingPropertySchema(): PhaseOneDrawingPropertySchema | null;
  applySelectedDrawingOptions(options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions): void;
  clearSelectedDrawing(): void;
  subscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void;
  unsubscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void;
  panes(): readonly PhaseOnePaneApi[];
  addPane(options?: PhaseOnePaneOptions): PhaseOnePaneApi;
  removePane(pane: PhaseOnePaneApi): void;
  applyOptions(options: PhaseOneChartOptions): void;
  getChartType(): PhaseOneMainChartType | null;
  getMainSeriesState(): PhaseOneMainSeriesStateSnapshot | null;
  applyMainSeriesState(state: PhaseOneMainSeriesStateSnapshot): PhaseOneMainSeriesApi;
  getChartState(): PhaseOneChartStateSnapshot;
  applyChartState(state: PhaseOneChartStateSnapshot): void;
  getChartTemplate(): PhaseOneChartTemplate;
  applyChartTemplate(template: PhaseOneChartTemplateInput): void;
  setChartType(type: PhaseOneMainChartType): PhaseOneMainSeriesApi;
  locateTrade(
    request: PhaseOneTradeLocationRequest,
    options?: PhaseOneTradeOverlayOptions,
  ): PhaseOneTradeLocationState | null;
  clearTradeLocation(): void;
  getTradeLocationState(): PhaseOneTradeLocationState | null;
  subscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void;
  unsubscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void;
  removeSeries(
    series:
      | PhaseOneCandlestickSeriesApi
      | PhaseOneBarSeriesApi
      | PhaseOneLineSeriesApi
      | PhaseOneAreaSeriesApi
      | PhaseOneBaselineSeriesApi
      | PhaseOneHistogramSeriesApi
      | PhaseOneVolumeSeriesApi,
  ): void;
  resize(width: number, height: number): void;
  timeScale(): PhaseOneTimeScaleApi;
  priceScale(): PhaseOnePriceScaleApi;
  subscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void;
  unsubscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void;
  subscribeClick(handler: PhaseOneClickHandler): void;
  unsubscribeClick(handler: PhaseOneClickHandler): void;
  subscribePaneEvents(handler: PhaseOnePaneEventHandler): void;
  unsubscribePaneEvents(handler: PhaseOnePaneEventHandler): void;
  destroy(): void;
};

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
};

type DragState = {
  startClientX: number;
  startRightOffset: number;
};

type DrawingDragHandle = "start" | "end";

type DrawingDragState = {
  drawingId: string;
  handle: DrawingDragHandle;
};

type DrawingSnapGuideState = {
  paneId: string;
  color: string;
  price: number | null;
  source: "open" | "high" | "low" | "close" | null;
  time: number | null;
};

type PaneResizeState = {
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  startClientY: number;
  startUpperHeight: number;
  startLowerHeight: number;
};

type AxisTag = {
  text: string;
  x: number;
  y: number;
  active?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
};

type HistogramVisual = {
  color?: string;
  isUp: boolean;
};

type PriceLineState = {
  id: string;
  price: number;
  color: string;
  lineWidth: number;
  title: string;
};

type ChartDrawingKind = "horizontal-line" | "trend-line";

type HorizontalLineDrawingState = {
  kind: "horizontal-line";
  line: PriceLineState;
} & DrawingMagnetOverrideState;

type TrendLineDrawingState = {
  kind: "trend-line";
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
  color: string;
  lineWidth: number;
} & DrawingMagnetOverrideState;

type ChartDrawingApi = PhaseOneHorizontalLineDrawingApi | PhaseOneTrendLineDrawingApi;

type ChartDrawingState = {
  api: ChartDrawingApi;
} & (HorizontalLineDrawingState | TrendLineDrawingState);

type HorizontalLineDrawingDescriptor = {
  id: string;
  kind: "horizontal-line";
  paneId: string;
  visible: boolean;
  api: PhaseOneHorizontalLineDrawingApi;
} & HorizontalLineDrawingState;

type TrendLineDrawingDescriptor = {
  id: string;
  kind: "trend-line";
  paneId: string;
  visible: boolean;
  api: PhaseOneTrendLineDrawingApi;
} & TrendLineDrawingState;

type ChartDrawingDescriptor = HorizontalLineDrawingDescriptor | TrendLineDrawingDescriptor;

type SeriesMarkerState = {
  time: number;
  position: PhaseOneSeriesMarkerPosition;
  shape: PhaseOneSeriesMarkerShape;
  color: string;
  text: string;
};

type ChartSeriesKind = "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume";

type ChartSeriesApi =
  | PhaseOneCandlestickSeriesApi
  | PhaseOneBarSeriesApi
  | PhaseOneLineSeriesApi
  | PhaseOneAreaSeriesApi
  | PhaseOneBaselineSeriesApi
  | PhaseOneHistogramSeriesApi
  | PhaseOneVolumeSeriesApi;

type BaseSeriesSourceState = SeriesRuntimeFields<
  PhaseOneCandlestickData,
  ChartSeriesApi,
  | Required<PhaseOneCandlestickSeriesOptions>
  | Required<PhaseOneBarSeriesOptions>
  | Required<PhaseOneLineSeriesOptions>
  | Required<PhaseOneAreaSeriesOptions>
  | Required<PhaseOneBaselineSeriesOptions>
  | Required<PhaseOneHistogramSeriesOptions>
  | Required<PhaseOneVolumeSeriesOptions>,
  HistogramVisual,
  PriceLineState,
  SeriesMarkerState
>;

type MainSeriesSourceState = SourceDescriptor<ChartSeriesKind, ChartSeriesApi> & BaseSeriesSourceState & {
  role: "main-series";
  chartType: PhaseOneMainChartType;
  inputData: readonly PhaseOneCandlestickData[];
  lineBreakOptions: { lineCount: number };
  renkoOptions: Required<RenkoStyleOptionsState>;
  pointFigureOptions: Required<PointFigureStyleOptionsState>;
  kagiOptions: Required<KagiStyleOptionsState>;
  inputCapability: PhaseOneMainSeriesInputCapability;
  builder: PhaseOneMainSeriesBuilder;
  renderer: PhaseOneMainSeriesRenderer;
  styleSchemaId: PhaseOneMainStyleSchemaId;
};

type StudySourceState = SourceDescriptor<ChartSeriesKind, ChartSeriesApi> & BaseSeriesSourceState & {
  role: "study";
  studyKind: StudySourceKind;
  inputData: readonly PhaseOneCandlestickData[];
  inputContext: StudyInputContextState;
  indicator?: MovingAverageIndicatorState;
  compareOptions?: Required<PhaseOneCompareSeriesOptions>;
};

type SeriesSourceState = MainSeriesSourceState | StudySourceState;
type SecondaryApiSourceState = Pick<SeriesSourceState, "options" | "priceLines">;
type PhaseOneRestorableSeriesSnapshot =
  | {
      kind: "candlestick";
      paneIndex: number;
      options: PhaseOneCandlestickSeriesOptions;
      data: readonly PhaseOneCandlestickData[];
    }
  | {
      kind: "bar";
      paneIndex: number;
      options: PhaseOneBarSeriesOptions;
      data: readonly PhaseOneCandlestickData[];
    }
  | {
      kind: "line";
      paneIndex: number;
      options: PhaseOneLineSeriesOptions;
      data: readonly PhaseOneLineData[];
    }
  | {
      kind: "area";
      paneIndex: number;
      options: PhaseOneAreaSeriesOptions;
      data: readonly PhaseOneLineData[];
    }
  | {
      kind: "baseline";
      paneIndex: number;
      options: PhaseOneBaselineSeriesOptions;
      data: readonly PhaseOneLineData[];
    }
  | {
      kind: "histogram";
      paneIndex: number;
      options: PhaseOneHistogramSeriesOptions;
      data: readonly PhaseOneHistogramData[];
    }
  | {
      kind: "volume";
      paneIndex: number;
      options: PhaseOneVolumeSeriesOptions;
      data: readonly PhaseOneVolumeData[];
    };
type PhaseOneRestorableDrawingSnapshot =
  | (Extract<PhaseOneChartStateSnapshot["drawings"][number], { type: "horizontal-line" }> &
      RestorableDrawingSnapshot)
  | (Extract<PhaseOneChartStateSnapshot["drawings"][number], { type: "trend-line" }> & RestorableDrawingSnapshot);

type RowSet = ReturnType<SeriesDataStore<number>["setData"]>;

type ResolvedSeriesTarget =
  | { kind: "primary" }
  | { kind: "secondary"; paneId: string };

const DEFAULT_LAYOUT: Layout = {
  width: 960,
  height: 520,
  top: 28,
  right: 18,
  bottom: 34,
  left: 18,
};

const PANE_GAP = 10;
const PANE_DIVIDER_HIT_SLOP = 6;

export class PhaseOneChartHarness {
  private readonly paneHandleIds = new WeakMap<PhaseOnePaneApi, string>();
  private readonly paneResizeHandlers = new Map<string, Set<PhaseOnePaneResizeHandler>>();
  private readonly paneEventHandlers = new Set<PhaseOnePaneEventHandler>();
  private readonly chartTypeChangeHandlers = new Set<PhaseOneChartTypeChangeHandler>();
  private readonly chartModel = new ChartModel<
    ChartSeriesKind,
    ChartSeriesApi,
    SeriesSourceState,
    PhaseOneMainChartType
  >();
  private readonly drawingRegistry = new DrawingRegistry<ChartDrawingKind, ChartDrawingApi, ChartDrawingDescriptor>();
  private readonly studyMergeEngine = DEFAULT_STUDY_MERGE_ENGINE;
  private readonly timeScale = new TimeScale();
  private readonly barRenderer = new BarRenderer();
  private readonly candlesRenderer = new CandlesticksRenderer();
  private readonly gridRenderer = new GridRenderer();
  private readonly histogramRenderer = new HistogramRenderer();
  private readonly lineRenderer = new LineRenderer();
  private readonly pointFigureRenderer = new PointFigureRenderer();
  private readonly kagiRenderer = new KagiRenderer();
  private readonly areaRenderer = new AreaRenderer();
  private readonly baselineRenderer = new BaselineRenderer();
  private nextSeriesId = 1;
  private nextPriceLineId = 1;
  private nextDrawingId = 1;
  private readonly priceLineHandleIds = new WeakMap<PhaseOnePriceLineApi, string>();
  private canvas: HTMLCanvasElement | null = null;
  private crosshair: PanePoint | null = null;
  private barSpacing: number | null = null;
  private rightOffset = DEFAULT_RIGHT_OFFSET;
  private readonly chartOptions: Required<NonNullable<PhaseOneChartOptions["layout"]>> = {
    backgroundColor: CHART_BACKGROUND,
    paneBackgroundColor: PANE_BACKGROUND,
    gridColor: GRID_COLOR,
    frameColor: FRAME_COLOR,
    axisTextColor: AXIS_TEXT_COLOR,
    axisLabelBackground: AXIS_LABEL_BACKGROUND,
    axisLabelBorder: AXIS_LABEL_BORDER,
    axisActiveBackground: AXIS_ACTIVE_BACKGROUND,
    axisActiveText: AXIS_ACTIVE_TEXT,
  };
  private readonly crosshairOptions: Required<NonNullable<PhaseOneChartOptions["crosshair"]>> = {
    lineColor: CROSSHAIR_COLOR,
    pointColor: CROSSHAIR_POINT_COLOR,
  };
  private readonly drawingOptions: RequiredDrawingOptions = {
    magnetEnabled: true,
    magnetGuideVisible: true,
    magnetLabelVisible: true,
    magnetTolerancePx: DRAWING_PRICE_SNAP_TOLERANCE,
    timeMagnetEnabled: true,
    timeMagnetPolicy: "nearest",
    timeMagnetGuideVisible: true,
    timeMagnetLabelVisible: true,
    timeMagnetTolerancePx: DRAWING_TIME_SNAP_TOLERANCE,
    magnetSources: {
      open: true,
      high: true,
      low: true,
      close: true,
    },
  };
  private timeAxisFormatter: ((time: number) => string) | null = null;
  private priceAxisFormatter: ((value: number) => string) | null = null;
  private primaryScaleSeriesOnly = false;
  private primaryPriceRangeOverride: PriceRangeImpl | null = null;
  private activeTradeLocation:
    | {
        request: PhaseOneTradeLocationRequest;
        options: PhaseOneResolvedTradeOverlayOptions;
        state: PhaseOneTradeLocationState | null;
      }
    | null = null;
  private readonly candlestickOptions: Required<PhaseOneCandlestickSeriesOptions> = {
    valueFormatter: null,
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
    wickColor: WICK_COLOR,
    lineBreakCount: 3,
    renkoBoxSize: null,
    renkoBoxSizeMode: "auto",
    pointFigureBoxSize: null,
    pointFigureBoxSizeMode: "auto",
    pointFigureBoxSizeScale: 1,
    pointFigureReversalBoxes: 3,
    pointFigureAtrLength: 14,
    pointFigurePercentageValue: 1,
  };
  private readonly barOptions: Required<PhaseOneBarSeriesOptions> = {
    valueFormatter: null,
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
  private readonly lineOptions: Required<PhaseOneLineSeriesOptions> = {
    valueFormatter: null,
    color: LINE_COLOR,
    lineWidth: 2,
    kagiYangColor: "#0c8f62",
    kagiYinColor: "#c7543e",
    kagiYangLineWidth: 4,
    kagiYinLineWidth: 2,
    kagiReversalMode: "auto",
    kagiReversalSize: null,
    kagiReversalScale: 1,
    kagiAtrLength: 14,
    kagiPercentageValue: 1,
  };
  private readonly defaultCompareOptions: Required<PhaseOneCompareSeriesOptions> = {
    affectMainScale: true,
    inputContextMode: "chart-context",
    requestedSymbol: null,
    requestedResolution: null,
    requestedSession: null,
    requestedTimezone: null,
    mergePolicy: "carry-forward",
  };
  private readonly defaultMovingAverageOptions: Required<PhaseOneMovingAverageStudyOptions> = {
    length: 3,
    inputContextMode: "chart-context",
    requestedSymbol: null,
    requestedResolution: null,
    requestedSession: null,
    requestedTimezone: null,
    mergePolicy: "carry-forward",
  };
  private readonly areaOptions: Required<PhaseOneAreaSeriesOptions> = {
    valueFormatter: null,
    lineColor: LINE_COLOR,
    lineWidth: 2,
    topColor: "rgba(63, 111, 216, 0.28)",
    bottomColor: "rgba(63, 111, 216, 0.02)",
  };
  private readonly baselineOptions: Required<PhaseOneBaselineSeriesOptions> = {
    valueFormatter: null,
    baseValue: 130,
    lineWidth: 2,
    topLineColor: "#0c8f62",
    topFillTopColor: "rgba(12, 143, 98, 0.26)",
    topFillBottomColor: "rgba(12, 143, 98, 0.03)",
    bottomLineColor: "#c7543e",
    bottomFillTopColor: "rgba(199, 84, 62, 0.03)",
    bottomFillBottomColor: "rgba(199, 84, 62, 0.24)",
  };
  private readonly histogramOptions: Required<PhaseOneHistogramSeriesOptions> = {
    valueFormatter: null,
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
  private readonly volumeOptions: Required<PhaseOneVolumeSeriesOptions> = {
    valueFormatter: null,
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
  private readonly defaultPriceLineOptions: Required<PhaseOnePriceLineOptions> = {
    price: 0,
    color: "rgba(16, 16, 16, 0.48)",
    lineWidth: 1,
    title: "Price line",
  };
  private selectedDrawingId: string | null = null;
  private hoveredDrawingId: string | null = null;
  private hoveredDrawingHandle: DrawingDragHandle | null = null;
  private drawingSnapGuide: DrawingSnapGuideState | null = null;
  private manualLayout: Pick<Layout, "width" | "height"> | null = null;
  private dragState: DragState | null = null;
  private drawingDragState: DrawingDragState | null = null;
  private paneResizeState: PaneResizeState | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly crosshairMoveHandlers = new Set<PhaseOneCrosshairMoveHandler>();
  private readonly clickHandlers = new Set<PhaseOneClickHandler>();
  private readonly drawingSelectionHandlers = new Set<PhaseOneDrawingSelectionChangeHandler>();

  private get panes(): PaneCollection {
    return this.chartModel.panes();
  }

  private get primaryPriceScale(): PriceScale {
    return this.chartModel.primaryScale();
  }
  private readonly handleResize = () => {
    if (this.canvas !== null && this.manualLayout === null) {
      this.render(this.canvas);
    }
  };
  private readonly handlePointerMove = (event: PointerEvent) => {
    if (this.canvas === null) {
      return;
    }

    const layout = measureLayout(this.canvas);
    const paneFrames = buildPaneFrames(
      this.panes.list(),
      layout.height - layout.top - layout.bottom,
      PANE_GAP,
    );
    if (this.paneResizeState !== null) {
      this.drawingSnapGuide = null;
      this.applyPaneResize(event.clientY, layout, paneFrames);
      this.crosshair = resolvePanePoint(this.canvas, event, layout);
      this.render(this.canvas);
      return;
    }

    if (this.drawingDragState !== null) {
      this.crosshair = resolvePanePoint(this.canvas, event, layout);
      if (this.crosshair !== null) {
        this.applyDrawingDrag(this.drawingDragState, this.crosshair, layout, paneFrames);
      }
      this.canvas.style.cursor = "grabbing";
      this.render(this.canvas);
      return;
    }

    const pointCount = this.getPointCount();
    if (this.dragState !== null && pointCount > 0) {
      const paneWidth = layout.width - layout.left - layout.right;
      const spacing = resolveBarSpacing(this.barSpacing, paneWidth, pointCount);
      const deltaBars = (event.clientX - this.dragState.startClientX) / spacing;
      this.rightOffset = this.dragState.startRightOffset - deltaBars;
    }

    const divider = resolvePaneDivider(
      this.panes.list(),
      paneFrames,
      resolvePanePoint(this.canvas, event, layout)?.y ?? null,
      PANE_GAP,
      PANE_DIVIDER_HIT_SLOP,
    );
    this.crosshair = resolvePanePoint(this.canvas, event, layout);
    const hoveredDrawing =
      divider === null && this.dragState === null && this.crosshair !== null
        ? this.resolveHitDrawing(this.crosshair, layout, paneFrames)
        : null;
    const hoveredHandle =
      divider === null && this.dragState === null && this.crosshair !== null
        ? this.resolveSelectedTrendLineDragHandle(this.crosshair, layout, paneFrames)
        : null;
    this.hoveredDrawingId = hoveredDrawing?.id ?? null;
    this.hoveredDrawingHandle = hoveredHandle?.handle ?? null;
    this.canvas.style.cursor = divider === null
      ? (this.dragState === null
        ? (hoveredHandle !== null ? "move" : hoveredDrawing === null ? "crosshair" : "pointer")
        : "grabbing")
      : "row-resize";
    this.render(this.canvas);
  };
  private readonly handlePointerLeave = () => {
    if (
      this.canvas === null ||
      this.crosshair === null ||
      this.dragState !== null ||
      this.drawingDragState !== null ||
      this.paneResizeState !== null
    ) {
      return;
    }

    this.crosshair = null;
    this.hoveredDrawingId = null;
    this.hoveredDrawingHandle = null;
    this.drawingSnapGuide = null;
    this.canvas.style.cursor = "default";
    this.render(this.canvas);
  };
  private readonly handlePointerDown = (event: PointerEvent) => {
    if (this.canvas === null || this.getPointCount() === 0) {
      return;
    }

    const layout = measureLayout(this.canvas);
    const paneFrames = buildPaneFrames(
      this.panes.list(),
      layout.height - layout.top - layout.bottom,
      PANE_GAP,
    );
    const point = resolvePanePoint(this.canvas, event, layout);
    const divider = resolvePaneDivider(
      this.panes.list(),
      paneFrames,
      point?.y ?? null,
      PANE_GAP,
      PANE_DIVIDER_HIT_SLOP,
    );
    if (divider !== null) {
      this.canvas.focus({ preventScroll: true });
      this.paneResizeState = {
        dividerAfterPaneId: divider.upperPaneId,
        dividerBeforePaneId: divider.lowerPaneId,
        startClientY: event.clientY,
        startUpperHeight: divider.upperHeight,
        startLowerHeight: divider.lowerHeight,
      };
      this.canvas.style.cursor = "row-resize";
      this.canvas.setPointerCapture(event.pointerId);
      return;
    }

    if (point !== null) {
      const hitHandle = this.resolveSelectedTrendLineDragHandle(point, layout, paneFrames);
      if (hitHandle !== null) {
        this.canvas.focus({ preventScroll: true });
        this.crosshair = point;
        this.drawingDragState = hitHandle;
        this.hoveredDrawingId = hitHandle.drawingId;
        this.hoveredDrawingHandle = hitHandle.handle;
        this.canvas.style.cursor = "grabbing";
        this.canvas.setPointerCapture(event.pointerId);
        this.render(this.canvas);
        return;
      }
    }

    this.canvas.focus({ preventScroll: true });
    this.dragState = {
      startClientX: event.clientX,
      startRightOffset: this.rightOffset,
    };
    this.canvas.style.cursor = "grabbing";
    this.canvas.setPointerCapture(event.pointerId);
  };
  private readonly handlePointerUp = (event: PointerEvent) => {
    if (this.canvas === null) {
      return;
    }

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.dragState = null;
    this.drawingDragState = null;
    this.paneResizeState = null;
    this.hoveredDrawingHandle = null;
    this.drawingSnapGuide = null;
    this.canvas.style.cursor = this.crosshair === null ? "default" : "crosshair";
  };
  private readonly handleWheel = (event: WheelEvent) => {
    const pointCount = this.getPointCount();
    if (this.canvas === null || pointCount === 0) {
      return;
    }

    event.preventDefault();
    const layout = measureLayout(this.canvas);
    const paneWidth = layout.width - layout.left - layout.right;
    const baseSpacing = calculateBaseBarSpacing(paneWidth, pointCount);
    const currentSpacing = this.barSpacing ?? baseSpacing;
    const factor = event.deltaY < 0 ? 1.15 : 0.87;
    this.barSpacing = clamp(currentSpacing * factor, MIN_BAR_SPACING, MAX_BAR_SPACING);
    this.render(this.canvas);
  };
  private readonly handleClick = (event: MouseEvent) => {
    if (this.canvas === null) {
      return;
    }

    const layout = measureLayout(this.canvas, this.manualLayout);
    const point = resolvePanePoint(this.canvas, event, layout);
    const paneFrames = buildPaneFrames(
      this.panes.list(),
      layout.height - layout.top - layout.bottom,
      PANE_GAP,
    );
    const hitDrawing = point === null ? null : this.resolveHitDrawing(point, layout, paneFrames);
    this.selectDrawing(hitDrawing?.id ?? null);
    const readout = this.buildReadout(point, layout);

    for (const handler of this.clickHandlers) {
      handler({
        ...readout,
        point,
      });
    }
  };
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    const pointCount = this.getPointCount();
    if (this.canvas === null || pointCount === 0) {
      return;
    }

    if (this.selectedDrawingId !== null) {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          this.selectDrawing(null);
          return;
        case "Backspace":
        case "Delete":
          event.preventDefault();
          this.removeSelectedDrawing();
          return;
        default:
          break;
      }
    }

    const layout = measureLayout(this.canvas);
    const paneWidth = layout.width - layout.left - layout.right;
    const baseSpacing = calculateBaseBarSpacing(paneWidth, pointCount);
    const currentSpacing = this.barSpacing ?? baseSpacing;

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        this.barSpacing = clamp(currentSpacing * 1.15, MIN_BAR_SPACING, MAX_BAR_SPACING);
        this.render(this.canvas);
        return;
      case "ArrowDown":
        event.preventDefault();
        this.barSpacing = clamp(currentSpacing * 0.87, MIN_BAR_SPACING, MAX_BAR_SPACING);
        this.render(this.canvas);
        return;
      case "ArrowLeft":
        event.preventDefault();
        this.rightOffset -= 0.6;
        this.render(this.canvas);
        return;
      case "ArrowRight":
        event.preventDefault();
        this.rightOffset += 0.6;
        this.render(this.canvas);
        return;
      default:
        return;
    }
  };

  public attach(canvas: HTMLCanvasElement): void {
    assertCanvasElement(canvas);
    this.canvas = canvas;
    if (!this.canvas.hasAttribute("tabindex")) {
      this.canvas.tabIndex = 0;
    }
    this.canvas.style.cursor = "crosshair";
    this.render(canvas);
    window.addEventListener("resize", this.handleResize);
    const container = canvas.parentElement;
    if (container !== null && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.canvas !== null && this.manualLayout === null) {
          this.render(this.canvas);
        }
      });
      this.resizeObserver.observe(container);
    }
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("pointercancel", this.handlePointerUp);
    canvas.addEventListener("pointerleave", this.handlePointerLeave);
    canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    canvas.addEventListener("click", this.handleClick);
    canvas.addEventListener("keydown", this.handleKeyDown);
  }

  public detach(): void {
    if (this.canvas !== null) {
      this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
      this.canvas.removeEventListener("pointermove", this.handlePointerMove);
      this.canvas.removeEventListener("pointerup", this.handlePointerUp);
      this.canvas.removeEventListener("pointercancel", this.handlePointerUp);
      this.canvas.removeEventListener("pointerleave", this.handlePointerLeave);
      this.canvas.removeEventListener("wheel", this.handleWheel);
      this.canvas.removeEventListener("click", this.handleClick);
      this.canvas.removeEventListener("keydown", this.handleKeyDown);
    }
    window.removeEventListener("resize", this.handleResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.canvas = null;
    this.crosshair = null;
    this.hoveredDrawingId = null;
    this.hoveredDrawingHandle = null;
    this.drawingSnapGuide = null;
    this.dragState = null;
    this.drawingDragState = null;
    this.paneResizeState = null;
    this.crosshairMoveHandlers.clear();
    this.clickHandlers.clear();
    this.drawingSelectionHandlers.clear();
    this.paneResizeHandlers.clear();
    this.paneEventHandlers.clear();
    this.chartTypeChangeHandlers.clear();
  }

  public addCandlestickSeries(target?: PhaseOneSeriesTarget): PhaseOneCandlestickSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "secondary") {
      return this.addSecondaryCandlestickSeries(resolved.paneId);
    }

    return this.addPrimaryCandlestickSeries();
  }

  private attachPrimarySeries(
    kind: PhaseOneMainChartType,
    preserved?: {
      id: string;
      label: string;
      data: readonly PhaseOneCandlestickData[];
      visuals: Map<number, HistogramVisual>;
      markers: readonly SeriesMarkerState[];
      priceLines: Map<string, PriceLineState>;
      options?: Record<string, unknown>;
      previousStyleSchemaId?: PhaseOneMainStyleSchemaId;
    },
  ): PhaseOneMainSeriesApi {
    return attachMainSeriesSource(
      kind,
      preserved,
      {
        currentMainSourceId: this.chartModel.mainSourceId(),
        createMeta: (chartType) => this.createSeriesMeta(chartType),
        createLabel: (chartType, id) => this.createSeriesLabel(chartType, id),
        createApi: (chartType) => this.createPrimarySeriesApi(chartType),
        createSourceState: (chartType, api, meta) =>
          this.createMainSourceState(
            "primary",
            chartType,
            seriesKindForMainChartType(chartType),
            api,
            meta,
            this.primaryPriceScale,
            "primary-right",
          ),
        clonePriceLines,
        projectOptions: (previousStyleSchemaId, nextStyleSchemaId, preservedOptions, currentOptions) =>
          projectMainSeriesStyleOptions(
            previousStyleSchemaId,
            nextStyleSchemaId,
            preservedOptions,
            currentOptions as Record<string, unknown>,
          ) as typeof currentOptions,
        rebuildData: (source) => {
          source.data = applyMainSeriesBuilderData(source.inputData, source);
        },
        registerSource: (source) => this.chartModel.registerSource(source),
        syncContext: (source) => this.syncChartContextFromMainSource(source),
      },
    );
  }

  private createPrimarySeriesApi(
    kind: PhaseOneMainChartType,
  ): PhaseOneMainSeriesApi {
    return createPrimarySeriesApi(kind, {
      assertSeriesActive: (api) => this.assertSeriesActive(api),
      getSource: (api, sourceKind) => this.getSourceByApi(api, sourceKind),
      applySeriesFormatterOptions: (seriesOptions, options) =>
        this.applySeriesFormatterOptions(
          seriesOptions as PhaseOneSeriesFormatterOptions,
          options as PhaseOneSeriesFormatterOptions,
        ),
      applyMainSeriesTypeSpecificOptions,
      rebuildMainSource: (source) => {
        source.data = applyMainSeriesBuilderData(source.inputData as readonly PhaseOneCandlestickData[], source as MainSeriesSourceState);
        this.syncChartContextFromMainSource(source as MainSeriesSourceState);
      },
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setPrimaryData: (data) => this.setPrimaryData(data),
      updatePrimary: (bar) => this.updatePrimary(bar),
      setPrimaryHistogramLikeData: (data) => this.setPrimaryHistogramLikeData(data),
      updatePrimaryHistogramLike: (bar) => this.updatePrimaryHistogramLike(bar),
      normalizeLineData,
      normalizeLineBar,
      setMarkers: (api, markers, sourceKind) => this.setSecondaryMarkers(api, markers, sourceKind),
      createPriceLine: (api, sourceKind, options) => {
        const state = this.getSourceByApi(api, sourceKind);
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (api, sourceKind, line) => {
        const state = this.getSourceByApi(api, sourceKind);
        this.removePriceLineFromMap(state.priceLines, line);
      },
    });
  }

  private addPrimaryCandlestickSeries(): PhaseOneCandlestickSeriesApi {
    return this.attachPrimarySeries("candlestick") as PhaseOneCandlestickSeriesApi;
  }

  public addLineSeries(target?: PhaseOneSeriesTarget): PhaseOneLineSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryLineSeries();
    }
    return this.addSecondaryLineSeries(resolved.paneId);
  }

  public addAreaSeries(target?: PhaseOneSeriesTarget): PhaseOneAreaSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryAreaSeries();
    }
    return this.addSecondaryAreaSeries(resolved.paneId);
  }

  public addBaselineSeries(target?: PhaseOneSeriesTarget): PhaseOneBaselineSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryBaselineSeries();
    }
    return this.addSecondaryBaselineSeries(resolved.paneId);
  }

  public addBarSeries(target?: PhaseOneSeriesTarget): PhaseOneBarSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryBarSeries();
    }
    return this.addSecondaryBarSeries(resolved.paneId);
  }

  public addHistogramSeries(target?: PhaseOneSeriesTarget): PhaseOneHistogramSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryHistogramSeries();
    }
    return this.addSecondaryHistogramSeries(resolved.paneId);
  }

  public addVolumeSeries(target?: PhaseOneVolumeSeriesTarget): PhaseOneVolumeSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: true, allowPrimary: false });
    if (resolved.kind === "primary") {
      throw new Error("chartx phase-one chart volume series requires a secondary pane");
    }
    return this.addSecondaryVolumeSeries(resolved.paneId);
  }

  public addOverlaySeries(target?: PhaseOneSeriesTarget): PhaseOneOverlaySeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    return this.addStudyLineSeries(resolved.kind === "primary" ? "primary" : resolved.paneId, "overlay");
  }

  public addCompareSeries(target?: PhaseOneSeriesTarget): PhaseOneCompareSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    return this.addCompareStudySeries(resolved.kind === "primary" ? "primary" : resolved.paneId);
  }

  public addMovingAverageStudy(target?: PhaseOneSeriesTarget): PhaseOneMovingAverageStudyApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: true, allowPrimary: true });
    return this.addMovingAverageStudySeries(resolved.kind === "primary" ? "primary" : resolved.paneId);
  }

  public addHorizontalLineDrawing(
    target?: PhaseOneSeriesTarget,
    options: PhaseOneHorizontalLineDrawingOptions = {},
  ): PhaseOneHorizontalLineDrawingApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    const paneId = resolved.kind === "primary" ? "primary" : resolved.paneId;
    return this.createHorizontalLineDrawing(paneId, options);
  }

  public addTrendLineDrawing(
    target?: PhaseOneSeriesTarget,
    options: PhaseOneTrendLineDrawingOptions = {},
  ): PhaseOneTrendLineDrawingApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    const paneId = resolved.kind === "primary" ? "primary" : resolved.paneId;
    return this.createTrendLineDrawing(paneId, options);
  }

  public removeSeries(
    series:
      | PhaseOneCandlestickSeriesApi
      | PhaseOneBarSeriesApi
      | PhaseOneLineSeriesApi
      | PhaseOneAreaSeriesApi
      | PhaseOneBaselineSeriesApi
      | PhaseOneHistogramSeriesApi
      | PhaseOneVolumeSeriesApi,
  ): void {
    const removed = this.chartModel.removeSourceByApi(series);
    if (removed === undefined) {
      throw new Error("chartx phase-one chart can remove only the currently attached series");
    }
    if (removed.role === "main-series") {
      this.primaryPriceRangeOverride = null;
    }
    this.crosshair = null;
    this.barSpacing = null;
    this.rightOffset = DEFAULT_RIGHT_OFFSET;

    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  public panesApi(): readonly PhaseOnePaneApi[] {
    return this.panes.list().map((pane) => this.createPaneHandle(pane.id));
  }

  public addPane(options: PhaseOnePaneOptions = {}): PhaseOnePaneApi {
    const pane = this.panes.addSecondaryPane(options);
    this.emitPaneEvent("added", pane.id);
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
    return this.createPaneHandle(pane.id);
  }

  public removePaneByHandle(paneHandle: PhaseOnePaneApi): void {
    const paneId = this.paneHandleIds.get(paneHandle);
    if (paneId === undefined) {
      throw new Error("chartx phase-one chart removePane requires a pane handle created by this chart");
    }

    this.removePaneById(paneId);
  }

  public applyOptions(options: PhaseOneChartOptions): void {
    if (options.layout?.backgroundColor !== undefined) {
      this.chartOptions.backgroundColor = options.layout.backgroundColor;
    }
    if (options.layout?.paneBackgroundColor !== undefined) {
      this.chartOptions.paneBackgroundColor = options.layout.paneBackgroundColor;
    }
    if (options.layout?.gridColor !== undefined) {
      this.chartOptions.gridColor = options.layout.gridColor;
    }
    if (options.layout?.frameColor !== undefined) {
      this.chartOptions.frameColor = options.layout.frameColor;
    }
    if (options.layout?.axisTextColor !== undefined) {
      this.chartOptions.axisTextColor = options.layout.axisTextColor;
    }
    if (options.layout?.axisLabelBackground !== undefined) {
      this.chartOptions.axisLabelBackground = options.layout.axisLabelBackground;
    }
    if (options.layout?.axisLabelBorder !== undefined) {
      this.chartOptions.axisLabelBorder = options.layout.axisLabelBorder;
    }
    if (options.layout?.axisActiveBackground !== undefined) {
      this.chartOptions.axisActiveBackground = options.layout.axisActiveBackground;
    }
    if (options.layout?.axisActiveText !== undefined) {
      this.chartOptions.axisActiveText = options.layout.axisActiveText;
    }
    if (options.crosshair?.lineColor !== undefined) {
      this.crosshairOptions.lineColor = options.crosshair.lineColor;
    }
    if (options.crosshair?.pointColor !== undefined) {
      this.crosshairOptions.pointColor = options.crosshair.pointColor;
    }
    if (options.drawings?.magnetEnabled !== undefined) {
      this.drawingOptions.magnetEnabled = options.drawings.magnetEnabled;
      if (!this.drawingOptions.magnetEnabled) {
        this.drawingSnapGuide = null;
      }
    }
    if (options.drawings?.magnetGuideVisible !== undefined) {
      this.drawingOptions.magnetGuideVisible = options.drawings.magnetGuideVisible;
      if (!this.drawingOptions.magnetGuideVisible) {
        this.drawingSnapGuide = null;
      }
    }
    if (options.drawings?.magnetLabelVisible !== undefined) {
      this.drawingOptions.magnetLabelVisible = options.drawings.magnetLabelVisible;
    }
    if (options.drawings?.magnetTolerancePx !== undefined) {
      this.drawingOptions.magnetTolerancePx = Math.max(0, options.drawings.magnetTolerancePx);
    }
    if (options.drawings?.timeMagnetEnabled !== undefined) {
      this.drawingOptions.timeMagnetEnabled = options.drawings.timeMagnetEnabled;
      if (!this.drawingOptions.timeMagnetEnabled) {
        this.drawingSnapGuide = this.drawingSnapGuide !== null && this.drawingSnapGuide.price !== null
          ? {
              ...this.drawingSnapGuide,
              time: null,
            }
          : null;
      }
    }
    if (options.drawings?.timeMagnetPolicy !== undefined) {
      this.drawingOptions.timeMagnetPolicy = options.drawings.timeMagnetPolicy;
    }
    if (options.drawings?.timeMagnetGuideVisible !== undefined) {
      this.drawingOptions.timeMagnetGuideVisible = options.drawings.timeMagnetGuideVisible;
      if (!this.drawingOptions.timeMagnetGuideVisible && this.drawingSnapGuide !== null) {
        this.drawingSnapGuide = {
          ...this.drawingSnapGuide,
          time: null,
        };
      }
    }
    if (options.drawings?.timeMagnetLabelVisible !== undefined) {
      this.drawingOptions.timeMagnetLabelVisible = options.drawings.timeMagnetLabelVisible;
    }
    if (options.drawings?.timeMagnetTolerancePx !== undefined) {
      this.drawingOptions.timeMagnetTolerancePx = Math.max(0, options.drawings.timeMagnetTolerancePx);
    }
    if (options.drawings?.magnetSources !== undefined) {
      if (options.drawings.magnetSources.open !== undefined) {
        this.drawingOptions.magnetSources.open = options.drawings.magnetSources.open;
      }
      if (options.drawings.magnetSources.high !== undefined) {
        this.drawingOptions.magnetSources.high = options.drawings.magnetSources.high;
      }
      if (options.drawings.magnetSources.low !== undefined) {
        this.drawingOptions.magnetSources.low = options.drawings.magnetSources.low;
      }
      if (options.drawings.magnetSources.close !== undefined) {
        this.drawingOptions.magnetSources.close = options.drawings.magnetSources.close;
      }
    }

    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  public resize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error("chartx phase-one chart resize requires positive finite width and height");
    }

    this.manualLayout = {
      width: Math.round(width),
      height: Math.round(height),
    };
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  public timeScaleApi(): PhaseOneTimeScaleApi {
    return {
      getVisibleLogicalRange: () => {
        const pointCount = this.getPointCount();
        if (pointCount <= 0) {
          return null;
        }

        const layout = this.canvas === null
          ? DEFAULT_LAYOUT
          : measureLayout(this.canvas, this.manualLayout);
        const paneWidth = Math.max(40, layout.width - layout.left - layout.right);
        const spacing = resolveBarSpacing(this.barSpacing, paneWidth, pointCount);
        const lastIndex = pointCount - 1;

        return {
          from: lastIndex - paneWidth / spacing + this.rightOffset,
          to: lastIndex + this.rightOffset,
        };
      },
      setVisibleLogicalRange: (range) => {
        const pointCount = this.getPointCount();
        if (!Number.isFinite(range.from) || !Number.isFinite(range.to) || range.to <= range.from) {
          throw new Error("chartx phase-one time scale visible range requires finite from/to with to > from");
        }
        if (pointCount <= 0) {
          throw new Error("chartx phase-one time scale visible range requires at least one data point");
        }
        const layout = this.canvas === null
          ? DEFAULT_LAYOUT
          : measureLayout(this.canvas, this.manualLayout);
        const paneWidth = Math.max(40, layout.width - layout.left - layout.right);
        const spacing = Math.max(MIN_BAR_SPACING, paneWidth / (range.to - range.from));
        const lastIndex = pointCount - 1;
        this.barSpacing = spacing;
        this.rightOffset = range.to - lastIndex;
        this.timeScale.applyOptions({
          width: paneWidth,
          pointCount,
          barSpacing: this.barSpacing,
          rightOffset: this.rightOffset,
        });
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      applyOptions: (options) => {
        if (options.barSpacing !== undefined) {
          this.barSpacing = clamp(options.barSpacing, MIN_BAR_SPACING, MAX_BAR_SPACING);
        }
        if (options.rightOffset !== undefined) {
          this.rightOffset = options.rightOffset;
        }
        if (options.tickMarkFormatter !== undefined) {
          this.timeAxisFormatter = options.tickMarkFormatter;
        }

        const layout = this.canvas === null
          ? DEFAULT_LAYOUT
          : measureLayout(this.canvas, this.manualLayout);
        const paneWidth = Math.max(40, layout.width - layout.left - layout.right);
        this.timeScale.applyOptions({
          width: paneWidth,
          pointCount: this.getPointCount(),
          barSpacing: resolveBarSpacing(this.barSpacing, paneWidth, this.getPointCount()),
          rightOffset: this.rightOffset,
        });

        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
  }

  public priceScaleApi(): PhaseOnePriceScaleApi {
    return {
      getVisibleRange: () =>
        this.primaryPriceRangeOverride?.toRaw() ??
        this.primaryPriceScale.getPriceRange()?.toRaw() ??
        this.chartModel.secondaryScales()[0]?.getPriceRange()?.toRaw() ??
        null,
      setVisibleRange: (range) => {
        this.primaryPriceRangeOverride = PriceRangeImpl.fromRaw(range);
        if (this.primaryPriceRangeOverride !== null && this.canvas !== null) {
          const layout = measureLayout(this.canvas, this.manualLayout);
          const plotHeight = Math.max(0, layout.height - layout.top - layout.bottom);
          const paneHeight =
            buildPaneFrames(this.panes.list(), plotHeight, PANE_GAP).find((pane) => pane.kind === "primary")
              ?.height ?? plotHeight;
          this.primaryPriceScale.applyOptions({
            height: paneHeight,
            priceRange: this.primaryPriceRangeOverride,
          });
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      applyOptions: (options) => {
        if (options.priceFormatter !== undefined) {
          this.priceAxisFormatter = options.priceFormatter;
        }
        if (options.scaleSeriesOnly !== undefined) {
          this.primaryScaleSeriesOnly = options.scaleSeriesOnly;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
  }

  public subscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void {
    this.crosshairMoveHandlers.add(handler);
  }

  public unsubscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void {
    this.crosshairMoveHandlers.delete(handler);
  }

  public subscribeClick(handler: PhaseOneClickHandler): void {
    this.clickHandlers.add(handler);
  }

  public unsubscribeClick(handler: PhaseOneClickHandler): void {
    this.clickHandlers.delete(handler);
  }

  public getSelectedDrawing(): PhaseOneSelectedDrawing {
    return this.buildSelectedDrawingState();
  }

  public getSelectedDrawingState(): PhaseOneDrawingStateSnapshot | null {
    if (this.selectedDrawingId === null) {
      return null;
    }
    const drawing = this.getDrawingById(this.selectedDrawingId);
    if (drawing === undefined) {
      return null;
    }
    return (
      buildDrawingStateSnapshots([drawing], {
        getPaneIndex: (paneId) => this.getPaneIndex(paneId),
        resolveMagnetOptions: (entry) =>
          resolveDrawingMagnetOptionsUseCase(entry as ChartDrawingDescriptor, this.drawingOptions),
      })[0] ?? null
    );
  }

  public getSelectedDrawingPropertySchema(): PhaseOneDrawingPropertySchema | null {
    const snapshot = this.getSelectedDrawingState();
    if (snapshot === null) {
      return null;
    }
    return DRAWING_PROPERTY_SCHEMAS[snapshot.type];
  }

  public applySelectedDrawingOptions(
    options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions,
  ): void {
    if (this.selectedDrawingId === null) {
      throw new Error("chartx phase-one chart has no selected drawing to update");
    }
    const drawing = this.getDrawingById(this.selectedDrawingId);
    if (drawing === undefined) {
      throw new Error("chartx phase-one chart has no selected drawing to update");
    }
    drawing.api.applyOptions(options as never);
  }

  public clearSelectedDrawing(): void {
    this.selectDrawing(null);
  }

  public subscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void {
    this.drawingSelectionHandlers.add(handler);
  }

  public unsubscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void {
    this.drawingSelectionHandlers.delete(handler);
  }

  public subscribePaneEvents(handler: PhaseOnePaneEventHandler): void {
    this.paneEventHandlers.add(handler);
  }

  public unsubscribePaneEvents(handler: PhaseOnePaneEventHandler): void {
    this.paneEventHandlers.delete(handler);
  }

  public subscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void {
    this.chartTypeChangeHandlers.add(handler);
  }

  public unsubscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void {
    this.chartTypeChangeHandlers.delete(handler);
  }

  public getChartType(): PhaseOneMainChartType | null {
    return this.chartModel.context().snapshot().chartType;
  }

  public getMainSeriesState(): PhaseOneMainSeriesStateSnapshot | null {
    const source = this.getMainSource();
    return buildMainSeriesStateSnapshot(
      source === null
        ? null
        : {
            chartType: source.chartType,
            options: source.options as Record<string, unknown>,
            lineBreakOptions: source.lineBreakOptions,
            renkoOptions: source.renkoOptions,
            pointFigureOptions: source.pointFigureOptions,
            kagiOptions: source.kagiOptions,
          },
    );
  }

  public applyMainSeriesState(state: PhaseOneMainSeriesStateSnapshot): PhaseOneMainSeriesApi {
    return applyMainSeriesStateSnapshot(state, {
      current: this.getMainSource(),
      ensureAttached: (chartType) => this.attachPrimarySeries(chartType),
      switchChartType: (chartType) => this.setChartType(chartType),
      getCurrentSource: () => this.getMainSourceOrThrow(),
      createOptions: (styleSchemaId) => this.createMainSeriesOptions(styleSchemaId),
      rebuildData: (source) => {
        source.data = applyMainSeriesBuilderData(source.inputData, source);
      },
      syncContext: (source) => {
        this.syncChartContextFromMainSource(source);
      },
      resetPrimaryPriceRangeOverride: () => {
        this.primaryPriceRangeOverride = null;
      },
      finalize: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  public getChartState(): PhaseOneChartStateSnapshot {
    return createChartStateSnapshot({
      getOptions: () => ({
        layout: { ...this.chartOptions },
        crosshair: { ...this.crosshairOptions },
      }),
      getTimeScaleState: () => ({
        barSpacing: this.barSpacing,
        rightOffset: this.rightOffset,
        visibleLogicalRange: this.timeScaleApi().getVisibleLogicalRange(),
      }),
      getPriceScaleState: () => ({
        visibleRange: this.priceScaleApi().getVisibleRange(),
        scaleSeriesOnly: this.primaryScaleSeriesOnly,
      }),
      getPanesState: () =>
        this.panes
          .list()
          .filter((pane) => pane.kind === "secondary")
          .map((pane) => ({
            height: pane.preferredHeight,
            resizable: pane.resizable,
          })),
      getMainSeriesState: () => this.getMainSeriesState(),
      getSeriesState: () =>
        buildSeriesStateSnapshots(this.chartModel.listSourcesByRole("study"), {
          getPaneIndex: (paneId) => this.getPaneIndex(paneId),
        }),
      getStudiesState: () =>
        buildStudyStateSnapshots(this.chartModel.listSourcesByRole("study"), {
          getPaneIndex: (paneId) => this.getPaneIndex(paneId),
          defaultCompareOptions: this.defaultCompareOptions,
        }),
      getTradeLocationState: () =>
        this.activeTradeLocation === null
          ? null
          : {
              request: this.activeTradeLocation.request,
              overlay: this.activeTradeLocation.options,
            },
      getDrawingsState: () =>
        buildDrawingStateSnapshots(this.drawingRegistry.list(), {
          getPaneIndex: (paneId) => this.getPaneIndex(paneId),
          resolveMagnetOptions: (drawing) =>
            resolveDrawingMagnetOptionsUseCase(drawing as ChartDrawingDescriptor, this.drawingOptions),
        }),
    }) as PhaseOneChartStateSnapshot;
  }

  public applyChartState(state: PhaseOneChartStateSnapshot): void {
    this.applyChartStateSnapshot(state);
  }

  public getChartTemplate(): PhaseOneChartTemplate {
    return createChartTemplate(this.getChartState());
  }

  public applyChartTemplate(template: PhaseOneChartTemplateInput): void {
    applyChartTemplate(template, {
      normalize: normalizeChartTemplate,
      applyChartState: (state) => {
        this.applyChartStateSnapshot(state);
      },
    });
  }

  public locateTrade(
    request: PhaseOneTradeLocationRequest,
    options: PhaseOneTradeOverlayOptions = {},
  ): PhaseOneTradeLocationState | null {
    this.getMainSourceOrThrow();
    this.activeTradeLocation = {
      request,
      options: resolveTradeOverlayOptions(options),
      state: null,
    };
    this.refreshTradeLocation();
    return this.activeTradeLocation?.state ?? null;
  }

  public clearTradeLocation(): void {
    this.activeTradeLocation = null;
    this.primaryPriceRangeOverride = null;
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  public getTradeLocationState(): PhaseOneTradeLocationState | null {
    return this.activeTradeLocation?.state ?? null;
  }

  private applyChartStateSnapshot(state: PhaseOneChartStateSnapshot): void {
    applyValidatedChartState(state, {
      validateDrawings: (drawings, secondaryPaneCount) => {
        this.assertChartDrawingSnapshotsValid(drawings, secondaryPaneCount);
      },
      restoreDeps: {
        applyOptions: (options) => {
          this.applyOptions(options);
        },
        clearSelection: () => {
          this.selectDrawing(null, false);
        },
        clearDrawings: () => {
          this.clearRestorableChartDrawings();
        },
        clearStudies: () => {
          this.clearRestorableChartStudies();
        },
        clearSeries: () => {
          this.clearRestorableChartSeries();
        },
        clearTradeLocation: () => {
          this.clearTradeLocation();
        },
        listSecondaryPaneIds: () =>
          this.panes
            .list()
            .filter((pane) => pane.kind === "secondary")
            .map((pane) => pane.id),
        getSecondarySeriesCountForPane: (paneId) => this.getSecondarySeriesForPane(paneId).length,
        removeSecondaryPane: (paneId) => {
          this.removePaneById(paneId);
        },
        addSecondaryPane: (paneState) => {
          this.addPane({
            height: paneState.height ?? undefined,
            resizable: paneState.resizable,
          });
        },
        applySecondaryPaneState: (index, paneState) => {
          const pane = this.panes.list().filter((entry) => entry.kind === "secondary")[index];
          if (pane === undefined) {
            return;
          }
          pane.preferredHeight = normalizePaneHeight(paneState.height ?? undefined);
          pane.resizable = paneState.resizable;
          this.emitPaneEvent("options", pane.id);
        },
        applyMainSeriesState: (mainSeriesState) => {
          this.applyMainSeriesState(mainSeriesState);
        },
        restoreSeries: (series) => {
          this.restoreChartSeries(series);
        },
        restoreStudies: (studies) => {
          this.restoreChartStudies(studies);
        },
        locateTrade: (request, overlay) => {
          this.locateTrade(request, overlay);
        },
        restoreDrawings: (drawings) => {
          this.restoreChartDrawings(drawings);
        },
        applyTimeScaleState: (timeScaleState) => {
          this.timeScaleApi().applyOptions({
            barSpacing: timeScaleState.barSpacing ?? undefined,
            rightOffset: timeScaleState.rightOffset,
          });
          if (timeScaleState.visibleLogicalRange !== null) {
            this.timeScaleApi().setVisibleLogicalRange(timeScaleState.visibleLogicalRange);
          }
        },
        applyPriceScaleState: (priceScaleState) => {
          this.priceScaleApi().applyOptions({
            scaleSeriesOnly: priceScaleState.scaleSeriesOnly,
          });
          this.priceScaleApi().setVisibleRange(priceScaleState.visibleRange);
        },
        finalize: () => {
          if (this.canvas !== null) {
            this.render(this.canvas);
          }
        },
      },
    });
  }

  private clearRestorableChartStudies(): void {
    this.chartModel.removeSourcesWhere((source) =>
      source.role === "study" &&
      (
        source.studyKind === "overlay" ||
        source.studyKind === "compare" ||
        (source.studyKind === "indicator" && source.indicator?.kind === "moving-average")
      ));
  }

  private clearRestorableChartSeries(): void {
    this.chartModel.removeSourcesWhere((source) =>
      source.role === "study" && source.studyKind === "series");
  }

  private clearRestorableChartDrawings(): void {
    for (const drawing of this.drawingRegistry.list()) {
      this.drawingRegistry.removeByApi(drawing.api);
    }
  }

  private restoreChartSeries(series: readonly PhaseOneChartStateSnapshot["series"][number][]): void {
    restoreChartSeriesUseCase(series as readonly PhaseOneRestorableSeriesSnapshot[], {
      getPaneByIndex: (paneIndex) => this.panes.getByIndex(paneIndex),
      createPaneTarget: (pane) => ({ pane: this.createPaneHandle(pane.id) } satisfies PhaseOneSeriesTarget),
      restoreCandlestick: (target, snapshot) => {
        const restored = this.addCandlestickSeries(target);
        restored.applyOptions(snapshot.options);
        restored.setData(snapshot.data);
      },
      restoreBar: (target, snapshot) => {
        const restored = this.addBarSeries(target);
        restored.applyOptions(snapshot.options);
        restored.setData(snapshot.data);
      },
      restoreLine: (target, snapshot) => {
        const restored = this.addLineSeries(target);
        restored.applyOptions(snapshot.options);
        restored.setData(snapshot.data);
      },
      restoreArea: (target, snapshot) => {
        const restored = this.addAreaSeries(target);
        restored.applyOptions(snapshot.options);
        restored.setData(snapshot.data);
      },
      restoreBaseline: (target, snapshot) => {
        const restored = this.addBaselineSeries(target);
        restored.applyOptions(snapshot.options);
        restored.setData(snapshot.data);
      },
      restoreHistogram: (target, snapshot) => {
        const restored = this.addHistogramSeries(target);
        restored.applyOptions(snapshot.options);
        restored.setData(snapshot.data);
      },
      restoreVolume: (target, snapshot) => {
        const restored = this.addVolumeSeries(target);
        restored.applyOptions(snapshot.options);
        restored.setData(snapshot.data);
      },
    });
  }

  private restoreChartStudies(studies: readonly PhaseOneChartStateSnapshot["studies"][number][]): void {
    restoreChartStudiesUseCase(studies, {
      getPaneByIndex: (paneIndex) => this.panes.getByIndex(paneIndex),
      getPaneId: (pane) => pane.id,
      restoreOverlay: (paneId, snapshot) => {
        const overlay = this.addStudyLineSeries(paneId, "overlay");
        overlay.applyOptions(snapshot.seriesOptions);
        overlay.setData(snapshot.data);
      },
      restoreCompare: (paneId, snapshot) => {
        const compare = this.addCompareStudySeries(paneId);
        compare.applyOptions(snapshot.seriesOptions);
        compare.applyCompareOptions(snapshot.compareOptions);
        compare.setData(snapshot.data);
      },
      restoreMovingAverage: (paneId, snapshot) => {
        const movingAverage = this.addMovingAverageStudySeries(paneId);
        movingAverage.applyOptions(snapshot.seriesOptions);
        movingAverage.applyStudyOptions(snapshot.studyOptions);
      },
    });
  }

  private restoreChartDrawings(drawings: readonly PhaseOneChartStateSnapshot["drawings"][number][]): void {
    restoreDrawingCollection(drawings as readonly PhaseOneRestorableDrawingSnapshot[], {
      resolvePaneTarget: (paneIndex) => {
        const pane = this.panes.getByIndex(paneIndex);
        if (pane === undefined) {
          throw new Error("chartx phase-one chart state refers to a pane index that does not exist");
        }
        return { pane: this.createPaneHandle(pane.id) } satisfies PhaseOneSeriesTarget;
      },
      restoreHorizontalLine: (target, snapshot) => {
        this.addHorizontalLineDrawing(target, snapshot.options);
      },
      restoreTrendLine: (target, snapshot) => {
        this.addTrendLineDrawing(target, snapshot.options);
      },
    });
  }

  private assertChartDrawingSnapshotsValid(
    drawings: readonly PhaseOneChartStateSnapshot["drawings"][number][],
    secondaryPaneCount: number,
  ): void {
    const maxPaneIndex = secondaryPaneCount;
    for (const drawing of drawings) {
      if (drawing.paneIndex < 0 || drawing.paneIndex > maxPaneIndex) {
        throw new Error("chartx phase-one chart state refers to a pane index that does not exist");
      }
      if (drawing.type === "horizontal-line") {
        assertDrawingTargetValid({
          kind: "horizontal-line",
          price: drawing.options.price,
          lineWidth: drawing.options.lineWidth ?? 1,
        });
        continue;
      }
      assertDrawingTargetValid({
        kind: "trend-line",
        startTime: drawing.options.startTime ?? Number.NaN,
        startPrice: drawing.options.startPrice ?? Number.NaN,
        endTime: drawing.options.endTime ?? Number.NaN,
        endPrice: drawing.options.endPrice ?? Number.NaN,
        lineWidth: drawing.options.lineWidth ?? 1,
      });
    }
  }

  public setChartType(type: PhaseOneMainChartType): PhaseOneMainSeriesApi {
    const current = this.getMainSourceOrThrow();
    if (current.chartType === type) {
      return current.api as PhaseOneMainSeriesApi;
    }

    const removed = this.chartModel.removeSourceByApi(current.api);
    if (removed === undefined) {
      throw new Error("chartx phase-one chart could not replace the active main series");
    }

    this.primaryPriceRangeOverride = null;
    const nextSeries = this.attachPrimarySeries(type, {
      id: current.id,
      label: current.label,
      data: [...current.inputData],
      visuals: new Map(current.visuals),
      markers: [...current.markers],
      priceLines: clonePriceLines(current.priceLines),
      options: { ...(current.options as Record<string, unknown>) },
      previousStyleSchemaId: current.styleSchemaId,
    });

    if (this.canvas !== null) {
      this.render(this.canvas);
    }
    this.emitChartTypeChange(type);
    return nextSeries;
  }

  public setData(data: readonly PhaseOneCandlestickData[]): void {
    this.setPrimaryData(data);
  }

  public update(bar: PhaseOneCandlestickData): void {
    this.updatePrimary(bar);
  }

  private setPrimaryData(data: readonly PhaseOneCandlestickData[]): void {
    replaceMainSeriesData(this.getMainSourceOrThrow(), data, {
      rebuild: (source) => {
        source.data = applyMainSeriesBuilderData(source.inputData, source);
      },
      syncContext: (source) => this.syncChartContextFromMainSource(source),
      resetViewport: () => {
        this.primaryPriceRangeOverride = null;
        this.barSpacing = null;
        this.rightOffset = DEFAULT_RIGHT_OFFSET;
      },
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private updatePrimary(bar: PhaseOneCandlestickData): void {
    updateMainSeriesData(this.getMainSourceOrThrow(), bar, {
      updateCanonical: (existing, nextBar) => updateCanonicalData(existing, nextBar),
      rebuild: (source) => {
        source.data = applyMainSeriesBuilderData(source.inputData, source);
      },
      syncContext: (source) => this.syncChartContextFromMainSource(source),
      clearPriceRangeOverride: () => {
        this.primaryPriceRangeOverride = null;
      },
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private setPrimaryHistogramLikeData(
    data: readonly PhaseOneHistogramData[],
  ): void {
    replaceMainHistogramLikeData(this.getMainSourceOrThrow(), data, {
      buildVisuals: (rows) => buildHistogramVisuals(rows),
      normalizeData: (rows) => normalizeHistogramData(rows),
      replaceMainSeriesData: (source, canonicalData) => replaceMainSeriesData(source, canonicalData, {
        rebuild: (nextSource) => {
          nextSource.data = applyMainSeriesBuilderData(nextSource.inputData, nextSource);
        },
        syncContext: (nextSource) => this.syncChartContextFromMainSource(nextSource),
        resetViewport: () => {
          this.primaryPriceRangeOverride = null;
          this.barSpacing = null;
          this.rightOffset = DEFAULT_RIGHT_OFFSET;
        },
        render: () => {
          if (this.canvas !== null) {
            this.render(this.canvas);
          }
        },
      }),
    });
  }

  private updatePrimaryHistogramLike(bar: PhaseOneHistogramData): void {
    updateMainHistogramLikeData(this.getMainSourceOrThrow(), bar, {
      normalizeBar: (nextBar) => normalizeHistogramBar(nextBar),
      updateMainSeriesData: (source, canonicalBar) => updateMainSeriesData(source, canonicalBar, {
        updateCanonical: (existing, nextValue) => updateCanonicalData(existing, nextValue),
        rebuild: (nextSource) => {
          nextSource.data = applyMainSeriesBuilderData(nextSource.inputData, nextSource);
        },
        syncContext: (nextSource) => this.syncChartContextFromMainSource(nextSource),
        clearPriceRangeOverride: () => {
          this.primaryPriceRangeOverride = null;
        },
        render: () => {
          if (this.canvas !== null) {
            this.render(this.canvas);
          }
        },
      }),
    });
  }

  private getPointCount(): number {
    let pointCount = this.buildMainBarSequence(this.getMainSource()).logicalLength;
    for (const state of this.chartModel.listSources()) {
      const rows = state.role === "main-series" && this.chartModel.context().snapshot().mainSourceId === state.id
        ? this.chartModel.context().snapshot().barSequence.bars
        : state.store.setData(state.data);
      const logicalLength =
        rows.length === 0 ? 0 : Math.ceil(rows[rows.length - 1]?.index ?? 0) + 1;
      pointCount = Math.max(pointCount, logicalLength);
    }
    return pointCount;
  }

  private applySeriesFormatterOptions(
    seriesOptions: PhaseOneSeriesFormatterOptions,
    options: PhaseOneSeriesFormatterOptions,
  ): void {
    if (options.valueFormatter !== undefined) {
      seriesOptions.valueFormatter = options.valueFormatter;
    }
  }

  private addPrimaryLineSeries(): PhaseOneLineSeriesApi {
    return this.attachPrimarySeries("line") as PhaseOneLineSeriesApi;
  }

  private addPrimaryAreaSeries(): PhaseOneAreaSeriesApi {
    return this.attachPrimarySeries("area") as PhaseOneAreaSeriesApi;
  }

  private addPrimaryBaselineSeries(): PhaseOneBaselineSeriesApi {
    return this.attachPrimarySeries("baseline") as PhaseOneBaselineSeriesApi;
  }

  private addPrimaryBarSeries(): PhaseOneBarSeriesApi {
    return this.attachPrimarySeries("bar") as PhaseOneBarSeriesApi;
  }

  private addPrimaryHistogramSeries(): PhaseOneHistogramSeriesApi {
    return this.attachPrimarySeries("histogram") as PhaseOneHistogramSeriesApi;
  }

  private addSecondaryCandlestickSeries(target: string): PhaseOneCandlestickSeriesApi {
    const meta = this.createSeriesMeta("candlestick");
    const api = this.createSecondarySeriesApiDeps((deps) => createSecondaryCandlestickSeriesApi(deps));
    this.attachStudySeries(target, "candlestick", api, meta);
    return api;
  }

  private addSecondaryLineSeries(paneId: string): PhaseOneLineSeriesApi {
    return this.addStudyLineSeries(paneId, "series");
  }

  private addStudyLineSeries(
    paneId: string,
    studyKind: StudySourceKind,
  ): PhaseOneLineSeriesApi {
    const meta = this.createSeriesMeta("line");
    const api = this.createSecondarySeriesApiDeps((deps) => createSecondaryLineSeriesApi(deps));
    this.attachStudySeries(paneId, "line", api, meta, studyKind);
    return api;
  }

  private addCompareStudySeries(paneId: string): PhaseOneCompareSeriesApi {
    const meta = this.createSeriesMeta("line");
    const api = this.createSecondarySeriesApiDeps((deps) => createCompareStudySeriesApi(deps));
    this.attachStudySeries(paneId, "line", api, meta, "compare");
    return api;
  }

  private addMovingAverageStudySeries(paneId: string): PhaseOneMovingAverageStudyApi {
    const meta = this.createSeriesMeta("line");
    const api = this.createSecondarySeriesApiDeps((deps) => createMovingAverageStudySeriesApi(deps));
    this.attachStudySeries(paneId, "line", api, meta, "indicator", {
      kind: "moving-average",
      length: this.defaultMovingAverageOptions.length,
    });
    return api;
  }

  private addSecondaryAreaSeries(paneId: string): PhaseOneAreaSeriesApi {
    const meta = this.createSeriesMeta("area");
    const api = this.createSecondarySeriesApiDeps((deps) => createSecondaryAreaSeriesApi(deps));
    this.attachStudySeries(paneId, "area", api, meta);
    return api;
  }

  private addSecondaryBaselineSeries(paneId: string): PhaseOneBaselineSeriesApi {
    const meta = this.createSeriesMeta("baseline");
    const api = this.createSecondarySeriesApiDeps((deps) => createSecondaryBaselineSeriesApi(deps));
    this.attachStudySeries(paneId, "baseline", api, meta);
    return api;
  }

  private addSecondaryBarSeries(paneId: string): PhaseOneBarSeriesApi {
    const meta = this.createSeriesMeta("bar");
    const api = this.createSecondarySeriesApiDeps((deps) => createSecondaryBarSeriesApi(deps));
    this.attachStudySeries(paneId, "bar", api, meta);
    return api;
  }

  private addSecondaryHistogramSeries(paneId: string): PhaseOneHistogramSeriesApi {
    const meta = this.createSeriesMeta("histogram");
    const api = this.createSecondarySeriesApiDeps((deps) => createSecondaryHistogramSeriesApi(deps));
    this.attachStudySeries(paneId, "histogram", api, meta);
    return api;
  }

  private addSecondaryVolumeSeries(paneId: string): PhaseOneVolumeSeriesApi {
    const meta = this.createSeriesMeta("volume");
    const api = this.createSecondarySeriesApiDeps((deps) => createSecondaryVolumeSeriesApi(deps));
    this.attachStudySeries(paneId, "volume", api, meta);
    return api;
  }

  private attachStudySeries(
    paneId: string,
    kind: ChartSeriesKind,
    api: SeriesSourceState["api"],
    meta: { id: string; label: string },
    studyKind: StudySourceKind = "series",
    indicator?: MovingAverageIndicatorState,
  ): void {
    attachStudySource(
      { paneId, kind, api, meta, studyKind, indicator },
      {
        primaryPriceScale: this.primaryPriceScale,
        getOrCreateSecondaryPriceScale: (nextPaneId) => this.getOrCreateSecondaryPanePriceScale(nextPaneId),
        createSourceState: ({ paneId: nextPaneId, kind: nextKind, api: nextApi, meta: nextMeta, priceScale, priceScaleId, studyKind: nextStudyKind, indicator: nextIndicator }) =>
          createStudySourceState<
            PhaseOneCandlestickData,
            ChartSeriesApi,
            ChartSeriesKind,
            StudySourceState["options"],
            HistogramVisual,
            PriceLineState,
            SeriesMarkerState,
            Required<PhaseOneCompareSeriesOptions>
          >({
            paneId: nextPaneId,
            kind: nextKind as ChartSeriesKind,
            api: nextApi as ChartSeriesApi,
            meta: nextMeta,
            priceScale,
            priceScaleId,
            studyKind: nextStudyKind,
            indicator: nextIndicator,
            defaultCompareOptions: this.defaultCompareOptions,
            createOptions: (createKind) => this.createSeriesOptions(createKind),
          }),
        registerSource: (source) => this.chartModel.registerSource(source),
      },
    );
  }

  private createSecondarySeriesApiDeps<T>(build: (deps: {
    assertSeriesActive(api: unknown): void;
    getSource(api: unknown, kind: "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume"): SecondaryApiSourceState;
    applySeriesFormatterOptions(seriesOptions: object, options: object): void;
    render(): void;
    setSecondaryData(api: unknown, data: readonly PhaseOneCandlestickData[], kind: "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume"): void;
    updateSecondary(api: unknown, bar: PhaseOneCandlestickData, kind: "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume"): void;
    setSecondaryHistogramLikeData(
      api: unknown,
      data: readonly PhaseOneHistogramData[] | readonly PhaseOneVolumeData[],
      kind: "histogram" | "volume",
    ): void;
    updateSecondaryHistogramLike(
      api: unknown,
      bar: PhaseOneHistogramData | PhaseOneVolumeData,
      kind: "histogram" | "volume",
    ): void;
    normalizeLineData(data: readonly PhaseOneLineData[]): readonly PhaseOneCandlestickData[];
    normalizeLineBar(bar: PhaseOneLineData): PhaseOneCandlestickData;
    setMarkers(api: unknown, markers: readonly PhaseOneSeriesMarker[], kind: "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume"): void;
    createPriceLine(api: unknown, kind: "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume", options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
    removePriceLine(api: unknown, kind: "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume", line: PhaseOnePriceLineApi): void;
    applyCompareOptions(api: unknown, options: PhaseOneCompareSeriesOptions): void;
    getCompareOptions(api: unknown): Required<PhaseOneCompareSeriesOptions>;
    applyMovingAverageStudyOptions(api: unknown, options: PhaseOneMovingAverageStudyOptions): void;
    getMovingAverageStudyOptions(api: unknown): Required<PhaseOneMovingAverageStudyOptions>;
  }) => T): T {
    return build({
      assertSeriesActive: (api) => this.assertSeriesActive(api as SeriesSourceState["api"]),
      getSource: (api, kind) => this.getSourceByApi(api as ChartSeriesApi, kind),
      applySeriesFormatterOptions: (seriesOptions, options) =>
        this.applySeriesFormatterOptions(
          seriesOptions as PhaseOneSeriesFormatterOptions,
          options as PhaseOneSeriesFormatterOptions,
        ),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setSecondaryData: (api, data, kind) => this.setSecondaryData(api as SeriesSourceState["api"], data, kind),
      updateSecondary: (api, bar, kind) => this.updateSecondary(api as SeriesSourceState["api"], bar, kind),
      setSecondaryHistogramLikeData: (api, data, kind) =>
        this.setSecondaryHistogramLikeData(api as SeriesSourceState["api"], data, kind),
      updateSecondaryHistogramLike: (api, bar, kind) =>
        this.updateSecondaryHistogramLike(api as SeriesSourceState["api"], bar, kind),
      normalizeLineData,
      normalizeLineBar,
      setMarkers: (api, markers, kind) =>
        this.setSecondaryMarkers(api as SeriesSourceState["api"], markers, kind),
      createPriceLine: (api, kind, options) => {
        const state = this.getSourceByApi(api as ChartSeriesApi, kind);
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (api, kind, line) => {
        const state = this.getSourceByApi(api as ChartSeriesApi, kind);
        this.removePriceLineFromMap(state.priceLines, line);
      },
      applyCompareOptions: (api, options) => {
        applyCompareStudyOptions(this.getCompareStudyState(api as PhaseOneCompareSeriesApi), options, {
          defaultCompareOptions: this.defaultCompareOptions,
          resolveDisplayData: (state) => this.resolveStudyDisplayData(state as StudySourceState),
          render: () => {
            if (this.canvas !== null) {
              this.render(this.canvas);
            }
          },
        });
      },
      getCompareOptions: (api) =>
        getCompareStudyOptions(
          this.getCompareStudyState(api as PhaseOneCompareSeriesApi),
          this.defaultCompareOptions,
        ),
      applyMovingAverageStudyOptions: (api, options) => {
        applyMovingAverageStudyOptions(this.getMovingAverageStudyState(api as PhaseOneMovingAverageStudyApi), options, {
          defaultMovingAverageOptions: this.defaultMovingAverageOptions,
          resolveDisplayData: (state) => this.resolveStudyDisplayData(state as StudySourceState),
          render: () => {
            if (this.canvas !== null) {
              this.render(this.canvas);
            }
          },
        });
      },
      getMovingAverageStudyOptions: (api) =>
        getMovingAverageStudyOptions(
          this.getMovingAverageStudyState(api as PhaseOneMovingAverageStudyApi),
          this.defaultMovingAverageOptions,
        ),
    });
  }

  private setSecondaryData(
    api: SeriesSourceState["api"],
    data: readonly PhaseOneCandlestickData[],
    kind: ChartSeriesKind,
  ): void {
    replaceStudySeriesData(this.getSourceByApi(api, kind), data, {
      resolveDisplayData: (source) => this.resolveStudyDisplayData(source as StudySourceState),
      resetViewport: () => {
        this.barSpacing = null;
        this.rightOffset = DEFAULT_RIGHT_OFFSET;
      },
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private updateSecondary(
    api: SeriesSourceState["api"],
    bar: PhaseOneCandlestickData,
    kind: ChartSeriesKind,
  ): void {
    updateStudySeriesData(this.getSourceByApi(api, kind), bar, {
      updateCanonical: (existing, nextBar) => updateCanonicalData(existing, nextBar),
      resolveDisplayData: (source) => this.resolveStudyDisplayData(source as StudySourceState),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private setSecondaryHistogramLikeData(
    api: SeriesSourceState["api"],
    data: readonly PhaseOneHistogramData[] | readonly PhaseOneVolumeData[],
    kind: ChartSeriesKind,
  ): void {
    replaceStudyHistogramLikeData(this.getSourceByApi(api, kind), data, {
      buildVisuals: (rows) => buildHistogramVisuals(rows),
      normalizeData: (rows) => normalizeHistogramData(rows),
      replaceStudySeriesData: (source, canonicalData) => replaceStudySeriesData(source, canonicalData, {
        resolveDisplayData: (nextSource) => this.resolveStudyDisplayData(nextSource as StudySourceState),
        resetViewport: () => {
          this.barSpacing = null;
          this.rightOffset = DEFAULT_RIGHT_OFFSET;
        },
        render: () => {
          if (this.canvas !== null) {
            this.render(this.canvas);
          }
        },
      }),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private updateSecondaryHistogramLike(
    api: SeriesSourceState["api"],
    bar: PhaseOneHistogramData | PhaseOneVolumeData,
    kind: ChartSeriesKind,
  ): void {
    updateStudyHistogramLikeData(this.getSourceByApi(api, kind), bar, {
      normalizeBar: (nextBar) => normalizeHistogramBar(nextBar),
      updateStudySeriesData: (source, canonicalBar) => updateStudySeriesData(source, canonicalBar, {
        updateCanonical: (existing, nextValue) => updateCanonicalData(existing, nextValue),
        resolveDisplayData: (nextSource) => this.resolveStudyDisplayData(nextSource as StudySourceState),
        render: () => {
          if (this.canvas !== null) {
            this.render(this.canvas);
          }
        },
      }),
    });
  }

  private setSecondaryMarkers(
    api: SeriesSourceState["api"],
    markers: readonly PhaseOneSeriesMarker[],
    kind: ChartSeriesKind,
  ): void {
    const state = this.getSourceByApi(api, kind);
    state.markers = normalizeMarkers(markers);
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private createPaneHandle(paneId: string): PhaseOnePaneApi {
    const pane: PhaseOnePaneApi = {
      paneIndex: () => this.getPaneIndex(paneId),
      getHeight: () => this.getPaneHeight(paneId),
      getOptions: () => this.getPaneOptions(paneId),
      applyOptions: (options) => {
        this.applyPaneOptions(paneId, options);
      },
      setHeight: (height) => {
        this.setPaneHeight(paneId, height);
      },
      isPrimary: () => this.getPaneById(paneId)?.kind === "primary",
      isResizable: () => this.getPaneById(paneId)?.resizable ?? false,
      subscribeResize: (handler) => {
        this.subscribePaneResize(paneId, handler);
      },
      unsubscribeResize: (handler) => {
        this.unsubscribePaneResize(paneId, handler);
      },
      hasSeries: () => this.paneHasSeries(paneId),
      remove: () => {
        this.removePaneById(paneId);
      },
    };
    this.paneHandleIds.set(pane, paneId);
    return pane;
  }

  private subscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void {
    if (this.getPaneById(paneId) === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }
    const handlers = this.paneResizeHandlers.get(paneId) ?? new Set<PhaseOnePaneResizeHandler>();
    handlers.add(handler);
    this.paneResizeHandlers.set(paneId, handlers);
  }

  private unsubscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void {
    const handlers = this.paneResizeHandlers.get(paneId);
    if (handlers === undefined) {
      return;
    }
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.paneResizeHandlers.delete(paneId);
    }
  }

  private getPaneById(paneId: string): PaneModelState | undefined {
    return this.panes.getById(paneId);
  }

  private getPaneIndex(paneId: string): number {
    const index = this.panes.getIndex(paneId);
    if (index === -1) {
      throw new Error("chartx phase-one pane has been removed");
    }
    return index;
  }

  private getPaneHeight(paneId: string): number {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }

    if (this.canvas === null) {
      return pane.preferredHeight ?? 0;
    }

    const layout = measureLayout(this.canvas, this.manualLayout);
    const frames = buildPaneFrames(
      this.panes.list(),
      layout.height - layout.top - layout.bottom,
      PANE_GAP,
    );
    const frame = frames.find((entry) => entry.id === paneId);
    if (frame === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }

    return frame.height;
  }

  private getPaneOptions(paneId: string): Required<PhaseOnePaneOptions> {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }

    return {
      height: pane.preferredHeight ?? 0,
      resizable: pane.resizable,
    };
  }

  private applyPaneOptions(paneId: string, options: PhaseOnePaneOptions): void {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }

    let optionsChanged = false;
    if (options.resizable !== undefined) {
      if (pane.kind === "primary") {
        throw new Error("chartx phase-one chart does not support changing primary pane resizability");
      }
      if (pane.resizable !== options.resizable) {
        pane.resizable = options.resizable;
        optionsChanged = true;
      }
    }

    if (options.height !== undefined) {
      this.setPaneHeight(paneId, options.height);
      if (optionsChanged) {
        this.emitPaneEvent("options", paneId);
      }
      return;
    }

    if (optionsChanged) {
      this.emitPaneEvent("options", paneId);
    }
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private setPaneHeight(paneId: string, height: number): void {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }
    if (pane.kind === "primary") {
      throw new Error("chartx phase-one chart does not support setting the primary pane height directly");
    }

    const nextHeight = normalizePaneHeight(height);
    const previousHeight = pane.preferredHeight;
    pane.preferredHeight = nextHeight;
    if (previousHeight !== nextHeight) {
      this.emitPaneResize(paneId);
      this.emitPaneEvent("resized", paneId);
    }
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private applyPaneResize(clientY: number, layout: Layout, paneFrames: readonly PaneFrame[]): void {
    if (this.paneResizeState === null) {
      return;
    }

    const delta = Math.round(clientY - this.paneResizeState.startClientY);
    const upperPane = this.getPaneById(this.paneResizeState.dividerAfterPaneId);
    const lowerPane = this.getPaneById(this.paneResizeState.dividerBeforePaneId);
    if (upperPane === undefined || lowerPane === undefined) {
      return;
    }

    const controlsUpperPane = upperPane.kind === "secondary";
    const controlledPane = controlsUpperPane ? upperPane : lowerPane;
    if (!controlledPane.resizable) {
      return;
    }

    const minControlled = normalizePaneHeight(72);
    const startControlled = controlsUpperPane
      ? this.paneResizeState.startUpperHeight
      : this.paneResizeState.startLowerHeight;
    const requestedHeight = controlsUpperPane
      ? startControlled + delta
      : startControlled - delta;
    const minPrimaryHeight = 160;
    const totalResizableSpan = this.paneResizeState.startUpperHeight + this.paneResizeState.startLowerHeight;
    const maxControlled = Math.max(minControlled, totalResizableSpan - minPrimaryHeight);
    const nextControlled = clamp(Math.round(requestedHeight), minControlled, maxControlled);

    const previousHeight = controlledPane.preferredHeight;
    controlledPane.preferredHeight = normalizePaneHeight(nextControlled);
    if (previousHeight !== controlledPane.preferredHeight) {
      this.emitPaneResize(controlledPane.id);
      this.emitPaneEvent("resized", controlledPane.id);
    }

    if (this.canvas !== null) {
      const updatedFrames = buildPaneFrames(
        this.panes.list(),
        layout.height - layout.top - layout.bottom,
        PANE_GAP,
      );
      const divider = resolvePaneDividerByIds(
        updatedFrames,
        this.paneResizeState.dividerAfterPaneId,
        this.paneResizeState.dividerBeforePaneId,
        PANE_GAP,
      );
      if (divider !== null) {
        this.crosshair = {
          x: this.crosshair?.x ?? 0,
          y: divider.position,
        };
      }
    }
  }

  private paneHasSeries(paneId: string): boolean {
    return this.chartModel.listSourcesByPane(paneId).length > 0 || this.drawingRegistry.listByPane(paneId).length > 0;
  }

  private resolveSeriesTarget(
    target: PhaseOneSeriesTarget | PhaseOneVolumeSeriesTarget | undefined,
    options: { defaultToSecondary: boolean; allowPrimary: boolean },
  ): ResolvedSeriesTarget {
    if (target?.pane === undefined) {
      if (!options.defaultToSecondary) {
        return { kind: "primary" };
      }

      const existing = this.panes.list().find((pane) => pane.kind === "secondary")?.id;
      if (existing !== undefined) {
        return { kind: "secondary", paneId: existing };
      }

      const pane = this.addPane();
      const paneId = this.paneHandleIds.get(pane);
      if (paneId === undefined) {
        throw new Error("chartx phase-one chart failed to create a secondary pane");
      }
      return { kind: "secondary", paneId };
    }

    const pane =
      typeof target.pane === "number"
        ? this.panes.getByIndex(target.pane)
        : this.getPaneByHandle(target.pane);
    if (pane === undefined) {
      throw new Error("chartx phase-one chart series pane index is out of range");
    }

    if (pane.kind === "primary") {
      if (!options.allowPrimary) {
        throw new Error("chartx phase-one chart targeted series requires a secondary pane");
      }
      return { kind: "primary" };
    }
    return { kind: "secondary", paneId: pane.id };
  }

  private getPaneByHandle(handle: PhaseOnePaneApi): PaneModelState | undefined {
    const paneId = this.paneHandleIds.get(handle);
    if (paneId === undefined) {
      throw new Error("chartx phase-one chart pane handle must come from this chart");
    }
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }
    return pane;
  }

  private removePaneById(paneId: string): void {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }
    if (pane.kind === "primary") {
      throw new Error("chartx phase-one chart cannot remove the primary pane");
    }
    if (this.getSecondarySeriesForPane(paneId).length > 0) {
      throw new Error("chartx phase-one chart cannot remove a pane while a series is still attached");
    }
    if (this.drawingRegistry.listByPane(paneId).length > 0) {
      throw new Error("chartx phase-one chart cannot remove a pane while a drawing is still attached");
    }

    const removedPaneState = this.buildPaneState(paneId);
    this.panes.removeById(paneId);
    this.paneResizeHandlers.delete(paneId);
    this.chartModel.removeSecondaryScale(paneId);
    this.emitPaneEvent("removed", paneId, removedPaneState, this.buildPaneStateSnapshot());
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private emitPaneResize(paneId: string): void {
    const handlers = this.paneResizeHandlers.get(paneId);
    if (handlers === undefined || handlers.size === 0) {
      return;
    }
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      return;
    }
    const event: PhaseOnePaneResizeEvent = {
      paneIndex: this.getPaneIndex(paneId),
      height: this.getPaneHeight(paneId),
      isPrimary: pane.kind === "primary",
    };
    for (const handler of handlers) {
      handler(event);
    }
  }

  private emitPaneEvent(
    type: PhaseOnePaneEventType,
    paneId: string,
    explicitPaneState?: PhaseOnePaneState | null,
    explicitSnapshot?: readonly PhaseOnePaneState[],
  ): void {
    if (this.paneEventHandlers.size === 0) {
      return;
    }
    const paneState = explicitPaneState ?? this.buildPaneState(paneId);
    if (paneState === null) {
      return;
    }
    const event: PhaseOnePaneEvent = {
      type,
      pane: paneState,
      panes: explicitSnapshot ?? this.buildPaneStateSnapshot(),
    };
    for (const handler of this.paneEventHandlers) {
      handler(event);
    }
  }

  private buildPaneState(paneId: string): PhaseOnePaneState | null {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      return null;
    }
    const series = this.getPaneSeriesStates(paneId);
    const seriesKinds = series.map((item) => item.kind);
    return {
      paneIndex: this.getPaneIndex(paneId),
      height: this.getPaneHeight(paneId),
      isPrimary: pane.kind === "primary",
      resizable: pane.resizable,
      hasSeries: seriesKinds.length > 0,
      seriesCount: seriesKinds.length,
      seriesKinds,
      series,
    };
  }

  private buildPaneStateSnapshot(): readonly PhaseOnePaneState[] {
    return this.panes
      .list()
      .map((pane) => this.buildPaneState(pane.id))
      .filter((pane): pane is PhaseOnePaneState => pane !== null);
  }

  private getPaneSeriesStates(paneId: string): readonly PhaseOnePaneSeriesState[] {
    return this.chartModel.listSourcesByPane(paneId).map((source) => ({
      ...(source.role === "main-series"
        ? {
            styleOptionSurface: mainSeriesStyleSchemaSpec(source.styleSchemaId).optionSurface,
            styleOptionKeys: mainSeriesStyleSchemaSpec(source.styleSchemaId).optionKeys,
            styleTypeSpecificOptionKeys:
              mainSeriesStyleSchemaSpec(source.styleSchemaId).typeSpecificOptionKeys,
          }
        : {
            styleOptionSurface: null,
            styleOptionKeys: [],
            styleTypeSpecificOptionKeys: [],
          }),
      id: source.id,
      label: source.label,
      kind: source.kind,
      chartType: source.role === "main-series" ? source.chartType : null,
      sourceRole: source.role,
      studyKind: source.role === "study" ? source.studyKind : null,
      inputContextMode: source.role === "study" ? source.inputContext.mode : null,
      priceScaleId: source.priceScaleId,
      inputCapability: source.role === "main-series" ? source.inputCapability : null,
      builder: source.role === "main-series" ? source.builder : null,
      renderer: source.role === "main-series" ? source.renderer : null,
      styleSchemaId: source.role === "main-series" ? source.styleSchemaId : null,
      pointCount: source.data.length,
    }));
  }

  private createSeriesMeta(kind: string): { id: string; label: string } {
    const ordinal = this.nextSeriesId;
    this.nextSeriesId += 1;
    return {
      id: `series-${ordinal}`,
      label: this.createSeriesLabel(kind, `series-${ordinal}`),
    };
  }

  private createSeriesLabel(kind: string, id: string): string {
    const ordinal = id.startsWith("series-") ? id.slice("series-".length) : id;
    return `${formatSeriesKindLabel(kind)} ${ordinal}`;
  }

  private createPriceLineState(options: PhaseOnePriceLineOptions = {}): PriceLineState {
    const ordinal = this.nextPriceLineId;
    this.nextPriceLineId += 1;

    return {
      id: `price-line-${ordinal}`,
      price: options.price ?? this.defaultPriceLineOptions.price,
      color: options.color ?? this.defaultPriceLineOptions.color,
      lineWidth: Math.max(1, options.lineWidth ?? this.defaultPriceLineOptions.lineWidth),
      title: options.title ?? `Line ${ordinal}`,
    };
  }

  private createDrawingMeta(kind: ChartDrawingKind): { id: string; title: string } {
    const ordinal = this.nextDrawingId;
    this.nextDrawingId += 1;
    return createDrawingMetaUseCase(kind, ordinal, {
      formatSeriesKindLabel,
    });
  }

  private createHorizontalLineDrawing(
    paneId: string,
    options: PhaseOneHorizontalLineDrawingOptions = {},
  ): PhaseOneHorizontalLineDrawingApi {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one drawing target pane has been removed");
    }
    const meta = this.createDrawingMeta("horizontal-line");
    return createHorizontalLineDrawingUseCase({
      paneId,
      options,
      visible: options.visible ?? true,
      drawingId: meta.id,
      drawingTitle: meta.title,
      registry: this.drawingRegistry,
      createPriceLineState: (nextOptions) => this.createPriceLineState(nextOptions),
      assertDrawingActive: (entry) => this.assertDrawingActive(entry),
      getDrawing: (entry) => {
        const drawing = this.getDrawingByApi(entry);
        if (drawing.kind !== "horizontal-line") {
          throw new Error("chartx phase-one drawing api is attached to an unexpected drawing kind");
        }
        return drawing;
      },
      selectDrawing: (id) => this.selectDrawing(id),
      removeDrawing: (entry) => this.removeDrawing(entry),
      getPaneIndex: (paneId) => this.getPaneIndex(paneId),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private createTrendLineDrawing(
    paneId: string,
    options: PhaseOneTrendLineDrawingOptions = {},
  ): PhaseOneTrendLineDrawingApi {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one drawing target pane has been removed");
    }
    const meta = this.createDrawingMeta("trend-line");
    return createTrendLineDrawingUseCase({
      paneId,
      options,
      visible: options.visible ?? true,
      drawingId: meta.id,
      registry: this.drawingRegistry,
      lineColor: LINE_COLOR,
      resolveDefaults: () => this.resolveTrendLineDefaults(),
      assertDrawingActive: (entry) => this.assertDrawingActive(entry),
      getDrawing: (entry) => {
        const drawing = this.getDrawingByApi(entry);
        if (drawing.kind !== "trend-line") {
          throw new Error("chartx phase-one drawing api is attached to an unexpected drawing kind");
        }
        return drawing;
      },
      selectDrawing: (id) => this.selectDrawing(id),
      removeDrawing: (entry) => this.removeDrawing(entry),
      getPaneIndex: (paneId) => this.getPaneIndex(paneId),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private resolveTrendLineDefaults(): Required<Pick<
    PhaseOneTrendLineDrawingOptions,
    "startTime" | "startPrice" | "endTime" | "endPrice"
  >> {
    return resolveTrendLineDefaultsUseCase(this.chartModel.context().snapshot().barSequence.axisBars);
  }

  private createPriceLineApi(
    lines: Map<string, PriceLineState>,
    lineState: PriceLineState,
  ): PhaseOnePriceLineApi {
    const api: PhaseOnePriceLineApi = {
      applyOptions: (options) => {
        this.assertPriceLineActive(lines, api);
        const line = lines.get(lineState.id);
        if (line === undefined) {
          throw new Error("chartx phase-one price line has been removed");
        }
        if (options.price !== undefined) {
          line.price = options.price;
        }
        if (options.color !== undefined) {
          line.color = options.color;
        }
        if (options.lineWidth !== undefined) {
          line.lineWidth = Math.max(1, options.lineWidth);
        }
        if (options.title !== undefined) {
          line.title = options.title;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      remove: () => {
        this.removePriceLineFromMap(lines, api);
      },
    };

    this.priceLineHandleIds.set(api, lineState.id);
    lines.set(lineState.id, lineState);
    return api;
  }

  private removePriceLineFromMap(lines: Map<string, PriceLineState>, line: PhaseOnePriceLineApi): void {
    const lineId = this.priceLineHandleIds.get(line);
    if (lineId === undefined || !lines.has(lineId)) {
      throw new Error("chartx phase-one price line has been removed");
    }

    lines.delete(lineId);
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private assertPriceLineActive(lines: Map<string, PriceLineState>, line: PhaseOnePriceLineApi): void {
    const lineId = this.priceLineHandleIds.get(line);
    if (lineId === undefined || !lines.has(lineId)) {
      throw new Error("chartx phase-one price line has been removed");
    }
  }

  private getDrawingByApi(api: ChartDrawingApi) {
    return requireDrawingByApiUseCase(api, this.drawingRegistry);
  }

  private getDrawingById(id: string): ChartDrawingDescriptor | undefined {
    return this.drawingRegistry.list().find((drawing) => drawing.id === id);
  }

  private buildSelectedDrawingState(): PhaseOneSelectedDrawing {
    return buildSelectedDrawingStateUseCase(this.selectedDrawingId, {
      getById: (id) => this.getDrawingById(id),
      getPaneIndex: (paneId) => this.getPaneIndex(paneId),
    });
  }

  private selectDrawing(id: string | null, shouldRender = true): void {
    this.selectedDrawingId = selectDrawingUseCase({
      selectedDrawingId: this.selectedDrawingId,
      nextId: id,
      shouldRender,
      getById: (drawingId) => this.getDrawingById(drawingId),
      getPaneIndex: (paneId) => this.getPaneIndex(paneId),
      notifySelectionChange: (selection) => {
        for (const handler of this.drawingSelectionHandlers) {
          handler(selection);
        }
      },
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private assertDrawingActive(api: ChartDrawingApi): void {
    if (!this.drawingRegistry.hasApi(api)) {
      throw new Error("chartx phase-one drawing has been removed");
    }
  }

  private removeDrawing(api: ChartDrawingApi): void {
    removeDrawingUseCase({
      api,
      selectedDrawingId: this.selectedDrawingId,
      registry: this.drawingRegistry,
      clearSelection: (shouldRender) => this.selectDrawing(null, shouldRender),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private removeSelectedDrawing(): void {
    removeSelectedDrawingUseCase({
      selectedDrawingId: this.selectedDrawingId,
      getById: (id) => this.getDrawingById(id),
      clearSelection: (shouldRender) => this.selectDrawing(null, shouldRender),
      removeByApi: (api) => this.removeDrawing(api),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private createSeriesOptions(
    kind: ChartSeriesKind,
  ):
    | Required<PhaseOneCandlestickSeriesOptions>
    | Required<PhaseOneBarSeriesOptions>
    | Required<PhaseOneLineSeriesOptions>
    | Required<PhaseOneAreaSeriesOptions>
    | Required<PhaseOneBaselineSeriesOptions>
    | Required<PhaseOneHistogramSeriesOptions>
    | Required<PhaseOneVolumeSeriesOptions> {
    switch (kind) {
      case "candlestick":
        return { ...this.candlestickOptions };
      case "bar":
        return { ...this.barOptions };
      case "line":
        return { ...this.lineOptions };
      case "area":
        return { ...this.areaOptions };
      case "baseline":
        return { ...this.baselineOptions };
      case "histogram":
        return { ...this.histogramOptions };
      case "volume":
        return { ...this.volumeOptions };
    }
  }

  private createMainSeriesOptions(
    styleSchemaId: PhaseOneMainStyleSchemaId,
  ):
    | Required<PhaseOneCandlestickSeriesOptions>
    | Required<PhaseOneBarSeriesOptions>
    | Required<PhaseOneLineSeriesOptions>
    | Required<PhaseOneAreaSeriesOptions>
    | Required<PhaseOneBaselineSeriesOptions>
    | Required<PhaseOneHistogramSeriesOptions> {
    switch (mainSeriesStyleSchemaSpec(styleSchemaId).optionSurface) {
      case "candlestick":
        return { ...this.candlestickOptions };
      case "bar":
        return { ...this.barOptions };
      case "line":
        return { ...this.lineOptions };
      case "area":
        return { ...this.areaOptions };
      case "baseline":
        return { ...this.baselineOptions };
      case "histogram":
        return { ...this.histogramOptions };
    }
  }

  private createMainSourceState(
    paneId: string,
    chartType: PhaseOneMainChartType,
    kind: ChartSeriesKind,
    api: ChartSeriesApi,
    meta: { id: string; label: string },
    priceScale: PriceScale,
    priceScaleId: string,
  ): MainSeriesSourceState {
    return createMainSeriesSourceState<
      PhaseOneCandlestickData,
      ChartSeriesApi,
      ChartSeriesKind,
      MainSeriesSourceState["options"],
      HistogramVisual,
      PriceLineState,
      SeriesMarkerState
    >({
      paneId,
      chartType,
      kind,
      api,
      meta,
      priceScale,
      priceScaleId,
      defaults: {
        lineBreakOptions: {
          lineCount: this.candlestickOptions.lineBreakCount,
        },
        renkoOptions: {
          boxSize: this.candlestickOptions.renkoBoxSize,
          boxSizeMode: this.candlestickOptions.renkoBoxSizeMode,
        },
        pointFigureOptions: {
          boxSize: this.candlestickOptions.pointFigureBoxSize,
          boxSizeMode: this.candlestickOptions.pointFigureBoxSizeMode,
          boxSizeScale: this.candlestickOptions.pointFigureBoxSizeScale,
          reversalBoxes: this.candlestickOptions.pointFigureReversalBoxes,
          atrLength: this.candlestickOptions.pointFigureAtrLength,
          percentageValue: this.candlestickOptions.pointFigurePercentageValue,
        },
        kagiOptions: {
          reversalMode: this.lineOptions.kagiReversalMode,
          reversalSize: this.lineOptions.kagiReversalSize,
          reversalScale: this.lineOptions.kagiReversalScale,
          atrLength: this.lineOptions.kagiAtrLength,
          percentageValue: this.lineOptions.kagiPercentageValue,
        },
      },
      createOptions: (styleSchemaId) => this.createMainSeriesOptions(styleSchemaId),
    });
  }

  private syncChartContextFromMainSource(source: MainSeriesSourceState | null): void {
    if (source === null) {
      this.chartModel.clearMainSource();
      this.syncStudyContextData();
      this.refreshTradeLocation();
      return;
    }

    this.chartModel.bindMainSource(
      source.id,
      source.chartType,
      this.createMainBarSequenceFromSource(source),
    );
    this.syncStudyContextData();
    this.refreshTradeLocation();
  }

  private createMainBarSequenceFromSource(source: MainSeriesSourceState): ChartBarSequence<number> {
    const rows = source.store.setData(source.data);
    if (source.builder === "point-figure") {
      return createDirectionColumnPriceBasedChartBarSequence(rows);
    }

    if (
      source.builder === "line-break" ||
      source.builder === "renko" ||
      source.builder === "kagi"
    ) {
      return createCompressedPriceBasedChartBarSequence(rows);
    }

    return createTimeBasedChartBarSequence(rows);
  }

  private getMainSource(): MainSeriesSourceState | null {
    const mainSourceId = this.chartModel.mainSourceId();
    return mainSourceId === null
      ? null
      : (this.chartModel.getSourceByIdAndRole(mainSourceId, "main-series") ?? null);
  }

  private refreshTradeLocation(): void {
    if (this.activeTradeLocation === null) {
      return;
    }

    const source = this.getMainSource();
    const state =
      source === null
        ? null
        : resolveTradeLocationState(
            this.activeTradeLocation.request,
            {
              chartType: source.chartType,
              inputData: source.inputData,
              lineBreakOptions: source.lineBreakOptions,
              renkoOptions: source.renkoOptions,
              pointFigureOptions: source.pointFigureOptions,
              kagiOptions: source.kagiOptions,
            },
            this.activeTradeLocation.options,
          );
    this.activeTradeLocation = {
      ...this.activeTradeLocation,
      state,
    };

    if (this.activeTradeLocation.options.fitRange && state !== null) {
      this.timeScaleApi().setVisibleLogicalRange(state.logicalRange);
      this.priceScaleApi().setVisibleRange(state.priceRange);
      return;
    }

    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private getMainSourceOrThrow(): MainSeriesSourceState {
    const source = this.getMainSource();
    if (source === null) {
      throw new Error("chartx phase-one chart requires a primary series before this operation");
    }
    return source;
  }

  private getStudySourcesForPane(paneId: string): StudySourceState[] {
    return [...this.chartModel.listSourcesByPaneAndRole(paneId, "study")];
  }

  private getSecondarySeriesForPane(paneId: string): StudySourceState[] {
    return this.getStudySourcesForPane(paneId);
  }

  private getSourceByApi(
    api: ChartSeriesApi,
    kind?: ChartSeriesKind,
  ): SeriesSourceState {
    const source = this.chartModel.getSourceByApiOrThrow(api, "chartx phase-one series has been removed");
    if (kind !== undefined && source.kind !== kind) {
      throw new Error("chartx phase-one series is attached to an unexpected pane/source kind");
    }
    return source;
  }

  private getCompareStudyState(api: PhaseOneCompareSeriesApi): StudySourceState {
    const source = this.getSourceByApi(api, "line");
    if (source.role !== "study" || source.studyKind !== "compare") {
      throw new Error("chartx phase-one compare api is attached to an unexpected source kind");
    }
    return source;
  }

  private getMovingAverageStudyState(api: PhaseOneMovingAverageStudyApi): StudySourceState {
    const source = this.getSourceByApi(api, "line");
    if (source.role !== "study" || source.studyKind !== "indicator" || source.indicator?.kind !== "moving-average") {
      throw new Error("chartx phase-one moving average api is attached to an unexpected source kind");
    }
    return source;
  }

  private getOrCreateSecondaryPanePriceScale(paneId: string): PriceScale {
    return this.chartModel.getOrCreateSecondaryScale(paneId);
  }

  private buildPrimaryPaneSeries(
    mainSource: MainSeriesSourceState | null,
  ): readonly SeriesSourceState[] {
    const studies = this.getStudySourcesForPane("primary");
    return mainSource === null ? studies : [mainSource, ...studies];
  }

  private resolveHitDrawing(
    point: PanePoint,
    layout: Layout,
    paneFrames = buildPaneFrames(this.panes.list(), layout.height - layout.top - layout.bottom, PANE_GAP),
  ): ChartDrawingDescriptor | null {
    return resolveHitDrawingUseCase({
      point,
      paneFrames,
      primaryPriceScale: this.primaryPriceScale,
      getSecondaryPriceScale: (paneId) => this.chartModel.getSecondaryScale(paneId),
      axisBars: this.chartModel.context().snapshot().barSequence.axisBars,
      timeScale: this.timeScale,
      drawingsForPane: (paneId) => this.drawingRegistry.listByPane(paneId),
      hitTolerance: DRAWING_HIT_TOLERANCE,
    });
  }

  private resolveSelectedTrendLineDragHandle(
    point: PanePoint,
    layout: Layout,
    paneFrames = buildPaneFrames(this.panes.list(), layout.height - layout.top - layout.bottom, PANE_GAP),
  ): DrawingDragState | null {
    const drawing =
      this.selectedDrawingId === null
        ? null
        : this.getDrawingById(this.selectedDrawingId);
    return resolveSelectedTrendLineDragHandleUseCase({
      point,
      paneFrames,
      selectedDrawing: drawing?.kind === "trend-line" ? drawing : null,
      primaryPriceScale: this.primaryPriceScale,
      getSecondaryPriceScale: (paneId) => this.chartModel.getSecondaryScale(paneId),
      axisBars: this.chartModel.context().snapshot().barSequence.axisBars,
      timeScale: this.timeScale,
      hitTolerance: DRAWING_HIT_TOLERANCE,
    });
  }

  private applyDrawingDrag(
    drag: DrawingDragState,
    point: PanePoint,
    layout: Layout,
    paneFrames = buildPaneFrames(this.panes.list(), layout.height - layout.top - layout.bottom, PANE_GAP),
  ): void {
    const drawing = this.getDrawingById(drag.drawingId);
    if (drawing === undefined || drawing.kind !== "trend-line") {
      this.drawingSnapGuide = null;
      return;
    }
    const drawingOptions = resolveDrawingMagnetOptionsUseCase(drawing, this.drawingOptions);
    const nextState = applyTrendLineDragUseCase({
      drag,
      point,
      paneFrames,
      drawing,
      primaryPriceScale: this.primaryPriceScale,
      getSecondaryPriceScale: (paneId) => this.chartModel.getSecondaryScale(paneId),
      drawingOptions: {
        magnetGuideVisible: this.drawingOptions.magnetGuideVisible,
        timeMagnetGuideVisible: this.drawingOptions.timeMagnetGuideVisible,
      },
      resolveSnappedTime: (localX, drawing) =>
        resolveSnappedDrawingTimeUseCase(
          localX,
          this.chartModel.context().snapshot().barSequence.axisBars,
          this.timeScale,
          drawingOptions.timeMagnetEnabled,
          drawingOptions.timeMagnetPolicy,
          drawingOptions.timeMagnetTolerancePx,
        ),
      resolveSnappedPrice: (localX, localY, _drawing, priceScale) =>
        resolveSnappedDrawingPriceUseCase(
          localX,
          localY,
          this.chartModel.context().snapshot().barSequence,
          priceScale,
          this.timeScale,
          drawingOptions.magnetEnabled,
          drawingOptions.magnetTolerancePx,
          drawingOptions.magnetSources,
        ),
    });
    this.drawingSnapGuide = nextState.snapGuide;
    if (nextState.nextDrawing === null) {
      return;
    }
    drawing.startTime = nextState.nextDrawing.startTime;
    drawing.startPrice = nextState.nextDrawing.startPrice;
    drawing.endTime = nextState.nextDrawing.endTime;
    drawing.endPrice = nextState.nextDrawing.endPrice;
  }

  private renderSeriesSource(
    context: CanvasRenderingContext2D,
    state: SeriesSourceState,
    rows: RowSet,
    paneHeight: number,
    barWidth: number,
    priceScale: PriceScale,
    rangeMin: number | null,
  ): void {
    if (rows.length === 0) {
      return;
    }

    const renderer = state.role === "main-series" ? state.renderer : rendererForSeriesKind(state.kind);
    drawMainSeriesRenderer({
      context,
      renderer,
      rows,
      paneHeight,
      barWidth,
      priceScale,
      rangeMin,
      timeToX: (index) => this.timeScale.indexToCoordinate(index),
      priceToY: (value) => toCoordinate(priceScale.priceToCoordinate(value)),
      options: state.options as Record<string, unknown>,
      inputData: state.inputData,
      visuals: state.visuals,
      runtime: {
        lineRenderer: this.lineRenderer,
        areaRenderer: this.areaRenderer,
        baselineRenderer: this.baselineRenderer,
        barRenderer: this.barRenderer,
        candlesRenderer: this.candlesRenderer,
        pointFigureRenderer: this.pointFigureRenderer,
        histogramRenderer: this.histogramRenderer,
        kagiRenderer: this.kagiRenderer,
      },
    });
  }

  private buildReadoutSeriesForPrimary(
    primarySources: readonly SeriesSourceState[],
    rowSets: ReadonlyMap<string, RowSet>,
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[] {
    return buildReadoutSeriesForPrimaryUseCase(primarySources, rowSets, crosshair, {
      timeScale: this.timeScale,
      formatValue: (state, value) => this.formatSeriesReadoutValueForState(state, value),
    });
  }

  private buildReadoutSeriesForPane(
    paneSeries: readonly SeriesSourceState[],
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[] {
    return buildReadoutSeriesForPaneUseCase(paneSeries, crosshair, {
      timeScale: this.timeScale,
      formatValue: (state, value) => this.formatSeriesReadoutValueForState(state, value),
    });
  }

  private buildMainBarSequence(source: MainSeriesSourceState | null): ChartBarSequence<number> {
    if (source === null) {
      return createTimeBasedChartBarSequence([]);
    }

    const context = this.chartModel.context().snapshot();
    if (context.mainSourceId === source.id) {
      return context.barSequence;
    }

    return this.createMainBarSequenceFromSource(source);
  }

  private resolveStudyDisplayData(state: StudySourceState): readonly PhaseOneCandlestickData[] {
    return resolveStudyDisplayDataUseCase(state, {
      contextBarSequence: {
        kind: this.chartModel.context().snapshot().barSequence.kind,
        bars: this.chartModel.context().snapshot().barSequence.bars.map((row) => ({
          time: row.time,
          open: row.value[PlotRowValueIndex.Open],
          high: row.value[PlotRowValueIndex.High],
          low: row.value[PlotRowValueIndex.Low],
          close: row.value[PlotRowValueIndex.Close],
        })),
      },
      mergeToChartContext: (inputData, mergePolicy) =>
        this.studyMergeEngine.mergeToChartContext({
          inputData,
          axisBars: this.chartModel.context().snapshot().barSequence.axisBars,
          mergePolicy,
        }),
    });
  }

  private syncStudyContextData(): void {
    syncStudyContextDataUseCase(this.chartModel.listSourcesByRole("study"), {
      resolveDisplayData: (state) => this.resolveStudyDisplayData(state),
    });
  }

  private buildReadout(point: PanePoint | null, layout: Layout): PhaseOneReadoutDetail {
    return this.formatReadoutDetail(this.buildRawReadout(point, layout));
  }

  private buildRawReadout(point: PanePoint | null, layout: Layout): PhaseOneReadoutBody {
    const mainSource = this.getMainSource();
    const mainSequence = this.buildMainBarSequence(mainSource);
    return buildRawReadoutUseCase({
      point,
      paneFrames: buildPaneFrames(
        this.panes.list(),
        layout.height - layout.top - layout.bottom,
        PANE_GAP,
      ),
      mainSourceId: mainSource?.id ?? null,
      primaryRows: mainSequence.bars,
      primaryStudies: this.getStudySourcesForPane("primary"),
      primarySources: this.buildPrimaryPaneSeries(mainSource),
      timeScale: this.timeScale,
      primaryPriceScale: this.primaryPriceScale,
      getPaneIndex: (paneId) => this.getPaneIndex(paneId),
      getSecondarySeriesForPane: (paneId) => this.getSecondarySeriesForPane(paneId),
      buildReadoutSeriesForPrimary: (primarySources, rowSets, crosshair) =>
        this.buildReadoutSeriesForPrimary(primarySources, rowSets, crosshair),
      buildReadoutSeriesForPane: (paneSeries, crosshair) =>
        this.buildReadoutSeriesForPane(paneSeries, crosshair),
    });
  }

  private formatReadoutDetail(readout: PhaseOneReadoutBody): PhaseOneReadoutDetail {
    return {
      ...readout,
      formatted: {
        time: this.formatReadoutTime(readout.time),
        open: this.formatPriceReadoutValue(readout.open),
        high: this.formatPriceReadoutValue(readout.high),
        low: this.formatPriceReadoutValue(readout.low),
        close: this.formatPriceReadoutValue(readout.close),
        price: this.formatPriceReadoutValue(readout.price),
      },
    };
  }

  private formatPriceReadoutValue(value: number | null): string {
    return value === null ? "--" : formatPriceAxisLabel(value, this.priceAxisFormatter);
  }

  private formatReadoutTime(value: number | null): string {
    return value === null ? "--" : formatTimeAxisLabel(value, this.timeAxisFormatter);
  }

  private formatSeriesReadoutValueForState(state: SeriesSourceState, value: number | null): string {
    if (value === null) {
      return "--";
    }
    const formatter = state.options.valueFormatter;
    if (formatter !== null) {
      return formatter(value);
    }
    return state.kind === "volume"
      ? formatVolumeAxisLabel(value)
      : formatPriceAxisLabel(value, this.priceAxisFormatter);
  }

  public render(canvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    const layout = measureLayout(canvas, this.manualLayout);
    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("Canvas 2D context is unavailable");
    }

    prepareCanvasRenderSurfaceUseCase({
      canvas,
      context,
      layout,
      dpr,
      backgroundColor: this.chartOptions.backgroundColor,
    });

    const paneWidth = layout.width - layout.left - layout.right;
    const plotHeight = layout.height - layout.top - layout.bottom;
    const mainSource = this.getMainSource();
    const mainSequence = this.buildMainBarSequence(mainSource);
    const primaryStudies = this.getStudySourcesForPane("primary");
    const primarySources = this.buildPrimaryPaneSeries(mainSource);
    const renderState = buildChartRenderStateUseCase({
      paneSpecs: this.panes.list(),
      plotHeight,
      paneGap: PANE_GAP,
      paneWidth,
      crosshair: this.crosshair,
      mainSourceId: mainSource?.id ?? null,
      mainSequence,
      primaryStudies,
      primarySources,
      studySources: this.chartModel.listSourcesByRole("study"),
    });
    const {
      primaryRows,
      primaryTimeAxisRows,
      primaryRowSets,
      secondaryRows,
      pointCount,
      paneFrames,
      activePane,
      barWidth,
    } = renderState;

    if (pointCount === 0) {
      renderEmptyPlotFrameUseCase({
        context,
        layout,
        paneWidth,
        plotHeight,
        paneBackgroundColor: this.chartOptions.paneBackgroundColor,
        frameColor: this.chartOptions.frameColor,
      });
      return;
    }

    this.timeScale.applyOptions({
      width: paneWidth,
      pointCount,
      barSpacing: resolveBarSpacing(this.barSpacing, paneWidth, pointCount),
      rightOffset: this.rightOffset,
    });

    for (const pane of paneFrames) {
      context.save();
      context.translate(layout.left, layout.top + pane.top);
      context.fillStyle = this.chartOptions.paneBackgroundColor;
      context.fillRect(0, 0, paneWidth, pane.height);
      this.gridRenderer.draw(context, {
        width: paneWidth,
        height: pane.height,
        columns: 8,
        rows: 5,
        lineColor: this.chartOptions.gridColor,
      });

      context.save();
      context.beginPath();
      context.rect(0, 0, paneWidth, pane.height);
      context.clip();

      if (pane.kind === "primary") {
        const primaryPaneDecorations = buildPrimaryPaneDecorationsUseCase({
          sources: primarySources,
          drawings: this.drawingRegistry.listByPane("primary"),
          drawingSnapGuide: this.drawingSnapGuide,
          tradeLocationState: this.activeTradeLocation?.state ?? null,
        });
        const { rangeMin: primaryRangeMin } = applyPrimaryPaneScaleUseCase({
          mainSource,
          primaryStudies,
          primaryRowSets,
          primaryScaleSeriesOnly: this.primaryScaleSeriesOnly,
          priceRangeOverride: this.primaryPriceRangeOverride,
          paneHeight: pane.height,
          priceScale: this.primaryPriceScale,
        });

        renderPrimaryPaneContentUseCase({
          hasPrimaryData: primaryRows.length > 0,
          mainSourceExists: mainSource !== null,
          primarySources,
          primaryRowsFor: (source) => primaryRowSets.get(source.id) ?? [],
          renderSeries: (source, rows) => {
            this.renderSeriesSource(
              context,
              source,
              rows,
              pane.height,
              barWidth,
              this.primaryPriceScale,
              primaryRangeMin,
            );
          },
          drawPriceLines: () => {
            drawPriceLines(
              context,
              paneWidth,
              pane.height,
              this.primaryPriceScale,
              primaryPaneDecorations.priceLines,
              this.chartOptions,
              this.priceAxisFormatter,
            );
          },
          drawDrawings: (drawings) => {
            drawPaneDrawings(
              context,
              drawings,
              this.chartModel.context().snapshot().barSequence.axisBars,
              this.timeScale,
              this.primaryPriceScale,
              this.selectedDrawingId,
              this.hoveredDrawingId,
              this.hoveredDrawingHandle,
            );
          },
          primaryDrawings: primaryPaneDecorations.drawings,
          drawTradeLocationOverlay: () => {
            drawTradeLocationOverlay(
              context,
              primaryPaneDecorations.tradeLocationState,
              pane.height,
              this.timeScale,
              this.primaryPriceScale,
            );
          },
          drawDrawingSnapGuide: () => {
            drawDrawingSnapGuide(
              context,
              paneWidth,
              pane.height,
              this.primaryPriceScale,
              this.chartModel.context().snapshot().barSequence.axisBars,
              this.timeScale,
              primaryPaneDecorations.snapGuide,
            );
          },
          drawMarkers: (source, rows) => {
            drawSeriesMarkers(
              context,
              rows,
              source.markers,
              this.timeScale,
              this.primaryPriceScale,
              pane.height,
              source.kind,
            );
          },
        });
      }

      if (pane.kind === "secondary") {
        const paneSeries = this.getSecondarySeriesForPane(pane.id);
        const secondaryPaneDecorations = buildSecondaryPaneDecorationsUseCase({
          paneId: pane.id,
          sources: paneSeries,
          drawings: this.drawingRegistry.listByPane(pane.id),
          drawingSnapGuide: this.drawingSnapGuide,
        });
        const panePriceScale = this.chartModel.getSecondaryScale(pane.id);
        const {
          hasPriceScale,
          rangeMin,
        } = applySecondaryPaneScaleUseCase({
          paneSeries,
          secondaryRows,
          paneHeight: pane.height,
          priceScale: panePriceScale,
        });
        renderSecondaryPaneContentUseCase({
          paneSeries,
          hasPriceScale,
          rowsFor: (source) => secondaryRows.get(source.id),
          hasRows: (rows) => (rows?.length ?? 0) > 0,
          applyPriceScaleRange: () => {},
          renderSeries: (source, rows) => {
            this.renderSeriesSource(
              context,
              source,
              rows,
              pane.height,
              barWidth,
              source.priceScale,
              rangeMin,
            );
          },
          drawPriceLines: () => {
            if (panePriceScale !== undefined) {
              drawPriceLines(
              context,
              paneWidth,
              pane.height,
              panePriceScale,
              secondaryPaneDecorations.priceLines,
              this.chartOptions,
              this.priceAxisFormatter,
            );
            }
          },
          drawDrawings: (drawings) => {
            if (panePriceScale !== undefined) {
              drawPaneDrawings(
                context,
                drawings,
                this.chartModel.context().snapshot().barSequence.axisBars,
                this.timeScale,
                panePriceScale,
                this.selectedDrawingId,
                this.hoveredDrawingId,
                this.hoveredDrawingHandle,
              );
            }
          },
          paneDrawings: secondaryPaneDecorations.drawings,
          drawDrawingSnapGuide: () => {
            if (panePriceScale !== undefined) {
              drawDrawingSnapGuide(
                context,
                paneWidth,
                pane.height,
                panePriceScale,
                this.chartModel.context().snapshot().barSequence.axisBars,
                this.timeScale,
                secondaryPaneDecorations.snapGuide,
              );
            }
          },
          drawMarkers: (source, rows) => {
            drawSeriesMarkers(
              context,
              rows,
              source.markers,
              this.timeScale,
              source.priceScale,
              pane.height,
              source.kind,
            );
          },
        });
      }

      context.restore();

      renderPaneChromeUseCase({
        pane,
        activePane,
        crosshair: this.crosshair,
        primarySources,
        primaryRowSets,
        getSecondarySeriesForPane: (paneId) => this.getSecondarySeriesForPane(paneId),
        buildReadoutSeriesForPrimary: (nextPrimarySources, rowSets, crosshair) =>
          this.buildReadoutSeriesForPrimary(nextPrimarySources, rowSets as ReadonlyMap<string, RowSet>, crosshair),
        buildReadoutSeriesForPane: (paneSeries, crosshair) =>
          this.buildReadoutSeriesForPane(paneSeries, crosshair),
        drawLegend: (entries) => {
          drawPaneLegend(context, entries);
        },
        drawCrosshair: (crosshair) => {
          drawCrosshair(context, paneWidth, pane.height, crosshair, this.crosshairOptions);
        },
        drawFrameBorder: () => {
          context.strokeStyle = this.chartOptions.frameColor;
          context.strokeRect(0.5, 0.5, paneWidth - 1, pane.height - 1);
        },
      });
      context.restore();
    }

    renderPriceAxesUseCase({
      paneFrames,
      activePane,
      crosshair: this.crosshair,
      hasPrimaryRows: primaryRows.length > 0,
      findPrimaryPane: (panes) => panes.find((pane) => pane.kind === "primary"),
      drawPrimaryAxis: (pane, crosshair) => {
        drawPriceAxis(
          context,
          layout,
          pane.top,
          pane.height,
          this.primaryPriceScale,
          crosshair,
          this.chartOptions,
          "primary",
          this.priceAxisFormatter,
          this.drawingOptions.magnetLabelVisible
            && this.drawingSnapGuide?.paneId === "primary"
            && this.drawingSnapGuide.price !== null
            ? buildMagnetAxisTag(layout, pane.top, this.primaryPriceScale, this.drawingSnapGuide, this.priceAxisFormatter)
            : null,
        );
      },
      getSecondaryAxisState: (paneId) => this.getSecondarySeriesForPane(paneId)[0],
      secondaryPaneHasRows: (paneId) =>
        this.getSecondarySeriesForPane(paneId).some(
          (entry) => (secondaryRows.get(entry.id)?.length ?? 0) > 0,
        ),
      drawSecondaryAxis: (pane, state, crosshair) => {
        drawPriceAxis(
          context,
          layout,
          pane.top,
          pane.height,
          state.priceScale,
          crosshair,
          this.chartOptions,
          state.kind === "volume" ? "volume" : "primary",
          this.priceAxisFormatter,
          this.drawingOptions.magnetLabelVisible
            && this.drawingSnapGuide?.paneId === pane.id
            && this.drawingSnapGuide.price !== null
            ? buildMagnetAxisTag(layout, pane.top, state.priceScale, this.drawingSnapGuide, this.priceAxisFormatter)
            : null,
        );
      },
    });

    const firstSecondaryRows = secondaryRows.values().next().value;
    finishChartRenderUseCase({
      primaryRows: primaryTimeAxisRows,
      firstSecondaryRows,
      hasRows: (rows) => (rows?.length ?? 0) > 0,
      renderTimeAxis: (rows) => {
        renderTimeAxisUseCase({
          primaryRows: rows,
          firstSecondaryRows: undefined,
          hasRows: (rows) => (rows?.length ?? 0) > 0,
          draw: (rows) => {
            drawTimeAxis(
              context,
              layout,
              rows,
              this.timeScale,
              this.crosshair,
              this.chartOptions,
              this.timeAxisFormatter,
              this.drawingOptions.timeMagnetLabelVisible && this.drawingSnapGuide?.time != null
                ? buildMagnetTimeAxisTag(
                    layout,
                    rows,
                    this.timeScale,
                    this.drawingSnapGuide!,
                    this.timeAxisFormatter,
                  )
                : null,
            );
          },
        });
      },
      buildReadout: () => this.buildReadout(this.crosshair, layout),
      publishReadout: (readout) => {
        emitReadout(canvas, readout);
      },
      publishCrosshairMove: (readout) => {
        this.emitCrosshairMove(readout);
      },
    });
  }

  private assertSeriesActive(series: ChartSeriesApi): void {
    if (!this.chartModel.hasSourceApi(series)) {
      throw new Error("chartx phase-one series has been removed");
    }
  }

  private emitCrosshairMove(readout: PhaseOneReadoutDetail): void {
    const event: PhaseOneCrosshairMoveEvent = buildCrosshairMoveEventUseCase(readout, this.crosshair);

    for (const handler of this.crosshairMoveHandlers) {
      handler(event);
    }
  }

  private emitChartTypeChange(type: PhaseOneMainChartType): void {
    for (const handler of this.chartTypeChangeHandlers) {
      handler(type);
    }
  }
}

export function createPhaseOneChart(canvas: HTMLCanvasElement): PhaseOneChartApi {
  assertCanvasElement(canvas);

  const harness = new PhaseOneChartHarness();
  harness.attach(canvas);

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

export function mountPhaseOneChartHarness(canvas: HTMLCanvasElement): () => void {
  const chart = createPhaseOneChart(canvas);
  const bars = buildDemoBars();
  const volumePane = chart.addPane({ height: 136 });
  const series = chart.addCandlestickSeries();
  const volume = chart.addVolumeSeries({ pane: volumePane });
  series.setData(bars);
  volume.setData(buildDemoVolumeBars(bars));

  return () => {
    chart.destroy();
  };
}

function buildDemoBars(): readonly OhlcDataPoint<number>[] {
  let lastClose = 16_500;
  const startTime = Date.UTC(2025, 0, 2, 9, 30);

  return Array.from({ length: 42 }, (_, index) => {
    const drift = Math.sin(index / 5) * 42;
    const open = lastClose + Math.cos(index / 3) * 18;
    const close = open + drift;
    const high = Math.max(open, close) + 26 + (index % 3) * 3;
    const low = Math.min(open, close) - 24 - (index % 4) * 2;
    lastClose = close;

    return {
      time: startTime + index * 60_000,
      open,
      high,
      low,
      close,
    };
  });
}

function buildDemoVolumeBars(
  bars: readonly OhlcDataPoint<number>[],
): readonly PhaseOneVolumeData[] {
  return bars.map((bar, index) => ({
    time: bar.time,
    value: 680_000 + (index % 7) * 120_000 + Math.abs(bar.close - bar.open) * 8_500,
    up: bar.close >= bar.open,
  }));
}

function normalizeLineData(data: readonly PhaseOneLineData[]): readonly PhaseOneCandlestickData[] {
  return data.map(normalizeLineBar);
}

function normalizeLineBar(bar: PhaseOneLineData): PhaseOneCandlestickData {
  return {
    time: bar.time,
    open: bar.value,
    high: bar.value,
    low: bar.value,
    close: bar.value,
  };
}

function normalizeHistogramData(
  data: readonly PhaseOneHistogramData[] | readonly PhaseOneVolumeData[],
): readonly PhaseOneCandlestickData[] {
  return data.map(normalizeHistogramBar);
}

function normalizeHistogramBar(
  bar: PhaseOneHistogramData | PhaseOneVolumeData,
): PhaseOneCandlestickData {
  return {
    time: bar.time,
    open: 0,
    high: Math.max(0, bar.value),
    low: Math.min(0, bar.value),
    close: bar.value,
  };
}

function updateCanonicalData(
  data: readonly PhaseOneCandlestickData[],
  bar: PhaseOneCandlestickData,
): readonly PhaseOneCandlestickData[] {
  const store = new SeriesDataStore<number>();
  store.setData(data);
  return store.update(bar).map((row) => ({
    time: row.time,
    open: row.value[PlotRowValueIndex.Open],
    high: row.value[PlotRowValueIndex.High],
    low: row.value[PlotRowValueIndex.Low],
    close: row.value[PlotRowValueIndex.Close],
  }));
}

function applyMainSeriesBuilderData(
  data: readonly PhaseOneCandlestickData[],
  source: Pick<
    MainSeriesSourceState,
    "builder" | "lineBreakOptions" | "renkoOptions" | "pointFigureOptions" | "kagiOptions"
  >,
): readonly PhaseOneCandlestickData[] {
  return applyMainSeriesBuilder(source.builder, data, {
    lineBreakOptions: source.lineBreakOptions,
    renkoOptions: source.renkoOptions,
    pointFigureOptions: source.pointFigureOptions,
    kagiOptions: source.kagiOptions,
  });
}

function formatSeriesKindLabel(kind: string): string {
  switch (kind) {
    case "candlestick":
      return "Candlestick";
    case "line-break":
      return "Line Break";
    case "kagi":
      return "Kagi";
    case "point-figure":
      return "Point Figure";
    case "volume-candles":
      return "Volume Candles";
    case "hollow-candles":
      return "Hollow Candles";
    case "heikin-ashi":
      return "Heikin Ashi";
    case "renko":
      return "Renko";
    case "hlc-bars":
      return "HLC Bars";
    case "high-low":
      return "High-Low";
    case "line":
      return "Line";
    case "line-markers":
      return "Line Markers";
    case "stepline":
      return "Stepline";
    case "area":
      return "Area";
    case "baseline":
      return "Baseline";
    case "bar":
      return "Bar";
    case "histogram":
      return "Histogram";
    case "volume":
      return "Volume";
    default:
      return "Series";
  }
}

function rendererForSeriesKind(kind: ChartSeriesKind): PhaseOneMainSeriesRenderer {
  switch (kind) {
    case "line":
      return "line";
    case "area":
      return "area";
    case "baseline":
      return "baseline";
    case "bar":
      return "bars";
    case "candlestick":
      return "candles";
    case "histogram":
    case "volume":
      return "columns";
  }
}

function seriesKindForMainChartType(type: PhaseOneMainChartType): ChartSeriesKind {
  return mainSeriesKindForChartType(type);
}

function applyMainSeriesTypeSpecificOptions(
  source: MainSeriesSourceState,
  options: MainSeriesStyleOptionsPatch,
): boolean {
  return applyMainSeriesStyleOptions(source.styleSchemaId, source, options);
}

function buildHistogramVisuals(
  data: readonly PhaseOneHistogramData[] | readonly PhaseOneVolumeData[],
): Map<number, HistogramVisual> {
  const visuals = new Map<number, HistogramVisual>();

  for (let index = 0; index < data.length; index += 1) {
    const item = data[index];
    const previous = index === 0 ? null : data[index - 1];
    visuals.set(item.time, {
      color: item.color,
      isUp: item.up ?? (previous === null ? true : item.value >= previous.value),
    });
  }

  return visuals;
}

function clonePriceLines(lines: ReadonlyMap<string, PriceLineState>): Map<string, PriceLineState> {
  return new Map(
    Array.from(lines.entries(), ([id, line]) => [
      id,
      {
        ...line,
      },
    ]),
  );
}

function resolveActivePane(
  panes: readonly PaneFrame[],
  y: number,
): PaneFrame | null {
  return panes.find((pane) => y >= pane.top && y <= pane.top + pane.height) ?? null;
}

function resolveLocalPanePoint(
  pane: PaneFrame | null | undefined,
  point: PanePoint | null,
): PanePoint | null {
  if (pane === null || pane === undefined || point === null) {
    return null;
  }

  return {
    x: point.x,
    y: point.y - pane.top,
  };
}

function toCoordinate(value: Coordinate | null): Coordinate {
  return (value ?? 0) as Coordinate;
}

function measureLayout(
  canvas: HTMLCanvasElement,
  manualLayout: Pick<Layout, "width" | "height"> | null = null,
): Layout {
  if (manualLayout !== null) {
    return {
      ...DEFAULT_LAYOUT,
      width: manualLayout.width,
      height: manualLayout.height,
    };
  }

  const container = canvas.parentElement;
  if (container === null) {
    return DEFAULT_LAYOUT;
  }

  const styles = window.getComputedStyle(container);
  const horizontalPadding =
    parseFloat(styles.paddingLeft || "0") + parseFloat(styles.paddingRight || "0");
  const availableWidth = Math.floor(container.clientWidth - horizontalPadding);
  const width = Math.max(480, availableWidth);
  const aspectHeight = Math.round((width / DEFAULT_LAYOUT.width) * DEFAULT_LAYOUT.height);

  return {
    ...DEFAULT_LAYOUT,
    width,
    height: Math.max(320, aspectHeight),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function calculateBaseBarSpacing(paneWidth: number, pointCount: number): number {
  return paneWidth / Math.max(pointCount + 2, 12);
}

function resolveBarSpacing(
  currentSpacing: number | null,
  paneWidth: number,
  pointCount: number,
): number {
  if (currentSpacing !== null) {
    return Math.max(MIN_BAR_SPACING, currentSpacing);
  }

  return clamp(
    calculateBaseBarSpacing(paneWidth, pointCount),
    MIN_BAR_SPACING,
    MAX_BAR_SPACING,
  );
}

function resolvePanePoint(
  canvas: HTMLCanvasElement,
  event: Pick<MouseEvent, "clientX" | "clientY">,
  layout: Layout,
): PanePoint | null {
  const rect = canvas.getBoundingClientRect();
  const localX = event.clientX - rect.left - layout.left;
  const localY = event.clientY - rect.top - layout.top;
  const paneWidth = layout.width - layout.left - layout.right;
  const paneHeight = layout.height - layout.top - layout.bottom;

  if (localX < 0 || localX > paneWidth || localY < 0 || localY > paneHeight) {
    return null;
  }

  return {
    x: clamp(localX, 0, paneWidth),
    y: clamp(localY, 0, paneHeight),
  };
}

function drawCrosshair(
  context: CanvasRenderingContext2D,
  paneWidth: number,
  paneHeight: number,
  crosshair: PanePoint | null,
  options: { lineColor: string; pointColor: string },
): void {
  if (crosshair === null) {
    return;
  }

  context.save();
  context.strokeStyle = options.lineColor;
  context.lineWidth = 1;
  context.setLineDash([4, 4]);

  context.beginPath();
  context.moveTo(Math.round(crosshair.x) + 0.5, 0);
  context.lineTo(Math.round(crosshair.x) + 0.5, paneHeight);
  context.stroke();

  context.beginPath();
  context.moveTo(0, Math.round(crosshair.y) + 0.5);
  context.lineTo(paneWidth, Math.round(crosshair.y) + 0.5);
  context.stroke();

  context.setLineDash([]);
  context.fillStyle = options.pointColor;
  context.beginPath();
  context.arc(crosshair.x, crosshair.y, 2.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawPaneLegend(
  context: CanvasRenderingContext2D,
  entries: readonly PhaseOneReadoutSeriesDetail[],
): void {
  if (entries.length === 0) {
    return;
  }

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "top";

  let x = 10;
  for (const entry of entries) {
    const text = `${entry.label} ${entry.formattedValue}`;
    const textWidth = context.measureText(text).width;

    context.fillStyle = "rgba(255, 253, 247, 0.92)";
    context.strokeStyle = "rgba(16, 16, 16, 0.12)";
    context.lineWidth = 1;
    context.fillRect(x, 8, textWidth + 22, 18);
    context.strokeRect(x + 0.5, 8.5, textWidth + 21, 17);

    context.fillStyle = entry.color;
    context.beginPath();
    context.arc(x + 7, 17, 3, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(16, 16, 16, 0.78)";
    context.fillText(text, x + 13, 12);
    x += textWidth + 30;
  }

  context.restore();
}

function normalizeMarkers(markers: readonly PhaseOneSeriesMarker[]): readonly SeriesMarkerState[] {
  return markers.map((marker, index) => ({
    time: marker.time,
    position: marker.position ?? "aboveBar",
    shape: marker.shape ?? "circle",
    color: marker.color ?? "#2563eb",
    text: marker.text ?? "",
  })).sort((left, right) => left.time - right.time || left.text.localeCompare(right.text) || 0);
}

function drawPriceLines(
  context: CanvasRenderingContext2D,
  paneWidth: number,
  paneHeight: number,
  priceScale: PriceScale,
  priceLines: ReadonlyMap<string, PriceLineState>,
  options: Required<NonNullable<PhaseOneChartOptions["layout"]>>,
  formatter: ((value: number) => string) | null,
): void {
  if (priceLines.size === 0) {
    return;
  }

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "middle";
  context.setLineDash([4, 4]);

  for (const line of priceLines.values()) {
    const y = toCoordinate(priceScale.priceToCoordinate(line.price));
    if (y < 0 || y > paneHeight) {
      continue;
    }

    context.strokeStyle = line.color;
    context.lineWidth = line.lineWidth;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(paneWidth, y);
    context.stroke();

    const formattedPrice = formatPriceAxisLabel(line.price, formatter);
    const label = line.title.trim() === "" ? formattedPrice : `${line.title} ${formattedPrice}`;
    drawAxisTag(
      context,
      {
        text: label,
        x: Math.max(8, paneWidth - context.measureText(label).width - 22),
        y: y - 9,
      },
      {
        ...options,
        axisLabelBackground: "rgba(255, 253, 247, 0.9)",
        axisLabelBorder: line.color,
        axisTextColor: line.color,
      },
    );
  }

  context.restore();
}

function drawSeriesMarkers(
  context: CanvasRenderingContext2D,
  rows: readonly {
    time: number;
    index: Parameters<TimeScale["indexToCoordinate"]>[0];
    value: readonly number[];
  }[],
  markers: readonly SeriesMarkerState[],
  timeScale: TimeScale,
  priceScale: PriceScale,
  paneHeight: number,
  kind: ChartSeriesKind | null,
): void {
  if (markers.length === 0 || rows.length === 0 || kind === null) {
    return;
  }

  const rowsByTime = new Map(rows.map((row) => [row.time, row]));

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (const marker of markers) {
    const row = rowsByTime.get(marker.time);
    if (row === undefined) {
      continue;
    }

    const x = timeScale.indexToCoordinate(row.index);
    const y = markerYForRow(row, marker.position, priceScale, kind, paneHeight);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < -24 || x > 5000) {
      continue;
    }

    drawMarkerShape(context, x, y, marker.shape, marker.color);
    if (marker.text !== "") {
      const textY = marker.position === "belowBar" ? y + 13 : y - 13;
      context.fillStyle = marker.color;
      context.fillText(marker.text, x, textY);
    }
  }

  context.restore();
}

function drawTradeLocationOverlay(
  context: CanvasRenderingContext2D,
  state: PhaseOneTradeLocationState | null,
  paneHeight: number,
  timeScale: TimeScale,
  priceScale: PriceScale,
): void {
  if (state === null) {
    return;
  }

  const x1 = timeScale.logicalToCoordinate(state.resolvedEntryLogical as Logical);
  const x2 = timeScale.logicalToCoordinate(state.resolvedExitLogical as Logical);
  const y1 = toCoordinate(priceScale.priceToCoordinate(state.resolvedEntryPrice));
  const y2 = toCoordinate(priceScale.priceToCoordinate(state.resolvedExitPrice));
  if (![x1, x2, y1, y2].every(Number.isFinite)) {
    return;
  }

  const isLong = state.request.side === "long";
  const color = isLong ? state.overlay.longColor : state.overlay.shortColor;
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";

  if (state.overlay.showSpan) {
    context.fillStyle = withAlpha(color, state.overlay.spanOpacity);
    context.fillRect(left, 0, Math.max(2, right - left), paneHeight);
  }

  if (state.overlay.showConnector) {
    context.strokeStyle = color;
    context.lineWidth = state.overlay.connectorLineWidth;
    context.setLineDash([6, 4]);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.setLineDash([]);
  }

  context.fillStyle = CHART_BACKGROUND;
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(x1, y1, 4.5, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.arc(x2, y2, 4.5, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  if (state.overlay.showMarkers) {
    drawMarkerShape(
      context,
      x1,
      isLong ? Math.min(paneHeight - 12, y1 + 18) : Math.max(12, y1 - 18),
      isLong ? "arrowUp" : "arrowDown",
      color,
    );
    drawMarkerShape(
      context,
      x2,
      isLong ? Math.max(12, y2 - 18) : Math.min(paneHeight - 12, y2 + 18),
      isLong ? "arrowDown" : "arrowUp",
      color,
    );
    context.fillStyle = color;
    context.fillText(
      state.overlay.entryLabel,
      x1,
      isLong ? Math.min(paneHeight - 10, y1 + 34) : Math.max(10, y1 - 34),
    );
    context.fillText(
      state.overlay.exitLabel,
      x2,
      isLong ? Math.max(10, y2 - 34) : Math.min(paneHeight - 10, y2 + 34),
    );
  }

  context.restore();
}

function markerYForRow(
  row: { value: readonly number[] },
  position: PhaseOneSeriesMarkerPosition,
  priceScale: PriceScale,
  kind: ChartSeriesKind | "candlestick" | "bar" | "line" | "area" | "baseline" | "histogram",
  paneHeight: number,
): number {
  const openY = toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Open]));
  const highY = toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.High]));
  const lowY = toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Low]));
  const closeY = toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close]));

  if (position === "inBar") {
    if (kind === "histogram" || kind === "volume") {
      const range = priceScale.getPriceRange();
      const basePrice = range?.minValue() ?? 0;
      const baseY = toCoordinate(priceScale.priceToCoordinate(basePrice));
      return Math.max(12, Math.min(paneHeight - 12, (baseY + closeY) / 2));
    }
    return Math.max(12, Math.min(paneHeight - 12, closeY));
  }

  if (position === "aboveBar") {
    const anchor = kind === "line" || kind === "area" || kind === "baseline" ? closeY : highY;
    return Math.max(10, anchor - 14);
  }

  const anchor = kind === "line" || kind === "area" || kind === "baseline" ? closeY : lowY;
  return Math.min(paneHeight - 10, anchor + 14);
}

function drawMarkerShape(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  shape: PhaseOneSeriesMarkerShape,
  color: string,
): void {
  context.save();
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = 1.5;

  if (shape === "circle") {
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  if (shape === "square") {
    context.fillRect(x - 4, y - 4, 8, 8);
    context.restore();
    return;
  }

  context.beginPath();
  if (shape === "arrowUp") {
    context.moveTo(x, y - 6);
    context.lineTo(x + 6, y + 4);
    context.lineTo(x + 2, y + 4);
    context.lineTo(x + 2, y + 8);
    context.lineTo(x - 2, y + 8);
    context.lineTo(x - 2, y + 4);
    context.lineTo(x - 6, y + 4);
  } else {
    context.moveTo(x, y + 6);
    context.lineTo(x + 6, y - 4);
    context.lineTo(x + 2, y - 4);
    context.lineTo(x + 2, y - 8);
    context.lineTo(x - 2, y - 8);
    context.lineTo(x - 2, y - 4);
    context.lineTo(x - 6, y - 4);
  }
  context.closePath();
  context.fill();
  context.restore();
}

function drawPriceAxis(
  context: CanvasRenderingContext2D,
  layout: Layout,
  paneTop: number,
  paneHeight: number,
  priceScale: PriceScale,
  crosshair: PanePoint | null,
  options: Required<NonNullable<PhaseOneChartOptions["layout"]>>,
  axisType: "primary" | "volume",
  formatter: ((value: number) => string) | null,
  overlayTag: AxisTag | null = null,
): void {
  const range = priceScale.getPriceRange();
  if (range === null) {
    return;
  }

  const tickCount = clamp(Math.floor(paneHeight / 76), 3, 7);
  const labels: AxisTag[] = Array.from({ length: tickCount }, (_, index) => {
    const ratio = tickCount === 1 ? 0 : index / (tickCount - 1);
    const price = range.maxValue() - range.length() * ratio;
    return {
      text:
        axisType === "volume"
          ? formatVolumeAxisLabel(price)
          : formatPriceAxisLabel(price, formatter),
      x: layout.width - layout.right + 6,
      y: layout.top + paneTop + paneHeight * ratio - 9,
    };
  });

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "middle";

  for (const label of labels) {
    drawAxisTag(context, label, options);
  }

  if (crosshair !== null) {
    const price = priceScale.coordinateToPrice(crosshair.y);
    if (price !== null) {
      drawAxisTag(context, {
        text:
          axisType === "volume"
            ? formatVolumeAxisLabel(price)
            : formatPriceAxisLabel(price, formatter),
        x: layout.width - layout.right + 6,
        y: layout.top + paneTop + crosshair.y - 9,
        active: true,
      }, options);
    }
  }

  if (overlayTag !== null) {
    drawAxisTag(context, overlayTag, options);
  }

  context.restore();
}

function buildMagnetAxisTag(
  layout: Layout,
  paneTop: number,
  priceScale: PriceScale,
  guide: DrawingSnapGuideState,
  formatter: ((value: number) => string) | null,
): AxisTag | null {
  if (guide.price === null) {
    return null;
  }
  const y = priceScale.priceToCoordinate(guide.price);
  if (y === null) {
    return null;
  }

  return {
    text: `MAG ${guide.source?.toUpperCase() ?? "PRICE"} ${formatPriceAxisLabel(guide.price, formatter)}`,
    x: layout.width - layout.right + 6,
    y: layout.top + paneTop + y - 9,
    backgroundColor: guide.color,
    borderColor: guide.color,
    textColor: "#fffdf7",
  };
}

function drawTimeAxis(
  context: CanvasRenderingContext2D,
  layout: Layout,
  rows: readonly { time: number; index: number }[],
  timeScale: TimeScale,
  crosshair: PanePoint | null,
  options: Required<NonNullable<PhaseOneChartOptions["layout"]>>,
  formatter: ((time: number) => string) | null,
  overlayTag: AxisTag | null = null,
): void {
  if (rows.length === 0) {
    return;
  }

  const paneHeight = layout.height - layout.top - layout.bottom;
  const visible = timeScale.visibleStrictRange();
  const minIndex = rows[0]?.index ?? 0;
  const maxIndex = rows[rows.length - 1]?.index ?? 0;
  const start = visible === null ? minIndex : clamp(visible.left(), minIndex, maxIndex);
  const end = visible === null ? maxIndex : clamp(visible.right(), minIndex, maxIndex);
  const tickCount = clamp(Math.floor((layout.width - layout.left - layout.right) / 140), 3, 7);
  const anchors = collectVisibleTimeAnchors(rows, start, end, tickCount);

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "top";
  context.fillStyle = options.axisTextColor;

  for (const row of anchors) {
    const text = formatTimeAxisLabel(row.time, formatter);
    const x = layout.left + timeScale.indexToCoordinate(row.index as never);
    drawAxisTag(context, {
      text,
      x: clampCenterTag(x, context.measureText(text).width, layout.left, layout.width - layout.right),
      y: layout.top + paneHeight + 8,
    }, options);
  }

  if (crosshair !== null) {
    const logical = Math.round(timeScale.coordinateToLogical(crosshair.x));
    const row = findNearestRowByLogical(rows, logical);
    if (row === null) {
      context.restore();
      return;
    }
    const text = formatTimeAxisLabel(row.time, formatter);
    drawAxisTag(context, {
      text,
      x: clampCenterTag(layout.left + crosshair.x, context.measureText(text).width, layout.left, layout.width - layout.right),
      y: layout.top + paneHeight + 8,
      active: true,
    }, options);
  }

  if (overlayTag !== null) {
    drawAxisTag(context, overlayTag, options);
  }

  context.restore();
}

function buildMagnetTimeAxisTag(
  layout: Layout,
  rows: readonly { time: number; index: TimePointIndex }[],
  timeScale: TimeScale,
  guide: DrawingSnapGuideState,
  formatter: ((time: number) => string) | null,
): AxisTag | null {
  if (guide.time === null || rows.length === 0) {
    return null;
  }
  const x = resolveDrawingTimeCoordinate(guide.time, rows, timeScale);
  const text = `MAG ${formatTimeAxisLabel(guide.time, formatter)}`;
  const estimatedWidth = text.length * 7;
  return {
    text,
    x: clampCenterTag(layout.left + x, estimatedWidth, layout.left, layout.width - layout.right),
    y: layout.top + (layout.height - layout.top - layout.bottom) + 8,
    backgroundColor: guide.color,
    borderColor: guide.color,
    textColor: "#fffdf7",
  };
}

function drawAxisTag(
  context: CanvasRenderingContext2D,
  tag: AxisTag,
  options: Required<NonNullable<PhaseOneChartOptions["layout"]>>,
): void {
  const textWidth = context.measureText(tag.text).width;
  const boxWidth = Math.ceil(textWidth + 12);
  const boxHeight = 18;

  context.fillStyle = tag.backgroundColor ?? (tag.active ? options.axisActiveBackground : options.axisLabelBackground);
  context.strokeStyle = tag.borderColor ?? (tag.active ? options.axisActiveBackground : options.axisLabelBorder);
  context.lineWidth = 1;
  context.fillRect(tag.x, tag.y, boxWidth, boxHeight);
  context.strokeRect(tag.x + 0.5, tag.y + 0.5, boxWidth - 1, boxHeight - 1);
  context.fillStyle = tag.textColor ?? (tag.active ? options.axisActiveText : options.axisTextColor);
  context.fillText(
    tag.text,
    tag.x + 6,
    tag.y + (context.textBaseline === "middle" ? boxHeight / 2 : 4),
  );
}

function collectVisibleTimeAnchors(
  rows: readonly { time: number; index: number }[],
  start: number,
  end: number,
  tickCount: number,
): Array<{ time: number; index: number }> {
  const anchors: Array<{ time: number; index: number }> = [];
  const seen = new Set<string>();

  for (let index = 0; index < tickCount; index += 1) {
    const ratio = tickCount === 1 ? 0 : index / (tickCount - 1);
    const candidate = start + (end - start) * ratio;
    const row = findNearestRowByLogical(rows, candidate);
    if (row !== null) {
      const key = `${row.index}:${row.time}`;
      if (!seen.has(key)) {
        seen.add(key);
        anchors.push(row);
      }
    }
  }

  return anchors;
}

function clampCenterTag(
  centerX: number,
  textWidth: number,
  minX: number,
  maxX: number,
): number {
  const boxWidth = Math.ceil(textWidth + 12);
  return clamp(centerX - boxWidth / 2, minX, maxX - boxWidth);
}

function formatPriceAxisLabel(value: number, formatter: ((value: number) => string) | null = null): string {
  if (formatter !== null) {
    return formatter(value);
  }
  const digits = Math.abs(value) >= 1000 ? 2 : 3;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function formatVolumeAxisLabel(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (absolute >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absolute >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

function formatTimeAxisLabel(value: number, formatter: ((time: number) => string) | null = null): string {
  if (formatter !== null) {
    return formatter(value);
  }
  if (Math.abs(value) < 100_000_000_000) {
    return `T ${value}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function emitReadout(canvas: HTMLCanvasElement, detail: PhaseOneReadoutDetail): void {
  canvas.dispatchEvent(
    new CustomEvent<PhaseOneReadoutDetail>("chartx:readout", {
      detail,
    }),
  );
}

function buildCrosshairReadout(
  rows: readonly { index: number; time: number; value: [number, number, number, number] }[],
  crosshair: PanePoint | null,
  timeScale: TimeScale,
  priceScale: PriceScale,
): PhaseOneReadoutBody {
  if (crosshair === null || rows.length === 0) {
    return {
      active: false,
      paneIndex: null,
      time: null,
      open: null,
      high: null,
      low: null,
      close: null,
      price: null,
      series: [],
    };
  }

  const logical = Math.round(timeScale.coordinateToLogical(crosshair.x));
  const row = findNearestRowByLogical(rows, logical);
  if (row === null) {
    return {
      active: false,
      paneIndex: null,
      time: null,
      open: null,
      high: null,
      low: null,
      close: null,
      price: null,
      series: [],
    };
  }

  return {
    active: true,
    paneIndex: null,
    time: row.time,
    open: row.value[PlotRowValueIndex.Open],
    high: row.value[PlotRowValueIndex.High],
    low: row.value[PlotRowValueIndex.Low],
    close: row.value[PlotRowValueIndex.Close],
    price: priceScale.coordinateToPrice(crosshair.y),
    series: [],
  };
}

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("#")) {
    const normalized = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
    const red = Number.parseInt(normalized.slice(1, 3), 16);
    const green = Number.parseInt(normalized.slice(3, 5), 16);
    const blue = Number.parseInt(normalized.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const rgbaMatch = color.match(/^rgba?\((.+)\)$/);
  if (rgbaMatch === null) {
    return color;
  }
  const [red = "0", green = "0", blue = "0"] = rgbaMatch[1].split(",").map((token) => token.trim());
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function drawPaneDrawings(
  context: CanvasRenderingContext2D,
  drawings: readonly ChartDrawingDescriptor[],
  axisBars: readonly { time: number; index: TimePointIndex }[],
  timeScale: TimeScale,
  priceScale: PriceScale,
  selectedDrawingId: string | null,
  hoveredDrawingId: string | null,
  hoveredDrawingHandle: DrawingDragHandle | null,
): void {
  for (const drawing of drawings) {
    if (!drawing.visible) {
      continue;
    }

    if (drawing.kind === "horizontal-line") {
      if (selectedDrawingId === drawing.id) {
        const y = toCoordinate(priceScale.priceToCoordinate(drawing.line.price));
        context.save();
        context.strokeStyle = "rgba(16, 16, 16, 0.18)";
        context.lineWidth = drawing.line.lineWidth + 6;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(context.canvas.width, y);
        context.stroke();
        context.restore();
      }
      continue;
    }

    const startX = resolveDrawingTimeCoordinate(drawing.startTime, axisBars, timeScale);
    const endX = resolveDrawingTimeCoordinate(drawing.endTime, axisBars, timeScale);
    const startY = toCoordinate(priceScale.priceToCoordinate(drawing.startPrice));
    const endY = toCoordinate(priceScale.priceToCoordinate(drawing.endPrice));

    context.save();
    context.strokeStyle = drawing.color;
    context.lineWidth = drawing.lineWidth;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
    if (selectedDrawingId === drawing.id) {
      context.strokeStyle = "rgba(16, 16, 16, 0.18)";
      context.lineWidth = drawing.lineWidth + 6;
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.stroke();
      context.fillStyle = drawing.color;
      context.beginPath();
      context.arc(startX, startY, 3.5, 0, Math.PI * 2);
      context.arc(endX, endY, 3.5, 0, Math.PI * 2);
      context.fill();
      if (hoveredDrawingId === drawing.id && hoveredDrawingHandle !== null) {
        const hoveredX = hoveredDrawingHandle === "start" ? startX : endX;
        const hoveredY = hoveredDrawingHandle === "start" ? startY : endY;
        context.fillStyle = "#fffdf7";
        context.strokeStyle = drawing.color;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(hoveredX, hoveredY, 6, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    }
    context.restore();
  }
}

function drawDrawingSnapGuide(
  context: CanvasRenderingContext2D,
  paneWidth: number,
  paneHeight: number,
  priceScale: PriceScale,
  axisBars: readonly { time: number; index: TimePointIndex }[],
  timeScale: TimeScale,
  guide: DrawingSnapGuideState | null,
): void {
  if (guide === null) {
    return;
  }

  context.save();
  context.strokeStyle = guide.color;
  context.lineWidth = 1;
  context.setLineDash([6, 4]);
  if (guide.price !== null) {
    const y = priceScale.priceToCoordinate(guide.price);
    if (y !== null) {
      context.beginPath();
      context.moveTo(0, Math.round(y) + 0.5);
      context.lineTo(paneWidth, Math.round(y) + 0.5);
      context.stroke();
    }
  }
  if (guide.time !== null) {
    const x = resolveDrawingTimeCoordinate(guide.time, axisBars, timeScale);
    context.beginPath();
    context.moveTo(Math.round(x) + 0.5, 0);
    context.lineTo(Math.round(x) + 0.5, paneHeight);
    context.stroke();
  }
  context.restore();
}

function resolveDrawingTimeCoordinate(
  time: number,
  axisBars: readonly { time: number; index: TimePointIndex }[],
  timeScale: TimeScale,
): number {
  if (axisBars.length === 0) {
    return 0;
  }
  if (time <= axisBars[0]!.time) {
    return timeScale.indexToCoordinate(axisBars[0]!.index);
  }
  if (time >= axisBars[axisBars.length - 1]!.time) {
    return timeScale.indexToCoordinate(axisBars[axisBars.length - 1]!.index);
  }

  for (let index = 1; index < axisBars.length; index += 1) {
    const previous = axisBars[index - 1]!;
    const next = axisBars[index]!;
    if (time <= next.time) {
      if (next.time === previous.time) {
        return timeScale.indexToCoordinate(previous.index);
      }
      const ratio = (time - previous.time) / (next.time - previous.time);
      const logical = previous.index + (next.index - previous.index) * ratio;
      return timeScale.logicalToCoordinate(logical as Logical);
    }
  }

  return timeScale.indexToCoordinate(axisBars[axisBars.length - 1]!.index);
}


function drawingHitDistance(
  point: PanePoint,
  drawing: ChartDrawingDescriptor,
  axisBars: readonly { time: number; index: TimePointIndex }[],
  timeScale: TimeScale,
  priceScale: PriceScale,
): number | null {
  if (drawing.kind === "horizontal-line") {
    const y = priceScale.priceToCoordinate(drawing.line.price);
    return y === null ? null : Math.abs(point.y - y);
  }

  const startX = resolveDrawingTimeCoordinate(drawing.startTime, axisBars, timeScale);
  const endX = resolveDrawingTimeCoordinate(drawing.endTime, axisBars, timeScale);
  const startY = priceScale.priceToCoordinate(drawing.startPrice);
  const endY = priceScale.priceToCoordinate(drawing.endPrice);
  if (startY === null || endY === null) {
    return null;
  }

  return distanceToLineSegment(point.x, point.y, startX, startY, endX, endY);
}

function distanceToLineSegment(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const dx = endX - startX;
  const dy = endY - startY;
  if (dx === 0 && dy === 0) {
    return Math.hypot(pointX - startX, pointY - startY);
  }

  const t = clamp(((pointX - startX) * dx + (pointY - startY) * dy) / (dx * dx + dy * dy), 0, 1);
  const projectionX = startX + dx * t;
  const projectionY = startY + dy * t;
  return Math.hypot(pointX - projectionX, pointY - projectionY);
}

function assertCanvasElement(value: unknown): asserts value is HTMLCanvasElement {
  if (!(value instanceof HTMLCanvasElement)) {
    throw new Error("chartx phase-one chart requires an HTMLCanvasElement");
  }
}
