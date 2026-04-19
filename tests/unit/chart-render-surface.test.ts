import { describe, expect, it } from "vitest";

import {
  prepareCanvasRenderSurface,
  renderEmptyPlotFrame,
} from "../../src/lib/chartx/internal/views/chart-render-surface";

function createContextRecorder() {
  const calls: string[] = [];
  const context = {
    fillStyle: "",
    strokeStyle: "",
    setTransform: (...args: number[]) => calls.push(`setTransform:${args.join(",")}`),
    scale: (x: number, y: number) => calls.push(`scale:${x}:${y}`),
    clearRect: (x: number, y: number, width: number, height: number) =>
      calls.push(`clearRect:${x}:${y}:${width}:${height}`),
    fillRect: (x: number, y: number, width: number, height: number) =>
      calls.push(`fillRect:${x}:${y}:${width}:${height}`),
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    translate: (x: number, y: number) => calls.push(`translate:${x}:${y}`),
    strokeRect: (x: number, y: number, width: number, height: number) =>
      calls.push(`strokeRect:${x}:${y}:${width}:${height}`),
  };
  return { context, calls };
}

describe("chart render surface use-case", () => {
  it("prepares the canvas backing surface and fills the chart background", () => {
    const canvas = {
      width: 0,
      height: 0,
      style: {
        width: "",
        height: "",
      },
    };
    const { context, calls } = createContextRecorder();

    prepareCanvasRenderSurface({
      canvas,
      context,
      layout: { width: 400, height: 240, left: 12, top: 8 },
      dpr: 2,
      backgroundColor: "#fffaf0",
    });

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(480);
    expect(canvas.style.width).toBe("400px");
    expect(canvas.style.height).toBe("240px");
    expect(context.fillStyle).toBe("#fffaf0");
    expect(calls).toEqual([
      "setTransform:1,0,0,1,0,0",
      "scale:2:2",
      "clearRect:0:0:400:240",
      "fillRect:0:0:400:240",
    ]);
  });

  it("renders the empty-plot pane background and frame in plot-local coordinates", () => {
    const { context, calls } = createContextRecorder();

    renderEmptyPlotFrame({
      context,
      layout: { left: 16, top: 24 },
      paneWidth: 300,
      plotHeight: 180,
      paneBackgroundColor: "#fffdf7",
      frameColor: "#111111",
    });

    expect(context.fillStyle).toBe("#fffdf7");
    expect(context.strokeStyle).toBe("#111111");
    expect(calls).toEqual([
      "save",
      "translate:16:24",
      "fillRect:0:0:300:180",
      "strokeRect:0.5:0.5:299:179",
      "restore",
    ]);
  });
});
