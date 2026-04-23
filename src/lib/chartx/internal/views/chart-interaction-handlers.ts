import {
  type PaneFrame,
  type PaneModelState,
} from "../model";
import {
  calculateBaseBarSpacing,
  clamp,
  measureLayout,
  resolveBarSpacing,
  resolvePanePoint,
  type LayoutGeometry,
  type PanePoint,
} from "./chart-layout-geometry";
import { createChartPaneLayoutOwner } from "./chart-pane-layout-owner";
import { handleClickRuntime } from "./chart-canvas-runtime";
import {
  handleKeyboardViewportRuntime,
  handlePointerLeaveRuntime,
  handlePointerUpRuntime,
  handleWheelZoomRuntime,
} from "./chart-input-runtime";
import {
  handlePointerDownRuntime,
  handlePointerMoveRuntime,
} from "./chart-pointer-runtime";
import { createChartPaneLayoutPolicyOwner } from "./chart-pane-layout-policy-owner";
import type {
  DragState,
  DrawingDragHandle,
  DrawingDragState,
  PaneResizeState,
} from "./chart-view-state";

export function createChartInteractionHandlers<Readout>(deps: {
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
  getCrosshair(): PanePoint | null;
  setCrosshair(point: PanePoint | null): void;
  getDragState(): DragState | null;
  setDragState(state: DragState | null): void;
  getDrawingDragState(): DrawingDragState | null;
  setDrawingDragState(state: DrawingDragState | null): void;
  getPaneResizeState(): PaneResizeState | null;
  setPaneResizeState(state: PaneResizeState | null): void;
  setHoveredDrawingId(id: string | null): void;
  setHoveredDrawingHandle(handle: DrawingDragHandle | null): void;
  clearDrawingSnapGuide(): void;
  resolveHitDrawing(
    point: PanePoint,
    layout: LayoutGeometry,
    paneFrames?: readonly PaneFrame[],
  ): { id: string } | null;
  resolveSelectedTrendLineDragHandle(
    point: PanePoint,
    layout: LayoutGeometry,
    paneFrames: readonly PaneFrame[],
  ): DrawingDragState | null;
  applyPaneResize(clientY: number, layout: LayoutGeometry, paneFrames: readonly PaneFrame[]): void;
  applyDrawingDrag(
    dragState: DrawingDragState,
    point: PanePoint,
    layout: LayoutGeometry,
    paneFrames: readonly PaneFrame[],
  ): void;
  focusCanvas(): void;
  renderCanvas(canvas: HTMLCanvasElement): void;
  selectDrawing(id: string | null): void;
  buildReadout(point: PanePoint | null, layout: LayoutGeometry): Readout;
  emitClick(readout: Readout, point: PanePoint | null): void;
  hasSelectedDrawing(): boolean;
  clearSelectedDrawing(): void;
  removeSelectedDrawing(): void;
}): {
  handleResize(): void;
  handlePointerMove(event: PointerEvent): void;
  handlePointerLeave(): void;
  handlePointerDown(event: PointerEvent): void;
  handlePointerUp(event: PointerEvent): void;
  handleWheel(event: WheelEvent): void;
  handleClick(event: MouseEvent): void;
  handleKeyDown(event: KeyboardEvent): void;
} {
  const getLayout = (): LayoutGeometry => {
    const canvas = deps.getCanvas();
    return canvas === null
      ? deps.defaultLayout
      : measureLayout(canvas, deps.defaultLayout, deps.getManualLayout());
  };

  const paneLayoutOwner = createChartPaneLayoutOwner({
    listPanes: () => deps.listPanes(),
    paneGap: deps.paneGap,
  });
  const paneLayoutPolicyOwner = createChartPaneLayoutPolicyOwner();

  const getPaneFrames = (layout: LayoutGeometry): readonly PaneFrame[] =>
    paneLayoutOwner.paneFrames(layout.height - layout.top - layout.bottom);

  const resolvePoint = (
    event: Pick<MouseEvent, "clientX" | "clientY">,
    layout: LayoutGeometry,
  ): PanePoint | null => {
    const canvas = deps.getCanvas();
    return canvas === null ? null : resolvePanePoint(canvas, event, layout);
  };

  const renderIfAttached = (): void => {
    const canvas = deps.getCanvas();
    if (canvas !== null) {
      deps.renderCanvas(canvas);
    }
  };

  const setCursor = (cursor: string): void => {
    const canvas = deps.getCanvas();
    if (canvas !== null) {
      canvas.style.cursor = cursor;
    }
  };

  return {
    handleResize: () => {
      const canvas = deps.getCanvas();
      if (canvas !== null && deps.getManualLayout() === null) {
        deps.renderCanvas(canvas);
      }
    },
    handlePointerMove: (event) => {
      handlePointerMoveRuntime(event, {
        hasCanvas: () => deps.getCanvas() !== null,
        getLayout,
        getPaneFrames,
        listPanes: () => deps.listPanes(),
        hasPaneResizeState: () => deps.getPaneResizeState() !== null,
        clearDrawingSnapGuide: () => {
          deps.clearDrawingSnapGuide();
        },
        applyPaneResize: (clientY, layout, paneFrames) => {
          deps.applyPaneResize(clientY, layout, paneFrames as readonly PaneFrame[]);
        },
        hasDrawingDragState: () => deps.getDrawingDragState() !== null,
        getDrawingDragState: () => deps.getDrawingDragState(),
        resolvePanePoint: resolvePoint,
        setCrosshair: (point) => {
          deps.setCrosshair(point);
        },
        applyDrawingDrag: (dragState, point, layout, paneFrames) => {
          deps.applyDrawingDrag(dragState, point, layout, paneFrames as readonly PaneFrame[]);
        },
        setCursor,
        render: renderIfAttached,
        hasDragState: () => deps.getDragState() !== null,
        getDragState: () => deps.getDragState(),
        getPointCount: () => deps.getPointCount(),
        getBarSpacing: () => deps.getBarSpacing(),
        resolveBarSpacing: (currentSpacing, paneWidth, pointCount) =>
          resolveBarSpacing(currentSpacing, paneWidth, pointCount, deps.barSpacingBounds),
        setRightOffset: (value) => {
          deps.setRightOffset(value);
        },
        resolvePaneDivider: (panes, paneFrames, y) =>
          paneLayoutOwner.resolvePaneDivider(
            y,
            0,
            deps.paneDividerHitSlop,
            paneFrames as readonly PaneFrame[],
          ),
        resolveHitDrawing: (point, layout, paneFrames) =>
          deps.resolveHitDrawing(point, layout, paneFrames as readonly PaneFrame[]),
        resolveSelectedTrendLineDragHandle: (point, layout, paneFrames) =>
          deps.resolveSelectedTrendLineDragHandle(point, layout, paneFrames as readonly PaneFrame[]),
        setHoveredDrawingId: (id) => {
          deps.setHoveredDrawingId(id);
        },
        setHoveredDrawingHandle: (handle) => {
          deps.setHoveredDrawingHandle(handle);
        },
      });
    },
    handlePointerLeave: () => {
      handlePointerLeaveRuntime({
        hasCanvas: () => deps.getCanvas() !== null,
        hasCrosshair: () => deps.getCrosshair() !== null,
        hasDragState: () => deps.getDragState() !== null,
        hasDrawingDragState: () => deps.getDrawingDragState() !== null,
        hasPaneResizeState: () => deps.getPaneResizeState() !== null,
        clearCrosshair: () => {
          deps.setCrosshair(null);
        },
        clearHoveredDrawing: () => {
          deps.setHoveredDrawingId(null);
        },
        clearHoveredDrawingHandle: () => {
          deps.setHoveredDrawingHandle(null);
        },
        clearDrawingSnapGuide: () => {
          deps.clearDrawingSnapGuide();
        },
        setCursor,
        render: renderIfAttached,
      });
    },
    handlePointerDown: (event) => {
      handlePointerDownRuntime(event, {
        hasCanvas: () => deps.getCanvas() !== null,
        getPointCount: () => deps.getPointCount(),
        getLayout,
        getPaneFrames,
        listPanes: () => deps.listPanes(),
        resolvePanePoint: resolvePoint,
        resolvePaneDivider: (panes, paneFrames, y) =>
          paneLayoutOwner.resolvePaneDivider(
            y,
            0,
            deps.paneDividerHitSlop,
            paneFrames as readonly PaneFrame[],
          ),
        resolveSelectedTrendLineDragHandle: (point, layout, paneFrames) =>
          deps.resolveSelectedTrendLineDragHandle(point, layout, paneFrames as readonly PaneFrame[]),
        focusCanvas: () => {
          deps.focusCanvas();
        },
        setPaneResizeState: (state) => {
          deps.setPaneResizeState(state);
        },
        resolveControlledPaneId: (upperPaneId, lowerPaneId) =>
          paneLayoutPolicyOwner.resolveControlledPaneId(upperPaneId, lowerPaneId, {
            getPaneById: (paneId) => deps.listPanes().find((pane) => pane.id === paneId),
            listPanes: () => deps.listPanes(),
          }),
        resolvePaneResizeBlock: (upperPaneId, lowerPaneId, controlledPaneId, paneFrames) =>
          paneLayoutPolicyOwner.resolvePaneResizeBlock(upperPaneId, lowerPaneId, controlledPaneId, {
            listPanes: () => deps.listPanes(),
            paneFrames: () => paneFrames,
          }),
        setCrosshair: (point) => {
          deps.setCrosshair(point);
        },
        setDrawingDragState: (state) => {
          deps.setDrawingDragState(state);
        },
        setHoveredDrawingId: (id) => {
          deps.setHoveredDrawingId(id);
        },
        setHoveredDrawingHandle: (handle) => {
          deps.setHoveredDrawingHandle(handle);
        },
        setDragState: (state) => {
          deps.setDragState(state);
        },
        getRightOffset: () => deps.getRightOffset(),
        setCursor,
        setPointerCapture: (pointerId) => {
          deps.getCanvas()?.setPointerCapture(pointerId);
        },
        render: renderIfAttached,
      });
    },
    handlePointerUp: (event) => {
      handlePointerUpRuntime(event.pointerId, {
        hasCanvas: () => deps.getCanvas() !== null,
        hasPointerCapture: (pointerId) => deps.getCanvas()?.hasPointerCapture(pointerId) ?? false,
        releasePointerCapture: (pointerId) => {
          deps.getCanvas()?.releasePointerCapture(pointerId);
        },
        clearDragState: () => {
          deps.setDragState(null);
        },
        clearDrawingDragState: () => {
          deps.setDrawingDragState(null);
        },
        clearPaneResizeState: () => {
          deps.setPaneResizeState(null);
        },
        clearHoveredDrawingHandle: () => {
          deps.setHoveredDrawingHandle(null);
        },
        clearDrawingSnapGuide: () => {
          deps.clearDrawingSnapGuide();
        },
        hasCrosshair: () => deps.getCrosshair() !== null,
        setCursor,
      });
    },
    handleWheel: (event) => {
      handleWheelZoomRuntime(event.deltaY, {
        hasCanvas: () => deps.getCanvas() !== null,
        getPointCount: () => deps.getPointCount(),
        preventDefault: () => {
          event.preventDefault();
        },
        getLayout,
        getBarSpacing: () => deps.getBarSpacing(),
        setBarSpacing: (value) => {
          deps.setBarSpacing(value);
        },
        calculateBaseBarSpacing,
        clampBarSpacing: (value) =>
          clamp(value, deps.barSpacingBounds.minBarSpacing, deps.barSpacingBounds.maxBarSpacing),
        render: renderIfAttached,
      });
    },
    handleClick: (event) => {
      handleClickRuntime(event, {
        hasCanvas: () => deps.getCanvas() !== null,
        getLayout,
        resolvePanePoint: resolvePoint,
        resolveHitDrawing: (point, layout) => deps.resolveHitDrawing(point, layout),
        selectDrawing: (id) => {
          deps.selectDrawing(id);
        },
        buildReadout: (point, layout) => deps.buildReadout(point, layout),
        emitClick: (readout, point) => {
          deps.emitClick(readout, point);
        },
      });
    },
    handleKeyDown: (event) => {
      handleKeyboardViewportRuntime(event.key, {
        hasCanvas: () => deps.getCanvas() !== null,
        getPointCount: () => deps.getPointCount(),
        hasSelectedDrawing: () => deps.hasSelectedDrawing(),
        preventDefault: () => {
          event.preventDefault();
        },
        clearSelectedDrawing: () => {
          deps.clearSelectedDrawing();
        },
        removeSelectedDrawing: () => {
          deps.removeSelectedDrawing();
        },
        getLayout,
        getBarSpacing: () => deps.getBarSpacing(),
        setBarSpacing: (value) => {
          deps.setBarSpacing(value);
        },
        adjustRightOffset: (delta) => {
          deps.setRightOffset(deps.getRightOffset() + delta);
        },
        calculateBaseBarSpacing,
        clampBarSpacing: (value) =>
          clamp(value, deps.barSpacingBounds.minBarSpacing, deps.barSpacingBounds.maxBarSpacing),
        render: renderIfAttached,
      });
    },
  };
}
