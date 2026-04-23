import { describe, expect, it, vi } from "vitest";

import {
  handlePointerDownRuntime,
  handlePointerMoveRuntime,
} from "../../src/lib/chartx/internal/views/chart-pointer-runtime";

describe("chart pointer runtime use-case", () => {
  it("starts pane resize or drawing drag on pointer down through shared orchestration", () => {
    const focusCanvas = vi.fn();
    const setPaneResizeState = vi.fn();
    const setCrosshair = vi.fn();
    const setDrawingDragState = vi.fn();
    const setHoveredDrawingId = vi.fn();
    const setHoveredDrawingHandle = vi.fn();
    const setDragState = vi.fn();
    const setCursor = vi.fn();
    const setPointerCapture = vi.fn();
    const render = vi.fn();

    handlePointerDownRuntime({ clientX: 10, clientY: 20, pointerId: 7 }, {
      hasCanvas: () => true,
      getPointCount: () => 10,
      getLayout: () => ({ width: 500, height: 300, top: 10, right: 10, bottom: 10, left: 10 }),
      getPaneFrames: () => [{ id: "primary", top: 0, height: 160 }, { id: "pane-2", top: 160, height: 120 }],
      listPanes: () => [{ id: "pane-2", kind: "secondary", preferredHeight: 120, resizable: true }],
      resolvePanePoint: () => ({ x: 10, y: 20 }),
      resolvePaneDivider: () => ({
        upperPaneId: "primary",
        lowerPaneId: "pane-2",
        upperHeight: 160,
        lowerHeight: 120,
      }),
      resolveSelectedTrendLineDragHandle: () => null,
      focusCanvas,
      setPaneResizeState,
      resolveControlledPaneId: () => "pane-2",
      resolvePaneResizeBlock: () => ({
        controlledPaneId: "pane-2",
        blockPaneIds: ["primary", "pane-2"],
        startControlledHeight: 120,
        startVariableSpan: 280,
        minOpposingHeight: 160,
      }),
      setCrosshair,
      setDrawingDragState,
      setHoveredDrawingId,
      setHoveredDrawingHandle,
      setDragState,
      getRightOffset: () => 0.8,
      setCursor,
      setPointerCapture,
      render,
    });

    expect(setPaneResizeState).toHaveBeenCalledWith({
      dividerAfterPaneId: "primary",
      dividerBeforePaneId: "pane-2",
      controlledPaneId: "pane-2",
      blockPaneIds: ["primary", "pane-2"],
      startClientY: 20,
      startControlledHeight: 120,
      startVariableSpan: 280,
      minOpposingHeight: 160,
    });
    expect(setCursor).toHaveBeenCalledWith("row-resize");
    expect(setPointerCapture).toHaveBeenCalledWith(7);
    expect(render).not.toHaveBeenCalled();

    handlePointerDownRuntime({ clientX: 11, clientY: 21, pointerId: 8 }, {
      hasCanvas: () => true,
      getPointCount: () => 10,
      getLayout: () => ({ width: 500, height: 300, top: 10, right: 10, bottom: 10, left: 10 }),
      getPaneFrames: () => [{ id: "primary", top: 0, height: 160 }, { id: "pane-2", top: 160, height: 120 }],
      listPanes: () => [{ id: "pane-2", kind: "secondary", preferredHeight: 120, resizable: true }],
      resolvePanePoint: () => ({ x: 11, y: 21 }),
      resolvePaneDivider: () => null,
      resolveSelectedTrendLineDragHandle: () => ({ drawingId: "drawing-1", handle: "start" }),
      focusCanvas,
      setPaneResizeState,
      resolveControlledPaneId: () => null,
      resolvePaneResizeBlock: () => null,
      setCrosshair,
      setDrawingDragState,
      setHoveredDrawingId,
      setHoveredDrawingHandle,
      setDragState,
      getRightOffset: () => 0.8,
      setCursor,
      setPointerCapture,
      render,
    });

    expect(setCrosshair).toHaveBeenCalledWith({ x: 11, y: 21 });
    expect(setDrawingDragState).toHaveBeenCalledWith({ drawingId: "drawing-1", handle: "start" });
    expect(setHoveredDrawingId).toHaveBeenCalledWith("drawing-1");
    expect(setHoveredDrawingHandle).toHaveBeenCalledWith("start");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("updates resize, drag, and hover state on pointer move through shared orchestration", () => {
    const clearDrawingSnapGuide = vi.fn();
    const applyPaneResize = vi.fn();
    const setCrosshair = vi.fn();
    const applyDrawingDrag = vi.fn();
    const setCursor = vi.fn();
    const render = vi.fn();
    const setRightOffset = vi.fn();
    const setHoveredDrawingId = vi.fn();
    const setHoveredDrawingHandle = vi.fn();

    handlePointerMoveRuntime({ clientX: 30, clientY: 40 }, {
      hasCanvas: () => true,
      getLayout: () => ({ width: 500, height: 300, top: 10, right: 10, bottom: 10, left: 10 }),
      getPaneFrames: () => [],
      listPanes: () => [],
      hasPaneResizeState: () => true,
      clearDrawingSnapGuide,
      applyPaneResize,
      hasDrawingDragState: () => false,
      getDrawingDragState: () => null,
      resolvePanePoint: () => ({ x: 30, y: 40 }),
      setCrosshair,
      applyDrawingDrag,
      setCursor,
      render,
      hasDragState: () => false,
      getDragState: () => null,
      getPointCount: () => 10,
      getBarSpacing: () => null,
      resolveBarSpacing: () => 12,
      setRightOffset,
      resolvePaneDivider: () => null,
      resolveHitDrawing: () => null,
      resolveSelectedTrendLineDragHandle: () => null,
      setHoveredDrawingId,
      setHoveredDrawingHandle,
    });

    expect(clearDrawingSnapGuide).toHaveBeenCalledTimes(1);
    expect(applyPaneResize).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);

    handlePointerMoveRuntime({ clientX: 50, clientY: 60 }, {
      hasCanvas: () => true,
      getLayout: () => ({ width: 500, height: 300, top: 10, right: 10, bottom: 10, left: 10 }),
      getPaneFrames: () => [],
      listPanes: () => [],
      hasPaneResizeState: () => false,
      clearDrawingSnapGuide,
      applyPaneResize,
      hasDrawingDragState: () => false,
      getDrawingDragState: () => null,
      resolvePanePoint: () => ({ x: 50, y: 60 }),
      setCrosshair,
      applyDrawingDrag,
      setCursor,
      render,
      hasDragState: () => true,
      getDragState: () => ({ startClientX: 10, startRightOffset: 2 }),
      getPointCount: () => 10,
      getBarSpacing: () => null,
      resolveBarSpacing: () => 20,
      setRightOffset,
      resolvePaneDivider: () => null,
      resolveHitDrawing: () => ({ id: "drawing-2" }),
      resolveSelectedTrendLineDragHandle: () => ({ drawingId: "drawing-2", handle: "end" }),
      setHoveredDrawingId,
      setHoveredDrawingHandle,
    });

    expect(setRightOffset).toHaveBeenCalledWith(0);
    expect(setHoveredDrawingId).toHaveBeenCalledWith(null);
    expect(setHoveredDrawingHandle).toHaveBeenCalledWith(null);
    expect(setCursor).toHaveBeenLastCalledWith("grabbing");
  });
});
