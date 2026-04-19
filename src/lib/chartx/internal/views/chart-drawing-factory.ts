import type { DrawingRegistry } from "../model";

import {
  createHorizontalLineDrawingApi,
  createTrendLineDrawingApi,
} from "./chart-drawing-api";
import {
  createHorizontalLineDrawingState,
  createTrendLineDrawingState,
} from "./chart-drawing-state";
import type {
  PhaseOneHorizontalLineDrawingApi,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOnePriceLineOptions,
  PhaseOneTrendLineDrawingApi,
  PhaseOneTrendLineDrawingOptions,
} from "./chart-harness";

type PriceLineState = {
  id: string;
  price: number;
  color: string;
  lineWidth: number;
  title: string;
};

type HorizontalLineDrawingDescriptor = {
  id: string;
  kind: "horizontal-line";
  paneId: string;
  visible: boolean;
  api: PhaseOneHorizontalLineDrawingApi;
  line: PriceLineState;
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

type TrendLineDrawingDescriptor = {
  id: string;
  kind: "trend-line";
  paneId: string;
  visible: boolean;
  api: PhaseOneTrendLineDrawingApi;
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
  color: string;
  lineWidth: number;
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

export function createHorizontalLineDrawing(
  params: {
    paneId: string;
    options: PhaseOneHorizontalLineDrawingOptions;
    visible: boolean;
    drawingId: string;
    drawingTitle: string;
    registry: Pick<DrawingRegistry<string, PhaseOneHorizontalLineDrawingApi, HorizontalLineDrawingDescriptor>, "register" | "setVisible">;
    createPriceLineState(options: PhaseOnePriceLineOptions): PriceLineState;
    assertDrawingActive(api: PhaseOneHorizontalLineDrawingApi): void;
    getDrawing(api: PhaseOneHorizontalLineDrawingApi): HorizontalLineDrawingDescriptor;
    selectDrawing(id: string): void;
    removeDrawing(api: PhaseOneHorizontalLineDrawingApi): void;
    getPaneIndex(paneId: string): number;
    render(): void;
  },
): PhaseOneHorizontalLineDrawingApi {
  const state = createHorizontalLineDrawingState(params.options, {
    title: params.drawingTitle,
    createPriceLineState: params.createPriceLineState,
  });

  const api = createHorizontalLineDrawingApi({
    assertDrawingActive: params.assertDrawingActive,
    getDrawing: params.getDrawing,
    setVisible: (id, visible) => params.registry.setVisible(id, visible),
    selectDrawing: params.selectDrawing,
    removeDrawing: params.removeDrawing,
    getPaneIndex: params.getPaneIndex,
    render: params.render,
  });

  params.registry.register({
    id: params.drawingId,
    kind: "horizontal-line",
    paneId: params.paneId,
    visible: params.visible,
    api,
    ...state,
  });
  params.render();
  return api;
}

export function createTrendLineDrawing(
  params: {
    paneId: string;
    options: PhaseOneTrendLineDrawingOptions;
    visible: boolean;
    drawingId: string;
    registry: Pick<DrawingRegistry<string, PhaseOneTrendLineDrawingApi, TrendLineDrawingDescriptor>, "register" | "setVisible">;
    lineColor: string;
    resolveDefaults(): Required<Pick<
      PhaseOneTrendLineDrawingOptions,
      "startTime" | "startPrice" | "endTime" | "endPrice"
    >>;
    assertDrawingActive(api: PhaseOneTrendLineDrawingApi): void;
    getDrawing(api: PhaseOneTrendLineDrawingApi): TrendLineDrawingDescriptor;
    selectDrawing(id: string): void;
    removeDrawing(api: PhaseOneTrendLineDrawingApi): void;
    getPaneIndex(paneId: string): number;
    render(): void;
  },
): PhaseOneTrendLineDrawingApi {
  const state = createTrendLineDrawingState(params.options, {
    lineColor: params.lineColor,
    resolveDefaults: params.resolveDefaults,
  });

  const api = createTrendLineDrawingApi({
    assertDrawingActive: params.assertDrawingActive,
    getDrawing: params.getDrawing,
    setVisible: (id, visible) => params.registry.setVisible(id, visible),
    selectDrawing: params.selectDrawing,
    removeDrawing: params.removeDrawing,
    getPaneIndex: params.getPaneIndex,
    render: params.render,
  });

  params.registry.register({
    id: params.drawingId,
    kind: "trend-line",
    paneId: params.paneId,
    visible: params.visible,
    api,
    ...state,
  });
  params.render();
  return api;
}
