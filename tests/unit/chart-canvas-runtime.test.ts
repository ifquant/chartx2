import { describe, expect, it, vi } from "vitest";

import {
  attachCanvasRuntime,
  detachCanvasRuntime,
  handleClickRuntime,
} from "../../src/lib/chartx/internal/views/chart-canvas-runtime";

describe("chart canvas runtime use-case", () => {
  it("routes click through shared drawing selection and readout emission", () => {
    const selectDrawing = vi.fn();
    const emitClick = vi.fn();

    handleClickRuntime({ clientX: 12, clientY: 24 } as MouseEvent, {
      hasCanvas: () => true,
      getLayout: () => ({ width: 400, height: 300, top: 8, right: 10, bottom: 12, left: 14 }),
      resolvePanePoint: () => ({ x: 12, y: 24 }),
      resolveHitDrawing: () => ({ id: "drawing-1" }),
      selectDrawing,
      buildReadout: () => ({ active: true }),
      emitClick,
    });

    expect(selectDrawing).toHaveBeenCalledWith("drawing-1");
    expect(emitClick).toHaveBeenCalledWith({ active: true }, { x: 12, y: 24 });
  });

  it("attaches and detaches canvas listeners through shared lifecycle orchestration", () => {
    const added: Array<{ type: string; options?: AddEventListenerOptions | boolean }> = [];
    const removed: string[] = [];
    const resizeObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
    const canvas = {
      tabIndex: -1,
      style: { cursor: "" },
      parentElement: {} as Element,
      hasAttribute: vi.fn((name: string) => name === "tabindex" ? false : false),
      addEventListener: vi.fn((type: string, _listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) => {
        added.push({ type, options });
      }),
      removeEventListener: vi.fn((type: string) => {
        removed.push(type);
      }),
    };

    const handlePointerDown = vi.fn() as unknown as EventListener;
    const handlePointerMove = vi.fn() as unknown as EventListener;
    const handlePointerUp = vi.fn() as unknown as EventListener;
    const handlePointerLeave = vi.fn() as unknown as EventListener;
    const handleWheel = vi.fn() as unknown as EventListener;
    const handleClick = vi.fn() as unknown as EventListener;
    const handleKeyDown = vi.fn() as unknown as EventListener;
    const ensureCanvasFocusability = vi.fn(() => {
      if (!canvas.hasAttribute("tabindex")) {
        canvas.tabIndex = 0;
      }
    });
    const setCanvasCursor = vi.fn((cursor: string) => {
      canvas.style.cursor = cursor;
    });
    const render = vi.fn();
    const addWindowResizeListener = vi.fn();

    const attachedResizeObserver = attachCanvasRuntime(canvas, {
      ensureCanvasFocusability,
      setCanvasCursor,
      render,
      addWindowResizeListener,
      maybeAttachResizeObserver: () => resizeObserver,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handlePointerLeave,
      handleWheel,
      handleClick,
      handleKeyDown,
    });

    expect(attachedResizeObserver).toBe(resizeObserver);
    expect(canvas.tabIndex).toBe(0);
    expect(canvas.style.cursor).toBe("crosshair");
    expect(render).toHaveBeenCalledTimes(1);
    expect(addWindowResizeListener).toHaveBeenCalledTimes(1);
    expect(added.map((entry) => entry.type)).toEqual([
      "pointerdown",
      "pointermove",
      "pointerup",
      "pointercancel",
      "pointerleave",
      "wheel",
      "click",
      "keydown",
    ]);

    const removeWindowResizeListener = vi.fn();
    const resetCanvasRef = vi.fn();
    const clearInteractionState = vi.fn();
    const clearSubscriptions = vi.fn();

    detachCanvasRuntime({
      canvas,
      removeWindowResizeListener,
      disconnectResizeObserver: () => {
        resizeObserver.disconnect();
      },
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handlePointerLeave,
      handleWheel,
      handleClick,
      handleKeyDown,
      resetCanvasRef,
      clearInteractionState,
      clearSubscriptions,
    });

    expect(removed).toEqual([
      "pointerdown",
      "pointermove",
      "pointerup",
      "pointercancel",
      "pointerleave",
      "wheel",
      "click",
      "keydown",
    ]);
    expect(removeWindowResizeListener).toHaveBeenCalledTimes(1);
    expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(resetCanvasRef).toHaveBeenCalledTimes(1);
    expect(clearInteractionState).toHaveBeenCalledTimes(1);
    expect(clearSubscriptions).toHaveBeenCalledTimes(1);
  });
});
