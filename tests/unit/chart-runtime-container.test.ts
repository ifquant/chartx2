import { describe, expect, it } from "vitest";

import { createChartRuntimeContainer } from "../../src/lib/chartx/internal/views/chart-runtime-container";

describe("chart runtime container", () => {
  it("creates the shared runtime graph behind one container surface", () => {
    const runtime = createChartRuntimeContainer();

    expect(runtime.panes()).toBe(runtime.chartModel.panes());
    expect(runtime.primaryPriceScale()).toBe(runtime.chartModel.primaryScale());

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
    expect(runtime.contextSnapshot().barSequence.axisBars).toEqual([]);
    expect(runtime.removeDrawingByApi({} as never)).toBeUndefined();
    expect(runtime.removeSourceByApi({} as never)).toBeUndefined();
  });
});
