export function setChartType<ChartType, Source, Api, PreservedState>(
  current: Source,
  nextType: ChartType,
  deps: {
    currentType(source: Source): ChartType;
    currentApi(source: Source): Api;
    removeCurrent(api: Api): boolean;
    clearPriceRangeOverride(): void;
    buildPreservedState(source: Source): PreservedState;
    attachSeries(type: ChartType, preservedState: PreservedState): Api;
    render(): void;
    emitChartTypeChange(type: ChartType): void;
  },
): Api {
  if (deps.currentType(current) === nextType) {
    return deps.currentApi(current);
  }

  const currentApi = deps.currentApi(current);
  if (!deps.removeCurrent(currentApi)) {
    throw new Error("chartx phase-one chart could not replace the active main series");
  }

  deps.clearPriceRangeOverride();
  const nextApi = deps.attachSeries(nextType, deps.buildPreservedState(current));
  deps.render();
  deps.emitChartTypeChange(nextType);
  return nextApi;
}
