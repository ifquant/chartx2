import {
  mainSeriesChartTypeSpec,
  type PhaseOneMainChartType,
  type PhaseOneMainSeriesBuilder,
  type PhaseOneMainSeriesInputCapability,
  type PhaseOneMainSeriesRenderer,
  type PhaseOneMainStyleSchemaId,
} from "./main-series-chart-types";
import { PriceScale } from "./price-scale";
import { SeriesDataStore } from "./series-data";

export type StudySourceKind = "series" | "indicator" | "overlay" | "compare";

export type StudyInputContextState = {
  mode: "chart-context" | "requested-context";
  symbol: string | null;
  resolution: string | null;
  session: string | null;
  timezone: string | null;
  mergePolicy: "carry-forward" | "gaps" | "exact";
};

export type MovingAverageIndicatorState = {
  kind: "moving-average";
  length: number;
};

export type SeriesRuntimeFields<
  Data,
  Api,
  Options,
  Visual,
  PriceLineState,
  MarkerState,
> = {
  api: Api;
  data: readonly Data[];
  store: SeriesDataStore<number>;
  priceScale: PriceScale;
  visuals: Map<number, Visual>;
  priceLines: Map<string, PriceLineState>;
  markers: readonly MarkerState[];
  options: Options;
};

export type MainSeriesDescriptor = {
  chartType: PhaseOneMainChartType;
  inputCapability: PhaseOneMainSeriesInputCapability;
  builder: PhaseOneMainSeriesBuilder;
  renderer: PhaseOneMainSeriesRenderer;
  styleSchemaId: PhaseOneMainStyleSchemaId;
};

export function createDefaultStudyInputContext(): StudyInputContextState {
  return {
    mode: "chart-context",
    symbol: null,
    resolution: null,
    session: null,
    timezone: null,
    mergePolicy: "carry-forward",
  };
}

export function createSeriesRuntimeFields<
  Data,
  Api,
  Options,
  Visual,
  PriceLineState,
  MarkerState,
>(params: {
  api: Api;
  priceScale: PriceScale;
  options: Options;
}): SeriesRuntimeFields<Data, Api, Options, Visual, PriceLineState, MarkerState> {
  return {
    api: params.api,
    data: [],
    store: new SeriesDataStore<number>(),
    priceScale: params.priceScale,
    visuals: new Map<number, Visual>(),
    priceLines: new Map<string, PriceLineState>(),
    markers: [],
    options: params.options,
  };
}

export function createMainSeriesDescriptor(
  chartType: PhaseOneMainChartType,
): MainSeriesDescriptor {
  const spec = mainSeriesChartTypeSpec(chartType);
  return {
    chartType,
    inputCapability: spec.inputCapability,
    builder: spec.builder,
    renderer: spec.renderer,
    styleSchemaId: spec.styleSchemaId,
  };
}
