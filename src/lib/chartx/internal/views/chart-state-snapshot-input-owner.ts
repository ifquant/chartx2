import { validateDrawingCollectionSnapshots } from "./chart-drawing-restore";
import { resolveDrawingMagnetOptions } from "./chart-drawing-snap";
import type {
  PhaseOneChartOptions,
  PhaseOneChartStateSnapshot,
} from "./chart-harness";

type DrawingMagnetSources = {
  open: boolean;
  high: boolean;
  low: boolean;
  close: boolean;
};

type DrawingMagnetOptions = {
  magnetEnabled: boolean;
  magnetTolerancePx: number;
  timeMagnetEnabled: boolean;
  timeMagnetPolicy: "nearest" | "previous" | "next";
  timeMagnetTolerancePx: number;
  magnetSources: DrawingMagnetSources;
};

type TradeLocationSession = {
  request: NonNullable<PhaseOneChartStateSnapshot["tradeLocation"]>["request"];
  options: NonNullable<PhaseOneChartStateSnapshot["tradeLocation"]>["overlay"];
};

export function createChartStateSnapshotInputOwner<Drawing>(deps: {
  getLayoutOptions(): Required<NonNullable<PhaseOneChartOptions["layout"]>>;
  getCrosshairOptions(): Required<NonNullable<PhaseOneChartOptions["crosshair"]>>;
  getBarSpacing(): number | null;
  getRightOffset(): number;
  getVisibleLogicalRange(): { from: number; to: number } | null;
  getVisiblePriceRange(): { minValue: number; maxValue: number } | null;
  getPrimaryScaleSeriesOnly(): boolean;
  getActiveTradeLocation(): TradeLocationSession | null;
  listDrawings(): readonly Drawing[];
  getDrawingOptions(): DrawingMagnetOptions;
}) {
  return {
    getOptions: () => ({
      layout: deps.getLayoutOptions(),
      crosshair: deps.getCrosshairOptions(),
    }),
    getTimeScaleState: () => ({
      barSpacing: deps.getBarSpacing(),
      rightOffset: deps.getRightOffset(),
      visibleLogicalRange: deps.getVisibleLogicalRange(),
    }),
    getPriceScaleState: () => ({
      visibleRange: deps.getVisiblePriceRange(),
      scaleSeriesOnly: deps.getPrimaryScaleSeriesOnly(),
    }),
    getTradeLocationState: (): PhaseOneChartStateSnapshot["tradeLocation"] => {
      const activeTradeLocation = deps.getActiveTradeLocation();
      return activeTradeLocation === null
        ? null
        : {
            request: activeTradeLocation.request,
            overlay: activeTradeLocation.options,
          };
    },
    listDrawings: deps.listDrawings,
    resolveDrawingMagnetOptions: (drawing: Drawing) =>
      resolveDrawingMagnetOptions(drawing as never, deps.getDrawingOptions()),
    validateDrawings: (
      drawings: PhaseOneChartStateSnapshot["drawings"],
      secondaryPaneCount: number,
    ) => {
      validateDrawingCollectionSnapshots(drawings, secondaryPaneCount);
    },
  };
}
