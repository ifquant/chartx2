import {
  applyHorizontalLineDrawingOptions,
  applyTrendLineDrawingOptions,
} from "./chart-drawing-options";
import type {
  PhaseOneHorizontalLineDrawingApi,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOneTrendLineDrawingApi,
  PhaseOneTrendLineDrawingOptions,
} from "./chart-harness";

type HorizontalLineDrawingState = {
  id: string;
  kind: "horizontal-line";
  paneId: string;
  line: {
    price: number;
    color: string;
    lineWidth: number;
    title: string;
  };
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

type TrendLineDrawingState = {
  id: string;
  kind: "trend-line";
  paneId: string;
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

export function createHorizontalLineDrawingApi(
  deps: {
    assertDrawingActive(api: PhaseOneHorizontalLineDrawingApi): void;
    getDrawing(api: PhaseOneHorizontalLineDrawingApi): HorizontalLineDrawingState;
    setVisible(id: string, visible: boolean): void;
    selectDrawing(id: string): void;
    removeDrawing(api: PhaseOneHorizontalLineDrawingApi): void;
    getPaneIndex(paneId: string): number;
    render(): void;
  },
): PhaseOneHorizontalLineDrawingApi {
  const api: PhaseOneHorizontalLineDrawingApi = {
    applyOptions: (nextOptions) => {
      deps.assertDrawingActive(api);
      const drawing = deps.getDrawing(api);
      applyHorizontalLineDrawingOptions(drawing, nextOptions);
      if (nextOptions.visible !== undefined) {
        deps.setVisible(drawing.id, nextOptions.visible);
      }
      deps.render();
    },
    select: () => {
      deps.assertDrawingActive(api);
      const drawing = deps.getDrawing(api);
      deps.selectDrawing(drawing.id);
    },
    remove: () => {
      deps.removeDrawing(api);
    },
    paneIndex: () => {
      const drawing = deps.getDrawing(api);
      return drawing.paneId === "primary" ? 0 : deps.getPaneIndex(drawing.paneId);
    },
  };
  return api;
}

export function createTrendLineDrawingApi(
  deps: {
    assertDrawingActive(api: PhaseOneTrendLineDrawingApi): void;
    getDrawing(api: PhaseOneTrendLineDrawingApi): TrendLineDrawingState;
    setVisible(id: string, visible: boolean): void;
    selectDrawing(id: string): void;
    removeDrawing(api: PhaseOneTrendLineDrawingApi): void;
    getPaneIndex(paneId: string): number;
    render(): void;
  },
): PhaseOneTrendLineDrawingApi {
  const api: PhaseOneTrendLineDrawingApi = {
    applyOptions: (nextOptions) => {
      deps.assertDrawingActive(api);
      const drawing = deps.getDrawing(api);
      applyTrendLineDrawingOptions(drawing, nextOptions);
      if (nextOptions.visible !== undefined) {
        deps.setVisible(drawing.id, nextOptions.visible);
      }
      deps.render();
    },
    select: () => {
      deps.assertDrawingActive(api);
      const drawing = deps.getDrawing(api);
      deps.selectDrawing(drawing.id);
    },
    remove: () => {
      deps.removeDrawing(api);
    },
    paneIndex: () => {
      const drawing = deps.getDrawing(api);
      return drawing.paneId === "primary" ? 0 : deps.getPaneIndex(drawing.paneId);
    },
  };
  return api;
}
