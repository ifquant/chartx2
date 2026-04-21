import { describe, expect, it, vi } from "vitest";

import { createChartShellOwner } from "../../src/lib/chartx/internal/views/chart-shell-owner";

describe("chart shell owner", () => {
  it("applies chart options into shared runtime state", () => {
    const layoutOptions = {
      backgroundColor: "#fff",
      paneBackgroundColor: "#fff",
      gridColor: "#ddd",
      frameColor: "#ccc",
      axisTextColor: "#111",
      axisLabelBackground: "#fff",
      axisLabelBorder: "#eee",
      axisActiveBackground: "#111",
      axisActiveText: "#fff",
    };
    const crosshairOptions = {
      lineColor: "#888",
      pointColor: "#111",
    };
    const drawingOptions = {
      magnetEnabled: true,
      magnetGuideVisible: true,
      magnetLabelVisible: true,
      magnetTolerancePx: 8,
      timeMagnetEnabled: true,
      timeMagnetPolicy: "nearest" as const,
      timeMagnetGuideVisible: true,
      timeMagnetLabelVisible: true,
      timeMagnetTolerancePx: 10,
      magnetSources: {
        open: true,
        high: true,
        low: true,
        close: true,
      },
    };
    const clearDrawingSnapGuide = vi.fn();
    const clearDrawingSnapGuideTimeOnly = vi.fn();
    const render = vi.fn();

    const owner = createChartShellOwner({
      layoutOptions,
      crosshairOptions,
      drawingOptions,
      setManualLayout: vi.fn(),
      clearDrawingSnapGuide,
      clearDrawingSnapGuideTimeOnly,
      render,
    });

    owner.applyOptions({
      layout: { backgroundColor: "#101010" },
      crosshair: { pointColor: "#fefefe" },
      drawings: {
        magnetEnabled: false,
        timeMagnetGuideVisible: false,
        magnetTolerancePx: -10,
        magnetSources: { high: false },
      },
    });

    expect(layoutOptions.backgroundColor).toBe("#101010");
    expect(crosshairOptions.pointColor).toBe("#fefefe");
    expect(drawingOptions.magnetEnabled).toBe(false);
    expect(drawingOptions.timeMagnetGuideVisible).toBe(false);
    expect(drawingOptions.magnetTolerancePx).toBe(0);
    expect(drawingOptions.magnetSources.high).toBe(false);
    expect(clearDrawingSnapGuide).toHaveBeenCalledTimes(1);
    expect(clearDrawingSnapGuideTimeOnly).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("resizes through shared validation and manual-layout state", () => {
    const setManualLayout = vi.fn();
    const render = vi.fn();
    const owner = createChartShellOwner({
      layoutOptions: {} as never,
      crosshairOptions: {} as never,
      drawingOptions: { magnetSources: {} } as never,
      setManualLayout,
      clearDrawingSnapGuide: vi.fn(),
      clearDrawingSnapGuideTimeOnly: vi.fn(),
      render,
    });

    owner.resize(800.4, 319.6);

    expect(setManualLayout).toHaveBeenCalledWith({ width: 800, height: 320 });
    expect(render).toHaveBeenCalledTimes(1);
  });
});

