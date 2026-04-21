import { describe, expect, it, vi } from "vitest";

import { createChartCanvasLifecycleOwner } from "../../src/lib/chartx/internal/views/chart-canvas-lifecycle-owner";

type ResizeObserverLike = {
  observe(target: Element): void;
  disconnect(): void;
};

function createHandlers() {
  return {
    handleResize: vi.fn() as unknown as EventListener,
    handlePointerDown: vi.fn() as unknown as EventListener,
    handlePointerMove: vi.fn() as unknown as EventListener,
    handlePointerUp: vi.fn() as unknown as EventListener,
    handlePointerLeave: vi.fn() as unknown as EventListener,
    handleWheel: vi.fn() as unknown as EventListener,
    handleClick: vi.fn() as unknown as EventListener,
    handleKeyDown: vi.fn() as unknown as EventListener,
  };
}

describe("chart canvas lifecycle owner", () => {
  it("attaches canvas lifecycle through the shared lifecycle module", () => {
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
    const handlers = createHandlers();
    let attachedCanvas: HTMLCanvasElement | null = null;
    const renderCanvas = vi.fn();
    const setResizeObserver = vi.fn();

    const owner = createChartCanvasLifecycleOwner({
      getManualLayout: () => null,
      getCanvas: () => attachedCanvas,
      setCanvas: (nextCanvas) => {
        attachedCanvas = nextCanvas;
      },
      renderCanvas,
      getResizeObserver: () => null,
      setResizeObserver,
      handlers,
      clearInteractionState: vi.fn(),
      clearSubscriptions: vi.fn(),
    });

    owner.attach(canvas);

    expect(attachedCanvas).toBe(canvas);
    expect(renderCanvas).toHaveBeenCalledWith(canvas);
    expect(setResizeObserver).toHaveBeenCalledWith(null);
    expect(windowAddEventListener).toHaveBeenCalledWith("resize", handlers.handleResize);
    expect(canvasAddEventListener).toHaveBeenCalledWith("pointerdown", handlers.handlePointerDown);
    expect(canvasAddEventListener).toHaveBeenCalledWith("keydown", handlers.handleKeyDown);

    vi.unstubAllGlobals();
  });

  it("detaches canvas lifecycle and clears owner state", () => {
    const windowRemoveEventListener = vi.fn();
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: windowRemoveEventListener,
    });

    const canvasRemoveEventListener = vi.fn();
    const canvas = {
      removeEventListener: canvasRemoveEventListener,
    } as unknown as HTMLCanvasElement;
    const observer = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
    const handlers = createHandlers();
    let attachedCanvas: HTMLCanvasElement | null = canvas;
    let resizeObserver: ResizeObserverLike | null = observer;
    const clearInteractionState = vi.fn();
    const clearSubscriptions = vi.fn();

    const owner = createChartCanvasLifecycleOwner({
      getManualLayout: () => null,
      getCanvas: () => attachedCanvas,
      setCanvas: (nextCanvas) => {
        attachedCanvas = nextCanvas;
      },
      renderCanvas: vi.fn(),
      getResizeObserver: () => resizeObserver,
      setResizeObserver: (nextObserver) => {
        resizeObserver = nextObserver;
      },
      handlers,
      clearInteractionState,
      clearSubscriptions,
    });

    owner.detach();

    expect(attachedCanvas).toBeNull();
    expect(resizeObserver).toBeNull();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(clearInteractionState).toHaveBeenCalledTimes(1);
    expect(clearSubscriptions).toHaveBeenCalledTimes(1);
    expect(windowRemoveEventListener).toHaveBeenCalledWith("resize", handlers.handleResize);
    expect(canvasRemoveEventListener).toHaveBeenCalledWith("pointerdown", handlers.handlePointerDown);
    expect(canvasRemoveEventListener).toHaveBeenCalledWith("keydown", handlers.handleKeyDown);

    vi.unstubAllGlobals();
  });
});
