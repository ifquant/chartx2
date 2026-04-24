import { describe, expect, it } from "vitest";

import { INVALID_RESTORABLE_PANE_INDEX_ERROR } from "../../src/lib/chartx/internal/views/chart-restore-pane";
import { restoreChartStudies } from "../../src/lib/chartx/internal/views/chart-study-restore";

describe("chart study restore use-case", () => {
  it("restores overlay, compare, moving-average, and scripted-study entries in pane order", () => {
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
        {
          type: "scripted-study",
          paneIndex: 4,
          seriesOptions: { color: "#4" },
          studyOptions: {
            scriptId: "close-sma-20-v0",
            inputValues: { length: 20 },
            inputContextMode: "requested-context",
            requestedSymbol: "ES1!",
            requestedResolution: "5",
            requestedSession: "regular",
            requestedTimezone: "UTC",
            mergePolicy: "exact",
          },
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
        restoreScriptedStudy: (paneId, snapshot) => {
          calls.push(`scripted-study:${paneId}:${snapshot.studyOptions.scriptId}:${snapshot.studyOptions.inputValues.length}`);
        },
      },
    );

    expect(calls).toEqual([
      "overlay:pane-1:1",
      "compare:pane-2:true",
      "moving-average:pane-3:9",
      "scripted-study:pane-4:close-sma-20-v0:20",
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
          restoreScriptedStudy: () => {},
        },
      ),
    ).toThrow(INVALID_RESTORABLE_PANE_INDEX_ERROR);
  });
});
