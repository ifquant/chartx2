import {
  mainSeriesStyleSchemaSpec,
  type PhaseOneMainChartType,
  type PhaseOneMainStyleSchemaId,
  type PriceScale,
} from "../model";

import {
  createMainSeriesOptions,
  createMainSourceState,
  createSeriesLabel,
  createSeriesMeta,
  createSeriesOptions,
} from "./chart-series-builders";
import { formatSeriesKindLabel } from "./chart-series-labels";

type SeriesKind = Parameters<typeof createSeriesOptions>[0];
type SeriesOptionDefaults = Parameters<typeof createSeriesOptions>[1];

export function createChartSeriesBuildOwner(params: {
  defaults: SeriesOptionDefaults;
  initialOrdinal?: number;
}) {
  let nextOrdinal = params.initialOrdinal ?? 1;

  const createMeta = (kind: string): { id: string; label: string } => {
    const ordinal = nextOrdinal;
    nextOrdinal += 1;
    return createSeriesMeta(kind, ordinal, {
      formatSeriesKindLabel,
    });
  };

  const createLabel = (kind: string, id: string): string =>
    createSeriesLabel(kind, id, {
      formatSeriesKindLabel,
    });

  const createOptions = (kind: SeriesKind): ReturnType<typeof createSeriesOptions> =>
    createSeriesOptions(kind, params.defaults);

  const createMainOptions = (
    styleSchemaId: PhaseOneMainStyleSchemaId,
  ): ReturnType<typeof createMainSeriesOptions> =>
    createMainSeriesOptions(styleSchemaId, params.defaults, {
      optionSurface: (nextStyleSchemaId) => mainSeriesStyleSchemaSpec(nextStyleSchemaId).optionSurface,
    });

  const createMainSource = <Api>(sourceParams: {
    paneId: string;
    chartType: PhaseOneMainChartType;
    kind: SeriesKind;
    api: Api;
    meta: { id: string; label: string };
    priceScale: PriceScale;
    priceScaleId: string;
  }) =>
    createMainSourceState(sourceParams, {
      candlestickOptions: params.defaults.candlestickOptions,
      lineOptions: params.defaults.lineOptions,
    }, {
      createMainSeriesOptions: createMainOptions,
    });

  return {
    createMeta,
    createLabel,
    createOptions,
    createMainOptions,
    createMainSource,
  };
}
