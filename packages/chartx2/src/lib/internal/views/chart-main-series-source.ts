import {
  PriceScale,
  createMainSeriesDescriptor,
  createSeriesRuntimeFields,
  type KagiStyleOptionsState,
  type PhaseOneMainChartType,
  type PhaseOneMainStyleSchemaId,
  type PointFigureStyleOptionsState,
  type RenkoStyleOptionsState,
} from "../model";

export type MainSeriesSourceDefaults = {
  lineBreakOptions: { lineCount: number };
  renkoOptions: Required<RenkoStyleOptionsState>;
  pointFigureOptions: Required<PointFigureStyleOptionsState>;
  kagiOptions: Required<KagiStyleOptionsState>;
};

export function createMainSeriesSourceState<
  Data,
  Api,
  Kind extends string,
  Options,
  Visual,
  PriceLineState,
  MarkerState,
>(
  params: {
    paneId: string;
    chartType: PhaseOneMainChartType;
    kind: Kind;
    api: Api;
    meta: { id: string; label: string };
    priceScale: PriceScale;
    priceScaleId: string;
    defaults: MainSeriesSourceDefaults;
    createOptions(styleSchemaId: PhaseOneMainStyleSchemaId): Options;
  },
) {
  const chartTypeDescriptor = createMainSeriesDescriptor(params.chartType);
  return {
    id: params.meta.id,
    label: params.meta.label,
    kind: params.kind,
    role: "main-series" as const,
    ...chartTypeDescriptor,
    inputData: [] as Data[],
    lineBreakOptions: {
      lineCount: params.defaults.lineBreakOptions.lineCount,
    },
    renkoOptions: {
      boxSize: params.defaults.renkoOptions.boxSize,
      boxSizeMode: params.defaults.renkoOptions.boxSizeMode,
    },
    pointFigureOptions: {
      boxSize: params.defaults.pointFigureOptions.boxSize,
      boxSizeMode: params.defaults.pointFigureOptions.boxSizeMode,
      boxSizeScale: params.defaults.pointFigureOptions.boxSizeScale,
      reversalBoxes: params.defaults.pointFigureOptions.reversalBoxes,
      atrLength: params.defaults.pointFigureOptions.atrLength,
      percentageValue: params.defaults.pointFigureOptions.percentageValue,
    },
    kagiOptions: {
      reversalMode: params.defaults.kagiOptions.reversalMode,
      reversalSize: params.defaults.kagiOptions.reversalSize,
      reversalScale: params.defaults.kagiOptions.reversalScale,
      atrLength: params.defaults.kagiOptions.atrLength,
      percentageValue: params.defaults.kagiOptions.percentageValue,
    },
    paneId: params.paneId,
    priceScaleId: params.priceScaleId,
    visible: true,
    ...createSeriesRuntimeFields<Data, Api, Options, Visual, PriceLineState, MarkerState>({
      api: params.api,
      priceScale: params.priceScale,
      options: params.createOptions(chartTypeDescriptor.styleSchemaId),
    }),
  };
}

export type PreservedMainSeriesState<Data, Visual, MarkerState, PriceLineState, StyleSchemaId> = {
  id: string;
  label: string;
  data: readonly Data[];
  visuals: ReadonlyMap<number, Visual>;
  markers: readonly MarkerState[];
  priceLines: ReadonlyMap<string, PriceLineState>;
  options?: Record<string, unknown>;
  previousStyleSchemaId?: StyleSchemaId;
};

export function attachMainSeriesSource<
  Api,
  Source extends {
    inputData: readonly Data[];
    visuals: Map<number, Visual>;
    markers: readonly MarkerState[];
    priceLines: Map<string, PriceLineState>;
    options: Options;
    styleSchemaId: StyleSchemaId;
  },
  ChartType,
  Data,
  Visual,
  MarkerState,
  PriceLineState,
  Options,
  StyleSchemaId,
>(
  kind: ChartType,
  preserved: PreservedMainSeriesState<Data, Visual, MarkerState, PriceLineState, StyleSchemaId> | undefined,
  deps: {
    currentMainSourceId: string | null;
    createMeta(kind: ChartType): { id: string; label: string };
    createLabel(kind: ChartType, id: string): string;
    createApi(kind: ChartType): Api;
    createSourceState(kind: ChartType, api: Api, meta: { id: string; label: string }): Source;
    clonePriceLines(lines: ReadonlyMap<string, PriceLineState>): Map<string, PriceLineState>;
    projectOptions(
      previousStyleSchemaId: StyleSchemaId,
      nextStyleSchemaId: StyleSchemaId,
      preservedOptions: Record<string, unknown>,
      currentOptions: Options,
    ): Options;
    rebuildData(source: Source): void;
    registerSource(source: Source): void;
    syncContext(source: Source): void;
  },
): Api {
  if (deps.currentMainSourceId !== null) {
    throw new Error("chartx phase-one chart supports only one primary series");
  }

  const meta =
    preserved === undefined
      ? deps.createMeta(kind)
      : { id: preserved.id, label: deps.createLabel(kind, preserved.id) };
  const api = deps.createApi(kind);
  const source = deps.createSourceState(kind, api, meta);

  if (preserved !== undefined) {
    source.inputData = [...preserved.data];
    source.visuals = new Map(preserved.visuals);
    source.markers = [...preserved.markers];
    source.priceLines = deps.clonePriceLines(preserved.priceLines);
    if (preserved.options !== undefined && preserved.previousStyleSchemaId !== undefined) {
      source.options = deps.projectOptions(
        preserved.previousStyleSchemaId,
        source.styleSchemaId,
        preserved.options,
        source.options,
      );
    }
  }

  deps.rebuildData(source);
  deps.registerSource(source);
  deps.syncContext(source);
  return api;
}
