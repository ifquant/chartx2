import { describe, expect, it } from "vitest";

import {
  createChartViewState,
} from "../../src/lib/chartx/internal/views/chart-view-state";

describe("chart view state", () => {
  it("tracks interaction and layout state through a shared owner", () => {
    const state = createChartViewState<{ x: number; y: number }, { disconnect(): void }>();

    state.setCrosshair({ x: 12, y: 34 });
    state.setSelectedDrawingId("drawing-1");
    state.setHoveredDrawingId("drawing-2");
    state.setHoveredDrawingHandle("end");
    state.setDrawingSnapGuide({
      paneId: "primary",
      color: "#000",
      price: 101,
      source: "close",
      time: 123,
    });
    state.setManualLayout({ width: 800, height: 600 });
    state.setDragState({ startClientX: 10, startRightOffset: 2 });
    state.setDrawingDragState({ drawingId: "drawing-1", handle: "start" });
    state.setPaneResizeState({
      dividerAfterPaneId: "primary",
      dividerBeforePaneId: "pane-2",
      startClientY: 300,
      startUpperHeight: 200,
      startLowerHeight: 180,
    });

    expect(state.crosshair()).toEqual({ x: 12, y: 34 });
    expect(state.selectedDrawingId()).toBe("drawing-1");
    expect(state.hoveredDrawingId()).toBe("drawing-2");
    expect(state.hoveredDrawingHandle()).toBe("end");
    expect(state.drawingSnapGuide()?.time).toBe(123);
    expect(state.manualLayout()).toEqual({ width: 800, height: 600 });
    expect(state.dragState()?.startRightOffset).toBe(2);
    expect(state.drawingDragState()?.handle).toBe("start");
    expect(state.paneResizeState()?.dividerBeforePaneId).toBe("pane-2");
  });

  it("clears snap-guide time separately and resets interaction state without dropping selection", () => {
    const state = createChartViewState<{ x: number; y: number }, { disconnect(): void }>();

    state.setSelectedDrawingId("drawing-1");
    state.setCrosshair({ x: 4, y: 8 });
    state.setHoveredDrawingId("drawing-2");
    state.setHoveredDrawingHandle("start");
    state.setDrawingSnapGuide({
      paneId: "primary",
      color: "#000",
      price: 101,
      source: "open",
      time: 77,
    });
    state.setDragState({ startClientX: 10, startRightOffset: 2 });
    state.setDrawingDragState({ drawingId: "drawing-1", handle: "end" });
    state.setPaneResizeState({
      dividerAfterPaneId: "primary",
      dividerBeforePaneId: "pane-2",
      startClientY: 300,
      startUpperHeight: 200,
      startLowerHeight: 180,
    });

    state.clearDrawingSnapGuideTimeOnly();
    expect(state.drawingSnapGuide()).toEqual({
      paneId: "primary",
      color: "#000",
      price: 101,
      source: "open",
      time: null,
    });

    state.clearInteractionState();
    expect(state.crosshair()).toBeNull();
    expect(state.hoveredDrawingId()).toBeNull();
    expect(state.hoveredDrawingHandle()).toBeNull();
    expect(state.drawingSnapGuide()).toBeNull();
    expect(state.dragState()).toBeNull();
    expect(state.drawingDragState()).toBeNull();
    expect(state.paneResizeState()).toBeNull();
    expect(state.selectedDrawingId()).toBe("drawing-1");
  });
});
