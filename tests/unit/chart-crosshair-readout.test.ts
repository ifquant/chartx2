import { describe, expect, it } from "vitest";

import { PriceRangeImpl, PriceScale, TimeScale } from "../../src/lib/chartx/internal/model";
import type { PlotRow, TimePointIndex } from "../../src/lib/chartx/internal/model";
import { buildCrosshairReadout } from "../../src/lib/chartx/internal/views/chart-crosshair-readout";

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

function createRow(
  index: number,
  time: number,
  value: [number, number, number, number],
): PlotRow<number> {
  return {
    index: index as TimePointIndex,
    time,
    originalTime: time,
    value,
  };
}

describe("chart crosshair readout helper", () => {
  it("returns an inactive readout when the crosshair is missing", () => {
    const readout = buildCrosshairReadout(
      [createRow(0, 1, [10, 11, 9, 10])],
      null,
      createTimeScale(),
      createPriceScale(0, 20),
    );

    expect(readout).toEqual({
      active: false,
      paneIndex: null,
      time: null,
      open: null,
      high: null,
      low: null,
      close: null,
      price: null,
      series: [],
    });
  });

  it("returns the nearest-row OHLC payload with coordinate-derived price", () => {
    const readout = buildCrosshairReadout(
      [
        createRow(0, 1, [10, 12, 9, 11]),
        createRow(1, 2, [11, 13, 10, 12]),
      ],
      { x: 90, y: 50 },
      createTimeScale(),
      createPriceScale(10, 30),
    );

    expect(readout).toEqual({
      active: true,
      paneIndex: null,
      time: 2,
      open: 11,
      high: 13,
      low: 10,
      close: 12,
      price: 20,
      series: [],
    });
  });
});
