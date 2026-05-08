import { describe, expect, it, vi } from "vitest";

import {
  emitChartTypeChangeRuntime,
  emitClickRuntime,
  emitCrosshairMoveEventRuntime,
  emitPaneEventRuntime,
  emitPaneResizeEvent,
  notifyHandlers,
} from "../../src/lib/internal/views/chart-event-runtime";

describe("chart event runtime use-case", () => {
  it("notifies handler collections through a shared helper", () => {
    const handler = vi.fn();
    notifyHandlers([handler], "payload");
    expect(handler).toHaveBeenCalledWith("payload");
  });

  it("emits pane resize and pane events through shared event builders", () => {
    const resizeHandler = vi.fn();
    emitPaneResizeEvent(new Set([resizeHandler]), "pane-2", {
      getPaneById: () => ({ kind: "secondary" }),
      getPaneIndex: () => 1,
      getPaneHeight: () => 180,
    });
    expect(resizeHandler).toHaveBeenCalledWith({
      paneIndex: 1,
      height: 180,
      isPrimary: false,
    });

    const paneHandler = vi.fn();
    emitPaneEventRuntime(new Set([paneHandler]), "options", "pane-2", {
      buildPaneState: () => ({
        paneIndex: 1,
        height: 180,
        isPrimary: false,
        resizable: true,
        hasSeries: true,
        seriesCount: 1,
        seriesKinds: ["line"],
        series: [],
      }),
      buildPaneSnapshot: () => [],
    });
    expect(paneHandler).toHaveBeenCalledWith({
      type: "options",
      pane: {
        paneIndex: 1,
        height: 180,
        isPrimary: false,
        resizable: true,
        hasSeries: true,
        seriesCount: 1,
        seriesKinds: ["line"],
        series: [],
      },
      panes: [],
    });
  });

  it("emits crosshair, click, and chart-type events through shared runtime dispatch", () => {
    const crosshairHandler = vi.fn();
    emitCrosshairMoveEventRuntime(new Set([crosshairHandler]), {
      paneIndex: 0,
      logicalIndex: 2,
      series: [],
      tradeLocationState: null,
    } as never, { x: 10, y: 20 });
    expect(crosshairHandler).toHaveBeenCalledTimes(1);

    const clickHandler = vi.fn();
    emitClickRuntime(new Set([clickHandler]), {
      paneIndex: 0,
      logicalIndex: 2,
      series: [],
      tradeLocationState: null,
    } as never, { x: 10, y: 20 });
    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(clickHandler.mock.calls[0]?.[0]?.point).toEqual({ x: 10, y: 20 });

    const chartTypeHandler = vi.fn();
    emitChartTypeChangeRuntime(new Set([chartTypeHandler]), "candlestick" as never);
    expect(chartTypeHandler).toHaveBeenCalledWith("candlestick");
  });
});
