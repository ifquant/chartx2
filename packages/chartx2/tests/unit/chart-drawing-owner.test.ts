import { describe, expect, it } from "vitest";

import {
  createChartDrawingOwner,
  type ChartDrawingDescriptor,
  type RestorableDrawingSnapshot,
} from "../../src/lib/internal/views/chart-drawing-owner";
import type { PhaseOneSelectedDrawing } from "../../src/lib/internal/views/chart-api-types";

type OwnerHarness = {
  owner: ReturnType<typeof createChartDrawingOwner<{ pane: { id: string } }>>;
  drawings: ChartDrawingDescriptor[];
  notifications: PhaseOneSelectedDrawing[];
  getSelectedDrawingId(): string | null;
  getRenderCount(): number;
};

function createOwnerHarness(): OwnerHarness {
  const panes = [
    { id: "primary" },
    { id: "pane-1" },
  ] as const;
  const drawings: ChartDrawingDescriptor[] = [];
  const notifications: PhaseOneSelectedDrawing[] = [];
  let ordinal = 1;
  let selectedDrawingId: string | null = null;
  let renderCount = 0;

  const owner = createChartDrawingOwner({
    allocateDrawingOrdinal: () => ordinal++,
    formatSeriesKindLabel: (kind) => kind === "horizontal-line" ? "Horizontal Line" : "Trend Line",
    resolveTarget: (target) => {
      if (target?.pane === undefined || target.pane === 0) {
        return { kind: "primary" as const };
      }
      return { kind: "secondary" as const, paneId: "pane-1" };
    },
    getPaneById: (paneId) => panes.find((pane) => pane.id === paneId),
    getPaneByIndex: (index) => panes[index],
    createPaneTarget: (pane) => ({ pane }),
    getRestorePaneId: (target) => target.pane.id,
    getPaneIndex: (paneId) => panes.findIndex((pane) => pane.id === paneId),
    registry: {
      register: (drawing) => {
        drawings.push(drawing);
      },
      setVisible: (id, visible) => {
        const drawing = drawings.find((entry) => entry.id === id);
        if (drawing !== undefined) {
          drawing.visible = visible;
        }
      },
      getByApi: (api) => drawings.find((drawing) => drawing.api === api),
      hasApi: (api) => drawings.some((drawing) => drawing.api === api),
      list: () => drawings,
      listByPane: (paneId) => drawings.filter((drawing) => drawing.paneId === paneId),
      removeByApi: (api) => {
        const index = drawings.findIndex((drawing) => drawing.api === api);
        if (index < 0) {
          return undefined;
        }
        return drawings.splice(index, 1)[0];
      },
    },
    createPriceLineState: (options) => ({
      id: "price-line",
      price: options.price ?? 0,
      color: options.color ?? "#111111",
      lineWidth: options.lineWidth ?? 1,
      title: options.title ?? "Untitled",
    }),
    lineColor: "#ff6600",
    resolveTrendLineDefaults: () => ({
      startTime: 10,
      startPrice: 100,
      endTime: 20,
      endPrice: 110,
    }),
    resolveMagnetOptions: (drawing) => ({
      magnetEnabled: ("magnetEnabled" in drawing ? drawing.magnetEnabled : undefined) ?? false,
      magnetTolerancePx: ("magnetTolerancePx" in drawing ? drawing.magnetTolerancePx : undefined) ?? 8,
      timeMagnetEnabled: ("timeMagnetEnabled" in drawing ? drawing.timeMagnetEnabled : undefined) ?? false,
      timeMagnetPolicy: ("timeMagnetPolicy" in drawing ? drawing.timeMagnetPolicy : undefined) ?? "nearest",
      timeMagnetTolerancePx:
        ("timeMagnetTolerancePx" in drawing ? drawing.timeMagnetTolerancePx : undefined) ?? 10,
      magnetSources: {
        open: ("magnetSources" in drawing ? drawing.magnetSources?.open : undefined) ?? true,
        high: ("magnetSources" in drawing ? drawing.magnetSources?.high : undefined) ?? true,
        low: ("magnetSources" in drawing ? drawing.magnetSources?.low : undefined) ?? true,
        close: ("magnetSources" in drawing ? drawing.magnetSources?.close : undefined) ?? true,
      },
    }),
    resolvePropertySchema: (type) => ({
      kind: type,
      sections: [
        {
          id: "appearance",
          label: "Appearance",
          fields: [],
        },
      ],
    }),
    view: {
      selectedDrawingId: () => selectedDrawingId,
      setSelectedDrawingId: (id) => {
        selectedDrawingId = id;
      },
      notifySelectionChange: (selection) => {
        notifications.push(selection);
      },
      render: () => {
        renderCount += 1;
      },
    },
  });

  return {
    owner,
    drawings,
    notifications,
    getSelectedDrawingId: () => selectedDrawingId,
    getRenderCount: () => renderCount,
  };
}

describe("chart drawing owner", () => {
  it("builds selected drawing public state and schema through one owner surface", () => {
    const harness = createOwnerHarness();
    const trend = harness.owner.addTrendLine(
      { pane: 1 },
      {
        startTime: 5,
        startPrice: 100,
        endTime: 8,
        endPrice: 106,
        lineWidth: 3,
        magnetEnabled: true,
      },
    );

    trend.select();

    expect(harness.owner.getSelectedDrawing()).toEqual({
      id: "drawing-1",
      kind: "trend-line",
      paneIndex: 1,
    });

    expect(harness.owner.getSelectedDrawingState()).toMatchObject({
      type: "trend-line",
      paneIndex: 1,
      options: {
        startTime: 5,
        startPrice: 100,
        endTime: 8,
        endPrice: 106,
        lineWidth: 3,
        magnetEnabled: true,
      },
    });

    expect(harness.owner.getSelectedDrawingPropertySchema()).toEqual({
      kind: "trend-line",
      sections: [
        {
          id: "appearance",
          label: "Appearance",
          fields: [],
        },
      ],
    });

    harness.owner.applySelectedDrawingOptions({
      lineWidth: 5,
      visible: false,
    });

    expect(harness.owner.getSelectedDrawingState()).toMatchObject({
      type: "trend-line",
      options: {
        lineWidth: 5,
        visible: false,
      },
    });
  });

  it("notifies selection changes when drawings are created, selected, and removed", () => {
    const harness = createOwnerHarness();
    const line = harness.owner.addHorizontalLine(undefined, {
      price: 42,
      title: "Support",
    });

    expect(harness.owner.listDrawings()).toHaveLength(1);
    expect(harness.owner.countDrawingsByPane("primary")).toBe(1);
    expect(harness.getRenderCount()).toBe(1);

    line.select();
    expect(harness.notifications).toEqual([
      {
        id: "drawing-1",
        kind: "horizontal-line",
        paneIndex: 0,
      },
    ]);

    harness.owner.removeSelectedDrawing();

    expect(harness.owner.listDrawings()).toEqual([]);
    expect(harness.owner.getSelectedDrawing()).toBeNull();
    expect(harness.notifications).toEqual([
      {
        id: "drawing-1",
        kind: "horizontal-line",
        paneIndex: 0,
      },
      null,
    ]);
  });

  it("restores drawing snapshots through pane-target glue", () => {
    const harness = createOwnerHarness();
    const snapshots: readonly RestorableDrawingSnapshot[] = [
      {
        type: "horizontal-line",
        paneIndex: 0,
        options: {
          price: 12,
          title: "Primary",
        },
      },
      {
        type: "trend-line",
        paneIndex: 1,
        options: {
          startTime: 1,
          startPrice: 10,
          endTime: 2,
          endPrice: 11,
        },
      },
    ];

    harness.owner.restoreDrawings(snapshots);

    expect(harness.owner.listDrawings().map((drawing: ChartDrawingDescriptor) => ({
      id: drawing.id,
      kind: drawing.kind,
      paneId: drawing.paneId,
    }))).toEqual([
      {
        id: "drawing-1",
        kind: "horizontal-line",
        paneId: "primary",
      },
      {
        id: "drawing-2",
        kind: "trend-line",
        paneId: "pane-1",
      },
    ]);
  });

  it("cleans up stale selected drawing ids without mutating the registry", () => {
    const harness = createOwnerHarness();
    const line = harness.owner.addHorizontalLine(undefined, {
      price: 7,
    });

    line.select();
    harness.drawings.splice(0, harness.drawings.length);

    expect(harness.owner.cleanupStaleSelection()).toBe(true);
    expect(harness.getSelectedDrawingId()).toBeNull();
    expect(harness.notifications.at(-1)).toBeNull();
    expect(harness.getRenderCount()).toBe(2);
    expect(harness.owner.cleanupStaleSelection()).toBe(false);
  });
});
