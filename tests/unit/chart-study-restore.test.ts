import { describe, expect, it } from "vitest";

import { INVALID_RESTORABLE_PANE_INDEX_ERROR } from "../../src/lib/chartx/internal/views/chart-restore-pane";
import { restoreChartStudies } from "../../src/lib/chartx/internal/views/chart-study-restore";

describe("chart study restore use-case", () => {
  it("restores overlay, compare, and moving-average studies in pane order", () => {
    const calls: string[] = [];

    restoreChartStudies(
      [
        {
          type: "overlay",
          paneIndex: 1,
          seriesOptions: { color: "#1" },
          data: [{ time: 1, value: 10 }],
        },
        {
          type: "compare",
          paneIndex: 2,
          seriesOptions: { color: "#2" },
          compareOptions: { affectMainScale: true },
          data: [{ time: 2, value: 20 }],
        },
        {
          type: "moving-average",
          paneIndex: 3,
          seriesOptions: { color: "#3" },
          studyOptions: { length: 9 },
        },
      ] as const,
      {
        getPaneByIndex: (index) => ({ id: `pane-${index}` }),
        getPaneId: (pane) => pane.id,
        restoreOverlay: (paneId, snapshot) => {
          calls.push(`overlay:${paneId}:${snapshot.data[0]?.time}`);
        },
        restoreCompare: (paneId, snapshot) => {
          calls.push(`compare:${paneId}:${snapshot.compareOptions.affectMainScale}`);
        },
        restoreMovingAverage: (paneId, snapshot) => {
          calls.push(`moving-average:${paneId}:${snapshot.studyOptions.length}`);
        },
      },
    );

    expect(calls).toEqual([
      "overlay:pane-1:1",
      "compare:pane-2:true",
      "moving-average:pane-3:9",
    ]);
  });

  it("rejects restore snapshots that point at a missing pane index", () => {
    expect(() =>
      restoreChartStudies(
        [
          {
            type: "overlay",
            paneIndex: 4,
            seriesOptions: {},
            data: [],
          },
        ] as const,
        {
          getPaneByIndex: () => undefined,
          getPaneId: (pane: never) => pane,
          restoreOverlay: () => {},
          restoreCompare: () => {},
          restoreMovingAverage: () => {},
        },
      ),
    ).toThrow(INVALID_RESTORABLE_PANE_INDEX_ERROR);
  });
});
