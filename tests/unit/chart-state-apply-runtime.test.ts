import { describe, expect, it } from "vitest";

import { createValidatedChartStateApplicationDeps } from "../../src/lib/chartx/internal/views/chart-state-apply-runtime";

describe("chart state apply runtime", () => {
  it("groups restore callbacks into validated chart-state deps", () => {
    const deps = createValidatedChartStateApplicationDeps({
      validateDrawings: () => undefined,
      options: { applyOptions: () => undefined },
      clearing: {
        clearSelection: () => undefined,
        clearDrawings: () => undefined,
        clearStudies: () => undefined,
        clearSeries: () => undefined,
        clearTradeLocation: () => undefined,
      },
      panes: {
        listSecondaryPaneIds: () => [],
        getSecondarySeriesCountForPane: () => 0,
        removeSecondaryPane: () => undefined,
        addSecondaryPane: () => undefined,
        applySecondaryPaneState: () => undefined,
      },
      content: {
        applyMainSeriesState: () => undefined,
        restoreSeries: () => undefined,
        restoreStudies: () => undefined,
        locateTrade: () => undefined,
        restoreDrawings: () => undefined,
      },
      scales: {
        applyTimeScaleState: () => undefined,
        applyPriceScaleState: () => undefined,
      },
      finalize: {
        finalize: () => undefined,
      },
    });

    expect(typeof deps.validateDrawings).toBe("function");
    expect(typeof deps.restoreDeps.applyOptions).toBe("function");
    expect(typeof deps.restoreDeps.clearSelection).toBe("function");
    expect(typeof deps.restoreDeps.listSecondaryPaneIds).toBe("function");
    expect(typeof deps.restoreDeps.applyMainSeriesState).toBe("function");
    expect(typeof deps.restoreDeps.applyTimeScaleState).toBe("function");
    expect(typeof deps.restoreDeps.finalize).toBe("function");
  });
});
