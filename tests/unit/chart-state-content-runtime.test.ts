import { describe, expect, it } from "vitest";

import {
  clearRestorableDrawings,
  clearRestorableSeries,
  clearRestorableStudies,
} from "../../src/lib/chartx/internal/views/chart-state-content-runtime";

describe("chart state content runtime", () => {
  it("clears restorable study sources without touching study-series", () => {
    const removed: string[] = [];
    const sources = [
      { id: "overlay", role: "study", studyKind: "overlay" },
      { id: "compare", role: "study", studyKind: "compare" },
      { id: "ma", role: "study", studyKind: "indicator", indicator: { kind: "moving-average" } },
      { id: "scripted", role: "study", studyKind: "indicator", indicator: { kind: "scripted-study" } },
      { id: "series", role: "study", studyKind: "series" },
      { id: "main", role: "main-series" },
    ] as const;

    clearRestorableStudies({
      removeSourcesWhere: (predicate) => {
        for (const source of sources) {
          if (predicate(source)) {
            removed.push(source.id);
          }
        }
      },
    });

    expect(removed).toEqual(["overlay", "compare", "ma", "scripted"]);
  });

  it("clears restorable study-series sources", () => {
    const removed: string[] = [];
    const sources = [
      { id: "series-a", role: "study", studyKind: "series" },
      { id: "overlay", role: "study", studyKind: "overlay" },
      { id: "main", role: "main-series" },
    ] as const;

    clearRestorableSeries({
      removeSourcesWhere: (predicate) => {
        for (const source of sources) {
          if (predicate(source)) {
            removed.push(source.id);
          }
        }
      },
    });

    expect(removed).toEqual(["series-a"]);
  });

  it("clears restorable drawings by api", () => {
    const removed: string[] = [];
    const drawings = [
      { api: "a" },
      { api: "b" },
    ] as const;

    clearRestorableDrawings({
      listDrawings: () => drawings,
      removeByApi: (api) => {
        removed.push(api);
        return { api };
      },
    });

    expect(removed).toEqual(["a", "b"]);
  });
});
