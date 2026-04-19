import { assertDrawingTargetValid, PlotRowValueIndex, type PlotRow } from "../model";

import { normalizeDrawingMagnetOverrides } from "./chart-drawing-magnet";
import type {
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOneTrendLineDrawingOptions,
} from "./chart-harness";

type PriceLineState = {
  id: string;
  price: number;
  color: string;
  lineWidth: number;
  title: string;
};

type DrawingMagnetState = {
  magnetEnabled?: boolean;
  magnetTolerancePx?: number;
  timeMagnetEnabled?: boolean;
  timeMagnetPolicy?: "nearest" | "previous" | "next";
  timeMagnetTolerancePx?: number;
  magnetSources?: {
    open?: boolean;
    high?: boolean;
    low?: boolean;
    close?: boolean;
  };
};

type HorizontalLineDrawingState = {
  line: PriceLineState;
} & DrawingMagnetState;

type TrendLineDrawingState = {
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
  color: string;
  lineWidth: number;
} & DrawingMagnetState;

export function createDrawingMeta(
  kind: "horizontal-line" | "trend-line",
  ordinal: number,
  deps: {
    formatSeriesKindLabel(kind: string): string;
  },
): { id: string; title: string } {
  return {
    id: `drawing-${ordinal}`,
    title: `${deps.formatSeriesKindLabel(kind)} ${ordinal}`,
  };
}

export function createHorizontalLineDrawingState(
  options: PhaseOneHorizontalLineDrawingOptions,
  deps: {
    title: string;
    createPriceLineState(options: PhaseOneHorizontalLineDrawingOptions): PriceLineState;
  },
): HorizontalLineDrawingState {
  const line = deps.createPriceLineState({
    ...options,
    title: options.title ?? deps.title,
  });
  assertDrawingTargetValid({
    kind: "horizontal-line",
    price: line.price,
    lineWidth: line.lineWidth,
  });

  return {
    line,
    ...normalizeDrawingMagnetOverrides(options),
  };
}

export function createTrendLineDrawingState(
  options: PhaseOneTrendLineDrawingOptions,
  deps: {
    lineColor: string;
    resolveDefaults(): Required<Pick<
      PhaseOneTrendLineDrawingOptions,
      "startTime" | "startPrice" | "endTime" | "endPrice"
    >>;
  },
): TrendLineDrawingState {
  const defaults = deps.resolveDefaults();
  const state = {
    startTime: options.startTime ?? defaults.startTime,
    startPrice: options.startPrice ?? defaults.startPrice,
    endTime: options.endTime ?? defaults.endTime,
    endPrice: options.endPrice ?? defaults.endPrice,
    color: options.color ?? deps.lineColor,
    lineWidth: Math.max(1, options.lineWidth ?? 2),
    ...normalizeDrawingMagnetOverrides(options),
  };
  assertDrawingTargetValid({
    kind: "trend-line",
    startTime: state.startTime,
    startPrice: state.startPrice,
    endTime: state.endTime,
    endPrice: state.endPrice,
    lineWidth: state.lineWidth,
  });
  return state;
}

export function resolveTrendLineDefaults(
  mainBars: readonly PlotRow<number>[],
): Required<Pick<
  PhaseOneTrendLineDrawingOptions,
  "startTime" | "startPrice" | "endTime" | "endPrice"
>> {
  if (mainBars.length >= 2) {
    const first = mainBars[0]!;
    const last = mainBars[mainBars.length - 1]!;
    return {
      startTime: first.time as number,
      startPrice: first.value[PlotRowValueIndex.Close],
      endTime: last.time as number,
      endPrice: last.value[PlotRowValueIndex.Close],
    };
  }

  return {
    startTime: 0,
    startPrice: 0,
    endTime: 1,
    endPrice: 1,
  };
}
