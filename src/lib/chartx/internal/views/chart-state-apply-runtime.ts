import type { ValidatedChartStateApplicationDependencies } from "./chart-state";
import type { ChartStateRestoreDependencies } from "./chart-state-restore";

type RestorePhaseGroups<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay,
> = {
  validateDrawings: ValidatedChartStateApplicationDependencies<
    Options,
    MainSeriesState,
    SeriesState,
    StudyState,
    DrawingState,
    TradeRequest,
    TradeOverlay
  >["validateDrawings"];
  options: Pick<
    ChartStateRestoreDependencies<
      Options,
      MainSeriesState,
      SeriesState,
      StudyState,
      DrawingState,
      TradeRequest,
      TradeOverlay
    >,
    "applyOptions"
  >;
  clearing: Pick<
    ChartStateRestoreDependencies<
      Options,
      MainSeriesState,
      SeriesState,
      StudyState,
      DrawingState,
      TradeRequest,
      TradeOverlay
    >,
    "clearSelection" | "clearDrawings" | "clearStudies" | "clearSeries" | "clearTradeLocation"
  >;
  panes: Pick<
    ChartStateRestoreDependencies<
      Options,
      MainSeriesState,
      SeriesState,
      StudyState,
      DrawingState,
      TradeRequest,
      TradeOverlay
    >,
    "listSecondaryPaneIds" | "getSecondarySeriesCountForPane" | "removeSecondaryPane" | "addSecondaryPane" | "applySecondaryPaneState"
  >;
  content: Pick<
    ChartStateRestoreDependencies<
      Options,
      MainSeriesState,
      SeriesState,
      StudyState,
      DrawingState,
      TradeRequest,
      TradeOverlay
    >,
    "applyMainSeriesState" | "restoreSeries" | "restoreStudies" | "locateTrade" | "restoreDrawings"
  >;
  scales: Pick<
    ChartStateRestoreDependencies<
      Options,
      MainSeriesState,
      SeriesState,
      StudyState,
      DrawingState,
      TradeRequest,
      TradeOverlay
    >,
    "applyTimeScaleState" | "applyPriceScaleState"
  >;
  finalize: Pick<
    ChartStateRestoreDependencies<
      Options,
      MainSeriesState,
      SeriesState,
      StudyState,
      DrawingState,
      TradeRequest,
      TradeOverlay
    >,
    "finalize"
  >;
};

export function createValidatedChartStateApplicationDeps<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay,
>(
  groups: RestorePhaseGroups<
    Options,
    MainSeriesState,
    SeriesState,
    StudyState,
    DrawingState,
    TradeRequest,
    TradeOverlay
  >,
): ValidatedChartStateApplicationDependencies<
  Options,
  MainSeriesState,
  SeriesState,
  StudyState,
  DrawingState,
  TradeRequest,
  TradeOverlay
> {
  return {
    validateDrawings: groups.validateDrawings,
    restoreDeps: {
      ...groups.options,
      ...groups.clearing,
      ...groups.panes,
      ...groups.content,
      ...groups.scales,
      ...groups.finalize,
    },
  };
}
