import { describe, expect, it, vi } from "vitest";

import {
  createTimeBasedChartBarSequence,
  PriceRangeImpl,
  PriceScale,
  TimeScale,
  type TimePointIndex,
} from "../../src/lib/internal/model";
import { createChartDrawingInteractionOwner } from "../../src/lib/internal/views/chart-drawing-interaction-owner";

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
  { index: 0 as TimePointIndex, time: 1, originalTime: 1, value: [10, 15, 9, 12] as [number, number, number, number] },
  { index: 1 as TimePointIndex, time: 2, originalTime: 2, value: [12, 16, 11, 15] as [number, number, number, number] },
  { index: 2 as TimePointIndex, time: 3, originalTime: 3, value: [15, 20, 14, 19] as [number, number, number, number] },
];

function createOwner(drawings: readonly any[], selectedDrawingId: string | null = null) {
  const primaryPriceScale = createPriceScale(10, 20);
  const timeScale = createTimeScale();
  return createChartDrawingInteractionOwner({
    listPanes: () => [{ id: "primary", kind: "primary", preferredHeight: null, resizable: false }],
    paneGap: 0,
    getPrimaryPriceScale: () => primaryPriceScale,
    getSecondaryPriceScale: () => undefined,
    getAxisBars: () => axisBars,
    getBarSequence: () => createTimeBasedChartBarSequence(axisBars),
    getTimeScale: () => timeScale,
    getDrawingOptions: () => ({
      magnetEnabled: false,
      magnetGuideVisible: true,
      magnetSources: { open: true, high: true, low: true, close: true },
      magnetTolerancePx: 6,
      timeMagnetEnabled: false,
      timeMagnetGuideVisible: true,
      timeMagnetPolicy: "nearest",
      timeMagnetTolerancePx: 6,
    }),
    getDrawingById: (id) => drawings.find((drawing) => drawing.id === id),
    listDrawingsByPane: (paneId) => drawings.filter((drawing) => drawing.paneId === paneId),
    getSelectedDrawingId: () => selectedDrawingId,
    clearDrawingSnapGuide: vi.fn(),
    setDrawingSnapGuide: vi.fn(),
    hitTolerance: 10,
  });
}

describe("chart drawing interaction owner", () => {
  it("resolves hit drawing through owner-managed pane and scale dependencies", () => {
    const owner = createOwner([
      { id: "hidden", kind: "horizontal-line", paneId: "primary", visible: false, api: {}, line: { price: 15 } },
      { id: "line-near", kind: "horizontal-line", paneId: "primary", visible: true, api: {}, line: { price: 15 } },
    ]);

    const hit = owner.resolveHitDrawing({ x: 12, y: 50 }, { height: 100, top: 0, bottom: 0 });

    expect(hit?.id).toBe("line-near");
  });

  it("resolves selected trend-line drag handles through selected drawing state", () => {
    const trend = {
      id: "trend-1",
      kind: "trend-line" as const,
      paneId: "primary",
      visible: true,
      api: {},
      color: "#000",
      startTime: 1,
      startPrice: 10,
      endTime: 3,
      endPrice: 20,
    };
    const owner = createOwner([trend], trend.id);
    const timeScale = createTimeScale();
    const priceScale = createPriceScale(10, 20);

    const hit = owner.resolveSelectedTrendLineDragHandle(
      {
        x: timeScale.indexToCoordinate(axisBars[0]!.index),
        y: priceScale.priceToCoordinate(10)!,
      },
      { height: 100, top: 0, bottom: 0 },
    );

    expect(hit).toEqual({ drawingId: "trend-1", handle: "start" });
  });
});
