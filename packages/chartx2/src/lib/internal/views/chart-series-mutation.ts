export function replaceMainSeriesData<Data, Source extends {
  inputData: readonly Data[];
  data: readonly unknown[];
  visuals: Map<number, Visual>;
}, Visual>(
  source: Source,
  data: readonly Data[],
  deps: {
    rebuild(source: Source): void;
    syncContext(source: Source): void;
    resetViewport(): void;
    render(): void;
  },
): void {
  source.inputData = [...data];
  deps.rebuild(source);
  source.visuals.clear();
  deps.syncContext(source);
  deps.resetViewport();
  deps.render();
}

export function updateMainSeriesData<Data, Source extends {
  inputData: readonly Data[];
},>(
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
  source.inputData = deps.updateCanonical(source.inputData, bar);
  deps.rebuild(source);
  deps.syncContext(source);
  deps.clearPriceRangeOverride();
  deps.render();
}

export function replaceMainHistogramLikeData<
  HistogramBar,
  CanonicalBar,
  Source extends {
    visuals: Map<number, Visual>;
    inputData: readonly CanonicalBar[];
    data: readonly unknown[];
  },
  Visual,
>(
  source: Source,
  data: readonly HistogramBar[],
  deps: {
    buildVisuals(data: readonly HistogramBar[]): Map<number, Visual>;
    normalizeData(data: readonly HistogramBar[]): readonly CanonicalBar[];
    replaceMainSeriesData(source: Source, data: readonly CanonicalBar[]): void;
  },
): void {
  source.visuals = deps.buildVisuals(data);
  deps.replaceMainSeriesData(source, deps.normalizeData(data));
}

export function updateMainHistogramLikeData<
  HistogramBar extends { time: number; color?: string; up?: boolean; value: number },
  CanonicalBar extends { time: number; close: number },
  Source extends {
    visuals: Map<number, Visual>;
    data: readonly CanonicalBar[];
  },
  Visual extends { color?: string; isUp: boolean },
>(
  source: Source,
  bar: HistogramBar,
  deps: {
    normalizeBar(bar: HistogramBar): CanonicalBar;
    updateMainSeriesData(source: Source, bar: CanonicalBar): void;
  },
): void {
  const previous = source.data.length === 0 ? null : source.data[source.data.length - 1];
  source.visuals.set(bar.time, {
    color: bar.color,
    isUp:
      bar.up ??
      (previous === null || bar.time <= previous.time
        ? (source.visuals.get(bar.time)?.isUp ?? true)
        : bar.value >= previous.close),
  } as Visual);
  deps.updateMainSeriesData(source, deps.normalizeBar(bar));
}

export function replaceStudySeriesData<Data, Source extends {
  role: string;
  inputData: readonly Data[];
  data: readonly unknown[];
  visuals: Map<number, Visual>;
}, Visual>(
  source: Source,
  data: readonly Data[],
  deps: {
    resolveDisplayData(source: Source): readonly unknown[];
    resetViewport(): void;
    render(): void;
  },
): void {
  if (source.role !== "study") {
    throw new Error("chartx phase-one secondary data path expects a study source");
  }
  source.inputData = [...data];
  source.data = deps.resolveDisplayData(source);
  source.visuals.clear();
  deps.resetViewport();
  deps.render();
}

export function updateStudySeriesData<Data, Source extends {
  role: string;
  inputData: readonly Data[];
  data: readonly unknown[];
},>(
  source: Source,
  bar: Data,
  deps: {
    updateCanonical(existing: readonly Data[], bar: Data): readonly Data[];
    resolveDisplayData(source: Source): readonly unknown[];
    render(): void;
  },
): void {
  if (source.role !== "study") {
    throw new Error("chartx phase-one secondary update path expects a study source");
  }
  source.inputData = deps.updateCanonical(source.inputData, bar);
  source.data = deps.resolveDisplayData(source);
  deps.render();
}

export function replaceStudyHistogramLikeData<
  HistogramBar,
  CanonicalBar,
  Source extends {
    visuals: Map<number, Visual>;
    inputData: readonly CanonicalBar[];
    data: readonly unknown[];
    role: string;
  },
  Visual,
>(
  source: Source,
  data: readonly HistogramBar[],
  deps: {
    buildVisuals(data: readonly HistogramBar[]): Map<number, Visual>;
    normalizeData(data: readonly HistogramBar[]): readonly CanonicalBar[];
    replaceStudySeriesData(source: Source, data: readonly CanonicalBar[]): void;
    render(): void;
  },
): void {
  deps.replaceStudySeriesData(source, deps.normalizeData(data));
  source.visuals = deps.buildVisuals(data);
  deps.render();
}

export function updateStudyHistogramLikeData<
  HistogramBar extends { time: number; color?: string; up?: boolean; value: number },
  CanonicalBar extends { time: number; close: number },
  Source extends {
    visuals: Map<number, Visual>;
    data: readonly CanonicalBar[];
    role: string;
  },
  Visual extends { color?: string; isUp: boolean },
>(
  source: Source,
  bar: HistogramBar,
  deps: {
    normalizeBar(bar: HistogramBar): CanonicalBar;
    updateStudySeriesData(source: Source, bar: CanonicalBar): void;
  },
): void {
  const previous = source.data.length === 0 ? null : source.data[source.data.length - 1];
  source.visuals.set(bar.time, {
    color: bar.color,
    isUp:
      bar.up ??
      (previous === null || bar.time <= previous.time
        ? (source.visuals.get(bar.time)?.isUp ?? true)
        : bar.value >= previous.close),
  } as Visual);
  deps.updateStudySeriesData(source, deps.normalizeBar(bar));
}
