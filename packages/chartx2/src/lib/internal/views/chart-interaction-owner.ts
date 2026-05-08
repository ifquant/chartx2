import type {
  PaneFrame,
  PaneModelState,
} from "../model";
import {
  createChartInteractionHandlers,
} from "./chart-interaction-handlers";
import type {
  LayoutGeometry,
  PanePoint,
} from "./chart-layout-geometry";
import type {
  DragState,
  DrawingDragHandle,
  DrawingDragState,
  PaneResizeState,
} from "./chart-view-state";

type InteractionViewState = {
  crosshair(): PanePoint | null;
  setCrosshair(point: PanePoint | null): void;
  dragState(): DragState | null;
  setDragState(state: DragState | null): void;
  drawingDragState(): DrawingDragState | null;
  setDrawingDragState(state: DrawingDragState | null): void;
  paneResizeState(): PaneResizeState | null;
  setPaneResizeState(state: PaneResizeState | null): void;
  selectedDrawingId(): string | null;
  setHoveredDrawingId(id: string | null): void;
  setHoveredDrawingHandle(handle: DrawingDragHandle | null): void;
  clearDrawingSnapGuide(): void;
};

type DrawingInteractionOwner = {
  resolveHitDrawing(
    point: PanePoint,
    layout: LayoutGeometry,
    paneFrames?: readonly PaneFrame[],
  ): { id: string } | null;
  resolveSelectedTrendLineDragHandle(
    point: PanePoint,
    layout: LayoutGeometry,
    paneFrames?: readonly PaneFrame[],
  ): DrawingDragState | null;
  applyDrawingDrag(
    dragState: DrawingDragState,
    point: PanePoint,
    layout: LayoutGeometry,
    paneFrames?: readonly PaneFrame[],
  ): void;
};

type PaneResizeOwner = {
  applyPaneResize(clientY: number, layout: LayoutGeometry, state: PaneResizeState | null): void;
};

type DrawingCommandOwner = {
  selectDrawing(id: string | null): void;
  removeSelectedDrawing(): void;
};

export function createChartInteractionOwner<Readout>(deps: {
  defaultLayout: LayoutGeometry;
  paneGap: number;
  paneDividerHitSlop: number;
  barSpacingBounds: {
    minBarSpacing: number;
    maxBarSpacing: number;
  };
  getCanvas(): HTMLCanvasElement | null;
  getManualLayout(): Pick<LayoutGeometry, "width" | "height"> | null;
  listPanes(): readonly PaneModelState[];
  getPointCount(): number;
  getBarSpacing(): number | null;
  setBarSpacing(value: number): void;
  getRightOffset(): number;
  setRightOffset(value: number): void;
  viewState: InteractionViewState;
  drawingInteractionOwner: DrawingInteractionOwner;
  paneOwner: PaneResizeOwner;
  drawingOwner: DrawingCommandOwner;
  focusCanvas(): void;
  renderCanvas(canvas: HTMLCanvasElement): void;
  buildReadout(point: PanePoint | null, layout: LayoutGeometry): Readout;
  emitClick(readout: Readout, point: PanePoint | null): void;
}) {
  return createChartInteractionHandlers({
    defaultLayout: deps.defaultLayout,
    paneGap: deps.paneGap,
    paneDividerHitSlop: deps.paneDividerHitSlop,
    barSpacingBounds: deps.barSpacingBounds,
    getCanvas: deps.getCanvas,
    getManualLayout: deps.getManualLayout,
    listPanes: deps.listPanes,
    getPointCount: deps.getPointCount,
    getBarSpacing: deps.getBarSpacing,
    setBarSpacing: deps.setBarSpacing,
    getRightOffset: deps.getRightOffset,
    setRightOffset: deps.setRightOffset,
    getCrosshair: () => deps.viewState.crosshair(),
    setCrosshair: (point) => {
      deps.viewState.setCrosshair(point);
    },
    getDragState: () => deps.viewState.dragState(),
    setDragState: (state) => {
      deps.viewState.setDragState(state);
    },
    getDrawingDragState: () => deps.viewState.drawingDragState(),
    setDrawingDragState: (state) => {
      deps.viewState.setDrawingDragState(state);
    },
    getPaneResizeState: () => deps.viewState.paneResizeState(),
    setPaneResizeState: (state) => {
      deps.viewState.setPaneResizeState(state);
    },
    setHoveredDrawingId: (id) => {
      deps.viewState.setHoveredDrawingId(id);
    },
    setHoveredDrawingHandle: (handle) => {
      deps.viewState.setHoveredDrawingHandle(handle);
    },
    clearDrawingSnapGuide: () => {
      deps.viewState.clearDrawingSnapGuide();
    },
    resolveHitDrawing: (point, layout, paneFrames) =>
      deps.drawingInteractionOwner.resolveHitDrawing(point, layout, paneFrames),
    resolveSelectedTrendLineDragHandle: (point, layout, paneFrames) =>
      deps.drawingInteractionOwner.resolveSelectedTrendLineDragHandle(point, layout, paneFrames),
    applyPaneResize: (clientY, layout) => {
      deps.paneOwner.applyPaneResize(clientY, layout, deps.viewState.paneResizeState());
    },
    applyDrawingDrag: (dragState, point, layout, paneFrames) => {
      deps.drawingInteractionOwner.applyDrawingDrag(dragState, point, layout, paneFrames);
    },
    focusCanvas: deps.focusCanvas,
    renderCanvas: deps.renderCanvas,
    selectDrawing: (id) => {
      deps.drawingOwner.selectDrawing(id);
    },
    buildReadout: deps.buildReadout,
    emitClick: deps.emitClick,
    hasSelectedDrawing: () => deps.viewState.selectedDrawingId() !== null,
    clearSelectedDrawing: () => {
      deps.drawingOwner.selectDrawing(null);
    },
    removeSelectedDrawing: () => {
      deps.drawingOwner.removeSelectedDrawing();
    },
  });
}
