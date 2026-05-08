import { describe, expect, it, vi } from "vitest";

import { createChartRenderInvalidation } from "../../src/lib/internal/views/chart-render-invalidation";

describe("chart render invalidation", () => {
  it("renders only when a canvas is attached", () => {
    const canvas = {} as HTMLCanvasElement;
    const renderCanvas = vi.fn();
    let attachedCanvas: HTMLCanvasElement | null = null;

    const invalidation = createChartRenderInvalidation({
      getCanvas: () => attachedCanvas,
      renderCanvas,
    });

    invalidation.renderIfAttached();
    attachedCanvas = canvas;
    invalidation.renderIfAttached();

    expect(renderCanvas).toHaveBeenCalledTimes(1);
    expect(renderCanvas).toHaveBeenCalledWith(canvas);
  });
});
