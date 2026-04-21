import type {
  KagiStyleOptionsState,
  MovingAverageIndicatorState,
  PhaseOneMainChartType,
  PhaseOneMainSeriesBuilder,
  PhaseOneMainSeriesInputCapability,
  PhaseOneMainSeriesRenderer,
  PhaseOneMainStyleSchemaId,
  PointFigureStyleOptionsState,
  RenkoStyleOptionsState,
  SeriesDataStore,
  SeriesRuntimeFields,
  SourceDescriptor,
  StudyInputContextState,
  StudySourceKind,
} from "../model";
import type {
  PhaseOneAreaSeriesApi,
  PhaseOneAreaSeriesOptions,
  PhaseOneBarSeriesApi,
  PhaseOneBarSeriesOptions,
  PhaseOneBaselineSeriesApi,
  PhaseOneBaselineSeriesOptions,
  PhaseOneCandlestickData,
  PhaseOneCandlestickSeriesApi,
  PhaseOneCandlestickSeriesOptions,
  PhaseOneChartOptions,
  PhaseOneCompareSeriesOptions,
  PhaseOneHistogramSeriesApi,
  PhaseOneHistogramSeriesOptions,
  PhaseOneHorizontalLineDrawingApi,
  PhaseOneLineSeriesApi,
  PhaseOneLineSeriesOptions,
  PhaseOneTrendLineDrawingApi,
  PhaseOneVolumeSeriesApi,
  PhaseOneVolumeSeriesOptions,
} from "./chart-harness";
import type { PriceLineState } from "./chart-price-line-runtime";
import type { HistogramVisual } from "./chart-series-data-transforms";
import type { SeriesMarkerState } from "./chart-series-presentation";

export type RequiredDrawingMagnetSources = Required<
  NonNullable<NonNullable<PhaseOneChartOptions["drawings"]>["magnetSources"]>
>;

export type RequiredDrawingOptions = {
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

export type DrawingMagnetOverrideState = {
  magnetEnabled?: boolean;
  magnetTolerancePx?: number;
  timeMagnetEnabled?: boolean;
  timeMagnetPolicy?: "nearest" | "previous" | "next";
  timeMagnetTolerancePx?: number;
  magnetSources?: Partial<RequiredDrawingMagnetSources>;
};

export type ChartDrawingKind = "horizontal-line" | "trend-line";

export type HorizontalLineDrawingState = {
  kind: "horizontal-line";
  line: PriceLineState;
} & DrawingMagnetOverrideState;

export type TrendLineDrawingState = {
  kind: "trend-line";
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
  color: string;
  lineWidth: number;
} & DrawingMagnetOverrideState;

export type ChartDrawingApi = PhaseOneHorizontalLineDrawingApi | PhaseOneTrendLineDrawingApi;

export type ChartDrawingState = {
  api: ChartDrawingApi;
} & (HorizontalLineDrawingState | TrendLineDrawingState);

export type HorizontalLineDrawingDescriptor = {
  id: string;
  kind: "horizontal-line";
  paneId: string;
  visible: boolean;
  api: PhaseOneHorizontalLineDrawingApi;
} & HorizontalLineDrawingState;

export type TrendLineDrawingDescriptor = {
  id: string;
  kind: "trend-line";
  paneId: string;
  visible: boolean;
  api: PhaseOneTrendLineDrawingApi;
} & TrendLineDrawingState;

export type ChartDrawingDescriptor = HorizontalLineDrawingDescriptor | TrendLineDrawingDescriptor;

export type ChartSeriesKind = "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume";

export type ChartSeriesApi =
  | PhaseOneCandlestickSeriesApi
  | PhaseOneBarSeriesApi
  | PhaseOneLineSeriesApi
  | PhaseOneAreaSeriesApi
  | PhaseOneBaselineSeriesApi
  | PhaseOneHistogramSeriesApi
  | PhaseOneVolumeSeriesApi;

export type BaseSeriesSourceState = SeriesRuntimeFields<
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

export type MainSeriesSourceState = SourceDescriptor<ChartSeriesKind, ChartSeriesApi> & BaseSeriesSourceState & {
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

export type StudySourceState = SourceDescriptor<ChartSeriesKind, ChartSeriesApi> & BaseSeriesSourceState & {
  role: "study";
  studyKind: StudySourceKind;
  inputData: readonly PhaseOneCandlestickData[];
  inputContext: StudyInputContextState;
  indicator?: MovingAverageIndicatorState;
  compareOptions?: Required<PhaseOneCompareSeriesOptions>;
};

export type SeriesSourceState = MainSeriesSourceState | StudySourceState;
export type SecondaryApiSourceState = Pick<SeriesSourceState, "options" | "priceLines">;
export type RowSet = ReturnType<SeriesDataStore<number>["setData"]>;

export type ResolvedSeriesTarget =
  | { kind: "primary" }
  | { kind: "secondary"; paneId: string };
