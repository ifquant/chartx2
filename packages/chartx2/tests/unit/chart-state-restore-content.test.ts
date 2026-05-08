import { describe, expect, it } from "vitest";

import {
  restoreStateDrawingsContent,
  restoreStateSeriesContent,
  restoreStateStudiesContent,
} from "../../src/lib/internal/views/chart-state-restore-content";

describe("chart state restore content", () => {
  it("restores series content through add-and-apply wiring", () => {
    const calls: string[] = [];

    restoreStateSeriesContent(
      [{ kind: "line", paneIndex: 1, options: { color: "#1" }, data: [{ time: 1, value: 10 }] }] as const,
      {
        getPaneByIndex: (index) => ({ id: `pane-${index}` }),
        createPaneTarget: (pane) => `target:${pane.id}`,
        addCandlestick: () => ({ applyOptions: () => {}, setData: () => {} }),
        addBar: () => ({ applyOptions: () => {}, setData: () => {} }),
        addLine: (target) => ({
          applyOptions: (options) => calls.push(`line:options:${target}:${(options as { color: string }).color}`),
          setData: (data) => calls.push(`line:data:${target}:${(data[0] as { time: number }).time}`),
        }),
        addArea: () => ({ applyOptions: () => {}, setData: () => {} }),
        addBaseline: () => ({ applyOptions: () => {}, setData: () => {} }),
        addHistogram: () => ({ applyOptions: () => {}, setData: () => {} }),
        addVolume: () => ({ applyOptions: () => {}, setData: () => {} }),
      },
    );

    expect(calls).toEqual([
      "line:options:target:pane-1:#1",
      "line:data:target:pane-1:1",
    ]);
  });

  it("restores study content through add-and-apply wiring", () => {
    const calls: string[] = [];

    restoreStateStudiesContent(
      [
        {
          type: "compare",
          paneIndex: 1,
          seriesOptions: { color: "#2" },
          compareOptions: { affectMainScale: true },
          data: [{ time: 2, value: 20 }],
        },
      ] as const,
      {
        getPaneByIndex: (index) => ({ id: `pane-${index}` }),
        getPaneId: (pane) => pane.id,
        addOverlay: () => ({ applyOptions: () => {}, setData: () => {} }),
        addCompare: (paneId) => ({
          applyOptions: (options) => calls.push(`compare:options:${paneId}:${(options as { color: string }).color}`),
          applyCompareOptions: (options) => calls.push(`compare:compare:${paneId}:${String((options as { affectMainScale: boolean }).affectMainScale)}`),
          setData: (data) => calls.push(`compare:data:${paneId}:${(data[0] as { time: number }).time}`),
        }),
        addMovingAverage: () => ({ applyOptions: () => {}, applyStudyOptions: () => {} }),
        addScriptedStudy: () => ({ applyOptions: () => {}, applyStudyOptions: () => {} }),
      },
    );

    expect(calls).toEqual([
      "compare:options:pane-1:#2",
      "compare:compare:pane-1:true",
      "compare:data:pane-1:2",
    ]);
  });

  it("restores scripted-study content through add-and-apply wiring", () => {
    const calls: string[] = [];

    restoreStateStudiesContent(
      [
        {
          type: "scripted-study",
          paneIndex: 1,
          seriesOptions: { color: "#3" },
          studyOptions: { scriptId: "script-1", inputValues: { length: 21 } },
        },
      ] as const,
      {
        getPaneByIndex: (index) => ({ id: `pane-${index}` }),
        getPaneId: (pane) => pane.id,
        addOverlay: () => ({ applyOptions: () => {}, setData: () => {} }),
        addCompare: () => ({ applyOptions: () => {}, applyCompareOptions: () => {}, setData: () => {} }),
        addMovingAverage: () => ({ applyOptions: () => {}, applyStudyOptions: () => {} }),
        addScriptedStudy: (_paneId, _studyOptions) => ({
          applyOptions: (options) => calls.push(`scripted:options:pane-1:${(options as { color: string }).color}`),
          applyStudyOptions: (options) => calls.push(`scripted:study:pane-1:${(options as { scriptId: string }).scriptId}`),
        }),
      },
    );

    expect(calls).toEqual([
      "scripted:study:pane-1:script-1",
      "scripted:options:pane-1:#3",
    ]);
  });

  it("restores scripted-study content through add-and-apply wiring", () => {
    const calls: string[] = [];

    restoreStateStudiesContent(
      [
        {
          type: "scripted-study",
          paneIndex: 2,
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
        addOverlay: () => ({ applyOptions: () => {}, setData: () => {} }),
        addCompare: () => ({ applyOptions: () => {}, applyCompareOptions: () => {}, setData: () => {} }),
        addMovingAverage: () => ({ applyOptions: () => {}, applyStudyOptions: () => {} }),
        addScriptedStudy: (paneId, studyOptions) => ({
          applyOptions: (options) => calls.push(`scripted:options:${paneId}:${(options as { color: string }).color}`),
          applyStudyOptions: (options) =>
            calls.push(
              `scripted:study:${paneId}:${(studyOptions as { scriptId: string }).scriptId}:${(options as { scriptId: string }).scriptId}`,
            ),
        }),
      },
    );

    expect(calls).toEqual([
      "scripted:study:pane-2:close-sma-20-v0:close-sma-20-v0",
      "scripted:options:pane-2:#4",
    ]);
  });

  it("restores drawing content through add wiring", () => {
    const calls: string[] = [];

    restoreStateDrawingsContent(
      [{ type: "horizontal-line", paneIndex: 1, options: { price: 10 } }] as const,
      {
        getPaneByIndex: (index) => ({ id: `pane-${index}` }),
        createPaneTarget: (pane) => `target:${pane.id}`,
        addHorizontalLine: (target, options) => calls.push(`horizontal:${target}:${(options as { price: number }).price}`),
        addTrendLine: () => {},
      },
    );

    expect(calls).toEqual(["horizontal:target:pane-1:10"]);
  });
});
