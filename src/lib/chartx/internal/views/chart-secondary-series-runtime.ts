import {
  replaceStudyHistogramLikeData,
  replaceStudySeriesData,
  updateStudyHistogramLikeData,
  updateStudySeriesData,
} from "./chart-series-mutation";

export function setSecondaryData<Source, Data>(
  source: Source,
  data: readonly Data[],
  deps: {
    resolveDisplayData(source: Source): readonly unknown[];
    resetViewport(): void;
    render(): void;
  },
): void {
  replaceStudySeriesData(source as never, data, {
    resolveDisplayData: (nextSource) => deps.resolveDisplayData(nextSource as Source),
    resetViewport: deps.resetViewport,
    render: deps.render,
  });
}

export function updateSecondaryData<Source, Data>(
  source: Source,
  bar: Data,
  deps: {
    updateCanonical(existing: readonly Data[], bar: Data): readonly Data[];
    resolveDisplayData(source: Source): readonly unknown[];
    render(): void;
  },
): void {
  updateStudySeriesData(source as never, bar, {
    updateCanonical: deps.updateCanonical,
    resolveDisplayData: (nextSource) => deps.resolveDisplayData(nextSource as Source),
    render: deps.render,
  });
}

export function setSecondaryHistogramLikeData<Source, HistogramBar, CanonicalBar, Visual>(
  source: Source,
  data: readonly HistogramBar[],
  deps: {
    buildVisuals(data: readonly HistogramBar[]): Map<number, Visual>;
    normalizeData(data: readonly HistogramBar[]): readonly CanonicalBar[];
    resolveDisplayData(source: Source): readonly unknown[];
    resetViewport(): void;
    render(): void;
  },
): void {
  replaceStudyHistogramLikeData(source as never, data, {
    buildVisuals: deps.buildVisuals,
    normalizeData: deps.normalizeData,
    replaceStudySeriesData: (nextSource, canonicalData) =>
      replaceStudySeriesData(nextSource, canonicalData, {
        resolveDisplayData: (resolvedSource) => deps.resolveDisplayData(resolvedSource as Source),
        resetViewport: deps.resetViewport,
        render: deps.render,
      }),
    render: deps.render,
  });
}

export function updateSecondaryHistogramLikeData<Source, HistogramBar, CanonicalBar>(
  source: Source,
  bar: HistogramBar,
  deps: {
    normalizeBar(bar: HistogramBar): CanonicalBar;
    updateCanonical(existing: readonly CanonicalBar[], bar: CanonicalBar): readonly CanonicalBar[];
    resolveDisplayData(source: Source): readonly unknown[];
    render(): void;
  },
): void {
  updateStudyHistogramLikeData(source as never, bar as never, {
    normalizeBar: deps.normalizeBar as never,
    updateStudySeriesData: (nextSource, canonicalBar) =>
      updateStudySeriesData(nextSource, canonicalBar, {
        updateCanonical: deps.updateCanonical as never,
        resolveDisplayData: (resolvedSource) => deps.resolveDisplayData(resolvedSource as Source),
        render: deps.render,
      }),
  });
}
