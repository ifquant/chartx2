import type {
  PhaseOnePriceScaleApi,
  PhaseOneTimeScaleApi,
} from "./chart-api-types";
import { resolveTimeFocus, type TimeAxisRow } from "../model/time-focus";

type LogicalRange = { from: number; to: number };
type PriceRange = { minValue: number; maxValue: number } | null;
type LayoutLike = { width: number; left: number; right: number };

function paneWidthFromLayout(layout: LayoutLike): number {
  return Math.max(40, layout.width - layout.left - layout.right);
}

export function createTimeScaleApi(
  deps: {
    getPointCount(): number;
    getTimeAxisRows(): readonly TimeAxisRow[];
    getLayout(): LayoutLike;
    getBarSpacing(): number | null;
    setBarSpacing(value: number): void;
    getRightOffset(): number;
    setRightOffset(value: number): void;
    resolveBarSpacing(currentSpacing: number | null, paneWidth: number, pointCount: number): number;
    clampBarSpacing(value: number): number;
    applyTimeScaleOptions(options: {
      width: number;
      pointCount: number;
      barSpacing: number;
      rightOffset: number;
    }): void;
    setTimeAxisFormatter(formatter: ((time: number) => string) | null): void;
    render(): void;
  },
): PhaseOneTimeScaleApi {
  const applyVisibleLogicalRange = (range: LogicalRange, lastLogicalIndex = deps.getPointCount() - 1) => {
    const pointCount = deps.getPointCount();
    const layout = deps.getLayout();
    const paneWidth = paneWidthFromLayout(layout);
    const spacing = deps.clampBarSpacing(paneWidth / (range.to - range.from));
    deps.setBarSpacing(spacing);
    deps.setRightOffset(range.to - lastLogicalIndex);
    deps.applyTimeScaleOptions({
      width: paneWidth,
      pointCount,
      barSpacing: spacing,
      rightOffset: deps.getRightOffset(),
    });
    deps.render();
  };

  return {
    getVisibleLogicalRange: () => {
      const pointCount = deps.getPointCount();
      if (pointCount <= 0) {
        return null;
      }

      const layout = deps.getLayout();
      const paneWidth = paneWidthFromLayout(layout);
      const spacing = deps.resolveBarSpacing(deps.getBarSpacing(), paneWidth, pointCount);
      const lastIndex = pointCount - 1;
      const rightOffset = deps.getRightOffset();

      return {
        from: lastIndex - paneWidth / spacing + rightOffset,
        to: lastIndex + rightOffset,
      };
    },
    setVisibleLogicalRange: (range: LogicalRange) => {
      const pointCount = deps.getPointCount();
      if (!Number.isFinite(range.from) || !Number.isFinite(range.to) || range.to <= range.from) {
        throw new Error("chartx phase-one time scale visible range requires finite from/to with to > from");
      }
      if (pointCount <= 0) {
        throw new Error("chartx phase-one time scale visible range requires at least one data point");
      }

      applyVisibleLogicalRange(range);
    },
    focusTime: (request) => {
      // Snapshot the ChartModel-owned axis once so resolution cannot race a source update.
      const axisRows = deps.getTimeAxisRows().slice();
      const resolution = resolveTimeFocus(axisRows, request);
      if (resolution.logicalRange !== null) {
        applyVisibleLogicalRange(resolution.logicalRange, axisRows[axisRows.length - 1]!.index);
      }
      return resolution.result;
    },
    applyOptions: (options) => {
      if (options.barSpacing !== undefined) {
        deps.setBarSpacing(deps.clampBarSpacing(options.barSpacing));
      }
      if (options.rightOffset !== undefined) {
        deps.setRightOffset(options.rightOffset);
      }
      if (options.tickMarkFormatter !== undefined) {
        deps.setTimeAxisFormatter(options.tickMarkFormatter);
      }

      const layout = deps.getLayout();
      const pointCount = deps.getPointCount();
      const paneWidth = paneWidthFromLayout(layout);
      deps.applyTimeScaleOptions({
        width: paneWidth,
        pointCount,
        barSpacing: deps.resolveBarSpacing(deps.getBarSpacing(), paneWidth, pointCount),
        rightOffset: deps.getRightOffset(),
      });
      deps.render();
    },
  };
}

export function createPriceScaleApi(
  deps: {
    getVisibleRange(): PriceRange;
    setVisibleRange(range: PriceRange): void;
    applyVisibleRangeIfPresent(): void;
    setPriceFormatter(formatter: ((value: number) => string) | null): void;
    setScaleSeriesOnly(value: boolean): void;
    render(): void;
  },
): PhaseOnePriceScaleApi {
  return {
    getVisibleRange: () => deps.getVisibleRange(),
    setVisibleRange: (range) => {
      deps.setVisibleRange(range);
      deps.applyVisibleRangeIfPresent();
      deps.render();
    },
    applyOptions: (options) => {
      if (options.priceFormatter !== undefined) {
        deps.setPriceFormatter(options.priceFormatter);
      }
      if (options.scaleSeriesOnly !== undefined) {
        deps.setScaleSeriesOnly(options.scaleSeriesOnly);
      }
      deps.render();
    },
  };
}
