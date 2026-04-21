import {
  applyCompareStudyOptions,
  applyMovingAverageStudyOptions,
  getCompareStudyOptions,
  getMovingAverageStudyOptions,
} from "./chart-study-options";
import {
  applySeriesFormatterOptions,
  normalizeSeriesMarkers,
  setSeriesMarkers,
  type SeriesMarkerState,
} from "./chart-series-presentation";
import {
  setSecondaryData,
  setSecondaryHistogramLikeData,
  updateSecondaryData,
  updateSecondaryHistogramLikeData,
} from "./chart-secondary-series-runtime";
import {
  normalizeLineBar,
  normalizeLineData,
  type HistogramVisual,
} from "./chart-series-data-transforms";
import type {
  PhaseOneCandlestickData,
  PhaseOneCompareSeriesOptions,
  PhaseOneHistogramData,
  PhaseOneMovingAverageStudyOptions,
  PhaseOnePriceLineApi,
  PhaseOnePriceLineOptions,
  PhaseOneSeriesMarker,
  PhaseOneVolumeData,
} from "./chart-api-types";
import type { PriceLineState } from "./chart-price-line-runtime";
import type { SecondarySeriesKind } from "./chart-secondary-series-factory";

type PhaseOneSeriesFormatterOptions = {
  valueFormatter?: ((value: number) => string) | null;
};

type SecondarySeriesSourceState = {
  inputData: readonly PhaseOneCandlestickData[];
  data: readonly unknown[];
  visuals: Map<number, HistogramVisual>;
  markers: readonly SeriesMarkerState[];
  priceLines: Map<string, PriceLineState>;
  options: PhaseOneSeriesFormatterOptions;
};

type CompareStudyState = SecondarySeriesSourceState & {
  compareOptions?: Required<PhaseOneCompareSeriesOptions>;
  inputContext: {
    mode: "chart-context" | "requested-context";
    symbol: string | null;
    resolution: string | null;
    session: string | null;
    timezone: string | null;
    mergePolicy: "carry-forward" | "gaps" | "exact";
  };
};

type MovingAverageStudyState = SecondarySeriesSourceState & {
  indicator?: {
    kind: "moving-average";
    length: number;
  };
  inputContext: CompareStudyState["inputContext"];
};

export function createChartSecondarySeriesApiOwner(deps: {
  assertSeriesActive(api: unknown): void;
  getSourceByApiOrThrow(api: unknown, message: string): SecondarySeriesSourceState;
  resolveDisplayData(source: SecondarySeriesSourceState): readonly unknown[];
  resetViewport(): void;
  render(): void;
  updateCanonical(
    existing: readonly PhaseOneCandlestickData[],
    bar: PhaseOneCandlestickData,
  ): readonly PhaseOneCandlestickData[];
  buildHistogramVisuals(data: readonly PhaseOneHistogramData[]): Map<number, HistogramVisual>;
  normalizeHistogramData(data: readonly PhaseOneHistogramData[]): readonly PhaseOneCandlestickData[];
  normalizeHistogramBar(bar: PhaseOneHistogramData): PhaseOneCandlestickData;
  createPriceLineState(options?: PhaseOnePriceLineOptions): PriceLineState;
  createPriceLine(lines: Map<string, PriceLineState>, state: PriceLineState): PhaseOnePriceLineApi;
  removePriceLine(lines: Map<string, PriceLineState>, line: PhaseOnePriceLineApi): void;
  defaultCompareOptions: Required<PhaseOneCompareSeriesOptions>;
  defaultMovingAverageOptions: Required<PhaseOneMovingAverageStudyOptions>;
}) {
  const getSource = (api: unknown) =>
    deps.getSourceByApiOrThrow(api, "chartx phase-one series has been removed");

  return {
    assertSeriesActive: (api: unknown) => deps.assertSeriesActive(api),
    applySeriesFormatterOptions: (seriesOptions: object, options: object) =>
      applySeriesFormatterOptions(
        seriesOptions as PhaseOneSeriesFormatterOptions,
        options as PhaseOneSeriesFormatterOptions,
      ),
    render: () => {
      deps.render();
    },
    setSecondaryData: (api: unknown, data: readonly unknown[], _kind: SecondarySeriesKind) =>
      setSecondaryData(getSource(api), data as readonly PhaseOneCandlestickData[], {
        resolveDisplayData: (source) => deps.resolveDisplayData(source),
        resetViewport: deps.resetViewport,
        render: deps.render,
      }),
    updateSecondary: (api: unknown, bar: unknown, _kind: SecondarySeriesKind) =>
      updateSecondaryData(getSource(api), bar as PhaseOneCandlestickData, {
        updateCanonical: (existing, nextBar) => deps.updateCanonical(existing, nextBar),
        resolveDisplayData: (source) => deps.resolveDisplayData(source),
        render: deps.render,
      }),
    setSecondaryHistogramLikeData: (
      api: unknown,
      data: readonly unknown[],
      _kind: "histogram" | "volume",
    ) =>
      setSecondaryHistogramLikeData(
        getSource(api),
        data as readonly (PhaseOneHistogramData | PhaseOneVolumeData)[],
        {
          buildVisuals: (rows) => deps.buildHistogramVisuals(rows as readonly PhaseOneHistogramData[]),
          normalizeData: (rows) => deps.normalizeHistogramData(rows as readonly PhaseOneHistogramData[]),
          resolveDisplayData: (source) => deps.resolveDisplayData(source),
          resetViewport: deps.resetViewport,
          render: deps.render,
        },
      ),
    updateSecondaryHistogramLike: (
      api: unknown,
      bar: unknown,
      _kind: "histogram" | "volume",
    ) =>
      updateSecondaryHistogramLikeData(
        getSource(api),
        bar as PhaseOneHistogramData | PhaseOneVolumeData,
        {
          normalizeBar: (nextBar) => deps.normalizeHistogramBar(nextBar as PhaseOneHistogramData),
          updateCanonical: (existing, nextValue) => deps.updateCanonical(existing, nextValue),
          resolveDisplayData: (source) => deps.resolveDisplayData(source),
          render: deps.render,
        },
      ),
    normalizeLineData,
    normalizeLineBar,
    setMarkers: (api: unknown, markers: readonly unknown[], _kind: SecondarySeriesKind) => {
      setSeriesMarkers(getSource(api), markers as readonly PhaseOneSeriesMarker[], {
        normalizeMarkers: (nextMarkers) =>
          normalizeSeriesMarkers(nextMarkers as readonly PhaseOneSeriesMarker[]),
        render: deps.render,
      });
    },
    createPriceLine: (source: unknown, options?: unknown) =>
      deps.createPriceLine(
        (source as SecondarySeriesSourceState).priceLines,
        deps.createPriceLineState(options as PhaseOnePriceLineOptions | undefined),
      ),
    removePriceLine: (source: unknown, line: unknown) => {
      deps.removePriceLine(
        (source as SecondarySeriesSourceState).priceLines,
        line as PhaseOnePriceLineApi,
      );
    },
    applyCompareOptions: (state: unknown, options: unknown) =>
      applyCompareStudyOptions(
        state as CompareStudyState,
        options as Partial<PhaseOneCompareSeriesOptions>,
        {
          defaultCompareOptions: deps.defaultCompareOptions,
          resolveDisplayData: (study) =>
            deps.resolveDisplayData(study as unknown as SecondarySeriesSourceState),
          render: deps.render,
        },
      ),
    getCompareOptions: (state: unknown) =>
      getCompareStudyOptions(state as CompareStudyState, deps.defaultCompareOptions),
    applyMovingAverageStudyOptions: (state: unknown, options: unknown) =>
      applyMovingAverageStudyOptions(
        state as unknown as MovingAverageStudyState,
        options as Partial<PhaseOneMovingAverageStudyOptions>,
        {
          defaultMovingAverageOptions: deps.defaultMovingAverageOptions,
          resolveDisplayData: (study) =>
            deps.resolveDisplayData(study as unknown as SecondarySeriesSourceState),
          render: deps.render,
        },
      ),
    getMovingAverageStudyOptions: (state: unknown) =>
      getMovingAverageStudyOptions(
        state as unknown as MovingAverageStudyState,
        deps.defaultMovingAverageOptions,
      ),
  };
}
