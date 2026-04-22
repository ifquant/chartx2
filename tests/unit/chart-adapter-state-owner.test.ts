import { describe, expect, it } from "vitest";

import { createChartAdapterStateOwner } from "../../src/lib/chartx/internal/views/chart-adapter-state-owner";

describe("chart adapter state owner", () => {
  it("tracks canvas, viewport, formatter, and scale override state through one owner", () => {
    const owner = createChartAdapterStateOwner<{ minValue: number; maxValue: number }>();
    const canvas = {} as HTMLCanvasElement;
    const timeFormatter = (time: number) => `T-${time}`;
    const priceFormatter = (value: number) => `${value.toFixed(1)} pts`;

    owner.setCanvas(canvas);
    owner.setBarSpacing(14);
    owner.setRightOffset(1.25);
    owner.setTimeAxisFormatter(timeFormatter);
    owner.setPriceAxisFormatter(priceFormatter);
    owner.setPrimaryScaleSeriesOnly(true);
    owner.setPrimaryPriceRangeOverride({ minValue: 120, maxValue: 142 });

    expect(owner.canvas()).toBe(canvas);
    expect(owner.barSpacing()).toBe(14);
    expect(owner.rightOffset()).toBe(1.25);
    expect(owner.timeAxisFormatter()?.(5)).toBe("T-5");
    expect(owner.priceAxisFormatter()?.(123.45)).toBe("123.5 pts");
    expect(owner.primaryScaleSeriesOnly()).toBe(true);
    expect(owner.primaryPriceRangeOverride()).toEqual({ minValue: 120, maxValue: 142 });
  });

  it("allocates drawing ordinals sequentially and resets the viewport without clearing other shell state", () => {
    const owner = createChartAdapterStateOwner<{ minValue: number; maxValue: number }>();

    owner.setBarSpacing(18);
    owner.setRightOffset(3.5);
    owner.setPrimaryScaleSeriesOnly(true);
    owner.setPrimaryPriceRangeOverride({ minValue: 100, maxValue: 200 });

    expect(owner.allocateDrawingOrdinal()).toBe(1);
    expect(owner.allocateDrawingOrdinal()).toBe(2);

    owner.resetViewport(0.75);

    expect(owner.barSpacing()).toBeNull();
    expect(owner.rightOffset()).toBe(0.75);
    expect(owner.primaryScaleSeriesOnly()).toBe(true);
    expect(owner.primaryPriceRangeOverride()).toEqual({ minValue: 100, maxValue: 200 });
  });
});
