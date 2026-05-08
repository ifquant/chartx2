type LayoutLike = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type PanePointLike = {
  x: number;
  y: number;
} | null;

type ResizeObserverLike = {
  observe(target: Element): void;
  unobserve?(target: Element): void;
  disconnect(): void;
};

type CanvasLike = {
  tabIndex: number;
  style: { cursor: string };
  parentElement: Element | null;
  hasAttribute(name: string): boolean;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: EventListenerOptions | boolean): void;
};

export function handleClickRuntime<Readout>(
  event: MouseEvent,
  deps: {
    hasCanvas(): boolean;
    getLayout(): LayoutLike;
    resolvePanePoint(event: MouseEvent, layout: LayoutLike): PanePointLike;
    resolveHitDrawing(point: Exclude<PanePointLike, null>, layout: LayoutLike): { id: string } | null;
    selectDrawing(id: string | null): void;
    buildReadout(point: PanePointLike, layout: LayoutLike): Readout;
    emitClick(readout: Readout, point: PanePointLike): void;
  },
): void {
  if (!deps.hasCanvas()) {
    return;
  }

  const layout = deps.getLayout();
  const point = deps.resolvePanePoint(event, layout);
  const hitDrawing = point === null ? null : deps.resolveHitDrawing(point, layout);
  deps.selectDrawing(hitDrawing?.id ?? null);
  deps.emitClick(deps.buildReadout(point, layout), point);
}

export function attachCanvasRuntime<Observer extends ResizeObserverLike>(
  canvas: CanvasLike,
  deps: {
    ensureCanvasFocusability(): void;
    setCanvasCursor(cursor: string): void;
    render(): void;
    addWindowResizeListener(): void;
    maybeAttachResizeObserver(canvas: CanvasLike): Observer | null;
    handlePointerDown: EventListener;
    handlePointerMove: EventListener;
    handlePointerUp: EventListener;
    handlePointerLeave: EventListener;
    handleWheel: EventListener;
    handleClick: EventListener;
    handleKeyDown: EventListener;
  },
): Observer | null {
  deps.ensureCanvasFocusability();
  deps.setCanvasCursor("crosshair");
  deps.render();
  deps.addWindowResizeListener();
  const resizeObserver = deps.maybeAttachResizeObserver(canvas);
  canvas.addEventListener("pointerdown", deps.handlePointerDown);
  canvas.addEventListener("pointermove", deps.handlePointerMove);
  canvas.addEventListener("pointerup", deps.handlePointerUp);
  canvas.addEventListener("pointercancel", deps.handlePointerUp);
  canvas.addEventListener("pointerleave", deps.handlePointerLeave);
  canvas.addEventListener("wheel", deps.handleWheel, { passive: false });
  canvas.addEventListener("click", deps.handleClick);
  canvas.addEventListener("keydown", deps.handleKeyDown);
  return resizeObserver;
}

export function detachCanvasRuntime(
  deps: {
    canvas: CanvasLike | null;
    removeWindowResizeListener(): void;
    disconnectResizeObserver(): void;
    handlePointerDown: EventListener;
    handlePointerMove: EventListener;
    handlePointerUp: EventListener;
    handlePointerLeave: EventListener;
    handleWheel: EventListener;
    handleClick: EventListener;
    handleKeyDown: EventListener;
    resetCanvasRef(): void;
    clearInteractionState(): void;
    clearSubscriptions(): void;
  },
): void {
  const canvas = deps.canvas;
  if (canvas !== null) {
    canvas.removeEventListener("pointerdown", deps.handlePointerDown);
    canvas.removeEventListener("pointermove", deps.handlePointerMove);
    canvas.removeEventListener("pointerup", deps.handlePointerUp);
    canvas.removeEventListener("pointercancel", deps.handlePointerUp);
    canvas.removeEventListener("pointerleave", deps.handlePointerLeave);
    canvas.removeEventListener("wheel", deps.handleWheel);
    canvas.removeEventListener("click", deps.handleClick);
    canvas.removeEventListener("keydown", deps.handleKeyDown);
  }
  deps.removeWindowResizeListener();
  deps.disconnectResizeObserver();
  deps.resetCanvasRef();
  deps.clearInteractionState();
  deps.clearSubscriptions();
}
