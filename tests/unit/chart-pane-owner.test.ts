import { describe, expect, it, vi } from "vitest";

import type {
  PhaseOnePaneApi,
  PhaseOnePaneEventType,
  PhaseOnePaneResizeHandler,
  PhaseOnePaneState,
} from "../../src/lib/chartx/internal/views/chart-api-types";
import { createChartPaneOwner } from "../../src/lib/chartx/internal/views/chart-pane-owner";

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
  preferredHeight: number | null;
  resizable: boolean;
};

function createOwnerFixture() {
  const panes = new Map<string, PaneLike>([
    ["primary", { id: "primary", kind: "primary", preferredHeight: null, resizable: false }],
    ["pane-2", { id: "pane-2", kind: "secondary", preferredHeight: 136, resizable: true }],
  ]);
  const paneOrder = ["primary", "pane-2"];
  const resizeSubscriptions = new Map<string, Set<PhaseOnePaneResizeHandler>>();
  const emittedResizeEvents: Array<{ paneId: string; paneIndex: number; height: number; isPrimary: boolean }> = [];
  const emittedPaneEvents: Array<{ type: PhaseOnePaneEventType; pane: PhaseOnePaneState; panes: readonly PhaseOnePaneState[] }> = [];
  const sourcesByPane = new Map<string, readonly unknown[]>([
    [
      "primary",
      [
        {
          id: "main-1",
          label: "Main",
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
    ],
    [
      "pane-2",
      [
        {
          id: "study-1",
          label: "MA",
          kind: "line",
          role: "study",
          studyKind: "indicator",
          inputContext: { mode: "chart-context" },
          priceScaleId: "pane-2-right",
          data: [{ time: 1 }, { time: 2 }],
        },
      ],
    ],
  ]);
  const render = vi.fn();
  const clearPaneResizeHandlers = vi.fn((paneId: string) => {
    resizeSubscriptions.delete(paneId);
  });
  const removeSecondaryScale = vi.fn();
  let crosshair: { x: number; y: number } | null = { x: 10, y: 20 };

  const owner = createChartPaneOwner({
    handlerRegistry: {
      subscribePaneResize: (paneId, handler, options) => {
        if (!options.hasPane(paneId)) {
          throw new Error("chartx phase-one pane has been removed");
        }
        const handlers = resizeSubscriptions.get(paneId) ?? new Set<PhaseOnePaneResizeHandler>();
        handlers.add(handler);
        resizeSubscriptions.set(paneId, handlers);
      },
      unsubscribePaneResize: (paneId, handler) => {
        const handlers = resizeSubscriptions.get(paneId);
        if (handlers === undefined) {
          return;
        }
        handlers.delete(handler);
        if (handlers.size === 0) {
          resizeSubscriptions.delete(paneId);
        }
      },
      clearPaneResizeHandlers,
      emitPaneResize: (paneId, deps) => {
        const pane = deps.getPaneById(paneId);
        const handlers = resizeSubscriptions.get(paneId);
        if (pane === undefined || handlers === undefined) {
          return;
        }
        const event = {
          paneId,
          paneIndex: deps.getPaneIndex(paneId),
          height: deps.getPaneHeight(paneId),
          isPrimary: pane.kind === "primary",
        };
        emittedResizeEvents.push(event);
        handlers.forEach((handler) => handler(event));
      },
      emitPaneEvent: (type, paneId, deps, explicitPaneState, explicitSnapshot) => {
        const pane = explicitPaneState ?? deps.buildPaneState(paneId);
        if (pane === null) {
          return;
        }
        emittedPaneEvents.push({
          type,
          pane,
          panes: explicitSnapshot ?? deps.buildPaneSnapshot(),
        });
      },
    },
    getPaneById: (paneId) => panes.get(paneId),
    getPaneByIndex: (index) => {
      const paneId = paneOrder[index];
      return paneId === undefined ? undefined : panes.get(paneId);
    },
    getPaneIndex: (paneId) => {
      const index = paneOrder.indexOf(paneId);
      if (index === -1) {
        throw new Error("chartx phase-one pane has been removed");
      }
      return index;
    },
    listPanes: () => paneOrder.map((paneId) => panes.get(paneId)!).filter(Boolean),
    addSecondaryPane: () => {
      const pane: PaneLike = {
        id: "pane-3",
        kind: "secondary",
        preferredHeight: 120,
        resizable: true,
      };
      panes.set(pane.id, pane);
      paneOrder.push(pane.id);
      return pane;
    },
    hasCanvas: () => true,
    getLayout: () => ({ width: 600, height: 420, top: 10, right: 10, bottom: 10, left: 10 }),
    gap: 12,
    getCrosshair: () => crosshair,
    setCrosshair: (point) => {
      crosshair = point;
    },
    getSeriesCount: (paneId) => sourcesByPane.get(paneId)?.length ?? 0,
    getDrawingCount: () => 0,
    listSourcesByPane: (paneId) => sourcesByPane.get(paneId) ?? [],
    removePaneEntry: (paneId) => {
      panes.delete(paneId);
      const index = paneOrder.indexOf(paneId);
      if (index >= 0) {
        paneOrder.splice(index, 1);
      }
      sourcesByPane.delete(paneId);
    },
    removeSecondaryScale,
    render,
  });

  return {
    owner,
    panes,
    paneOrder,
    resizeSubscriptions,
    emittedResizeEvents,
    emittedPaneEvents,
    sourcesByPane,
    render,
    clearPaneResizeHandlers,
    removeSecondaryScale,
    get crosshair() {
      return crosshair;
    },
  };
}

describe("chart pane owner", () => {
  it("resolves pane targets from indices, handles, and on-demand secondary creation", () => {
    const fixture = createOwnerFixture();
    const existingHandle = fixture.owner.createPaneHandle("pane-2");

    expect(
      fixture.owner.resolveSeriesTarget(undefined, {
        defaultToSecondary: false,
        allowPrimary: true,
      }),
    ).toEqual({ kind: "primary" });

    expect(
      fixture.owner.resolveSeriesTarget({ pane: 1 }, {
        defaultToSecondary: false,
        allowPrimary: true,
      }),
    ).toEqual({ kind: "secondary", paneId: "pane-2" });

    expect(
      fixture.owner.resolveSeriesTarget({ pane: existingHandle }, {
        defaultToSecondary: false,
        allowPrimary: true,
      }),
    ).toEqual({ kind: "secondary", paneId: "pane-2" });

    fixture.panes.delete("pane-2");
    fixture.paneOrder.splice(1, 1);
    fixture.sourcesByPane.delete("pane-2");

    expect(
      fixture.owner.resolveSeriesTarget(undefined, {
        defaultToSecondary: true,
        allowPrimary: false,
      }),
    ).toEqual({ kind: "secondary", paneId: "pane-3" });
  });

  it("publishes resize subscriptions and drag-resize events through the shared composition", () => {
    const fixture = createOwnerFixture();
    const handler = vi.fn();

    fixture.owner.subscribePaneResize("pane-2", handler);
    expect(fixture.resizeSubscriptions.get("pane-2")?.has(handler as PhaseOnePaneResizeHandler)).toBe(true);

    fixture.owner.applyPaneResize(
      40,
      { width: 600, height: 420, top: 10, right: 10, bottom: 10, left: 10 },
      {
        dividerAfterPaneId: "primary",
        dividerBeforePaneId: "pane-2",
        startClientY: 20,
        block: {
          controlledPaneId: "pane-2",
          blockPaneIds: ["primary", "pane-2"],
          startControlledHeight: 136,
          startVariableSpan: 356,
          minOpposingHeight: 160,
        },
      },
    );

    expect(fixture.panes.get("pane-2")?.preferredHeight).not.toBe(136);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(fixture.emittedResizeEvents[0]).toMatchObject({
      paneId: "pane-2",
      paneIndex: 1,
      isPrimary: false,
    });
    expect(fixture.crosshair).toEqual({ x: 10, y: expect.any(Number) });

    fixture.owner.unsubscribePaneResize("pane-2", handler);
    expect(fixture.resizeSubscriptions.has("pane-2")).toBe(false);
  });

  it("guards pane removal when series remain attached", () => {
    const fixture = createOwnerFixture();

    expect(() => fixture.owner.removePaneById("pane-2")).toThrow(
      "chartx phase-one chart cannot remove a pane while a series is still attached",
    );

    expect(fixture.clearPaneResizeHandlers).not.toHaveBeenCalled();
    expect(fixture.removeSecondaryScale).not.toHaveBeenCalled();
  });

  it("removes detached panes and publishes pane events with explicit state", () => {
    const fixture = createOwnerFixture();
    fixture.sourcesByPane.set("pane-2", []);

    const removedState = fixture.owner.buildPaneState("pane-2");
    expect(removedState).not.toBeNull();

    fixture.owner.removePaneById("pane-2");

    expect(fixture.panes.has("pane-2")).toBe(false);
    expect(fixture.clearPaneResizeHandlers).toHaveBeenCalledWith("pane-2");
    expect(fixture.removeSecondaryScale).toHaveBeenCalledWith("pane-2");
    expect(fixture.render).toHaveBeenCalled();
    expect(fixture.emittedPaneEvents).toHaveLength(1);
    expect(fixture.emittedPaneEvents[0]).toMatchObject({
      type: "removed",
      pane: removedState,
    });
    expect(fixture.emittedPaneEvents[0]?.panes).toHaveLength(1);
  });

  it("builds pane handles that resolve back to owned panes", () => {
    const fixture = createOwnerFixture();

    const handle = fixture.owner.createPaneHandle("pane-2");

    expect(handle.paneIndex()).toBe(1);
    expect(handle.getHeight()).toBeGreaterThan(0);
    expect(handle.hasSeries()).toBe(true);
    expect(fixture.owner.getPaneByHandle(handle as PhaseOnePaneApi)).toMatchObject({
      id: "pane-2",
      kind: "secondary",
    });
  });

  it("owns pane list, add, and handle removal command composition", () => {
    const fixture = createOwnerFixture();
    fixture.sourcesByPane.set("pane-2", []);

    expect(fixture.owner.listPaneHandles()).toHaveLength(2);

    const handle = fixture.owner.addPane({ height: 144 });
    expect(handle.paneIndex()).toBe(2);
    expect(fixture.panes.has("pane-3")).toBe(true);
    expect(fixture.render).toHaveBeenCalledTimes(1);
    expect(fixture.emittedPaneEvents.at(-1)).toMatchObject({
      type: "added",
      pane: { paneIndex: 2, isPrimary: false },
    });

    fixture.owner.removePaneByHandle(handle);
    expect(fixture.panes.has("pane-3")).toBe(false);
    expect(fixture.emittedPaneEvents.at(-1)).toMatchObject({
      type: "removed",
      pane: { paneIndex: 2, isPrimary: false },
    });
  });

  it("publishes explicit pane events through the shared owner composition", () => {
    const fixture = createOwnerFixture();
    const paneState = fixture.owner.buildPaneState("pane-2");
    const snapshot = fixture.owner.buildPaneStateSnapshot();

    fixture.owner.emitPaneEvent("options", "pane-2", paneState, snapshot);

    expect(fixture.emittedPaneEvents.at(-1)).toMatchObject({
      type: "options",
      pane: paneState,
      panes: snapshot,
    });
  });
});
