import { describe, expect, it, vi } from "vitest";

import { createChartEntryShellOwner } from "../../src/lib/internal/views/chart-entry-shell-owner";

describe("chart entry shell owner", () => {
  it("composes attached-chart creation and demo mounting through one entry surface", () => {
    const api = { destroy: vi.fn() };
    const attach = vi.fn();
    const publicApiSurface = vi.fn(() => ({ detach: vi.fn() }));
    const createAttachedChart = vi.fn((canvas: HTMLCanvasElement, createHarness: () => unknown) => {
      expect(createHarness()).toEqual({
        attach,
        publicApiSurface,
      });
      expect(canvas).toBe(canvasRef);
      return api as never;
    });
    const mountChartDemo = vi.fn((canvas: HTMLCanvasElement, createChart: (canvas: HTMLCanvasElement) => unknown) => {
      expect(canvas).toBe(canvasRef);
      expect(createChart(canvas)).toBe(api);
      return cleanup;
    });
    const cleanup = vi.fn();
    const canvasRef = {} as HTMLCanvasElement;

    const owner = createChartEntryShellOwner({
      createAttachedChart,
      mountChartDemo,
      createHarness: () => ({
        attach,
        publicApiSurface,
      }),
    });

    expect(owner.createChart(canvasRef)).toBe(api);
    expect(owner.mountChartHarness(canvasRef)).toBe(cleanup);
    expect(createAttachedChart).toHaveBeenCalledTimes(2);
    expect(mountChartDemo).toHaveBeenCalledTimes(1);
  });
});
