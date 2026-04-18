import { describe, expect, it } from "vitest";

import type { PaneFrame } from "../../src/lib/chartx/internal/model";
import {
  renderPriceAxes,
  renderTimeAxis,
} from "../../src/lib/chartx/internal/views/chart-axis-render";

describe("chart axis render use-case", () => {
  it("renders the primary axis only when primary rows exist and the primary pane is available", () => {
    const calls: string[] = [];
    const panes = [
      { id: "primary", kind: "primary", top: 10, height: 100 },
      { id: "pane-1", kind: "secondary", top: 110, height: 60 },
    ] satisfies PaneFrame[];

    renderPriceAxes({
      paneFrames: panes,
      activePane: panes[0]!,
      crosshair: { x: 20, y: 55 },
      hasPrimaryRows: true,
      findPrimaryPane: (nextPanes) => nextPanes.find((pane) => pane.kind === "primary"),
      drawPrimaryAxis: (pane, crosshair) => calls.push(`primary:${pane.id}:${crosshair?.x}:${crosshair?.y}`),
      getSecondaryAxisState: () => undefined,
      secondaryPaneHasRows: () => false,
      drawSecondaryAxis: () => calls.push("secondary"),
    });

    expect(calls).toEqual(["primary:primary:20:45"]);
  });

  it("renders secondary axes only for panes that have state and rows", () => {
    const calls: string[] = [];
    const panes = [
      { id: "primary", kind: "primary", top: 0, height: 100 },
      { id: "pane-1", kind: "secondary", top: 100, height: 60 },
      { id: "pane-2", kind: "secondary", top: 160, height: 70 },
      { id: "pane-3", kind: "secondary", top: 230, height: 80 },
    ] satisfies PaneFrame[];

    renderPriceAxes({
      paneFrames: panes,
      activePane: panes[2]!,
      crosshair: { x: 12, y: 188 },
      hasPrimaryRows: false,
      findPrimaryPane: () => undefined,
      drawPrimaryAxis: () => calls.push("primary"),
      getSecondaryAxisState: (paneId) =>
        paneId === "pane-1" || paneId === "pane-2" ? { paneId } : undefined,
      secondaryPaneHasRows: (paneId) => paneId === "pane-2",
      drawSecondaryAxis: (pane, state, crosshair) =>
        calls.push(`secondary:${pane.id}:${state.paneId}:${crosshair?.x}:${crosshair?.y}`),
    });

    expect(calls).toEqual(["secondary:pane-2:pane-2:12:28"]);
  });

  it("prefers primary rows for time-axis rendering and falls back to the first secondary rows", () => {
    const primaryCalls: string[] = [];
    renderTimeAxis({
      primaryRows: ["primary-row"],
      firstSecondaryRows: ["secondary-row"],
      hasRows: (rows) => (rows?.length ?? 0) > 0,
      draw: (rows) => primaryCalls.push(rows.join(",")),
    });

    const fallbackCalls: string[] = [];
    renderTimeAxis({
      primaryRows: [] as string[],
      firstSecondaryRows: ["secondary-row"],
      hasRows: (rows) => (rows?.length ?? 0) > 0,
      draw: (rows) => fallbackCalls.push(rows.join(",")),
    });

    expect(primaryCalls).toEqual(["primary-row"]);
    expect(fallbackCalls).toEqual(["secondary-row"]);
  });

  it("skips time-axis rendering when neither primary nor secondary rows are available", () => {
    const calls: string[] = [];

    renderTimeAxis({
      primaryRows: [] as string[],
      firstSecondaryRows: undefined,
      hasRows: (rows) => (rows?.length ?? 0) > 0,
      draw: () => calls.push("draw"),
    });

    expect(calls).toEqual([]);
  });
});
