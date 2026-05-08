import { describe, expect, it } from "vitest";

import {
  buildPrimaryPaneSeries,
  getCompareStudyState,
  getMovingAverageStudyState,
  getOrCreateSecondaryPanePriceScale,
  getSecondarySeriesForPane,
  getSourceByApi,
  getStudySourcesForPane,
} from "../../src/lib/internal/views/chart-source-accessors";

describe("chart source accessors use-cases", () => {
  it("reads pane-local study sources and secondary series", () => {
    expect(getStudySourcesForPane("pane-2", {
      listSourcesByPaneAndRole: (paneId) => paneId === "pane-2" ? [{ id: "study-1" }] : [],
    })).toEqual([{ id: "study-1" }]);

    expect(getSecondarySeriesForPane("pane-2", {
      getStudySourcesForPane: (paneId) => paneId === "pane-2" ? [{ id: "study-1" }] : [],
    })).toEqual([{ id: "study-1" }]);
  });

  it("guards source lookup and study specialization", () => {
    const lineStudy = {
      id: "study-1",
      kind: "line" as const,
      role: "study" as const,
      studyKind: "compare",
    };

    expect(getSourceByApi("api-1", {
      getSourceByApiOrThrow: () => lineStudy,
    }, "line")).toBe(lineStudy);

    expect(getCompareStudyState("api-1", {
      getSourceByApi: () => lineStudy,
    })).toBe(lineStudy);

    expect(getMovingAverageStudyState("api-2", {
      getSourceByApi: () => ({
        id: "study-2",
        kind: "line" as const,
        role: "study" as const,
        studyKind: "indicator",
        indicator: { kind: "moving-average" },
      }),
    })).toMatchObject({
      studyKind: "indicator",
    });
  });

  it("builds primary pane series and routes secondary pane scale access", () => {
    const scale = { id: "secondary-right" };

    expect(getOrCreateSecondaryPanePriceScale("pane-2", {
      getOrCreateSecondaryScale: () => scale,
    })).toBe(scale);

    expect(buildPrimaryPaneSeries({ id: "main-1" }, {
      getStudySourcesForPane: () => [{ id: "study-1" }, { id: "study-2" }],
    })).toEqual([{ id: "main-1" }, { id: "study-1" }, { id: "study-2" }]);

    expect(buildPrimaryPaneSeries(null, {
      getStudySourcesForPane: () => [{ id: "study-1" }],
    })).toEqual([{ id: "study-1" }]);
  });
});
