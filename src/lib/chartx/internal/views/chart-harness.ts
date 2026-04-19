import {
  createCompressedPriceBasedChartBarSequence,
  createDirectionColumnPriceBasedChartBarSequence,
  createTimeBasedChartBarSequence,
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
import { applyValidatedChartState, createChartStateSnapshot } from "./chart-state";
import { setChartType as setChartTypeUseCase } from "./chart-main-series-switch";
import {
  buildDrawingStateSnapshots,
  buildSeriesStateSnapshots,
  buildStudyStateSnapshots,
} from "./chart-state-snapshot-builders";
import { buildRawReadout as buildRawReadoutUseCase } from "./chart-readout";
import {
  formatReadoutDetail as formatReadoutDetailUseCase,
  formatSeriesReadoutValue as formatSeriesReadoutValueForStateUseCase,
} from "./chart-readout-format";
import {
  formatPriceAxisLabel,
  formatTimeAxisLabel,
  formatVolumeAxisLabel,
} from "./chart-axis-format";
import {
  type AxisTag,
  buildMagnetAxisTag,
  buildMagnetTimeAxisTag,
  drawAxisTag,
  drawPriceAxis,
  drawTimeAxis,
} from "./chart-axis-tags";
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
  drawPriceLines,
  drawSeriesMarkers,
  drawTradeLocationOverlay,
} from "./chart-pane-decoration-render";
import {
  drawDrawingSnapGuide,
  drawPaneDrawings,
} from "./chart-pane-drawing-render";
import {
  distanceToLineSegment,
  resolveDrawingTimeCoordinate,
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
  createDrawingMeta as createDrawingMetaUseCase,
  resolveTrendLineDefaults as resolveTrendLineDefaultsUseCase,
} from "./chart-drawing-state";
import {
  addHorizontalLineDrawingCommand as addHorizontalLineDrawingCommandUseCase,
  addTargetedSeries as addTargetedSeriesUseCase,
  addTargetedStudy as addTargetedStudyUseCase,
  addTrendLineDrawingCommand as addTrendLineDrawingCommandUseCase,
  addVolumeSeriesCommand as addVolumeSeriesCommandUseCase,
  resolveSeriesTarget as resolveSeriesTargetUseCase,
} from "./chart-add-commands";
import {
  addPaneCommand as addPaneCommandUseCase,
  createPaneHandle as createPaneHandleUseCase,
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
} from "./chart-public-state";
import {
  applySelectedDrawingOptions as applySelectedDrawingOptionsPublicUseCase,
  clearSelectedDrawing as clearSelectedDrawingPublicUseCase,
  getSelectedDrawing as getSelectedDrawingPublicUseCase,
  getSelectedDrawingPropertySchema as getSelectedDrawingPropertySchemaPublicUseCase,
  getSelectedDrawingState as getSelectedDrawingStatePublicUseCase,
} from "./chart-drawing-public";
import {
  buildPaneSeriesStates as buildPaneSeriesStatesUseCase,
  buildPaneState as buildPaneStateUseCase,
  buildPaneStateSnapshot as buildPaneStateSnapshotUseCase,
} from "./chart-pane-state";
import {
  buildPaneStateById as buildPaneStateByIdUseCase,
  buildPaneStateSnapshotByIds as buildPaneStateSnapshotByIdsUseCase,
  getPaneSeriesStates as getPaneSeriesStatesUseCase,
  removePane as removePaneUseCase,
} from "./chart-pane-management";
import {
  applyPaneOptions as applyPaneOptionsUseCase,
  applyPaneResize as applyPaneResizeUseCase,
  getPaneByHandle as getPaneByHandleUseCase,
  getPaneHeight as getPaneHeightUseCase,
  getPaneOptions as getPaneOptionsUseCase,
  paneHasSeries as paneHasSeriesUseCase,
  setPaneHeight as setPaneHeightUseCase,
} from "./chart-pane-runtime";
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
  refreshTradeLocation as refreshTradeLocationUseCase,
  syncChartContextFromMainSource as syncChartContextFromMainSourceUseCase,
} from "./chart-main-source-runtime";
import {
  buildPrimaryPaneSeries as buildPrimaryPaneSeriesUseCase,
  getCompareStudyState as getCompareStudyStateUseCase,
  getMovingAverageStudyState as getMovingAverageStudyStateUseCase,
  getOrCreateSecondaryPanePriceScale as getOrCreateSecondaryPanePriceScaleUseCase,
  getSecondarySeriesForPane as getSecondarySeriesForPaneUseCase,
  getSourceByApi as getSourceByApiUseCase,
  getStudySourcesForPane as getStudySourcesForPaneUseCase,
} from "./chart-source-accessors";
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
  clearTradeLocationCommand as clearTradeLocationCommandUseCase,
  locateTradeCommand as locateTradeCommandUseCase,
} from "./chart-runtime-commands";
import {
  emitClickRuntime as emitClickRuntimeUseCase,
} from "./chart-event-runtime";
import {
  attachChartCanvas as attachChartCanvasUseCase,
  detachChartCanvas as detachChartCanvasUseCase,
} from "./chart-canvas-lifecycle";
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
  removeActiveDrawing as removeActiveDrawingUseCase,
  removeSelectedActiveDrawing as removeSelectedActiveDrawingUseCase,
  resolveSelectedTrendLineDrag as resolveSelectedTrendLineDragUseCase,
  selectActiveDrawing as selectActiveDrawingUseCase,
} from "./chart-drawing-runtime";
import {
  createHorizontalLineDrawingForPane as createHorizontalLineDrawingForPaneUseCase,
  createTrendLineDrawingForPane as createTrendLineDrawingForPaneUseCase,
} from "./chart-drawing-creation";
import {
  clearDrawingRegistry as clearDrawingRegistryUseCase,
  getDrawingById as getDrawingByIdUseCase,
  getDrawingCountForPane as getDrawingCountForPaneUseCase,
  listDrawingsByPane as listDrawingsByPaneUseCase,
} from "./chart-drawing-accessors";
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
  private readonly priceLineManager = createPriceLineManager({
    defaultOptions: this.defaultPriceLineOptions,
    render: () => {
      if (this.canvas !== null) {
        this.render(this.canvas);
      }
    },
  });
  private readonly viewState = createChartViewState<PanePoint, ResizeObserver>();
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
    buildReadout: (point, layout) => this.buildReadout(point, layout),
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

  public attach(canvas: HTMLCanvasElement): void {
    assertCanvasElement(canvas);
    attachChartCanvasUseCase(canvas, {
      getManualLayout: () => this.viewState.manualLayout(),
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
    });
  }

  public detach(): void {
    detachChartCanvasUseCase({
      canvas: this.canvas,
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
      resetCanvasRef: () => {
        this.canvas = null;
      },
      clearInteractionState: () => {
        this.viewState.clearInteractionState();
      },
      clearSubscriptions: () => {
        this.handlerRegistry.clearAll();
      },
    });
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
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  public panesApi(): readonly PhaseOnePaneApi[] {
    return this.panes.list().map((pane) => this.createPaneHandle(pane.id));
  }

  public addPane(options: PhaseOnePaneOptions = {}): PhaseOnePaneApi {
    return addPaneCommandUseCase(options, {
      addSecondaryPane: (nextOptions) => this.panes.addSecondaryPane(nextOptions),
      emitAdded: (paneId) => this.emitPaneEvent("added", paneId),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      createPaneHandle: (paneId) => this.createPaneHandle(paneId),
    });
  }

  public removePaneByHandle(paneHandle: PhaseOnePaneApi): void {
    removePaneByHandleCommandUseCase(paneHandle, {
      getPaneId: (handle) => this.paneHandleIds.get(handle),
      removePaneById: (paneId) => this.removePaneById(paneId),
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
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  public resize(width: number, height: number): void {
    resizeChartUseCase(width, height, {
      setManualLayout: (layout) => {
        this.viewState.setManualLayout(layout);
      },
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
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
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
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
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
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
    return getSelectedDrawingPublicUseCase(this.viewState.selectedDrawingId(), {
      getById: (id) => this.getDrawingById(id),
      getPaneIndex: (paneId) => this.getPaneIndex(paneId),
    });
  }

  public getSelectedDrawingState(): PhaseOneDrawingStateSnapshot | null {
    return getSelectedDrawingStatePublicUseCase({
      selectedDrawingId: this.viewState.selectedDrawingId(),
      getDrawingById: (id) => this.getDrawingById(id),
      snapshotDeps: {
        getPaneIndex: (paneId) => this.getPaneIndex(paneId),
        resolveMagnetOptions: (entry) =>
          resolveDrawingMagnetOptionsUseCase(entry as ChartDrawingDescriptor, this.drawingOptions),
      },
    });
  }

  public getSelectedDrawingPropertySchema(): PhaseOneDrawingPropertySchema | null {
    return getSelectedDrawingPropertySchemaPublicUseCase(
      this.getSelectedDrawingState(),
      (type) => DRAWING_PROPERTY_SCHEMAS[type],
    );
  }

  public applySelectedDrawingOptions(
    options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions,
  ): void {
    applySelectedDrawingOptionsPublicUseCase({
      selectedDrawingId: this.viewState.selectedDrawingId(),
      getDrawingById: (id) => this.getDrawingById(id),
      options,
    });
  }

  public clearSelectedDrawing(): void {
    clearSelectedDrawingPublicUseCase(() => this.selectDrawing(null));
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
    return locateTradeCommandUseCase(request, options, {
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
    clearTradeLocationCommandUseCase({
      clearActiveTradeLocation: () => {
        this.activeTradeLocation = null;
      },
      resetPrimaryPriceRangeOverride: () => {
        this.primaryPriceRangeOverride = null;
      },
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
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
    clearDrawingRegistryUseCase({
      listDrawings: () => this.drawingRegistry.list(),
      removeByApi: (api) => this.drawingRegistry.removeByApi(api),
    });
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
    return setChartTypeUseCase(this.getMainSourceOrThrow(), type, {
      currentType: (source) => source.chartType,
      currentApi: (source) => source.api as PhaseOneMainSeriesApi,
      removeCurrent: (api) => this.chartModel.removeSourceByApi(api) !== undefined,
      clearPriceRangeOverride: () => {
        this.primaryPriceRangeOverride = null;
      },
      buildPreservedState: (source) => ({
        id: source.id,
        label: source.label,
        data: [...source.inputData],
        visuals: new Map(source.visuals),
        markers: [...source.markers],
        priceLines: clonePriceLines(source.priceLines),
        options: { ...(source.options as Record<string, unknown>) },
        previousStyleSchemaId: source.styleSchemaId,
      }),
      attachSeries: (chartType, preservedState) =>
        this.attachPrimarySeries(chartType, preservedState) as PhaseOneMainSeriesApi,
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      emitChartTypeChange: (chartType) => {
        this.emitChartTypeChange(chartType);
      },
    });
  }

  public setData(data: readonly PhaseOneCandlestickData[]): void {
    this.setPrimaryData(data);
  }

  public update(bar: PhaseOneCandlestickData): void {
    this.updatePrimary(bar);
  }

  private setPrimaryData(data: readonly PhaseOneCandlestickData[]): void {
    setPrimaryDataUseCase(this.getMainSourceOrThrow(), data, {
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
    updatePrimaryDataUseCase(this.getMainSourceOrThrow(), bar, {
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
    setPrimaryHistogramLikeDataUseCase(this.getMainSourceOrThrow(), data, {
      buildVisuals: (rows) => buildHistogramVisuals(rows),
      normalizeData: (rows) => normalizeHistogramData(rows),
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

  private updatePrimaryHistogramLike(bar: PhaseOneHistogramData): void {
    updatePrimaryHistogramLikeDataUseCase(this.getMainSourceOrThrow(), bar, {
      normalizeBar: (nextBar) => normalizeHistogramBar(nextBar),
      updateCanonical: (existing, nextValue) => updateCanonicalData(existing, nextValue),
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
    attachStudySeriesUseCase(
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

  private createSecondarySeriesApiDeps<T>(
    build: (deps: SecondarySeriesApiDepsBuilder) => T,
  ): T {
    return createSecondarySeriesApiDepsUseCase(build, {
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
        const priceLine = this.priceLineManager.createState(options);
        return this.priceLineManager.createApi(state.priceLines, priceLine);
      },
      removePriceLine: (api, kind, line) => {
        const state = this.getSourceByApi(api as ChartSeriesApi, kind);
        this.priceLineManager.remove(state.priceLines, line);
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

  private createSecondarySeriesFactoryDeps() {
    return {
      createMeta: (kind: "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume") =>
        this.createSeriesMeta(kind),
      createApiDeps: <T>(build: (deps: SecondarySeriesApiDepsBuilder) => T) =>
        this.createSecondarySeriesApiDeps(build),
      attachStudySeries: (params: {
        paneId: string;
        kind: "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume";
        api: unknown;
        meta: { id: string; label: string };
        studyKind?: StudySourceKind;
        indicator?: MovingAverageIndicatorState;
      }) =>
        this.attachStudySeries(
          params.paneId,
          params.kind,
          params.api as SeriesSourceState["api"],
          params.meta,
          params.studyKind,
          params.indicator,
        ),
    };
  }

  private setSecondaryData(
    api: SeriesSourceState["api"],
    data: readonly PhaseOneCandlestickData[],
    kind: ChartSeriesKind,
  ): void {
    setSecondaryDataUseCase(this.getSourceByApi(api, kind), data, {
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
    updateSecondaryDataUseCase(this.getSourceByApi(api, kind), bar, {
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
    setSecondaryHistogramLikeDataUseCase(this.getSourceByApi(api, kind), data, {
      buildVisuals: (rows) => buildHistogramVisuals(rows),
      normalizeData: (rows) => normalizeHistogramData(rows),
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

  private updateSecondaryHistogramLike(
    api: SeriesSourceState["api"],
    bar: PhaseOneHistogramData | PhaseOneVolumeData,
    kind: ChartSeriesKind,
  ): void {
    updateSecondaryHistogramLikeDataUseCase(this.getSourceByApi(api, kind), bar, {
      normalizeBar: (nextBar) => normalizeHistogramBar(nextBar),
      updateCanonical: (existing, nextValue) => updateCanonicalData(existing, nextValue),
      resolveDisplayData: (source) => this.resolveStudyDisplayData(source as StudySourceState),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
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
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private createPaneHandle(paneId: string): PhaseOnePaneApi {
    return createPaneHandleUseCase(paneId, {
      getPaneIndex: (nextPaneId) => this.getPaneIndex(nextPaneId),
      getPaneHeight: (nextPaneId) => this.getPaneHeight(nextPaneId),
      getPaneOptions: (nextPaneId) => this.getPaneOptions(nextPaneId),
      applyPaneOptions: (nextPaneId, options) => this.applyPaneOptions(nextPaneId, options),
      setPaneHeight: (nextPaneId, height) => this.setPaneHeight(nextPaneId, height),
      isPrimary: (nextPaneId) => this.getPaneById(nextPaneId)?.kind === "primary",
      isResizable: (nextPaneId) => this.getPaneById(nextPaneId)?.resizable ?? false,
      subscribeResize: (nextPaneId, handler) => this.subscribePaneResize(nextPaneId, handler),
      unsubscribeResize: (nextPaneId, handler) => this.unsubscribePaneResize(nextPaneId, handler),
      hasSeries: (nextPaneId) => this.paneHasSeries(nextPaneId),
      removePaneById: (nextPaneId) => this.removePaneById(nextPaneId),
      registerPaneHandle: (pane, nextPaneId) => {
        this.paneHandleIds.set(pane, nextPaneId);
      },
    });
  }

  private subscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void {
    this.handlerRegistry.subscribePaneResize(paneId, handler, {
      hasPane: (nextPaneId) => this.getPaneById(nextPaneId) !== undefined,
    });
  }

  private unsubscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void {
    this.handlerRegistry.unsubscribePaneResize(paneId, handler);
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
    return getPaneHeightUseCase(paneId, {
      getPaneById: (nextPaneId) => this.getPaneById(nextPaneId),
      hasCanvas: () => this.canvas !== null,
      getLayout: () => (
        this.canvas === null ? DEFAULT_LAYOUT : measureLayout(this.canvas, DEFAULT_LAYOUT, this.viewState.manualLayout())
      ),
      listPanes: () => this.panes.list(),
      gap: PANE_GAP,
    });
  }

  private getPaneOptions(paneId: string): Required<PhaseOnePaneOptions> {
    return getPaneOptionsUseCase(paneId, {
      getPaneById: (nextPaneId) => this.getPaneById(nextPaneId),
    });
  }

  private applyPaneOptions(paneId: string, options: PhaseOnePaneOptions): void {
    applyPaneOptionsUseCase(paneId, options, {
      getPaneById: (nextPaneId) => this.getPaneById(nextPaneId),
      setPaneHeight: (nextPaneId, height) => this.setPaneHeight(nextPaneId, height),
      emitPaneEvent: (type, nextPaneId) => this.emitPaneEvent(type, nextPaneId),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private setPaneHeight(paneId: string, height: number): void {
    setPaneHeightUseCase(paneId, height, {
      getPaneById: (nextPaneId) => this.getPaneById(nextPaneId),
      emitPaneResize: (nextPaneId) => this.emitPaneResize(nextPaneId),
      emitPaneEvent: (type, nextPaneId) => this.emitPaneEvent(type, nextPaneId),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private applyPaneResize(clientY: number, layout: Layout, paneFrames: readonly PaneFrame[]): void {
    void paneFrames;
    applyPaneResizeUseCase(clientY, layout, this.viewState.paneResizeState(), {
      getPaneById: (nextPaneId) => this.getPaneById(nextPaneId),
      emitPaneResize: (nextPaneId) => this.emitPaneResize(nextPaneId),
      emitPaneEvent: (type, nextPaneId) => this.emitPaneEvent(type, nextPaneId),
      hasCanvas: () => this.canvas !== null,
      listPanes: () => this.panes.list(),
      gap: PANE_GAP,
      getCrosshair: () => this.viewState.crosshair(),
      setCrosshair: (point) => {
        this.viewState.setCrosshair(point);
      },
    });
  }

  private paneHasSeries(paneId: string): boolean {
    return paneHasSeriesUseCase(paneId, {
      getSeriesCount: (nextPaneId) => this.chartModel.listSourcesByPane(nextPaneId).length,
      getDrawingCount: (nextPaneId) => this.getDrawingCountForPane(nextPaneId),
    });
  }

  private resolveSeriesTarget(
    target: PhaseOneSeriesTarget | PhaseOneVolumeSeriesTarget | undefined,
    options: { defaultToSecondary: boolean; allowPrimary: boolean },
  ): ResolvedSeriesTarget {
    return resolveSeriesTargetUseCase(target, options, {
      listPanes: () => this.panes.list(),
      getPaneByIndex: (index) => this.panes.getByIndex(index),
      getPaneByHandle: (handle) => this.getPaneByHandle(handle),
      addPane: () => this.addPane(),
      getPaneId: (handle) => this.paneHandleIds.get(handle),
    });
  }

  private getPaneByHandle(handle: PhaseOnePaneApi): PaneModelState | undefined {
    return getPaneByHandleUseCase(handle, {
      getPaneId: (nextHandle) => this.paneHandleIds.get(nextHandle),
      getPaneById: (paneId) => this.getPaneById(paneId),
    });
  }

  private removePaneById(paneId: string): void {
    removePaneUseCase(paneId, {
      getPaneById: (nextPaneId) => this.getPaneById(nextPaneId),
      getSeriesCount: (nextPaneId) => this.getSecondarySeriesForPane(nextPaneId).length,
      getDrawingCount: (nextPaneId) => this.getDrawingCountForPane(nextPaneId),
      buildPaneState: (nextPaneId) => this.buildPaneState(nextPaneId),
      buildPaneSnapshot: () => this.buildPaneStateSnapshot(),
      removePaneById: (nextPaneId) => {
        this.panes.removeById(nextPaneId);
      },
      clearPaneResizeHandlers: (nextPaneId) => {
        this.handlerRegistry.clearPaneResizeHandlers(nextPaneId);
      },
      removeSecondaryScale: (nextPaneId) => {
        this.chartModel.removeSecondaryScale(nextPaneId);
      },
      emitPaneEvent: (type, nextPaneId, explicitPaneState, explicitSnapshot) =>
        this.emitPaneEvent(type, nextPaneId, explicitPaneState, explicitSnapshot),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private emitPaneResize(paneId: string): void {
    this.handlerRegistry.emitPaneResize(paneId, {
      getPaneById: (nextPaneId) => this.getPaneById(nextPaneId),
      getPaneIndex: (nextPaneId) => this.getPaneIndex(nextPaneId),
      getPaneHeight: (nextPaneId) => this.getPaneHeight(nextPaneId),
    });
  }

  private emitPaneEvent(
    type: PhaseOnePaneEventType,
    paneId: string,
    explicitPaneState?: PhaseOnePaneState | null,
    explicitSnapshot?: readonly PhaseOnePaneState[],
  ): void {
    this.handlerRegistry.emitPaneEvent(type, paneId, {
      buildPaneState: (nextPaneId) => this.buildPaneState(nextPaneId),
      buildPaneSnapshot: () => this.buildPaneStateSnapshot(),
    }, explicitPaneState, explicitSnapshot);
  }

  private buildPaneState(paneId: string): PhaseOnePaneState | null {
    return buildPaneStateByIdUseCase(paneId, {
      getPaneById: (nextPaneId) => this.getPaneById(nextPaneId),
      getPaneIndex: (nextPaneId) => this.getPaneIndex(nextPaneId),
      getPaneHeight: (nextPaneId) => this.getPaneHeight(nextPaneId),
      getPaneSeriesStates: (nextPaneId) => this.getPaneSeriesStates(nextPaneId),
    });
  }

  private buildPaneStateSnapshot(): readonly PhaseOnePaneState[] {
    return buildPaneStateSnapshotByIdsUseCase(
      this.panes.list().map((pane) => pane.id),
      {
        buildPaneState: (paneId) => this.buildPaneState(paneId),
      },
    );
  }

  private getPaneSeriesStates(paneId: string): readonly PhaseOnePaneSeriesState[] {
    return getPaneSeriesStatesUseCase(paneId, {
      listSourcesByPane: (nextPaneId) => this.chartModel.listSourcesByPane(nextPaneId),
    });
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
    const meta = this.createDrawingMeta("horizontal-line");
    return createHorizontalLineDrawingForPaneUseCase({
      paneId,
      paneExists: this.getPaneById(paneId) !== undefined,
      options,
      visible: options.visible ?? true,
      drawingId: meta.id,
      drawingTitle: meta.title,
      registry: {
        register: (drawing) => this.drawingRegistry.register(drawing),
        setVisible: (id, visible) => this.drawingRegistry.setVisible(id, visible),
        getByApi: (api) => {
          const drawing = this.drawingRegistry.getByApi(api);
          return drawing?.kind === "horizontal-line" ? drawing : undefined;
        },
        hasApi: (api) => {
          const drawing = this.drawingRegistry.getByApi(api);
          return drawing?.kind === "horizontal-line";
        },
      },
      createPriceLineState: (nextOptions) => this.priceLineManager.createState(nextOptions),
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
    const meta = this.createDrawingMeta("trend-line");
    return createTrendLineDrawingForPaneUseCase({
      paneId,
      paneExists: this.getPaneById(paneId) !== undefined,
      options,
      visible: options.visible ?? true,
      drawingId: meta.id,
      registry: {
        register: (drawing) => this.drawingRegistry.register(drawing),
        setVisible: (id, visible) => this.drawingRegistry.setVisible(id, visible),
        getByApi: (api) => {
          const drawing = this.drawingRegistry.getByApi(api);
          return drawing?.kind === "trend-line" ? drawing : undefined;
        },
        hasApi: (api) => {
          const drawing = this.drawingRegistry.getByApi(api);
          return drawing?.kind === "trend-line";
        },
      },
      lineColor: LINE_COLOR,
      resolveDefaults: () => this.resolveTrendLineDefaults(),
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

  private getDrawingById(id: string): ChartDrawingDescriptor | undefined {
    return getDrawingByIdUseCase(id, {
      listDrawings: () => this.drawingRegistry.list(),
    });
  }

  private getDrawingsByPane(paneId: string): readonly ChartDrawingDescriptor[] {
    return listDrawingsByPaneUseCase(paneId, {
      listByPane: (nextPaneId) => this.drawingRegistry.listByPane(nextPaneId),
    });
  }

  private getDrawingCountForPane(paneId: string): number {
    return getDrawingCountForPaneUseCase(paneId, {
      listByPane: (nextPaneId) => this.drawingRegistry.listByPane(nextPaneId),
    });
  }

  private selectDrawing(id: string | null, shouldRender = true): void {
    selectActiveDrawingUseCase({
      selectedDrawingId: this.viewState.selectedDrawingId(),
      nextId: id,
      shouldRender,
      getById: (drawingId) => this.getDrawingById(drawingId),
      getPaneIndex: (paneId) => this.getPaneIndex(paneId),
      notifySelectionChange: (selection) => {
        this.handlerRegistry.notifyDrawingSelectionChange(selection);
      },
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setSelectedDrawingId: (drawingId) => {
        this.viewState.setSelectedDrawingId(drawingId);
      },
    });
  }

  private removeDrawing(api: ChartDrawingApi): void {
    removeActiveDrawingUseCase({
      api,
      selectedDrawingId: this.viewState.selectedDrawingId(),
      removeByApi: (nextApi) => this.drawingRegistry.removeByApi(nextApi),
      clearSelection: (shouldRender) => this.selectDrawing(null, shouldRender),
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private removeSelectedDrawing(): void {
    removeSelectedActiveDrawingUseCase({
      selectedDrawingId: this.viewState.selectedDrawingId(),
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
    return getMainSourceUseCase({
      mainSourceId: () => this.chartModel.mainSourceId(),
      getSourceByIdAndRole: (id, role) => this.chartModel.getSourceByIdAndRole(id, role),
    });
  }

  private refreshTradeLocation(): void {
    refreshTradeLocationUseCase(this.activeTradeLocation, {
      getMainSource: () => this.getMainSource(),
      setActiveTradeLocation: (next) => {
        this.activeTradeLocation = next;
      },
      setVisibleLogicalRange: (range) => {
        this.timeScaleApi().setVisibleLogicalRange(range);
      },
      setVisiblePriceRange: (range) => {
        this.priceScaleApi().setVisibleRange(range);
      },
      render: () => {
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    });
  }

  private getMainSourceOrThrow(): MainSeriesSourceState {
    return getMainSourceOrThrowUseCase({
      getMainSource: () => this.getMainSource(),
    });
  }

  private getStudySourcesForPane(paneId: string): StudySourceState[] {
    return getStudySourcesForPaneUseCase(paneId, {
      listSourcesByPaneAndRole: (nextPaneId, role) => this.chartModel.listSourcesByPaneAndRole(nextPaneId, role),
    });
  }

  private getSecondarySeriesForPane(paneId: string): StudySourceState[] {
    return getSecondarySeriesForPaneUseCase(paneId, {
      getStudySourcesForPane: (nextPaneId) => this.getStudySourcesForPane(nextPaneId),
    });
  }

  private getSourceByApi(
    api: ChartSeriesApi,
    kind?: ChartSeriesKind,
  ): SeriesSourceState {
    return getSourceByApiUseCase<SeriesSourceState, ChartSeriesKind>(api, {
      getSourceByApiOrThrow: (nextApi, message) => this.chartModel.getSourceByApiOrThrow(nextApi as ChartSeriesApi, message),
    }, kind);
  }

  private getCompareStudyState(api: PhaseOneCompareSeriesApi): StudySourceState {
    return getCompareStudyStateUseCase<StudySourceState>(api, {
      getSourceByApi: (nextApi, kind) => this.getSourceByApi(nextApi as ChartSeriesApi, kind) as StudySourceState,
    });
  }

  private getMovingAverageStudyState(api: PhaseOneMovingAverageStudyApi): StudySourceState {
    return getMovingAverageStudyStateUseCase<StudySourceState>(api, {
      getSourceByApi: (nextApi, kind) => this.getSourceByApi(nextApi as ChartSeriesApi, kind) as StudySourceState,
    });
  }

  private getOrCreateSecondaryPanePriceScale(paneId: string): PriceScale {
    return getOrCreateSecondaryPanePriceScaleUseCase(paneId, {
      getOrCreateSecondaryScale: (nextPaneId) => this.chartModel.getOrCreateSecondaryScale(nextPaneId),
    });
  }

  private buildPrimaryPaneSeries(
    mainSource: MainSeriesSourceState | null,
  ): readonly SeriesSourceState[] {
    return buildPrimaryPaneSeriesUseCase(mainSource, {
      getStudySourcesForPane: (paneId) => this.getStudySourcesForPane(paneId),
    });
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
    return formatReadoutDetailUseCase(this.buildRawReadout(point, layout), {
      formatTime: (value) => formatTimeAxisLabel(value, this.timeAxisFormatter),
      formatPrice: (value) => formatPriceAxisLabel(value, this.priceAxisFormatter),
    });
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

  private formatSeriesReadoutValueForState(state: SeriesSourceState, value: number | null): string {
    return formatSeriesReadoutValueForStateUseCase(state, value, {
      formatPrice: (nextValue) => formatPriceAxisLabel(nextValue, this.priceAxisFormatter),
      formatVolume: (nextValue) => formatVolumeAxisLabel(nextValue),
    });
  }

  public render(canvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    const layout = measureLayout(canvas, DEFAULT_LAYOUT, this.viewState.manualLayout());
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
      crosshair: this.viewState.crosshair(),
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
      barSpacing: resolveBarSpacing(this.barSpacing, paneWidth, pointCount, BAR_SPACING_BOUNDS),
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
          drawingSnapGuide: this.viewState.drawingSnapGuide(),
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
              {
                resolveDrawingTimeCoordinate: (time) =>
                  resolveDrawingTimeCoordinate(
                    time,
                    this.chartModel.context().snapshot().barSequence.axisBars,
                    this.timeScale,
                  ),
                priceScale: this.primaryPriceScale,
                selectedDrawingId: this.viewState.selectedDrawingId(),
                hoveredDrawingId: this.viewState.hoveredDrawingId(),
                hoveredDrawingHandle: this.viewState.hoveredDrawingHandle(),
              },
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
              {
                backgroundColor: CHART_BACKGROUND,
              },
            );
          },
          drawDrawingSnapGuide: () => {
            drawDrawingSnapGuide(
              context,
              paneWidth,
              pane.height,
              primaryPaneDecorations.snapGuide,
              {
                priceScale: this.primaryPriceScale,
                resolveDrawingTimeCoordinate: (time) =>
                  resolveDrawingTimeCoordinate(
                    time,
                    this.chartModel.context().snapshot().barSequence.axisBars,
                    this.timeScale,
                  ),
              },
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
          drawingSnapGuide: this.viewState.drawingSnapGuide(),
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
                {
                  resolveDrawingTimeCoordinate: (time) =>
                    resolveDrawingTimeCoordinate(
                      time,
                      this.chartModel.context().snapshot().barSequence.axisBars,
                      this.timeScale,
                    ),
                  priceScale: panePriceScale,
                  selectedDrawingId: this.viewState.selectedDrawingId(),
                  hoveredDrawingId: this.viewState.hoveredDrawingId(),
                  hoveredDrawingHandle: this.viewState.hoveredDrawingHandle(),
                },
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
                secondaryPaneDecorations.snapGuide,
                {
                  priceScale: panePriceScale,
                  resolveDrawingTimeCoordinate: (time) =>
                    resolveDrawingTimeCoordinate(
                      time,
                      this.chartModel.context().snapshot().barSequence.axisBars,
                      this.timeScale,
                    ),
                },
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
        crosshair: this.viewState.crosshair(),
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
      crosshair: this.viewState.crosshair(),
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
            && this.viewState.drawingSnapGuide()?.paneId === "primary"
            && this.viewState.drawingSnapGuide()!.price !== null
            ? buildMagnetAxisTag(
              layout,
              pane.top,
              this.primaryPriceScale,
              this.viewState.drawingSnapGuide()!,
              this.priceAxisFormatter,
            )
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
            && this.viewState.drawingSnapGuide()?.paneId === pane.id
            && this.viewState.drawingSnapGuide()!.price !== null
            ? buildMagnetAxisTag(layout, pane.top, state.priceScale, this.viewState.drawingSnapGuide()!, this.priceAxisFormatter)
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
              this.viewState.crosshair(),
              this.chartOptions,
              this.timeAxisFormatter,
              this.drawingOptions.timeMagnetLabelVisible && this.viewState.drawingSnapGuide()?.time != null
                ? buildMagnetTimeAxisTag(
                    layout,
                    rows,
                    this.timeScale,
                    this.viewState.drawingSnapGuide()!,
                    this.timeAxisFormatter,
                  )
                : null,
            );
          },
        });
      },
      buildReadout: () => this.buildReadout(this.viewState.crosshair(), layout),
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
