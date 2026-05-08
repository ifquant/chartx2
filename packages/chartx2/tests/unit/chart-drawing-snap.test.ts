import { describe, expect, it } from "vitest";

import {
  PriceRangeImpl,
  PriceScale,
  TimeScale,
  createTimeBasedChartBarSequence,
  type PlotRow,
  type TimePointIndex,
} from "../../src/lib/internal/model";
import {
  resolveDrawingMagnetOptions,
  resolveSnappedDrawingPrice,
  resolveSnappedDrawingTime,
} from "../../src/lib/internal/views/chart-drawing-snap";

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
  { time: 100, index: 0 as TimePointIndex },
  { time: 200, index: 1 as TimePointIndex },
  { time: 300, index: 2 as TimePointIndex },
];

describe("chart drawing snap use-case", () => {
  it("merges per-drawing magnet overrides over chart defaults", () => {
    const resolved = resolveDrawingMagnetOptions(
      {
        magnetEnabled: false,
        timeMagnetPolicy: "previous",
        magnetSources: { open: false, low: true },
      },
      {
        magnetEnabled: true,
        magnetTolerancePx: 6,
        timeMagnetEnabled: true,
        timeMagnetPolicy: "nearest",
        timeMagnetTolerancePx: 8,
        magnetSources: {
          open: true,
          high: true,
          low: false,
          close: true,
        },
      },
    );

    expect(resolved).toEqual({
      magnetEnabled: false,
      magnetTolerancePx: 6,
      timeMagnetEnabled: true,
      timeMagnetPolicy: "previous",
      timeMagnetTolerancePx: 8,
      magnetSources: {
        open: false,
        high: true,
        low: true,
        close: true,
      },
    });
  });

  it("interpolates or snaps drawing time according to the configured policy and tolerance", () => {
    const timeScale = createTimeScale();
    const betweenBarsX = timeScale.logicalToCoordinate(0.5 as never);

    const freeTime = resolveSnappedDrawingTime(
      betweenBarsX,
      axisBars,
      timeScale,
      false,
      "nearest",
      5,
    );
    const snappedTime = resolveSnappedDrawingTime(
      timeScale.indexToCoordinate(axisBars[1]!.index) + 1,
      axisBars,
      timeScale,
      true,
      "previous",
      4,
    );

    expect(freeTime).toEqual({ time: 150, snapped: false });
    expect(snappedTime).toEqual({ time: 200, snapped: true });
  });

  it("snaps drawing price to the nearest enabled OHLC source when within tolerance", () => {
    const priceScale = createPriceScale(10, 20);
    const timeScale = createTimeScale();
    const bars = createTimeBasedChartBarSequence([
      {
        index: 0 as TimePointIndex,
        time: 100,
        originalTime: 100,
        value: [12, 18, 11, 14],
      },
      {
        index: 1 as TimePointIndex,
        time: 200,
        originalTime: 200,
        value: [13, 19, 12, 15],
      },
      {
        index: 2 as TimePointIndex,
        time: 300,
        originalTime: 300,
        value: [14, 17, 13, 16],
      },
    ] satisfies readonly PlotRow<number>[]);

    const nearHighY = priceScale.priceToCoordinate(19)! + 1;
    const snappedPrice = resolveSnappedDrawingPrice(
      timeScale.indexToCoordinate(1 as TimePointIndex),
      nearHighY,
      bars,
      priceScale,
      timeScale,
      true,
      4,
      { open: false, high: true, low: false, close: true },
    );
    const freePrice = resolveSnappedDrawingPrice(
      timeScale.indexToCoordinate(1 as TimePointIndex),
      nearHighY,
      bars,
      priceScale,
      timeScale,
      false,
      4,
      { open: true, high: true, low: true, close: true },
    );

    expect(snappedPrice).toEqual({ price: 19, snapped: true, source: "high" });
    expect(freePrice?.snapped).toBe(false);
    expect(freePrice?.source).toBe("close");
  });
});
