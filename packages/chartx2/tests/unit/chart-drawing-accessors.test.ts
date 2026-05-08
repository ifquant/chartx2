import { describe, expect, it, vi } from "vitest";

import {
  clearDrawingRegistry,
  getDrawingById,
  getDrawingCountForPane,
  listAllDrawings,
  listDrawingsByPane,
} from "../../src/lib/internal/views/chart-drawing-accessors";

describe("chart drawing accessors", () => {
  const drawings = [
    { id: "drawing-1", paneId: "primary", api: { id: "api-1" } },
    { id: "drawing-2", paneId: "pane-2", api: { id: "api-2" } },
    { id: "drawing-3", paneId: "pane-2", api: { id: "api-3" } },
  ] as const;

  it("resolves drawing lookup and pane-local listing through shared accessors", () => {
    expect(getDrawingById("drawing-2", {
      listDrawings: () => drawings,
    })).toEqual(drawings[1]);

    expect(listDrawingsByPane("pane-2", {
      listByPane: (paneId) => drawings.filter((drawing) => drawing.paneId === paneId),
    })).toEqual([drawings[1], drawings[2]]);

    expect(getDrawingCountForPane("pane-2", {
      listByPane: (paneId) => drawings.filter((drawing) => drawing.paneId === paneId),
    })).toBe(2);

    expect(listAllDrawings({
      listDrawings: () => drawings,
    })).toEqual(drawings);
  });

  it("clears the registry through the shared bulk-clear accessor", () => {
    const removeByApi = vi.fn();

    clearDrawingRegistry({
      listDrawings: () => drawings,
      removeByApi,
    });

    expect(removeByApi).toHaveBeenNthCalledWith(1, drawings[0].api);
    expect(removeByApi).toHaveBeenNthCalledWith(2, drawings[1].api);
    expect(removeByApi).toHaveBeenNthCalledWith(3, drawings[2].api);
  });
});
