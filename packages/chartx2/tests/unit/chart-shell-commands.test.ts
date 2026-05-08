import { describe, expect, it, vi } from "vitest";

import {
  applyChartOptions,
  resizeChart,
} from "../../src/lib/internal/views/chart-shell-commands";

describe("chart shell commands use-case", () => {
  it("applies chart-wide options through shared setters", () => {
    const setLayoutOption = vi.fn();
    const setCrosshairOption = vi.fn();
    const setDrawingOption = vi.fn();
    const setDrawingMagnetSource = vi.fn();
    const clearDrawingSnapGuide = vi.fn();
    const clearDrawingSnapGuideTimeOnly = vi.fn();
    const render = vi.fn();

    applyChartOptions({
      layout: {
        backgroundColor: "#111",
        axisTextColor: "#222",
      },
      crosshair: {
        lineColor: "#333",
      },
      drawings: {
        magnetEnabled: false,
        timeMagnetGuideVisible: false,
        magnetTolerancePx: -4,
        magnetSources: {
          open: false,
          close: true,
        },
      },
    }, {
      setLayoutOption,
      setCrosshairOption,
      setDrawingOption,
      setDrawingMagnetSource,
      clearDrawingSnapGuide,
      clearDrawingSnapGuideTimeOnly,
      render,
    });

    expect(setLayoutOption).toHaveBeenCalledWith("backgroundColor", "#111");
    expect(setLayoutOption).toHaveBeenCalledWith("axisTextColor", "#222");
    expect(setCrosshairOption).toHaveBeenCalledWith("lineColor", "#333");
    expect(setDrawingOption).toHaveBeenCalledWith("magnetEnabled", false);
    expect(setDrawingOption).toHaveBeenCalledWith("timeMagnetGuideVisible", false);
    expect(setDrawingOption).toHaveBeenCalledWith("magnetTolerancePx", 0);
    expect(setDrawingMagnetSource).toHaveBeenCalledWith("open", false);
    expect(setDrawingMagnetSource).toHaveBeenCalledWith("close", true);
    expect(clearDrawingSnapGuide).toHaveBeenCalledTimes(1);
    expect(clearDrawingSnapGuideTimeOnly).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("resizes chart through shared validation and layout update", () => {
    const setManualLayout = vi.fn();
    const render = vi.fn();

    resizeChart(501.4, 319.6, {
      setManualLayout,
      render,
    });

    expect(setManualLayout).toHaveBeenCalledWith({
      width: 501,
      height: 320,
    });
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid resize inputs", () => {
    expect(() =>
      resizeChart(0, 10, {
        setManualLayout: vi.fn(),
        render: vi.fn(),
      })
    ).toThrow("chartx phase-one chart resize requires positive finite width and height");
  });
});
