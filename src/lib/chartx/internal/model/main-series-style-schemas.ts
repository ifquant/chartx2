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
    optionKeys: ["upColor", "downColor", "wickColor"],
    typeSpecificOptionKeys: [],
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
      "pointFigureReversalBoxes",
    ],
    typeSpecificOptionKeys: ["pointFigureBoxSize", "pointFigureBoxSizeMode", "pointFigureReversalBoxes"],
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
