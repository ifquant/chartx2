import {
  replaceMainHistogramLikeData,
  replaceMainSeriesData,
  updateMainHistogramLikeData,
  updateMainSeriesData,
} from "./chart-series-mutation";

export function setPrimaryData<Source, Data>(
  source: Source,
  data: readonly Data[],
  deps: {
    rebuild(source: Source): void;
    syncContext(source: Source): void;
    resetViewport(): void;
    render(): void;
  },
): void {
  replaceMainSeriesData(source as never, data, {
    rebuild: (nextSource) => deps.rebuild(nextSource as Source),
    syncContext: (nextSource) => deps.syncContext(nextSource as Source),
    resetViewport: deps.resetViewport,
    render: deps.render,
  });
}

export function updatePrimaryData<Source, Data>(
  source: Source,
  bar: Data,
  deps: {
    updateCanonical(existing: readonly Data[], bar: Data): readonly Data[];
    rebuild(source: Source): void;
    syncContext(source: Source): void;
    clearPriceRangeOverride(): void;
    render(): void;
  },
): void {
  updateMainSeriesData(source as never, bar, {
    updateCanonical: deps.updateCanonical,
    rebuild: (nextSource) => deps.rebuild(nextSource as Source),
    syncContext: (nextSource) => deps.syncContext(nextSource as Source),
    clearPriceRangeOverride: deps.clearPriceRangeOverride,
    render: deps.render,
  });
}

export function setPrimaryHistogramLikeData<Source, HistogramBar, CanonicalBar, Visual>(
  source: Source,
  data: readonly HistogramBar[],
  deps: {
    buildVisuals(data: readonly HistogramBar[]): Map<number, Visual>;
    normalizeData(data: readonly HistogramBar[]): readonly CanonicalBar[];
    rebuild(source: Source): void;
    syncContext(source: Source): void;
    resetViewport(): void;
    render(): void;
  },
): void {
  replaceMainHistogramLikeData(source as never, data, {
    buildVisuals: deps.buildVisuals,
    normalizeData: deps.normalizeData,
    replaceMainSeriesData: (nextSource, canonicalData) =>
      replaceMainSeriesData(nextSource, canonicalData, {
        rebuild: (rebuiltSource) => deps.rebuild(rebuiltSource as Source),
        syncContext: (syncedSource) => deps.syncContext(syncedSource as Source),
        resetViewport: deps.resetViewport,
        render: deps.render,
      }),
  });
}

export function updatePrimaryHistogramLikeData<Source, HistogramBar, CanonicalBar>(
  source: Source,
  bar: HistogramBar,
  deps: {
    normalizeBar(bar: HistogramBar): CanonicalBar;
    updateCanonical(existing: readonly CanonicalBar[], bar: CanonicalBar): readonly CanonicalBar[];
    rebuild(source: Source): void;
    syncContext(source: Source): void;
    clearPriceRangeOverride(): void;
    render(): void;
  },
): void {
  updateMainHistogramLikeData(source as never, bar as never, {
    normalizeBar: deps.normalizeBar as never,
    updateMainSeriesData: (nextSource, canonicalBar) =>
      updateMainSeriesData(nextSource, canonicalBar, {
        updateCanonical: deps.updateCanonical as never,
        rebuild: (rebuiltSource) => deps.rebuild(rebuiltSource as Source),
        syncContext: (syncedSource) => deps.syncContext(syncedSource as Source),
        clearPriceRangeOverride: deps.clearPriceRangeOverride,
        render: deps.render,
      }),
  });
}
