import { describe, expect, it } from "vitest";

import {
  type RestorableCandlestickSeriesSnapshot,
  type RestorableBarSeriesSnapshot,
  type RestorableLineSeriesSnapshot,
  type RestorableAreaSeriesSnapshot,
  type RestorableBaselineSeriesSnapshot,
  type RestorableHistogramSeriesSnapshot,
  type RestorableVolumeSeriesSnapshot,
  type RestorableOverlayStudySnapshot,
  type RestorableCompareStudySnapshot,
  type RestorableMovingAverageStudySnapshot,
  type RestorableScriptedStudySnapshot,
  restoreSeriesCollection,
  restoreStudyCollection,
  type RestorableSeriesSnapshot,
  type RestorableStudySnapshot,
} from "../../src/lib/chartx/internal/views/chart-content-restore";

type TestSeriesSnapshot =
  | (RestorableCandlestickSeriesSnapshot & { options: { color?: string }; data: readonly { time: number; close: number }[] })
  | (RestorableBarSeriesSnapshot & { options: { color?: string }; data: readonly { time: number; close: number }[] })
  | (RestorableLineSeriesSnapshot & { options: { color?: string }; data: readonly { time: number; value: number }[] })
  | (RestorableAreaSeriesSnapshot & { options: { color?: string }; data: readonly { time: number; value: number }[] })
  | (RestorableBaselineSeriesSnapshot & { options: { color?: string }; data: readonly { time: number; value: number }[] })
  | (RestorableHistogramSeriesSnapshot & { options: { upColor?: string }; data: readonly { time: number; value: number }[] })
  | (RestorableVolumeSeriesSnapshot & { options: { upColor?: string }; data: readonly { time: number; value: number }[] });

type TestStudySnapshot =
  | (RestorableOverlayStudySnapshot & { seriesOptions: { color?: string }; data: readonly { time: number; value: number }[] })
  | (RestorableCompareStudySnapshot & {
      seriesOptions: { color?: string };
      compareOptions: { affectMainScale?: boolean };
      data: readonly { time: number; value: number }[];
    })
  | (RestorableMovingAverageStudySnapshot & {
      seriesOptions: { color?: string };
      studyOptions: { length?: number };
    })
  | (RestorableScriptedStudySnapshot & {
      seriesOptions: { color?: string };
      studyOptions: { scriptId: string };
    });

describe("chart content restore", () => {
  it("routes series snapshots by kind through the correct restore handlers", () => {
    const calls: string[] = [];
    const series: readonly TestSeriesSnapshot[] = [
      { kind: "candlestick", paneIndex: 1, options: { color: "#1" }, data: [{ time: 1, close: 10 }] },
      { kind: "bar", paneIndex: 2, options: { color: "#2" }, data: [{ time: 2, close: 20 }] },
      { kind: "line", paneIndex: 3, options: { color: "#3" }, data: [{ time: 3, value: 30 }] },
      { kind: "area", paneIndex: 4, options: { color: "#4" }, data: [{ time: 4, value: 40 }] },
      { kind: "baseline", paneIndex: 5, options: { color: "#5" }, data: [{ time: 5, value: 50 }] },
      { kind: "histogram", paneIndex: 6, options: { upColor: "#6" }, data: [{ time: 6, value: 60 }] },
      { kind: "volume", paneIndex: 7, options: { upColor: "#7" }, data: [{ time: 7, value: 70 }] },
    ];

    restoreSeriesCollection(series, {
      resolvePaneTarget: (paneIndex) => `pane-${paneIndex}`,
      restoreCandlestick: (target, snapshot) => calls.push(`candlestick:${target}:${snapshot.data[0]?.time}`),
      restoreBar: (target, snapshot) => calls.push(`bar:${target}:${snapshot.data[0]?.time}`),
      restoreLine: (target, snapshot) => calls.push(`line:${target}:${snapshot.data[0]?.time}`),
      restoreArea: (target, snapshot) => calls.push(`area:${target}:${snapshot.data[0]?.time}`),
      restoreBaseline: (target, snapshot) => calls.push(`baseline:${target}:${snapshot.data[0]?.time}`),
      restoreHistogram: (target, snapshot) => calls.push(`histogram:${target}:${snapshot.data[0]?.time}`),
      restoreVolume: (target, snapshot) => calls.push(`volume:${target}:${snapshot.data[0]?.time}`),
    });

    expect(calls).toEqual([
      "candlestick:pane-1:1",
      "bar:pane-2:2",
      "line:pane-3:3",
      "area:pane-4:4",
      "baseline:pane-5:5",
      "histogram:pane-6:6",
      "volume:pane-7:7",
    ]);
  });

  it("routes study snapshots by type through the correct restore handlers", () => {
    const calls: string[] = [];
    const studies: readonly TestStudySnapshot[] = [
      { type: "overlay", paneIndex: 1, seriesOptions: { color: "#1" }, data: [{ time: 1, value: 10 }] },
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
        studyOptions: { scriptId: "script-1" },
      },
    ];

    restoreStudyCollection(studies, {
      resolvePaneId: (paneIndex) => `pane-${paneIndex}`,
      restoreOverlay: (paneId, snapshot) => calls.push(`overlay:${paneId}:${snapshot.data[0]?.time}`),
      restoreCompare: (paneId, snapshot) => calls.push(`compare:${paneId}:${snapshot.data[0]?.time}`),
      restoreMovingAverage: (paneId, snapshot) => calls.push(`moving-average:${paneId}:${snapshot.studyOptions.length}`),
      restoreScriptedStudy: (paneId, snapshot) => calls.push(`scripted-study:${paneId}:${snapshot.studyOptions.scriptId}`),
    });

    expect(calls).toEqual([
      "overlay:pane-1:1",
      "compare:pane-2:2",
      "moving-average:pane-3:9",
      "scripted-study:pane-4:script-1",
    ]);
  });
});
