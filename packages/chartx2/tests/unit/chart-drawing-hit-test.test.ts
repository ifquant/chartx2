import { describe, expect, it } from "vitest";

import { PriceRangeImpl, PriceScale, TimeScale, type PaneFrame, type TimePointIndex } from "../../src/lib/internal/model";
import {
  resolveHitDrawing,
  resolveSelectedTrendLineDragHandle,
} from "../../src/lib/internal/views/chart-drawing-hit-test";

function createTimeScale(): TimeScale {
  const scale = new TimeScale();
  scale.applyOptions({
    width: 100,
    barSpacing: 10,
    rightOffset: 0,
    pointCount: 3,
  });
  return scale;
}

function createPriceScale(min: number, max: number): PriceScale {
  const scale = new PriceScale();
  scale.applyOptions({
    height: 100,
    priceRange: new PriceRangeImpl(min, max),
  });
  return scale;
}

const axisBars = [
  { time: 1, index: 0 as TimePointIndex },
  { time: 2, index: 1 as TimePointIndex },
  { time: 3, index: 2 as TimePointIndex },
];

describe("chart drawing hit-test use-case", () => {
  it("returns the nearest visible drawing in the active pane", () => {
    const timeScale = createTimeScale();
    const primaryPriceScale = createPriceScale(10, 20);
    const pane = { id: "primary", kind: "primary", top: 0, height: 100 } satisfies PaneFrame;

    const hit = resolveHitDrawing({
      point: { x: 12, y: 50 },
      paneFrames: [pane],
      primaryPriceScale,
      getSecondaryPriceScale: () => undefined,
      axisBars,
      timeScale,
      drawingsForPane: () => [
        { id: "hidden", kind: "horizontal-line", paneId: "primary", visible: false, line: { price: 15 } },
        { id: "line-near", kind: "horizontal-line", paneId: "primary", visible: true, line: { price: 15 } },
        { id: "line-far", kind: "horizontal-line", paneId: "primary", visible: true, line: { price: 19 } },
      ],
      hitTolerance: 10,
    });

    expect(hit?.id).toBe("line-near");
  });

  it("returns null when the active pane has no usable price scale", () => {
    const timeScale = createTimeScale();
    const pane = { id: "pane-1", kind: "secondary", top: 100, height: 80 } satisfies PaneFrame;

    const hit = resolveHitDrawing({
      point: { x: 20, y: 120 },
      paneFrames: [pane],
      primaryPriceScale: createPriceScale(10, 20),
      getSecondaryPriceScale: () => undefined,
      axisBars,
      timeScale,
      drawingsForPane: () => [
        { id: "line-near", kind: "horizontal-line", paneId: "pane-1", visible: true, line: { price: 15 } },
      ],
      hitTolerance: 10,
    });

    expect(hit).toBeNull();
  });

  it("resolves the selected trend-line drag handle from endpoints and line hits", () => {
    const timeScale = createTimeScale();
    const primaryPriceScale = createPriceScale(10, 20);
    const pane = { id: "primary", kind: "primary", top: 0, height: 100 } satisfies PaneFrame;
    const selected = {
      id: "trend-1",
      kind: "trend-line" as const,
      paneId: "primary",
      visible: true,
      startTime: 1,
      startPrice: 10,
      endTime: 3,
      endPrice: 20,
    };
    const startX = timeScale.indexToCoordinate(axisBars[0]!.index);
    const endX = timeScale.indexToCoordinate(axisBars[2]!.index);
    const startY = primaryPriceScale.priceToCoordinate(10)!;
    const endY = primaryPriceScale.priceToCoordinate(20)!;

    const startHit = resolveSelectedTrendLineDragHandle({
      point: { x: startX, y: startY },
      paneFrames: [pane],
      selectedDrawing: selected,
      primaryPriceScale,
      getSecondaryPriceScale: () => undefined,
      axisBars,
      timeScale,
      hitTolerance: 5,
    });

    const lineHit = resolveSelectedTrendLineDragHandle({
      point: { x: (startX + endX) * 0.5, y: (startY + endY) * 0.5 },
      paneFrames: [pane],
      selectedDrawing: selected,
      primaryPriceScale,
      getSecondaryPriceScale: () => undefined,
      axisBars,
      timeScale,
      hitTolerance: 5,
    });

    expect(startHit).toEqual({ drawingId: "trend-1", handle: "start" });
    expect(lineHit).toEqual({ drawingId: "trend-1", handle: "start" });
  });
});
