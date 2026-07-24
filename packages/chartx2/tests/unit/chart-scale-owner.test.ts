import { describe, expect, it, vi } from "vitest";

import { PriceRangeImpl, PriceScale, TimeScale } from "../../src/lib/internal/model";
import { createChartScaleOwner } from "../../src/lib/internal/views/chart-scale-owner";

describe("chart scale owner", () => {
  it("builds time-scale API from shared owner state", () => {
    let barSpacing: number | null = null;
    let rightOffset = 0.8;
    const timeScale = new TimeScale();
    const render = vi.fn();
    const setTimeAxisFormatter = vi.fn();

    const owner = createChartScaleOwner({
      defaultLayout: { width: 500, height: 360, top: 20, right: 20, bottom: 20, left: 20 },
      paneGap: 8,
      minBarSpacing: 4,
      maxBarSpacing: 36,
      getCanvas: () => null,
      getManualLayout: () => null,
      getPointCount: () => 10,
      getTimeAxisRows: () => [{ time: 10, index: 0 }],
      getBarSpacing: () => barSpacing,
      setBarSpacing: (value) => {
        barSpacing = value;
      },
      getRightOffset: () => rightOffset,
      setRightOffset: (value) => {
        rightOffset = value;
      },
      getTimeScale: () => timeScale,
      setTimeAxisFormatter,
      getPrimaryPriceRangeOverride: () => null,
      setPrimaryPriceRangeOverride: vi.fn(),
      getPrimaryPriceScale: () => new PriceScale(),
      getSecondaryVisibleRange: () => null,
      getPanes: () => [{ id: "primary", kind: "primary", preferredHeight: null, resizable: false }],
      setPriceAxisFormatter: vi.fn(),
      setPrimaryScaleSeriesOnly: vi.fn(),
      render,
    });

    const api = owner.timeScaleApi();
    expect(api.getVisibleLogicalRange()).toEqual({
      from: 9 - 460 / 36 + 0.8,
      to: 9.8,
    });

    api.applyOptions({ barSpacing: 7, rightOffset: 1.5, tickMarkFormatter: (time) => `${time}` });

    expect(barSpacing).toBe(7);
    expect(rightOffset).toBe(1.5);
    expect(setTimeAxisFormatter).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("builds price-scale API from primary override, primary scale, and secondary fallback", () => {
    let override: PriceRangeImpl | null = null;
    let scaleSeriesOnly = false;
    const priceScale = new PriceScale();
    priceScale.setPriceRange(PriceRangeImpl.fromRaw({ minValue: 10, maxValue: 20 }));
    const render = vi.fn();
    const setPriceAxisFormatter = vi.fn();

    const owner = createChartScaleOwner({
      defaultLayout: { width: 500, height: 360, top: 20, right: 20, bottom: 20, left: 20 },
      paneGap: 8,
      minBarSpacing: 4,
      maxBarSpacing: 36,
      getCanvas: () => null,
      getManualLayout: () => null,
      getPointCount: () => 10,
      getTimeAxisRows: () => [],
      getBarSpacing: () => null,
      setBarSpacing: vi.fn(),
      getRightOffset: () => 0,
      setRightOffset: vi.fn(),
      getTimeScale: () => new TimeScale(),
      setTimeAxisFormatter: vi.fn(),
      getPrimaryPriceRangeOverride: () => override,
      setPrimaryPriceRangeOverride: (range) => {
        override = range;
      },
      getPrimaryPriceScale: () => priceScale,
      getSecondaryVisibleRange: () => ({ minValue: 1, maxValue: 2 }),
      getPanes: () => [{ id: "primary", kind: "primary", preferredHeight: null, resizable: false }],
      setPriceAxisFormatter,
      setPrimaryScaleSeriesOnly: (value) => {
        scaleSeriesOnly = value;
      },
      render,
    });

    const api = owner.priceScaleApi();
    expect(api.getVisibleRange()).toEqual({ minValue: 10, maxValue: 20 });

    api.setVisibleRange({ minValue: 30, maxValue: 40 });
    expect(api.getVisibleRange()).toEqual({ minValue: 30, maxValue: 40 });
    expect(render).toHaveBeenCalledTimes(1);

    api.applyOptions({ priceFormatter: (value) => `${value}`, scaleSeriesOnly: true });
    expect(setPriceAxisFormatter).toHaveBeenCalledTimes(1);
    expect(scaleSeriesOnly).toBe(true);
    expect(render).toHaveBeenCalledTimes(2);
  });
});
