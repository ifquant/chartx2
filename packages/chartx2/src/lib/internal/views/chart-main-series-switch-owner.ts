import type { PhaseOneMainChartType } from "../model";
import {
  clonePriceLines,
  type PriceLineState,
} from "./chart-price-line-runtime";

type MainSeriesSourceState = {
  id: string;
  label: string;
  inputData: readonly unknown[];
  visuals: ReadonlyMap<number, unknown>;
  markers: readonly unknown[];
  priceLines: ReadonlyMap<string, PriceLineState>;
  options: Record<string, unknown>;
  styleSchemaId: unknown;
};

export function createChartMainSeriesSwitchOwner<Api>(deps: {
  removeCurrent(api: Api): boolean;
  clearPriceRangeOverride(): void;
  attachSeries(type: PhaseOneMainChartType, preservedState: unknown): Api;
  render(): void;
  emitChartTypeChange(type: PhaseOneMainChartType): void;
}) {
  return {
    mainSeriesSwitch: {
      removeCurrent: (api: unknown) => deps.removeCurrent(api as Api),
      clearPriceRangeOverride: deps.clearPriceRangeOverride,
      buildPreservedState(source: unknown) {
        const mainSource = source as MainSeriesSourceState;
        return {
          id: mainSource.id,
          label: mainSource.label,
          data: mainSource.inputData,
          visuals: new Map(mainSource.visuals),
          markers: [...mainSource.markers],
          priceLines: clonePriceLines(mainSource.priceLines),
          options: { ...mainSource.options },
          previousStyleSchemaId: mainSource.styleSchemaId,
        };
      },
      attachSeries: (type: string, preserved: unknown) =>
        deps.attachSeries(type as PhaseOneMainChartType, preserved),
      render: deps.render,
      emitChartTypeChange: (type: string) => {
        deps.emitChartTypeChange(type as PhaseOneMainChartType);
      },
    },
  };
}
