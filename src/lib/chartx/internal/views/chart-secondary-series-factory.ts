import type { MovingAverageIndicatorState, StudySourceKind } from "../model";

export type SecondarySeriesKind =
  | "candlestick"
  | "line"
  | "area"
  | "baseline"
  | "bar"
  | "histogram"
  | "volume";

type SecondaryApiSourceState = {
  options: any;
  priceLines: Map<string, any>;
};

export type SecondarySeriesApiDepsBuilder = {
  assertSeriesActive(api: any): void;
  getSource(api: unknown, kind: SecondarySeriesKind): SecondaryApiSourceState;
  applySeriesFormatterOptions(seriesOptions: object, options: object): void;
  render(): void;
  setSecondaryData(api: any, data: readonly any[], kind: SecondarySeriesKind): void;
  updateSecondary(api: any, bar: any, kind: SecondarySeriesKind): void;
  setSecondaryHistogramLikeData(
    api: any,
    data: readonly any[],
    kind: "histogram" | "volume",
  ): void;
  updateSecondaryHistogramLike(
    api: any,
    bar: any,
    kind: "histogram" | "volume",
  ): void;
  normalizeLineData(data: readonly any[]): readonly any[];
  normalizeLineBar(bar: any): any;
  setMarkers(api: any, markers: readonly any[], kind: SecondarySeriesKind): void;
  createPriceLine(api: any, kind: SecondarySeriesKind, options?: any): any;
  removePriceLine(api: any, kind: SecondarySeriesKind, line: any): void;
  applyCompareOptions(api: any, options: any): void;
  getCompareOptions(api: any): any;
  applyMovingAverageStudyOptions(api: any, options: any): void;
  getMovingAverageStudyOptions(api: any): any;
  applyScriptedStudyOptions(api: any, options: any): void;
  getScriptedStudyOptions(api: any): any;
};

export function createSecondarySeriesApiDeps<T>(
  build: (deps: SecondarySeriesApiDepsBuilder) => T,
  deps: SecondarySeriesApiDepsBuilder,
): T {
  return build(deps);
}

export function attachStudySeries<State>(
  params: {
    paneId: string;
    kind: string;
    api: any;
    meta: { id: string; label: string };
    studyKind?: StudySourceKind;
    indicator?: MovingAverageIndicatorState;
  },
  deps: {
    primaryPriceScale: any;
    getOrCreateSecondaryPriceScale(paneId: string): any;
    createSourceState(args: {
      paneId: string;
      kind: string;
      api: any;
      meta: { id: string; label: string };
      priceScale: any;
      priceScaleId: string;
      studyKind?: StudySourceKind;
      indicator?: MovingAverageIndicatorState;
    }): State;
    registerSource(source: State): void;
  },
): void {
  const priceScale =
    params.paneId === "primary"
      ? deps.primaryPriceScale
      : deps.getOrCreateSecondaryPriceScale(params.paneId);
  const priceScaleId =
    params.paneId === "primary" ? "primary-right" : `${params.paneId}-right`;

  deps.registerSource(
    deps.createSourceState({
      paneId: params.paneId,
      kind: params.kind,
      api: params.api,
      meta: params.meta,
      priceScale,
      priceScaleId,
      studyKind: params.studyKind,
      indicator: params.indicator,
    }),
  );
}

export function addSecondarySeries<Api, State, T>(
  params: {
    paneId: string;
    kind: SecondarySeriesKind;
    studyKind?: StudySourceKind;
    indicator?: MovingAverageIndicatorState;
    createApi(apiDeps: SecondarySeriesApiDepsBuilder): Api;
  },
  deps: {
    createMeta(kind: SecondarySeriesKind): { id: string; label: string };
    createApiDeps<TApi>(build: (deps: SecondarySeriesApiDepsBuilder) => TApi): TApi;
    attachStudySeries(params: {
      paneId: string;
      kind: SecondarySeriesKind;
      api: Api;
      meta: { id: string; label: string };
      studyKind?: StudySourceKind;
      indicator?: MovingAverageIndicatorState;
    }): void;
  },
): Api {
  const meta = deps.createMeta(params.kind);
  const api = deps.createApiDeps(params.createApi);
  deps.attachStudySeries({
    paneId: params.paneId,
    kind: params.kind,
    api,
    meta,
    studyKind: params.studyKind,
    indicator: params.indicator,
  });
  return api;
}
