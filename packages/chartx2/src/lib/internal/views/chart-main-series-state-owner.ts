import type {
  MainSeriesStateSnapshot,
  PhaseOneMainChartType,
  PhaseOneMainStyleSchemaId,
} from "../model";

import {
  applyMainSeriesStateSnapshot,
  buildMainSeriesStateSnapshot,
} from "./chart-main-series-state";

type MainSeriesStateSource<Api> = {
  api: Api;
  chartType: PhaseOneMainChartType;
  styleSchemaId: PhaseOneMainStyleSchemaId;
  options: Record<string, unknown>;
  lineBreakOptions: MainSeriesStateSnapshot["lineBreakOptions"];
  renkoOptions: MainSeriesStateSnapshot["renkoOptions"];
  pointFigureOptions: MainSeriesStateSnapshot["pointFigureOptions"];
  kagiOptions: MainSeriesStateSnapshot["kagiOptions"];
};

export function createChartMainSeriesStateOwner<Api, Source extends MainSeriesStateSource<Api>>(deps: {
  getMainSource(): Source | null;
  getMainSourceOrThrow(): Source;
  attachMainSeries(chartType: PhaseOneMainChartType): Api;
  switchChartType(chartType: PhaseOneMainChartType): Api;
  createOptions(styleSchemaId: PhaseOneMainStyleSchemaId): Record<string, unknown>;
  rebuildData(source: Source): void;
  syncContext(source: Source): void;
  resetPrimaryPriceRangeOverride(): void;
  render(): void;
}) {
  return {
    getState(): MainSeriesStateSnapshot | null {
      const source = deps.getMainSource();
      return buildMainSeriesStateSnapshot(
        source === null
          ? null
          : {
              chartType: source.chartType,
              options: source.options,
              lineBreakOptions: source.lineBreakOptions,
              renkoOptions: source.renkoOptions,
              pointFigureOptions: source.pointFigureOptions,
              kagiOptions: source.kagiOptions,
            },
      );
    },
    applyState(state: MainSeriesStateSnapshot): Api {
      return applyMainSeriesStateSnapshot(state, {
        current: deps.getMainSource(),
        ensureAttached: deps.attachMainSeries,
        switchChartType: deps.switchChartType,
        getCurrentSource: deps.getMainSourceOrThrow,
        createOptions: deps.createOptions,
        rebuildData: deps.rebuildData,
        syncContext: deps.syncContext,
        resetPrimaryPriceRangeOverride: deps.resetPrimaryPriceRangeOverride,
        finalize: deps.render,
      });
    },
  };
}

