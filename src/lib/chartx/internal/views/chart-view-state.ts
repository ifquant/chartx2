export type ManualLayout = {
  width: number;
  height: number;
};

export type DragState = {
  startClientX: number;
  startRightOffset: number;
};

export type DrawingDragHandle = "start" | "end";

export type DrawingDragState = {
  drawingId: string;
  handle: DrawingDragHandle;
};

export type DrawingSnapGuideState = {
  paneId: string;
  color: string;
  price: number | null;
  source: "open" | "high" | "low" | "close" | null;
  time: number | null;
};

export type PaneResizeState = PaneResizeInteractionState;

export function createChartViewState<Point, Observer>() {
  let crosshair: Point | null = null;
  let selectedDrawingId: string | null = null;
  let hoveredDrawingId: string | null = null;
  let hoveredDrawingHandle: DrawingDragHandle | null = null;
  let drawingSnapGuide: DrawingSnapGuideState | null = null;
  let manualLayout: ManualLayout | null = null;
  let dragState: DragState | null = null;
  let drawingDragState: DrawingDragState | null = null;
  let paneResizeState: PaneResizeState | null = null;
  let resizeObserver: Observer | null = null;

  return {
    crosshair: () => crosshair,
    setCrosshair: (point: Point | null) => {
      crosshair = point;
    },
    selectedDrawingId: () => selectedDrawingId,
    setSelectedDrawingId: (id: string | null) => {
      selectedDrawingId = id;
    },
    hoveredDrawingId: () => hoveredDrawingId,
    setHoveredDrawingId: (id: string | null) => {
      hoveredDrawingId = id;
    },
    hoveredDrawingHandle: () => hoveredDrawingHandle,
    setHoveredDrawingHandle: (handle: DrawingDragHandle | null) => {
      hoveredDrawingHandle = handle;
    },
    drawingSnapGuide: () => drawingSnapGuide,
    setDrawingSnapGuide: (guide: DrawingSnapGuideState | null) => {
      drawingSnapGuide = guide;
    },
    clearDrawingSnapGuide: () => {
      drawingSnapGuide = null;
    },
    clearDrawingSnapGuideTimeOnly: () => {
      drawingSnapGuide = drawingSnapGuide !== null && drawingSnapGuide.price !== null
        ? {
            ...drawingSnapGuide,
            time: null,
          }
        : null;
    },
    manualLayout: () => manualLayout,
    setManualLayout: (layout: ManualLayout | null) => {
      manualLayout = layout;
    },
    dragState: () => dragState,
    setDragState: (state: DragState | null) => {
      dragState = state;
    },
    drawingDragState: () => drawingDragState,
    setDrawingDragState: (state: DrawingDragState | null) => {
      drawingDragState = state;
    },
    paneResizeState: () => paneResizeState,
    setPaneResizeState: (state: PaneResizeState | null) => {
      paneResizeState = state;
    },
    resizeObserver: () => resizeObserver,
    setResizeObserver: (observer: Observer | null) => {
      resizeObserver = observer;
    },
    clearInteractionState: () => {
      crosshair = null;
      hoveredDrawingId = null;
      hoveredDrawingHandle = null;
      drawingSnapGuide = null;
      dragState = null;
      drawingDragState = null;
      paneResizeState = null;
    },
  };
}
import type { PaneResizeInteractionState } from "./chart-pane-resize-block-owner";
