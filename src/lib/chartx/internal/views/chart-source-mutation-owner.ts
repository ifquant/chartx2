import {
  applyMainSeriesBuilderData,
  buildHistogramVisuals,
  normalizeHistogramBar,
  normalizeHistogramData,
  updateCanonicalData,
  type HistogramVisual,
} from "./chart-series-data-transforms";
import type {
  PhaseOneCandlestickData,
  PhaseOneHistogramData,
} from "./chart-harness";

type MainSourceState = {
  inputData: readonly PhaseOneCandlestickData[];
  data: readonly unknown[];
};

type StudySourceState = {
  inputData: readonly PhaseOneCandlestickData[];
};

export function createChartSourceMutationOwner(deps: {
  syncMainSource(source: MainSourceState): void;
  resolveStudyDisplayData(source: StudySourceState): readonly unknown[];
  resetViewport(): void;
  clearPrimaryPriceRangeOverride(): void;
  render(): void;
}) {
  const updateCanonical = (
    existing: readonly PhaseOneCandlestickData[],
    bar: PhaseOneCandlestickData,
  ) => updateCanonicalData(existing, bar);

  const histogramVisuals = (data: readonly PhaseOneHistogramData[]) =>
    buildHistogramVisuals(data);

  const histogramData = (data: readonly PhaseOneHistogramData[]) =>
    normalizeHistogramData(data);

  const histogramBar = (bar: PhaseOneHistogramData) =>
    normalizeHistogramBar(bar);

  return {
    primaryMutations: {
      rebuild(source: unknown): void {
        const mainSource = source as MainSourceState;
        mainSource.data = applyMainSeriesBuilderData(mainSource.inputData, mainSource as never);
      },
      syncContext: (source: unknown) => deps.syncMainSource(source as MainSourceState),
      resetViewport: deps.resetViewport,
      clearPriceRangeOverride: deps.clearPrimaryPriceRangeOverride,
      render: deps.render,
      updateCanonical: (existing: readonly unknown[], bar: unknown) =>
        updateCanonical(existing as readonly PhaseOneCandlestickData[], bar as PhaseOneCandlestickData),
      buildHistogramVisuals: (data: readonly unknown[]): Map<number, HistogramVisual> =>
        histogramVisuals(data as readonly PhaseOneHistogramData[]),
      normalizeHistogramData: (data: readonly unknown[]) =>
        histogramData(data as readonly PhaseOneHistogramData[]),
      normalizeHistogramBar: (bar: unknown) =>
        histogramBar(bar as PhaseOneHistogramData),
    },
    secondaryMutations: {
      resolveDisplayData: (source: unknown) =>
        deps.resolveStudyDisplayData(source as StudySourceState),
      resetViewport: deps.resetViewport,
      render: deps.render,
      updateCanonical: (existing: readonly unknown[], bar: unknown) =>
        updateCanonical(existing as readonly PhaseOneCandlestickData[], bar as PhaseOneCandlestickData),
      buildHistogramVisuals: (data: readonly unknown[]): Map<number, HistogramVisual> =>
        histogramVisuals(data as readonly PhaseOneHistogramData[]),
      normalizeHistogramData: (data: readonly unknown[]) =>
        histogramData(data as readonly PhaseOneHistogramData[]),
      normalizeHistogramBar: (bar: unknown) =>
        histogramBar(bar as PhaseOneHistogramData),
    },
    secondarySeriesApiRuntime: {
      resolveDisplayData: (source: unknown) =>
        deps.resolveStudyDisplayData(source as StudySourceState),
      resetViewport: deps.resetViewport,
      render: deps.render,
      updateCanonical,
      buildHistogramVisuals: histogramVisuals,
      normalizeHistogramData: histogramData,
      normalizeHistogramBar: histogramBar,
    },
  };
}
