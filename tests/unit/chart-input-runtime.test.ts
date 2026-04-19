import { describe, expect, it, vi } from "vitest";

import {
  handleKeyboardViewportRuntime,
  handlePointerLeaveRuntime,
  handlePointerUpRuntime,
  handleWheelZoomRuntime,
} from "../../src/lib/chartx/internal/views/chart-input-runtime";

describe("chart input runtime use-case", () => {
  it("clears hover state on pointer leave when no drag session is active", () => {
    const clearCrosshair = vi.fn();
    const clearHoveredDrawing = vi.fn();
    const clearHoveredDrawingHandle = vi.fn();
    const clearDrawingSnapGuide = vi.fn();
    const setCursor = vi.fn();
    const render = vi.fn();

    handlePointerLeaveRuntime({
      hasCanvas: () => true,
      hasCrosshair: () => true,
      hasDragState: () => false,
      hasDrawingDragState: () => false,
      hasPaneResizeState: () => false,
      clearCrosshair,
      clearHoveredDrawing,
      clearHoveredDrawingHandle,
      clearDrawingSnapGuide,
      setCursor,
      render,
    });

    expect(clearCrosshair).toHaveBeenCalledTimes(1);
    expect(clearHoveredDrawing).toHaveBeenCalledTimes(1);
    expect(clearHoveredDrawingHandle).toHaveBeenCalledTimes(1);
    expect(clearDrawingSnapGuide).toHaveBeenCalledTimes(1);
    expect(setCursor).toHaveBeenCalledWith("default");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("releases pointer capture and resets drag state on pointer up", () => {
    const releasePointerCapture = vi.fn();
    const clearDragState = vi.fn();
    const clearDrawingDragState = vi.fn();
    const clearPaneResizeState = vi.fn();
    const clearHoveredDrawingHandle = vi.fn();
    const clearDrawingSnapGuide = vi.fn();
    const setCursor = vi.fn();

    handlePointerUpRuntime(7, {
      hasCanvas: () => true,
      hasPointerCapture: () => true,
      releasePointerCapture,
      clearDragState,
      clearDrawingDragState,
      clearPaneResizeState,
      clearHoveredDrawingHandle,
      clearDrawingSnapGuide,
      hasCrosshair: () => false,
      setCursor,
    });

    expect(releasePointerCapture).toHaveBeenCalledWith(7);
    expect(clearDragState).toHaveBeenCalledTimes(1);
    expect(clearDrawingDragState).toHaveBeenCalledTimes(1);
    expect(clearPaneResizeState).toHaveBeenCalledTimes(1);
    expect(clearHoveredDrawingHandle).toHaveBeenCalledTimes(1);
    expect(clearDrawingSnapGuide).toHaveBeenCalledTimes(1);
    expect(setCursor).toHaveBeenCalledWith("default");
  });

  it("applies wheel zoom through shared viewport math", () => {
    let barSpacing: number | null = null;
    const preventDefault = vi.fn();
    const render = vi.fn();

    handleWheelZoomRuntime(-1, {
      hasCanvas: () => true,
      getPointCount: () => 10,
      preventDefault,
      getLayout: () => ({ width: 500, left: 20, right: 20 }),
      getBarSpacing: () => barSpacing,
      setBarSpacing: (value) => {
        barSpacing = value;
      },
      calculateBaseBarSpacing: () => 12,
      clampBarSpacing: (value) => Math.max(4, Math.min(36, value)),
      render,
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(barSpacing).toBeCloseTo(13.8);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("routes keyboard interaction through shared selection and viewport commands", () => {
    const preventDefault = vi.fn();
    const clearSelectedDrawing = vi.fn();
    const removeSelectedDrawing = vi.fn();
    let rightOffset = 0;
    let barSpacing: number | null = null;
    const render = vi.fn();

    handleKeyboardViewportRuntime("Escape", {
      hasCanvas: () => true,
      getPointCount: () => 10,
      hasSelectedDrawing: () => true,
      preventDefault,
      clearSelectedDrawing,
      removeSelectedDrawing,
      getLayout: () => ({ width: 500, left: 20, right: 20 }),
      getBarSpacing: () => barSpacing,
      setBarSpacing: (value) => {
        barSpacing = value;
      },
      adjustRightOffset: (delta) => {
        rightOffset += delta;
      },
      calculateBaseBarSpacing: () => 12,
      clampBarSpacing: (value) => value,
      render,
    });
    expect(clearSelectedDrawing).toHaveBeenCalledTimes(1);

    handleKeyboardViewportRuntime("ArrowRight", {
      hasCanvas: () => true,
      getPointCount: () => 10,
      hasSelectedDrawing: () => false,
      preventDefault,
      clearSelectedDrawing,
      removeSelectedDrawing,
      getLayout: () => ({ width: 500, left: 20, right: 20 }),
      getBarSpacing: () => barSpacing,
      setBarSpacing: (value) => {
        barSpacing = value;
      },
      adjustRightOffset: (delta) => {
        rightOffset += delta;
      },
      calculateBaseBarSpacing: () => 12,
      clampBarSpacing: (value) => value,
      render,
    });

    expect(rightOffset).toBe(0.6);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
