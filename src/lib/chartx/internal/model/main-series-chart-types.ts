export type PhaseOneMainSeriesInputCapability = "ohlcv" | "ohlc" | "c";

export type PhaseOneMainSeriesBuilder =
  | "time-bars"
  | "heikin-ashi"
  | "renko"
  | "line-break"
  | "kagi"
  | "point-figure"
  | "range";

export type PhaseOneMainSeriesRenderer =
  | "line"
  | "line-markers"
  | "stepline"
  | "area"
  | "hlc-area"
  | "baseline"
  | "bars"
  | "hlc-bars"
  | "candles"
  | "hollow-candles"
  | "volume-candles"
  | "high-low"
  | "columns"
  | "brick"
  | "point-figure"
  | "segment";

export type PhaseOneMainChartType =
  | "candlestick"
  | "line-break"
  | "kagi"
  | "point-figure"
  | "volume-candles"
  | "hollow-candles"
  | "heikin-ashi"
  | "renko"
  | "bar"
  | "hlc-bars"
  | "high-low"
  | "line"
  | "line-markers"
  | "stepline"
  | "area"
  | "baseline"
  | "histogram";

export type PhaseOneMainStyleSchemaId =
  | "candleStyle"
  | "lineBreakStyle"
  | "kagiStyle"
  | "pnfStyle"
  | "volumeCandleStyle"
  | "hollowCandleStyle"
  | "haStyle"
  | "renkoStyle"
  | "barStyle"
  | "hlcBarStyle"
  | "highLowStyle"
  | "lineStyle"
  | "lineWithMarkersStyle"
  | "steplineStyle"
  | "areaStyle"
  | "baselineStyle"
  | "histogramStyle";

export type MainSeriesChartKind =
  | "candlestick"
  | "line"
  | "area"
  | "baseline"
  | "bar"
  | "histogram";

export type MainSeriesChartTypeSpec = {
  inputCapability: PhaseOneMainSeriesInputCapability;
  builder: PhaseOneMainSeriesBuilder;
  renderer: PhaseOneMainSeriesRenderer;
  styleSchemaId: PhaseOneMainStyleSchemaId;
};

export const MAIN_SERIES_CHART_TYPE_SPECS: Record<PhaseOneMainChartType, MainSeriesChartTypeSpec> = {
  candlestick: {
    inputCapability: "ohlcv",
    builder: "time-bars",
    renderer: "candles",
    styleSchemaId: "candleStyle",
  },
  "line-break": {
    inputCapability: "ohlcv",
    builder: "line-break",
    renderer: "candles",
    styleSchemaId: "lineBreakStyle",
  },
  kagi: {
    inputCapability: "ohlcv",
    builder: "kagi",
    renderer: "segment",
    styleSchemaId: "kagiStyle",
  },
  "point-figure": {
    inputCapability: "ohlcv",
    builder: "point-figure",
    renderer: "point-figure",
    styleSchemaId: "pnfStyle",
  },
  "volume-candles": {
    inputCapability: "ohlcv",
    builder: "time-bars",
    renderer: "volume-candles",
    styleSchemaId: "volumeCandleStyle",
  },
  "hollow-candles": {
    inputCapability: "ohlcv",
    builder: "time-bars",
    renderer: "hollow-candles",
    styleSchemaId: "hollowCandleStyle",
  },
  "heikin-ashi": {
    inputCapability: "ohlcv",
    builder: "heikin-ashi",
    renderer: "candles",
    styleSchemaId: "haStyle",
  },
  renko: {
    inputCapability: "ohlcv",
    builder: "renko",
    renderer: "brick",
    styleSchemaId: "renkoStyle",
  },
  bar: {
    inputCapability: "ohlc",
    builder: "time-bars",
    renderer: "bars",
    styleSchemaId: "barStyle",
  },
  "hlc-bars": {
    inputCapability: "ohlc",
    builder: "time-bars",
    renderer: "hlc-bars",
    styleSchemaId: "hlcBarStyle",
  },
  "high-low": {
    inputCapability: "ohlc",
    builder: "time-bars",
    renderer: "high-low",
    styleSchemaId: "highLowStyle",
  },
  line: {
    inputCapability: "c",
    builder: "time-bars",
    renderer: "line",
    styleSchemaId: "lineStyle",
  },
  "line-markers": {
    inputCapability: "c",
    builder: "time-bars",
    renderer: "line-markers",
    styleSchemaId: "lineWithMarkersStyle",
  },
  stepline: {
    inputCapability: "c",
    builder: "time-bars",
    renderer: "stepline",
    styleSchemaId: "steplineStyle",
  },
  area: {
    inputCapability: "c",
    builder: "time-bars",
    renderer: "area",
    styleSchemaId: "areaStyle",
  },
  baseline: {
    inputCapability: "c",
    builder: "time-bars",
    renderer: "baseline",
    styleSchemaId: "baselineStyle",
  },
  histogram: {
    inputCapability: "c",
    builder: "time-bars",
    renderer: "columns",
    styleSchemaId: "histogramStyle",
  },
};

export const MAIN_SERIES_KIND_BY_CHART_TYPE: Record<PhaseOneMainChartType, MainSeriesChartKind> = {
  candlestick: "candlestick",
  "line-break": "candlestick",
  kagi: "line",
  "point-figure": "candlestick",
  "volume-candles": "candlestick",
  "hollow-candles": "candlestick",
  "heikin-ashi": "candlestick",
  renko: "candlestick",
  bar: "bar",
  "hlc-bars": "bar",
  "high-low": "bar",
  line: "line",
  "line-markers": "line",
  stepline: "line",
  area: "area",
  baseline: "baseline",
  histogram: "histogram",
};

export function mainSeriesChartTypeSpec(type: PhaseOneMainChartType): MainSeriesChartTypeSpec {
  return MAIN_SERIES_CHART_TYPE_SPECS[type];
}

export function mainSeriesKindForChartType(type: PhaseOneMainChartType): MainSeriesChartKind {
  return MAIN_SERIES_KIND_BY_CHART_TYPE[type];
}
