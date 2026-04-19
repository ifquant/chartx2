import type { MainSeriesStyleOptionsPatch, PhaseOneMainChartType } from "../model";

import {
  attachMainSeriesSource,
  type PreservedMainSeriesState,
} from "./chart-main-series-source";
import { createPrimarySeriesApi } from "./chart-primary-series-api";
import type {
  PhaseOneCandlestickData,
  PhaseOneHistogramData,
  PhaseOneMainSeriesApi,
  PhaseOnePriceLineApi,
  PhaseOnePriceLineOptions,
  PhaseOneSeriesMarker,
} from "./chart-harness";

type PrimarySeriesKind = "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram";

type PrimarySeriesState<Options = unknown> = {
  inputData: readonly unknown[];
  data: readonly unknown[];
  options: Options;
  priceLines: Map<string, unknown>;
  role: "main-series" | "study";
};

export type PrimarySeriesFactoryDeps<
  Api,
  Source extends {
    inputData: readonly PhaseOneCandlestickData[];
    data: readonly PhaseOneCandlestickData[];
    visuals: Map<number, Visual>;
    markers: readonly MarkerState[];
    priceLines: Map<string, PriceLineState>;
    options: Options;
    styleSchemaId: StyleSchemaId;
  },
  Visual,
  MarkerState,
  PriceLineState,
  Options extends object,
  StyleSchemaId,
> = {
  currentMainSourceId: string | null;
  createMeta(kind: PhaseOneMainChartType): { id: string; label: string };
  createLabel(kind: PhaseOneMainChartType, id: string): string;
  createSourceState(
    kind: PhaseOneMainChartType,
    api: Api,
    meta: { id: string; label: string },
  ): Source;
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
  assertSeriesActive(api: PhaseOneMainSeriesApi): void;
  getSource(api: PhaseOneMainSeriesApi, kind: PrimarySeriesKind): PrimarySeriesState;
  applySeriesFormatterOptions(seriesOptions: object, options: object): void;
  applyMainSeriesTypeSpecificOptions(
    source: PrimarySeriesState,
    options: MainSeriesStyleOptionsPatch,
  ): boolean;
  rebuildMainSource(source: PrimarySeriesState): void;
  render(): void;
  setPrimaryData(data: readonly PhaseOneCandlestickData[]): void;
  updatePrimary(bar: PhaseOneCandlestickData): void;
  setPrimaryHistogramLikeData(data: readonly PhaseOneHistogramData[]): void;
  updatePrimaryHistogramLike(bar: PhaseOneHistogramData): void;
  normalizeLineData(data: readonly { time: number; value: number }[]): readonly PhaseOneCandlestickData[];
  normalizeLineBar(bar: { time: number; value: number }): PhaseOneCandlestickData;
  setMarkers(
    api: PhaseOneMainSeriesApi,
    markers: readonly PhaseOneSeriesMarker[],
    kind: PrimarySeriesKind,
  ): void;
  createPriceLineState(options?: PhaseOnePriceLineOptions): PriceLineState;
  createPriceLine(
    lines: Map<string, PriceLineState>,
    state: PriceLineState,
  ): PhaseOnePriceLineApi;
  removePriceLine(lines: Map<string, PriceLineState>, line: PhaseOnePriceLineApi): void;
};

export function attachPrimarySeries<
  Api extends PhaseOneMainSeriesApi,
  Source extends {
    inputData: readonly PhaseOneCandlestickData[];
    data: readonly PhaseOneCandlestickData[];
    visuals: Map<number, Visual>;
    markers: readonly MarkerState[];
    priceLines: Map<string, PriceLineState>;
    options: Options;
    styleSchemaId: StyleSchemaId;
  },
  Visual,
  MarkerState,
  PriceLineState,
  Options extends object,
  StyleSchemaId,
>(
  kind: PhaseOneMainChartType,
  preserved: PreservedMainSeriesState<
    PhaseOneCandlestickData,
    Visual,
    MarkerState,
    PriceLineState,
    StyleSchemaId
  > | undefined,
  deps: PrimarySeriesFactoryDeps<Api, Source, Visual, MarkerState, PriceLineState, Options, StyleSchemaId>,
): Api {
  return attachMainSeriesSource(
    kind,
    preserved,
    {
      currentMainSourceId: deps.currentMainSourceId,
      createMeta: deps.createMeta,
      createLabel: deps.createLabel,
      createApi: (chartType) =>
        createPrimarySeriesApi(chartType, {
          assertSeriesActive: deps.assertSeriesActive,
          getSource: deps.getSource,
          applySeriesFormatterOptions: deps.applySeriesFormatterOptions,
          applyMainSeriesTypeSpecificOptions: deps.applyMainSeriesTypeSpecificOptions,
          rebuildMainSource: deps.rebuildMainSource,
          render: deps.render,
          setPrimaryData: deps.setPrimaryData,
          updatePrimary: deps.updatePrimary,
          setPrimaryHistogramLikeData: deps.setPrimaryHistogramLikeData,
          updatePrimaryHistogramLike: deps.updatePrimaryHistogramLike,
          normalizeLineData: deps.normalizeLineData as never,
          normalizeLineBar: deps.normalizeLineBar as never,
          setMarkers: deps.setMarkers,
          createPriceLine: (api, sourceKind, options) => {
            const state = deps.getSource(api, sourceKind) as PrimarySeriesState & {
              priceLines: Map<string, PriceLineState>;
            };
            return deps.createPriceLine(state.priceLines, deps.createPriceLineState(options));
          },
          removePriceLine: (api, sourceKind, line) => {
            const state = deps.getSource(api, sourceKind) as PrimarySeriesState & {
              priceLines: Map<string, PriceLineState>;
            };
            deps.removePriceLine(state.priceLines, line);
          },
        }) as Api,
      createSourceState: deps.createSourceState,
      clonePriceLines: deps.clonePriceLines,
      projectOptions: deps.projectOptions,
      rebuildData: deps.rebuildData,
      registerSource: deps.registerSource,
      syncContext: deps.syncContext,
    },
  );
}

export function addPrimarySeries<
  Api extends PhaseOneMainSeriesApi,
  Source extends {
    inputData: readonly PhaseOneCandlestickData[];
    data: readonly PhaseOneCandlestickData[];
    visuals: Map<number, Visual>;
    markers: readonly MarkerState[];
    priceLines: Map<string, PriceLineState>;
    options: Options;
    styleSchemaId: StyleSchemaId;
  },
  Visual,
  MarkerState,
  PriceLineState,
  Options extends object,
  StyleSchemaId,
>(
  kind: PhaseOneMainChartType,
  deps: PrimarySeriesFactoryDeps<Api, Source, Visual, MarkerState, PriceLineState, Options, StyleSchemaId>,
): Api {
  return attachPrimarySeries(kind, undefined, deps);
}
