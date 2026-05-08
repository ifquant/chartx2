import { describe, expect, it } from "vitest";

import {
  applyRestorableMainSeriesState,
  applyRestorablePriceScaleState,
  applyRestorableTimeScaleState,
  applySecondaryPaneState,
  finalizeRestoredChart,
  listSecondaryPaneIds,
  locateRestorableTrade,
} from "../../src/lib/internal/views/chart-state-runtime";

describe("chart state runtime", () => {
  it("lists only secondary pane ids", () => {
    expect(listSecondaryPaneIds({
      listPanes: () => [
        { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
        { id: "pane-1", kind: "secondary", preferredHeight: 120, resizable: true },
        { id: "pane-2", kind: "secondary", preferredHeight: 90, resizable: false },
      ],
    })).toEqual(["pane-1", "pane-2"]);
  });

  it("applies secondary pane restore state and emits options event", () => {
    const calls: string[] = [];
    const panes = [
      { id: "primary", kind: "primary" as const, preferredHeight: null, resizable: false },
      { id: "pane-1", kind: "secondary" as const, preferredHeight: 50, resizable: false },
      { id: "pane-2", kind: "secondary" as const, preferredHeight: 70, resizable: true },
    ];

    applySecondaryPaneState(1, { height: 120, resizable: false }, {
      listPanes: () => panes,
      emitPaneEvent: (type, paneId) => calls.push(`${type}:${paneId}`),
    });

    expect(panes[2]).toMatchObject({
      preferredHeight: 120,
      resizable: false,
    });
    expect(calls).toEqual(["options:pane-2"]);
  });

  it("applies time-scale restore state", () => {
    const calls: string[] = [];

    applyRestorableTimeScaleState({
      barSpacing: 12,
      rightOffset: 3,
      visibleLogicalRange: { from: 1, to: 8 },
    }, {
      applyOptions: (options) => calls.push(`options:${options.barSpacing}:${options.rightOffset}`),
      setVisibleLogicalRange: (range) => calls.push(`range:${range.from}:${range.to}`),
    });

    expect(calls).toEqual([
      "options:12:3",
      "range:1:8",
    ]);
  });

  it("applies price-scale restore state", () => {
    const calls: string[] = [];

    applyRestorablePriceScaleState({
      visibleRange: { minValue: 100, maxValue: 200 },
      scaleSeriesOnly: true,
    }, {
      applyOptions: (options) => calls.push(`options:${options.scaleSeriesOnly}`),
      setVisibleRange: (range) => calls.push(`range:${range?.minValue}:${range?.maxValue}`),
    });

    expect(calls).toEqual([
      "options:true",
      "range:100:200",
    ]);
  });

  it("applies main-series restore state through shared runtime", () => {
    const calls: string[] = [];

    applyRestorableMainSeriesState({ chartType: "candlestick" }, {
      applyMainSeriesState: (state) => calls.push(`main:${state.chartType}`),
    });

    expect(calls).toEqual(["main:candlestick"]);
  });

  it("routes trade-location restore through shared runtime", () => {
    const calls: string[] = [];

    locateRestorableTrade({
      request: { tradeId: "t-1" },
      overlay: { color: "#3b82f6" },
    }, {
      locateTrade: (request, overlay) => calls.push(`trade:${request.tradeId}:${overlay.color}`),
    });

    expect(calls).toEqual(["trade:t-1:#3b82f6"]);
  });

  it("renders only when finalize sees an attached canvas", () => {
    const calls: string[] = [];

    finalizeRestoredChart({
      hasCanvas: () => true,
      render: () => calls.push("render"),
    });
    finalizeRestoredChart({
      hasCanvas: () => false,
      render: () => calls.push("unexpected"),
    });

    expect(calls).toEqual(["render"]);
  });
});
