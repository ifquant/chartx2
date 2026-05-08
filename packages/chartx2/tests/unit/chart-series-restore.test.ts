import { describe, expect, it } from "vitest";

import { INVALID_RESTORABLE_PANE_INDEX_ERROR } from "../../src/lib/internal/views/chart-restore-pane";
import { restoreChartSeries } from "../../src/lib/internal/views/chart-series-restore";

describe("chart series restore use-case", () => {
  it("restores all supported series kinds in pane order", () => {
    const calls: string[] = [];

    restoreChartSeries(
      [
        { kind: "candlestick", paneIndex: 1, options: { color: "#1" }, data: [{ time: 1, close: 10 }] },
        { kind: "bar", paneIndex: 2, options: { color: "#2" }, data: [{ time: 2, close: 20 }] },
        { kind: "line", paneIndex: 3, options: { color: "#3" }, data: [{ time: 3, value: 30 }] },
        { kind: "area", paneIndex: 4, options: { color: "#4" }, data: [{ time: 4, value: 40 }] },
        { kind: "baseline", paneIndex: 5, options: { color: "#5" }, data: [{ time: 5, value: 50 }] },
        { kind: "histogram", paneIndex: 6, options: { upColor: "#6" }, data: [{ time: 6, value: 60 }] },
        { kind: "volume", paneIndex: 7, options: { upColor: "#7" }, data: [{ time: 7, value: 70 }] },
      ] as const,
      {
        getPaneByIndex: (index) => ({ id: `pane-${index}` }),
        createPaneTarget: (pane) => `target:${pane.id}`,
        restoreCandlestick: (target, snapshot) => calls.push(`candlestick:${target}:${snapshot.data[0]?.time}`),
        restoreBar: (target, snapshot) => calls.push(`bar:${target}:${snapshot.data[0]?.time}`),
        restoreLine: (target, snapshot) => calls.push(`line:${target}:${snapshot.data[0]?.time}`),
        restoreArea: (target, snapshot) => calls.push(`area:${target}:${snapshot.data[0]?.time}`),
        restoreBaseline: (target, snapshot) => calls.push(`baseline:${target}:${snapshot.data[0]?.time}`),
        restoreHistogram: (target, snapshot) => calls.push(`histogram:${target}:${snapshot.data[0]?.time}`),
        restoreVolume: (target, snapshot) => calls.push(`volume:${target}:${snapshot.data[0]?.time}`),
      },
    );

    expect(calls).toEqual([
      "candlestick:target:pane-1:1",
      "bar:target:pane-2:2",
      "line:target:pane-3:3",
      "area:target:pane-4:4",
      "baseline:target:pane-5:5",
      "histogram:target:pane-6:6",
      "volume:target:pane-7:7",
    ]);
  });

  it("rejects restore snapshots that point at a missing pane index", () => {
    expect(() =>
      restoreChartSeries(
        [
          { kind: "line", paneIndex: 9, options: {}, data: [] },
        ] as const,
        {
          getPaneByIndex: () => undefined,
          createPaneTarget: (pane: never) => pane,
          restoreCandlestick: () => {},
          restoreBar: () => {},
          restoreLine: () => {},
          restoreArea: () => {},
          restoreBaseline: () => {},
          restoreHistogram: () => {},
          restoreVolume: () => {},
        },
      ),
    ).toThrow(INVALID_RESTORABLE_PANE_INDEX_ERROR);
  });
});
