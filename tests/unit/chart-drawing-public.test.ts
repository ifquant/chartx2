import { describe, expect, it, vi } from "vitest";

import {
  applySelectedDrawingOptions,
  clearSelectedDrawing,
  getSelectedDrawing,
  getSelectedDrawingPropertySchema,
  getSelectedDrawingState,
} from "../../src/lib/chartx/internal/views/chart-drawing-public";

describe("chart drawing public use-cases", () => {
  it("routes selected drawing public state through drawing-focused helpers", () => {
    const drawing = {
      id: "drawing-1",
      kind: "trend-line" as const,
      paneId: "pane-2",
      visible: true,
      startTime: 1,
      startPrice: 10,
      endTime: 2,
      endPrice: 11,
      color: "#111",
      lineWidth: 2,
      title: "Trend",
      api: {
        applyOptions: vi.fn(),
      },
    };

    expect(getSelectedDrawing("drawing-1", {
      getById: (id) => id === "drawing-1" ? drawing : undefined,
      getPaneIndex: () => 1,
    })).toEqual({
      id: "drawing-1",
      kind: "trend-line",
      paneIndex: 1,
    });

    const snapshot = getSelectedDrawingState({
      selectedDrawingId: "drawing-1",
      getDrawingById: (id) => id === "drawing-1" ? drawing : undefined,
      snapshotDeps: {
        getPaneIndex: () => 1,
        resolveMagnetOptions: () => ({
          magnetEnabled: true,
          magnetTolerancePx: 8,
          timeMagnetEnabled: true,
          timeMagnetPolicy: "nearest" as const,
          timeMagnetTolerancePx: 10,
          magnetSources: {
            open: true,
            high: true,
            low: true,
            close: true,
          },
        }),
      },
    });

    expect(snapshot).toMatchObject({
      type: "trend-line",
      paneIndex: 1,
    });
    expect(getSelectedDrawingPropertySchema(snapshot, (type) => ({ kind: type, sections: [] }))).toEqual({
      kind: "trend-line",
      sections: [],
    });

    applySelectedDrawingOptions({
      selectedDrawingId: "drawing-1",
      getDrawingById: (id) => id === "drawing-1" ? drawing : undefined,
      options: { lineWidth: 3 },
    });
    expect(drawing.api.applyOptions).toHaveBeenCalledWith({ lineWidth: 3 });
  });

  it("clears selected drawing through the shared drawing public helper", () => {
    const clearSelection = vi.fn();
    clearSelectedDrawing(clearSelection);
    expect(clearSelection).toHaveBeenCalledTimes(1);
  });
});
