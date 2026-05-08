import { describe, expect, it } from "vitest";

import { PriceRangeImpl, PriceScale, TimeScale } from "../../src/lib/internal/model";
import type { PaneFrame, PlotRow, TimePointIndex } from "../../src/lib/internal/model";
import { buildRawReadout } from "../../src/lib/internal/views/chart-readout";

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

describe("chart readout use-case", () => {
  it("builds a primary-pane readout from main rows and primary series details", () => {
    const timeScale = createTimeScale();
    const primaryPriceScale = createPriceScale(10, 30);
    const primaryRows = [
      createRow(0, 1, [10, 12, 9, 11]),
      createRow(1, 2, [11, 13, 10, 12]),
    ] as const;

    const readout = buildRawReadout({
      point: { x: 90, y: 50 },
      paneFrames: [{ id: "primary", kind: "primary", top: 0, height: 100 } satisfies PaneFrame],
      mainSourceId: "main-1",
      primaryRows,
      primaryStudies: [],
      primarySources: [{
        id: "main-1",
        kind: "candlestick",
        priceScale: primaryPriceScale,
        data: [],
        store: { setData: () => primaryRows },
      }],
      timeScale,
      primaryPriceScale,
      getPaneIndex: () => 0,
      getSecondarySeriesForPane: () => [],
      buildReadoutSeriesForPrimary: () => [
        {
          id: "main-1",
          label: "Main 1",
          kind: "candlestick",
          value: 12,
          formattedValue: "12.00",
          color: "#0c8f62",
        },
      ],
      buildReadoutSeriesForPane: () => [],
    });

    expect(readout.active).toBe(true);
    expect(readout.paneIndex).toBe(0);
    expect(readout.time).toBe(2);
    expect(readout.close).toBe(12);
    expect(readout.price).toBe(20);
    expect(readout.series).toEqual([
      {
        id: "main-1",
        label: "Main 1",
        kind: "candlestick",
        value: 12,
        formattedValue: "12.00",
        color: "#0c8f62",
      },
    ]);
  });

  it("switches to secondary-pane readout when the crosshair is over a secondary pane", () => {
    const timeScale = createTimeScale();
    const primaryPriceScale = createPriceScale(10, 30);
    const secondaryPriceScale = createPriceScale(100, 200);
    const secondaryRows = [
      createRow(0, 1, [110, 110, 110, 110]),
      createRow(1, 2, [120, 120, 120, 120]),
    ] as const;

    const readout = buildRawReadout({
      point: { x: 90, y: 150 },
      paneFrames: [
        { id: "primary", kind: "primary", top: 0, height: 100 } satisfies PaneFrame,
        { id: "pane-2", kind: "secondary", top: 100, height: 100 } satisfies PaneFrame,
      ],
      mainSourceId: "main-1",
      primaryRows: [
        createRow(0, 1, [10, 12, 9, 11]),
      ],
      primaryStudies: [],
      primarySources: [],
      timeScale,
      primaryPriceScale,
      getPaneIndex: (paneId) => (paneId === "pane-2" ? 1 : 0),
      getSecondarySeriesForPane: () => [{
        id: "study-1",
        kind: "line",
        priceScale: secondaryPriceScale,
        data: [],
        store: { setData: () => secondaryRows },
      }],
      buildReadoutSeriesForPrimary: () => [],
      buildReadoutSeriesForPane: () => [
        {
          id: "study-1",
          label: "Study 1",
          kind: "line",
          value: 120,
          formattedValue: "120.00",
          color: "#3b82f6",
        },
      ],
    });

    expect(readout.active).toBe(true);
    expect(readout.paneIndex).toBe(1);
    expect(readout.time).toBe(1);
    expect(readout.price).toBe(150);
    expect(readout.series).toEqual([
      {
        id: "study-1",
        label: "Study 1",
        kind: "line",
        value: 120,
        formattedValue: "120.00",
        color: "#3b82f6",
      },
    ]);
  });
});
