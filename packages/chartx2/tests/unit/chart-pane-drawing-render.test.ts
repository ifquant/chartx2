import { describe, expect, it, vi } from "vitest";

import { PriceRangeImpl, PriceScale } from "../../src/lib/internal/model";
import {
  drawDrawingSnapGuide,
  drawPaneDrawings,
} from "../../src/lib/internal/views/chart-pane-drawing-render";

function createMockContext() {
  return {
    canvas: { width: 400 },
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    setLineDash: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

describe("chart pane drawing render helpers", () => {
  it("renders selected horizontal and trend drawings through the shared pane drawing renderer", () => {
    const context = createMockContext();
    const priceScale = new PriceScale();
    priceScale.setHeight(200);
    priceScale.setPriceRange(new PriceRangeImpl(100, 200));

    drawPaneDrawings(context, [
      {
        id: "hl",
        kind: "horizontal-line",
        visible: true,
        line: {
          price: 150,
          lineWidth: 2,
        },
      },
      {
        id: "tl",
        kind: "trend-line",
        visible: true,
        startTime: 1,
        startPrice: 120,
        endTime: 2,
        endPrice: 180,
        color: "#2563eb",
        lineWidth: 2,
      },
    ], {
      resolveDrawingTimeCoordinate: (time) => time * 10,
      priceScale,
      selectedDrawingId: "tl",
      hoveredDrawingId: "tl",
      hoveredDrawingHandle: "end",
    });

    expect(context.beginPath).toHaveBeenCalled();
    expect(context.lineTo).toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalled();
  });

  it("renders shared snap guides through the pane drawing renderer", () => {
    const context = createMockContext();
    const priceScale = new PriceScale();
    priceScale.setHeight(200);
    priceScale.setPriceRange(new PriceRangeImpl(100, 200));

    drawDrawingSnapGuide(context, 300, 200, {
      color: "#22c55e",
      price: 150,
      time: 3,
    }, {
      priceScale,
      resolveDrawingTimeCoordinate: (time) => time * 10,
    });

    expect(context.setLineDash).toHaveBeenCalled();
    expect(context.moveTo).toHaveBeenCalled();
    expect(context.lineTo).toHaveBeenCalled();
  });
});
