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
  const lineBreakOptions = state.lineBreakOptions ?? source.lineBreakOptions;
  const renkoOptions = state.renkoOptions ?? source.renkoOptions;
  const pointFigureOptions = state.pointFigureOptions ?? source.pointFigureOptions;
  const kagiOptions = state.kagiOptions ?? source.kagiOptions;

  for (const [key, value] of Object.entries(state.styleOptions)) {
    source.options[key] = value;
  }

  source.lineBreakOptions = {
    lineCount: Math.max(1, Math.floor(lineBreakOptions.lineCount)),
  };
  source.renkoOptions = {
    boxSize: renkoOptions.boxSize !== null && renkoOptions.boxSize > 0 ? renkoOptions.boxSize : null,
    boxSizeMode: renkoOptions.boxSizeMode,
  };
  source.pointFigureOptions = {
    boxSize:
      pointFigureOptions.boxSize !== null && pointFigureOptions.boxSize > 0
        ? pointFigureOptions.boxSize
        : null,
    boxSizeMode: pointFigureOptions.boxSizeMode,
    boxSizeScale: Math.min(4, Math.max(0.25, pointFigureOptions.boxSizeScale)),
    reversalBoxes: Math.max(1, Math.floor(pointFigureOptions.reversalBoxes)),
    atrLength: Math.max(2, Math.floor(pointFigureOptions.atrLength)),
    percentageValue: Math.min(25, Math.max(0.1, pointFigureOptions.percentageValue)),
  };
  source.kagiOptions = {
    reversalMode: kagiOptions.reversalMode,
    reversalSize:
      kagiOptions.reversalSize !== null && kagiOptions.reversalSize > 0
        ? kagiOptions.reversalSize
        : null,
    reversalScale: Math.min(4, Math.max(0.25, kagiOptions.reversalScale)),
    atrLength: Math.max(2, Math.floor(kagiOptions.atrLength)),
    percentageValue: Math.min(25, Math.max(0.1, kagiOptions.percentageValue)),
  };

  deps.rebuildData(source);
  deps.syncContext(source);
  deps.resetPrimaryPriceRangeOverride();
  deps.finalize();

  return nextApi;
}
