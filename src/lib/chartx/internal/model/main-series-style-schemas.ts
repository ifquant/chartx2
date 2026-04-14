import type { PhaseOneMainStyleSchemaId } from "./main-series-chart-types";

export type MainSeriesStyleOptionSurfaceKind =
  | "candlestick"
  | "bar"
  | "line"
  | "area"
  | "baseline"
  | "histogram";

export type MainSeriesStyleSchemaSpec = {
  optionSurface: MainSeriesStyleOptionSurfaceKind;
  optionKeys: readonly string[];
  typeSpecificOptionKeys: readonly string[];
};

export const MAIN_SERIES_STYLE_SCHEMAS: Record<PhaseOneMainStyleSchemaId, MainSeriesStyleSchemaSpec> = {
  candleStyle: {
    optionSurface: "candlestick",
    optionKeys: ["upColor", "downColor", "wickColor"],
    typeSpecificOptionKeys: [],
  },
  lineBreakStyle: {
    optionSurface: "candlestick",
    optionKeys: ["upColor", "downColor", "wickColor", "lineBreakCount"],
    typeSpecificOptionKeys: ["lineBreakCount"],
  },
  kagiStyle: {
    optionSurface: "line",
    optionKeys: ["color", "lineWidth"],
    typeSpecificOptionKeys: [],
  },
  pnfStyle: {
    optionSurface: "candlestick",
    optionKeys: [
      "upColor",
      "downColor",
      "wickColor",
      "pointFigureBoxSize",
      "pointFigureBoxSizeMode",
      "pointFigureBoxSizeScale",
      "pointFigureReversalBoxes",
      "pointFigureAtrLength",
      "pointFigurePercentageValue",
    ],
    typeSpecificOptionKeys: [
      "pointFigureBoxSize",
      "pointFigureBoxSizeMode",
      "pointFigureBoxSizeScale",
      "pointFigureReversalBoxes",
      "pointFigureAtrLength",
      "pointFigurePercentageValue",
    ],
  },
  volumeCandleStyle: {
    optionSurface: "candlestick",
    optionKeys: ["upColor", "downColor", "wickColor"],
    typeSpecificOptionKeys: [],
  },
  hollowCandleStyle: {
    optionSurface: "candlestick",
    optionKeys: ["upColor", "downColor", "wickColor"],
    typeSpecificOptionKeys: [],
  },
  haStyle: {
    optionSurface: "candlestick",
    optionKeys: ["upColor", "downColor", "wickColor"],
    typeSpecificOptionKeys: [],
  },
  renkoStyle: {
    optionSurface: "candlestick",
    optionKeys: ["upColor", "downColor", "wickColor", "renkoBoxSize", "renkoBoxSizeMode"],
    typeSpecificOptionKeys: ["renkoBoxSize", "renkoBoxSizeMode"],
  },
  barStyle: {
    optionSurface: "bar",
    optionKeys: ["upColor", "downColor"],
    typeSpecificOptionKeys: [],
  },
  hlcBarStyle: {
    optionSurface: "bar",
    optionKeys: ["upColor", "downColor"],
    typeSpecificOptionKeys: [],
  },
  highLowStyle: {
    optionSurface: "bar",
    optionKeys: ["upColor", "downColor"],
    typeSpecificOptionKeys: [],
  },
  lineStyle: {
    optionSurface: "line",
    optionKeys: ["color", "lineWidth"],
    typeSpecificOptionKeys: [],
  },
  lineWithMarkersStyle: {
    optionSurface: "line",
    optionKeys: ["color", "lineWidth"],
    typeSpecificOptionKeys: [],
  },
  steplineStyle: {
    optionSurface: "line",
    optionKeys: ["color", "lineWidth"],
    typeSpecificOptionKeys: [],
  },
  areaStyle: {
    optionSurface: "area",
    optionKeys: ["lineColor", "lineWidth", "topColor", "bottomColor"],
    typeSpecificOptionKeys: [],
  },
  baselineStyle: {
    optionSurface: "baseline",
    optionKeys: [
      "baseValue",
      "lineWidth",
      "topLineColor",
      "topFillTopColor",
      "topFillBottomColor",
      "bottomLineColor",
      "bottomFillTopColor",
      "bottomFillBottomColor",
    ],
    typeSpecificOptionKeys: [],
  },
  histogramStyle: {
    optionSurface: "histogram",
    optionKeys: ["upColor", "downColor"],
    typeSpecificOptionKeys: [],
  },
};

export function mainSeriesStyleSchemaSpec(
  styleSchemaId: PhaseOneMainStyleSchemaId,
): MainSeriesStyleSchemaSpec {
  return MAIN_SERIES_STYLE_SCHEMAS[styleSchemaId];
}

export function projectMainSeriesStyleOptions(
  fromStyleSchemaId: PhaseOneMainStyleSchemaId,
  toStyleSchemaId: PhaseOneMainStyleSchemaId,
  sourceOptions: Record<string, unknown>,
  targetDefaults: Record<string, unknown>,
): Record<string, unknown> {
  const fromSchema = mainSeriesStyleSchemaSpec(fromStyleSchemaId);
  const toSchema = mainSeriesStyleSchemaSpec(toStyleSchemaId);
  const projected = { ...targetDefaults };
  const carryableKeys = toSchema.optionKeys.filter((key) => fromSchema.optionKeys.includes(key));

  for (const key of carryableKeys) {
    if (key in sourceOptions) {
      projected[key] = sourceOptions[key];
    }
  }

  return projected;
}
