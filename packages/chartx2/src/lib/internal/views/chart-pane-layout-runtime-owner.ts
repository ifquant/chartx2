import {
  applyPaneOptions as applyPaneOptionsUseCase,
  applyPaneResize as applyPaneResizeUseCase,
  getPaneHeight as getPaneHeightUseCase,
  getPaneOptions as getPaneOptionsUseCase,
  setPaneHeight as setPaneHeightUseCase,
} from "./chart-pane-runtime";

import type { PhaseOnePaneOptions } from "./chart-api-types";

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
  preferredHeight: number | null;
  resizable: boolean;
};

type LayoutLike = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type PaneResizeStateLike = {
  startClientY: number;
  activeBlock: {
    dividerAfterPaneId: string;
    dividerBeforePaneId: string;
    snapshot: {
      controlledPaneId: string;
      blockPaneIds: readonly string[];
      startControlledHeight: number;
      startVariableSpan: number;
      minOpposingHeight: number;
    };
    group: {
      controlledPaneId: string;
      opposingPaneId: string;
      blockPaneIds: readonly string[];
      participatingPaneIds: readonly string[];
      variablePaneIds: readonly string[];
      fixedPaneIds: readonly string[];
      mode: "adjacent-upper" | "adjacent-lower" | "downstream";
    };
    controlledPaneId: string;
    controlsUpperPane: boolean;
  };
};

type PanePointLike = {
  x: number;
  y: number;
} | null;

export function createChartPaneLayoutRuntimeOwner(deps: {
  getPaneById(paneId: string): PaneLike | undefined;
  hasCanvas(): boolean;
  getLayout(): LayoutLike;
  listPanes(): readonly PaneLike[];
  gap: number | (() => number);
  emitPaneResize(paneId: string): void;
  emitPaneEvent(type: "options" | "resized", paneId: string): void;
  render(): void;
  getCrosshair(): PanePointLike;
  setCrosshair(point: PanePointLike): void;
}) {
  const gap = (): number => (typeof deps.gap === "function" ? deps.gap() : deps.gap);

  const setPaneHeight = (paneId: string, height: number): void => {
    setPaneHeightUseCase(paneId, height, {
      getPaneById: deps.getPaneById,
      emitPaneResize: deps.emitPaneResize,
      emitPaneEvent: (type, nextPaneId) => deps.emitPaneEvent(type, nextPaneId),
      render: deps.render,
    });
  };

  return {
    getPaneHeight(paneId: string): number {
      return getPaneHeightUseCase(paneId, {
        getPaneById: deps.getPaneById,
        hasCanvas: deps.hasCanvas,
        getLayout: deps.getLayout,
        listPanes: deps.listPanes,
        gap: gap(),
      });
    },

    getPaneOptions(paneId: string): Required<PhaseOnePaneOptions> {
      return getPaneOptionsUseCase(paneId, {
        getPaneById: deps.getPaneById,
      });
    },

    applyPaneOptions(paneId: string, options: PhaseOnePaneOptions): void {
      applyPaneOptionsUseCase(paneId, options, {
        getPaneById: deps.getPaneById,
        setPaneHeight,
        emitPaneEvent: deps.emitPaneEvent,
        render: deps.render,
      });
    },

    setPaneHeight(paneId: string, height: number): void {
      setPaneHeight(paneId, height);
    },

    applyPaneResize(
      clientY: number,
      layout: LayoutLike,
      resizeState: PaneResizeStateLike | null,
    ): void {
      applyPaneResizeUseCase(clientY, layout, resizeState, {
        getPaneById: deps.getPaneById,
        emitPaneResize: deps.emitPaneResize,
        emitPaneEvent: (type, nextPaneId) => deps.emitPaneEvent(type, nextPaneId),
        hasCanvas: deps.hasCanvas,
        listPanes: deps.listPanes,
        gap: gap(),
        getCrosshair: deps.getCrosshair,
        setCrosshair: deps.setCrosshair,
      });
    },
  };
}
