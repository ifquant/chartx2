import type {
  PhaseOneAreaSeriesOptions,
  PhaseOneBarSeriesOptions,
  PhaseOneBaselineSeriesOptions,
  PhaseOneCandlestickSeriesOptions,
  PhaseOneChartOptions,
  PhaseOneCompareSeriesOptions,
  PhaseOneHistogramSeriesOptions,
  PhaseOneLineSeriesOptions,
  PhaseOneMovingAverageStudyOptions,
  PhaseOnePriceLineOptions,
  PhaseOneVolumeSeriesOptions,
} from "./chart-api-types";

export const CHART_BACKGROUND = "#fffdf7";
export const PANE_BACKGROUND = "#fffaf0";
export const GRID_COLOR = "rgba(16, 16, 16, 0.08)";
export const FRAME_COLOR = "rgba(16, 16, 16, 0.18)";
export const UP_COLOR = "#0c8f62";
export const DOWN_COLOR = "#c7543e";
export const WICK_COLOR = "rgba(16, 16, 16, 0.72)";
export const LINE_COLOR = "#3f6fd8";
export const CROSSHAIR_COLOR = "rgba(16, 16, 16, 0.5)";
export const CROSSHAIR_POINT_COLOR = "#101010";
export const AXIS_TEXT_COLOR = "rgba(16, 16, 16, 0.72)";
export const AXIS_LABEL_BACKGROUND = "rgba(255, 253, 247, 0.96)";
export const AXIS_LABEL_BORDER = "rgba(16, 16, 16, 0.14)";
export const AXIS_ACTIVE_BACKGROUND = "#101010";
export const AXIS_ACTIVE_TEXT = "#fffdf7";
export const DEFAULT_RIGHT_OFFSET = 0.8;
export const MIN_BAR_SPACING = 4;
export const MAX_BAR_SPACING = 36;
export const BAR_SPACING_BOUNDS = { minBarSpacing: MIN_BAR_SPACING, maxBarSpacing: MAX_BAR_SPACING } as const;
export const DRAWING_HIT_TOLERANCE = 16;
export const DRAWING_PRICE_SNAP_TOLERANCE = 8;
export const DRAWING_TIME_SNAP_TOLERANCE = 10;
export const PANE_GAP = 10;
export const PANE_DIVIDER_HIT_SLOP = 6;

export const DEFAULT_LAYOUT = {
  width: 960,
  height: 520,
  top: 28,
  right: 18,
  bottom: 34,
  left: 18,
} as const;

type RequiredDrawingMagnetSources = Required<NonNullable<NonNullable<PhaseOneChartOptions["drawings"]>["magnetSources"]>>;

type RequiredDrawingOptions = {
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

export function createDefaultLayoutOptions(): Required<NonNullable<PhaseOneChartOptions["layout"]>> {
  return {
    backgroundColor: CHART_BACKGROUND,
    paneBackgroundColor: PANE_BACKGROUND,
    gridColor: GRID_COLOR,
    frameColor: FRAME_COLOR,
    fitContainerHeight: false,
    paneGap: PANE_GAP,
    plotInsets: {
      top: DEFAULT_LAYOUT.top,
      right: DEFAULT_LAYOUT.right,
      bottom: DEFAULT_LAYOUT.bottom,
      left: DEFAULT_LAYOUT.left,
    },
    axisTextColor: AXIS_TEXT_COLOR,
    axisLabelBackground: AXIS_LABEL_BACKGROUND,
    axisLabelBorder: AXIS_LABEL_BORDER,
    axisActiveBackground: AXIS_ACTIVE_BACKGROUND,
    axisActiveText: AXIS_ACTIVE_TEXT,
  };
}

export function createDefaultCrosshairOptions(): Required<NonNullable<PhaseOneChartOptions["crosshair"]>> {
  return {
    lineColor: CROSSHAIR_COLOR,
    pointColor: CROSSHAIR_POINT_COLOR,
  };
}

export function createDefaultDrawingOptions(): RequiredDrawingOptions {
  return {
    magnetEnabled: true,
    magnetGuideVisible: true,
    magnetLabelVisible: true,
    magnetTolerancePx: DRAWING_PRICE_SNAP_TOLERANCE,
    timeMagnetEnabled: true,
    timeMagnetPolicy: "nearest",
    timeMagnetGuideVisible: true,
    timeMagnetLabelVisible: true,
    timeMagnetTolerancePx: DRAWING_TIME_SNAP_TOLERANCE,
    magnetSources: {
      open: true,
      high: true,
      low: true,
      close: true,
    },
  };
}

export function createDefaultCandlestickOptions(): Required<PhaseOneCandlestickSeriesOptions> {
  return {
    valueFormatter: null,
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
    wickColor: WICK_COLOR,
    lineBreakCount: 3,
    renkoBoxSize: null,
    renkoBoxSizeMode: "auto",
    pointFigureBoxSize: null,
    pointFigureBoxSizeMode: "auto",
    pointFigureBoxSizeScale: 1,
    pointFigureReversalBoxes: 3,
    pointFigureAtrLength: 14,
    pointFigurePercentageValue: 1,
  };
}

export function createDefaultBarOptions(): Required<PhaseOneBarSeriesOptions> {
  return {
    valueFormatter: null,
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
}

export function createDefaultLineOptions(): Required<PhaseOneLineSeriesOptions> {
  return {
    valueFormatter: null,
    color: LINE_COLOR,
    lineWidth: 2,
    kagiYangColor: UP_COLOR,
    kagiYinColor: DOWN_COLOR,
    kagiYangLineWidth: 4,
    kagiYinLineWidth: 2,
    kagiReversalMode: "auto",
    kagiReversalSize: null,
    kagiReversalScale: 1,
    kagiAtrLength: 14,
    kagiPercentageValue: 1,
  };
}

export function createDefaultCompareOptions(): Required<PhaseOneCompareSeriesOptions> {
  return {
    affectMainScale: true,
    inputContextMode: "chart-context",
    requestedSymbol: null,
    requestedResolution: null,
    requestedSession: null,
    requestedTimezone: null,
    mergePolicy: "carry-forward",
  };
}

export function createDefaultMovingAverageOptions(): Required<PhaseOneMovingAverageStudyOptions> {
  return {
    length: 3,
    inputContextMode: "chart-context",
    requestedSymbol: null,
    requestedResolution: null,
    requestedSession: null,
    requestedTimezone: null,
    mergePolicy: "carry-forward",
  };
}

export function createDefaultAreaOptions(): Required<PhaseOneAreaSeriesOptions> {
  return {
    valueFormatter: null,
    lineColor: LINE_COLOR,
    lineWidth: 2,
    topColor: "rgba(63, 111, 216, 0.28)",
    bottomColor: "rgba(63, 111, 216, 0.02)",
  };
}

export function createDefaultBaselineOptions(): Required<PhaseOneBaselineSeriesOptions> {
  return {
    valueFormatter: null,
    baseValue: 130,
    lineWidth: 2,
    topLineColor: UP_COLOR,
    topFillTopColor: "rgba(12, 143, 98, 0.26)",
    topFillBottomColor: "rgba(12, 143, 98, 0.03)",
    bottomLineColor: DOWN_COLOR,
    bottomFillTopColor: "rgba(199, 84, 62, 0.03)",
    bottomFillBottomColor: "rgba(199, 84, 62, 0.24)",
  };
}

export function createDefaultHistogramOptions(): Required<PhaseOneHistogramSeriesOptions> {
  return {
    valueFormatter: null,
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
}

export function createDefaultVolumeOptions(): Required<PhaseOneVolumeSeriesOptions> {
  return {
    valueFormatter: null,
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
}

export function createDefaultPriceLineOptions(): Required<PhaseOnePriceLineOptions> {
  return {
    price: 0,
    color: "rgba(16, 16, 16, 0.48)",
    lineWidth: 1,
    title: "Price line",
  };
}

export function createDefaultChartOptionBundle() {
  return {
    layoutOptions: createDefaultLayoutOptions(),
    crosshairOptions: createDefaultCrosshairOptions(),
    drawingOptions: createDefaultDrawingOptions(),
    candlestickOptions: createDefaultCandlestickOptions(),
    barOptions: createDefaultBarOptions(),
    lineOptions: createDefaultLineOptions(),
    defaultCompareOptions: createDefaultCompareOptions(),
    defaultMovingAverageOptions: createDefaultMovingAverageOptions(),
    areaOptions: createDefaultAreaOptions(),
    baselineOptions: createDefaultBaselineOptions(),
    histogramOptions: createDefaultHistogramOptions(),
    volumeOptions: createDefaultVolumeOptions(),
    defaultPriceLineOptions: createDefaultPriceLineOptions(),
  };
}
