type LayoutLike = { width: number; height: number; top: number; right: number; bottom: number; left: number };
type PaneSpecLike = {
  id: string;
  kind: "primary" | "secondary";
  preferredHeight: number | null;
  resizable: boolean;
};
type PaneFrameLike = { id: string; top: number; height: number };
type PaneDividerLike = {
  upperPaneId: string;
  lowerPaneId: string;
  upperHeight: number;
  lowerHeight: number;
};
type PanePointLike = { x: number; y: number } | null;
type DragStateLike = { startClientX: number; startRightOffset: number };
type DrawingDragStateLike = { drawingId: string; handle: "start" | "end" };

export function handlePointerDownRuntime(
  event: { clientX: number; clientY: number; pointerId: number },
  deps: {
    hasCanvas(): boolean;
    getPointCount(): number;
    getLayout(): LayoutLike;
    getPaneFrames(layout: LayoutLike): readonly PaneFrameLike[];
    listPanes(): readonly PaneSpecLike[];
    resolvePanePoint(event: { clientX: number; clientY: number }, layout: LayoutLike): PanePointLike;
    resolvePaneDivider(
      panes: readonly PaneSpecLike[],
      paneFrames: readonly PaneFrameLike[],
      y: number | null,
    ): PaneDividerLike | null;
    resolveSelectedTrendLineDragHandle(
      point: Exclude<PanePointLike, null>,
      layout: LayoutLike,
      paneFrames: readonly PaneFrameLike[],
    ): DrawingDragStateLike | null;
    focusCanvas(): void;
    setPaneResizeState(state: {
      dividerAfterPaneId: string;
      dividerBeforePaneId: string;
      controlledPaneId: string;
      startClientY: number;
      startPrimaryHeight: number;
      startControlledHeight: number;
      startUpperHeight: number;
      startLowerHeight: number;
    }): void;
    resolveControlledPaneId(upperPaneId: string, lowerPaneId: string): string | null;
    setCrosshair(point: PanePointLike): void;
    setDrawingDragState(state: DrawingDragStateLike): void;
    setHoveredDrawingId(id: string | null): void;
    setHoveredDrawingHandle(handle: "start" | "end" | null): void;
    setDragState(state: DragStateLike): void;
    getRightOffset(): number;
    setCursor(cursor: string): void;
    setPointerCapture(pointerId: number): void;
    render(): void;
  },
): void {
  if (!deps.hasCanvas() || deps.getPointCount() === 0) {
    return;
  }

  const layout = deps.getLayout();
  const paneFrames = deps.getPaneFrames(layout);
  const point = deps.resolvePanePoint(event, layout);
  const divider = deps.resolvePaneDivider(deps.listPanes(), paneFrames, point?.y ?? null);

  if (divider !== null) {
    const controlledPaneId = deps.resolveControlledPaneId(divider.upperPaneId, divider.lowerPaneId);
    if (controlledPaneId === null) {
      return;
    }
    const controlledFrame = paneFrames.find((pane) => pane.id === controlledPaneId);
    if (controlledFrame === undefined) {
      return;
    }
    const primaryFrame = paneFrames.find((pane) => pane.id === "primary");
    deps.focusCanvas();
    deps.setPaneResizeState({
      dividerAfterPaneId: divider.upperPaneId,
      dividerBeforePaneId: divider.lowerPaneId,
      controlledPaneId,
      startClientY: event.clientY,
      startPrimaryHeight: primaryFrame?.height ?? (divider.upperPaneId === "primary" ? divider.upperHeight : 0),
      startControlledHeight: controlledFrame.height,
      startUpperHeight: divider.upperHeight,
      startLowerHeight: divider.lowerHeight,
    });
    deps.setCursor("row-resize");
    deps.setPointerCapture(event.pointerId);
    return;
  }

  if (point !== null) {
    const hitHandle = deps.resolveSelectedTrendLineDragHandle(point, layout, paneFrames);
    if (hitHandle !== null) {
      deps.focusCanvas();
      deps.setCrosshair(point);
      deps.setDrawingDragState(hitHandle);
      deps.setHoveredDrawingId(hitHandle.drawingId);
      deps.setHoveredDrawingHandle(hitHandle.handle);
      deps.setCursor("grabbing");
      deps.setPointerCapture(event.pointerId);
      deps.render();
      return;
    }
  }

  deps.focusCanvas();
  deps.setDragState({
    startClientX: event.clientX,
    startRightOffset: deps.getRightOffset(),
  });
  deps.setCursor("grabbing");
  deps.setPointerCapture(event.pointerId);
}

export function handlePointerMoveRuntime(
  event: { clientX: number; clientY: number },
  deps: {
    hasCanvas(): boolean;
    getLayout(): LayoutLike;
    getPaneFrames(layout: LayoutLike): readonly PaneFrameLike[];
    listPanes(): readonly PaneSpecLike[];
    hasPaneResizeState(): boolean;
    clearDrawingSnapGuide(): void;
    applyPaneResize(clientY: number, layout: LayoutLike, paneFrames: readonly PaneFrameLike[]): void;
    hasDrawingDragState(): boolean;
    getDrawingDragState(): DrawingDragStateLike | null;
    resolvePanePoint(event: { clientX: number; clientY: number }, layout: LayoutLike): PanePointLike;
    setCrosshair(point: PanePointLike): void;
    applyDrawingDrag(
      dragState: DrawingDragStateLike,
      point: Exclude<PanePointLike, null>,
      layout: LayoutLike,
      paneFrames: readonly PaneFrameLike[],
    ): void;
    setCursor(cursor: string): void;
    render(): void;
    hasDragState(): boolean;
    getDragState(): DragStateLike | null;
    getPointCount(): number;
    getBarSpacing(): number | null;
    resolveBarSpacing(currentSpacing: number | null, paneWidth: number, pointCount: number): number;
    setRightOffset(value: number): void;
    resolvePaneDivider(
      panes: readonly PaneSpecLike[],
      paneFrames: readonly PaneFrameLike[],
      y: number | null,
    ): PaneDividerLike | null;
    resolveHitDrawing(
      point: Exclude<PanePointLike, null>,
      layout: LayoutLike,
      paneFrames: readonly PaneFrameLike[],
    ): { id: string } | null;
    resolveSelectedTrendLineDragHandle(
      point: Exclude<PanePointLike, null>,
      layout: LayoutLike,
      paneFrames: readonly PaneFrameLike[],
    ): DrawingDragStateLike | null;
    setHoveredDrawingId(id: string | null): void;
    setHoveredDrawingHandle(handle: "start" | "end" | null): void;
  },
): void {
  if (!deps.hasCanvas()) {
    return;
  }

  const layout = deps.getLayout();
  const paneFrames = deps.getPaneFrames(layout);

  if (deps.hasPaneResizeState()) {
    deps.clearDrawingSnapGuide();
    deps.applyPaneResize(event.clientY, layout, paneFrames);
    deps.setCrosshair(deps.resolvePanePoint(event, layout));
    deps.render();
    return;
  }

  if (deps.hasDrawingDragState()) {
    const point = deps.resolvePanePoint(event, layout);
    deps.setCrosshair(point);
    const drawingDragState = deps.getDrawingDragState();
    if (point !== null && drawingDragState !== null) {
      deps.applyDrawingDrag(drawingDragState, point, layout, paneFrames);
    }
    deps.setCursor("grabbing");
    deps.render();
    return;
  }

  const pointCount = deps.getPointCount();
  if (deps.hasDragState() && pointCount > 0) {
    const paneWidth = layout.width - layout.left - layout.right;
    const spacing = deps.resolveBarSpacing(deps.getBarSpacing(), paneWidth, pointCount);
    const dragState = deps.getDragState();
    if (dragState !== null) {
      const deltaBars = (event.clientX - dragState.startClientX) / spacing;
      deps.setRightOffset(dragState.startRightOffset - deltaBars);
    }
  }

  const point = deps.resolvePanePoint(event, layout);
  const divider = deps.resolvePaneDivider(deps.listPanes(), paneFrames, point?.y ?? null);
  deps.setCrosshair(point);
  const hoveredDrawing =
    divider === null && !deps.hasDragState() && point !== null
      ? deps.resolveHitDrawing(point, layout, paneFrames)
      : null;
  const hoveredHandle =
    divider === null && !deps.hasDragState() && point !== null
      ? deps.resolveSelectedTrendLineDragHandle(point, layout, paneFrames)
      : null;
  deps.setHoveredDrawingId(hoveredDrawing?.id ?? null);
  deps.setHoveredDrawingHandle(hoveredHandle?.handle ?? null);
  deps.setCursor(
    divider === null
      ? (!deps.hasDragState()
        ? (hoveredHandle !== null ? "move" : hoveredDrawing === null ? "crosshair" : "pointer")
        : "grabbing")
      : "row-resize",
  );
  deps.render();
}
