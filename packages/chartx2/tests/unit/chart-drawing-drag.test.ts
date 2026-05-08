import { describe, expect, it } from "vitest";

import { PriceRangeImpl, PriceScale, type PaneFrame } from "../../src/lib/internal/model";
import { applyTrendLineDrag } from "../../src/lib/internal/views/chart-drawing-drag";

function createPriceScale(min: number, max: number): PriceScale {
  const scale = new PriceScale();
  scale.applyOptions({
    height: 100,
    priceRange: new PriceRangeImpl(min, max),
  });
  return scale;
}

describe("chart drawing drag use-case", () => {
  it("updates the selected start handle and emits a snap guide when snapping occurs", () => {
    const pane = { id: "primary", kind: "primary", top: 0, height: 100 } satisfies PaneFrame;
    const result = applyTrendLineDrag({
      drag: { drawingId: "trend-1", handle: "start" },
      point: { x: 40, y: 60 },
      paneFrames: [pane],
      drawing: {
        id: "trend-1",
        kind: "trend-line",
        paneId: "primary",
        color: "#0c8f62",
        startTime: 1,
        startPrice: 10,
        endTime: 3,
        endPrice: 20,
      },
      primaryPriceScale: createPriceScale(10, 20),
      getSecondaryPriceScale: () => undefined,
      drawingOptions: {
        magnetGuideVisible: true,
        timeMagnetGuideVisible: true,
      },
      resolveSnappedTime: () => ({ time: 2, snapped: true }),
      resolveSnappedPrice: () => ({ price: 16, snapped: true, source: "high" }),
    });

    expect(result.nextDrawing).toMatchObject({
      startTime: 2,
      startPrice: 16,
      endTime: 3,
      endPrice: 20,
    });
    expect(result.snapGuide).toEqual({
      paneId: "primary",
      color: "#0c8f62",
      price: 16,
      source: "high",
      time: 2,
    });
  });

  it("updates the end handle without a guide when snapping is not active", () => {
    const pane = { id: "pane-1", kind: "secondary", top: 100, height: 80 } satisfies PaneFrame;
    const secondaryScale = createPriceScale(100, 200);

    const result = applyTrendLineDrag({
      drag: { drawingId: "trend-1", handle: "end" },
      point: { x: 20, y: 130 },
      paneFrames: [pane],
      drawing: {
        id: "trend-1",
        kind: "trend-line",
        paneId: "pane-1",
        color: "#3b82f6",
        startTime: 1,
        startPrice: 110,
        endTime: 3,
        endPrice: 190,
      },
      primaryPriceScale: createPriceScale(10, 20),
      getSecondaryPriceScale: () => secondaryScale,
      drawingOptions: {
        magnetGuideVisible: true,
        timeMagnetGuideVisible: true,
      },
      resolveSnappedTime: () => ({ time: 4, snapped: false }),
      resolveSnappedPrice: () => ({ price: 170, snapped: false, source: "close" }),
    });

    expect(result.nextDrawing).toMatchObject({
      startTime: 1,
      startPrice: 110,
      endTime: 4,
      endPrice: 170,
    });
    expect(result.snapGuide).toBeNull();
  });

  it("clears the guide and leaves the drawing untouched when price resolution fails", () => {
    const pane = { id: "primary", kind: "primary", top: 0, height: 100 } satisfies PaneFrame;
    const drawing = {
      id: "trend-1",
      kind: "trend-line" as const,
      paneId: "primary",
      color: "#0c8f62",
      startTime: 1,
      startPrice: 10,
      endTime: 3,
      endPrice: 20,
    };

    const result = applyTrendLineDrag({
      drag: { drawingId: "trend-1", handle: "start" },
      point: { x: 40, y: 60 },
      paneFrames: [pane],
      drawing,
      primaryPriceScale: createPriceScale(10, 20),
      getSecondaryPriceScale: () => undefined,
      drawingOptions: {
        magnetGuideVisible: true,
        timeMagnetGuideVisible: true,
      },
      resolveSnappedTime: () => ({ time: 2, snapped: true }),
      resolveSnappedPrice: () => null,
    });

    expect(result.nextDrawing).toBeNull();
    expect(result.snapGuide).toBeNull();
  });
});
