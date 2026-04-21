import { describe, expect, it } from "vitest";

import type { PaneFrame } from "../../src/lib/chartx/internal/model";
import {
  drawPaneCrosshair,
  drawPaneLegend,
  renderPaneChrome,
} from "../../src/lib/chartx/internal/views/chart-pane-chrome";

function createContextRecorder() {
  const calls: string[] = [];
  const context = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textBaseline: "",
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    setLineDash: (value: readonly number[]) => calls.push(`dash:${value.join(",")}`),
    beginPath: () => calls.push("beginPath"),
    moveTo: (x: number, y: number) => calls.push(`moveTo:${x}:${y}`),
    lineTo: (x: number, y: number) => calls.push(`lineTo:${x}:${y}`),
    stroke: () => calls.push("stroke"),
    arc: (x: number, y: number, radius: number) => calls.push(`arc:${x}:${y}:${radius}`),
    fill: () => calls.push("fill"),
    measureText: (text: string) => ({ width: text.length * 5 }),
    fillRect: (x: number, y: number, width: number, height: number) =>
      calls.push(`fillRect:${x}:${y}:${width}:${height}`),
    strokeRect: (x: number, y: number, width: number, height: number) =>
      calls.push(`strokeRect:${x}:${y}:${width}:${height}`),
    fillText: (text: string, x: number, y: number) => calls.push(`fillText:${text}:${x}:${y}`),
  } as unknown as CanvasRenderingContext2D;
  return { context, calls };
}

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

  it("draws pane crosshair lines and anchor point", () => {
    const { context, calls } = createContextRecorder();

    drawPaneCrosshair(context, 120, 80, { x: 10.2, y: 20.7 }, {
      lineColor: "#111",
      pointColor: "#222",
    });

    expect(context.strokeStyle).toBe("#111");
    expect(context.fillStyle).toBe("#222");
    expect(calls).toEqual([
      "save",
      "dash:4,4",
      "beginPath",
      "moveTo:10.5:0",
      "lineTo:10.5:80",
      "stroke",
      "beginPath",
      "moveTo:0:21.5",
      "lineTo:120:21.5",
      "stroke",
      "dash:",
      "beginPath",
      "arc:10.2:20.7:2.5",
      "fill",
      "restore",
    ]);
  });

  it("draws pane legend chips for readout entries", () => {
    const { context, calls } = createContextRecorder();

    drawPaneLegend(context, [{
      id: "main",
      label: "Main",
      kind: "line",
      value: 10,
      formattedValue: "10.00",
      color: "#0f0",
    }]);

    expect(context.font).toBe('11px "SF Mono", "Menlo", monospace');
    expect(context.textBaseline).toBe("top");
    expect(calls).toContain("fillRect:10:8:72:18");
    expect(calls).toContain("strokeRect:10.5:8.5:71:17");
    expect(calls).toContain("arc:17:17:3");
    expect(calls).toContain("fillText:Main 10.00:23:12");
  });
});
