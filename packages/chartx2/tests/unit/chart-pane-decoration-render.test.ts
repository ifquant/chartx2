import { describe, expect, it, vi } from "vitest";

import { PriceRangeImpl, PriceScale, TimeScale } from "../../src/lib/internal/model";
import { drawPriceLines, drawSeriesMarkers, drawTradeLocationOverlay } from "../../src/lib/internal/views/chart-pane-decoration-render";

function createMockContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    textBaseline: "alphabetic",
    textAlign: "left",
    font: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

const layoutOptions = {
  axisLabelBackground: "#fff",
  axisLabelBorder: "#111",
  axisTextColor: "#111",
  axisActiveBackground: "#222",
  axisActiveText: "#fafafa",
};

describe("chart pane decoration render helpers", () => {
  it("renders price-line labels through shared pane decoration render logic", () => {
    const context = createMockContext();
    const priceScale = new PriceScale();
    priceScale.setHeight(200);
    priceScale.setPriceRange(new PriceRangeImpl(100, 200));

    drawPriceLines(
      context,
      400,
      200,
      priceScale,
      new Map([
        ["line-1", { id: "line-1", price: 150, color: "#2563eb", lineWidth: 2, title: "Pivot" }],
      ]),
      layoutOptions,
      null,
    );

    expect(context.beginPath).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalled();
    expect(context.strokeRect).toHaveBeenCalled();
  });

  it("renders series markers and trade overlays through shared decoration helpers", () => {
    const context = createMockContext();
    const timeScale = new TimeScale();
    timeScale.applyOptions({
      width: 300,
      barSpacing: 10,
      pointCount: 10,
    });
    const priceScale = new PriceScale();
    priceScale.setHeight(200);
    priceScale.setPriceRange(new PriceRangeImpl(100, 200));

    drawSeriesMarkers(
      context,
      [{ time: 10, index: 5 as never, value: [110, 120, 105, 118] }],
      [{ time: 10, position: "aboveBar", shape: "circle", color: "#2563eb", text: "M" }],
      timeScale,
      priceScale,
      200,
      "candlestick",
    );

    drawTradeLocationOverlay(
      context,
      {
        request: { side: "long" },
        overlay: {
          longColor: "#22c55e",
          shortColor: "#ef4444",
          spanOpacity: 0.2,
          connectorLineWidth: 2,
          showSpan: true,
          showConnector: true,
          showMarkers: true,
          entryLabel: "IN",
          exitLabel: "OUT",
        },
        resolvedEntryLogical: 2,
        resolvedExitLogical: 7,
        resolvedEntryPrice: 120,
        resolvedExitPrice: 140,
      },
      200,
      timeScale,
      priceScale,
      {
        backgroundColor: "#fffdf7",
      },
    );

    expect(context.arc).toHaveBeenCalled();
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalled();
  });
});
