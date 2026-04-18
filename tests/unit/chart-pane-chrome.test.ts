import { describe, expect, it } from "vitest";

import type { PaneFrame } from "../../src/lib/chartx/internal/model";
import { renderPaneChrome } from "../../src/lib/chartx/internal/views/chart-pane-chrome";

describe("chart pane chrome use-case", () => {
  it("renders primary-pane chrome with primary legend entries and pane-local crosshair", () => {
    const calls: string[] = [];
    const pane = { id: "primary", kind: "primary", top: 10, height: 100 } satisfies PaneFrame;

    renderPaneChrome({
      pane,
      activePane: pane,
      crosshair: { x: 30, y: 64 },
      primarySources: ["main-1"],
      primaryRowSets: new Map([["main-1", []]]),
      getSecondarySeriesForPane: () => {
        throw new Error("should not request secondary series for primary pane chrome");
      },
      buildReadoutSeriesForPrimary: (sources, rowSets, crosshair) => {
        calls.push(`primary:${sources[0]}:${rowSets.has("main-1")}:${crosshair?.y}`);
        return [{ id: "main-1", label: "Main", kind: "line", value: 1, formattedValue: "1", color: "#000" }];
      },
      buildReadoutSeriesForPane: () => {
        throw new Error("should not build secondary legend entries for primary pane chrome");
      },
      drawLegend: (entries) => calls.push(`legend:${entries[0]?.id}`),
      drawCrosshair: (crosshair) => calls.push(`crosshair:${crosshair?.x}:${crosshair?.y}`),
      drawFrameBorder: () => calls.push("frame"),
    });

    expect(calls).toEqual([
      "primary:main-1:true:54",
      "legend:main-1",
      "crosshair:30:54",
      "frame",
    ]);
  });

  it("renders secondary-pane chrome with pane legend entries and null crosshair when inactive", () => {
    const calls: string[] = [];
    const pane = { id: "pane-2", kind: "secondary", top: 100, height: 80 } satisfies PaneFrame;

    renderPaneChrome({
      pane,
      activePane: { id: "primary", kind: "primary", top: 0, height: 100 } satisfies PaneFrame,
      crosshair: { x: 50, y: 120 },
      primarySources: [],
      primaryRowSets: new Map(),
      getSecondarySeriesForPane: (paneId) => {
        calls.push(`secondary:${paneId}`);
        return ["study-1"];
      },
      buildReadoutSeriesForPrimary: () => {
        throw new Error("should not build primary legend entries for secondary pane chrome");
      },
      buildReadoutSeriesForPane: (series, crosshair) => {
        calls.push(`pane:${series[0]}:${String(crosshair)}`);
        return [{ id: "study-1", label: "Study", kind: "line", value: 2, formattedValue: "2", color: "#111" }];
      },
      drawLegend: (entries) => calls.push(`legend:${entries[0]?.id}`),
      drawCrosshair: (crosshair) => calls.push(`crosshair:${String(crosshair)}`),
      drawFrameBorder: () => calls.push("frame"),
    });

    expect(calls).toEqual([
      "secondary:pane-2",
      "pane:study-1:null",
      "legend:study-1",
      "crosshair:null",
      "frame",
    ]);
  });
});
