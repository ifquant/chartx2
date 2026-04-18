import { createMainSeriesStateSnapshot, type MainSeriesStateSnapshot } from "../model";

type MainSeriesStateTarget = {
  chartType: MainSeriesStateSnapshot["chartType"];
  options: Record<string, unknown>;
  lineBreakOptions: MainSeriesStateSnapshot["lineBreakOptions"];
  renkoOptions: MainSeriesStateSnapshot["renkoOptions"];
  pointFigureOptions: MainSeriesStateSnapshot["pointFigureOptions"];
  kagiOptions: MainSeriesStateSnapshot["kagiOptions"];
};

export function buildMainSeriesStateSnapshot(
  source: MainSeriesStateTarget | null,
): MainSeriesStateSnapshot | null {
  if (source === null) {
    return null;
  }

  return createMainSeriesStateSnapshot({
    chartType: source.chartType,
    options: source.options,
    lineBreakOptions: source.lineBreakOptions,
    renkoOptions: source.renkoOptions,
    pointFigureOptions: source.pointFigureOptions,
    kagiOptions: source.kagiOptions,
  });
}

export type MainSeriesApplyTarget<Api, Source> = {
  current: Source | null;
  ensureAttached(chartType: MainSeriesStateSnapshot["chartType"]): Api;
  switchChartType(chartType: MainSeriesStateSnapshot["chartType"]): Api;
  getCurrentSource(): Source;
  createOptions(styleSchemaId: MainSeriesStateSnapshot["styleSchemaId"]): Record<string, unknown>;
  rebuildData(source: Source): void;
  syncContext(source: Source): void;
  resetPrimaryPriceRangeOverride(): void;
  finalize(): void;
};

type MainSeriesApplySource = {
  api: unknown;
  chartType: MainSeriesStateSnapshot["chartType"];
  styleSchemaId: MainSeriesStateSnapshot["styleSchemaId"];
  options: Record<string, unknown>;
  lineBreakOptions: MainSeriesStateSnapshot["lineBreakOptions"];
  renkoOptions: MainSeriesStateSnapshot["renkoOptions"];
  pointFigureOptions: MainSeriesStateSnapshot["pointFigureOptions"];
  kagiOptions: MainSeriesStateSnapshot["kagiOptions"];
};

export function applyMainSeriesStateSnapshot<Api, Source extends MainSeriesApplySource>(
  state: MainSeriesStateSnapshot,
  deps: MainSeriesApplyTarget<Api, Source>,
): Api {
  const nextApi =
    deps.current === null
      ? deps.ensureAttached(state.chartType)
      : deps.current.chartType === state.chartType
        ? (deps.current.api as Api)
        : deps.switchChartType(state.chartType);

  const source = deps.getCurrentSource();
  source.options = deps.createOptions(source.styleSchemaId);

  for (const [key, value] of Object.entries(state.styleOptions)) {
    source.options[key] = value;
  }

  source.lineBreakOptions = {
    lineCount: Math.max(1, Math.floor(state.lineBreakOptions.lineCount)),
  };
  source.renkoOptions = {
    boxSize:
      state.renkoOptions.boxSize !== null && state.renkoOptions.boxSize > 0
        ? state.renkoOptions.boxSize
        : null,
    boxSizeMode: state.renkoOptions.boxSizeMode,
  };
  source.pointFigureOptions = {
    boxSize:
      state.pointFigureOptions.boxSize !== null && state.pointFigureOptions.boxSize > 0
        ? state.pointFigureOptions.boxSize
        : null,
    boxSizeMode: state.pointFigureOptions.boxSizeMode,
    boxSizeScale: Math.min(4, Math.max(0.25, state.pointFigureOptions.boxSizeScale)),
    reversalBoxes: Math.max(1, Math.floor(state.pointFigureOptions.reversalBoxes)),
    atrLength: Math.max(2, Math.floor(state.pointFigureOptions.atrLength)),
    percentageValue: Math.min(25, Math.max(0.1, state.pointFigureOptions.percentageValue)),
  };
  source.kagiOptions = {
    reversalMode: state.kagiOptions.reversalMode,
    reversalSize:
      state.kagiOptions.reversalSize !== null && state.kagiOptions.reversalSize > 0
        ? state.kagiOptions.reversalSize
        : null,
    reversalScale: Math.min(4, Math.max(0.25, state.kagiOptions.reversalScale)),
    atrLength: Math.max(2, Math.floor(state.kagiOptions.atrLength)),
    percentageValue: Math.min(25, Math.max(0.1, state.kagiOptions.percentageValue)),
  };

  deps.rebuildData(source);
  deps.syncContext(source);
  deps.resetPrimaryPriceRangeOverride();
  deps.finalize();

  return nextApi;
}
