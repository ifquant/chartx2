import { describe, expect, it, vi } from "vitest";

import {
  createPriceScaleApi,
  createTimeScaleApi,
} from "../../src/lib/chartx/internal/views/chart-scale-commands";

describe("chart scale commands use-case", () => {
  it("builds time-scale api behavior through shared command routing", () => {
    let barSpacing: number | null = null;
    let rightOffset = 0.8;
    const applyTimeScaleOptions = vi.fn();
    const setTimeAxisFormatter = vi.fn();
    const render = vi.fn();

    const api = createTimeScaleApi({
      getPointCount: () => 10,
      getLayout: () => ({ width: 500, left: 20, right: 20 }),
      getBarSpacing: () => barSpacing,
      setBarSpacing: (value) => {
        barSpacing = value;
      },
      getRightOffset: () => rightOffset,
      setRightOffset: (value) => {
        rightOffset = value;
      },
      resolveBarSpacing: () => 12,
      clampBarSpacing: (value) => Math.max(4, Math.min(36, value)),
      applyTimeScaleOptions,
      setTimeAxisFormatter,
      render,
    });

    expect(api.getVisibleLogicalRange()).toEqual({
      from: 9 - 460 / 12 + 0.8,
      to: 9.8,
    });

    api.setVisibleLogicalRange({ from: 2, to: 12 });
    expect(barSpacing).toBe(36);
    expect(rightOffset).toBe(3);
    expect(applyTimeScaleOptions).toHaveBeenCalledWith({
      width: 460,
      pointCount: 10,
      barSpacing: 36,
      rightOffset: 3,
    });
    expect(render).toHaveBeenCalledTimes(1);

    api.applyOptions({
      barSpacing: 8,
      rightOffset: 1.5,
      tickMarkFormatter: (time) => `${time}`,
    });
    expect(barSpacing).toBe(8);
    expect(rightOffset).toBe(1.5);
    expect(setTimeAxisFormatter).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid time-scale visible ranges", () => {
    const api = createTimeScaleApi({
      getPointCount: () => 0,
      getLayout: () => ({ width: 500, left: 20, right: 20 }),
      getBarSpacing: () => null,
      setBarSpacing: vi.fn(),
      getRightOffset: () => 0,
      setRightOffset: vi.fn(),
      resolveBarSpacing: () => 12,
      clampBarSpacing: (value) => value,
      applyTimeScaleOptions: vi.fn(),
      setTimeAxisFormatter: vi.fn(),
      render: vi.fn(),
    });

    expect(() => api.setVisibleLogicalRange({ from: 1, to: 0 })).toThrow(
      "chartx phase-one time scale visible range requires finite from/to with to > from",
    );
  });

  it("builds price-scale api behavior through shared command routing", () => {
    let currentRange: { minValue: number; maxValue: number } | null = null;
    const applyVisibleRangeIfPresent = vi.fn();
    const setPriceFormatter = vi.fn();
    const setScaleSeriesOnly = vi.fn();
    const render = vi.fn();

    const api = createPriceScaleApi({
      getVisibleRange: () => currentRange,
      setVisibleRange: (range) => {
        currentRange = range;
      },
      applyVisibleRangeIfPresent,
      setPriceFormatter,
      setScaleSeriesOnly,
      render,
    });

    expect(api.getVisibleRange()).toBeNull();

    api.setVisibleRange({ minValue: 10, maxValue: 20 });
    expect(currentRange).toEqual({ minValue: 10, maxValue: 20 });
    expect(applyVisibleRangeIfPresent).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);

    api.applyOptions({
      priceFormatter: (value) => `${value}`,
      scaleSeriesOnly: true,
    });
    expect(setPriceFormatter).toHaveBeenCalledTimes(1);
    expect(setScaleSeriesOnly).toHaveBeenCalledWith(true);
    expect(render).toHaveBeenCalledTimes(2);
  });
});
