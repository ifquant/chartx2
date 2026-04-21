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
import { createMainSeriesSourceState } from "./chart-main-series-source";
import { createChartPrimarySeriesOwner } from "./chart-primary-series-owner";
import { createChartSeriesCommandOwner } from "./chart-series-command-owner";
import { createChartMainSeriesStateOwner } from "./chart-main-series-state-owner";
import { createChartTradeLocationOwner } from "./chart-trade-location-owner";
import { buildCrosshairReadout } from "./chart-crosshair-readout";
import { createChartInteractionOwner } from "./chart-interaction-owner";
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
import { createAttachedChart } from "./chart-factory";
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
  createChartViewState,
  type DrawingSnapGuideState,
} from "./chart-view-state";
import { createChartDrawingInteractionOwner } from "./chart-drawing-interaction-owner";
import { createChartRenderCoordinator } from "./chart-render-coordinator";
import { createChartRenderInputOwner } from "./chart-render-input-owner";
import { createChartRenderCallbackOwner } from "./chart-render-callback-owner";
import { createChartRenderInvalidation } from "./chart-render-invalidation";
import { createChartStateCoordinator } from "./chart-state-coordinator";
import { createChartStateSnapshotInputOwner } from "./chart-state-snapshot-input-owner";
import { createChartStateRestoreCommandOwner } from "./chart-state-restore-command-owner";
import { applyChartTemplate, createChartTemplate, normalizeChartTemplate } from "./chart-template";
import { createChartRuntimeQueryOwner } from "./chart-runtime-query-owner";
import {
  applyMainSeriesBuilderData,
  type HistogramVisual,
} from "./chart-series-data-transforms";
import { formatSeriesKindLabel } from "./chart-series-labels";
import { mountPhaseOneChartDemo } from "./chart-demo-mount";
import { assertCanvasElement } from "./chart-dom-guards";
import { createChartPublicSurfaceOwner } from "./chart-public-surface-owner";
import type { ChartHarnessPublicLike } from "./chart-public-api";
import {
  BAR_SPACING_BOUNDS,
  CHART_BACKGROUND,
  DEFAULT_LAYOUT,
  DEFAULT_RIGHT_OFFSET,
  DRAWING_HIT_TOLERANCE,
  LINE_COLOR,
  MAX_BAR_SPACING,
  MIN_BAR_SPACING,
  createDefaultAreaOptions,
  createDefaultBarOptions,
  createDefaultBaselineOptions,
  createDefaultCandlestickOptions,
  createDefaultCompareOptions,
  createDefaultCrosshairOptions,
  createDefaultDrawingOptions,
  createDefaultHistogramOptions,
  createDefaultLayoutOptions,
  createDefaultLineOptions,
  createDefaultMovingAverageOptions,
  createDefaultPriceLineOptions,
  createDefaultVolumeOptions,
} from "./chart-default-options";

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
type RowSet = ReturnType<SeriesDataStore<number>["setData"]>;

type ResolvedSeriesTarget =
  | { kind: "primary" }
  | { kind: "secondary"; paneId: string };

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
  private readonly chartOptions: Required<NonNullable<PhaseOneChartOptions["layout"]>> = createDefaultLayoutOptions();
  private readonly crosshairOptions: Required<NonNullable<PhaseOneChartOptions["crosshair"]>> =
    createDefaultCrosshairOptions();
  private readonly drawingOptions: RequiredDrawingOptions = createDefaultDrawingOptions();
  private timeAxisFormatter: ((time: number) => string) | null = null;
  private priceAxisFormatter: ((value: number) => string) | null = null;
  private primaryScaleSeriesOnly = false;
  private primaryPriceRangeOverride: PriceRangeImpl | null = null;
  private readonly candlestickOptions: Required<PhaseOneCandlestickSeriesOptions> = createDefaultCandlestickOptions();
  private readonly barOptions: Required<PhaseOneBarSeriesOptions> = createDefaultBarOptions();
  private readonly lineOptions: Required<PhaseOneLineSeriesOptions> = createDefaultLineOptions();
  private readonly defaultCompareOptions: Required<PhaseOneCompareSeriesOptions> = createDefaultCompareOptions();
  private readonly defaultMovingAverageOptions: Required<PhaseOneMovingAverageStudyOptions> =
    createDefaultMovingAverageOptions();
  private readonly areaOptions: Required<PhaseOneAreaSeriesOptions> = createDefaultAreaOptions();
  private readonly baselineOptions: Required<PhaseOneBaselineSeriesOptions> = createDefaultBaselineOptions();
  private readonly histogramOptions: Required<PhaseOneHistogramSeriesOptions> = createDefaultHistogramOptions();
  private readonly volumeOptions: Required<PhaseOneVolumeSeriesOptions> = createDefaultVolumeOptions();
  private readonly defaultPriceLineOptions: Required<PhaseOnePriceLineOptions> = createDefaultPriceLineOptions();
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
    setVisibleLogicalRange: (range) => this.scaleOwner.timeScaleApi().setVisibleLogicalRange(range),
    setVisiblePriceRange: (range) => this.scaleOwner.priceScaleApi().setVisibleRange(range),
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
      setVisibleLogicalRange: (range) => this.scaleOwner.timeScaleApi().setVisibleLogicalRange(range),
      setVisiblePriceRange: (range) => this.scaleOwner.priceScaleApi().setVisibleRange(range),
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
  private readonly renderInputOwner = createChartRenderInputOwner<
    MainSeriesSourceState,
    SeriesSourceState,
    ChartDrawingDescriptor,
    PhaseOneTradeLocationState
  >({
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
  });
  private readonly renderCallbackOwner = createChartRenderCallbackOwner({
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
    emitCrosshairMove: (readout, crosshair) => {
      this.handlerRegistry.emitCrosshairMove(readout, crosshair);
    },
    getCrosshair: () => this.viewState.crosshair(),
    backgroundColor: () => CHART_BACKGROUND,
    resolveBarSpacing: (currentSpacing, paneWidth, pointCount) =>
      resolveBarSpacing(currentSpacing, paneWidth, pointCount, BAR_SPACING_BOUNDS),
  });
  private readonly renderCoordinator = createChartRenderCoordinator({
    ...this.renderInputOwner,
    ...this.renderCallbackOwner,
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
    switchChartType: (chartType) => this.sourceOwner.setChartType(chartType) as PhaseOneMainSeriesApi,
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
  private readonly stateSnapshotInputOwner = createChartStateSnapshotInputOwner<ChartDrawingDescriptor>({
    getLayoutOptions: () => this.chartOptions,
    getCrosshairOptions: () => this.crosshairOptions,
    getBarSpacing: () => this.barSpacing,
    getRightOffset: () => this.rightOffset,
    getVisibleLogicalRange: () => this.scaleOwner.timeScaleApi().getVisibleLogicalRange(),
    getVisiblePriceRange: () => this.scaleOwner.priceScaleApi().getVisibleRange(),
    getPrimaryScaleSeriesOnly: () => this.primaryScaleSeriesOnly,
    getActiveTradeLocation: () => this.tradeLocationOwner.getActiveSession(),
    listDrawings: () => this.drawingOwner.listDrawings(),
    getDrawingOptions: () => this.drawingOptions,
  });
  private readonly stateRestoreCommandOwner = createChartStateRestoreCommandOwner<
    PaneModelState,
    StudySourceState
  >({
    applyOptions: (options) => {
      this.shellOwner.applyOptions(options);
    },
    clearSelection: () => {
      this.drawingOwner.selectDrawing(null, false);
    },
    clearTradeLocation: () => {
      this.tradeLocationOwner.clear();
    },
    removeSourcesWhere: (predicate) => {
      this.chartModel.removeSourcesWhere((source) => predicate(source as StudySourceState));
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
      this.mainSeriesStateOwner.applyState(state);
    },
    getPaneByIndex: (index) => this.panes.getByIndex(index),
    createPaneHandle: (paneId) => this.paneOwner.createPaneHandle(paneId),
    addCandlestickSeries: (target) => this.seriesCommandOwner.addCandlestickSeries(target),
    addBarSeries: (target) => this.seriesCommandOwner.addBarSeries(target),
    addLineSeries: (target) => this.seriesCommandOwner.addLineSeries(target),
    addAreaSeries: (target) => this.seriesCommandOwner.addAreaSeries(target),
    addBaselineSeries: (target) => this.seriesCommandOwner.addBaselineSeries(target),
    addHistogramSeries: (target) => this.seriesCommandOwner.addHistogramSeries(target),
    addVolumeSeries: (target) => this.seriesCommandOwner.addVolumeSeries(target),
    addOverlaySeries: (paneId) => this.seriesCommandOwner.addOverlaySeriesToPane(paneId),
    addCompareSeries: (paneId) => this.seriesCommandOwner.addCompareSeriesToPane(paneId),
    addMovingAverageStudy: (paneId) => this.seriesCommandOwner.addMovingAverageStudyToPane(paneId),
    locateTrade: (request, overlay) => {
      this.tradeLocationOwner.locate(request, overlay);
    },
    restoreDrawings: (drawings) => {
      this.drawingOwner.restoreDrawings(drawings);
    },
    applyTimeScaleOptions: (options) => this.scaleOwner.timeScaleApi().applyOptions(options),
    setVisibleLogicalRange: (range) => this.scaleOwner.timeScaleApi().setVisibleLogicalRange(range),
    applyPriceScaleOptions: (options) => this.scaleOwner.priceScaleApi().applyOptions(options),
    setVisibleRange: (range) => this.scaleOwner.priceScaleApi().setVisibleRange(range),
    hasCanvas: () => this.canvas !== null,
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly stateCoordinator = createChartStateCoordinator({
    getOptions: this.stateSnapshotInputOwner.getOptions,
    getTimeScaleState: this.stateSnapshotInputOwner.getTimeScaleState,
    getPriceScaleState: this.stateSnapshotInputOwner.getPriceScaleState,
    listPanes: () => this.panes.list(),
    getMainSeriesState: () => this.mainSeriesStateOwner.getState(),
    listStudySources: () => this.chartModel.listSourcesByRole("study"),
    getPaneIndex: (paneId) => this.paneOwner.getPaneIndex(paneId),
    getDefaultCompareOptions: () => this.defaultCompareOptions,
    getTradeLocationState: this.stateSnapshotInputOwner.getTradeLocationState,
    listDrawings: this.stateSnapshotInputOwner.listDrawings,
    resolveDrawingMagnetOptions: this.stateSnapshotInputOwner.resolveDrawingMagnetOptions,
    validateDrawings: this.stateSnapshotInputOwner.validateDrawings,
    ...this.stateRestoreCommandOwner,
  });
  private get panes(): PaneCollection {
    return this.chartModel.panes();
  }

  private get primaryPriceScale(): PriceScale {
    return this.chartModel.primaryScale();
  }
  private readonly interactionHandlers = createChartInteractionOwner({
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
    viewState: this.viewState,
    drawingInteractionOwner: this.drawingInteractionOwner,
    paneOwner: this.paneOwner,
    drawingOwner: this.drawingOwner,
    focusCanvas: () => {
      this.canvas?.focus({ preventScroll: true });
    },
    renderCanvas: (canvas) => {
      this.render(canvas);
    },
    buildReadout: (point, layout) => this.renderCoordinator.buildReadout(point, layout),
    emitClick: (readout, point) => {
      this.handlerRegistry.emitClick(readout, point);
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
  private readonly publicSurfaceOwner = createChartPublicSurfaceOwner({
    detach: () => {
      this.canvasLifecycleOwner.detach();
    },
    seriesCommandOwner: this.seriesCommandOwner,
    drawingOwner: this.drawingOwner,
    paneOwner: this.paneOwner,
    shellOwner: this.shellOwner,
    scaleOwner: this.scaleOwner,
    eventSubscriptionOwner: this.eventSubscriptionOwner,
    runtimeQueryOwner: this.runtimeQueryOwner,
    mainSeriesStateOwner: this.mainSeriesStateOwner,
    stateCoordinator: this.stateCoordinator,
    tradeLocationOwner: this.tradeLocationOwner,
    sourceOwner: this.sourceOwner,
  });

  private render(canvas: HTMLCanvasElement): void {
    this.renderCoordinator.render(canvas);
  }

  public attach(canvas: HTMLCanvasElement): void {
    assertCanvasElement(canvas);
    this.canvasLifecycleOwner.attach(canvas);
  }

  public publicApiSurface(): ChartHarnessPublicLike {
    return this.publicSurfaceOwner.publicApiSurface();
  }

}

export function createPhaseOneChart(canvas: HTMLCanvasElement): PhaseOneChartApi {
  return createAttachedChart(canvas, () => new PhaseOneChartHarness());
}

export function mountPhaseOneChartHarness(canvas: HTMLCanvasElement): () => void {
  return mountPhaseOneChartDemo(canvas, createPhaseOneChart);
}
