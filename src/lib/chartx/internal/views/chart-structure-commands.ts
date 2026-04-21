import type {
  PhaseOnePaneApi,
  PhaseOnePaneOptions,
  PhaseOnePaneResizeHandler,
} from "./chart-api-types";

export function removeSeriesCommand<TSeries, TSource extends { role: string }>(
  series: TSeries,
  deps: {
    removeSourceByApi(series: TSeries): TSource | undefined;
    resetPrimaryRangeOverride(): void;
    resetViewportState(): void;
    clearCrosshair(): void;
    render(): void;
  },
): void {
  const removed = deps.removeSourceByApi(series);
  if (removed === undefined) {
    throw new Error("chartx phase-one chart can remove only the currently attached series");
  }
  if (removed.role === "main-series") {
    deps.resetPrimaryRangeOverride();
  }
  deps.clearCrosshair();
  deps.resetViewportState();
  deps.render();
}

export function addPaneCommand<TPaneHandle>(
  options: PhaseOnePaneOptions | undefined,
  deps: {
    addSecondaryPane(options: PhaseOnePaneOptions): { id: string };
    emitAdded(paneId: string): void;
    render(): void;
    createPaneHandle(paneId: string): TPaneHandle;
  },
): TPaneHandle {
  const pane = deps.addSecondaryPane(options ?? {});
  deps.emitAdded(pane.id);
  deps.render();
  return deps.createPaneHandle(pane.id);
}

export function removePaneByHandleCommand<TPaneHandle>(
  paneHandle: TPaneHandle,
  deps: {
    getPaneId(handle: TPaneHandle): string | undefined;
    removePaneById(paneId: string): void;
  },
): void {
  const paneId = deps.getPaneId(paneHandle);
  if (paneId === undefined) {
    throw new Error("chartx phase-one chart removePane requires a pane handle created by this chart");
  }
  deps.removePaneById(paneId);
}

export function createPaneHandle(
  paneId: string,
  deps: {
    getPaneIndex(paneId: string): number;
    getPaneHeight(paneId: string): number;
    getPaneOptions(paneId: string): Required<PhaseOnePaneOptions>;
    applyPaneOptions(paneId: string, options: PhaseOnePaneOptions): void;
    setPaneHeight(paneId: string, height: number): void;
    isPrimary(paneId: string): boolean;
    isResizable(paneId: string): boolean;
    subscribeResize(paneId: string, handler: PhaseOnePaneResizeHandler): void;
    unsubscribeResize(paneId: string, handler: PhaseOnePaneResizeHandler): void;
    hasSeries(paneId: string): boolean;
    removePaneById(paneId: string): void;
    registerPaneHandle(handle: PhaseOnePaneApi, paneId: string): void;
  },
): PhaseOnePaneApi {
  const pane: PhaseOnePaneApi = {
    paneIndex: () => deps.getPaneIndex(paneId),
    getHeight: () => deps.getPaneHeight(paneId),
    getOptions: () => deps.getPaneOptions(paneId),
    applyOptions: (options) => {
      deps.applyPaneOptions(paneId, options);
    },
    setHeight: (height) => {
      deps.setPaneHeight(paneId, height);
    },
    isPrimary: () => deps.isPrimary(paneId),
    isResizable: () => deps.isResizable(paneId),
    subscribeResize: (handler) => {
      deps.subscribeResize(paneId, handler);
    },
    unsubscribeResize: (handler) => {
      deps.unsubscribeResize(paneId, handler);
    },
    hasSeries: () => deps.hasSeries(paneId),
    remove: () => {
      deps.removePaneById(paneId);
    },
  };
  deps.registerPaneHandle(pane, paneId);
  return pane;
}
