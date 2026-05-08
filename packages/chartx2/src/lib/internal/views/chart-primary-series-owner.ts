import {
  applyMainSeriesStyleOptions,
  mainSeriesKindForChartType,
  projectMainSeriesStyleOptions,
  type MainSeriesStyleOptionsPatch,
  type MainSeriesStyleOptionsTarget,
  type PhaseOneMainChartType,
  type PhaseOneMainSeriesBuilder,
  type PhaseOneMainStyleSchemaId,
  type PriceScale,
} from "../model";

import type { PreservedMainSeriesState } from "./chart-main-series-source";
import {
  addPrimarySeries,
  attachPrimarySeries,
  type PrimarySeriesFactoryDeps,
} from "./chart-primary-series-factory";
import {
  clonePriceLines,
  type PriceLineState,
} from "./chart-price-line-runtime";
import {
  applySeriesFormatterOptions,
  normalizeSeriesMarkers,
  setSeriesMarkers,
  type SeriesMarkerState,
} from "./chart-series-presentation";
import {
  applyMainSeriesBuilderData,
  normalizeLineBar,
  normalizeLineData,
  type HistogramVisual,
} from "./chart-series-data-transforms";
import type {
  PhaseOneCandlestickData,
  PhaseOneHistogramData,
  PhaseOneMainSeriesApi,
  PhaseOnePriceLineApi,
  PhaseOnePriceLineOptions,
  PhaseOneSeriesMarker,
} from "./chart-api-types";

type PhaseOneSeriesFormatterOptions = {
  valueFormatter?: ((value: number) => string) | null;
};

type PrimarySeriesKind = "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram";

type PrimarySeriesSourceState = MainSeriesStyleOptionsTarget & {
  role: "main-series" | "study";
  inputData: readonly PhaseOneCandlestickData[];
  data: readonly PhaseOneCandlestickData[];
  visuals: Map<number, HistogramVisual>;
  markers: readonly SeriesMarkerState[];
  priceLines: Map<string, PriceLineState>;
  options: object;
  styleSchemaId: PhaseOneMainStyleSchemaId;
  builder: PhaseOneMainSeriesBuilder;
};

type PrimarySeriesSourceInput<Api extends PhaseOneMainSeriesApi> = {
  paneId: "primary";
  chartType: PhaseOneMainChartType;
  kind: PrimarySeriesKind;
  api: Api;
  meta: { id: string; label: string };
  priceScale: PriceScale;
  priceScaleId: "primary-right";
};

export type ChartPrimarySeriesOwnerDeps<
  Api extends PhaseOneMainSeriesApi,
  Source extends PrimarySeriesSourceState,
> = {
  getCurrentMainSourceId(): string | null;
  getPrimaryPriceScale(): PriceScale;
  createMeta(chartType: PhaseOneMainChartType): { id: string; label: string };
  createLabel(chartType: PhaseOneMainChartType, id: string): string;
  createSourceState(input: PrimarySeriesSourceInput<Api>): Source;
  registerSource(source: Source): void;
  syncMainSource(source: Source): void;
  assertSeriesActive(api: PhaseOneMainSeriesApi): void;
  getSourceByApi(api: PhaseOneMainSeriesApi, sourceKind: PrimarySeriesKind): Source;
  render(): void;
  setPrimaryData(data: readonly PhaseOneCandlestickData[]): void;
  updatePrimaryData(bar: PhaseOneCandlestickData): void;
  setPrimaryHistogramLikeData(data: readonly PhaseOneHistogramData[]): void;
  updatePrimaryHistogramLikeData(bar: PhaseOneHistogramData): void;
  createPriceLineState(options?: PhaseOnePriceLineOptions): PriceLineState;
  createPriceLine(lines: Map<string, PriceLineState>, state: PriceLineState): PhaseOnePriceLineApi;
  removePriceLine(lines: Map<string, PriceLineState>, line: PhaseOnePriceLineApi): void;
};

export function createChartPrimarySeriesOwner<
  Api extends PhaseOneMainSeriesApi,
  Source extends PrimarySeriesSourceState,
>(deps: ChartPrimarySeriesOwnerDeps<Api, Source>) {
  const createFactoryDeps = (): PrimarySeriesFactoryDeps<
    Api,
    Source,
    HistogramVisual,
    SeriesMarkerState,
    PriceLineState,
    Source["options"],
    PhaseOneMainStyleSchemaId
  > => ({
    currentMainSourceId: deps.getCurrentMainSourceId(),
    createMeta: (chartType) => deps.createMeta(chartType),
    createLabel: (chartType, id) => deps.createLabel(chartType, id),
    createSourceState: (chartType, api, meta) =>
      deps.createSourceState({
        paneId: "primary",
        chartType,
        kind: mainSeriesKindForChartType(chartType),
        api,
        meta,
        priceScale: deps.getPrimaryPriceScale(),
        priceScaleId: "primary-right",
      }),
    clonePriceLines,
    projectOptions: (previousStyleSchemaId, nextStyleSchemaId, preservedOptions, currentOptions) =>
      projectMainSeriesStyleOptions(
        previousStyleSchemaId,
        nextStyleSchemaId,
        preservedOptions,
        currentOptions as Record<string, unknown>,
      ) as Source["options"],
    rebuildData: (source) => {
      source.data = applyMainSeriesBuilderData(source.inputData, source);
    },
    registerSource: (source) => deps.registerSource(source),
    syncContext: (source) => deps.syncMainSource(source),
    assertSeriesActive: (api) => deps.assertSeriesActive(api),
    getSource: (api, sourceKind) => deps.getSourceByApi(api, sourceKind),
    applySeriesFormatterOptions: (seriesOptions, options) =>
      applySeriesFormatterOptions(
        seriesOptions as PhaseOneSeriesFormatterOptions,
        options as PhaseOneSeriesFormatterOptions,
      ),
    applyMainSeriesTypeSpecificOptions: (source, options) => {
      const mainSource = source as Source;
      return applyMainSeriesStyleOptions(
        mainSource.styleSchemaId,
        mainSource,
        options as MainSeriesStyleOptionsPatch,
      );
    },
    rebuildMainSource: (source) => {
      const mainSource = source as Source;
      mainSource.data = applyMainSeriesBuilderData(mainSource.inputData, mainSource);
      deps.syncMainSource(mainSource);
    },
    render: () => {
      deps.render();
    },
    setPrimaryData: (data) => deps.setPrimaryData(data),
    updatePrimary: (bar) => deps.updatePrimaryData(bar),
    setPrimaryHistogramLikeData: (data) => deps.setPrimaryHistogramLikeData(data),
    updatePrimaryHistogramLike: (bar) => deps.updatePrimaryHistogramLikeData(bar),
    normalizeLineData,
    normalizeLineBar,
    setMarkers: (api, markers, sourceKind) => {
      const state = deps.getSourceByApi(api, sourceKind);
      setSeriesMarkers(state, markers, {
        normalizeMarkers: (nextMarkers) => normalizeSeriesMarkers(nextMarkers as readonly PhaseOneSeriesMarker[]),
        render: () => {
          deps.render();
        },
      });
    },
    createPriceLineState: (options) => deps.createPriceLineState(options),
    createPriceLine: (lines, state) => deps.createPriceLine(lines, state),
    removePriceLine: (lines, line) => deps.removePriceLine(lines, line),
  });

  return {
    add(kind: PhaseOneMainChartType): Api {
      return addPrimarySeries(kind, createFactoryDeps());
    },
    attach(
      kind: PhaseOneMainChartType,
      preserved?: PreservedMainSeriesState<
        PhaseOneCandlestickData,
        HistogramVisual,
        SeriesMarkerState,
        PriceLineState,
        PhaseOneMainStyleSchemaId
      >,
    ): Api {
      return attachPrimarySeries(kind, preserved, createFactoryDeps());
    },
  };
}
