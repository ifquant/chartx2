import { describe, expect, it } from "vitest";

import {
  buildPaneStateRuntime,
  buildPaneStateSnapshotRuntime,
  getPaneSeriesStatesRuntime,
} from "../../src/lib/internal/views/chart-pane-bookkeeping-runtime";

describe("chart pane bookkeeping runtime", () => {
  it("builds pane series states through the shared runtime", () => {
    const states = getPaneSeriesStatesRuntime("primary", {
      listSourcesByPane: () => [
        {
          id: "main-1",
          label: "Main 1",
          kind: "candlestick",
          role: "main-series",
          chartType: "candlestick",
          styleSchemaId: "candleStyle",
          priceScaleId: "primary-right",
          inputCapability: "ohlc",
          builder: null,
          renderer: null,
          data: [{ time: 1 }],
        },
        {
          id: "study-1",
          label: "MA 1",
          kind: "line",
          role: "study",
          studyKind: "indicator",
          inputContext: { mode: "chart-context" },
          priceScaleId: "pane-2-right",
          data: [{ time: 1 }, { time: 2 }],
        },
      ],
    });

    expect(states).toHaveLength(2);
    expect(states[0]).toMatchObject({
      id: "main-1",
      sourceRole: "main-series",
      chartType: "candlestick",
      styleSchemaId: "candleStyle",
      pointCount: 1,
    });
    expect(states[1]).toMatchObject({
      id: "study-1",
      sourceRole: "study",
      studyKind: "indicator",
      inputContextMode: "chart-context",
      pointCount: 2,
    });
  });

  it("builds pane state through the shared runtime", () => {
    const state = buildPaneStateRuntime("primary", {
      getPaneById: () => ({ id: "primary", kind: "primary", resizable: false }),
      getPaneIndex: () => 0,
      getPaneHeight: () => 320,
      getPaneSeriesStates: () => [
        {
          id: "main-1",
          label: "Main 1",
          sourceRole: "main-series",
          kind: "candlestick",
          chartType: "candlestick",
          studyKind: null,
          inputContextMode: null,
          priceScaleId: "primary-right",
          inputCapability: "ohlc",
          builder: null,
          renderer: null,
          styleSchemaId: "candleStyle",
          styleOptionSurface: null,
          styleOptionKeys: [],
          styleTypeSpecificOptionKeys: [],
          pointCount: 1,
        },
      ],
    });

    expect(state).toMatchObject({
      paneIndex: 0,
      height: 320,
      isPrimary: true,
      resizable: false,
      hasSeries: true,
      seriesCount: 1,
      seriesKinds: ["candlestick"],
    });
  });

  it("builds pane snapshots through the shared runtime", () => {
    const snapshot = buildPaneStateSnapshotRuntime(["primary", "pane-2"], {
      buildPaneState: (paneId) =>
        paneId === "primary"
          ? {
              paneIndex: 0,
              height: 320,
              isPrimary: true,
              resizable: false,
              hasSeries: true,
              seriesCount: 1,
              seriesKinds: ["candlestick"],
              series: [],
            }
          : {
              paneIndex: 1,
              height: 136,
              isPrimary: false,
              resizable: true,
              hasSeries: false,
              seriesCount: 0,
              seriesKinds: [],
              series: [],
            },
    });

    expect(snapshot).toHaveLength(2);
    expect(snapshot[0]).toMatchObject({
      paneIndex: 0,
      isPrimary: true,
      seriesCount: 1,
    });
    expect(snapshot[1]).toMatchObject({
      paneIndex: 1,
      isPrimary: false,
      seriesCount: 0,
      resizable: true,
    });
  });
});
