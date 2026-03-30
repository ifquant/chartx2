import { describe, expect, it } from "vitest";

import {
  PriceRangeImpl,
  PriceScale,
  SeriesDataStore,
  TimeScale,
} from "../../src/lib/chartx/internal/model";

describe("upstream parity contracts", () => {
  it("keeps fixed time-scale transforms stable for a known input set", () => {
    const scale = new TimeScale();
    scale.applyOptions({
      width: 600,
      pointCount: 6,
      barSpacing: 10,
      rightOffset: 0.5,
    });

    expect({
      index0: scale.indexToCoordinate(0 as never),
      index3: scale.indexToCoordinate(3 as never),
      index5: scale.indexToCoordinate(5 as never),
      logicalAt0: scale.coordinateToLogical(0),
      logicalAt300: scale.coordinateToLogical(300),
      logicalAt600: scale.coordinateToLogical(600),
      visibleStrictRange: scale.visibleStrictRange(),
    }).toEqual({
      index0: 545,
      index3: 575,
      index5: 595,
      logicalAt0: -54.5,
      logicalAt300: -24.5,
      logicalAt600: 5.5,
      visibleStrictRange: expect.objectContaining({
        left: expect.any(Function),
        right: expect.any(Function),
      }),
    });

    const strict = scale.visibleStrictRange();
    expect(strict?.left()).toBe(-55);
    expect(strict?.right()).toBe(6);
  });

  it("keeps fixed price-scale transforms stable for a known input set", () => {
    const scale = new PriceScale();
    scale.applyOptions({
      height: 400,
      priceRange: new PriceRangeImpl(100, 200),
    });

    expect({
      at200: scale.priceToCoordinate(200),
      at175: scale.priceToCoordinate(175),
      at150: scale.priceToCoordinate(150),
      at125: scale.priceToCoordinate(125),
      at100: scale.priceToCoordinate(100),
      priceAt250: scale.coordinateToPrice(250),
    }).toEqual({
      at200: 0,
      at175: 100,
      at150: 200,
      at125: 300,
      at100: 400,
      priceAt250: 137.5,
    });
  });

  it("keeps baseline data ingestion rows and source data stable", () => {
    const store = new SeriesDataStore<number>();
    const input = [
      { time: 10, open: 100, high: 110, low: 95, close: 107 },
      { time: 11, open: 107, high: 116, low: 103, close: 111 },
      { time: 12, open: 111, high: 118, low: 109, close: 114 },
    ] as const;

    const rows = store.setData(input);

    expect(rows).toEqual([
      { index: 0, time: 10, originalTime: 10, value: [100, 110, 95, 107] },
      { index: 1, time: 11, originalTime: 11, value: [107, 116, 103, 111] },
      { index: 2, time: 12, originalTime: 12, value: [111, 118, 109, 114] },
    ]);
    expect(store.source()).toEqual(input);
    expect(store.priceRange(rows[0].index, rows[2].index)?.toRaw()).toEqual({
      minValue: 95,
      maxValue: 118,
    });
  });
});
