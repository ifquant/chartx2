import { describe, expect, it, vi } from "vitest";

import { calculateChartPointCount } from "../../src/lib/internal/views/chart-point-count";

describe("chart point-count use-case", () => {
  it("starts from the main sequence logical length when no sources exist", () => {
    expect(calculateChartPointCount({
      mainSequenceLogicalLength: 12,
      mainSourceId: null,
      contextRows: [],
      sources: [],
    })).toBe(12);
  });

  it("uses context rows for the active main source without reparsing source data", () => {
    const setData = vi.fn(() => [{ index: 999 }]);

    expect(calculateChartPointCount({
      mainSequenceLogicalLength: 0,
      mainSourceId: "main",
      contextRows: [{ index: 0 }, { index: 8 }],
      sources: [{
        id: "main",
        role: "main-series",
        data: [{ time: 1 }],
        store: { setData },
      }],
    })).toBe(9);
    expect(setData).not.toHaveBeenCalled();
  });

  it("uses store rows for inactive main and non-main sources", () => {
    const inactiveMainSetData = vi.fn(() => [{ index: 0 }, { index: 3 }]);
    const studySetData = vi.fn(() => [{ index: 0 }, { index: 14 }]);

    expect(calculateChartPointCount({
      mainSequenceLogicalLength: 2,
      mainSourceId: "active-main",
      contextRows: [{ index: 1 }],
      sources: [
        {
          id: "inactive-main",
          role: "main-series",
          data: [{ time: 1 }],
          store: { setData: inactiveMainSetData },
        },
        {
          id: "study",
          role: "study",
          data: [{ time: 1 }],
          store: { setData: studySetData },
        },
      ],
    })).toBe(15);
    expect(inactiveMainSetData).toHaveBeenCalledWith([{ time: 1 }]);
    expect(studySetData).toHaveBeenCalledWith([{ time: 1 }]);
  });

  it("treats empty rows as zero and rounds sparse fractional indexes up", () => {
    expect(calculateChartPointCount({
      mainSequenceLogicalLength: 1,
      mainSourceId: null,
      contextRows: [],
      sources: [
        {
          id: "empty",
          role: "study",
          data: [],
          store: { setData: () => [] },
        },
        {
          id: "fractional",
          role: "study",
          data: [],
          store: { setData: () => [{ index: 0 }, { index: 4.2 }] },
        },
      ],
    })).toBe(6);
  });
});
