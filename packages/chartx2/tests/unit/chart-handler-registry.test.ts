import { describe, expect, it, vi } from "vitest";

import { createChartHandlerRegistry } from "../../src/lib/internal/views/chart-handler-registry";

describe("chart handler registry", () => {
  it("subscribes and emits public handlers through the shared registry", () => {
    const registry = createChartHandlerRegistry();

    const crosshairHandler = vi.fn();
    const clickHandler = vi.fn();
    const drawingSelectionHandler = vi.fn();
    const chartTypeHandler = vi.fn();

    registry.subscribeCrosshairMove(crosshairHandler);
    registry.subscribeClick(clickHandler);
    registry.subscribeDrawingSelectionChange(drawingSelectionHandler);
    registry.subscribeChartTypeChange(chartTypeHandler);

    registry.emitCrosshairMove({ active: true } as never, { x: 12, y: 24 });
    registry.emitClick({ active: true } as never, { x: 12, y: 24 });
    registry.notifyDrawingSelectionChange({ id: "drawing-1", kind: "trend-line", paneIndex: 1 });
    registry.emitChartTypeChange("line");

    expect(crosshairHandler).toHaveBeenCalledWith({
      active: true,
      point: { x: 12, y: 24 },
    });
    expect(clickHandler).toHaveBeenCalledWith({
      active: true,
      point: { x: 12, y: 24 },
    });
    expect(drawingSelectionHandler).toHaveBeenCalledWith({ id: "drawing-1", kind: "trend-line", paneIndex: 1 });
    expect(chartTypeHandler).toHaveBeenCalledWith("line");
  });

  it("tracks pane resize handlers and clears them through the shared registry", () => {
    const registry = createChartHandlerRegistry();

    const resizeHandler = vi.fn();
    registry.subscribePaneResize("pane-2", resizeHandler, {
      hasPane: () => true,
    });

    registry.emitPaneResize("pane-2", {
      getPaneById: () => ({ kind: "secondary" }),
      getPaneIndex: () => 1,
      getPaneHeight: () => 144,
    });
    expect(resizeHandler).toHaveBeenCalledWith({
      paneIndex: 1,
      height: 144,
      isPrimary: false,
    });

    resizeHandler.mockClear();
    registry.clearPaneResizeHandlers("pane-2");
    registry.emitPaneResize("pane-2", {
      getPaneById: () => ({ kind: "secondary" }),
      getPaneIndex: () => 1,
      getPaneHeight: () => 144,
    });
    expect(resizeHandler).not.toHaveBeenCalled();
  });
});
