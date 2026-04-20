import { describe, expect, it } from "vitest";

import {
  buildPrimaryPaneSeriesRuntime,
  getCompareStudyStateRuntime,
  getMovingAverageStudyStateRuntime,
  getOrCreateSecondaryPanePriceScaleRuntime,
  getSecondarySeriesForPaneRuntime,
  getSourceByApiRuntime,
  getStudySourcesForPaneRuntime,
} from "../../src/lib/chartx/internal/views/chart-source-runtime";

describe("chart source runtime", () => {
  it("reads pane-local study sources and secondary series through the shared runtime", () => {
    expect(getStudySourcesForPaneRuntime("pane-2", {
      listSourcesByPaneAndRole: (paneId) => paneId === "pane-2" ? [{ id: "study-1" } as any] : [],
    })).toEqual([{ id: "study-1" }]);

    expect(getSecondarySeriesForPaneRuntime("pane-2", {
      getStudySourcesForPane: (paneId) => paneId === "pane-2" ? [{ id: "study-1" } as any] : [],
    })).toEqual([{ id: "study-1" }]);
  });

  it("guards source lookup and study specialization through the shared runtime", () => {
    const lineStudy = {
      id: "study-1",
      kind: "line" as const,
      role: "study" as const,
      studyKind: "compare" as const,
    };

    expect(getSourceByApiRuntime("api-1" as any, {
      getSourceByApiOrThrow: () => lineStudy as any,
    }, "line")).toBe(lineStudy);

    expect(getCompareStudyStateRuntime("api-1" as any, {
      getSourceByApi: () => lineStudy as any,
    })).toBe(lineStudy);

    expect(getMovingAverageStudyStateRuntime("api-2" as any, {
      getSourceByApi: () => ({
        id: "study-2",
        kind: "line" as const,
        role: "study" as const,
        studyKind: "indicator" as const,
        indicator: { kind: "moving-average" },
      } as any),
    })).toMatchObject({
      studyKind: "indicator",
    });
  });

  it("builds primary-pane series and secondary-pane price scales through the shared runtime", () => {
    const scale = { id: "secondary-right" };

    expect(getOrCreateSecondaryPanePriceScaleRuntime("pane-2", {
      getOrCreateSecondaryScale: () => scale as any,
    })).toBe(scale);

    expect(buildPrimaryPaneSeriesRuntime({ id: "main-1" } as any, {
      getStudySourcesForPane: () => [{ id: "study-1" } as any, { id: "study-2" } as any],
    })).toEqual([{ id: "main-1" }, { id: "study-1" }, { id: "study-2" }]);

    expect(buildPrimaryPaneSeriesRuntime(null, {
      getStudySourcesForPane: () => [{ id: "study-1" } as any],
    })).toEqual([{ id: "study-1" }]);
  });
});
