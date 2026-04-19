import { describe, expect, it, vi } from "vitest";

import {
  applyActiveTrendLineDrag,
  removeActiveDrawing,
  removeSelectedActiveDrawing,
  requireActiveDrawingByApi,
  resolveSelectedTrendLineDrag,
  selectActiveDrawing,
} from "../../src/lib/chartx/internal/views/chart-drawing-runtime";
import { PriceRangeImpl, PriceScale, TimeScale, type PaneFrame } from "../../src/lib/chartx/internal/model";
import { resolveDrawingTimeCoordinate } from "../../src/lib/chartx/internal/views/chart-drawing-geometry";

function createPriceScale(min: number, max: number): PriceScale {
  const scale = new PriceScale();
  scale.applyOptions({
    height: 100,
    priceRange: new PriceRangeImpl(min, max),
  });
  return scale;
}

describe("chart drawing runtime", () => {
  it("routes selection changes through the shared runtime", () => {
    const notifySelectionChange = vi.fn();
    const render = vi.fn();
    const setSelectedDrawingId = vi.fn();

    selectActiveDrawing({
      selectedDrawingId: null,
      nextId: "drawing-1",
      shouldRender: true,
      getById: (id) =>
        id === "drawing-1"
          ? { id, kind: "horizontal-line", paneId: "primary", visible: true, api: { id: "api-1" } }
          : undefined,
      getPaneIndex: () => 0,
      notifySelectionChange,
      render,
      setSelectedDrawingId,
    });

    expect(setSelectedDrawingId).toHaveBeenCalledWith("drawing-1");
    expect(notifySelectionChange).toHaveBeenCalledWith({
      id: "drawing-1",
      kind: "horizontal-line",
      paneIndex: 0,
    });
    expect(render).toHaveBeenCalledOnce();
  });

  it("routes remove and require behavior through the shared runtime", () => {
    const drawing = {
      id: "drawing-1",
      kind: "horizontal-line" as const,
      paneId: "primary",
      visible: true,
      api: { id: "api-1" },
    };

    expect(requireActiveDrawingByApi(drawing.api, {
      getByApi: () => drawing,
    })).toBe(drawing);

    const clearSelection = vi.fn();
    const render = vi.fn();
    removeActiveDrawing({
      api: drawing.api,
      selectedDrawingId: "drawing-1",
      removeByApi: () => drawing,
      clearSelection,
      render,
    });
    expect(clearSelection).toHaveBeenCalledWith(false);
    expect(render).toHaveBeenCalledOnce();

    const removeByApi = vi.fn();
    removeSelectedActiveDrawing({
      selectedDrawingId: "drawing-1",
      getById: () => ({ ...drawing, kind: "trend-line" as const }),
      clearSelection,
      removeByApi,
      render,
    });
    expect(removeByApi).toHaveBeenCalledWith(drawing.api);
  });

  it("resolves selected trend-line handles and applies drag updates through the shared runtime", () => {
    const pane = { id: "primary", kind: "primary", top: 0, height: 100 } satisfies PaneFrame;
    const primaryPriceScale = createPriceScale(10, 20);
    const timeScale = new TimeScale();
    timeScale.applyOptions({
      width: 100,
      pointCount: 4,
      barSpacing: 20,
      rightOffset: 0,
    });
    const drawing = {
      id: "trend-1",
      kind: "trend-line" as const,
      paneId: "primary",
      visible: true,
      api: { id: "api-1" },
      color: "#0c8f62",
      startTime: 1,
      startPrice: 10,
      endTime: 3,
      endPrice: 20,
    };
    const axisBars = [
      { time: 1, index: 0 as never },
      { time: 2, index: 1 as never },
      { time: 3, index: 2 as never },
    ] as const;
    const startX = resolveDrawingTimeCoordinate(drawing.startTime, axisBars, timeScale);
    const startY = primaryPriceScale.priceToCoordinate(drawing.startPrice)!;

    const handle = resolveSelectedTrendLineDrag({
      point: { x: startX, y: startY },
      paneFrames: [pane],
      selectedDrawingId: "trend-1",
      getById: (id) => (id === "trend-1" ? drawing : undefined),
      primaryPriceScale,
      getSecondaryPriceScale: () => undefined,
      axisBars,
      timeScale,
      hitTolerance: 16,
    });

    expect(handle).toEqual({ drawingId: "trend-1", handle: "start" });

    const clearDrawingSnapGuide = vi.fn();
    const setDrawingSnapGuide = vi.fn();
    applyActiveTrendLineDrag({
      drag: { drawingId: "trend-1", handle: "start" },
      point: { x: 40, y: 60 },
      paneFrames: [pane],
      getById: (id) => (id === "trend-1" ? drawing : undefined),
      primaryPriceScale,
      getSecondaryPriceScale: () => undefined,
      drawingOptions: {
        magnetGuideVisible: true,
        timeMagnetGuideVisible: true,
      },
      resolveSnappedTime: () => ({ time: 2, snapped: true }),
      resolveSnappedPrice: () => ({ price: 16, snapped: true, source: "high" }),
      clearDrawingSnapGuide,
      setDrawingSnapGuide,
    });

    expect(drawing.startTime).toBe(2);
    expect(drawing.startPrice).toBe(16);
    expect(setDrawingSnapGuide).toHaveBeenCalledWith({
      paneId: "primary",
      color: "#0c8f62",
      price: 16,
      source: "high",
      time: 2,
    });
    expect(clearDrawingSnapGuide).not.toHaveBeenCalled();
  });
});
