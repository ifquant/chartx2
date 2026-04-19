import { describe, expect, it, vi } from "vitest";

import {
  createHorizontalLineDrawingApi,
  createTrendLineDrawingApi,
} from "../../src/lib/chartx/internal/views/chart-drawing-api";

describe("chart drawing api factory", () => {
  it("creates a horizontal-line api that routes mutation, visibility, and selection through deps", () => {
    const drawing = {
      id: "drawing-1",
      kind: "horizontal-line" as const,
      paneId: "pane-2",
      line: {
        price: 10,
        color: "#111111",
        lineWidth: 1,
        title: "Line 1",
      },
    };
    const assertDrawingActive = vi.fn();
    const setVisible = vi.fn();
    const selectDrawing = vi.fn();
    const removeDrawing = vi.fn();
    const render = vi.fn();

    const api = createHorizontalLineDrawingApi({
      assertDrawingActive,
      getDrawing: () => drawing,
      setVisible,
      selectDrawing,
      removeDrawing,
      getPaneIndex: () => 2,
      render,
    });

    api.applyOptions({ price: 12, visible: false, title: "Updated" });
    api.select();
    api.remove();

    expect(drawing.line.price).toBe(12);
    expect(drawing.line.title).toBe("Updated");
    expect(setVisible).toHaveBeenCalledWith("drawing-1", false);
    expect(selectDrawing).toHaveBeenCalledWith("drawing-1");
    expect(removeDrawing).toHaveBeenCalledWith(api);
    expect(api.paneIndex()).toBe(2);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("creates a trend-line api that routes geometry updates and pane lookups through deps", () => {
    const drawing = {
      id: "drawing-2",
      kind: "trend-line" as const,
      paneId: "primary",
      startTime: 1,
      startPrice: 10,
      endTime: 3,
      endPrice: 20,
      color: "#0c8f62",
      lineWidth: 2,
    };
    const assertDrawingActive = vi.fn();
    const render = vi.fn();

    const api = createTrendLineDrawingApi({
      assertDrawingActive,
      getDrawing: () => drawing,
      setVisible: vi.fn(),
      selectDrawing: vi.fn(),
      removeDrawing: vi.fn(),
      getPaneIndex: () => 99,
      render,
    });

    api.applyOptions({ endTime: 4, endPrice: 25, color: "#c7543e", lineWidth: 0 });

    expect(drawing).toMatchObject({
      startTime: 1,
      startPrice: 10,
      endTime: 4,
      endPrice: 25,
      color: "#c7543e",
      lineWidth: 1,
    });
    expect(api.paneIndex()).toBe(0);
    expect(assertDrawingActive).toHaveBeenCalled();
    expect(render).toHaveBeenCalledOnce();
  });
});
