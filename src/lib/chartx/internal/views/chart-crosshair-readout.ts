import { findNearestRowByLogical, PriceScale, TimeScale } from "../model";

type PanePoint = {
  x: number;
  y: number;
};

type ReadoutBody = {
  active: boolean;
  paneIndex: number | null;
  time: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  price: number | null;
  series: readonly unknown[];
};

type Row = {
  index: number;
  time: number;
  value: readonly [number, number, number, number];
};

export function buildCrosshairReadout<RowType extends Row, Body extends ReadoutBody>(
  rows: readonly RowType[],
  crosshair: PanePoint | null,
  timeScale: TimeScale,
  priceScale: PriceScale,
): Body {
  if (crosshair === null || rows.length === 0) {
    return createInactiveReadout() as unknown as Body;
  }

  const logical = Math.round(timeScale.coordinateToLogical(crosshair.x));
  const row = findNearestRowByLogical(rows, logical);
  if (row === null) {
    return createInactiveReadout() as unknown as Body;
  }

  return {
    active: true,
    paneIndex: null,
    time: row.time,
    open: row.value[0],
    high: row.value[1],
    low: row.value[2],
    close: row.value[3],
    price: priceScale.coordinateToPrice(crosshair.y),
    series: [],
  } as unknown as Body;
}

function createInactiveReadout(): ReadoutBody {
  return {
    active: false,
    paneIndex: null,
    time: null,
    open: null,
    high: null,
    low: null,
    close: null,
    price: null,
    series: [],
  };
}
