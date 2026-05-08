import { describe, expect, it, vi } from "vitest";

import {
  buildSelectedDrawingState,
  removeDrawing,
  removeSelectedDrawing,
  requireDrawingByApi,
  selectDrawing,
} from "../../src/lib/internal/views/chart-drawing-session";

type Drawing = {
  id: string;
  kind: "horizontal-line" | "trend-line";
  paneId: string;
  visible: boolean;
  api: { id: string };
};

describe("chart drawing session use-case", () => {
  it("requires an active drawing api from the registry", () => {
    const drawing = {
      id: "drawing-1",
      kind: "horizontal-line" as const,
      paneId: "primary",
      visible: true,
      api: { id: "api-1" },
    };

    expect(requireDrawingByApi(drawing.api, {
      getByApi: () => drawing,
    })).toBe(drawing);
    expect(() =>
      requireDrawingByApi(drawing.api, {
        getByApi: () => undefined,
      })
    ).toThrow("chartx phase-one drawing has been removed");
  });

  it("builds selected drawing state with pane index normalization", () => {
    const getById = (id: string): Drawing | undefined =>
      id === "drawing-2"
        ? { id, kind: "trend-line", paneId: "pane-2", visible: true, api: { id: "api-2" } }
        : undefined;

    expect(buildSelectedDrawingState("drawing-2", {
      getById,
      getPaneIndex: () => 3,
    })).toEqual({
      id: "drawing-2",
      kind: "trend-line",
      paneIndex: 3,
    });
    expect(buildSelectedDrawingState("missing", {
      getById,
      getPaneIndex: () => 3,
    })).toBeNull();
  });

  it("selects a drawing, emits selection change, and renders when requested", () => {
    const notifySelectionChange = vi.fn();
    const render = vi.fn();

    const nextId = selectDrawing({
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
    });

    expect(nextId).toBe("drawing-1");
    expect(notifySelectionChange).toHaveBeenCalledWith({
      id: "drawing-1",
      kind: "horizontal-line",
      paneIndex: 0,
    });
    expect(render).toHaveBeenCalledOnce();
  });

  it("removes drawings and clears the selection when the removed drawing was active", () => {
    const clearSelection = vi.fn();
    const render = vi.fn();

    removeDrawing({
      api: { id: "api-1" },
      selectedDrawingId: "drawing-1",
      registry: {
        removeByApi: () => ({
          id: "drawing-1",
          kind: "horizontal-line",
          paneId: "primary",
          visible: true,
          api: { id: "api-1" },
        }),
      },
      clearSelection,
      render,
    });

    expect(clearSelection).toHaveBeenCalledWith(false);
    expect(render).toHaveBeenCalledOnce();
  });

  it("removes the selected drawing or clears stale selection state", () => {
    const clearSelection = vi.fn();
    const render = vi.fn();
    const removeByApi = vi.fn();

    removeSelectedDrawing({
      selectedDrawingId: "drawing-1",
      getById: () => undefined,
      clearSelection,
      removeByApi,
      render,
    });

    expect(clearSelection).toHaveBeenCalledWith(false);
    expect(render).toHaveBeenCalledOnce();
    expect(removeByApi).not.toHaveBeenCalled();

    removeSelectedDrawing({
      selectedDrawingId: "drawing-2",
      getById: () => ({
        id: "drawing-2",
        kind: "trend-line",
        paneId: "pane-2",
        visible: true,
        api: { id: "api-2" },
      }),
      clearSelection,
      removeByApi,
      render,
    });

    expect(removeByApi).toHaveBeenCalledWith({ id: "api-2" });
  });
});
