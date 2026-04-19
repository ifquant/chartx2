import { describe, expect, it, vi } from "vitest";

import {
  attachChartCanvas,
  detachChartCanvas,
} from "../../src/lib/chartx/internal/views/chart-canvas-lifecycle";

describe("chart canvas lifecycle wiring", () => {
  it("attaches canvas lifecycle through shared handler and observer wiring", () => {
    const windowAddEventListener = vi.fn();
    vi.stubGlobal("window", {
      addEventListener: windowAddEventListener,
      removeEventListener: vi.fn(),
    });

    const canvasAddEventListener = vi.fn();
    const canvas = {
      tabIndex: -1,
      style: { cursor: "" },
      parentElement: null,
      hasAttribute: vi.fn(() => false),
      addEventListener: canvasAddEventListener,
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement;

    const setCanvas = vi.fn();
    const renderCanvas = vi.fn();
    const setResizeObserver = vi.fn();
    const handlers = {
      handleResize: vi.fn() as unknown as EventListener,
      handlePointerDown: vi.fn() as unknown as EventListener,
      handlePointerMove: vi.fn() as unknown as EventListener,
      handlePointerUp: vi.fn() as unknown as EventListener,
      handlePointerLeave: vi.fn() as unknown as EventListener,
      handleWheel: vi.fn() as unknown as EventListener,
      handleClick: vi.fn() as unknown as EventListener,
      handleKeyDown: vi.fn() as unknown as EventListener,
    };

    attachChartCanvas(canvas, {
      getManualLayout: () => null,
      setCanvas,
      renderCanvas,
      getResizeObserver: () => null,
      setResizeObserver,
      handlers,
    });

    expect(setCanvas).toHaveBeenCalledWith(canvas);
    expect(renderCanvas).toHaveBeenCalledWith(canvas);
    expect(setResizeObserver).toHaveBeenCalledWith(null);
    expect(windowAddEventListener).toHaveBeenCalledWith("resize", handlers.handleResize);
    vi.unstubAllGlobals();
  });

  it("detaches canvas lifecycle through shared cleanup wiring", () => {
    const windowRemoveEventListener = vi.fn();
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: windowRemoveEventListener,
    });

    const canvasRemoveEventListener = vi.fn();
    const canvas = {
      removeEventListener: canvasRemoveEventListener,
    } as unknown as HTMLCanvasElement;
    const observer = { disconnect: vi.fn() };
    const setResizeObserver = vi.fn();
    const resetCanvasRef = vi.fn();
    const clearInteractionState = vi.fn();
    const clearSubscriptions = vi.fn();
    const handlers = {
      handleResize: vi.fn() as unknown as EventListener,
      handlePointerDown: vi.fn() as unknown as EventListener,
      handlePointerMove: vi.fn() as unknown as EventListener,
      handlePointerUp: vi.fn() as unknown as EventListener,
      handlePointerLeave: vi.fn() as unknown as EventListener,
      handleWheel: vi.fn() as unknown as EventListener,
      handleClick: vi.fn() as unknown as EventListener,
      handleKeyDown: vi.fn() as unknown as EventListener,
    };

    detachChartCanvas({
      canvas,
      getResizeObserver: () => observer,
      setResizeObserver,
      handlers,
      resetCanvasRef,
      clearInteractionState,
      clearSubscriptions,
    });

    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(setResizeObserver).toHaveBeenCalledWith(null);
    expect(resetCanvasRef).toHaveBeenCalledTimes(1);
    expect(clearInteractionState).toHaveBeenCalledTimes(1);
    expect(clearSubscriptions).toHaveBeenCalledTimes(1);
    expect(windowRemoveEventListener).toHaveBeenCalledWith("resize", handlers.handleResize);
    vi.unstubAllGlobals();
  });
});
