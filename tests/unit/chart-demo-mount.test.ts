import { describe, expect, it, vi } from "vitest";

import { mountPhaseOneChartDemo } from "../../src/lib/chartx/internal/views/chart-demo-mount";

describe("chart demo mount", () => {
  it("mounts the demo chart and returns a destroy callback", () => {
    const destroy = vi.fn();
    const setMainData = vi.fn();
    const setVolumeData = vi.fn();
    const volumePane = { id: "pane-1" };
    const chart = {
      addPane: vi.fn(() => volumePane),
      addCandlestickSeries: vi.fn(() => ({ setData: setMainData })),
      addVolumeSeries: vi.fn(() => ({ setData: setVolumeData })),
      destroy,
    };
    const canvas = {} as HTMLCanvasElement;

    const cleanup = mountPhaseOneChartDemo(canvas, () => chart as never);

    expect(chart.addPane).toHaveBeenCalledWith({ height: 136 });
    expect(chart.addCandlestickSeries).toHaveBeenCalledTimes(1);
    expect(chart.addVolumeSeries).toHaveBeenCalledWith({ pane: volumePane });
    const mainRows = setMainData.mock.calls[0]?.[0] as readonly unknown[];
    const volumeRows = setVolumeData.mock.calls[0]?.[0] as readonly unknown[];
    expect(mainRows.length).toBeGreaterThan(0);
    expect(volumeRows).toHaveLength(mainRows.length);

    cleanup();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
