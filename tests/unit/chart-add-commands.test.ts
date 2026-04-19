import { describe, expect, it, vi } from "vitest";

import {
  addHorizontalLineDrawingCommand,
  addTargetedSeries,
  addTargetedStudy,
  addTrendLineDrawingCommand,
  addVolumeSeriesCommand,
  resolveSeriesTarget,
} from "../../src/lib/chartx/internal/views/chart-add-commands";

describe("chart add commands use-case", () => {
  it("resolves series targets across primary, existing secondary, and newly created panes", () => {
    const secondaryHandle = { id: "handle-1" } as never;
    expect(resolveSeriesTarget(undefined, {
      defaultToSecondary: false,
      allowPrimary: true,
    }, {
      listPanes: () => [{ id: "primary", kind: "primary" }],
      getPaneByIndex: () => undefined,
      getPaneByHandle: () => undefined,
      addPane: () => secondaryHandle,
      getPaneId: () => "pane-1",
    })).toEqual({ kind: "primary" });

    expect(resolveSeriesTarget(undefined, {
      defaultToSecondary: true,
      allowPrimary: false,
    }, {
      listPanes: () => [{ id: "pane-2", kind: "secondary" }],
      getPaneByIndex: () => undefined,
      getPaneByHandle: () => undefined,
      addPane: () => secondaryHandle,
      getPaneId: () => "pane-1",
    })).toEqual({ kind: "secondary", paneId: "pane-2" });

    expect(resolveSeriesTarget(undefined, {
      defaultToSecondary: true,
      allowPrimary: false,
    }, {
      listPanes: () => [],
      getPaneByIndex: () => undefined,
      getPaneByHandle: () => undefined,
      addPane: () => secondaryHandle,
      getPaneId: () => "pane-1",
    })).toEqual({ kind: "secondary", paneId: "pane-1" });
  });

  it("routes series/study/drawing add commands through resolved target dispatch", () => {
    expect(addTargetedSeries(undefined, {
      resolveTarget: () => ({ kind: "primary" }),
      addPrimary: () => "primary-series",
      addSecondary: (paneId) => `secondary:${paneId}`,
    })).toBe("primary-series");

    expect(addVolumeSeriesCommand(undefined, {
      resolveTarget: () => ({ kind: "secondary", paneId: "pane-2" }),
      addSecondary: (paneId) => `volume:${paneId}`,
    })).toBe("volume:pane-2");

    expect(addTargetedStudy(undefined, {
      resolveTarget: () => ({ kind: "primary" }),
      addToPane: (paneId) => `study:${paneId}`,
    }, {
      defaultToSecondary: true,
      allowPrimary: true,
    })).toBe("study:primary");

    expect(addHorizontalLineDrawingCommand(undefined, { price: 10 }, {
      resolveTarget: () => ({ kind: "secondary", paneId: "pane-3" }),
      createDrawing: (paneId, options) => ({ paneId, options }) as never,
    })).toEqual({
      paneId: "pane-3",
      options: { price: 10 },
    });

    expect(addTrendLineDrawingCommand(undefined, { endPrice: 20 }, {
      resolveTarget: () => ({ kind: "primary" }),
      createDrawing: (paneId, options) => ({ paneId, options }) as never,
    })).toEqual({
      paneId: "primary",
      options: { endPrice: 20 },
    });
  });

  it("rejects primary-only targets for volume series", () => {
    expect(() =>
      addVolumeSeriesCommand(undefined, {
        resolveTarget: () => ({ kind: "primary" }),
        addSecondary: vi.fn(),
      })
    ).toThrow("chartx phase-one chart volume series requires a secondary pane");
  });
});
