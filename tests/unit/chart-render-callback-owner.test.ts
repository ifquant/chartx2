import { describe, expect, it } from "vitest";

import { createChartRenderCallbackOwner } from "../../src/lib/chartx/internal/views/chart-render-callback-owner";

describe("chart render callback owner", () => {
  it("groups render callback dependencies behind one surface", () => {
    const log: string[] = [];
    const runtime = {
      lineRenderer: {},
      areaRenderer: {},
      baselineRenderer: {},
      barRenderer: {},
      candlesRenderer: {},
      pointFigureRenderer: {},
      histogramRenderer: {},
      kagiRenderer: {},
    };
    const crosshair = { x: 10, y: 20 };
    const owner = createChartRenderCallbackOwner({
      getRendererRuntime: () => runtime,
      drawGrid: (_context, params) => log.push(`grid:${params.width}:${params.height}:${params.lineColor}`),
      emitCrosshairMove: (readout, point) => log.push(`crosshair:${readout.active}:${point?.x}`),
      getCrosshair: () => crosshair,
      backgroundColor: () => "#fffdf7",
      resolveBarSpacing: (current, width, count) => (current ?? 0) + width + count,
    });

    owner.drawGrid({} as CanvasRenderingContext2D, {
      width: 100,
      height: 80,
      columns: 8,
      rows: 5,
      lineColor: "#dddddd",
    });
    owner.emitCrosshairMove({ active: true } as never);

    expect(owner.getRendererRuntime()).toBe(runtime);
    expect(owner.backgroundColor()).toBe("#fffdf7");
    expect(owner.resolveBarSpacing(2, 100, 3)).toBe(105);
    expect(log).toEqual(["grid:100:80:#dddddd", "crosshair:true:10"]);
  });
});
