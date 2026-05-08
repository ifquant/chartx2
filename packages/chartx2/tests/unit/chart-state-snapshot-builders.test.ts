import { describe, expect, it } from "vitest";

import {
  buildDrawingStateSnapshots,
  buildSeriesStateSnapshots,
  buildStudyStateSnapshots,
  type SnapshotDrawingLike,
  type SnapshotSeriesSourceLike,
  type SnapshotStudySourceLike,
} from "../../src/lib/internal/views/chart-state-snapshot-builders";

describe("chart state snapshot builders", () => {
  it("serializes drawing snapshots with pane indices and resolved magnet options", () => {
    const drawings: readonly SnapshotDrawingLike<string>[] = [
      {
        kind: "horizontal-line",
        paneId: "primary",
        visible: true,
        line: { price: 10, color: "#1", lineWidth: 2, title: "L1" },
      },
      {
        kind: "trend-line",
        paneId: "secondary-1",
        visible: false,
        startTime: 1,
        startPrice: 11,
        endTime: 2,
        endPrice: 22,
        color: "#2",
        lineWidth: 3,
      },
    ];

    const snapshots = buildDrawingStateSnapshots(drawings, {
      getPaneIndex: (paneId) => (paneId === "primary" ? 0 : 1),
      resolveMagnetOptions: () => ({
        magnetEnabled: true,
        magnetTolerancePx: 8,
        timeMagnetEnabled: false,
        timeMagnetPolicy: "nearest",
        timeMagnetTolerancePx: 10,
        magnetSources: { open: true, high: false, low: true, close: false },
      }),
    });

    expect(snapshots).toEqual([
      {
        type: "horizontal-line",
        paneIndex: 0,
        options: {
          price: 10,
          color: "#1",
          lineWidth: 2,
          title: "L1",
          visible: true,
          magnetEnabled: true,
          magnetTolerancePx: 8,
          timeMagnetEnabled: false,
          timeMagnetPolicy: "nearest",
          timeMagnetTolerancePx: 10,
          magnetSources: { open: true, high: false, low: true, close: false },
        },
      },
      {
        type: "trend-line",
        paneIndex: 1,
        options: {
          startTime: 1,
          startPrice: 11,
          endTime: 2,
          endPrice: 22,
          color: "#2",
          lineWidth: 3,
          visible: false,
          magnetEnabled: true,
          magnetTolerancePx: 8,
          timeMagnetEnabled: false,
          timeMagnetPolicy: "nearest",
          timeMagnetTolerancePx: 10,
          magnetSources: { open: true, high: false, low: true, close: false },
        },
      },
    ]);
  });

  it("serializes study snapshots by study kind", () => {
    const sources: readonly SnapshotStudySourceLike<string>[] = [
      {
        paneId: "primary",
        studyKind: "overlay",
        options: { color: "#1" },
        inputData: [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
        inputContext: {
          mode: "chart-context",
          symbol: null,
          resolution: null,
          session: null,
          timezone: null,
          mergePolicy: "carry-forward",
        },
      },
      {
        paneId: "secondary",
        studyKind: "compare",
        options: { color: "#2" },
        inputData: [{ time: 2, open: 19, high: 21, low: 18, close: 20 }],
        inputContext: {
          mode: "requested-context",
          symbol: "AAPL",
          resolution: "1D",
          session: "regular",
          timezone: "America/New_York",
          mergePolicy: "exact",
        },
        compareOptions: {
          affectMainScale: true,
          inputContextMode: "requested-context",
          requestedSymbol: null,
          requestedResolution: null,
          requestedSession: null,
          requestedTimezone: null,
          mergePolicy: "carry-forward",
        },
      },
      {
        paneId: "secondary",
        studyKind: "indicator",
        options: { color: "#3" },
        inputData: [],
        inputContext: {
          mode: "chart-context",
          symbol: null,
          resolution: null,
          session: null,
          timezone: null,
          mergePolicy: "carry-forward",
        },
        indicator: { kind: "moving-average", length: 9 },
      },
      {
        paneId: "secondary",
        studyKind: "indicator",
        options: { color: "#4", lineWidth: 3 },
        inputData: [],
        inputContext: {
          mode: "requested-context",
          symbol: "MSFT",
          resolution: "4H",
          session: "extended",
          timezone: "America/Chicago",
          mergePolicy: "gaps",
        },
        indicator: {
          kind: "scripted-study",
          scriptId: "close-sma-20-v0",
          inputValues: { length: 21, offset: 2 },
        },
      },
    ];

    const snapshots = buildStudyStateSnapshots(sources, {
      getPaneIndex: (paneId) => (paneId === "primary" ? 0 : 1),
      defaultCompareOptions: {
        affectMainScale: false,
        inputContextMode: "chart-context",
        requestedSymbol: null,
        requestedResolution: null,
        requestedSession: null,
        requestedTimezone: null,
        mergePolicy: "carry-forward",
      },
    });

    expect(snapshots).toEqual([
      {
        type: "overlay",
        paneIndex: 0,
        seriesOptions: { color: "#1" },
        data: [{ time: 1, value: 10 }],
      },
      {
        type: "compare",
        paneIndex: 1,
        seriesOptions: { color: "#2" },
        compareOptions: {
          affectMainScale: true,
          inputContextMode: "requested-context",
          requestedSymbol: "AAPL",
          requestedResolution: "1D",
          requestedSession: "regular",
          requestedTimezone: "America/New_York",
          mergePolicy: "exact",
        },
        data: [{ time: 2, value: 20 }],
      },
      {
        type: "moving-average",
        paneIndex: 1,
        seriesOptions: { color: "#3" },
        studyOptions: {
          length: 9,
          inputContextMode: "chart-context",
          requestedSymbol: null,
          requestedResolution: null,
          requestedSession: null,
          requestedTimezone: null,
          mergePolicy: "carry-forward",
        },
      },
      {
        type: "scripted-study",
        paneIndex: 1,
        seriesOptions: { color: "#4", lineWidth: 3 },
        studyOptions: {
          scriptId: "close-sma-20-v0",
          inputValues: { length: 21, offset: 2 },
          inputContextMode: "requested-context",
          requestedSymbol: "MSFT",
          requestedResolution: "4H",
          requestedSession: "extended",
          requestedTimezone: "America/Chicago",
          mergePolicy: "gaps",
        },
      },
    ]);
  });

  it("serializes series snapshots by series kind", () => {
    const sources: readonly SnapshotSeriesSourceLike<string>[] = [
      {
        paneId: "primary",
        studyKind: "series",
        kind: "candlestick",
        options: { upColor: "#1" },
        inputData: [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
        visuals: new Map(),
      },
      {
        paneId: "secondary",
        studyKind: "series",
        kind: "line",
        options: { color: "#2" },
        inputData: [{ time: 2, open: 19, high: 21, low: 18, close: 20 }],
        visuals: new Map(),
      },
      {
        paneId: "secondary",
        studyKind: "series",
        kind: "volume",
        options: { upColor: "#3" },
        inputData: [{ time: 3, open: 29, high: 31, low: 28, close: 30 }],
        visuals: new Map([[3, { color: "#abc", isUp: true }]]),
      },
    ];

    const snapshots = buildSeriesStateSnapshots(sources, {
      getPaneIndex: (paneId) => (paneId === "primary" ? 0 : 1),
    });

    expect(snapshots).toEqual([
      {
        kind: "candlestick",
        paneIndex: 0,
        options: { upColor: "#1" },
        data: [{ time: 1, open: 9, high: 11, low: 8, close: 10 }],
      },
      {
        kind: "line",
        paneIndex: 1,
        options: { color: "#2" },
        data: [{ time: 2, value: 20 }],
      },
      {
        kind: "volume",
        paneIndex: 1,
        options: { upColor: "#3" },
        data: [{ time: 3, value: 30, color: "#abc", up: true }],
      },
    ]);
  });
});
