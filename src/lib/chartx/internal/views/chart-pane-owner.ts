import { resolveSeriesTarget as resolveSeriesTargetUseCase } from "./chart-add-commands";
import {
  addPaneCommand,
  removePaneByHandleCommand,
} from "./chart-structure-commands";
import {
  createPaneApiHandle,
  subscribePaneResizeRuntime,
  unsubscribePaneResizeRuntime,
} from "./chart-pane-api-runtime";
import {
  buildPaneStateRuntime,
  buildPaneStateSnapshotRuntime,
  getPaneSeriesStatesRuntime,
} from "./chart-pane-bookkeeping-runtime";
import {
  emitPaneEventRuntime as emitPaneEventCompositionRuntime,
  emitPaneResizeRuntime as emitPaneResizeCompositionRuntime,
} from "./chart-pane-event-runtime";
import { removePane as removePaneUseCase } from "./chart-pane-management";
import {
  getPaneByHandle as getPaneByHandleUseCase,
  paneHasSeries as paneHasSeriesUseCase,
} from "./chart-pane-runtime";
import { createChartPaneLayoutRuntimeOwner } from "./chart-pane-layout-runtime-owner";

import type {
  PhaseOnePaneApi,
  PhaseOnePaneEventHandler,
  PhaseOnePaneEventType,
  PhaseOnePaneOptions,
  PhaseOnePaneResizeEvent,
  PhaseOnePaneResizeHandler,
  PhaseOnePaneSeriesState,
  PhaseOnePaneState,
  PhaseOneSeriesTarget,
  PhaseOneVolumeSeriesTarget,
} from "./chart-api-types";

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
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  controlledPaneId: string;
  startClientY: number;
  startUpperHeight: number;
  startLowerHeight: number;
};

type PanePointLike = {
  x: number;
  y: number;
} | null;

type PaneHandlerRegistry = {
  subscribePaneResize(
    paneId: string,
    handler: PhaseOnePaneResizeHandler,
    options: {
      hasPane(nextPaneId: string): boolean;
    },
  ): void;
  unsubscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void;
  clearPaneResizeHandlers(paneId: string): void;
  emitPaneResize(
    paneId: string,
    deps: {
      getPaneById(nextPaneId: string): { kind: "primary" | "secondary" } | undefined;
      getPaneIndex(nextPaneId: string): number;
      getPaneHeight(nextPaneId: string): number;
    },
  ): void;
  emitPaneEvent(
    type: PhaseOnePaneEventType,
    paneId: string,
    deps: {
      buildPaneState(nextPaneId: string): PhaseOnePaneState | null;
      buildPaneSnapshot(): readonly PhaseOnePaneState[];
    },
    explicitPaneState?: PhaseOnePaneState | null,
    explicitSnapshot?: readonly PhaseOnePaneState[],
  ): void;
};

export function createChartPaneOwner(deps: {
  handlerRegistry: PaneHandlerRegistry;
  getPaneById(paneId: string): PaneLike | undefined;
  getPaneByIndex(index: number): PaneLike | undefined;
  getPaneIndex(paneId: string): number;
  listPanes(): readonly PaneLike[];
  addSecondaryPane(options?: PhaseOnePaneOptions): { id: string };
  hasCanvas(): boolean;
  getLayout(): LayoutLike;
  gap: number;
  getCrosshair(): PanePointLike;
  setCrosshair(point: PanePointLike): void;
  getSeriesCount(paneId: string): number;
  getDrawingCount(paneId: string): number;
  listSourcesByPane(paneId: string): readonly unknown[];
  removePaneEntry(paneId: string): void;
  removeSecondaryScale(paneId: string): void;
  render(): void;
}) {
  const paneHandleIds = new WeakMap<PhaseOnePaneApi, string>();
  let emitPaneResizeRef = (_paneId: string): void => {};
  let emitPaneEventRef = (
    _type: PhaseOnePaneEventType,
    _paneId: string,
    _explicitPaneState?: PhaseOnePaneState | null,
    _explicitSnapshot?: readonly PhaseOnePaneState[],
  ): void => {};
  const paneLayoutRuntimeOwner = createChartPaneLayoutRuntimeOwner({
    getPaneById: (paneId) => deps.getPaneById(paneId),
    hasCanvas: () => deps.hasCanvas(),
    getLayout: () => deps.getLayout(),
    listPanes: () => deps.listPanes(),
    gap: deps.gap,
    emitPaneResize: (paneId) => emitPaneResizeRef(paneId),
    emitPaneEvent: (type, paneId) => emitPaneEventRef(type, paneId),
    render: () => deps.render(),
    getCrosshair: () => deps.getCrosshair(),
    setCrosshair: (point) => {
      deps.setCrosshair(point);
    },
  });
  const owner = {
    createPaneHandle(paneId: string): PhaseOnePaneApi {
      return createPaneApiHandle(paneId, {
        getPaneIndex: (nextPaneId) => owner.getPaneIndex(nextPaneId),
        getPaneHeight: (nextPaneId) => owner.getPaneHeight(nextPaneId),
        getPaneOptions: (nextPaneId) => owner.getPaneOptions(nextPaneId),
        applyPaneOptions: (nextPaneId, options) => owner.applyPaneOptions(nextPaneId, options),
        setPaneHeight: (nextPaneId, height) => owner.setPaneHeight(nextPaneId, height),
        isPrimary: (nextPaneId) => owner.getPaneById(nextPaneId)?.kind === "primary",
        isResizable: (nextPaneId) => owner.getPaneById(nextPaneId)?.resizable ?? false,
        subscribeResize: (nextPaneId, handler) => owner.subscribePaneResize(nextPaneId, handler),
        unsubscribeResize: (nextPaneId, handler) =>
          owner.unsubscribePaneResize(nextPaneId, handler),
        hasSeries: (nextPaneId) => owner.paneHasSeries(nextPaneId),
        removePaneById: (nextPaneId) => owner.removePaneById(nextPaneId),
        registerPaneHandle: (handle, nextPaneId) => {
          paneHandleIds.set(handle, nextPaneId);
        },
      });
    },

    listPaneHandles(): readonly PhaseOnePaneApi[] {
      return deps.listPanes().map((pane) => owner.createPaneHandle(pane.id));
    },

    addPane(options: PhaseOnePaneOptions = {}): PhaseOnePaneApi {
      return addPaneCommand(options, {
        addSecondaryPane: (nextOptions) => deps.addSecondaryPane(nextOptions),
        emitAdded: (paneId) => owner.emitPaneEvent("added", paneId),
        render: () => deps.render(),
        createPaneHandle: (paneId) => owner.createPaneHandle(paneId),
      });
    },

    removePaneByHandle(paneHandle: PhaseOnePaneApi): void {
      removePaneByHandleCommand(paneHandle, {
        getPaneId: (handle) => paneHandleIds.get(handle),
        removePaneById: (paneId) => owner.removePaneById(paneId),
      });
    },

    subscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void {
      subscribePaneResizeRuntime(paneId, handler, {
        subscribePaneResize: (nextPaneId, nextHandler, options) =>
          deps.handlerRegistry.subscribePaneResize(nextPaneId, nextHandler, options),
        hasPane: (nextPaneId) => owner.getPaneById(nextPaneId) !== undefined,
      });
    },

    unsubscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void {
      unsubscribePaneResizeRuntime(paneId, handler, {
        unsubscribePaneResize: (nextPaneId, nextHandler) =>
          deps.handlerRegistry.unsubscribePaneResize(nextPaneId, nextHandler),
      });
    },

    getPaneById(paneId: string): PaneLike | undefined {
      return deps.getPaneById(paneId);
    },

    getPaneIndex(paneId: string): number {
      return deps.getPaneIndex(paneId);
    },

    getPaneHeight(paneId: string): number {
      return paneLayoutRuntimeOwner.getPaneHeight(paneId);
    },

    getPaneOptions(paneId: string): Required<PhaseOnePaneOptions> {
      return paneLayoutRuntimeOwner.getPaneOptions(paneId);
    },

    applyPaneOptions(paneId: string, options: PhaseOnePaneOptions): void {
      paneLayoutRuntimeOwner.applyPaneOptions(paneId, options);
    },

    setPaneHeight(paneId: string, height: number): void {
      paneLayoutRuntimeOwner.setPaneHeight(paneId, height);
    },

    applyPaneResize(
      clientY: number,
      layout: LayoutLike,
      resizeState: PaneResizeStateLike | null,
    ): void {
      paneLayoutRuntimeOwner.applyPaneResize(clientY, layout, resizeState);
    },

    paneHasSeries(paneId: string): boolean {
      return paneHasSeriesUseCase(paneId, {
        getSeriesCount: (nextPaneId) => deps.getSeriesCount(nextPaneId),
        getDrawingCount: (nextPaneId) => deps.getDrawingCount(nextPaneId),
      });
    },

    resolveSeriesTarget(
      target: PhaseOneSeriesTarget | PhaseOneVolumeSeriesTarget | undefined,
      options: { defaultToSecondary: boolean; allowPrimary: boolean },
    ) {
      return resolveSeriesTargetUseCase(target, options, {
        listPanes: () => deps.listPanes(),
        getPaneByIndex: (index) => deps.getPaneByIndex(index),
        getPaneByHandle: (handle) => owner.getPaneByHandle(handle),
        addPane: () => owner.addPane(),
        getPaneId: (handle) => paneHandleIds.get(handle),
      });
    },

    getPaneByHandle(handle: PhaseOnePaneApi): PaneLike {
      return getPaneByHandleUseCase(handle, {
        getPaneId: (nextHandle) => paneHandleIds.get(nextHandle),
        getPaneById: (paneId) => owner.getPaneById(paneId),
      });
    },

    removePaneById(paneId: string): void {
      removePaneUseCase(paneId, {
        getPaneById: (nextPaneId) => owner.getPaneById(nextPaneId),
        getSeriesCount: (nextPaneId) => deps.getSeriesCount(nextPaneId),
        getDrawingCount: (nextPaneId) => deps.getDrawingCount(nextPaneId),
        buildPaneState: (nextPaneId) => owner.buildPaneState(nextPaneId),
        buildPaneSnapshot: () => owner.buildPaneStateSnapshot(),
        removePaneById: (nextPaneId) => {
          deps.removePaneEntry(nextPaneId);
        },
        clearPaneResizeHandlers: (nextPaneId) => {
          deps.handlerRegistry.clearPaneResizeHandlers(nextPaneId);
        },
        removeSecondaryScale: (nextPaneId) => {
          deps.removeSecondaryScale(nextPaneId);
        },
        emitPaneEvent: (type, nextPaneId, explicitPaneState, explicitSnapshot) =>
          owner.emitPaneEvent(type, nextPaneId, explicitPaneState, explicitSnapshot),
        render: () => deps.render(),
      });
    },

    emitPaneResize(paneId: string): void {
      emitPaneResizeCompositionRuntime(deps.handlerRegistry, paneId, {
        getPaneById: (nextPaneId) => owner.getPaneById(nextPaneId),
        getPaneIndex: (nextPaneId) => owner.getPaneIndex(nextPaneId),
        getPaneHeight: (nextPaneId) => owner.getPaneHeight(nextPaneId),
      });
    },

    emitPaneEvent(
      type: PhaseOnePaneEventType,
      paneId: string,
      explicitPaneState?: PhaseOnePaneState | null,
      explicitSnapshot?: readonly PhaseOnePaneState[],
    ): void {
      emitPaneEventCompositionRuntime(
        deps.handlerRegistry,
        type,
        paneId,
        {
          buildPaneState: (nextPaneId) => owner.buildPaneState(nextPaneId),
          buildPaneSnapshot: () => owner.buildPaneStateSnapshot(),
        },
        explicitPaneState,
        explicitSnapshot,
      );
    },

    buildPaneState(paneId: string): PhaseOnePaneState | null {
      return buildPaneStateRuntime(paneId, {
        getPaneById: (nextPaneId) => owner.getPaneById(nextPaneId),
        getPaneIndex: (nextPaneId) => owner.getPaneIndex(nextPaneId),
        getPaneHeight: (nextPaneId) => owner.getPaneHeight(nextPaneId),
        getPaneSeriesStates: (nextPaneId) => owner.getPaneSeriesStates(nextPaneId),
      });
    },

    buildPaneStateSnapshot(): readonly PhaseOnePaneState[] {
      return buildPaneStateSnapshotRuntime(
        deps.listPanes().map((pane) => pane.id),
        {
          buildPaneState: (paneId) => owner.buildPaneState(paneId),
        },
      );
    },

    getPaneSeriesStates(paneId: string): readonly PhaseOnePaneSeriesState[] {
      return getPaneSeriesStatesRuntime(paneId, {
        listSourcesByPane: (nextPaneId) => deps.listSourcesByPane(nextPaneId),
      });
    },
  };

  emitPaneResizeRef = (paneId) => owner.emitPaneResize(paneId);
  emitPaneEventRef = (type, paneId, explicitPaneState, explicitSnapshot) =>
    owner.emitPaneEvent(type, paneId, explicitPaneState, explicitSnapshot);

  return owner;
}

export type ChartPaneOwnerPaneResizeEvent = PhaseOnePaneResizeEvent;
export type ChartPaneOwnerPaneEventHandler = PhaseOnePaneEventHandler;
