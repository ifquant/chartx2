import { describe, expect, it, vi } from "vitest";

import {
  createCompressedPriceBasedChartBarSequence,
  createPlotRows,
} from "../../src/lib/chartx/internal/model";
import { createChartStudyContextOwner } from "../../src/lib/chartx/internal/views/chart-study-context-owner";

function createContextSnapshot() {
  const bars = createPlotRows([
    { time: 10, open: 1, high: 4, low: 0.5, close: 3 },
    { time: 20, open: 3, high: 5, low: 2, close: 4 },
  ]);
  return {
    chartType: "candlestick" as const,
    mainSourceId: "main-1",
    barSequence: createCompressedPriceBasedChartBarSequence(bars),
    descriptor: {
      symbol: null,
      resolution: null,
      session: null,
      timezone: null,
    },
  };
}

describe("chart study context owner", () => {
  it("resolves study display data through chart context and merge engine", () => {
    const study = {
      studyKind: "series" as const,
      inputContext: {
        mode: "chart-context" as const,
        symbol: null,
        resolution: null,
        session: null,
        timezone: null,
        mergePolicy: "carry-forward" as const,
      },
      inputData: [{ time: 10, open: 1, high: 2, low: 0.5, close: 1.5 }],
      data: [],
    };
    const mergeToChartContext = vi.fn((args) =>
      args.inputData.map((row: any) => ({ ...row, merged: args.axisBars.length }))
    );
    const owner = createChartStudyContextOwner({
      getContextSnapshot: createContextSnapshot,
      clearMainSource: vi.fn(),
      bindMainSource: vi.fn(),
      listStudySources: () => [study],
      refreshTradeLocation: vi.fn(),
      mergeEngine: { mergeToChartContext },
    });

    expect(owner.resolveDisplayData(study as any)).toEqual([
      { time: 10, open: 1, high: 2, low: 0.5, close: 1.5, merged: 2 },
    ]);
    expect(mergeToChartContext).toHaveBeenCalledWith({
      inputData: study.inputData,
      axisBars: createContextSnapshot().barSequence.axisBars,
      mergePolicy: "carry-forward",
    });
  });

  it("syncs main-source context, study data, and trade-location refresh", () => {
    const study = {
      studyKind: "indicator" as const,
      indicator: { kind: "moving-average" as const, length: 2 },
      inputContext: {
        mode: "chart-context" as const,
        symbol: null,
        resolution: null,
        session: null,
        timezone: null,
        mergePolicy: "carry-forward" as const,
      },
      inputData: [],
      data: [],
    };
    const clearMainSource = vi.fn();
    const bindMainSource = vi.fn();
    const refreshTradeLocation = vi.fn();
    const owner = createChartStudyContextOwner({
      getContextSnapshot: createContextSnapshot,
      clearMainSource,
      bindMainSource,
      listStudySources: () => [study],
      refreshTradeLocation,
    });

    owner.syncMainSource({
      id: "main-1",
      chartType: "candlestick",
      inputData: [],
      data: [{ time: 10, open: 1, high: 4, low: 0.5, close: 3 }],
      builder: "time",
      lineBreakOptions: { lineCount: 3 },
      renkoOptions: { boxSize: null, boxSizeMode: "auto" },
      pointFigureOptions: {
        boxSize: null,
        boxSizeMode: "auto",
        boxSizeScale: 1,
        reversalBoxes: 3,
        atrLength: 14,
        percentageValue: 1,
      },
      kagiOptions: {
        reversalMode: "auto",
        reversalSize: null,
        reversalScale: 1,
        atrLength: 14,
        percentageValue: 1,
      },
      store: {
        setData: (data: readonly unknown[]) => data,
      },
    } as any);

    expect(clearMainSource).not.toHaveBeenCalled();
    expect(bindMainSource).toHaveBeenCalledOnce();
    expect(bindMainSource.mock.calls[0][0]).toBe("main-1");
    expect(study.data).toEqual([{ time: 20, open: 3.5, high: 3.5, low: 3.5, close: 3.5 }]);
    expect(refreshTradeLocation).toHaveBeenCalledOnce();

    owner.syncMainSource(null);

    expect(clearMainSource).toHaveBeenCalledOnce();
    expect(refreshTradeLocation).toHaveBeenCalledTimes(2);
  });
});
