import { PriceScale, type PriceRangeImpl } from "../model";

type RowWithIndex = {
  index: number;
};

type RowSet = readonly RowWithIndex[];

type RangeSource = {
  id: string;
  store: {
    priceRange(start: number, end: number): PriceRangeImpl | null;
  };
};

type CompareStudySource = RangeSource & {
  studyKind: string | null;
  compareOptions?: {
    affectMainScale?: boolean;
  } | null;
};

export function applyPrimaryPaneScale(
  params: {
    mainSource: RangeSource | null;
    primaryStudies: readonly CompareStudySource[];
    primaryRowSets: ReadonlyMap<string, RowSet>;
    primaryScaleSeriesOnly: boolean;
    priceRangeOverride: PriceRangeImpl | null;
    paneHeight: number;
    priceScale: PriceScale;
  },
): {
  range: PriceRangeImpl | null;
  rangeMin: number;
} {
  let mergedRange = params.mainSource === null
    ? null
    : mergeSourceRange(
        null,
        params.mainSource,
        params.primaryRowSets.get(params.mainSource.id) ?? [],
      );

  if (params.mainSource !== null) {
    for (const state of params.primaryStudies) {
      if (
        state.studyKind === "compare"
        && (params.primaryScaleSeriesOnly || state.compareOptions?.affectMainScale === false)
      ) {
        continue;
      }
      mergedRange = mergeSourceRange(mergedRange, state, params.primaryRowSets.get(state.id) ?? []);
    }
  }

  const appliedRange = params.priceRangeOverride ?? mergedRange;
  params.priceScale.applyOptions({
    height: params.paneHeight,
    priceRange: appliedRange,
  });

  return {
    range: appliedRange,
    rangeMin: appliedRange?.minValue() ?? 0,
  };
}

export function applySecondaryPaneScale(
  params: {
    paneSeries: readonly RangeSource[];
    secondaryRows: ReadonlyMap<string, RowSet>;
    paneHeight: number;
    priceScale: PriceScale | undefined;
  },
): {
  hasPriceScale: boolean;
  range: PriceRangeImpl | null;
  rangeMin: number;
} {
  let range: PriceRangeImpl | null = null;

  for (const state of params.paneSeries) {
    const rows = params.secondaryRows.get(state.id) ?? [];
    range = mergeSourceRange(range, state, rows);
  }

  if (params.priceScale !== undefined && range !== null) {
    params.priceScale.applyOptions({
      height: params.paneHeight,
      priceRange: range,
    });
  }

  return {
    hasPriceScale: params.priceScale !== undefined && range !== null,
    range,
    rangeMin: range?.minValue() ?? 0,
  };
}

function mergeSourceRange(
  merged: PriceRangeImpl | null,
  source: RangeSource,
  rows: RowSet,
): PriceRangeImpl | null {
  const nextRange = resolveSourceRangeFromEdges(source, rows);
  if (nextRange === null) {
    return merged;
  }
  return merged === null ? nextRange : merged.merge(nextRange);
}

function resolveSourceRangeFromEdges(
  source: RangeSource,
  rows: RowSet,
): PriceRangeImpl | null {
  if (rows.length === 0) {
    return null;
  }
  return source.store.priceRange(rows[0]!.index, rows[rows.length - 1]!.index);
}
