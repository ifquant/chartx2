import {
  createCompressedPriceBasedChartBarSequence,
  createDirectionColumnPriceBasedChartBarSequence,
  applyMainSeriesStyleOptions,
  applyMainSeriesBuilder,
  buildHeikinAshiData,
  buildKagiData,
  buildLineBreakData,
  buildPointFigureData,
  buildRenkoData,
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
  type ChartBarSequence,
  type VersionedChartTemplateInput,
} from "../model";
import {
  AreaRenderer,
  BaselineRenderer,
  BarRenderer,
  CandlesticksRenderer,
  GridRenderer,
  HistogramRenderer,
  KagiRenderer,
  LineRenderer,
  PointFigureRenderer,
} from "../renderers";
import type { Coordinate } from "../model";
import {
  type RestorableDrawingSnapshot,
  validateDrawingCollectionSnapshots,
} from "./chart-drawing-restore";
import { createMainSeriesSourceState } from "./chart-main-series-source";
import {
  addPrimarySeries as addPrimarySeriesUseCase,
  attachPrimarySeries as attachPrimarySeriesUseCase,
  type PrimarySeriesFactoryDeps,
} from "./chart-primary-series-factory";
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
  addSecondarySeries as addSecondarySeriesUseCase,
  attachStudySeries as attachStudySeriesUseCase,
  createSecondarySeriesApiDeps as createSecondarySeriesApiDepsUseCase,
  type SecondarySeriesApiDepsBuilder,
} from "./chart-secondary-series-factory";
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
  setPrimaryData as setPrimaryDataUseCase,
  setPrimaryHistogramLikeData as setPrimaryHistogramLikeDataUseCase,
  updatePrimaryData as updatePrimaryDataUseCase,
  updatePrimaryHistogramLikeData as updatePrimaryHistogramLikeDataUseCase,
} from "./chart-main-series-runtime";
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
import {
  createPaneApiHandle,
  subscribePaneResizeRuntime,
  unsubscribePaneResizeRuntime,
} from "./chart-pane-api-runtime";
import {
  buildPaneStateRuntime,
  buildPaneStateSnapshotRuntime,
  getPaneSeriesStatesRuntime,
} from "./chart-pane-bookkeeping-runtime";
import {
  emitPaneEventRuntime as emitPaneEventCompositionRuntime,
  emitPaneResizeRuntime as emitPaneResizeCompositionRuntime,
} from "./chart-pane-event-runtime";
import {
  getDrawingByIdRuntime,
  getDrawingCountForPaneRuntime,
  listAllDrawingsRuntime,
  listDrawingsByPaneRuntime,
  removeDrawingRuntime,
  removeSelectedDrawingRuntime,
  selectDrawingRuntime,
} from "./chart-drawing-registry-runtime";
import {
  clearTradeLocationRuntime,
  getTradeLocationState as getTradeLocationStateUseCase,
  locateTradeRuntime,
  refreshTradeLocationRuntime,
} from "./chart-trade-location-runtime";
import { setChartType as setChartTypeUseCase } from "./chart-main-series-switch";
import {
  distanceToLineSegment,
} from "./chart-drawing-geometry";
import { buildCrosshairReadout } from "./chart-crosshair-readout";
import { createChartInteractionHandlers } from "./chart-interaction-handlers";
import { createChartHandlerRegistry } from "./chart-handler-registry";
import {
  calculateBaseBarSpacing,
  clamp,
  measureLayout,
  resolveActivePane,
  resolveBarSpacing,
  resolveLocalPanePoint,
  resolvePanePoint,
} from "./chart-layout-geometry";
import {
  resolveHitDrawing as resolveHitDrawingUseCase,
} from "./chart-drawing-hit-test";
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
  resolveTrendLineDefaults as resolveTrendLineDefaultsUseCase,
} from "./chart-drawing-state";
import {
  addHorizontalLineDrawingCommand as addHorizontalLineDrawingCommandUseCase,
  addTargetedSeries as addTargetedSeriesUseCase,
  addTargetedStudy as addTargetedStudyUseCase,
  addTrendLineDrawingCommand as addTrendLineDrawingCommandUseCase,
  addVolumeSeriesCommand as addVolumeSeriesCommandUseCase,
} from "./chart-add-commands";
import {
  addPaneCommand as addPaneCommandUseCase,
  removePaneByHandleCommand as removePaneByHandleCommandUseCase,
  removeSeriesCommand as removeSeriesCommandUseCase,
} from "./chart-structure-commands";
import {
  createPriceScaleApi as createPriceScaleApiUseCase,
  createTimeScaleApi as createTimeScaleApiUseCase,
} from "./chart-scale-commands";
import {
  applyChartOptions as applyChartOptionsUseCase,
  resizeChart as resizeChartUseCase,
} from "./chart-shell-commands";
import { createChartPublicApi as createChartPublicApiUseCase } from "./chart-public-api";
import {
  type PriceLineState,
} from "./chart-price-line-runtime";
import { createPriceLineManager } from "./chart-price-line-management";
import {
  createMainSeriesOptions as createMainSeriesOptionsUseCase,
  createMainSourceState as createMainSourceStateUseCase,
  createSeriesLabel as createSeriesLabelUseCase,
  createSeriesMeta as createSeriesMetaUseCase,
  createSeriesOptions as createSeriesOptionsUseCase,
} from "./chart-series-builders";
import {
  createMainBarSequenceFromSource as createMainBarSequenceFromSourceUseCase,
  getMainSource as getMainSourceUseCase,
  getMainSourceOrThrow as getMainSourceOrThrowUseCase,
  syncChartContextFromMainSource as syncChartContextFromMainSourceUseCase,
} from "./chart-main-source-runtime";
import {
  buildPrimaryPaneSeriesRuntime,
  getCompareStudyStateRuntime,
  getMovingAverageStudyStateRuntime,
  getOrCreateSecondaryPanePriceScaleRuntime,
  getSecondarySeriesForPaneRuntime,
  getSourceByApiRuntime,
  getStudySourcesForPaneRuntime,
} from "./chart-source-runtime";
import { createChartSourceOwner } from "./chart-source-owner";
import { createChartPaneOwner } from "./chart-pane-owner";
import { createChartDrawingOwner } from "./chart-drawing-owner";
import {
  applySeriesFormatterOptions as applySeriesFormatterOptionsUseCase,
  setSeriesMarkers as setSeriesMarkersUseCase,
} from "./chart-series-presentation";
import {
  setSecondaryData as setSecondaryDataUseCase,
  setSecondaryHistogramLikeData as setSecondaryHistogramLikeDataUseCase,
  updateSecondaryData as updateSecondaryDataUseCase,
  updateSecondaryHistogramLikeData as updateSecondaryHistogramLikeDataUseCase,
} from "./chart-secondary-series-runtime";
import {
  emitClickRuntime as emitClickRuntimeUseCase,
} from "./chart-event-runtime";
import { createChartCanvasLifecycleOwner } from "./chart-canvas-lifecycle-owner";
import {
  createChartViewState,
  type DragState,
  type DrawingDragHandle,
  type DrawingDragState,
  type DrawingSnapGuideState,
  type PaneResizeState,
} from "./chart-view-state";
import {
  applyActiveTrendLineDrag as applyActiveTrendLineDragUseCase,
  resolveSelectedTrendLineDrag as resolveSelectedTrendLineDragUseCase,
} from "./chart-drawing-runtime";
import {
  createHorizontalLineDrawingForPane as createHorizontalLineDrawingForPaneUseCase,
  createTrendLineDrawingForPane as createTrendLineDrawingForPaneUseCase,
} from "./chart-drawing-creation";
import { createChartRenderCoordinator } from "./chart-render-coordinator";
import { createChartRenderInvalidation } from "./chart-render-invalidation";
import { createChartStateCoordinator } from "./chart-state-coordinator";
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
const BAR_SPACING_BOUNDS = { minBarSpacing: MIN_BAR_SPACING, maxBarSpacing: MAX_BAR_SPACING } as const;
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

export type PhaseOneReadoutBody = Omit<PhaseOneReadoutDetail, "formatted">;

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

type HistogramVisual = {
  color?: string;
  isUp: boolean;
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
  private readonly handlerRegistry = createChartHandlerRegistry();
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
  private nextDrawingId = 1;
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
  private readonly renderInvalidation = createChartRenderInvalidation({
    getCanvas: () => this.canvas,
    renderCanvas: (canvas) => {
      this.render(canvas);
    },
  });
  private readonly priceLineManager = createPriceLineManager({
    defaultOptions: this.defaultPriceLineOptions,
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly viewState = createChartViewState<PanePoint, ResizeObserver>();
  private readonly sourceOwner = createChartSourceOwner({
    accessors: {
      mainSourceId: () => this.chartModel.mainSourceId(),
      getSourceByIdAndRole: (id, role) => this.chartModel.getSourceByIdAndRole(id, role),
      getSourceByApiOrThrow: (api, message) => this.chartModel.getSourceByApiOrThrow(api as ChartSeriesApi, message),
      listSourcesByPaneAndRole: (paneId, role) => this.chartModel.listSourcesByPaneAndRole(paneId, role),
      listSourcesByRole: (role) => this.chartModel.listSourcesByRole(role),
    },
    mainSeriesSwitch: {
      removeCurrent: (api) => this.chartModel.removeSourceByApi(api as ChartSeriesApi) !== undefined,
      clearPriceRangeOverride: () => {
        this.primaryPriceRangeOverride = null;
      },
      buildPreservedState: (source) => {
        const mainSource = source as MainSeriesSourceState;
        return {
          id: mainSource.id,
          label: mainSource.label,
          data: mainSource.inputData,
          visuals: new Map(mainSource.visuals),
          markers: [...mainSource.markers],
          priceLines: clonePriceLines(mainSource.priceLines),
          options: { ...mainSource.options },
          previousStyleSchemaId: mainSource.styleSchemaId,
        };
      },
      attachSeries: (type, preserved) => this.attachPrimarySeries(type as PhaseOneMainChartType, preserved as never),
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
      emitChartTypeChange: (type) => this.emitChartTypeChange(type as PhaseOneMainChartType),
    },
    primaryMutations: {
      rebuild: (source) => {
        (source as MainSeriesSourceState).data = applyMainSeriesBuilderData(
          (source as MainSeriesSourceState).inputData,
          source as MainSeriesSourceState,
        );
      },
      syncContext: (source) => this.syncChartContextFromMainSource(source as MainSeriesSourceState),
      resetViewport: () => {
        this.barSpacing = null;
        this.rightOffset = DEFAULT_RIGHT_OFFSET;
      },
      clearPriceRangeOverride: () => {
        this.primaryPriceRangeOverride = null;
      },
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
      updateCanonical: (existing, bar) =>
        updateCanonicalData(
          existing as readonly PhaseOneCandlestickData[],
          bar as PhaseOneCandlestickData,
        ),
      buildHistogramVisuals: (data) => buildHistogramVisuals(data as readonly PhaseOneHistogramData[]),
      normalizeHistogramData: (data) => normalizeHistogramData(data as readonly PhaseOneHistogramData[]),
      normalizeHistogramBar: (bar) => normalizeHistogramBar(bar as PhaseOneHistogramData),
    },
    studySources: {
      primaryPriceScale: this.primaryPriceScale,
      getOrCreateSecondaryPriceScale: (paneId) => this.chartModel.getOrCreateSecondaryScale(paneId),
      createSourceState: ({ paneId, kind, api, meta, priceScale, priceScaleId, studyKind, indicator }) =>
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
          paneId,
          kind: kind as ChartSeriesKind,
          api: api as ChartSeriesApi,
          meta,
          priceScale: priceScale as PriceScale,
          priceScaleId,
          studyKind: studyKind as StudySourceKind | undefined,
          indicator: indicator as MovingAverageIndicatorState | undefined,
          defaultCompareOptions: this.defaultCompareOptions,
          createOptions: (createKind) => this.createSeriesOptions(createKind),
        }),
      registerSource: (source) => this.chartModel.registerSource(source as StudySourceState),
      createMeta: (kind) => this.createSeriesMeta(kind),
    },
    secondaryMutations: {
      resolveDisplayData: (source) => this.resolveStudyDisplayData(source as StudySourceState),
      resetViewport: () => {
        this.barSpacing = null;
        this.rightOffset = DEFAULT_RIGHT_OFFSET;
      },
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
      updateCanonical: (existing, bar) =>
        updateCanonicalData(
          existing as readonly PhaseOneCandlestickData[],
          bar as PhaseOneCandlestickData,
        ),
      buildHistogramVisuals: (data) => buildHistogramVisuals(data as readonly PhaseOneHistogramData[]),
      normalizeHistogramData: (data) => normalizeHistogramData(data as readonly PhaseOneHistogramData[]),
      normalizeHistogramBar: (bar) => normalizeHistogramBar(bar as PhaseOneHistogramData),
    },
    secondarySeriesApi: {
      assertSeriesActive: (api) => this.assertSeriesActive(api as ChartSeriesApi),
      applySeriesFormatterOptions: (seriesOptions, options) =>
        this.applySeriesFormatterOptions(
          seriesOptions as PhaseOneSeriesFormatterOptions,
          options as PhaseOneSeriesFormatterOptions,
        ),
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
      setSecondaryData: (api, data, kind) =>
        setSecondaryDataUseCase(this.chartModel.getSourceByApiOrThrow(api as ChartSeriesApi, "chartx phase-one series has been removed") as StudySourceState, data as readonly PhaseOneCandlestickData[], {
          resolveDisplayData: (source) => this.resolveStudyDisplayData(source as StudySourceState),
          resetViewport: () => {
            this.barSpacing = null;
            this.rightOffset = DEFAULT_RIGHT_OFFSET;
          },
          render: () => {
            this.renderInvalidation.renderIfAttached();
          },
        }),
      updateSecondary: (api, bar, kind) =>
        updateSecondaryDataUseCase(this.chartModel.getSourceByApiOrThrow(api as ChartSeriesApi, "chartx phase-one series has been removed") as StudySourceState, bar as PhaseOneCandlestickData, {
          updateCanonical: (existing, nextBar) => updateCanonicalData(existing, nextBar),
          resolveDisplayData: (source) => this.resolveStudyDisplayData(source as StudySourceState),
          render: () => {
            this.renderInvalidation.renderIfAttached();
          },
        }),
      setSecondaryHistogramLikeData: (api, data, kind) =>
        setSecondaryHistogramLikeDataUseCase(this.chartModel.getSourceByApiOrThrow(api as ChartSeriesApi, "chartx phase-one series has been removed") as never, data as readonly (PhaseOneHistogramData | PhaseOneVolumeData)[], {
          buildVisuals: (rows) => buildHistogramVisuals(rows as readonly PhaseOneHistogramData[]),
          normalizeData: (rows) => normalizeHistogramData(rows as readonly PhaseOneHistogramData[]),
          resolveDisplayData: (source) => this.resolveStudyDisplayData(source as StudySourceState),
          resetViewport: () => {
            this.barSpacing = null;
            this.rightOffset = DEFAULT_RIGHT_OFFSET;
          },
          render: () => {
            this.renderInvalidation.renderIfAttached();
          },
        }),
      updateSecondaryHistogramLike: (api, bar, kind) =>
        updateSecondaryHistogramLikeDataUseCase(this.chartModel.getSourceByApiOrThrow(api as ChartSeriesApi, "chartx phase-one series has been removed") as never, bar as PhaseOneHistogramData | PhaseOneVolumeData, {
          normalizeBar: (nextBar) => normalizeHistogramBar(nextBar as PhaseOneHistogramData),
          updateCanonical: (existing, nextValue) => updateCanonicalData(existing, nextValue),
          resolveDisplayData: (source) => this.resolveStudyDisplayData(source as StudySourceState),
          render: () => {
            this.renderInvalidation.renderIfAttached();
          },
        }),
      normalizeLineData,
      normalizeLineBar,
      setMarkers: (api, markers, _kind) => {
        const state = this.chartModel.getSourceByApiOrThrow(api as ChartSeriesApi, "chartx phase-one series has been removed") as SeriesSourceState;
        setSeriesMarkersUseCase(state, markers as readonly PhaseOneSeriesMarker[], {
          normalizeMarkers: (nextMarkers) => normalizeMarkers(nextMarkers as readonly PhaseOneSeriesMarker[]),
          render: () => {
            this.renderInvalidation.renderIfAttached();
          },
        });
      },
      createPriceLine: (source, options) => {
        const priceLine = this.priceLineManager.createState(options as PhaseOnePriceLineOptions | undefined);
        return this.priceLineManager.createApi((source as SeriesSourceState).priceLines, priceLine);
      },
      removePriceLine: (source, line) => {
        this.priceLineManager.remove((source as SeriesSourceState).priceLines, line as PhaseOnePriceLineApi);
      },
      applyCompareOptions: (state, options) =>
        applyCompareStudyOptions(state as StudySourceState, options as Partial<PhaseOneCompareSeriesOptions>, {
          defaultCompareOptions: this.defaultCompareOptions,
          resolveDisplayData: (study) => this.resolveStudyDisplayData(study as StudySourceState),
          render: () => {
            this.renderInvalidation.renderIfAttached();
          },
        }),
      getCompareOptions: (state) =>
        getCompareStudyOptions(state as StudySourceState, this.defaultCompareOptions),
      applyMovingAverageStudyOptions: (state, options) =>
        applyMovingAverageStudyOptions(state as StudySourceState, options as Partial<PhaseOneMovingAverageStudyOptions>, {
          defaultMovingAverageOptions: this.defaultMovingAverageOptions,
          resolveDisplayData: (study) => this.resolveStudyDisplayData(study as StudySourceState),
          render: () => {
            this.renderInvalidation.renderIfAttached();
          },
        }),
      getMovingAverageStudyOptions: (state) =>
        getMovingAverageStudyOptions(state as StudySourceState, this.defaultMovingAverageOptions),
    },
    tradeLocation: {
      active: () => this.activeTradeLocation,
      setActive: (next) => {
        this.activeTradeLocation = next as typeof this.activeTradeLocation;
      },
      setVisibleLogicalRange: (range) => this.timeScaleApi().setVisibleLogicalRange(range),
      setVisiblePriceRange: (range) => this.priceScaleApi().setVisibleRange(range),
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    },
  });
  private readonly paneOwner = createChartPaneOwner({
    handlerRegistry: this.handlerRegistry,
    getPaneById: (paneId) => this.panes.getById(paneId),
    getPaneByIndex: (index) => this.panes.getByIndex(index),
    getPaneIndex: (paneId) => {
      const index = this.panes.getIndex(paneId);
      if (index === -1) {
        throw new Error("chartx phase-one pane has been removed");
      }
      return index;
    },
    listPanes: () => this.panes.list(),
    addPane: () => {
      const pane = this.panes.addSecondaryPane({});
      this.paneOwner.emitPaneEvent("added", pane.id);
      this.renderInvalidation.renderIfAttached();
      return this.paneOwner.createPaneHandle(pane.id);
    },
    hasCanvas: () => this.canvas !== null,
    getLayout: () => (this.canvas === null ? DEFAULT_LAYOUT : measureLayout(this.canvas, DEFAULT_LAYOUT, this.viewState.manualLayout())),
    gap: PANE_GAP,
    getCrosshair: () => this.viewState.crosshair(),
    setCrosshair: (point) => {
      this.viewState.setCrosshair(point);
    },
    getSeriesCount: (paneId) => this.chartModel.listSourcesByPane(paneId).length,
    getDrawingCount: (paneId) => this.getDrawingCountForPane(paneId),
    listSourcesByPane: (paneId) => this.chartModel.listSourcesByPane(paneId),
    removePaneEntry: (paneId) => {
      this.panes.removeById(paneId);
    },
    removeSecondaryScale: (paneId) => this.chartModel.removeSecondaryScale(paneId),
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly drawingOwner = createChartDrawingOwner({
    allocateDrawingOrdinal: () => {
      const ordinal = this.nextDrawingId;
      this.nextDrawingId += 1;
      return ordinal;
    },
    formatSeriesKindLabel,
    resolveTarget: (target, options) => this.resolveSeriesTarget(target, options) as never,
    getPaneById: (paneId) => this.panes.getById(paneId),
    getPaneByIndex: (index) => this.panes.getByIndex(index),
    createPaneTarget: (pane) => ({ pane }),
    getRestorePaneId: (target) => target.pane.id,
    getPaneIndex: (paneId) => this.getPaneIndex(paneId),
    registry: this.drawingRegistry,
    createPriceLineState: (options) => this.priceLineManager.createState(options),
    lineColor: LINE_COLOR,
    resolveTrendLineDefaults: () => this.resolveTrendLineDefaults(),
    resolveMagnetOptions: (drawing) =>
      resolveDrawingMagnetOptionsUseCase(drawing as ChartDrawingDescriptor, this.drawingOptions),
    resolvePropertySchema: (type) => DRAWING_PROPERTY_SCHEMAS[type],
    view: {
      selectedDrawingId: () => this.viewState.selectedDrawingId(),
      setSelectedDrawingId: (id) => {
        this.viewState.setSelectedDrawingId(id);
      },
      notifySelectionChange: (selection) => {
        this.handlerRegistry.notifyDrawingSelectionChange(selection);
      },
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    },
  });
  private readonly renderCoordinator = createChartRenderCoordinator({
    dpr: () => window.devicePixelRatio || 1,
    getLayout: (canvas) => measureLayout(canvas, DEFAULT_LAYOUT, this.viewState.manualLayout()),
    getChartOptions: () => this.chartOptions,
    getCrosshairOptions: () => this.crosshairOptions,
    getDrawingOptions: () => this.drawingOptions,
    getCrosshair: () => this.viewState.crosshair(),
    getSelectedDrawingId: () => this.viewState.selectedDrawingId(),
    getHoveredDrawingId: () => this.viewState.hoveredDrawingId(),
    getHoveredDrawingHandle: () => this.viewState.hoveredDrawingHandle(),
    getDrawingSnapGuide: () => this.viewState.drawingSnapGuide(),
    getManualBarSpacing: () => this.barSpacing,
    getRightOffset: () => this.rightOffset,
    getPrimaryScaleSeriesOnly: () => this.primaryScaleSeriesOnly,
    getPaneSpecs: () => this.panes.list(),
    getMainSource: () => this.getMainSource(),
    createMainBarSequenceFromSource: (source) => this.createMainBarSequenceFromSource(source as MainSeriesSourceState),
    getContextSnapshot: () => this.chartModel.context().snapshot(),
    getPrimaryStudies: () => this.getStudySourcesForPane("primary"),
    buildPrimaryPaneSeries: (mainSource) => this.buildPrimaryPaneSeries(mainSource as MainSeriesSourceState | null),
    getStudySources: () => this.chartModel.listSourcesByRole("study"),
    getSecondarySeriesForPane: (paneId) => this.getSecondarySeriesForPane(paneId),
    getDrawingsByPane: (paneId) => this.getDrawingsByPane(paneId),
    getPaneIndex: (paneId) => this.getPaneIndex(paneId),
    getSecondaryScale: (paneId) => this.chartModel.getSecondaryScale(paneId),
    getPrimaryPriceScale: () => this.primaryPriceScale,
    getPrimaryPriceRangeOverride: () => this.primaryPriceRangeOverride,
    getActiveTradeLocationState: () => this.activeTradeLocation?.state ?? null,
    getTimeScale: () => this.timeScale,
    getTimeAxisFormatter: () => this.timeAxisFormatter,
    getPriceAxisFormatter: () => this.priceAxisFormatter,
    getRendererRuntime: () => ({
      lineRenderer: this.lineRenderer,
      areaRenderer: this.areaRenderer,
      baselineRenderer: this.baselineRenderer,
      barRenderer: this.barRenderer,
      candlesRenderer: this.candlesRenderer,
      pointFigureRenderer: this.pointFigureRenderer,
      histogramRenderer: this.histogramRenderer,
      kagiRenderer: this.kagiRenderer,
    }),
    drawGrid: (context, params) => {
      this.gridRenderer.draw(context, params);
    },
    drawPaneLegend: (context, entries) => {
      drawPaneLegend(context, entries);
    },
    drawCrosshair: (context, paneWidth, paneHeight, crosshair, options) => {
      drawCrosshair(context, paneWidth, paneHeight, crosshair, options);
    },
    emitReadout: (canvas, detail) => {
      emitReadout(canvas, detail);
    },
    emitCrosshairMove: (readout) => {
      this.emitCrosshairMove(readout);
    },
    backgroundColor: () => CHART_BACKGROUND,
    resolveBarSpacing: (currentSpacing, paneWidth, pointCount) =>
      resolveBarSpacing(currentSpacing, paneWidth, pointCount, BAR_SPACING_BOUNDS),
  });
  private readonly stateCoordinator = createChartStateCoordinator({
    getOptions: () => ({
      layout: this.chartOptions,
      crosshair: this.crosshairOptions,
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
    listPanes: () => this.panes.list(),
    getMainSeriesState: () => this.getMainSeriesState(),
    listStudySources: () => this.chartModel.listSourcesByRole("study"),
    getPaneIndex: (paneId) => this.getPaneIndex(paneId),
    getDefaultCompareOptions: () => this.defaultCompareOptions,
    getTradeLocationState: () =>
      this.activeTradeLocation === null
        ? null
        : {
            request: this.activeTradeLocation.request,
            overlay: this.activeTradeLocation.options,
          },
    listDrawings: () => this.drawingOwner.listDrawings(),
    resolveDrawingMagnetOptions: (drawing) =>
      resolveDrawingMagnetOptionsUseCase(drawing as ChartDrawingDescriptor, this.drawingOptions),
    validateDrawings: (drawings, secondaryPaneCount) =>
      validateDrawingCollectionSnapshots(drawings, secondaryPaneCount),
    applyOptions: (options) => {
      this.applyOptions(options);
    },
    clearSelection: () => {
      this.selectDrawing(null, false);
    },
    clearTradeLocation: () => {
      this.clearTradeLocation();
    },
    removeSourcesWhere: (predicate) => {
      this.chartModel.removeSourcesWhere((source) => predicate(source as never));
    },
    removeDrawingByApi: (api) => {
      this.drawingRegistry.removeByApi(api as ChartDrawingApi);
    },
    removeDrawing: (api) => {
      this.removeDrawing(api as ChartDrawingApi);
    },
    getSecondarySeriesCountForPane: (paneId) => this.getSecondarySeriesForPane(paneId).length,
    removeSecondaryPane: (paneId) => {
      this.removePaneById(paneId);
    },
    addPane: (options) => {
      this.addPane(options);
    },
    emitPaneEvent: (type, paneId) => {
      this.emitPaneEvent(type, paneId);
    },
    applyMainSeriesState: (state) => {
      this.applyMainSeriesState(state);
    },
    getPaneByIndex: (index) => this.panes.getByIndex(index),
    createPaneTarget: (pane) => ({ pane: this.createPaneHandle(pane.id) }),
    addCandlestickSeries: (target) => this.addCandlestickSeries(target),
    addBarSeries: (target) => this.addBarSeries(target),
    addLineSeries: (target) => this.addLineSeries(target),
    addAreaSeries: (target) => this.addAreaSeries(target),
    addBaselineSeries: (target) => this.addBaselineSeries(target),
    addHistogramSeries: (target) => this.addHistogramSeries(target),
    addVolumeSeries: (target) => this.addVolumeSeries(target),
    addOverlaySeries: (paneId) => this.addStudyLineSeries(paneId, "overlay"),
    addCompareSeries: (paneId) => this.addCompareStudySeries(paneId),
    addMovingAverageStudy: (paneId) => this.addMovingAverageStudySeries(paneId),
    locateTrade: (request, overlay) => {
      this.locateTrade(request, overlay);
    },
    restoreDrawings: (drawings) => {
      this.drawingOwner.restoreDrawings(drawings as readonly PhaseOneRestorableDrawingSnapshot[]);
    },
    applyTimeScaleOptions: (options) => this.timeScaleApi().applyOptions(options),
    setVisibleLogicalRange: (range) => this.timeScaleApi().setVisibleLogicalRange(range),
    applyPriceScaleOptions: (options) => this.priceScaleApi().applyOptions(options),
    setVisibleRange: (range) => this.priceScaleApi().setVisibleRange(range),
    hasCanvas: () => this.canvas !== null,
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private get panes(): PaneCollection {
    return this.chartModel.panes();
  }

  private get primaryPriceScale(): PriceScale {
    return this.chartModel.primaryScale();
  }
  private readonly interactionHandlers = createChartInteractionHandlers({
    defaultLayout: DEFAULT_LAYOUT,
    paneGap: PANE_GAP,
    paneDividerHitSlop: PANE_DIVIDER_HIT_SLOP,
    barSpacingBounds: BAR_SPACING_BOUNDS,
    getCanvas: () => this.canvas,
    getManualLayout: () => this.viewState.manualLayout(),
    listPanes: () => this.panes.list(),
    getPointCount: () => this.getPointCount(),
    getBarSpacing: () => this.barSpacing,
    setBarSpacing: (value) => {
      this.barSpacing = value;
    },
    getRightOffset: () => this.rightOffset,
    setRightOffset: (value) => {
      this.rightOffset = value;
    },
    getCrosshair: () => this.viewState.crosshair(),
    setCrosshair: (point) => {
      this.viewState.setCrosshair(point);
    },
    getDragState: () => this.viewState.dragState(),
    setDragState: (state) => {
      this.viewState.setDragState(state);
    },
    getDrawingDragState: () => this.viewState.drawingDragState(),
    setDrawingDragState: (state) => {
      this.viewState.setDrawingDragState(state);
    },
    getPaneResizeState: () => this.viewState.paneResizeState(),
    setPaneResizeState: (state) => {
      this.viewState.setPaneResizeState(state);
    },
    setHoveredDrawingId: (id) => {
      this.viewState.setHoveredDrawingId(id);
    },
    setHoveredDrawingHandle: (handle) => {
      this.viewState.setHoveredDrawingHandle(handle);
    },
    clearDrawingSnapGuide: () => {
      this.viewState.clearDrawingSnapGuide();
    },
    resolveHitDrawing: (point, layout, paneFrames) =>
      this.resolveHitDrawing(point, layout, paneFrames as readonly PaneFrame[] | undefined),
    resolveSelectedTrendLineDragHandle: (point, layout, paneFrames) =>
      this.resolveSelectedTrendLineDragHandle(point, layout, paneFrames as readonly PaneFrame[]),
    applyPaneResize: (clientY, layout, paneFrames) => {
      this.applyPaneResize(clientY, layout, paneFrames as readonly PaneFrame[]);
    },
    applyDrawingDrag: (dragState, point, layout, paneFrames) => {
      this.applyDrawingDrag(dragState, point, layout, paneFrames as readonly PaneFrame[]);
    },
    focusCanvas: () => {
      this.canvas?.focus({ preventScroll: true });
    },
    renderCanvas: (canvas) => {
      this.render(canvas);
    },
    selectDrawing: (id) => {
      this.selectDrawing(id);
    },
    buildReadout: (point, layout) => this.renderCoordinator.buildReadout(point, layout),
    emitClick: (readout, point) => {
      this.handlerRegistry.emitClick(readout, point);
    },
    hasSelectedDrawing: () => this.viewState.selectedDrawingId() !== null,
    clearSelectedDrawing: () => {
      this.selectDrawing(null);
    },
    removeSelectedDrawing: () => {
      this.removeSelectedDrawing();
    },
  });
  private readonly handleResize = this.interactionHandlers.handleResize;
  private readonly handlePointerMove = this.interactionHandlers.handlePointerMove;
  private readonly handlePointerLeave = this.interactionHandlers.handlePointerLeave;
  private readonly handlePointerDown = this.interactionHandlers.handlePointerDown;
  private readonly handlePointerUp = this.interactionHandlers.handlePointerUp;
  private readonly handleWheel = this.interactionHandlers.handleWheel;
  private readonly handleClick = this.interactionHandlers.handleClick;
  private readonly handleKeyDown = this.interactionHandlers.handleKeyDown;
  private readonly canvasLifecycleOwner = createChartCanvasLifecycleOwner({
    getManualLayout: () => this.viewState.manualLayout(),
    getCanvas: () => this.canvas,
    setCanvas: (nextCanvas) => {
      this.canvas = nextCanvas;
    },
    renderCanvas: (nextCanvas) => {
      this.render(nextCanvas);
    },
    getResizeObserver: () => this.viewState.resizeObserver(),
    setResizeObserver: (observer) => {
      this.viewState.setResizeObserver(observer);
    },
    handlers: {
      handleResize: this.handleResize as EventListener,
      handlePointerDown: this.handlePointerDown as EventListener,
      handlePointerMove: this.handlePointerMove as EventListener,
      handlePointerUp: this.handlePointerUp as EventListener,
      handlePointerLeave: this.handlePointerLeave as EventListener,
      handleWheel: this.handleWheel as EventListener,
      handleClick: this.handleClick as EventListener,
      handleKeyDown: this.handleKeyDown as EventListener,
    },
    clearInteractionState: () => {
      this.viewState.clearInteractionState();
    },
    clearSubscriptions: () => {
      this.handlerRegistry.clearAll();
    },
  });

  public attach(canvas: HTMLCanvasElement): void {
    assertCanvasElement(canvas);
    this.canvasLifecycleOwner.attach(canvas);
  }

  public detach(): void {
    this.canvasLifecycleOwner.detach();
  }

  public addCandlestickSeries(target?: PhaseOneSeriesTarget): PhaseOneCandlestickSeriesApi {
    return addTargetedSeriesUseCase(target, {
      resolveTarget: (nextTarget, options) => this.resolveSeriesTarget(nextTarget, options),
      addPrimary: () => this.addPrimaryCandlestickSeries(),
      addSecondary: (paneId) => this.addSecondaryCandlestickSeries(paneId),
    });
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
    return attachPrimarySeriesUseCase(kind, preserved, this.createPrimarySeriesFactoryDeps());
  }

  private createPrimarySeriesFactoryDeps(): PrimarySeriesFactoryDeps<
    PhaseOneMainSeriesApi,
    MainSeriesSourceState,
    HistogramVisual,
    SeriesMarkerState,
    PriceLineState,
    MainSeriesSourceState["options"],
    PhaseOneMainStyleSchemaId
  > {
    return {
      currentMainSourceId: this.chartModel.mainSourceId(),
      createMeta: (chartType) => this.createSeriesMeta(chartType),
      createLabel: (chartType, id) => this.createSeriesLabel(chartType, id),
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
        this.renderInvalidation.renderIfAttached();
      },
      setPrimaryData: (data) => this.setPrimaryData(data),
      updatePrimary: (bar) => this.updatePrimary(bar),
      setPrimaryHistogramLikeData: (data) => this.setPrimaryHistogramLikeData(data),
      updatePrimaryHistogramLike: (bar) => this.updatePrimaryHistogramLike(bar),
      normalizeLineData,
      normalizeLineBar,
      setMarkers: (api, markers, sourceKind) => this.setSecondaryMarkers(api, markers, sourceKind),
      createPriceLineState: (options) => this.priceLineManager.createState(options),
      createPriceLine: (lines, state) => this.priceLineManager.createApi(lines, state),
      removePriceLine: (lines, line) => this.priceLineManager.remove(lines, line),
    };
  }

  private addPrimaryCandlestickSeries(): PhaseOneCandlestickSeriesApi {
    return addPrimarySeriesUseCase("candlestick", this.createPrimarySeriesFactoryDeps()) as PhaseOneCandlestickSeriesApi;
  }

  public addLineSeries(target?: PhaseOneSeriesTarget): PhaseOneLineSeriesApi {
    return addTargetedSeriesUseCase(target, {
      resolveTarget: (nextTarget, options) => this.resolveSeriesTarget(nextTarget, options),
      addPrimary: () => this.addPrimaryLineSeries(),
      addSecondary: (paneId) => this.addSecondaryLineSeries(paneId),
    });
  }

  public addAreaSeries(target?: PhaseOneSeriesTarget): PhaseOneAreaSeriesApi {
    return addTargetedSeriesUseCase(target, {
      resolveTarget: (nextTarget, options) => this.resolveSeriesTarget(nextTarget, options),
      addPrimary: () => this.addPrimaryAreaSeries(),
      addSecondary: (paneId) => this.addSecondaryAreaSeries(paneId),
    });
  }

  public addBaselineSeries(target?: PhaseOneSeriesTarget): PhaseOneBaselineSeriesApi {
    return addTargetedSeriesUseCase(target, {
      resolveTarget: (nextTarget, options) => this.resolveSeriesTarget(nextTarget, options),
      addPrimary: () => this.addPrimaryBaselineSeries(),
      addSecondary: (paneId) => this.addSecondaryBaselineSeries(paneId),
    });
  }

  public addBarSeries(target?: PhaseOneSeriesTarget): PhaseOneBarSeriesApi {
    return addTargetedSeriesUseCase(target, {
      resolveTarget: (nextTarget, options) => this.resolveSeriesTarget(nextTarget, options),
      addPrimary: () => this.addPrimaryBarSeries(),
      addSecondary: (paneId) => this.addSecondaryBarSeries(paneId),
    });
  }

  public addHistogramSeries(target?: PhaseOneSeriesTarget): PhaseOneHistogramSeriesApi {
    return addTargetedSeriesUseCase(target, {
      resolveTarget: (nextTarget, options) => this.resolveSeriesTarget(nextTarget, options),
      addPrimary: () => this.addPrimaryHistogramSeries(),
      addSecondary: (paneId) => this.addSecondaryHistogramSeries(paneId),
    });
  }

  public addVolumeSeries(target?: PhaseOneVolumeSeriesTarget): PhaseOneVolumeSeriesApi {
    return addVolumeSeriesCommandUseCase(target, {
      resolveTarget: (nextTarget, options) => this.resolveSeriesTarget(nextTarget, options),
      addSecondary: (paneId) => this.addSecondaryVolumeSeries(paneId),
    });
  }

  public addOverlaySeries(target?: PhaseOneSeriesTarget): PhaseOneOverlaySeriesApi {
    return addTargetedStudyUseCase(target, {
      resolveTarget: (nextTarget, options) => this.resolveSeriesTarget(nextTarget, options),
      addToPane: (paneId) => this.addStudyLineSeries(paneId, "overlay"),
    }, {
      defaultToSecondary: false,
      allowPrimary: true,
    });
  }

  public addCompareSeries(target?: PhaseOneSeriesTarget): PhaseOneCompareSeriesApi {
    return addTargetedStudyUseCase(target, {
      resolveTarget: (nextTarget, options) => this.resolveSeriesTarget(nextTarget, options),
      addToPane: (paneId) => this.addCompareStudySeries(paneId),
    }, {
      defaultToSecondary: false,
      allowPrimary: true,
    });
  }

  public addMovingAverageStudy(target?: PhaseOneSeriesTarget): PhaseOneMovingAverageStudyApi {
    return addTargetedStudyUseCase(target, {
      resolveTarget: (nextTarget, options) => this.resolveSeriesTarget(nextTarget, options),
      addToPane: (paneId) => this.addMovingAverageStudySeries(paneId),
    }, {
      defaultToSecondary: true,
      allowPrimary: true,
    });
  }

  public addHorizontalLineDrawing(
    target?: PhaseOneSeriesTarget,
    options: PhaseOneHorizontalLineDrawingOptions = {},
  ): PhaseOneHorizontalLineDrawingApi {
    return addHorizontalLineDrawingCommandUseCase(target, options, {
      resolveTarget: (nextTarget, resolveOptions) => this.resolveSeriesTarget(nextTarget, resolveOptions),
      createDrawing: (paneId, nextOptions) => this.createHorizontalLineDrawing(paneId, nextOptions),
    });
  }

  public addTrendLineDrawing(
    target?: PhaseOneSeriesTarget,
    options: PhaseOneTrendLineDrawingOptions = {},
  ): PhaseOneTrendLineDrawingApi {
    return addTrendLineDrawingCommandUseCase(target, options, {
      resolveTarget: (nextTarget, resolveOptions) => this.resolveSeriesTarget(nextTarget, resolveOptions),
      createDrawing: (paneId, nextOptions) => this.createTrendLineDrawing(paneId, nextOptions),
    });
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
    removeSeriesCommandUseCase(series, {
      removeSourceByApi: (currentSeries) => this.chartModel.removeSourceByApi(currentSeries),
      resetPrimaryRangeOverride: () => {
        this.primaryPriceRangeOverride = null;
      },
      resetViewportState: () => {
        this.barSpacing = null;
        this.rightOffset = DEFAULT_RIGHT_OFFSET;
      },
      clearCrosshair: () => {
        this.viewState.setCrosshair(null);
      },
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    });
  }

  public panesApi(): readonly PhaseOnePaneApi[] {
    return this.panes.list().map((pane) => this.paneOwner.createPaneHandle(pane.id));
  }

  public addPane(options: PhaseOnePaneOptions = {}): PhaseOnePaneApi {
    return addPaneCommandUseCase(options, {
      addSecondaryPane: (nextOptions) => this.panes.addSecondaryPane(nextOptions),
      emitAdded: (paneId) => this.paneOwner.emitPaneEvent("added", paneId),
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
      createPaneHandle: (paneId) => this.paneOwner.createPaneHandle(paneId),
    });
  }

  public removePaneByHandle(paneHandle: PhaseOnePaneApi): void {
    removePaneByHandleCommandUseCase(paneHandle, {
      getPaneId: (handle) => this.paneOwner.getPaneByHandle(handle).id,
      removePaneById: (paneId) => this.paneOwner.removePaneById(paneId),
    });
  }

  public applyOptions(options: PhaseOneChartOptions): void {
    applyChartOptionsUseCase(options, {
      setLayoutOption: (key, value) => {
        this.chartOptions[key] = value;
      },
      setCrosshairOption: (key, value) => {
        this.crosshairOptions[key] = value;
      },
      setDrawingOption: (key, value) => {
        this.drawingOptions[key] = value as never;
      },
      setDrawingMagnetSource: (key, value) => {
        this.drawingOptions.magnetSources[key] = value;
      },
      clearDrawingSnapGuide: () => {
        this.viewState.clearDrawingSnapGuide();
      },
      clearDrawingSnapGuideTimeOnly: () => {
        this.viewState.clearDrawingSnapGuideTimeOnly();
      },
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    });
  }

  public resize(width: number, height: number): void {
    resizeChartUseCase(width, height, {
      setManualLayout: (layout) => {
        this.viewState.setManualLayout(layout);
      },
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    });
  }

  public timeScaleApi(): PhaseOneTimeScaleApi {
    return createTimeScaleApiUseCase({
      getPointCount: () => this.getPointCount(),
      getLayout: () => (
        this.canvas === null ? DEFAULT_LAYOUT : measureLayout(this.canvas, DEFAULT_LAYOUT, this.viewState.manualLayout())
      ),
      getBarSpacing: () => this.barSpacing,
      setBarSpacing: (value) => {
        this.barSpacing = value;
      },
      getRightOffset: () => this.rightOffset,
      setRightOffset: (value) => {
        this.rightOffset = value;
      },
      resolveBarSpacing: (currentSpacing, paneWidth, pointCount) =>
        resolveBarSpacing(currentSpacing, paneWidth, pointCount, BAR_SPACING_BOUNDS),
      clampBarSpacing: (value) => clamp(value, MIN_BAR_SPACING, MAX_BAR_SPACING),
      applyTimeScaleOptions: (options) => this.timeScale.applyOptions(options),
      setTimeAxisFormatter: (formatter) => {
        this.timeAxisFormatter = formatter;
      },
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    });
  }

  public priceScaleApi(): PhaseOnePriceScaleApi {
    return createPriceScaleApiUseCase({
      getVisibleRange: () =>
        this.primaryPriceRangeOverride?.toRaw() ??
        this.primaryPriceScale.getPriceRange()?.toRaw() ??
        this.chartModel.secondaryScales()[0]?.getPriceRange()?.toRaw() ??
        null,
      setVisibleRange: (range) => {
        this.primaryPriceRangeOverride = PriceRangeImpl.fromRaw(range);
      },
      applyVisibleRangeIfPresent: () => {
        if (this.primaryPriceRangeOverride === null || this.canvas === null) {
          return;
        }
        const layout = measureLayout(this.canvas, DEFAULT_LAYOUT, this.viewState.manualLayout());
        const plotHeight = Math.max(0, layout.height - layout.top - layout.bottom);
        const paneHeight =
          buildPaneFrames(this.panes.list(), plotHeight, PANE_GAP).find((pane) => pane.kind === "primary")
            ?.height ?? plotHeight;
        this.primaryPriceScale.applyOptions({
          height: paneHeight,
          priceRange: this.primaryPriceRangeOverride,
        });
      },
      setPriceFormatter: (formatter) => {
        this.priceAxisFormatter = formatter;
      },
      setScaleSeriesOnly: (value) => {
        this.primaryScaleSeriesOnly = value;
      },
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    });
  }

  public subscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void {
    this.handlerRegistry.subscribeCrosshairMove(handler);
  }

  public unsubscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void {
    this.handlerRegistry.unsubscribeCrosshairMove(handler);
  }

  public subscribeClick(handler: PhaseOneClickHandler): void {
    this.handlerRegistry.subscribeClick(handler);
  }

  public unsubscribeClick(handler: PhaseOneClickHandler): void {
    this.handlerRegistry.unsubscribeClick(handler);
  }

  public getSelectedDrawing(): PhaseOneSelectedDrawing {
    return this.drawingOwner.getSelectedDrawing();
  }

  public getSelectedDrawingState(): PhaseOneDrawingStateSnapshot | null {
    return this.drawingOwner.getSelectedDrawingState();
  }

  public getSelectedDrawingPropertySchema(): PhaseOneDrawingPropertySchema | null {
    return this.drawingOwner.getSelectedDrawingPropertySchema();
  }

  public applySelectedDrawingOptions(
    options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions,
  ): void {
    this.drawingOwner.applySelectedDrawingOptions(options);
  }

  public clearSelectedDrawing(): void {
    this.drawingOwner.clearSelectedDrawing();
  }

  public subscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void {
    this.handlerRegistry.subscribeDrawingSelectionChange(handler);
  }

  public unsubscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void {
    this.handlerRegistry.unsubscribeDrawingSelectionChange(handler);
  }

  public subscribePaneEvents(handler: PhaseOnePaneEventHandler): void {
    this.handlerRegistry.subscribePaneEvents(handler);
  }

  public unsubscribePaneEvents(handler: PhaseOnePaneEventHandler): void {
    this.handlerRegistry.unsubscribePaneEvents(handler);
  }

  public subscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void {
    this.handlerRegistry.subscribeChartTypeChange(handler);
  }

  public unsubscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void {
    this.handlerRegistry.unsubscribeChartTypeChange(handler);
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
        this.renderInvalidation.renderIfAttached();
      },
    });
  }

  public getChartState(): PhaseOneChartStateSnapshot {
    return this.stateCoordinator.getChartState();
  }

  public applyChartState(state: PhaseOneChartStateSnapshot): void {
    this.stateCoordinator.applyChartState(state);
  }

  public getChartTemplate(): PhaseOneChartTemplate {
    return this.stateCoordinator.getChartTemplate();
  }

  public applyChartTemplate(template: PhaseOneChartTemplateInput): void {
    this.stateCoordinator.applyChartTemplate(template);
  }

  public locateTrade(
    request: PhaseOneTradeLocationRequest,
    options: PhaseOneTradeOverlayOptions = {},
  ): PhaseOneTradeLocationState | null {
    return locateTradeRuntime(request, options, {
      ensureMainSource: () => {
        this.getMainSourceOrThrow();
      },
      setActiveTradeLocation: (next) => {
        this.activeTradeLocation = next;
      },
      refreshTradeLocation: () => {
        this.refreshTradeLocation();
      },
      getTradeLocationState: () => this.activeTradeLocation?.state ?? null,
    });
  }

  public clearTradeLocation(): void {
    clearTradeLocationRuntime({
      clearActiveTradeLocation: () => {
        this.activeTradeLocation = null;
      },
      resetPrimaryPriceRangeOverride: () => {
        this.primaryPriceRangeOverride = null;
      },
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    });
  }

  public getTradeLocationState(): PhaseOneTradeLocationState | null {
    return getTradeLocationStateUseCase(this.activeTradeLocation);
  }

  public setChartType(type: PhaseOneMainChartType): PhaseOneMainSeriesApi {
    return this.sourceOwner.setChartType(type) as PhaseOneMainSeriesApi;
  }

  public setData(data: readonly PhaseOneCandlestickData[]): void {
    this.setPrimaryData(data);
  }

  public update(bar: PhaseOneCandlestickData): void {
    this.updatePrimary(bar);
  }

  private setPrimaryData(data: readonly PhaseOneCandlestickData[]): void {
    this.sourceOwner.setPrimaryData(data);
  }

  private updatePrimary(bar: PhaseOneCandlestickData): void {
    this.sourceOwner.updatePrimaryData(bar);
  }

  private setPrimaryHistogramLikeData(
    data: readonly PhaseOneHistogramData[],
  ): void {
    this.sourceOwner.setPrimaryHistogramLikeData(data);
  }

  private updatePrimaryHistogramLike(bar: PhaseOneHistogramData): void {
    this.sourceOwner.updatePrimaryHistogramLikeData(bar);
  }

  private getPointCount(): number {
    let pointCount = this.renderCoordinator.buildMainBarSequence(this.getMainSource()).logicalLength;
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
    applySeriesFormatterOptionsUseCase(seriesOptions, options);
  }

  private addPrimaryLineSeries(): PhaseOneLineSeriesApi {
    return addPrimarySeriesUseCase("line", this.createPrimarySeriesFactoryDeps()) as PhaseOneLineSeriesApi;
  }

  private addPrimaryAreaSeries(): PhaseOneAreaSeriesApi {
    return addPrimarySeriesUseCase("area", this.createPrimarySeriesFactoryDeps()) as PhaseOneAreaSeriesApi;
  }

  private addPrimaryBaselineSeries(): PhaseOneBaselineSeriesApi {
    return addPrimarySeriesUseCase("baseline", this.createPrimarySeriesFactoryDeps()) as PhaseOneBaselineSeriesApi;
  }

  private addPrimaryBarSeries(): PhaseOneBarSeriesApi {
    return addPrimarySeriesUseCase("bar", this.createPrimarySeriesFactoryDeps()) as PhaseOneBarSeriesApi;
  }

  private addPrimaryHistogramSeries(): PhaseOneHistogramSeriesApi {
    return addPrimarySeriesUseCase("histogram", this.createPrimarySeriesFactoryDeps()) as PhaseOneHistogramSeriesApi;
  }

  private addSecondaryCandlestickSeries(target: string): PhaseOneCandlestickSeriesApi {
    return addSecondarySeriesUseCase(
      {
        paneId: target,
        kind: "candlestick",
        createApi: (deps) => createSecondaryCandlestickSeriesApi(deps),
      },
      this.createSecondarySeriesFactoryDeps(),
    ) as PhaseOneCandlestickSeriesApi;
  }

  private addSecondaryLineSeries(paneId: string): PhaseOneLineSeriesApi {
    return this.addStudyLineSeries(paneId, "series");
  }

  private addStudyLineSeries(
    paneId: string,
    studyKind: StudySourceKind,
  ): PhaseOneLineSeriesApi {
    return addSecondarySeriesUseCase(
      {
        paneId,
        kind: "line",
        studyKind,
        createApi: (deps) => createSecondaryLineSeriesApi(deps),
      },
      this.createSecondarySeriesFactoryDeps(),
    ) as PhaseOneLineSeriesApi;
  }

  private addCompareStudySeries(paneId: string): PhaseOneCompareSeriesApi {
    return addSecondarySeriesUseCase(
      {
        paneId,
        kind: "line",
        studyKind: "compare",
        createApi: (deps) => createCompareStudySeriesApi(deps),
      },
      this.createSecondarySeriesFactoryDeps(),
    ) as PhaseOneCompareSeriesApi;
  }

  private addMovingAverageStudySeries(paneId: string): PhaseOneMovingAverageStudyApi {
    return addSecondarySeriesUseCase(
      {
        paneId,
        kind: "line",
        studyKind: "indicator",
        indicator: {
          kind: "moving-average",
          length: this.defaultMovingAverageOptions.length,
        },
        createApi: (deps) => createMovingAverageStudySeriesApi(deps),
      },
      this.createSecondarySeriesFactoryDeps(),
    ) as PhaseOneMovingAverageStudyApi;
  }

  private addSecondaryAreaSeries(paneId: string): PhaseOneAreaSeriesApi {
    return addSecondarySeriesUseCase(
      {
        paneId,
        kind: "area",
        createApi: (deps) => createSecondaryAreaSeriesApi(deps),
      },
      this.createSecondarySeriesFactoryDeps(),
    ) as PhaseOneAreaSeriesApi;
  }

  private addSecondaryBaselineSeries(paneId: string): PhaseOneBaselineSeriesApi {
    return addSecondarySeriesUseCase(
      {
        paneId,
        kind: "baseline",
        createApi: (deps) => createSecondaryBaselineSeriesApi(deps),
      },
      this.createSecondarySeriesFactoryDeps(),
    ) as PhaseOneBaselineSeriesApi;
  }

  private addSecondaryBarSeries(paneId: string): PhaseOneBarSeriesApi {
    return addSecondarySeriesUseCase(
      {
        paneId,
        kind: "bar",
        createApi: (deps) => createSecondaryBarSeriesApi(deps),
      },
      this.createSecondarySeriesFactoryDeps(),
    ) as PhaseOneBarSeriesApi;
  }

  private addSecondaryHistogramSeries(paneId: string): PhaseOneHistogramSeriesApi {
    return addSecondarySeriesUseCase(
      {
        paneId,
        kind: "histogram",
        createApi: (deps) => createSecondaryHistogramSeriesApi(deps),
      },
      this.createSecondarySeriesFactoryDeps(),
    ) as PhaseOneHistogramSeriesApi;
  }

  private addSecondaryVolumeSeries(paneId: string): PhaseOneVolumeSeriesApi {
    return addSecondarySeriesUseCase(
      {
        paneId,
        kind: "volume",
        createApi: (deps) => createSecondaryVolumeSeriesApi(deps),
      },
      this.createSecondarySeriesFactoryDeps(),
    ) as PhaseOneVolumeSeriesApi;
  }

  private attachStudySeries(
    paneId: string,
    kind: ChartSeriesKind,
    api: SeriesSourceState["api"],
    meta: { id: string; label: string },
    studyKind: StudySourceKind = "series",
    indicator?: MovingAverageIndicatorState,
  ): void {
    this.sourceOwner.attachStudySeries({ paneId, kind, api, meta, studyKind, indicator });
  }

  private createSecondarySeriesApiDeps<T>(
    build: (deps: SecondarySeriesApiDepsBuilder) => T,
  ): T {
    return this.sourceOwner.createSecondarySeriesApiDeps(build);
  }

  private createSecondarySeriesFactoryDeps() {
    return this.sourceOwner.createSecondarySeriesFactoryDeps();
  }

  private setSecondaryData(
    api: SeriesSourceState["api"],
    data: readonly PhaseOneCandlestickData[],
    kind: ChartSeriesKind,
  ): void {
    this.sourceOwner.setSecondaryData(api, data, kind);
  }

  private updateSecondary(
    api: SeriesSourceState["api"],
    bar: PhaseOneCandlestickData,
    kind: ChartSeriesKind,
  ): void {
    this.sourceOwner.updateSecondaryData(api, bar, kind);
  }

  private setSecondaryHistogramLikeData(
    api: SeriesSourceState["api"],
    data: readonly PhaseOneHistogramData[] | readonly PhaseOneVolumeData[],
    kind: ChartSeriesKind,
  ): void {
    this.sourceOwner.setSecondaryHistogramLikeData(api, data, kind as "histogram" | "volume");
  }

  private updateSecondaryHistogramLike(
    api: SeriesSourceState["api"],
    bar: PhaseOneHistogramData | PhaseOneVolumeData,
    kind: ChartSeriesKind,
  ): void {
    this.sourceOwner.updateSecondaryHistogramLikeData(api, bar, kind as "histogram" | "volume");
  }

  private setSecondaryMarkers(
    api: SeriesSourceState["api"],
    markers: readonly PhaseOneSeriesMarker[],
    kind: ChartSeriesKind,
  ): void {
    const state = this.getSourceByApi(api, kind);
    setSeriesMarkersUseCase(state, markers, {
      normalizeMarkers: (nextMarkers) => normalizeMarkers(nextMarkers as readonly PhaseOneSeriesMarker[]),
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    });
  }

  private createPaneHandle(paneId: string): PhaseOnePaneApi {
    return this.paneOwner.createPaneHandle(paneId);
  }

  private getPaneIndex(paneId: string): number {
    const index = this.panes.getIndex(paneId);
    if (index === -1) {
      throw new Error("chartx phase-one pane has been removed");
    }
    return index;
  }

  private applyPaneResize(clientY: number, layout: Layout, paneFrames: readonly PaneFrame[]): void {
    void paneFrames;
    this.paneOwner.applyPaneResize(clientY, layout, this.viewState.paneResizeState());
  }

  private resolveSeriesTarget(
    target: PhaseOneSeriesTarget | PhaseOneVolumeSeriesTarget | undefined,
    options: { defaultToSecondary: boolean; allowPrimary: boolean },
  ): ResolvedSeriesTarget {
    return this.paneOwner.resolveSeriesTarget(target, options) as ResolvedSeriesTarget;
  }

  private removePaneById(paneId: string): void {
    this.paneOwner.removePaneById(paneId);
  }

  private emitPaneEvent(
    type: PhaseOnePaneEventType,
    paneId: string,
    explicitPaneState?: PhaseOnePaneState | null,
    explicitSnapshot?: readonly PhaseOnePaneState[],
  ): void {
    this.paneOwner.emitPaneEvent(type, paneId, explicitPaneState, explicitSnapshot);
  }

  private createSeriesMeta(kind: string): { id: string; label: string } {
    const ordinal = this.nextSeriesId;
    this.nextSeriesId += 1;
    return createSeriesMetaUseCase(kind, ordinal, {
      formatSeriesKindLabel,
    });
  }

  private createSeriesLabel(kind: string, id: string): string {
    return createSeriesLabelUseCase(kind, id, {
      formatSeriesKindLabel,
    });
  }

  private createHorizontalLineDrawing(
    paneId: string,
    options: PhaseOneHorizontalLineDrawingOptions = {},
  ): PhaseOneHorizontalLineDrawingApi {
    return this.drawingOwner.addHorizontalLine({ pane: this.createPaneHandle(paneId) }, options);
  }

  private createTrendLineDrawing(
    paneId: string,
    options: PhaseOneTrendLineDrawingOptions = {},
  ): PhaseOneTrendLineDrawingApi {
    return this.drawingOwner.addTrendLine({ pane: this.createPaneHandle(paneId) }, options);
  }

  private resolveTrendLineDefaults(): Required<Pick<
    PhaseOneTrendLineDrawingOptions,
    "startTime" | "startPrice" | "endTime" | "endPrice"
  >> {
    return resolveTrendLineDefaultsUseCase(this.chartModel.context().snapshot().barSequence.axisBars);
  }

  private getDrawingById(id: string): ChartDrawingDescriptor | undefined {
    return this.drawingOwner.getDrawingById(id);
  }

  private getDrawingsByPane(paneId: string): readonly ChartDrawingDescriptor[] {
    return this.drawingOwner.listDrawingsByPane(paneId);
  }

  private getDrawingCountForPane(paneId: string): number {
    return this.drawingOwner.countDrawingsByPane(paneId);
  }

  private selectDrawing(id: string | null, shouldRender = true): void {
    this.drawingOwner.selectDrawing(id, shouldRender);
  }

  private removeDrawing(api: ChartDrawingApi): void {
    this.drawingOwner.removeDrawing(api);
  }

  private removeSelectedDrawing(): void {
    this.drawingOwner.removeSelectedDrawing();
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
    return createSeriesOptionsUseCase(kind, {
      candlestickOptions: this.candlestickOptions,
      barOptions: this.barOptions,
      lineOptions: this.lineOptions,
      areaOptions: this.areaOptions,
      baselineOptions: this.baselineOptions,
      histogramOptions: this.histogramOptions,
      volumeOptions: this.volumeOptions,
    });
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
    return createMainSeriesOptionsUseCase(styleSchemaId, {
      candlestickOptions: this.candlestickOptions,
      barOptions: this.barOptions,
      lineOptions: this.lineOptions,
      areaOptions: this.areaOptions,
      baselineOptions: this.baselineOptions,
      histogramOptions: this.histogramOptions,
    }, {
      optionSurface: (nextStyleSchemaId) => mainSeriesStyleSchemaSpec(nextStyleSchemaId).optionSurface,
    });
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
    return createMainSourceStateUseCase({
      paneId,
      chartType,
      kind,
      api,
      meta,
      priceScale,
      priceScaleId,
    }, {
      candlestickOptions: this.candlestickOptions,
      lineOptions: this.lineOptions,
    }, {
      createMainSeriesOptions: (nextStyleSchemaId) => this.createMainSeriesOptions(nextStyleSchemaId),
    });
  }

  private syncChartContextFromMainSource(source: MainSeriesSourceState | null): void {
    syncChartContextFromMainSourceUseCase(source, {
      clearMainSource: () => this.chartModel.clearMainSource(),
      bindMainSource: (mainSourceId, chartType, barSequence) =>
        this.chartModel.bindMainSource(mainSourceId, chartType, barSequence),
      createMainBarSequenceFromSource: (nextSource: MainSeriesSourceState) =>
        this.createMainBarSequenceFromSource(nextSource),
      syncStudyContextData: () => this.syncStudyContextData(),
      refreshTradeLocation: () => this.refreshTradeLocation(),
    });
  }

  private createMainBarSequenceFromSource(source: MainSeriesSourceState): ChartBarSequence<number> {
    return createMainBarSequenceFromSourceUseCase(source);
  }

  private getMainSource(): MainSeriesSourceState | null {
    return this.sourceOwner.getMainSource() as MainSeriesSourceState | null;
  }

  private refreshTradeLocation(): void {
    this.sourceOwner.refreshTradeLocation();
  }

  private getMainSourceOrThrow(): MainSeriesSourceState {
    return this.sourceOwner.getMainSourceOrThrow() as MainSeriesSourceState;
  }

  private getStudySourcesForPane(paneId: string): StudySourceState[] {
    return this.sourceOwner.getStudySourcesForPane(paneId) as StudySourceState[];
  }

  private getSecondarySeriesForPane(paneId: string): StudySourceState[] {
    return this.sourceOwner.getSecondarySeriesForPane(paneId) as StudySourceState[];
  }

  private getSourceByApi(
    api: ChartSeriesApi,
    kind?: ChartSeriesKind,
  ): SeriesSourceState {
    return this.sourceOwner.getSourceByApi(api, kind) as SeriesSourceState;
  }

  private getCompareStudyState(api: PhaseOneCompareSeriesApi): StudySourceState {
    return getCompareStudyStateRuntime(api, {
      getSourceByApi: (nextApi, kind) => this.getSourceByApi(nextApi as ChartSeriesApi, kind) as StudySourceState,
    });
  }

  private getMovingAverageStudyState(api: PhaseOneMovingAverageStudyApi): StudySourceState {
    return getMovingAverageStudyStateRuntime(api, {
      getSourceByApi: (nextApi, kind) => this.getSourceByApi(nextApi as ChartSeriesApi, kind) as StudySourceState,
    });
  }

  private getOrCreateSecondaryPanePriceScale(paneId: string): PriceScale {
    return getOrCreateSecondaryPanePriceScaleRuntime(paneId, {
      getOrCreateSecondaryScale: (nextPaneId) => this.chartModel.getOrCreateSecondaryScale(nextPaneId),
    });
  }

  private buildPrimaryPaneSeries(
    mainSource: MainSeriesSourceState | null,
  ): readonly SeriesSourceState[] {
    return this.sourceOwner.buildPrimaryPaneSeries(mainSource) as readonly SeriesSourceState[];
  }

  private resolveHitDrawing(
    point: PanePoint,
    layout: Layout,
    paneFrames: readonly PaneFrame[] = buildPaneFrames(
      this.panes.list(),
      layout.height - layout.top - layout.bottom,
      PANE_GAP,
    ),
  ): ChartDrawingDescriptor | null {
    return resolveHitDrawingUseCase({
      point,
      paneFrames,
      primaryPriceScale: this.primaryPriceScale,
      getSecondaryPriceScale: (paneId) => this.chartModel.getSecondaryScale(paneId),
      axisBars: this.chartModel.context().snapshot().barSequence.axisBars,
      timeScale: this.timeScale,
      drawingsForPane: (paneId) => this.getDrawingsByPane(paneId),
      hitTolerance: DRAWING_HIT_TOLERANCE,
    });
  }

  private resolveSelectedTrendLineDragHandle(
    point: PanePoint,
    layout: Layout,
    paneFrames: readonly PaneFrame[] = buildPaneFrames(
      this.panes.list(),
      layout.height - layout.top - layout.bottom,
      PANE_GAP,
    ),
  ): DrawingDragState | null {
    return resolveSelectedTrendLineDragUseCase({
      point,
      paneFrames,
      selectedDrawingId: this.viewState.selectedDrawingId(),
      getById: (id) => {
        const drawing = this.getDrawingById(id);
        return drawing?.kind === "trend-line" ? drawing : undefined;
      },
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
    paneFrames: readonly PaneFrame[] = buildPaneFrames(
      this.panes.list(),
      layout.height - layout.top - layout.bottom,
      PANE_GAP,
    ),
  ): void {
    const drawing = this.getDrawingById(drag.drawingId);
    const drawingOptions =
      drawing === undefined ? this.drawingOptions : resolveDrawingMagnetOptionsUseCase(drawing, this.drawingOptions);
    applyActiveTrendLineDragUseCase({
      drag,
      point,
      paneFrames,
      getById: (id) => {
        const nextDrawing = this.getDrawingById(id);
        return nextDrawing?.kind === "trend-line" ? nextDrawing : undefined;
      },
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
      clearDrawingSnapGuide: () => this.viewState.clearDrawingSnapGuide(),
      setDrawingSnapGuide: (guide) => this.viewState.setDrawingSnapGuide(guide),
    });
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

  public render(canvas: HTMLCanvasElement): void {
    this.renderCoordinator.render(canvas);
  }

  private assertSeriesActive(series: ChartSeriesApi): void {
    if (!this.chartModel.hasSourceApi(series)) {
      throw new Error("chartx phase-one series has been removed");
    }
  }

  private emitCrosshairMove(readout: PhaseOneReadoutDetail): void {
    this.handlerRegistry.emitCrosshairMove(readout, this.viewState.crosshair());
  }

  private emitChartTypeChange(type: PhaseOneMainChartType): void {
    this.handlerRegistry.emitChartTypeChange(type);
  }
}

export function createPhaseOneChart(canvas: HTMLCanvasElement): PhaseOneChartApi {
  assertCanvasElement(canvas);

  const harness = new PhaseOneChartHarness();
  harness.attach(canvas);

  return createChartPublicApiUseCase(harness);
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

function toCoordinate(value: Coordinate | null): Coordinate {
  return (value ?? 0) as Coordinate;
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

function emitReadout(canvas: HTMLCanvasElement, detail: PhaseOneReadoutDetail): void {
  canvas.dispatchEvent(
    new CustomEvent<PhaseOneReadoutDetail>("chartx:readout", {
      detail,
    }),
  );
}

function assertCanvasElement(value: unknown): asserts value is HTMLCanvasElement {
  if (!(value instanceof HTMLCanvasElement)) {
    throw new Error("chartx phase-one chart requires an HTMLCanvasElement");
  }
}
