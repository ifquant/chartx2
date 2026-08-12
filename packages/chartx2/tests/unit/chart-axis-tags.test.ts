import { describe, expect, it, vi } from "vitest";

import { PriceRangeImpl, PriceScale, TimeScale } from "../../src/lib/internal/model";
import {
  buildMagnetAxisTag,
  buildMagnetTimeAxisTag,
  drawAxisTag,
  drawPriceAxis,
} from "../../src/lib/internal/views/chart-axis-tags";

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
  priceAxisPosition: "right" as const,
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
    }, null, "right", { background: "magnet-bg", border: "magnet-border", text: "magnet-text" })).toMatchObject({
      text: "MAG CLOSE 150",
      backgroundColor: "magnet-bg",
      borderColor: "magnet-border",
      textColor: "magnet-text",
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
    }, null, { background: "magnet-bg", border: "magnet-border", text: "magnet-text" })).toMatchObject({
      text: "MAG T 20",
      backgroundColor: "magnet-bg",
      borderColor: "magnet-border",
      textColor: "magnet-text",
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

  it("draws price axis labels in the left inset when requested", () => {
    const context = createMockContext();
    const priceScale = new PriceScale();
    priceScale.setHeight(200);
    priceScale.setPriceRange(new PriceRangeImpl(100, 200));

    drawPriceAxis(
      context,
      { ...layout, left: 72 },
      0,
      200,
      priceScale,
      null,
      { ...layoutOptions, priceAxisPosition: "left" },
      "primary",
      null,
      null,
    );

    const firstLabelX = vi.mocked(context.fillRect).mock.calls[0]?.[0];
    expect(firstLabelX).toBeGreaterThanOrEqual(4);
    expect(firstLabelX).toBeLessThan(72);
  });

  it("keeps long formatted and magnet labels inside the left axis slot", () => {
    const context = createMockContext();
    const priceScale = new PriceScale();
    priceScale.setHeight(200);
    priceScale.setPriceRange(new PriceRangeImpl(100, 200));
    const leftLayout = { ...layout, left: 112 };
    const leftOptions = { ...layoutOptions, priceAxisPosition: "left" as const };
    const longFormatter = (value: number) => `CUSTOM-LONG-PRICE-${value.toFixed(4)}`;

    drawPriceAxis(
      context,
      leftLayout,
      0,
      200,
      priceScale,
      null,
      leftOptions,
      "primary",
      longFormatter,
      null,
    );
    const magnetTag = buildMagnetAxisTag(
      leftLayout,
      0,
      priceScale,
      { paneId: "primary", color: "#2563eb", price: 150, source: "close", time: null },
      longFormatter,
      "left",
    );
    expect(magnetTag).not.toBeNull();
    drawAxisTag(context, magnetTag!, leftOptions);

    for (const [x, , width] of vi.mocked(context.fillRect).mock.calls) {
      expect(x + width).toBeLessThanOrEqual(leftLayout.left);
    }
    expect(vi.mocked(context.fillText).mock.calls.at(-1)?.[0]).toMatch(/\.\.\.$/);
  });

  it("keeps price axis labels inside the pane bounds", () => {
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
      null,
      layoutOptions,
      "primary",
      null,
      null,
    );

    const labelTops = vi.mocked(context.fillRect).mock.calls.map((call) => call[1]);
    expect(Math.min(...labelTops)).toBeGreaterThanOrEqual(layout.top);
    expect(Math.max(...labelTops)).toBeLessThanOrEqual(layout.top + 200 - 18);
  });
});
