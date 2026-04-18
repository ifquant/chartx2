import { describe, expect, it } from "vitest";

import type { PaneFrame } from "../../src/lib/chartx/internal/model";
import { buildPaneLegendEntries } from "../../src/lib/chartx/internal/views/chart-pane-legend";

describe("chart pane legend use-case", () => {
  it("uses primary legend entries when rendering the primary pane", () => {
    const calls: string[] = [];

    const entries = buildPaneLegendEntries({
      pane: { id: "primary", kind: "primary", top: 0, height: 100 } satisfies PaneFrame,
      activePane: { id: "primary", kind: "primary", top: 0, height: 100 } satisfies PaneFrame,
      crosshair: { x: 20, y: 30 },
      primarySources: ["main-1"],
      primaryRowSets: new Map([["main-1", "rows"]]),
      getSecondarySeriesForPane: () => {
        throw new Error("should not request secondary series for primary pane");
      },
      buildReadoutSeriesForPrimary: (sources, rowSets, crosshair) => {
        calls.push(`primary:${sources[0]}:${String(rowSets.get("main-1"))}:${crosshair?.y}`);
        return [{ id: "main-1", label: "Main", kind: "line", value: 1, formattedValue: "1", color: "#000" }];
      },
      buildReadoutSeriesForPane: () => {
        throw new Error("should not build pane legend entries for primary pane");
      },
    });

    expect(calls).toEqual(["primary:main-1:rows:30"]);
    expect(entries).toEqual([
      { id: "main-1", label: "Main", kind: "line", value: 1, formattedValue: "1", color: "#000" },
    ]);
  });

  it("uses secondary legend entries with pane-local crosshair coordinates", () => {
    const calls: string[] = [];

    const entries = buildPaneLegendEntries({
      pane: { id: "pane-2", kind: "secondary", top: 100, height: 80 } satisfies PaneFrame,
      activePane: { id: "pane-2", kind: "secondary", top: 100, height: 80 } satisfies PaneFrame,
      crosshair: { x: 40, y: 145 },
      primarySources: [],
      primaryRowSets: new Map(),
      getSecondarySeriesForPane: (paneId) => {
        calls.push(`secondary:${paneId}`);
        return ["study-1"];
      },
      buildReadoutSeriesForPrimary: () => {
        throw new Error("should not build primary legend entries for secondary pane");
      },
      buildReadoutSeriesForPane: (paneSeries, crosshair) => {
        calls.push(`pane:${paneSeries[0]}:${crosshair?.y}`);
        return [{ id: "study-1", label: "Study", kind: "line", value: 2, formattedValue: "2", color: "#111" }];
      },
    });

    expect(calls).toEqual(["secondary:pane-2", "pane:study-1:45"]);
    expect(entries).toEqual([
      { id: "study-1", label: "Study", kind: "line", value: 2, formattedValue: "2", color: "#111" },
    ]);
  });
});
