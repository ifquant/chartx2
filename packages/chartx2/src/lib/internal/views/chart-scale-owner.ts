import {
  PriceRangeImpl,
  type PaneModelState,
  type PriceScale,
  type TimeScale,
} from "../model";

import { createPriceScaleApi, createTimeScaleApi } from "./chart-scale-commands";
import {
  clamp,
  measureLayout,
  resolveBarSpacing,
  type LayoutGeometry,
} from "./chart-layout-geometry";
import { createChartPaneLayoutOwner } from "./chart-pane-layout-owner";
import type {
  PhaseOnePriceScaleApi,
  PhaseOneTimeScaleApi,
} from "./chart-api-types";
import type { TimeAxisRow } from "../model/time-focus";

type PriceRangeRaw = { minValue: number; maxValue: number } | null;
type ManualLayout = Pick<LayoutGeometry, "width" | "height"> | null;

export function createChartScaleOwner(deps: {
  defaultLayout: LayoutGeometry;
  paneGap: number;
  minBarSpacing: number;
  maxBarSpacing: number;
  getCanvas(): HTMLCanvasElement | null;
  getManualLayout(): ManualLayout;
  getPointCount(): number;
  getTimeAxisRows(): readonly TimeAxisRow[];
  getBarSpacing(): number | null;
  setBarSpacing(value: number): void;
  getRightOffset(): number;
  setRightOffset(value: number): void;
  getTimeScale(): TimeScale;
  setTimeAxisFormatter(formatter: ((time: number) => string) | null): void;
  getPrimaryPriceRangeOverride(): PriceRangeImpl | null;
  setPrimaryPriceRangeOverride(range: PriceRangeImpl | null): void;
  getPrimaryPriceScale(): PriceScale;
  getSecondaryVisibleRange(): PriceRangeRaw;
  getPanes(): readonly PaneModelState[];
  setPriceAxisFormatter(formatter: ((value: number) => string) | null): void;
  setPrimaryScaleSeriesOnly(value: boolean): void;
  render(): void;
}) {
  const getLayout = () => {
    const canvas = deps.getCanvas();
    return canvas === null
      ? deps.defaultLayout
      : measureLayout(canvas, deps.defaultLayout, deps.getManualLayout());
  };

  const resolveSpacing = (currentSpacing: number | null, paneWidth: number, pointCount: number) =>
    resolveBarSpacing(currentSpacing, paneWidth, pointCount, {
      minBarSpacing: deps.minBarSpacing,
      maxBarSpacing: deps.maxBarSpacing,
    });
  const paneLayoutOwner = createChartPaneLayoutOwner({
    listPanes: () => deps.getPanes(),
    paneGap: deps.paneGap,
  });

  return {
    timeScaleApi(): PhaseOneTimeScaleApi {
      return createTimeScaleApi({
        getPointCount: deps.getPointCount,
        getTimeAxisRows: deps.getTimeAxisRows,
        getLayout,
        getBarSpacing: deps.getBarSpacing,
        setBarSpacing: deps.setBarSpacing,
        getRightOffset: deps.getRightOffset,
        setRightOffset: deps.setRightOffset,
        resolveBarSpacing: resolveSpacing,
        clampBarSpacing: (value) => clamp(value, deps.minBarSpacing, deps.maxBarSpacing),
        applyTimeScaleOptions: (options) => deps.getTimeScale().applyOptions(options),
        setTimeAxisFormatter: deps.setTimeAxisFormatter,
        render: deps.render,
      });
    },
    priceScaleApi(): PhaseOnePriceScaleApi {
      return createPriceScaleApi({
        getVisibleRange: () =>
          deps.getPrimaryPriceRangeOverride()?.toRaw() ??
          deps.getPrimaryPriceScale().getPriceRange()?.toRaw() ??
          deps.getSecondaryVisibleRange(),
        setVisibleRange: (range) => {
          deps.setPrimaryPriceRangeOverride(PriceRangeImpl.fromRaw(range));
        },
        applyVisibleRangeIfPresent: () => {
          const override = deps.getPrimaryPriceRangeOverride();
          const canvas = deps.getCanvas();
          if (override === null || canvas === null) {
            return;
          }
          const layout = measureLayout(canvas, deps.defaultLayout, deps.getManualLayout());
          const plotHeight = Math.max(0, layout.height - layout.top - layout.bottom);
          const paneHeight = paneLayoutOwner.primaryPaneFrame(plotHeight)?.height ?? plotHeight;
          deps.getPrimaryPriceScale().applyOptions({
            height: paneHeight,
            priceRange: override,
          });
        },
        setPriceFormatter: deps.setPriceAxisFormatter,
        setScaleSeriesOnly: deps.setPrimaryScaleSeriesOnly,
        render: deps.render,
      });
    },
  };
}
