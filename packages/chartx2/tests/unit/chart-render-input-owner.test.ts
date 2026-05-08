import { describe, expect, it } from "vitest";

import {
  createTimeBasedChartBarSequence,
  type ChartBarSequence,
} from "../../src/lib/internal/model";
import { createChartRenderInputOwner } from "../../src/lib/internal/views/chart-render-input-owner";

describe("chart render input owner", () => {
  it("groups render input accessors behind one surface", () => {
    const mainSource = { id: "main-1" };
    const studySource = { id: "study-1", paneId: "primary" };
    const drawing = { id: "drawing-1", paneId: "primary" };
    const sequence = createTimeBasedChartBarSequence([]) as ChartBarSequence<number> & {
      axisBars: readonly unknown[];
    };
    const owner = createChartRenderInputOwner({
      dpr: () => 2,
      getLayout: () => ({ width: 320, height: 240, top: 12, right: 10, bottom: 20, left: 8 }),
      getChartOptions: () => ({
        backgroundColor: "#ffffff",
        paneBackgroundColor: "#f8f8f8",
        gridColor: "#dddddd",
        frameColor: "#333333",
        axisTextColor: "#111111",
        axisLabelBackground: "#ffffff",
        axisLabelBorder: "#cccccc",
        axisActiveBackground: "#111111",
        axisActiveText: "#ffffff",
      }),
      getCrosshairOptions: () => ({ lineColor: "#111111", pointColor: "#222222" }),
      getDrawingOptions: () => ({ magnetLabelVisible: true, timeMagnetLabelVisible: true }),
      getCrosshair: () => ({ x: 10, y: 20 }),
      getSelectedDrawingId: () => "drawing-1",
      getHoveredDrawingId: () => "drawing-2",
      getHoveredDrawingHandle: () => "start",
      getDrawingSnapGuide: () => ({ paneId: "primary", price: 10, time: 1 }),
      getManualBarSpacing: () => 12,
      getRightOffset: () => 3,
      getPrimaryScaleSeriesOnly: () => true,
      getPaneSpecs: () => [{ id: "primary", kind: "primary", preferredHeight: null, resizable: false }],
      getMainSource: () => mainSource,
      createMainBarSequenceFromSource: () => sequence,
      getContextSnapshot: () => ({ mainSourceId: "main-1", barSequence: sequence }),
      getPrimaryStudies: () => [studySource],
      buildPrimaryPaneSeries: () => [mainSource, studySource],
      getStudySources: () => [studySource],
      getSecondarySeriesForPane: (paneId) => paneId === "pane-2" ? [studySource] : [],
      getDrawingsByPane: (paneId) => paneId === "primary" ? [drawing] : [],
      getPaneIndex: (paneId) => paneId === "primary" ? 0 : 1,
      getSecondaryScale: () => undefined,
      getPrimaryPriceScale: () => ({ id: "primary-scale" }) as never,
      getPrimaryPriceRangeOverride: () => null,
      getActiveTradeLocationState: () => ({ id: "trade-1" }),
      getTimeScale: () => ({ id: "time-scale" }) as never,
      getTimeAxisFormatter: () => (time) => `t:${time}`,
      getPriceAxisFormatter: () => (price) => `p:${price}`,
    });

    expect(owner.dpr()).toBe(2);
    expect(owner.getLayout({} as HTMLCanvasElement)).toMatchObject({ width: 320, height: 240 });
    expect(owner.getMainSource()).toBe(mainSource);
    expect(owner.createMainBarSequenceFromSource(mainSource)).toBe(sequence);
    expect(owner.getContextSnapshot().barSequence).toBe(sequence);
    expect(owner.getPrimaryStudies()).toEqual([studySource]);
    expect(owner.buildPrimaryPaneSeries(mainSource)).toEqual([mainSource, studySource]);
    expect(owner.getSecondarySeriesForPane("pane-2")).toEqual([studySource]);
    expect(owner.getDrawingsByPane("primary")).toEqual([drawing]);
    expect(owner.getPaneIndex("secondary")).toBe(1);
    expect(owner.getSelectedDrawingId()).toBe("drawing-1");
    expect(owner.getHoveredDrawingHandle()).toBe("start");
    expect(owner.getDrawingSnapGuide()).toEqual({ paneId: "primary", price: 10, time: 1 });
    expect(owner.getManualBarSpacing()).toBe(12);
    expect(owner.getRightOffset()).toBe(3);
    expect(owner.getPrimaryScaleSeriesOnly()).toBe(true);
    expect(owner.getActiveTradeLocationState()).toEqual({ id: "trade-1" });
    expect(owner.getTimeAxisFormatter()?.(5)).toBe("t:5");
    expect(owner.getPriceAxisFormatter()?.(8)).toBe("p:8");
  });
});
