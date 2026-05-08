import { describe, expect, it } from "vitest";

import {
  buildPaneSeriesStates,
  buildPaneState,
  buildPaneStateSnapshot,
} from "../../src/lib/internal/views/chart-pane-state";

describe("chart pane state use-cases", () => {
  it("builds pane series state metadata for main and study sources", () => {
    const states = buildPaneSeriesStates([
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
    ]);

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
      styleOptionSurface: null,
      pointCount: 2,
    });
  });

  it("builds pane state and pane state snapshots through shared builders", () => {
    const paneSeriesStates = {
      primary: buildPaneSeriesStates([
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
      ]),
      "pane-2": buildPaneSeriesStates([]),
    };

    const getPaneById = (paneId: string) =>
      paneId === "primary"
        ? { id: "primary", kind: "primary" as const, resizable: false }
        : paneId === "pane-2"
          ? { id: "pane-2", kind: "secondary" as const, resizable: true }
          : undefined;

    const deps = {
      getPaneById,
      getPaneIndex: (paneId: string) => (paneId === "primary" ? 0 : 1),
      getPaneHeight: (paneId: string) => (paneId === "primary" ? 320 : 136),
      getPaneSeriesStates: (paneId: string) => paneSeriesStates[paneId as keyof typeof paneSeriesStates] ?? [],
    };

    const paneState = buildPaneState("primary", deps);
    expect(paneState).toMatchObject({
      paneIndex: 0,
      height: 320,
      isPrimary: true,
      resizable: false,
      hasSeries: true,
      seriesCount: 1,
      seriesKinds: ["candlestick"],
    });

    const snapshot = buildPaneStateSnapshot(["primary", "pane-2"], {
      buildPaneState: (paneId) => buildPaneState(paneId, deps),
    });

    expect(snapshot).toHaveLength(2);
    expect(snapshot[1]).toMatchObject({
      paneIndex: 1,
      height: 136,
      isPrimary: false,
      resizable: true,
      hasSeries: false,
      seriesCount: 0,
    });
  });
});
