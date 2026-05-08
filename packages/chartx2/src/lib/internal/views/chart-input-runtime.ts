type LayoutLike = { width: number; left: number; right: number };

export function handlePointerLeaveRuntime(
  deps: {
    hasCanvas(): boolean;
    hasCrosshair(): boolean;
    hasDragState(): boolean;
    hasDrawingDragState(): boolean;
    hasPaneResizeState(): boolean;
    clearCrosshair(): void;
    clearHoveredDrawing(): void;
    clearHoveredDrawingHandle(): void;
    clearDrawingSnapGuide(): void;
    setCursor(cursor: string): void;
    render(): void;
  },
): void {
  if (
    !deps.hasCanvas() ||
    !deps.hasCrosshair() ||
    deps.hasDragState() ||
    deps.hasDrawingDragState() ||
    deps.hasPaneResizeState()
  ) {
    return;
  }

  deps.clearCrosshair();
  deps.clearHoveredDrawing();
  deps.clearHoveredDrawingHandle();
  deps.clearDrawingSnapGuide();
  deps.setCursor("default");
  deps.render();
}

export function handlePointerUpRuntime(
  pointerId: number,
  deps: {
    hasCanvas(): boolean;
    hasPointerCapture(pointerId: number): boolean;
    releasePointerCapture(pointerId: number): void;
    clearDragState(): void;
    clearDrawingDragState(): void;
    clearPaneResizeState(): void;
    clearHoveredDrawingHandle(): void;
    clearDrawingSnapGuide(): void;
    hasCrosshair(): boolean;
    setCursor(cursor: string): void;
  },
): void {
  if (!deps.hasCanvas()) {
    return;
  }

  if (deps.hasPointerCapture(pointerId)) {
    deps.releasePointerCapture(pointerId);
  }
  deps.clearDragState();
  deps.clearDrawingDragState();
  deps.clearPaneResizeState();
  deps.clearHoveredDrawingHandle();
  deps.clearDrawingSnapGuide();
  deps.setCursor(deps.hasCrosshair() ? "crosshair" : "default");
}

export function handleWheelZoomRuntime(
  deltaY: number,
  deps: {
    hasCanvas(): boolean;
    getPointCount(): number;
    preventDefault(): void;
    getLayout(): LayoutLike;
    getBarSpacing(): number | null;
    setBarSpacing(value: number): void;
    calculateBaseBarSpacing(paneWidth: number, pointCount: number): number;
    clampBarSpacing(value: number): number;
    render(): void;
  },
): void {
  const pointCount = deps.getPointCount();
  if (!deps.hasCanvas() || pointCount === 0) {
    return;
  }

  deps.preventDefault();
  const layout = deps.getLayout();
  const paneWidth = layout.width - layout.left - layout.right;
  const baseSpacing = deps.calculateBaseBarSpacing(paneWidth, pointCount);
  const currentSpacing = deps.getBarSpacing() ?? baseSpacing;
  const factor = deltaY < 0 ? 1.15 : 0.87;
  deps.setBarSpacing(deps.clampBarSpacing(currentSpacing * factor));
  deps.render();
}

export function handleKeyboardViewportRuntime(
  key: string,
  deps: {
    hasCanvas(): boolean;
    getPointCount(): number;
    hasSelectedDrawing(): boolean;
    preventDefault(): void;
    clearSelectedDrawing(): void;
    removeSelectedDrawing(): void;
    getLayout(): LayoutLike;
    getBarSpacing(): number | null;
    setBarSpacing(value: number): void;
    adjustRightOffset(delta: number): void;
    calculateBaseBarSpacing(paneWidth: number, pointCount: number): number;
    clampBarSpacing(value: number): number;
    render(): void;
  },
): void {
  const pointCount = deps.getPointCount();
  if (!deps.hasCanvas() || pointCount === 0) {
    return;
  }

  if (deps.hasSelectedDrawing()) {
    switch (key) {
      case "Escape":
        deps.preventDefault();
        deps.clearSelectedDrawing();
        return;
      case "Backspace":
      case "Delete":
        deps.preventDefault();
        deps.removeSelectedDrawing();
        return;
      default:
        break;
    }
  }

  const layout = deps.getLayout();
  const paneWidth = layout.width - layout.left - layout.right;
  const baseSpacing = deps.calculateBaseBarSpacing(paneWidth, pointCount);
  const currentSpacing = deps.getBarSpacing() ?? baseSpacing;

  switch (key) {
    case "ArrowUp":
      deps.preventDefault();
      deps.setBarSpacing(deps.clampBarSpacing(currentSpacing * 1.15));
      deps.render();
      return;
    case "ArrowDown":
      deps.preventDefault();
      deps.setBarSpacing(deps.clampBarSpacing(currentSpacing * 0.87));
      deps.render();
      return;
    case "ArrowLeft":
      deps.preventDefault();
      deps.adjustRightOffset(-0.6);
      deps.render();
      return;
    case "ArrowRight":
      deps.preventDefault();
      deps.adjustRightOffset(0.6);
      deps.render();
      return;
    default:
      return;
  }
}
