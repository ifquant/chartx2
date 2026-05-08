import { setChartType as setChartTypeUseCase } from "./chart-main-series-switch";
import {
  getMainSource as getMainSourceUseCase,
  getMainSourceOrThrow as getMainSourceOrThrowUseCase,
  refreshTradeLocation as refreshTradeLocationUseCase,
} from "./chart-main-source-runtime";
import {
  buildPrimaryPaneSeries as buildPrimaryPaneSeriesUseCase,
  getCompareStudyState as getCompareStudyStateUseCase,
  getMovingAverageStudyState as getMovingAverageStudyStateUseCase,
  getSecondarySeriesForPane as getSecondarySeriesForPaneUseCase,
  getSourceByApi as getSourceByApiUseCase,
  getStudySourcesForPane as getStudySourcesForPaneUseCase,
} from "./chart-source-accessors";
import {
  replaceMainHistogramLikeData as setPrimaryHistogramLikeDataUseCase,
  replaceMainSeriesData as setPrimaryDataUseCase,
  replaceStudyHistogramLikeData as setSecondaryHistogramLikeDataUseCase,
  replaceStudySeriesData as setSecondaryDataUseCase,
  updateMainHistogramLikeData as updatePrimaryHistogramLikeDataUseCase,
  updateMainSeriesData as updatePrimaryDataUseCase,
  updateStudyHistogramLikeData as updateSecondaryHistogramLikeDataUseCase,
  updateStudySeriesData as updateSecondaryDataUseCase,
} from "./chart-series-mutation";
import type {
  SecondarySeriesApiDepsBuilder,
  SecondarySeriesKind,
} from "./chart-secondary-series-factory";
import {
  addSecondarySeries as addSecondarySeriesUseCase,
  attachStudySeries as attachStudySeriesUseCase,
  createSecondarySeriesApiDeps as createSecondarySeriesApiDepsUseCase,
} from "./chart-secondary-series-factory";
import { syncStudyContextData as syncStudyContextDataUseCase } from "./chart-study-context";

type SourceKind = string;

type MainSourceRole = "main-series";
type StudySourceRole = "study";

type SeriesSourceLike = {
  kind: SourceKind;
};

type MainSourceLike<ChartType = string, MainApi = unknown, CanonicalBar = unknown, Visual = unknown> =
  SeriesSourceLike & {
    id: string;
    chartType: ChartType;
    api: MainApi;
    inputData: readonly CanonicalBar[];
    data: readonly CanonicalBar[];
    visuals: Map<number, Visual>;
  };

type StudySourceLike<CanonicalBar = unknown, Visual = unknown> = SeriesSourceLike & {
  role: StudySourceRole;
  inputData: readonly CanonicalBar[];
  data: readonly unknown[];
  visuals: Map<number, Visual>;
  studyKind: string;
  indicator?: {
    kind: string;
  };
};

export type ChartSourceOwnerDeps = {
  accessors: {
    mainSourceId(): string | null;
    getSourceByIdAndRole(id: string, role: MainSourceRole): unknown | undefined;
    getSourceByApiOrThrow(api: unknown, message: string): unknown;
    listSourcesByPaneAndRole(paneId: string, role: StudySourceRole): readonly unknown[];
    listSourcesByRole(role: StudySourceRole): readonly unknown[];
  };
  mainSeriesSwitch: {
    removeCurrent(api: unknown): boolean;
    clearPriceRangeOverride(): void;
    buildPreservedState(source: unknown): unknown;
    attachSeries(type: string, preservedState: unknown): unknown;
    render(): void;
    emitChartTypeChange(type: string): void;
  };
  primaryMutations: {
    rebuild(source: unknown): void;
    syncContext(source: unknown): void;
    resetViewport(): void;
    clearPriceRangeOverride(): void;
    render(): void;
    updateCanonical(existing: readonly unknown[], bar: unknown): readonly unknown[];
    buildHistogramVisuals(data: readonly unknown[]): Map<number, unknown>;
    normalizeHistogramData(data: readonly unknown[]): readonly unknown[];
    normalizeHistogramBar(bar: unknown): unknown;
  };
  studySources: {
    primaryPriceScale: unknown;
    getOrCreateSecondaryPriceScale(paneId: string): unknown;
    createSourceState(args: {
      paneId: string;
      kind: string;
      api: unknown;
      meta: { id: string; label: string };
      priceScale: unknown;
      priceScaleId: string;
      studyKind?: string;
      indicator?: unknown;
    }): unknown;
    registerSource(source: unknown): void;
    createMeta(kind: SecondarySeriesKind): { id: string; label: string };
  };
  secondaryMutations: {
    resolveDisplayData(source: unknown): readonly unknown[];
    resetViewport(): void;
    render(): void;
    updateCanonical(existing: readonly unknown[], bar: unknown): readonly unknown[];
    buildHistogramVisuals(data: readonly unknown[]): Map<number, unknown>;
    normalizeHistogramData(data: readonly unknown[]): readonly unknown[];
    normalizeHistogramBar(bar: unknown): unknown;
  };
  secondarySeriesApi: {
    assertSeriesActive(api: unknown): void;
    applySeriesFormatterOptions(seriesOptions: object, options: object): void;
    render(): void;
    setSecondaryData(api: unknown, data: readonly unknown[], kind: SecondarySeriesKind): void;
    updateSecondary(api: unknown, bar: unknown, kind: SecondarySeriesKind): void;
    setSecondaryHistogramLikeData(
      api: unknown,
      data: readonly unknown[],
      kind: "histogram" | "volume",
    ): void;
    updateSecondaryHistogramLike(
      api: unknown,
      bar: unknown,
      kind: "histogram" | "volume",
    ): void;
    normalizeLineData(data: readonly unknown[]): readonly unknown[];
    normalizeLineBar(bar: unknown): unknown;
    setMarkers(api: unknown, markers: readonly unknown[], kind: SecondarySeriesKind): void;
    createPriceLine(source: unknown, options?: unknown): unknown;
    removePriceLine(source: unknown, line: unknown): void;
    applyCompareOptions(state: unknown, options: unknown): void;
    getCompareOptions(state: unknown): unknown;
    applyMovingAverageStudyOptions(state: unknown, options: unknown): void;
    getMovingAverageStudyOptions(state: unknown): unknown;
    applyScriptedStudyOptions(state: unknown, options: unknown): void;
    getScriptedStudyOptions(state: unknown): unknown;
  };
  tradeLocation: {
    active(): unknown | null;
    setActive(next: unknown): void;
    setVisibleLogicalRange(range: { from: number; to: number }): void;
    setVisiblePriceRange(range: { minValue: number; maxValue: number }): void;
    render(): void;
  };
};

export function createChartSourceOwner(deps: ChartSourceOwnerDeps) {
  const getMainSource = () =>
    getMainSourceUseCase({
      mainSourceId: deps.accessors.mainSourceId,
      getSourceByIdAndRole: (id, role) =>
        deps.accessors.getSourceByIdAndRole(id, role) as MainSourceLike | undefined,
    });

  const getMainSourceOrThrow = () =>
    getMainSourceOrThrowUseCase({
      getMainSource,
    });

  const getStudySourcesForPane = (paneId: string) =>
    getStudySourcesForPaneUseCase(paneId, {
      listSourcesByPaneAndRole: (nextPaneId, role) =>
        deps.accessors.listSourcesByPaneAndRole(nextPaneId, role) as readonly StudySourceLike[],
    });

  const getSecondarySeriesForPane = (paneId: string) =>
    getSecondarySeriesForPaneUseCase(paneId, {
      getStudySourcesForPane,
    });

  const getSourceByApi = (api: unknown, kind?: SourceKind) =>
    getSourceByApiUseCase(api, {
      getSourceByApiOrThrow: (nextApi, message) =>
        deps.accessors.getSourceByApiOrThrow(nextApi, message) as SeriesSourceLike,
    }, kind);

  const getCompareStudyState = (api: unknown) =>
    getCompareStudyStateUseCase(api, {
      getSourceByApi: (nextApi, kind) => getSourceByApi(nextApi, kind) as StudySourceLike,
    });

  const getMovingAverageStudyState = (api: unknown) =>
    getMovingAverageStudyStateUseCase(api, {
      getSourceByApi: (nextApi, kind) => getSourceByApi(nextApi, kind) as StudySourceLike,
    });

  const attachStudySeries = (params: {
    paneId: string;
    kind: SecondarySeriesKind;
    api: unknown;
    meta: { id: string; label: string };
    studyKind?: string;
    indicator?: unknown;
  }) =>
    attachStudySeriesUseCase(
      params as never,
      {
        primaryPriceScale: deps.studySources.primaryPriceScale,
        getOrCreateSecondaryPriceScale: deps.studySources.getOrCreateSecondaryPriceScale,
        createSourceState: deps.studySources.createSourceState,
        registerSource: deps.studySources.registerSource,
      } as never,
    );

  const createSecondarySeriesApiDeps = <T>(
    build: (apiDeps: SecondarySeriesApiDepsBuilder) => T,
  ): T =>
    createSecondarySeriesApiDepsUseCase(build, {
      assertSeriesActive: deps.secondarySeriesApi.assertSeriesActive,
      getSource: (api, kind) => getSourceByApi(api, kind) as never,
      applySeriesFormatterOptions: deps.secondarySeriesApi.applySeriesFormatterOptions,
      render: deps.secondarySeriesApi.render,
      setSecondaryData: deps.secondarySeriesApi.setSecondaryData,
      updateSecondary: deps.secondarySeriesApi.updateSecondary,
      setSecondaryHistogramLikeData: deps.secondarySeriesApi.setSecondaryHistogramLikeData,
      updateSecondaryHistogramLike: deps.secondarySeriesApi.updateSecondaryHistogramLike,
      normalizeLineData: deps.secondarySeriesApi.normalizeLineData,
      normalizeLineBar: deps.secondarySeriesApi.normalizeLineBar,
      setMarkers: deps.secondarySeriesApi.setMarkers,
      createPriceLine: (api, kind, options) =>
        deps.secondarySeriesApi.createPriceLine(getSourceByApi(api, kind), options),
      removePriceLine: (api, kind, line) =>
        deps.secondarySeriesApi.removePriceLine(getSourceByApi(api, kind), line),
      applyCompareOptions: (api, options) =>
        deps.secondarySeriesApi.applyCompareOptions(getCompareStudyState(api), options),
      getCompareOptions: (api) =>
        deps.secondarySeriesApi.getCompareOptions(getCompareStudyState(api)),
      applyMovingAverageStudyOptions: (api, options) =>
        deps.secondarySeriesApi.applyMovingAverageStudyOptions(
          getMovingAverageStudyState(api),
          options,
        ),
      getMovingAverageStudyOptions: (api) =>
        deps.secondarySeriesApi.getMovingAverageStudyOptions(getMovingAverageStudyState(api)),
      applyScriptedStudyOptions: (api, options) =>
        deps.secondarySeriesApi.applyScriptedStudyOptions(getSourceByApi(api, "line"), options),
      getScriptedStudyOptions: (api) =>
        deps.secondarySeriesApi.getScriptedStudyOptions(getSourceByApi(api, "line")),
    });

  const createSecondarySeriesFactoryDeps = () => ({
    createMeta: deps.studySources.createMeta,
    createApiDeps: <T>(build: (apiDeps: SecondarySeriesApiDepsBuilder) => T) =>
      createSecondarySeriesApiDeps(build),
    attachStudySeries,
  });

  const addSecondarySeries = <Api>(params: {
    paneId: string;
    kind: SecondarySeriesKind;
    studyKind?: string;
    indicator?: unknown;
    createApi(apiDeps: SecondarySeriesApiDepsBuilder): Api;
  }): Api =>
    addSecondarySeriesUseCase(
      params as never,
      createSecondarySeriesFactoryDeps() as never,
    ) as Api;

  const addLineStudySeries = <Api>(
    paneId: string,
    studyKind: string,
    params: {
      indicator?: unknown;
      createApi(apiDeps: SecondarySeriesApiDepsBuilder): Api;
    },
  ): Api =>
    addSecondarySeries({
      paneId,
      kind: "line",
      studyKind,
      indicator: params.indicator,
      createApi: params.createApi,
    });

  return {
    setChartType(nextType: string) {
      return setChartTypeUseCase(getMainSourceOrThrow(), nextType, {
        currentType: (source: any) => source.chartType,
        currentApi: (source: any) => source.api,
        removeCurrent: deps.mainSeriesSwitch.removeCurrent,
        clearPriceRangeOverride: deps.mainSeriesSwitch.clearPriceRangeOverride,
        buildPreservedState: deps.mainSeriesSwitch.buildPreservedState,
        attachSeries: deps.mainSeriesSwitch.attachSeries,
        render: deps.mainSeriesSwitch.render,
        emitChartTypeChange: deps.mainSeriesSwitch.emitChartTypeChange,
      });
    },

    setPrimaryData(data: readonly unknown[]) {
      setPrimaryDataUseCase(getMainSourceOrThrow(), data, {
        rebuild: deps.primaryMutations.rebuild,
        syncContext: deps.primaryMutations.syncContext,
        resetViewport: deps.primaryMutations.resetViewport,
        render: deps.primaryMutations.render,
      });
    },

    updatePrimaryData(bar: unknown) {
      updatePrimaryDataUseCase(getMainSourceOrThrow(), bar, {
        updateCanonical: deps.primaryMutations.updateCanonical,
        rebuild: deps.primaryMutations.rebuild,
        syncContext: deps.primaryMutations.syncContext,
        clearPriceRangeOverride: deps.primaryMutations.clearPriceRangeOverride,
        render: deps.primaryMutations.render,
      });
    },

    setPrimaryHistogramLikeData(data: readonly unknown[]) {
      setPrimaryHistogramLikeDataUseCase(getMainSourceOrThrow() as never, data as never, {
        buildVisuals: deps.primaryMutations.buildHistogramVisuals,
        normalizeData: deps.primaryMutations.normalizeHistogramData,
        replaceMainSeriesData: (source, normalizedData) =>
          setPrimaryDataUseCase(source as never, normalizedData as never, {
            rebuild: deps.primaryMutations.rebuild,
            syncContext: deps.primaryMutations.syncContext,
            resetViewport: deps.primaryMutations.resetViewport,
            render: deps.primaryMutations.render,
          }),
      });
    },

    updatePrimaryHistogramLikeData(bar: unknown) {
      updatePrimaryHistogramLikeDataUseCase(getMainSourceOrThrow() as never, bar as never, {
        normalizeBar: (nextBar) => deps.primaryMutations.normalizeHistogramBar(nextBar) as never,
        updateMainSeriesData: (source, normalizedBar) =>
          updatePrimaryDataUseCase(source as never, normalizedBar as never, {
            updateCanonical: deps.primaryMutations.updateCanonical,
            rebuild: deps.primaryMutations.rebuild,
            syncContext: deps.primaryMutations.syncContext,
            clearPriceRangeOverride: deps.primaryMutations.clearPriceRangeOverride,
            render: deps.primaryMutations.render,
          }),
      });
    },

    setSecondaryData(api: unknown, data: readonly unknown[], kind: SecondarySeriesKind) {
      setSecondaryDataUseCase(getSourceByApi(api, kind) as StudySourceLike, data, {
        resolveDisplayData: deps.secondaryMutations.resolveDisplayData,
        resetViewport: deps.secondaryMutations.resetViewport,
        render: deps.secondaryMutations.render,
      });
    },

    updateSecondaryData(api: unknown, bar: unknown, kind: SecondarySeriesKind) {
      updateSecondaryDataUseCase(getSourceByApi(api, kind) as StudySourceLike, bar, {
        updateCanonical: deps.secondaryMutations.updateCanonical,
        resolveDisplayData: deps.secondaryMutations.resolveDisplayData,
        render: deps.secondaryMutations.render,
      });
    },

    setSecondaryHistogramLikeData(
      api: unknown,
      data: readonly unknown[],
      kind: "histogram" | "volume",
    ) {
      setSecondaryHistogramLikeDataUseCase(getSourceByApi(api, kind) as never, data as never, {
        buildVisuals: deps.secondaryMutations.buildHistogramVisuals,
        normalizeData: deps.secondaryMutations.normalizeHistogramData,
        replaceStudySeriesData: (source, normalizedData) =>
          setSecondaryDataUseCase(source as never, normalizedData as never, {
            resolveDisplayData: deps.secondaryMutations.resolveDisplayData,
            resetViewport: deps.secondaryMutations.resetViewport,
            render: deps.secondaryMutations.render,
          }),
        render: deps.secondaryMutations.render,
      });
    },

    updateSecondaryHistogramLikeData(
      api: unknown,
      bar: unknown,
      kind: "histogram" | "volume",
    ) {
      updateSecondaryHistogramLikeDataUseCase(getSourceByApi(api, kind) as never, bar as never, {
        normalizeBar: (nextBar) => deps.secondaryMutations.normalizeHistogramBar(nextBar) as never,
        updateStudySeriesData: (source, normalizedBar) =>
          updateSecondaryDataUseCase(source as never, normalizedBar as never, {
            updateCanonical: deps.secondaryMutations.updateCanonical,
            resolveDisplayData: deps.secondaryMutations.resolveDisplayData,
            render: deps.secondaryMutations.render,
          }),
      });
    },

    attachStudySeries,
    createSecondarySeriesApiDeps,
    createSecondarySeriesFactoryDeps,
    addSecondarySeries,
    addLineStudySeries,
    getMainSource,
    getMainSourceOrThrow,
    getSourceByApi,
    getStudySourcesForPane,
    getSecondarySeriesForPane,
    buildPrimaryPaneSeries(mainSource = getMainSource()) {
      return buildPrimaryPaneSeriesUseCase(mainSource, {
        getStudySourcesForPane,
      });
    },
    syncStudyContextData() {
      syncStudyContextDataUseCase(
        deps.accessors.listSourcesByRole("study") as never,
        {
          resolveDisplayData: deps.secondaryMutations.resolveDisplayData,
        } as never,
      );
    },
    refreshTradeLocation() {
      refreshTradeLocationUseCase(deps.tradeLocation.active() as never, {
        getMainSource,
        setActiveTradeLocation: deps.tradeLocation.setActive,
        setVisibleLogicalRange: deps.tradeLocation.setVisibleLogicalRange,
        setVisiblePriceRange: deps.tradeLocation.setVisiblePriceRange,
        render: deps.tradeLocation.render,
      } as never);
    },
  };
}
