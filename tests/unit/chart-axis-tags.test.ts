import { describe, expect, it, vi } from "vitest";

import { PriceRangeImpl, PriceScale, TimeScale } from "../../src/lib/chartx/internal/model";
import {
  buildMagnetAxisTag,
  buildMagnetTimeAxisTag,
  drawPriceAxis,
} from "../../src/lib/chartx/internal/views/chart-axis-tags";

function createMockContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textBaseline: "alphabetic",
  } as unknown as CanvasRenderingContext2D;
}

const layout = {
  width: 800,
  height: 480,
  top: 28,
  right: 18,
  bottom: 34,
  left: 18,
};

const layoutOptions = {
  axisLabelBackground: "#fff",
  axisLabelBorder: "#111",
  axisTextColor: "#111",
  axisActiveBackground: "#222",
  axisActiveText: "#fafafa",
};

describe("chart axis tag helpers", () => {
  it("builds magnet price and time tags through shared axis-tag logic", () => {
    const priceScale = new PriceScale();
    priceScale.setHeight(200);
    priceScale.setPriceRange(new PriceRangeImpl(100, 200));

    const timeScale = new TimeScale();
    timeScale.applyOptions({
      width: 600,
      barSpacing: 10,
      pointCount: 10,
    });

    expect(buildMagnetAxisTag(layout, 12, priceScale, {
      paneId: "primary",
      color: "#2563eb",
      price: 150,
      source: "close",
      time: null,
    }, null)).toMatchObject({
      text: "MAG CLOSE 150",
      backgroundColor: "#2563eb",
      borderColor: "#2563eb",
    });

    expect(buildMagnetTimeAxisTag(layout, [
      { time: 10, index: 0 },
      { time: 20, index: 5 },
      { time: 30, index: 9 },
    ], timeScale, {
      paneId: "primary",
      color: "#2563eb",
      price: null,
      source: null,
      time: 20,
    }, null)).toMatchObject({
      text: "MAG T 20",
      backgroundColor: "#2563eb",
      borderColor: "#2563eb",
    });
  });

  it("draws axis labels and active crosshair labels through the shared renderer", () => {
    const context = createMockContext();
    const priceScale = new PriceScale();
    priceScale.setHeight(200);
    priceScale.setPriceRange(new PriceRangeImpl(100, 200));

    drawPriceAxis(
      context,
      layout,
      0,
      200,
      priceScale,
      { x: 50, y: 80 },
      layoutOptions,
      "primary",
      null,
      null,
    );

    expect(context.fillRect).toHaveBeenCalled();
    expect(context.strokeRect).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalled();
  });
});
