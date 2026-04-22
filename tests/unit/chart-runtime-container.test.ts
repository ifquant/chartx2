import { describe, expect, it } from "vitest";

import { createChartRuntimeContainer } from "../../src/lib/chartx/internal/views/chart-runtime-container";

describe("chart runtime container", () => {
  it("creates the shared runtime graph behind one container surface", () => {
    const runtime = createChartRuntimeContainer();

    expect(runtime.listPanes()).toBe(runtime.chartModel.panes().list());
    expect(runtime.primaryPriceScale()).toBe(runtime.chartModel.primaryScale());
    expect(runtime.timeScaleApi()).toBe(runtime.timeScale);
    expect(runtime.getDrawingRegistry()).toBe(runtime.drawingRegistry);
    expect(runtime.rendererRuntime()).toBe(runtime.renderers);

    expect(runtime.renderers.areaRenderer).toBeDefined();
    expect(runtime.renderers.barRenderer).toBeDefined();
    expect(runtime.renderers.baselineRenderer).toBeDefined();
    expect(runtime.renderers.candlesRenderer).toBeDefined();
    expect(runtime.renderers.gridRenderer).toBeDefined();
    expect(runtime.renderers.histogramRenderer).toBeDefined();
    expect(runtime.renderers.kagiRenderer).toBeDefined();
    expect(runtime.renderers.lineRenderer).toBeDefined();
    expect(runtime.renderers.pointFigureRenderer).toBeDefined();
  });

  it("routes common chart-model and registry access through one runtime surface", () => {
    const runtime = createChartRuntimeContainer();

    expect(runtime.mainSourceId()).toBeNull();
    expect(runtime.listSources()).toEqual([]);
    expect(runtime.listSourcesByRole("study")).toEqual([]);
    expect(runtime.listSourcesByPane("primary")).toEqual([]);
    expect(runtime.getSecondaryScale("missing-pane")).toBeUndefined();
    expect(runtime.secondaryScales()).toEqual([]);
    expect(runtime.getPaneById("missing-pane")).toBeUndefined();
    expect(runtime.getPaneByIndex(1)).toBeUndefined();
    expect(runtime.getPaneIndex("missing-pane")).toBe(-1);
    expect(runtime.contextSnapshot().barSequence.axisBars).toEqual([]);
    expect(runtime.removeDrawingByApi({} as never)).toBeUndefined();
    expect(runtime.removeSourceByApi({} as never)).toBeUndefined();

    const pane = runtime.addSecondaryPane({ height: 120, resizable: true });
    expect(runtime.getPaneById(pane.id)).toBe(pane);
    expect(runtime.getPaneByIndex(1)).toBe(pane);
    expect(runtime.getPaneIndex(pane.id)).toBe(1);
    runtime.removePaneById(pane.id);
    expect(runtime.getPaneById(pane.id)).toBeUndefined();
  });
});
