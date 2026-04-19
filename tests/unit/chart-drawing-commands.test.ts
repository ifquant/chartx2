import { describe, expect, it, vi } from "vitest";

import {
  applySelectedDrawingOptions,
  clearSelectedDrawing,
  getSelectedDrawingPropertySchema,
  getSelectedDrawingState,
} from "../../src/lib/chartx/internal/views/chart-drawing-commands";

describe("chart drawing commands use-case", () => {
  it("builds the selected drawing snapshot through shared snapshot deps", () => {
    const snapshot = getSelectedDrawingState({
      selectedDrawingId: "drawing-1",
      getDrawingById: (id) =>
        id === "drawing-1"
          ? {
              id,
              paneId: "primary",
              visible: true,
              kind: "horizontal-line" as const,
              api: { applyOptions: vi.fn() },
              line: {
                price: 12,
                color: "#3b82f6",
                lineWidth: 2,
                title: "Line 1",
              },
            }
          : undefined,
      snapshotDeps: {
        getPaneIndex: () => 0,
        resolveMagnetOptions: () => ({
          magnetEnabled: false,
          magnetGuideVisible: false,
          magnetLabelVisible: false,
          magnetTolerancePx: 4,
          timeMagnetEnabled: false,
          timeMagnetPolicy: "nearest",
          timeMagnetGuideVisible: false,
          timeMagnetLabelVisible: false,
          timeMagnetTolerancePx: 6,
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
      type: "horizontal-line",
      paneIndex: 0,
      options: {
        price: 12,
        color: "#3b82f6",
        lineWidth: 2,
        title: "Line 1",
      },
    });
  });

  it("resolves selected drawing property schema from the snapshot type", () => {
    const schema = getSelectedDrawingPropertySchema(
      { type: "trend-line" } as never,
      (type) => ({
        kind: type,
        sections: [],
      }),
    );

    expect(schema).toEqual({
      kind: "trend-line",
      sections: [],
    });
    expect(getSelectedDrawingPropertySchema(null, () => ({ kind: "horizontal-line", sections: [] }))).toBeNull();
  });

  it("applies selected drawing options through the selected drawing api", () => {
    const applyOptionsSpy = vi.fn();
    applySelectedDrawingOptions({
      selectedDrawingId: "drawing-2",
      getDrawingById: () => ({
        id: "drawing-2",
        kind: "horizontal-line",
        paneId: "primary",
        visible: true,
        line: {
          price: 10,
          color: "#111111",
          lineWidth: 1,
          title: "Line 1",
        },
        api: {
          applyOptions: applyOptionsSpy,
        },
      }),
      options: { visible: false },
    });

    expect(applyOptionsSpy).toHaveBeenCalledWith({ visible: false });
    expect(() =>
      applySelectedDrawingOptions({
        selectedDrawingId: null,
        getDrawingById: () => undefined,
        options: {},
      })
    ).toThrow("chartx phase-one chart has no selected drawing to update");
  });

  it("clears the selected drawing through the provided callback", () => {
    const clearSelection = vi.fn();
    clearSelectedDrawing(clearSelection);
    expect(clearSelection).toHaveBeenCalledOnce();
  });
});
