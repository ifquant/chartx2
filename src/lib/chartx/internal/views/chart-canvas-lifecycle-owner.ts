import {
  attachChartCanvas,
  detachChartCanvas,
} from "./chart-canvas-lifecycle";

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

export function createChartCanvasLifecycleOwner<Observer extends ResizeObserverLike>(
  deps: {
    getManualLayout(): { width: number; height: number } | null;
    getCanvas(): CanvasLike | null;
    setCanvas(canvas: CanvasLike | null): void;
    renderCanvas(canvas: CanvasLike): void;
    getResizeObserver(): Observer | null;
    setResizeObserver(observer: Observer | null): void;
    handlers: InteractionHandlerSet;
    clearInteractionState(): void;
    clearSubscriptions(): void;
  },
) {
  return {
    attach(canvas: CanvasLike): void {
      attachChartCanvas(canvas, {
        getManualLayout: deps.getManualLayout,
        setCanvas: (nextCanvas) => {
          deps.setCanvas(nextCanvas);
        },
        renderCanvas: (nextCanvas) => {
          deps.renderCanvas(nextCanvas);
        },
        getResizeObserver: deps.getResizeObserver,
        setResizeObserver: deps.setResizeObserver,
        handlers: deps.handlers,
      });
    },

    detach(): void {
      detachChartCanvas({
        canvas: deps.getCanvas(),
        getResizeObserver: deps.getResizeObserver,
        setResizeObserver: deps.setResizeObserver,
        handlers: deps.handlers,
        resetCanvasRef: () => {
          deps.setCanvas(null);
        },
        clearInteractionState: deps.clearInteractionState,
        clearSubscriptions: deps.clearSubscriptions,
      });
    },
  };
}
