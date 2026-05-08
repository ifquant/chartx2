import type {
  MovingAverageIndicatorState,
  PriceScale,
  StudySourceKind,
} from "../model";
import { createStudySourceState } from "./chart-study-source";
import type { SecondarySeriesKind } from "./chart-secondary-series-factory";

export function createChartStudySourceOwner<Source>(deps: {
  getPrimaryPriceScale(): PriceScale;
  getOrCreateSecondaryPriceScale(paneId: string): PriceScale;
  createMeta(kind: SecondarySeriesKind): { id: string; label: string };
  createOptions(kind: SecondarySeriesKind): unknown;
  registerSource(source: Source): void;
  defaultCompareOptions: unknown;
}) {
  return {
    studySources: {
      primaryPriceScale: deps.getPrimaryPriceScale(),
      getOrCreateSecondaryPriceScale: deps.getOrCreateSecondaryPriceScale,
      createSourceState: (args: {
        paneId: string;
        kind: string;
        api: unknown;
        meta: { id: string; label: string };
        priceScale: unknown;
        priceScaleId: string;
        studyKind?: string;
        indicator?: unknown;
      }): Source =>
        createStudySourceState<
          unknown,
          unknown,
          SecondarySeriesKind,
          unknown,
          unknown,
          unknown,
          unknown,
          unknown
        >({
          paneId: args.paneId,
          kind: args.kind as SecondarySeriesKind,
          api: args.api,
          meta: args.meta,
          priceScale: args.priceScale as PriceScale,
          priceScaleId: args.priceScaleId,
          studyKind: args.studyKind as StudySourceKind | undefined,
          indicator: args.indicator as MovingAverageIndicatorState | undefined,
          defaultCompareOptions: deps.defaultCompareOptions,
          createOptions: deps.createOptions,
        }) as Source,
      registerSource: (source: unknown) => {
        deps.registerSource(source as Source);
      },
      createMeta: deps.createMeta,
    },
  };
}
