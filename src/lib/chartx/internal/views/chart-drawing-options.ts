import { assertDrawingTargetValid } from "../model";

import { applyDrawingMagnetOverrides } from "./chart-drawing-magnet";
import type {
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOneTrendLineDrawingOptions,
} from "./chart-harness";

type PriceLineState = {
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

type HorizontalLineDrawingState = DrawingMagnetState & {
  line: PriceLineState;
};

type TrendLineDrawingState = DrawingMagnetState & {
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
  color: string;
  lineWidth: number;
};

export function applyHorizontalLineDrawingOptions(
  drawing: HorizontalLineDrawingState,
  options: PhaseOneHorizontalLineDrawingOptions,
): void {
  const nextLine = {
    price: options.price ?? drawing.line.price,
    color: options.color ?? drawing.line.color,
    lineWidth: Math.max(1, options.lineWidth ?? drawing.line.lineWidth),
    title: options.title ?? drawing.line.title,
  };
  assertDrawingTargetValid({
    kind: "horizontal-line",
    price: nextLine.price,
    lineWidth: nextLine.lineWidth,
  });

  drawing.line.price = nextLine.price;
  drawing.line.color = nextLine.color;
  drawing.line.lineWidth = nextLine.lineWidth;
  drawing.line.title = nextLine.title;
  applyDrawingMagnetOverrides(drawing, options);
}

export function applyTrendLineDrawingOptions(
  drawing: TrendLineDrawingState,
  options: PhaseOneTrendLineDrawingOptions,
): void {
  const nextGeometry = {
    startTime: options.startTime ?? drawing.startTime,
    startPrice: options.startPrice ?? drawing.startPrice,
    endTime: options.endTime ?? drawing.endTime,
    endPrice: options.endPrice ?? drawing.endPrice,
    lineWidth: Math.max(1, options.lineWidth ?? drawing.lineWidth),
  };
  assertDrawingTargetValid({
    kind: "trend-line",
    ...nextGeometry,
  });

  drawing.startTime = nextGeometry.startTime;
  drawing.startPrice = nextGeometry.startPrice;
  drawing.endTime = nextGeometry.endTime;
  drawing.endPrice = nextGeometry.endPrice;
  if (options.color !== undefined) {
    drawing.color = options.color;
  }
  drawing.lineWidth = nextGeometry.lineWidth;
  applyDrawingMagnetOverrides(drawing, options);
}
