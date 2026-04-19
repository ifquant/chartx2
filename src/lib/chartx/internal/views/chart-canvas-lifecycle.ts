import {
  attachCanvasRuntime,
  detachCanvasRuntime,
} from "./chart-canvas-runtime";

type ResizeObserverLike = {
  observe(target: Element): void;
  disconnect(): void;
};

type CanvasLike = HTMLCanvasElement;

type InteractionHandlerSet = {
  handleResize: EventListener;
  handlePointerDown: EventListener;
  handlePointerMove: EventListener;
  handlePointerUp: EventListener;
  handlePointerLeave: EventListener;
  handleWheel: EventListener;
  handleClick: EventListener;
  handleKeyDown: EventListener;
};

export function attachChartCanvas<Observer extends ResizeObserverLike>(
  canvas: CanvasLike,
  deps: {
    getManualLayout(): { width: number; height: number } | null;
    setCanvas(canvas: CanvasLike): void;
    renderCanvas(canvas: CanvasLike): void;
    getResizeObserver(): Observer | null;
    setResizeObserver(observer: Observer | null): void;
    handlers: InteractionHandlerSet;
  },
): void {
  deps.setCanvas(canvas);
  const resizeObserver = attachCanvasRuntime(canvas, {
    ensureCanvasFocusability: () => {
      if (!canvas.hasAttribute("tabindex")) {
        canvas.tabIndex = 0;
      }
    },
    setCanvasCursor: (cursor) => {
      canvas.style.cursor = cursor;
    },
    render: () => {
      deps.renderCanvas(canvas);
    },
    addWindowResizeListener: () => {
      window.addEventListener("resize", deps.handlers.handleResize);
    },
    maybeAttachResizeObserver: (nextCanvas) => {
      const container = nextCanvas.parentElement;
      if (container === null || typeof ResizeObserver === "undefined") {
        return null;
      }
      const observer = new ResizeObserver(() => {
        const attachedCanvas = nextCanvas as CanvasLike;
        if (deps.getManualLayout() === null) {
          deps.renderCanvas(attachedCanvas);
        }
      });
      observer.observe(container);
      return observer as unknown as Observer;
    },
    handlePointerDown: deps.handlers.handlePointerDown,
    handlePointerMove: deps.handlers.handlePointerMove,
    handlePointerUp: deps.handlers.handlePointerUp,
    handlePointerLeave: deps.handlers.handlePointerLeave,
    handleWheel: deps.handlers.handleWheel,
    handleClick: deps.handlers.handleClick,
    handleKeyDown: deps.handlers.handleKeyDown,
  });
  deps.setResizeObserver(resizeObserver);
}

export function detachChartCanvas<Observer extends ResizeObserverLike>(
  deps: {
    canvas: CanvasLike | null;
    getResizeObserver(): Observer | null;
    setResizeObserver(observer: Observer | null): void;
    handlers: InteractionHandlerSet;
    resetCanvasRef(): void;
    clearInteractionState(): void;
    clearSubscriptions(): void;
  },
): void {
  detachCanvasRuntime({
    canvas: deps.canvas,
    removeWindowResizeListener: () => {
      window.removeEventListener("resize", deps.handlers.handleResize);
    },
    disconnectResizeObserver: () => {
      deps.getResizeObserver()?.disconnect();
      deps.setResizeObserver(null);
    },
    handlePointerDown: deps.handlers.handlePointerDown,
    handlePointerMove: deps.handlers.handlePointerMove,
    handlePointerUp: deps.handlers.handlePointerUp,
    handlePointerLeave: deps.handlers.handlePointerLeave,
    handleWheel: deps.handlers.handleWheel,
    handleClick: deps.handlers.handleClick,
    handleKeyDown: deps.handlers.handleKeyDown,
    resetCanvasRef: deps.resetCanvasRef,
    clearInteractionState: deps.clearInteractionState,
    clearSubscriptions: deps.clearSubscriptions,
  });
}
