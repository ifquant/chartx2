import { describe, expect, it, vi } from "vitest";

import {
  buildPaneStateById,
  buildPaneStateSnapshotByIds,
  emitPaneEvent,
  emitPaneResize,
  getPaneSeriesStates,
  removePane,
} from "../../src/lib/internal/views/chart-pane-management";

describe("chart pane management use-cases", () => {
  it("assembles pane series and pane state snapshots", () => {
    const paneSeries = getPaneSeriesStates("primary", {
      listSourcesByPane: () => [
        {
          id: "main-1",
          label: "Main 1",
          kind: "candlestick",
          role: "main-series",
          chartType: "candlestick",
          styleSchemaId: "candleStyle",
          priceScaleId: "primary-right",
          inputCapability: "ohlc",
          builder: null,
          renderer: null,
          data: [{ time: 1 }],
        },
      ],
    });

    const paneState = buildPaneStateById("primary", {
      getPaneById: () => ({ id: "primary", kind: "primary" as const, resizable: false }),
      getPaneIndex: () => 0,
      getPaneHeight: () => 320,
      getPaneSeriesStates: () => paneSeries,
    });

    const snapshot = buildPaneStateSnapshotByIds(["primary"], {
      buildPaneState: () => paneState,
    });

    expect(paneSeries).toHaveLength(1);
    expect(paneState).toMatchObject({
      paneIndex: 0,
      height: 320,
      isPrimary: true,
      seriesCount: 1,
    });
    expect(snapshot).toHaveLength(1);
  });

  it("emits pane resize and pane event payloads through shared runtime", () => {
    const resizeHandler = vi.fn();
    const paneEventHandler = vi.fn();

    emitPaneResize(new Set([resizeHandler]), "pane-2", {
      getPaneById: () => ({ id: "pane-2", kind: "secondary" as const, resizable: true }),
      getPaneIndex: () => 1,
      getPaneHeight: () => 136,
    });

    emitPaneEvent(new Set([paneEventHandler]), "resized", "pane-2", {
      buildPaneState: () => ({
        paneIndex: 1,
        height: 136,
        isPrimary: false,
        resizable: true,
        hasSeries: false,
        seriesCount: 0,
        seriesKinds: [],
        series: [],
      }),
      buildPaneSnapshot: () => [],
    });

    expect(resizeHandler).toHaveBeenCalledWith({
      paneIndex: 1,
      height: 136,
      isPrimary: false,
    });
    expect(paneEventHandler).toHaveBeenCalledWith({
      type: "resized",
      pane: {
        paneIndex: 1,
        height: 136,
        isPrimary: false,
        resizable: true,
        hasSeries: false,
        seriesCount: 0,
        seriesKinds: [],
        series: [],
      },
      panes: [],
    });
  });

  it("removes a secondary pane through shared guard and event orchestration", () => {
    const calls: string[] = [];

    removePane("pane-2", {
      getPaneById: () => ({ id: "pane-2", kind: "secondary" as const, resizable: true }),
      getSeriesCount: () => 0,
      getDrawingCount: () => 0,
      buildPaneState: () => ({
        paneIndex: 1,
        height: 136,
        isPrimary: false,
        resizable: true,
        hasSeries: false,
        seriesCount: 0,
        seriesKinds: [],
        series: [],
      }),
      buildPaneSnapshot: () => [],
      removePaneById: (paneId) => calls.push(`remove:${paneId}`),
      clearPaneResizeHandlers: (paneId) => calls.push(`clear-handlers:${paneId}`),
      removeSecondaryScale: (paneId) => calls.push(`remove-scale:${paneId}`),
      emitPaneEvent: (type, paneId) => calls.push(`event:${type}:${paneId}`),
      render: () => calls.push("render"),
    });

    expect(calls).toEqual([
      "remove:pane-2",
      "clear-handlers:pane-2",
      "remove-scale:pane-2",
      "event:removed:pane-2",
      "render",
    ]);
  });

  it("rejects removing the primary pane or panes with content", () => {
    expect(() =>
      removePane("primary", {
        getPaneById: () => ({ id: "primary", kind: "primary" as const, resizable: false }),
        getSeriesCount: () => 0,
        getDrawingCount: () => 0,
        buildPaneState: () => null,
        buildPaneSnapshot: () => [],
        removePaneById: vi.fn(),
        clearPaneResizeHandlers: vi.fn(),
        removeSecondaryScale: vi.fn(),
        emitPaneEvent: vi.fn(),
        render: vi.fn(),
      }),
    ).toThrow("chartx phase-one chart cannot remove the primary pane");

    expect(() =>
      removePane("pane-2", {
        getPaneById: () => ({ id: "pane-2", kind: "secondary" as const, resizable: true }),
        getSeriesCount: () => 1,
        getDrawingCount: () => 0,
        buildPaneState: () => null,
        buildPaneSnapshot: () => [],
        removePaneById: vi.fn(),
        clearPaneResizeHandlers: vi.fn(),
        removeSecondaryScale: vi.fn(),
        emitPaneEvent: vi.fn(),
        render: vi.fn(),
      }),
    ).toThrow("chartx phase-one chart cannot remove a pane while a series is still attached");
  });
});
