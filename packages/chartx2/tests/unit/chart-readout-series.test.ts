import { describe, expect, it } from "vitest";

import { TimeScale } from "../../src/lib/internal/model";
import type { PlotRow, TimePointIndex } from "../../src/lib/internal/model";
import {
  buildReadoutSeriesForPane,
  buildReadoutSeriesForPrimary,
} from "../../src/lib/internal/views/chart-readout-series";

function createTimeScale(): TimeScale {
  const scale = new TimeScale();
  scale.applyOptions({
    width: 100,
    barSpacing: 10,
    rightOffset: 0,
    pointCount: 3,
  });
  return scale;
}

function createRow(
  index: number,
  time: number,
  value: [number, number, number, number],
): PlotRow<number> {
  return {
    index: index as TimePointIndex,
    time,
    originalTime: time,
    value,
  };
}

describe("chart readout series use-case", () => {
  it("builds primary readout entries from supplied row sets", () => {
    const timeScale = createTimeScale();
    const rows = [
      createRow(0, 1, [10, 12, 9, 11]),
      createRow(1, 2, [11, 13, 10, 12]),
    ] as const;

    const entries = buildReadoutSeriesForPrimary(
      [{
        id: "main-1",
        label: "Main 1",
        kind: "candlestick",
        data: [
          { time: 1, open: 10, high: 12, low: 9, close: 11 },
          { time: 2, open: 11, high: 13, low: 10, close: 12 },
        ],
        options: { upColor: "#0c8f62", downColor: "#c7543e" },
        visuals: new Map(),
        store: { setData: () => rows },
      }],
      new Map([["main-1", rows]]),
      { x: 90, y: 50 },
      {
        timeScale,
        formatValue: (_state, value) => (value === null ? "--" : value.toFixed(2)),
      },
    );

    expect(entries).toEqual([
      {
        id: "main-1",
        label: "Main 1",
        kind: "candlestick",
        value: 12,
        formattedValue: "12.00",
        color: "#0c8f62",
      },
    ]);
  });

  it("builds pane readout entries and resolves histogram-like colors from visuals", () => {
    const timeScale = createTimeScale();
    const rows = [
      createRow(0, 1, [100, 100, 100, 100]),
      createRow(1, 2, [120, 120, 120, 120]),
    ] as const;

    const entries = buildReadoutSeriesForPane(
      [{
        id: "vol-1",
        label: "Volume 1",
        kind: "volume",
        data: [
          { time: 1, open: 100, high: 100, low: 100, close: 100 },
          { time: 2, open: 120, high: 120, low: 120, close: 120 },
        ],
        options: { upColor: "#22c55e", downColor: "#ef4444" },
        visuals: new Map([[2, { color: "#f59e0b", isUp: true }]]),
        store: { setData: () => rows },
      }],
      { x: 90, y: 50 },
      {
        timeScale,
        formatValue: (_state, value) => (value === null ? "--" : value.toFixed(0)),
      },
    );

    expect(entries).toEqual([
      {
        id: "vol-1",
        label: "Volume 1",
        kind: "volume",
        value: 120,
        formattedValue: "120",
        color: "#f59e0b",
      },
    ]);
  });
});
