import {
  addHorizontalLineDrawingCommand,
  addTrendLineDrawingCommand,
} from "./chart-add-commands";
import {
  createHorizontalLineDrawingForPane,
  createTrendLineDrawingForPane,
} from "./chart-drawing-creation";
import {
  getSelectedDrawing as getSelectedDrawingPublic,
  getSelectedDrawingPropertySchema as getSelectedDrawingPropertySchemaPublic,
  getSelectedDrawingState as getSelectedDrawingStatePublic,
  applySelectedDrawingOptions as applySelectedDrawingOptionsPublic,
  clearSelectedDrawing as clearSelectedDrawingPublic,
} from "./chart-drawing-public";
import {
  getDrawingByIdRuntime,
  getDrawingCountForPaneRuntime,
  listAllDrawingsRuntime,
  listDrawingsByPaneRuntime,
  removeDrawingRuntime,
  removeSelectedDrawingRuntime,
  selectDrawingRuntime,
} from "./chart-drawing-registry-runtime";
import { restoreStateDrawingsContent } from "./chart-state-restore-content";
import {
  createDrawingMeta,
  resolveTrendLineDefaults as resolveTrendLineDefaultsUseCase,
} from "./chart-drawing-state";
import type {
  PhaseOneDrawingPropertySchema,
  PhaseOneDrawingSelectionChangeHandler,
  PhaseOneDrawingStateSnapshot,
  PhaseOneHorizontalLineDrawingApi,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOnePriceLineOptions,
  PhaseOneSelectedDrawing,
  PhaseOneSeriesTarget,
  PhaseOneTrendLineDrawingApi,
  PhaseOneTrendLineDrawingOptions,
} from "./chart-api-types";

type DrawingKind = "horizontal-line" | "trend-line";

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

type PriceLineState = {
  id: string;
  price: number;
  color: string;
  lineWidth: number;
  title: string;
};

type DrawingApi = PhaseOneHorizontalLineDrawingApi | PhaseOneTrendLineDrawingApi;

export type ChartDrawingDescriptor =
  | ({
      id: string;
      kind: "horizontal-line";
      paneId: string;
      visible: boolean;
      api: PhaseOneHorizontalLineDrawingApi;
      line: PriceLineState;
    } & DrawingMagnetState)
  | ({
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
    } & DrawingMagnetState);

export type RestorableDrawingSnapshot =
  | {
      type: "horizontal-line";
      paneIndex: number;
      options: PhaseOneHorizontalLineDrawingOptions;
    }
  | {
      type: "trend-line";
      paneIndex: number;
      options: PhaseOneTrendLineDrawingOptions;
    };

type PaneLookup = {
  id: string;
};

type ResolvedDrawingTarget =
  | { kind: "primary" }
  | { kind: "secondary"; paneId: string };

type DrawingRegistryLike = {
  register(drawing: ChartDrawingDescriptor): void;
  setVisible(id: string, visible: boolean): void;
  getByApi(api: DrawingApi): ChartDrawingDescriptor | undefined;
  hasApi(api: DrawingApi): boolean;
  list(): readonly ChartDrawingDescriptor[];
  listByPane(paneId: string): readonly ChartDrawingDescriptor[];
  removeByApi(api: DrawingApi): ChartDrawingDescriptor | undefined;
};

type ViewDeps = {
  selectedDrawingId(): string | null;
  setSelectedDrawingId(id: string | null): void;
  notifySelectionChange(handlerEvent: PhaseOneSelectedDrawing): void;
  render(): void;
};

export type ChartDrawingOwner = {
  allocateDrawingMeta(kind: DrawingKind): { id: string; title: string };
  addHorizontalLine(
    target?: PhaseOneSeriesTarget,
    options?: PhaseOneHorizontalLineDrawingOptions,
  ): PhaseOneHorizontalLineDrawingApi;
  addTrendLine(
    target?: PhaseOneSeriesTarget,
    options?: PhaseOneTrendLineDrawingOptions,
  ): PhaseOneTrendLineDrawingApi;
  getDrawingById(id: string): ChartDrawingDescriptor | undefined;
  listDrawings(): readonly ChartDrawingDescriptor[];
  listDrawingsByPane(paneId: string): readonly ChartDrawingDescriptor[];
  countDrawingsByPane(paneId: string): number;
  selectDrawing(id: string | null, shouldRender?: boolean): void;
  removeDrawing(api: DrawingApi): void;
  removeSelectedDrawing(): void;
  cleanupStaleSelection(shouldRender?: boolean): boolean;
  getSelectedDrawing(): PhaseOneSelectedDrawing;
  getSelectedDrawingState(): PhaseOneDrawingStateSnapshot | null;
  getSelectedDrawingPropertySchema(): PhaseOneDrawingPropertySchema | null;
  applySelectedDrawingOptions(
    options: PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions,
  ): void;
  clearSelectedDrawing(): void;
  restoreDrawings(drawings: readonly RestorableDrawingSnapshot[]): void;
};

export function createChartDrawingOwner<PaneTarget>(
  deps: {
    allocateDrawingOrdinal(): number;
    formatSeriesKindLabel(kind: string): string;
    resolveTarget(
      target: PhaseOneSeriesTarget | undefined,
      options: { defaultToSecondary: boolean; allowPrimary: boolean },
    ): ResolvedDrawingTarget;
    getPaneById(paneId: string): PaneLookup | undefined;
    getPaneByIndex(index: number): PaneLookup | undefined;
    createPaneTarget(pane: PaneLookup): PaneTarget;
    getRestorePaneId(target: PaneTarget): string | undefined;
    getPaneIndex(paneId: string): number;
    registry: DrawingRegistryLike;
    createPriceLineState(options: PhaseOnePriceLineOptions): PriceLineState;
    lineColor: string;
    resolveTrendLineDefaults?(): Required<Pick<
      PhaseOneTrendLineDrawingOptions,
      "startTime" | "startPrice" | "endTime" | "endPrice"
    >>;
    resolveMagnetOptions(drawing: ChartDrawingDescriptor): {
      magnetEnabled: boolean;
      magnetTolerancePx: number;
      timeMagnetEnabled: boolean;
      timeMagnetPolicy: "nearest" | "previous" | "next";
      timeMagnetTolerancePx: number;
      magnetSources: {
        open: boolean;
        high: boolean;
        low: boolean;
        close: boolean;
      };
    };
    resolvePropertySchema(type: PhaseOneDrawingStateSnapshot["type"]): PhaseOneDrawingPropertySchema;
    view: ViewDeps;
  },
): ChartDrawingOwner {
  const resolveTrendLineDefaults =
    deps.resolveTrendLineDefaults ??
    (() => resolveTrendLineDefaultsUseCase([]));

  const render = () => {
    deps.view.render();
  };

  const getDrawingById = (id: string): ChartDrawingDescriptor | undefined =>
    getDrawingByIdRuntime(id, {
      listDrawings: () => deps.registry.list(),
    });

  const selectDrawing = (id: string | null, shouldRender = true): void => {
    selectDrawingRuntime({
      selectedDrawingId: deps.view.selectedDrawingId(),
      nextId: id,
      shouldRender,
      getById: (drawingId) => getDrawingById(drawingId),
      getPaneIndex: deps.getPaneIndex,
      notifySelectionChange: deps.view.notifySelectionChange,
      render,
      setSelectedDrawingId: deps.view.setSelectedDrawingId,
    });
  };

  const removeDrawing = (api: DrawingApi): void => {
    removeDrawingRuntime({
      api,
      selectedDrawingId: deps.view.selectedDrawingId(),
      removeByApi: (nextApi) => deps.registry.removeByApi(nextApi),
      clearSelection: (shouldRender) => selectDrawing(null, shouldRender),
      render,
    });
  };

  const createHorizontalLineForPane = (
    paneId: string,
    options: PhaseOneHorizontalLineDrawingOptions = {},
  ): PhaseOneHorizontalLineDrawingApi => {
    const meta = createDrawingMeta("horizontal-line", deps.allocateDrawingOrdinal(), {
      formatSeriesKindLabel: deps.formatSeriesKindLabel,
    });
    return createHorizontalLineDrawingForPane({
      paneId,
      paneExists: deps.getPaneById(paneId) !== undefined,
      options,
      visible: options.visible ?? true,
      drawingId: meta.id,
      drawingTitle: meta.title,
      registry: {
        register: (drawing) => {
          deps.registry.register(drawing);
        },
        setVisible: (id, visible) => {
          deps.registry.setVisible(id, visible);
        },
        getByApi: (api) => {
          const drawing = deps.registry.getByApi(api);
          return drawing?.kind === "horizontal-line" ? drawing : undefined;
        },
        hasApi: (api) => {
          const drawing = deps.registry.getByApi(api);
          return drawing?.kind === "horizontal-line";
        },
      },
      createPriceLineState: deps.createPriceLineState,
      selectDrawing: (id) => selectDrawing(id),
      removeDrawing,
      getPaneIndex: deps.getPaneIndex,
      render,
    });
  };

  const createTrendLineForPane = (
    paneId: string,
    options: PhaseOneTrendLineDrawingOptions = {},
  ): PhaseOneTrendLineDrawingApi => {
    const meta = createDrawingMeta("trend-line", deps.allocateDrawingOrdinal(), {
      formatSeriesKindLabel: deps.formatSeriesKindLabel,
    });
    return createTrendLineDrawingForPane({
      paneId,
      paneExists: deps.getPaneById(paneId) !== undefined,
      options,
      visible: options.visible ?? true,
      drawingId: meta.id,
      registry: {
        register: (drawing) => {
          deps.registry.register(drawing);
        },
        setVisible: (id, visible) => {
          deps.registry.setVisible(id, visible);
        },
        getByApi: (api) => {
          const drawing = deps.registry.getByApi(api);
          return drawing?.kind === "trend-line" ? drawing : undefined;
        },
        hasApi: (api) => {
          const drawing = deps.registry.getByApi(api);
          return drawing?.kind === "trend-line";
        },
      },
      lineColor: deps.lineColor,
      resolveDefaults: resolveTrendLineDefaults,
      selectDrawing: (id) => selectDrawing(id),
      removeDrawing,
      getPaneIndex: deps.getPaneIndex,
      render,
    });
  };

  return {
    allocateDrawingMeta: (kind) =>
      createDrawingMeta(kind, deps.allocateDrawingOrdinal(), {
        formatSeriesKindLabel: deps.formatSeriesKindLabel,
      }),
    addHorizontalLine: (target, options = {}) =>
      addHorizontalLineDrawingCommand(target, options, {
        resolveTarget: deps.resolveTarget,
        createDrawing: createHorizontalLineForPane,
      }),
    addTrendLine: (target, options = {}) =>
      addTrendLineDrawingCommand(target, options, {
        resolveTarget: deps.resolveTarget,
        createDrawing: createTrendLineForPane,
      }),
    getDrawingById,
    listDrawings: () =>
      listAllDrawingsRuntime({
        listDrawings: () => deps.registry.list(),
      }),
    listDrawingsByPane: (paneId) =>
      listDrawingsByPaneRuntime(paneId, {
        listByPane: (nextPaneId) => deps.registry.listByPane(nextPaneId),
      }),
    countDrawingsByPane: (paneId) =>
      getDrawingCountForPaneRuntime(paneId, {
        listByPane: (nextPaneId) => deps.registry.listByPane(nextPaneId),
      }),
    selectDrawing,
    removeDrawing,
    removeSelectedDrawing: () => {
      removeSelectedDrawingRuntime({
        selectedDrawingId: deps.view.selectedDrawingId(),
        getById: (id) => getDrawingById(id),
        clearSelection: (shouldRender) => selectDrawing(null, shouldRender),
        removeByApi: removeDrawing,
        render,
      });
    },
    cleanupStaleSelection: (shouldRender = false) => {
      const selectedDrawingId = deps.view.selectedDrawingId();
      if (selectedDrawingId === null || getDrawingById(selectedDrawingId) !== undefined) {
        return false;
      }
      selectDrawing(null, shouldRender);
      return true;
    },
    getSelectedDrawing: () =>
      getSelectedDrawingPublic(deps.view.selectedDrawingId(), {
        getById: (id) => getDrawingById(id),
        getPaneIndex: deps.getPaneIndex,
      }),
    getSelectedDrawingState: () =>
      getSelectedDrawingStatePublic({
        selectedDrawingId: deps.view.selectedDrawingId(),
        getDrawingById: (id) => getDrawingById(id),
        snapshotDeps: {
          getPaneIndex: deps.getPaneIndex,
          resolveMagnetOptions: (drawing) => deps.resolveMagnetOptions(drawing as ChartDrawingDescriptor),
        },
      }),
    getSelectedDrawingPropertySchema: () =>
      getSelectedDrawingPropertySchemaPublic(
        getSelectedDrawingStatePublic({
          selectedDrawingId: deps.view.selectedDrawingId(),
          getDrawingById: (id) => getDrawingById(id),
          snapshotDeps: {
            getPaneIndex: deps.getPaneIndex,
            resolveMagnetOptions: (drawing) => deps.resolveMagnetOptions(drawing as ChartDrawingDescriptor),
          },
        }),
        deps.resolvePropertySchema,
      ),
    applySelectedDrawingOptions: (options) =>
      applySelectedDrawingOptionsPublic({
        selectedDrawingId: deps.view.selectedDrawingId(),
        getDrawingById: (id) => getDrawingById(id),
        options,
      }),
    clearSelectedDrawing: () => {
      clearSelectedDrawingPublic(() => selectDrawing(null));
    },
    restoreDrawings: (drawings) => {
      restoreStateDrawingsContent(drawings, {
        getPaneByIndex: deps.getPaneByIndex,
        createPaneTarget: deps.createPaneTarget,
        addHorizontalLine: (target, options) => {
          createHorizontalLineForPane(resolvePaneIdFromTarget(target), options);
        },
        addTrendLine: (target, options) => {
          createTrendLineForPane(resolvePaneIdFromTarget(target), options);
        },
      });
    },
  };

  function resolvePaneIdFromTarget(target: PaneTarget): string {
    const paneId = deps.getRestorePaneId(target);
    if (paneId === undefined) {
      throw new Error("chartx phase-one drawing restore target pane is invalid");
    }
    return paneId;
  }
}

export function notifyDrawingSelectionChange(
  handler: PhaseOneDrawingSelectionChangeHandler,
  selection: PhaseOneSelectedDrawing,
): void {
  handler(selection);
}
