import { describe, expect, it, vi } from "vitest";

import type { PaneModelState } from "../../src/lib/chartx/internal/model";
import { createChartInteractionOwner } from "../../src/lib/chartx/internal/views/chart-interaction-owner";

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
  const viewState = {
    crosshair: vi.fn(() => null),
    setCrosshair: vi.fn(),
    dragState: vi.fn(() => null),
    setDragState: vi.fn(),
    drawingDragState: vi.fn(() => null),
    setDrawingDragState: vi.fn(),
    paneResizeState: vi.fn(() => null),
    setPaneResizeState: vi.fn(),
    selectedDrawingId: vi.fn(() => null as string | null),
    setHoveredDrawingId: vi.fn(),
    setHoveredDrawingHandle: vi.fn(),
    clearDrawingSnapGuide: vi.fn(),
  };

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
    viewState,
    drawingInteractionOwner: {
      resolveHitDrawing: vi.fn(() => null),
      resolveSelectedTrendLineDragHandle: vi.fn(() => null),
      applyDrawingDrag: vi.fn(),
    },
    paneOwner: {
      applyPaneResize: vi.fn(),
    },
    drawingOwner: {
      selectDrawing: vi.fn(),
      removeSelectedDrawing: vi.fn(),
    },
    focusCanvas: vi.fn(),
    renderCanvas: vi.fn(),
    buildReadout: vi.fn(() => ({ kind: "readout" })),
    emitClick: vi.fn(),
    ...overrides,
  };
}

describe("chart interaction owner", () => {
  it("routes click selection and event publication through grouped owners", () => {
    const deps = createBaseDeps({
      drawingInteractionOwner: {
        resolveHitDrawing: vi.fn(() => ({ id: "drawing-1" })),
        resolveSelectedTrendLineDragHandle: vi.fn(() => null),
        applyDrawingDrag: vi.fn(),
      },
    });
    const handlers = createChartInteractionOwner(deps);

    handlers.handleClick({ clientX: 40, clientY: 80 } as MouseEvent);

    expect(deps.drawingOwner.selectDrawing).toHaveBeenCalledWith("drawing-1");
    expect(deps.buildReadout).toHaveBeenCalled();
    expect(deps.emitClick).toHaveBeenCalledWith(
      { kind: "readout" },
      { x: 22, y: 52 },
    );
  });

  it("routes selected drawing deletion through the drawing owner", () => {
    const preventDefault = vi.fn();
    const deps = createBaseDeps({
      viewState: {
        ...createBaseDeps().viewState,
        selectedDrawingId: vi.fn(() => "drawing-1"),
      },
    });
    const handlers = createChartInteractionOwner(deps);

    handlers.handleKeyDown({ key: "Delete", preventDefault } as unknown as KeyboardEvent);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(deps.drawingOwner.removeSelectedDrawing).toHaveBeenCalledTimes(1);
  });
});
