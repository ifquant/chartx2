import { describe, expect, it, vi } from "vitest";

import { createChartSeriesCommandOwner } from "../../src/lib/chartx/internal/views/chart-series-command-owner";

describe("chart series command owner", () => {
  it("routes primary and secondary series adds through one command surface", () => {
    const calls: string[] = [];
    let targetMode: "primary" | "secondary" = "primary";
    const owner = createChartSeriesCommandOwner({
      resolveTarget: () =>
        targetMode === "primary" ? { kind: "primary" } : { kind: "secondary", paneId: "pane-2" },
      addPrimary: (kind) => {
        calls.push(`primary:${kind}`);
        return { kind: `primary:${kind}` } as never;
      },
      addSecondarySeries: (params) => {
        calls.push(`secondary:${params.paneId}:${params.kind}`);
        return { kind: `secondary:${params.kind}` } as never;
      },
      addLineStudySeries: (paneId, studyKind) => {
        calls.push(`line-study:${paneId}:${studyKind}`);
        return { kind: `line-study:${studyKind}` } as never;
      },
      getMovingAverageLength: () => 20,
      removeSourceByApi: () => undefined,
      resetPrimaryRangeOverride: vi.fn(),
      resetViewportState: vi.fn(),
      clearCrosshair: vi.fn(),
      render: vi.fn(),
    });

    expect(owner.addCandlestickSeries()).toEqual({ kind: "primary:candlestick" });
    targetMode = "secondary";
    expect(owner.addAreaSeries({ pane: 1 })).toEqual({ kind: "secondary:area" });
    expect(owner.addLineSeries({ pane: 1 })).toEqual({ kind: "line-study:series" });

    expect(calls).toEqual([
      "primary:candlestick",
      "secondary:pane-2:area",
      "line-study:pane-2:series",
    ]);
  });

  it("routes volume and study commands with their target defaults", () => {
    const calls: string[] = [];
    const owner = createChartSeriesCommandOwner({
      resolveTarget: (_target, options) => {
        calls.push(`resolve:${options.defaultToSecondary}:${options.allowPrimary}`);
        return { kind: "secondary", paneId: "pane-2" };
      },
      addPrimary: vi.fn() as never,
      addSecondarySeries: (params) => {
        calls.push(`secondary:${params.kind}`);
        return { kind: params.kind } as never;
      },
      addLineStudySeries: (paneId, studyKind, params) => {
        calls.push(`study:${paneId}:${studyKind}:${JSON.stringify(params.indicator ?? null)}`);
        return { kind: studyKind } as never;
      },
      getMovingAverageLength: () => 34,
      removeSourceByApi: () => undefined,
      resetPrimaryRangeOverride: vi.fn(),
      resetViewportState: vi.fn(),
      clearCrosshair: vi.fn(),
      render: vi.fn(),
    });

    owner.addVolumeSeries();
    owner.addOverlaySeries();
    owner.addCompareSeries();
    owner.addMovingAverageStudy();

    expect(calls).toEqual([
      "resolve:true:false",
      "secondary:volume",
      "resolve:false:true",
      "study:pane-2:overlay:null",
      "resolve:false:true",
      "study:pane-2:compare:null",
      "resolve:true:true",
      'study:pane-2:indicator:{"kind":"moving-average","length":34}',
    ]);
  });

  it("routes remove-series cleanup through shared command semantics", () => {
    const resetPrimaryRangeOverride = vi.fn();
    const resetViewportState = vi.fn();
    const clearCrosshair = vi.fn();
    const render = vi.fn();
    const owner = createChartSeriesCommandOwner({
      resolveTarget: vi.fn() as never,
      addPrimary: vi.fn() as never,
      addSecondarySeries: vi.fn() as never,
      addLineStudySeries: vi.fn() as never,
      getMovingAverageLength: () => 20,
      removeSourceByApi: () => ({ role: "main-series" }),
      resetPrimaryRangeOverride,
      resetViewportState,
      clearCrosshair,
      render,
    });

    owner.removeSeries({} as never);

    expect(resetPrimaryRangeOverride).toHaveBeenCalledTimes(1);
    expect(resetViewportState).toHaveBeenCalledTimes(1);
    expect(clearCrosshair).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });
});

