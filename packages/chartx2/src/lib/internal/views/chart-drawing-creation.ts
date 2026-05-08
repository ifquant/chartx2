import type { DrawingRegistry } from "../model";

import {
  createHorizontalLineDrawing,
  createTrendLineDrawing,
} from "./chart-drawing-factory";
import {
  requireActiveDrawingByApi,
} from "./chart-drawing-runtime";
import type {
  PhaseOneHorizontalLineDrawingApi,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOnePriceLineOptions,
  PhaseOneTrendLineDrawingApi,
  PhaseOneTrendLineDrawingOptions,
} from "./chart-api-types";

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
};

export function createHorizontalLineDrawingForPane(
  params: {
    paneId: string;
    paneExists: boolean;
    options: PhaseOneHorizontalLineDrawingOptions;
    visible: boolean;
    drawingId: string;
    drawingTitle: string;
    registry: Pick<
      DrawingRegistry<string, PhaseOneHorizontalLineDrawingApi, HorizontalLineDrawingDescriptor>,
      "register" | "setVisible" | "getByApi" | "hasApi"
    >;
    createPriceLineState(options: PhaseOnePriceLineOptions): PriceLineState;
    selectDrawing(id: string): void;
    removeDrawing(api: PhaseOneHorizontalLineDrawingApi): void;
    getPaneIndex(paneId: string): number;
    render(): void;
  },
): PhaseOneHorizontalLineDrawingApi {
  if (!params.paneExists) {
    throw new Error("chartx phase-one drawing target pane has been removed");
  }

  return createHorizontalLineDrawing({
    paneId: params.paneId,
    options: params.options,
    visible: params.visible,
    drawingId: params.drawingId,
    drawingTitle: params.drawingTitle,
    registry: params.registry,
    createPriceLineState: params.createPriceLineState,
    assertDrawingActive: (api) => {
      if (!params.registry.hasApi(api)) {
        throw new Error("chartx phase-one drawing has been removed");
      }
    },
    getDrawing: (api) => {
      const drawing = requireActiveDrawingByApi(api, {
        getByApi: (nextApi) => params.registry.getByApi(nextApi),
      });
      if (drawing.kind !== "horizontal-line") {
        throw new Error("chartx phase-one drawing api is attached to an unexpected drawing kind");
      }
      return drawing;
    },
    selectDrawing: params.selectDrawing,
    removeDrawing: params.removeDrawing,
    getPaneIndex: params.getPaneIndex,
    render: params.render,
  });
}

export function createTrendLineDrawingForPane(
  params: {
    paneId: string;
    paneExists: boolean;
    options: PhaseOneTrendLineDrawingOptions;
    visible: boolean;
    drawingId: string;
    registry: Pick<
      DrawingRegistry<string, PhaseOneTrendLineDrawingApi, TrendLineDrawingDescriptor>,
      "register" | "setVisible" | "getByApi" | "hasApi"
    >;
    lineColor: string;
    resolveDefaults(): Required<Pick<
      PhaseOneTrendLineDrawingOptions,
      "startTime" | "startPrice" | "endTime" | "endPrice"
    >>;
    selectDrawing(id: string): void;
    removeDrawing(api: PhaseOneTrendLineDrawingApi): void;
    getPaneIndex(paneId: string): number;
    render(): void;
  },
): PhaseOneTrendLineDrawingApi {
  if (!params.paneExists) {
    throw new Error("chartx phase-one drawing target pane has been removed");
  }

  return createTrendLineDrawing({
    paneId: params.paneId,
    options: params.options,
    visible: params.visible,
    drawingId: params.drawingId,
    registry: params.registry,
    lineColor: params.lineColor,
    resolveDefaults: params.resolveDefaults,
    assertDrawingActive: (api) => {
      if (!params.registry.hasApi(api)) {
        throw new Error("chartx phase-one drawing has been removed");
      }
    },
    getDrawing: (api) => {
      const drawing = requireActiveDrawingByApi(api, {
        getByApi: (nextApi) => params.registry.getByApi(nextApi),
      });
      if (drawing.kind !== "trend-line") {
        throw new Error("chartx phase-one drawing api is attached to an unexpected drawing kind");
      }
      return drawing;
    },
    selectDrawing: params.selectDrawing,
    removeDrawing: params.removeDrawing,
    getPaneIndex: params.getPaneIndex,
    render: params.render,
  });
}
