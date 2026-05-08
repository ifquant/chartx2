import { createChartCanvasLifecycleOwner } from "./chart-canvas-lifecycle-owner";
import { createChartInteractionOwner } from "./chart-interaction-owner";
import type { LayoutGeometry, PanePoint } from "./chart-layout-geometry";
import type { DragState, DrawingDragHandle, DrawingDragState, PaneResizeState } from "./chart-view-state";
import type { PaneFrame, PaneModelState } from "../model";

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
  resizeObserver(): ResizeObserver | null;
  setResizeObserver(observer: ResizeObserver | null): void;
  clearInteractionState(): void;
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

export function createChartInteractionShellOwner<Readout>(deps: {
  defaultLayout: LayoutGeometry;
  paneGap: number;
  paneDividerHitSlop: number;
  barSpacingBounds: {
    minBarSpacing: number;
    maxBarSpacing: number;
  };
  getCanvas(): HTMLCanvasElement | null;
  setCanvas(canvas: HTMLCanvasElement | null): void;
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
  clearSubscriptions(): void;
}) {
  const interactionHandlers = createChartInteractionOwner({
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
    viewState: deps.viewState,
    drawingInteractionOwner: deps.drawingInteractionOwner,
    paneOwner: deps.paneOwner,
    drawingOwner: deps.drawingOwner,
    focusCanvas: deps.focusCanvas,
    renderCanvas: deps.renderCanvas,
    buildReadout: deps.buildReadout,
    emitClick: deps.emitClick,
  });

  const canvasLifecycleOwner = createChartCanvasLifecycleOwner({
    getManualLayout: deps.getManualLayout,
    getCanvas: deps.getCanvas,
    setCanvas: deps.setCanvas,
    renderCanvas: deps.renderCanvas,
    getResizeObserver: () => deps.viewState.resizeObserver(),
    setResizeObserver: (observer) => {
      deps.viewState.setResizeObserver(observer);
    },
    handlers: {
      handleResize: interactionHandlers.handleResize as EventListener,
      handlePointerDown: interactionHandlers.handlePointerDown as EventListener,
      handlePointerMove: interactionHandlers.handlePointerMove as EventListener,
      handlePointerUp: interactionHandlers.handlePointerUp as EventListener,
      handlePointerLeave: interactionHandlers.handlePointerLeave as EventListener,
      handleWheel: interactionHandlers.handleWheel as EventListener,
      handleClick: interactionHandlers.handleClick as EventListener,
      handleKeyDown: interactionHandlers.handleKeyDown as EventListener,
    },
    clearInteractionState: () => {
      deps.viewState.clearInteractionState();
    },
    clearSubscriptions: deps.clearSubscriptions,
  });

  return {
    handlers: () => interactionHandlers,
    attach: (canvas: HTMLCanvasElement) => {
      canvasLifecycleOwner.attach(canvas);
    },
    detach: () => {
      canvasLifecycleOwner.detach();
    },
  };
}
