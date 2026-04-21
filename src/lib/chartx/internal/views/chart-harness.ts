import {
  createCompressedPriceBasedChartBarSequence,
  createDirectionColumnPriceBasedChartBarSequence,
  buildHeikinAshiData,
  buildKagiData,
  buildLineBreakData,
  buildPointFigureData,
  buildRenkoData,
  ChartModel,
  createMainSeriesStateSnapshot,
  resolveTradeLocationState,
  resolveTradeOverlayOptions,
  DrawingRegistry,
  PaneCollection,
  PriceRangeImpl,
  PriceScale,
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
import {
  type RestorableDrawingSnapshot,
  validateDrawingCollectionSnapshots,
} from "./chart-drawing-restore";
import { createMainSeriesSourceState } from "./chart-main-series-source";
import { createChartPrimarySeriesOwner } from "./chart-primary-series-owner";
import { createChartSeriesCommandOwner } from "./chart-series-command-owner";
import { createChartMainSeriesStateOwner } from "./chart-main-series-state-owner";
import { createChartTradeLocationOwner } from "./chart-trade-location-owner";
import { buildCrosshairReadout } from "./chart-crosshair-readout";
import { createChartInteractionHandlers } from "./chart-interaction-handlers";
import { createChartHandlerRegistry } from "./chart-handler-registry";
import { createChartEventSubscriptionOwner } from "./chart-event-subscription-owner";
import {
  calculateBaseBarSpacing,
  measureLayout,
  resolveBarSpacing,
  resolvePanePoint,
} from "./chart-layout-geometry";
import {
  resolveDrawingMagnetOptions as resolveDrawingMagnetOptionsUseCase,
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
import { createChartScaleOwner } from "./chart-scale-owner";
import { createChartShellOwner } from "./chart-shell-owner";
import { createChartPublicApi as createChartPublicApiUseCase } from "./chart-public-api";
import type { PriceLineState } from "./chart-price-line-runtime";
import { createPriceLineManager } from "./chart-price-line-management";
import { createChartSeriesBuildOwner } from "./chart-series-build-owner";
import {
  createMainBarSequenceFromSource as createMainBarSequenceFromSourceUseCase,
} from "./chart-main-source-runtime";
import { createChartSourceOwner } from "./chart-source-owner";
import { createChartStudyContextOwner } from "./chart-study-context-owner";
import { createChartPaneOwner } from "./chart-pane-owner";
import { createChartDrawingOwner } from "./chart-drawing-owner";
import {
  type SeriesMarkerState,
} from "./chart-series-presentation";
import { createChartSecondarySeriesApiOwner } from "./chart-secondary-series-api-owner";
import { createChartSourceMutationOwner } from "./chart-source-mutation-owner";
import { createChartStudySourceOwner } from "./chart-study-source-owner";
import { createChartMainSeriesSwitchOwner } from "./chart-main-series-switch-owner";
import {
  emitClickRuntime as emitClickRuntimeUseCase,
} from "./chart-event-runtime";
import { createChartCanvasLifecycleOwner } from "./chart-canvas-lifecycle-owner";
import {
  drawPaneCrosshair,
  drawPaneLegend,
} from "./chart-pane-chrome";
import {
  createChartViewState,
  type DragState,
  type DrawingDragState,
  type DrawingSnapGuideState,
  type PaneResizeState,
} from "./chart-view-state";
import { createChartDrawingInteractionOwner } from "./chart-drawing-interaction-owner";
import { createChartRenderCoordinator } from "./chart-render-coordinator";
import { createChartRenderInvalidation } from "./chart-render-invalidation";
import { emitReadoutEvent as emitReadoutEventUseCase } from "./chart-render-tail";
import { createChartStateCoordinator } from "./chart-state-coordinator";
import { applyChartTemplate, createChartTemplate, normalizeChartTemplate } from "./chart-template";
import { createChartRuntimeQueryOwner } from "./chart-runtime-query-owner";
import {
  applyMainSeriesBuilderData,
  type HistogramVisual,
} from "./chart-series-data-transforms";
import { formatSeriesKindLabel } from "./chart-series-labels";
import {
  buildDemoBars,
  buildDemoVolumeBars,
} from "./chart-demo-data";
import { assertCanvasElement } from "./chart-dom-guards";

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
  private readonly handlerRegistry = createChartHandlerRegistry();
  private readonly eventSubscriptionOwner = createChartEventSubscriptionOwner(this.handlerRegistry);
  private readonly chartModel = new ChartModel<
    ChartSeriesKind,
    ChartSeriesApi,
    SeriesSourceState,
    PhaseOneMainChartType
  >();
  private readonly drawingRegistry = new DrawingRegistry<ChartDrawingKind, ChartDrawingApi, ChartDrawingDescriptor>();
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
  private readonly seriesBuildOwner = createChartSeriesBuildOwner({
    defaults: {
      candlestickOptions: this.candlestickOptions,
      barOptions: this.barOptions,
      lineOptions: this.lineOptions,
      areaOptions: this.areaOptions,
      baselineOptions: this.baselineOptions,
      histogramOptions: this.histogramOptions,
      volumeOptions: this.volumeOptions,
    },
  });
  private readonly studyContextOwner = createChartStudyContextOwner<StudySourceState>({
    getContextSnapshot: () => this.chartModel.context().snapshot(),
    clearMainSource: () => this.chartModel.clearMainSource(),
    bindMainSource: (mainSourceId, chartType, barSequence) =>
      this.chartModel.bindMainSource(mainSourceId, chartType, barSequence),
    listStudySources: () => this.chartModel.listSourcesByRole("study") as StudySourceState[],
    refreshTradeLocation: () => this.sourceOwner.refreshTradeLocation(),
  });
  private readonly viewState = createChartViewState<PanePoint, ResizeObserver>();
  private readonly tradeLocationOwner = createChartTradeLocationOwner<
    PhaseOneTradeLocationRequest,
    PhaseOneTradeOverlayOptions,
    PhaseOneTradeLocationState,
    MainSeriesSourceState
  >({
    ensureMainSource: () => {
      this.sourceOwner.getMainSourceOrThrow();
    },
    getMainSource: () => this.sourceOwner.getMainSource() as MainSeriesSourceState | null,
    setVisibleLogicalRange: (range) => this.timeScaleApi().setVisibleLogicalRange(range),
    setVisiblePriceRange: (range) => this.priceScaleApi().setVisibleRange(range),
    resetPrimaryPriceRangeOverride: () => {
      this.primaryPriceRangeOverride = null;
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly sourceMutationOwner = createChartSourceMutationOwner({
    syncMainSource: (source) => this.studyContextOwner.syncMainSource(source as MainSeriesSourceState),
    resolveStudyDisplayData: (source) => this.studyContextOwner.resolveDisplayData(source as StudySourceState),
    resetViewport: () => {
      this.barSpacing = null;
      this.rightOffset = DEFAULT_RIGHT_OFFSET;
    },
    clearPrimaryPriceRangeOverride: () => {
      this.primaryPriceRangeOverride = null;
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly studySourceOwner = createChartStudySourceOwner<StudySourceState>({
    getPrimaryPriceScale: () => this.primaryPriceScale,
    getOrCreateSecondaryPriceScale: (paneId) => this.chartModel.getOrCreateSecondaryScale(paneId),
    createMeta: (kind) => this.seriesBuildOwner.createMeta(kind),
    createOptions: (kind) => this.seriesBuildOwner.createOptions(kind),
    registerSource: (source) => {
      this.chartModel.registerSource(source);
    },
    defaultCompareOptions: this.defaultCompareOptions,
  });
  private readonly mainSeriesSwitchOwner = createChartMainSeriesSwitchOwner<ChartSeriesApi>({
    removeCurrent: (api) => this.chartModel.removeSourceByApi(api) !== undefined,
    clearPriceRangeOverride: () => {
      this.primaryPriceRangeOverride = null;
    },
    attachSeries: (type, preserved) => this.primarySeriesOwner.attach(type, preserved as never),
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
    emitChartTypeChange: (type) => {
      this.handlerRegistry.emitChartTypeChange(type);
    },
  });
  private readonly sourceOwner = createChartSourceOwner({
    accessors: {
      mainSourceId: () => this.chartModel.mainSourceId(),
      getSourceByIdAndRole: (id, role) => this.chartModel.getSourceByIdAndRole(id, role),
      getSourceByApiOrThrow: (api, message) => this.chartModel.getSourceByApiOrThrow(api as ChartSeriesApi, message),
      listSourcesByPaneAndRole: (paneId, role) => this.chartModel.listSourcesByPaneAndRole(paneId, role),
      listSourcesByRole: (role) => this.chartModel.listSourcesByRole(role),
    },
    mainSeriesSwitch: this.mainSeriesSwitchOwner.mainSeriesSwitch,
    primaryMutations: this.sourceMutationOwner.primaryMutations,
    studySources: this.studySourceOwner.studySources,
    secondaryMutations: this.sourceMutationOwner.secondaryMutations,
    secondarySeriesApi: createChartSecondarySeriesApiOwner({
      assertSeriesActive: (api) => this.runtimeQueryOwner.assertSeriesActive(api as ChartSeriesApi),
      getSourceByApiOrThrow: (api, message) =>
        this.chartModel.getSourceByApiOrThrow(api as ChartSeriesApi, message) as SeriesSourceState,
      resolveDisplayData: this.sourceMutationOwner.secondarySeriesApiRuntime.resolveDisplayData,
      resetViewport: this.sourceMutationOwner.secondarySeriesApiRuntime.resetViewport,
      render: this.sourceMutationOwner.secondarySeriesApiRuntime.render,
      updateCanonical: this.sourceMutationOwner.secondarySeriesApiRuntime.updateCanonical,
      buildHistogramVisuals: this.sourceMutationOwner.secondarySeriesApiRuntime.buildHistogramVisuals,
      normalizeHistogramData: this.sourceMutationOwner.secondarySeriesApiRuntime.normalizeHistogramData,
      normalizeHistogramBar: this.sourceMutationOwner.secondarySeriesApiRuntime.normalizeHistogramBar,
      createPriceLineState: (options) => this.priceLineManager.createState(options),
      createPriceLine: (lines, state) => this.priceLineManager.createApi(lines, state),
      removePriceLine: (lines, line) => this.priceLineManager.remove(lines, line),
      defaultCompareOptions: this.defaultCompareOptions,
      defaultMovingAverageOptions: this.defaultMovingAverageOptions,
    }),
    tradeLocation: {
      active: () => this.tradeLocationOwner.getActiveSession(),
      setActive: (next) => {
        this.tradeLocationOwner.setActiveSession(next as never);
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
    addSecondaryPane: (options) => this.panes.addSecondaryPane(options),
    hasCanvas: () => this.canvas !== null,
    getLayout: () => (this.canvas === null ? DEFAULT_LAYOUT : measureLayout(this.canvas, DEFAULT_LAYOUT, this.viewState.manualLayout())),
    gap: PANE_GAP,
    getCrosshair: () => this.viewState.crosshair(),
    setCrosshair: (point) => {
      this.viewState.setCrosshair(point);
    },
    getSeriesCount: (paneId) => this.chartModel.listSourcesByPane(paneId).length,
    getDrawingCount: (paneId) => this.drawingOwner.countDrawingsByPane(paneId),
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
    resolveTarget: (target, options) => this.paneOwner.resolveSeriesTarget(target, options) as never,
    getPaneById: (paneId) => this.panes.getById(paneId),
    getPaneByIndex: (index) => this.panes.getByIndex(index),
    createPaneTarget: (pane) => ({ pane }),
    getRestorePaneId: (target) => target.pane.id,
    getPaneIndex: (paneId) => this.paneOwner.getPaneIndex(paneId),
    registry: this.drawingRegistry,
    createPriceLineState: (options) => this.priceLineManager.createState(options),
    lineColor: LINE_COLOR,
    resolveTrendLineDefaults: () =>
      resolveTrendLineDefaultsUseCase(this.chartModel.context().snapshot().barSequence.axisBars),
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
  private readonly drawingInteractionOwner = createChartDrawingInteractionOwner<ChartDrawingDescriptor>({
    listPanes: () => this.panes.list(),
    paneGap: PANE_GAP,
    getPrimaryPriceScale: () => this.primaryPriceScale,
    getSecondaryPriceScale: (paneId) => this.chartModel.getSecondaryScale(paneId),
    getAxisBars: () => this.chartModel.context().snapshot().barSequence.axisBars,
    getBarSequence: () => this.chartModel.context().snapshot().barSequence,
    getTimeScale: () => this.timeScale,
    getDrawingOptions: () => this.drawingOptions,
    getDrawingById: (id) => this.drawingOwner.getDrawingById(id),
    listDrawingsByPane: (paneId) => this.drawingOwner.listDrawingsByPane(paneId),
    getSelectedDrawingId: () => this.viewState.selectedDrawingId(),
    clearDrawingSnapGuide: () => this.viewState.clearDrawingSnapGuide(),
    setDrawingSnapGuide: (guide) => this.viewState.setDrawingSnapGuide(guide),
    hitTolerance: DRAWING_HIT_TOLERANCE,
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
    getMainSource: () => this.sourceOwner.getMainSource() as MainSeriesSourceState | null,
    createMainBarSequenceFromSource: (source) =>
      createMainBarSequenceFromSourceUseCase(source as MainSeriesSourceState),
    getContextSnapshot: () => this.chartModel.context().snapshot(),
    getPrimaryStudies: () => this.sourceOwner.getStudySourcesForPane("primary") as StudySourceState[],
    buildPrimaryPaneSeries: (mainSource) =>
      this.sourceOwner.buildPrimaryPaneSeries(mainSource as MainSeriesSourceState | null) as readonly SeriesSourceState[],
    getStudySources: () => this.chartModel.listSourcesByRole("study"),
    getSecondarySeriesForPane: (paneId) => this.sourceOwner.getSecondarySeriesForPane(paneId) as StudySourceState[],
    getDrawingsByPane: (paneId) => this.drawingOwner.listDrawingsByPane(paneId),
    getPaneIndex: (paneId) => this.paneOwner.getPaneIndex(paneId),
    getSecondaryScale: (paneId) => this.chartModel.getSecondaryScale(paneId),
    getPrimaryPriceScale: () => this.primaryPriceScale,
    getPrimaryPriceRangeOverride: () => this.primaryPriceRangeOverride,
    getActiveTradeLocationState: () => this.tradeLocationOwner.getState(),
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
      drawPaneCrosshair(context, paneWidth, paneHeight, crosshair, options);
    },
    emitReadout: (canvas, detail) => {
      emitReadoutEventUseCase(canvas, detail);
    },
    emitCrosshairMove: (readout) => {
      this.handlerRegistry.emitCrosshairMove(readout, this.viewState.crosshair());
    },
    backgroundColor: () => CHART_BACKGROUND,
    resolveBarSpacing: (currentSpacing, paneWidth, pointCount) =>
      resolveBarSpacing(currentSpacing, paneWidth, pointCount, BAR_SPACING_BOUNDS),
  });
  private readonly runtimeQueryOwner = createChartRuntimeQueryOwner<ChartSeriesApi>({
    buildMainBarSequence: () =>
      this.renderCoordinator.buildMainBarSequence(
        this.sourceOwner.getMainSource() as MainSeriesSourceState | null,
      ),
    getContextSnapshot: () => this.chartModel.context().snapshot(),
    listSources: () => this.chartModel.listSources(),
    hasSourceApi: (api) => this.chartModel.hasSourceApi(api),
  });
  private readonly scaleOwner = createChartScaleOwner({
    defaultLayout: DEFAULT_LAYOUT,
    paneGap: PANE_GAP,
    minBarSpacing: MIN_BAR_SPACING,
    maxBarSpacing: MAX_BAR_SPACING,
    getCanvas: () => this.canvas,
    getManualLayout: () => this.viewState.manualLayout(),
    getPointCount: () => this.runtimeQueryOwner.getPointCount(),
    getBarSpacing: () => this.barSpacing,
    setBarSpacing: (value) => {
      this.barSpacing = value;
    },
    getRightOffset: () => this.rightOffset,
    setRightOffset: (value) => {
      this.rightOffset = value;
    },
    getTimeScale: () => this.timeScale,
    setTimeAxisFormatter: (formatter) => {
      this.timeAxisFormatter = formatter;
    },
    getPrimaryPriceRangeOverride: () => this.primaryPriceRangeOverride,
    setPrimaryPriceRangeOverride: (range) => {
      this.primaryPriceRangeOverride = range;
    },
    getPrimaryPriceScale: () => this.primaryPriceScale,
    getSecondaryVisibleRange: () =>
      this.chartModel.secondaryScales()[0]?.getPriceRange()?.toRaw() ?? null,
    getPanes: () => this.panes.list(),
    setPriceAxisFormatter: (formatter) => {
      this.priceAxisFormatter = formatter;
    },
    setPrimaryScaleSeriesOnly: (value) => {
      this.primaryScaleSeriesOnly = value;
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly shellOwner = createChartShellOwner({
    layoutOptions: this.chartOptions,
    crosshairOptions: this.crosshairOptions,
    drawingOptions: this.drawingOptions,
    setManualLayout: (layout) => {
      this.viewState.setManualLayout(layout);
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
  private readonly primarySeriesOwner = createChartPrimarySeriesOwner<PhaseOneMainSeriesApi, MainSeriesSourceState>({
    getCurrentMainSourceId: () => this.chartModel.mainSourceId(),
    getPrimaryPriceScale: () => this.primaryPriceScale,
    createMeta: (chartType) => this.seriesBuildOwner.createMeta(chartType),
    createLabel: (chartType, id) => this.seriesBuildOwner.createLabel(chartType, id),
    createSourceState: (input) =>
      this.seriesBuildOwner.createMainSource({
        paneId: input.paneId,
        chartType: input.chartType,
        kind: input.kind,
        api: input.api,
        meta: input.meta,
        priceScale: input.priceScale,
        priceScaleId: input.priceScaleId,
      }) as MainSeriesSourceState,
    registerSource: (source) => this.chartModel.registerSource(source),
    syncMainSource: (source) => this.studyContextOwner.syncMainSource(source),
    assertSeriesActive: (api) => this.runtimeQueryOwner.assertSeriesActive(api as ChartSeriesApi),
    getSourceByApi: (api, sourceKind) =>
      this.sourceOwner.getSourceByApi(api as ChartSeriesApi, sourceKind) as MainSeriesSourceState,
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
    setPrimaryData: (data) => this.sourceOwner.setPrimaryData(data),
    updatePrimaryData: (bar) => this.sourceOwner.updatePrimaryData(bar),
    setPrimaryHistogramLikeData: (data) => this.sourceOwner.setPrimaryHistogramLikeData(data),
    updatePrimaryHistogramLikeData: (bar) => this.sourceOwner.updatePrimaryHistogramLikeData(bar),
    createPriceLineState: (options) => this.priceLineManager.createState(options),
    createPriceLine: (lines, state) => this.priceLineManager.createApi(lines, state),
    removePriceLine: (lines, line) => this.priceLineManager.remove(lines, line),
  });
  private readonly seriesCommandOwner = createChartSeriesCommandOwner({
    resolveTarget: (target, options) =>
      this.paneOwner.resolveSeriesTarget(target, options) as ResolvedSeriesTarget,
    addPrimary: (kind) => this.primarySeriesOwner.add(kind),
    addSecondarySeries: (params) => this.sourceOwner.addSecondarySeries(params),
    addLineStudySeries: (paneId, studyKind, params) =>
      this.sourceOwner.addLineStudySeries(paneId, studyKind, params),
    getMovingAverageLength: () => this.defaultMovingAverageOptions.length,
    removeSourceByApi: (series) => this.chartModel.removeSourceByApi(series as ChartSeriesApi),
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
  private readonly mainSeriesStateOwner = createChartMainSeriesStateOwner<
    PhaseOneMainSeriesApi,
    MainSeriesSourceState
  >({
    getMainSource: () => this.sourceOwner.getMainSource() as MainSeriesSourceState | null,
    getMainSourceOrThrow: () => this.sourceOwner.getMainSourceOrThrow() as MainSeriesSourceState,
    attachMainSeries: (chartType) => this.primarySeriesOwner.attach(chartType),
    switchChartType: (chartType) => this.setChartType(chartType),
    createOptions: (styleSchemaId) => this.seriesBuildOwner.createMainOptions(styleSchemaId),
    rebuildData: (source) => {
      source.data = applyMainSeriesBuilderData(source.inputData, source);
    },
    syncContext: (source) => {
      this.studyContextOwner.syncMainSource(source);
    },
    resetPrimaryPriceRangeOverride: () => {
      this.primaryPriceRangeOverride = null;
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
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
    getPaneIndex: (paneId) => this.paneOwner.getPaneIndex(paneId),
    getDefaultCompareOptions: () => this.defaultCompareOptions,
    getTradeLocationState: () => {
      const activeTradeLocation = this.tradeLocationOwner.getActiveSession();
      return activeTradeLocation === null
        ? null
        : {
            request: activeTradeLocation.request,
            overlay: activeTradeLocation.options,
          };
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
      this.drawingOwner.selectDrawing(null, false);
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
      this.drawingOwner.removeDrawing(api as ChartDrawingApi);
    },
    getSecondarySeriesCountForPane: (paneId) =>
      this.sourceOwner.getSecondarySeriesForPane(paneId).length,
    removeSecondaryPane: (paneId) => {
      this.paneOwner.removePaneById(paneId);
    },
    addPane: (options) => {
      this.paneOwner.addPane(options);
    },
    emitPaneEvent: (type, paneId) => {
      this.paneOwner.emitPaneEvent(type, paneId);
    },
    applyMainSeriesState: (state) => {
      this.applyMainSeriesState(state);
    },
    getPaneByIndex: (index) => this.panes.getByIndex(index),
    createPaneTarget: (pane) => ({ pane: this.paneOwner.createPaneHandle(pane.id) }),
    addCandlestickSeries: (target) => this.addCandlestickSeries(target),
    addBarSeries: (target) => this.addBarSeries(target),
    addLineSeries: (target) => this.addLineSeries(target),
    addAreaSeries: (target) => this.addAreaSeries(target),
    addBaselineSeries: (target) => this.addBaselineSeries(target),
    addHistogramSeries: (target) => this.addHistogramSeries(target),
    addVolumeSeries: (target) => this.addVolumeSeries(target),
    addOverlaySeries: (paneId) => this.seriesCommandOwner.addOverlaySeriesToPane(paneId),
    addCompareSeries: (paneId) => this.seriesCommandOwner.addCompareSeriesToPane(paneId),
    addMovingAverageStudy: (paneId) => this.seriesCommandOwner.addMovingAverageStudyToPane(paneId),
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
    getPointCount: () => this.runtimeQueryOwner.getPointCount(),
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
      this.drawingInteractionOwner.resolveHitDrawing(point, layout, paneFrames as readonly PaneFrame[] | undefined),
    resolveSelectedTrendLineDragHandle: (point, layout, paneFrames) =>
      this.drawingInteractionOwner.resolveSelectedTrendLineDragHandle(point, layout, paneFrames as readonly PaneFrame[]),
    applyPaneResize: (clientY, layout, paneFrames) => {
      void paneFrames;
      this.paneOwner.applyPaneResize(clientY, layout, this.viewState.paneResizeState());
    },
    applyDrawingDrag: (dragState, point, layout, paneFrames) => {
      this.drawingInteractionOwner.applyDrawingDrag(dragState, point, layout, paneFrames as readonly PaneFrame[]);
    },
    focusCanvas: () => {
      this.canvas?.focus({ preventScroll: true });
    },
    renderCanvas: (canvas) => {
      this.render(canvas);
    },
    selectDrawing: (id) => {
      this.drawingOwner.selectDrawing(id);
    },
    buildReadout: (point, layout) => this.renderCoordinator.buildReadout(point, layout),
    emitClick: (readout, point) => {
      this.handlerRegistry.emitClick(readout, point);
    },
    hasSelectedDrawing: () => this.viewState.selectedDrawingId() !== null,
    clearSelectedDrawing: () => {
      this.drawingOwner.selectDrawing(null);
    },
    removeSelectedDrawing: () => {
      this.drawingOwner.removeSelectedDrawing();
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
    return this.seriesCommandOwner.addCandlestickSeries(target);
  }

  public addLineSeries(target?: PhaseOneSeriesTarget): PhaseOneLineSeriesApi {
    return this.seriesCommandOwner.addLineSeries(target);
  }

  public addAreaSeries(target?: PhaseOneSeriesTarget): PhaseOneAreaSeriesApi {
    return this.seriesCommandOwner.addAreaSeries(target);
  }

  public addBaselineSeries(target?: PhaseOneSeriesTarget): PhaseOneBaselineSeriesApi {
    return this.seriesCommandOwner.addBaselineSeries(target);
  }

  public addBarSeries(target?: PhaseOneSeriesTarget): PhaseOneBarSeriesApi {
    return this.seriesCommandOwner.addBarSeries(target);
  }

  public addHistogramSeries(target?: PhaseOneSeriesTarget): PhaseOneHistogramSeriesApi {
    return this.seriesCommandOwner.addHistogramSeries(target);
  }

  public addVolumeSeries(target?: PhaseOneVolumeSeriesTarget): PhaseOneVolumeSeriesApi {
    return this.seriesCommandOwner.addVolumeSeries(target);
  }

  public addOverlaySeries(target?: PhaseOneSeriesTarget): PhaseOneOverlaySeriesApi {
    return this.seriesCommandOwner.addOverlaySeries(target);
  }

  public addCompareSeries(target?: PhaseOneSeriesTarget): PhaseOneCompareSeriesApi {
    return this.seriesCommandOwner.addCompareSeries(target);
  }

  public addMovingAverageStudy(target?: PhaseOneSeriesTarget): PhaseOneMovingAverageStudyApi {
    return this.seriesCommandOwner.addMovingAverageStudy(target);
  }

  public addHorizontalLineDrawing(
    target?: PhaseOneSeriesTarget,
    options: PhaseOneHorizontalLineDrawingOptions = {},
  ): PhaseOneHorizontalLineDrawingApi {
    return this.drawingOwner.addHorizontalLine(target, options);
  }

  public addTrendLineDrawing(
    target?: PhaseOneSeriesTarget,
    options: PhaseOneTrendLineDrawingOptions = {},
  ): PhaseOneTrendLineDrawingApi {
    return this.drawingOwner.addTrendLine(target, options);
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
    this.seriesCommandOwner.removeSeries(series);
  }

  public panesApi(): readonly PhaseOnePaneApi[] {
    return this.paneOwner.listPaneHandles();
  }

  public addPane(options: PhaseOnePaneOptions = {}): PhaseOnePaneApi {
    return this.paneOwner.addPane(options);
  }

  public removePaneByHandle(paneHandle: PhaseOnePaneApi): void {
    this.paneOwner.removePaneByHandle(paneHandle);
  }

  public applyOptions(options: PhaseOneChartOptions): void {
    this.shellOwner.applyOptions(options);
  }

  public resize(width: number, height: number): void {
    this.shellOwner.resize(width, height);
  }

  public timeScaleApi(): PhaseOneTimeScaleApi {
    return this.scaleOwner.timeScaleApi();
  }

  public priceScaleApi(): PhaseOnePriceScaleApi {
    return this.scaleOwner.priceScaleApi();
  }

  public subscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void {
    this.eventSubscriptionOwner.subscribeCrosshairMove(handler);
  }

  public unsubscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void {
    this.eventSubscriptionOwner.unsubscribeCrosshairMove(handler);
  }

  public subscribeClick(handler: PhaseOneClickHandler): void {
    this.eventSubscriptionOwner.subscribeClick(handler);
  }

  public unsubscribeClick(handler: PhaseOneClickHandler): void {
    this.eventSubscriptionOwner.unsubscribeClick(handler);
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
    this.eventSubscriptionOwner.subscribeDrawingSelectionChange(handler);
  }

  public unsubscribeDrawingSelectionChange(handler: PhaseOneDrawingSelectionChangeHandler): void {
    this.eventSubscriptionOwner.unsubscribeDrawingSelectionChange(handler);
  }

  public subscribePaneEvents(handler: PhaseOnePaneEventHandler): void {
    this.eventSubscriptionOwner.subscribePaneEvents(handler);
  }

  public unsubscribePaneEvents(handler: PhaseOnePaneEventHandler): void {
    this.eventSubscriptionOwner.unsubscribePaneEvents(handler);
  }

  public subscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void {
    this.eventSubscriptionOwner.subscribeChartTypeChange(handler);
  }

  public unsubscribeChartTypeChange(handler: PhaseOneChartTypeChangeHandler): void {
    this.eventSubscriptionOwner.unsubscribeChartTypeChange(handler);
  }

  public getChartType(): PhaseOneMainChartType | null {
    return this.runtimeQueryOwner.getChartType() as PhaseOneMainChartType | null;
  }

  public getMainSeriesState(): PhaseOneMainSeriesStateSnapshot | null {
    return this.mainSeriesStateOwner.getState();
  }

  public applyMainSeriesState(state: PhaseOneMainSeriesStateSnapshot): PhaseOneMainSeriesApi {
    return this.mainSeriesStateOwner.applyState(state);
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
    return this.tradeLocationOwner.locate(request, options);
  }

  public clearTradeLocation(): void {
    this.tradeLocationOwner.clear();
  }

  public getTradeLocationState(): PhaseOneTradeLocationState | null {
    return this.tradeLocationOwner.getState();
  }

  public setChartType(type: PhaseOneMainChartType): PhaseOneMainSeriesApi {
    return this.sourceOwner.setChartType(type) as PhaseOneMainSeriesApi;
  }

  public setData(data: readonly PhaseOneCandlestickData[]): void {
    this.sourceOwner.setPrimaryData(data);
  }

  public update(bar: PhaseOneCandlestickData): void {
    this.sourceOwner.updatePrimaryData(bar);
  }

  public render(canvas: HTMLCanvasElement): void {
    this.renderCoordinator.render(canvas);
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
