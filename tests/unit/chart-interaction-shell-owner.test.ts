import { describe, expect, it, vi } from "vitest";

import { createChartInteractionShellOwner } from "../../src/lib/chartx/internal/views/chart-interaction-shell-owner";

describe("chart interaction shell owner", () => {
  it("composes interaction handlers and canvas lifecycle through one shell owner", () => {
    const windowStub = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("window", windowStub);

    const attributes = new Set<string>();
    const canvas = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      focus: vi.fn(),
      style: { cursor: "" },
      tabIndex: -1,
      parentElement: null,
      hasAttribute: vi.fn((name: string) => attributes.has(name)),
      setAttribute: vi.fn((name: string) => {
        attributes.add(name);
      }),
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      getContext: vi.fn(),
    } as unknown as HTMLCanvasElement;

    let attachedCanvas: HTMLCanvasElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const renderCanvas = vi.fn();
    const clearSubscriptions = vi.fn();
    const clearInteractionState = vi.fn();

    const owner = createChartInteractionShellOwner({
      defaultLayout: { width: 400, height: 300, top: 20, right: 20, bottom: 20, left: 20 },
      paneGap: 16,
      paneDividerHitSlop: 8,
      barSpacingBounds: { minBarSpacing: 4, maxBarSpacing: 36 },
      getCanvas: () => attachedCanvas,
      setCanvas: (nextCanvas) => {
        attachedCanvas = nextCanvas;
      },
      getManualLayout: () => ({ width: 400, height: 300 }),
      listPanes: () => [{ id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false }],
      getPointCount: () => 5,
      getBarSpacing: () => 12,
      setBarSpacing: vi.fn(),
      getRightOffset: () => 1,
      setRightOffset: vi.fn(),
      viewState: {
        crosshair: () => null,
        setCrosshair: vi.fn(),
        dragState: () => null,
        setDragState: vi.fn(),
        drawingDragState: () => null,
        setDrawingDragState: vi.fn(),
        paneResizeState: () => null,
        setPaneResizeState: vi.fn(),
        selectedDrawingId: () => null,
        setHoveredDrawingId: vi.fn(),
        setHoveredDrawingHandle: vi.fn(),
        clearDrawingSnapGuide: vi.fn(),
        resizeObserver: () => resizeObserver,
        setResizeObserver: (observer) => {
          resizeObserver = observer;
        },
        clearInteractionState,
      },
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
      renderCanvas,
      buildReadout: vi.fn(() => ({ active: false })),
      emitClick: vi.fn(),
      clearSubscriptions,
    });

    expect(owner.handlers().handlePointerMove).toBeTypeOf("function");

    owner.attach(canvas);
    expect(attachedCanvas).toBe(canvas);
    expect(renderCanvas).toHaveBeenCalledWith(canvas);

    owner.detach();
    expect(attachedCanvas).toBeNull();
    expect(clearInteractionState).toHaveBeenCalledTimes(1);
    expect(clearSubscriptions).toHaveBeenCalledTimes(1);
    expect(windowStub.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(windowStub.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));

    vi.unstubAllGlobals();
  });
});
