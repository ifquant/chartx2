import { describe, expect, it, vi } from "vitest";

import { createChartInteractionHandlers } from "../../src/lib/chartx/internal/views/chart-interaction-handlers";
import type { PaneModelState } from "../../src/lib/chartx/internal/model";

const DEFAULT_LAYOUT = {
  width: 960,
  height: 520,
  top: 28,
  right: 18,
  bottom: 34,
  left: 18,
} as const;

function createCanvasStub(): HTMLCanvasElement {
  return {
    style: { cursor: "crosshair" },
    parentElement: null,
    focus: vi.fn(),
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => false),
    getBoundingClientRect: () => ({ left: 0, top: 0 } as DOMRect),
  } as unknown as HTMLCanvasElement;
}

function createBaseDeps(overrides: Record<string, unknown> = {}) {
  const canvas = createCanvasStub();
  const panes: readonly PaneModelState[] = [
    { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
  ];
  return {
    defaultLayout: DEFAULT_LAYOUT,
    paneGap: 10,
    paneDividerHitSlop: 6,
    barSpacingBounds: { minBarSpacing: 4, maxBarSpacing: 36 },
    getCanvas: () => canvas,
    getManualLayout: () => null,
    listPanes: () => panes,
    getPointCount: () => 2,
    getBarSpacing: () => null,
    setBarSpacing: vi.fn(),
    getRightOffset: () => 0,
    setRightOffset: vi.fn(),
    getCrosshair: () => null,
    setCrosshair: vi.fn(),
    getDragState: () => null,
    setDragState: vi.fn(),
    getDrawingDragState: () => null,
    setDrawingDragState: vi.fn(),
    getPaneResizeState: () => null,
    setPaneResizeState: vi.fn(),
    setHoveredDrawingId: vi.fn(),
    setHoveredDrawingHandle: vi.fn(),
    clearDrawingSnapGuide: vi.fn(),
    resolveHitDrawing: vi.fn(() => null),
    resolveSelectedTrendLineDragHandle: vi.fn(() => null),
    applyPaneResize: vi.fn(),
    applyDrawingDrag: vi.fn(),
    focusCanvas: vi.fn(),
    renderCanvas: vi.fn(),
    selectDrawing: vi.fn(),
    buildReadout: vi.fn(() => ({ kind: "readout" })),
    emitClick: vi.fn(),
    hasSelectedDrawing: () => false,
    clearSelectedDrawing: vi.fn(),
    removeSelectedDrawing: vi.fn(),
    ...overrides,
  };
}

describe("chart interaction handlers factory", () => {
  it("renders on resize only when manual layout is not pinned", () => {
    const renderCanvas = vi.fn();
    const autoHandlers = createChartInteractionHandlers(
      createBaseDeps({ renderCanvas }),
    );
    autoHandlers.handleResize();
    expect(renderCanvas).toHaveBeenCalledTimes(1);

    const pinnedRenderCanvas = vi.fn();
    const pinnedHandlers = createChartInteractionHandlers(
      createBaseDeps({
        renderCanvas: pinnedRenderCanvas,
        getManualLayout: () => ({ width: 800, height: 500 }),
      }),
    );
    pinnedHandlers.handleResize();
    expect(pinnedRenderCanvas).not.toHaveBeenCalled();
  });

  it("routes click through select and emit using the resolved pane point", () => {
    const selectDrawing = vi.fn();
    const emitClick = vi.fn();
    const buildReadout = vi.fn(() => ({ kind: "readout" }));
    const resolveHitDrawing = vi.fn(() => ({ id: "drawing-1" }));

    const handlers = createChartInteractionHandlers(
      createBaseDeps({
        selectDrawing,
        emitClick,
        buildReadout,
        resolveHitDrawing,
      }),
    );

    handlers.handleClick({ clientX: 40, clientY: 80 } as MouseEvent);

    expect(selectDrawing).toHaveBeenCalledWith("drawing-1");
    expect(buildReadout).toHaveBeenCalled();
    expect(emitClick).toHaveBeenCalledWith(
      { kind: "readout" },
      { x: 22, y: 52 },
    );
  });
});
