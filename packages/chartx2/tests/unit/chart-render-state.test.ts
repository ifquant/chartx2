import { describe, expect, it } from "vitest";

import {
  createTimeBasedChartBarSequence,
  type PaneModelState,
  type PlotRow,
  type TimePointIndex,
} from "../../src/lib/internal/model";
import { buildChartRenderState } from "../../src/lib/internal/views/chart-render-state";

function createRow(index: number, time: number): PlotRow<number> {
  return {
    index: index as TimePointIndex,
    time,
    originalTime: time,
    value: [time, time + 1, time - 1, time],
  };
}

describe("chart render state use-case", () => {
  it("builds row sets, pane frames, and active pane for mixed primary and secondary studies", () => {
    const calls: string[] = [];
    const panes = [
      { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
      { id: "pane-1", kind: "secondary", preferredHeight: 100, resizable: true },
    ] satisfies PaneModelState[];
    const primaryRows = [createRow(0, 1), createRow(1, 2)];
    const primaryStudyRows = [createRow(0, 1), createRow(1, 2), createRow(2, 3)];
    const secondaryStudyRows = [createRow(0, 1), createRow(1, 2), createRow(2, 3), createRow(3, 4)];

    const primaryStudy = {
      id: "study-primary",
      paneId: "primary",
      data: ["primary-study-data"],
      store: {
        setData: (data: unknown) => {
          calls.push(`primary:${(data as string[])[0]}`);
          return primaryStudyRows;
        },
      },
    };
    const secondaryStudy = {
      id: "study-secondary",
      paneId: "pane-1",
      data: ["secondary-study-data"],
      store: {
        setData: (data: unknown) => {
          calls.push(`secondary:${(data as string[])[0]}`);
          return secondaryStudyRows;
        },
      },
    };

    const state = buildChartRenderState({
      paneSpecs: panes,
      plotHeight: 320,
      paneGap: 12,
      paneWidth: 240,
      crosshair: { x: 80, y: 250 },
      mainSourceId: "main-1",
      mainSequence: createTimeBasedChartBarSequence(primaryRows),
      primaryStudies: [primaryStudy],
      primarySources: ["main-1"],
      studySources: [primaryStudy, secondaryStudy],
    });

    expect(calls).toEqual([
      "primary:primary-study-data",
      "secondary:secondary-study-data",
    ]);
    expect(state.primaryRows).toEqual(primaryRows);
    expect(state.primaryTimeAxisRows).toEqual(primaryRows);
    expect(state.primaryRowSets.get("main-1")).toEqual(primaryRows);
    expect(state.primaryRowSets.get("study-primary")).toEqual(primaryStudyRows.slice(0, 2));
    expect(state.secondaryRows.get("study-primary")).toEqual(primaryStudyRows.slice(0, 2));
    expect(state.secondaryRows.get("study-secondary")).toEqual(secondaryStudyRows.slice(0, 2));
    expect(state.pointCount).toBe(2);
    expect(state.activePane?.id).toBe("pane-1");
    expect(state.barWidth).toBeCloseTo(240 / Math.max(4 * 1.8, 24));
  });

  it("returns null active pane and zero point count when nothing is renderable", () => {
    const panes = [
      { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
    ] satisfies PaneModelState[];

    const state = buildChartRenderState({
      paneSpecs: panes,
      plotHeight: 240,
      paneGap: 12,
      paneWidth: 200,
      crosshair: null,
      mainSourceId: null,
      mainSequence: createTimeBasedChartBarSequence([]),
      primaryStudies: [],
      primarySources: [],
      studySources: [],
    });

    expect(state.primaryRowSets.size).toBe(0);
    expect(state.secondaryRows.size).toBe(0);
    expect(state.pointCount).toBe(0);
    expect(state.activePane).toBeNull();
    expect(state.barWidth).toBeCloseTo(200 / 24);
  });

  it("projects sparse primary study rows onto the main time axis", () => {
    const panes = [
      { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
    ] satisfies PaneModelState[];
    const primaryRows = [
      createRow(0, 10),
      createRow(1, 20),
      createRow(2, 30),
      createRow(3, 40),
    ];
    const warmupStudyRows = [
      createRow(0, 30),
      createRow(1, 40),
    ];
    const warmupStudy = {
      id: "study-warmup",
      paneId: "primary",
      data: ["warmup-study-data"],
      store: {
        setData: () => warmupStudyRows,
      },
    };

    const state = buildChartRenderState({
      paneSpecs: panes,
      plotHeight: 240,
      paneGap: 12,
      paneWidth: 200,
      crosshair: null,
      mainSourceId: "main-1",
      mainSequence: createTimeBasedChartBarSequence(primaryRows),
      primaryStudies: [warmupStudy],
      primarySources: ["main-1"],
      studySources: [warmupStudy],
    });

    expect(state.primaryRowSets.get("study-warmup")?.map((row) => row.index)).toEqual([2, 3]);
    expect(state.secondaryRows.get("study-warmup")?.map((row) => row.index)).toEqual([2, 3]);
    expect(state.pointCount).toBe(4);
  });

  it("drops study rows outside the main time axis without misaligning matched rows", () => {
    const panes = [
      { id: "primary", kind: "primary", preferredHeight: null, resizable: false },
    ] satisfies PaneModelState[];
    const primaryRows = [createRow(0, 10), createRow(1, 20), createRow(2, 30)];
    const studyRows = [createRow(0, 5), createRow(1, 20), createRow(2, 30), createRow(3, 40)];
    const study = {
      id: "study-window",
      paneId: "primary",
      data: [],
      store: { setData: () => studyRows },
    };

    const state = buildChartRenderState({
      paneSpecs: panes,
      plotHeight: 240,
      paneGap: 12,
      paneWidth: 200,
      crosshair: null,
      mainSourceId: "main-1",
      mainSequence: createTimeBasedChartBarSequence(primaryRows),
      primaryStudies: [study],
      primarySources: ["main-1"],
      studySources: [study],
    });

    expect(state.primaryRowSets.get("study-window")?.map((row) => [row.time, row.index])).toEqual([
      [20, 1],
      [30, 2],
    ]);
    expect(state.secondaryRows.get("study-window")?.map((row) => [row.time, row.index])).toEqual([
      [20, 1],
      [30, 2],
    ]);
    expect(state.pointCount).toBe(3);
  });
});
