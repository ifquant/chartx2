import { createChartPaneLayoutOwner } from "./chart-pane-layout-owner";
import { createChartPaneLayoutPolicyOwner } from "./chart-pane-layout-policy-owner";

import type { PhaseOnePaneOptions, PhaseOnePaneResizeHandler } from "./chart-api-types";

type LayoutLike = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
  preferredHeight: number | null;
  resizable: boolean;
};

type PaneFrameLike = {
  id: string;
  kind: "primary" | "secondary";
  top: number;
  height: number;
};

type PaneResizeStateLike = {
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  startClientY: number;
  block: {
    controlledPaneId: string;
    blockPaneIds: readonly string[];
    startControlledHeight: number;
    startVariableSpan: number;
    minOpposingHeight: number;
  };
};

type PanePointLike = {
  x: number;
  y: number;
} | null;

const paneLayoutPolicyOwner = createChartPaneLayoutPolicyOwner();

export function subscribePaneResize(
  paneId: string,
  handler: PhaseOnePaneResizeHandler,
  deps: {
    hasPane(paneId: string): boolean;
    getHandlers(paneId: string): Set<PhaseOnePaneResizeHandler> | undefined;
    setHandlers(paneId: string, handlers: Set<PhaseOnePaneResizeHandler>): void;
  },
): void {
  if (!deps.hasPane(paneId)) {
    throw new Error("chartx phase-one pane has been removed");
  }
  const handlers = deps.getHandlers(paneId) ?? new Set<PhaseOnePaneResizeHandler>();
  handlers.add(handler);
  deps.setHandlers(paneId, handlers);
}

export function unsubscribePaneResize(
  paneId: string,
  handler: PhaseOnePaneResizeHandler,
  deps: {
    getHandlers(paneId: string): Set<PhaseOnePaneResizeHandler> | undefined;
    deleteHandlers(paneId: string): void;
  },
): void {
  const handlers = deps.getHandlers(paneId);
  if (handlers === undefined) {
    return;
  }
  handlers.delete(handler);
  if (handlers.size === 0) {
    deps.deleteHandlers(paneId);
  }
}

export function getPaneHeight(
  paneId: string,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    hasCanvas(): boolean;
    getLayout(): LayoutLike;
    listPanes(): readonly PaneLike[];
    gap: number;
  },
): number {
  const pane = deps.getPaneById(paneId);
  if (pane === undefined) {
    throw new Error("chartx phase-one pane has been removed");
  }
  if (!deps.hasCanvas()) {
    return pane.preferredHeight ?? 0;
  }
  const layout = deps.getLayout();
  const paneLayoutOwner = createChartPaneLayoutOwner({
    listPanes: () => deps.listPanes(),
    paneGap: deps.gap,
  });
  const frame = paneLayoutOwner.paneFrameById(
    paneId,
    layout.height - layout.top - layout.bottom,
  );
  if (frame === null) {
    throw new Error("chartx phase-one pane has been removed");
  }
  return frame.height;
}

export function getPaneOptions(
  paneId: string,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
  },
): Required<PhaseOnePaneOptions> {
  const pane = deps.getPaneById(paneId);
  if (pane === undefined) {
    throw new Error("chartx phase-one pane has been removed");
  }
  return {
    height: pane.preferredHeight ?? 0,
    resizable: pane.resizable,
  };
}

export function applyPaneOptions(
  paneId: string,
  options: PhaseOnePaneOptions,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    setPaneHeight(paneId: string, height: number): void;
    emitPaneEvent(type: "options", paneId: string): void;
    render(): void;
  },
): void {
  const pane = deps.getPaneById(paneId);
  if (pane === undefined) {
    throw new Error("chartx phase-one pane has been removed");
  }

  let optionsChanged = false;
  if (options.resizable !== undefined) {
    if (pane.kind === "primary") {
      throw new Error("chartx phase-one chart does not support changing primary pane resizability");
    }
    if (pane.resizable !== options.resizable) {
      pane.resizable = options.resizable;
      optionsChanged = true;
    }
  }

  if (options.height !== undefined) {
    deps.setPaneHeight(paneId, options.height);
    if (optionsChanged) {
      deps.emitPaneEvent("options", paneId);
    }
    return;
  }

  if (optionsChanged) {
    deps.emitPaneEvent("options", paneId);
  }
  deps.render();
}

export function setPaneHeight(
  paneId: string,
  height: number,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    emitPaneResize(paneId: string): void;
    emitPaneEvent(type: "resized", paneId: string): void;
    render(): void;
  },
): void {
  const pane = deps.getPaneById(paneId);
  if (pane === undefined) {
    throw new Error("chartx phase-one pane has been removed");
  }
  if (pane.kind === "primary") {
    throw new Error("chartx phase-one chart does not support setting the primary pane height directly");
  }

  const nextHeight = paneLayoutPolicyOwner.normalizePreferredHeight(height);
  const previousHeight = pane.preferredHeight;
  pane.preferredHeight = nextHeight;
  if (previousHeight !== nextHeight) {
    deps.emitPaneResize(paneId);
    deps.emitPaneEvent("resized", paneId);
  }
  deps.render();
}

export function applyPaneResize(
  clientY: number,
  layout: LayoutLike,
  resizeState: PaneResizeStateLike | null,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    emitPaneResize(paneId: string): void;
    emitPaneEvent(type: "resized", paneId: string): void;
    hasCanvas(): boolean;
    listPanes(): readonly PaneLike[];
    gap: number;
    getCrosshair(): PanePointLike;
    setCrosshair(point: PanePointLike): void;
  },
): void {
  if (resizeState === null) {
    return;
  }

  const controlledResize = paneLayoutPolicyOwner.resolveControlledResizeHeight(clientY, resizeState, {
    getPaneById: deps.getPaneById,
    listPanes: deps.listPanes,
  });
  if (controlledResize === null) {
    return;
  }
  const controlledPane = deps.getPaneById(controlledResize.paneId);
  if (controlledPane === undefined) {
    return;
  }
  const previousHeight = controlledPane.preferredHeight;
  controlledPane.preferredHeight = controlledResize.nextHeight;
  if (previousHeight !== controlledPane.preferredHeight) {
    deps.emitPaneResize(controlledPane.id);
    deps.emitPaneEvent("resized", controlledPane.id);
  }

  if (!deps.hasCanvas()) {
    return;
  }

  const paneLayoutOwner = createChartPaneLayoutOwner({
    listPanes: () => deps.listPanes(),
    paneGap: deps.gap,
  });
  const divider = paneLayoutOwner.resolvePaneDividerByIds(
    resizeState.dividerAfterPaneId,
    resizeState.dividerBeforePaneId,
    layout.height - layout.top - layout.bottom,
  );
  if (divider !== null) {
    deps.setCrosshair({
      x: deps.getCrosshair()?.x ?? 0,
      y: divider.position,
    });
  }
}

export function paneHasSeries(
  paneId: string,
  deps: {
    getSeriesCount(paneId: string): number;
    getDrawingCount(paneId: string): number;
  },
): boolean {
  return deps.getSeriesCount(paneId) > 0 || deps.getDrawingCount(paneId) > 0;
}

export function getPaneByHandle<PaneHandle>(
  handle: PaneHandle,
  deps: {
    getPaneId(handle: PaneHandle): string | undefined;
    getPaneById(paneId: string): PaneLike | undefined;
  },
): PaneLike {
  const paneId = deps.getPaneId(handle);
  if (paneId === undefined) {
    throw new Error("chartx phase-one chart pane handle must come from this chart");
  }
  const pane = deps.getPaneById(paneId);
  if (pane === undefined) {
    throw new Error("chartx phase-one pane has been removed");
  }
  return pane;
}
