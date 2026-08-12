import { createMainSeriesSourceState } from "./chart-main-series-source";
import type {
  PhaseOneBarSeriesOptions,
  PhaseOneCandlestickData,
  PhaseOneCandlestickSeriesOptions,
  PhaseOneAreaSeriesOptions,
  PhaseOneBaselineSeriesOptions,
  PhaseOneHistogramSeriesOptions,
  PhaseOneLineSeriesOptions,
  PhaseOneSeriesMarkerPosition,
  PhaseOneSeriesMarkerShape,
  PhaseOneVolumeSeriesOptions,
} from "./chart-api-types";
import type {
  PhaseOneMainChartType,
  PhaseOneMainStyleSchemaId,
  PriceScale,
} from "../model";

type HistogramVisual = {
  color?: string;
  isUp: boolean;
};

type PriceLineState = {
  id: string;
  price: number;
  color: string;
  lineWidth: number;
  title: string;
};

type SeriesMarkerState = {
  markerId: string;
  time: number;
  position: PhaseOneSeriesMarkerPosition;
  shape: PhaseOneSeriesMarkerShape;
  color: string;
  text: string;
  usesDefaultColor?: boolean;
};

type ChartSeriesKind = "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume";

type MainSeriesSourceState = {
  options:
    | Required<PhaseOneCandlestickSeriesOptions>
    | Required<PhaseOneBarSeriesOptions>
    | Required<PhaseOneLineSeriesOptions>
    | Required<PhaseOneAreaSeriesOptions>
    | Required<PhaseOneBaselineSeriesOptions>
    | Required<PhaseOneHistogramSeriesOptions>;
};

type BuilderOptionDefaults = {
  candlestickOptions: Required<PhaseOneCandlestickSeriesOptions>;
  barOptions: Required<PhaseOneBarSeriesOptions>;
  lineOptions: Required<PhaseOneLineSeriesOptions>;
  areaOptions: Required<PhaseOneAreaSeriesOptions>;
  baselineOptions: Required<PhaseOneBaselineSeriesOptions>;
  histogramOptions: Required<PhaseOneHistogramSeriesOptions>;
  volumeOptions: Required<PhaseOneVolumeSeriesOptions>;
};

export function createSeriesLabel(
  kind: string,
  id: string,
  deps: {
    formatSeriesKindLabel(kind: string): string;
  },
): string {
  const ordinal = id.startsWith("series-") ? id.slice("series-".length) : id;
  return `${deps.formatSeriesKindLabel(kind)} ${ordinal}`;
}

export function createSeriesMeta(
  kind: string,
  ordinal: number,
  deps: {
    formatSeriesKindLabel(kind: string): string;
  },
): { id: string; label: string } {
  const id = `series-${ordinal}`;
  return {
    id,
    label: createSeriesLabel(kind, id, deps),
  };
}

export function createSeriesOptions(
  kind: ChartSeriesKind,
  defaults: BuilderOptionDefaults,
):
  | Required<PhaseOneCandlestickSeriesOptions>
  | Required<PhaseOneBarSeriesOptions>
  | Required<PhaseOneLineSeriesOptions>
  | Required<PhaseOneAreaSeriesOptions>
  | Required<PhaseOneBaselineSeriesOptions>
  | Required<PhaseOneHistogramSeriesOptions>
  | Required<typeof defaults.volumeOptions> {
  switch (kind) {
    case "candlestick":
      return { ...defaults.candlestickOptions };
    case "bar":
      return { ...defaults.barOptions };
    case "line":
      return { ...defaults.lineOptions };
    case "area":
      return { ...defaults.areaOptions };
    case "baseline":
      return { ...defaults.baselineOptions };
    case "histogram":
      return { ...defaults.histogramOptions };
    case "volume":
      return { ...defaults.volumeOptions };
  }
}

export function createMainSeriesOptions(
  styleSchemaId: PhaseOneMainStyleSchemaId,
  defaults: Omit<BuilderOptionDefaults, "volumeOptions">,
  deps: {
    optionSurface(styleSchemaId: PhaseOneMainStyleSchemaId): "candlestick" | "bar" | "line" | "area" | "baseline" | "histogram";
  },
):
  | Required<PhaseOneCandlestickSeriesOptions>
  | Required<PhaseOneBarSeriesOptions>
  | Required<PhaseOneLineSeriesOptions>
  | Required<PhaseOneAreaSeriesOptions>
  | Required<PhaseOneBaselineSeriesOptions>
  | Required<PhaseOneHistogramSeriesOptions> {
  switch (deps.optionSurface(styleSchemaId)) {
    case "candlestick":
      return { ...defaults.candlestickOptions };
    case "bar":
      return { ...defaults.barOptions };
    case "line":
      return { ...defaults.lineOptions };
    case "area":
      return { ...defaults.areaOptions };
    case "baseline":
      return { ...defaults.baselineOptions };
    case "histogram":
      return { ...defaults.histogramOptions };
  }
}

export function createMainSourceState<Api>(
  params: {
    paneId: string;
    chartType: PhaseOneMainChartType;
    kind: ChartSeriesKind;
    meta: { id: string; label: string };
    priceScale: PriceScale;
    priceScaleId: string;
  } & {
    api: Api;
  },
  defaults: {
    candlestickOptions: Required<PhaseOneCandlestickSeriesOptions>;
    lineOptions: Required<PhaseOneLineSeriesOptions>;
  },
  deps: {
    createMainSeriesOptions(styleSchemaId: PhaseOneMainStyleSchemaId): MainSeriesSourceState["options"];
  },
): ReturnType<
  typeof createMainSeriesSourceState<
    PhaseOneCandlestickData,
    Api,
    ChartSeriesKind,
    MainSeriesSourceState["options"],
    HistogramVisual,
    PriceLineState,
    SeriesMarkerState
  >
> {
  return createMainSeriesSourceState<
    PhaseOneCandlestickData,
    Api,
    ChartSeriesKind,
    MainSeriesSourceState["options"],
    HistogramVisual,
    PriceLineState,
    SeriesMarkerState
  >({
    paneId: params.paneId,
    chartType: params.chartType,
    kind: params.kind,
    api: params.api,
    meta: params.meta,
    priceScale: params.priceScale,
    priceScaleId: params.priceScaleId,
    defaults: {
      lineBreakOptions: {
        lineCount: defaults.candlestickOptions.lineBreakCount,
      },
      renkoOptions: {
        boxSize: defaults.candlestickOptions.renkoBoxSize,
        boxSizeMode: defaults.candlestickOptions.renkoBoxSizeMode,
      },
      pointFigureOptions: {
        boxSize: defaults.candlestickOptions.pointFigureBoxSize,
        boxSizeMode: defaults.candlestickOptions.pointFigureBoxSizeMode,
        boxSizeScale: defaults.candlestickOptions.pointFigureBoxSizeScale,
        reversalBoxes: defaults.candlestickOptions.pointFigureReversalBoxes,
        atrLength: defaults.candlestickOptions.pointFigureAtrLength,
        percentageValue: defaults.candlestickOptions.pointFigurePercentageValue,
      },
      kagiOptions: {
        reversalMode: defaults.lineOptions.kagiReversalMode,
        reversalSize: defaults.lineOptions.kagiReversalSize,
        reversalScale: defaults.lineOptions.kagiReversalScale,
        atrLength: defaults.lineOptions.kagiAtrLength,
        percentageValue: defaults.lineOptions.kagiPercentageValue,
      },
    },
    createOptions: (styleSchemaId) => deps.createMainSeriesOptions(styleSchemaId),
  });
}
