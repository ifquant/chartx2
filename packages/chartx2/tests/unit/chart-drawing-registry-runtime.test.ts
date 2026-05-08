import { describe, expect, it, vi } from "vitest";

import {
  getDrawingByIdRuntime,
  getDrawingCountForPaneRuntime,
  listAllDrawingsRuntime,
  listDrawingsByPaneRuntime,
  removeDrawingRuntime,
  removeSelectedDrawingRuntime,
  selectDrawingRuntime,
} from "../../src/lib/internal/views/chart-drawing-registry-runtime";

describe("chart drawing registry runtime", () => {
  const drawings = [
    { id: "drawing-1", kind: "horizontal-line" as const, paneId: "primary", visible: true, api: { id: "api-1" } },
    { id: "drawing-2", kind: "trend-line" as const, paneId: "pane-2", visible: true, api: { id: "api-2" } },
    { id: "drawing-3", kind: "trend-line" as const, paneId: "pane-2", visible: true, api: { id: "api-3" } },
  ] as const;

  it("routes drawing registry lookup and pane-local listing through shared runtime", () => {
    expect(getDrawingByIdRuntime("drawing-2", {
      listDrawings: () => drawings,
    })).toEqual(drawings[1]);

    expect(listDrawingsByPaneRuntime("pane-2", {
      listByPane: (paneId) => drawings.filter((drawing) => drawing.paneId === paneId),
    })).toEqual([drawings[1], drawings[2]]);

    expect(getDrawingCountForPaneRuntime("pane-2", {
      listByPane: (paneId) => drawings.filter((drawing) => drawing.paneId === paneId),
    })).toBe(2);

    expect(listAllDrawingsRuntime({
      listDrawings: () => drawings,
    })).toEqual(drawings);
  });

  it("routes selection and removal through the shared runtime", () => {
    const setSelectedDrawingId = vi.fn();
    const notifySelectionChange = vi.fn();
    const render = vi.fn();

    selectDrawingRuntime({
      selectedDrawingId: null,
      nextId: "drawing-1",
      shouldRender: true,
      getById: (id) => drawings.find((drawing) => drawing.id === id),
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

    const clearSelection = vi.fn();
    const removeByApi = vi.fn(() => drawings[0]);
    removeDrawingRuntime({
      api: drawings[0].api,
      selectedDrawingId: "drawing-1",
      removeByApi,
      clearSelection,
      render,
    });
    expect(clearSelection).toHaveBeenCalledWith(false);

    const removeByApiFromSelected = vi.fn();
    removeSelectedDrawingRuntime({
      selectedDrawingId: "drawing-2",
      getById: (id) => drawings.find((drawing) => drawing.id === id),
      clearSelection,
      removeByApi: removeByApiFromSelected,
      render,
    });
    expect(removeByApiFromSelected).toHaveBeenCalledWith(drawings[1].api);
  });
});
