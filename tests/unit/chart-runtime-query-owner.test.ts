import { describe, expect, it, vi } from "vitest";

import { createChartRuntimeQueryOwner } from "../../src/lib/chartx/internal/views/chart-runtime-query-owner";

describe("chart runtime query owner", () => {
  it("builds point count from main sequence, context rows, and source stores", () => {
    const inactiveSetData = vi.fn(() => [{ index: 0 }, { index: 7 }]);
    const owner = createChartRuntimeQueryOwner({
      buildMainBarSequence: () => ({ logicalLength: 3 }),
      getContextSnapshot: () => ({
        mainSourceId: "main",
        chartType: "candlestick",
        barSequence: {
          bars: [{ index: 0 }, { index: 4 }],
        },
      }),
      listSources: () => [
        {
          id: "main",
          role: "main-series",
          data: [{ time: 1 }],
          store: { setData: vi.fn(() => [{ index: 99 }]) },
        },
        {
          id: "study",
          role: "study",
          data: [{ time: 1 }],
          store: { setData: inactiveSetData },
        },
      ],
      hasSourceApi: () => true,
    });

    expect(owner.getPointCount()).toBe(8);
    expect(owner.getChartType()).toBe("candlestick");
    expect(inactiveSetData).toHaveBeenCalledWith([{ time: 1 }]);
  });

  it("throws the stable removed-series error for inactive APIs", () => {
    const owner = createChartRuntimeQueryOwner({
      buildMainBarSequence: () => ({ logicalLength: 0 }),
      getContextSnapshot: () => ({
        mainSourceId: null,
        chartType: null,
        barSequence: { bars: [] },
      }),
      listSources: () => [],
      hasSourceApi: () => false,
    });

    expect(() => owner.assertSeriesActive({ id: "removed" })).toThrow(
      "chartx phase-one series has been removed",
    );
  });
});
