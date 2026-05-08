import {
  createDefaultStudyInputContext,
  createSeriesRuntimeFields,
  type MovingAverageIndicatorState,
  type PriceScale,
  type StudySourceKind,
} from "../model";

export function createStudySourceState<
  Data,
  Api,
  Kind extends string,
  Options,
  Visual,
  PriceLineState,
  MarkerState,
  CompareOptions,
>(
  params: {
    paneId: string;
    kind: Kind;
    api: Api;
    meta: { id: string; label: string };
    priceScale: PriceScale;
    priceScaleId: string;
    studyKind?: StudySourceKind;
    indicator?: MovingAverageIndicatorState;
    defaultCompareOptions: CompareOptions;
    createOptions(kind: Kind): Options;
  },
) {
  const studyKind = params.studyKind ?? "series";
  return {
    id: params.meta.id,
    label: params.meta.label,
    kind: params.kind,
    role: "study" as const,
    studyKind,
    inputData: [] as Data[],
    inputContext: createDefaultStudyInputContext(),
    indicator: params.indicator,
    compareOptions:
      studyKind === "compare"
        ? { ...params.defaultCompareOptions }
        : undefined,
    paneId: params.paneId,
    priceScaleId: params.priceScaleId,
    visible: true,
    ...createSeriesRuntimeFields<Data, Api, Options, Visual, PriceLineState, MarkerState>({
      api: params.api,
      priceScale: params.priceScale,
      options: params.createOptions(params.kind),
    }),
  };
}

export function attachStudySource<State>(
  params: {
    paneId: string;
    kind: string;
    api: unknown;
    meta: { id: string; label: string };
    studyKind?: StudySourceKind;
    indicator?: MovingAverageIndicatorState;
  },
  deps: {
    primaryPriceScale: PriceScale;
    getOrCreateSecondaryPriceScale(paneId: string): PriceScale;
    createSourceState(args: {
      paneId: string;
      kind: string;
      api: unknown;
      meta: { id: string; label: string };
      priceScale: PriceScale;
      priceScaleId: string;
      studyKind?: StudySourceKind;
      indicator?: MovingAverageIndicatorState;
    }): State;
    registerSource(source: State): void;
  },
): void {
  const priceScale = params.paneId === "primary"
    ? deps.primaryPriceScale
    : deps.getOrCreateSecondaryPriceScale(params.paneId);
  const priceScaleId = params.paneId === "primary" ? "primary-right" : `${params.paneId}-right`;

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
