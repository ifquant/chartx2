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
});
