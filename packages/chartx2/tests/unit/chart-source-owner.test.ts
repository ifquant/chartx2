import { describe, expect, it, vi } from "vitest";

import { createChartSourceOwner } from "../../src/lib/internal/views/chart-source-owner";

function createOwnerFixture() {
  const mainApi = { id: "main-api" };
  const compareApi = { id: "compare-api" };
  const movingAverageApi = { id: "moving-average-api" };
  const volumeApi = { id: "volume-api" };

  const mainSource = {
    id: "main-1",
    kind: "candlestick",
    chartType: "candlestick",
    api: mainApi,
    role: "main-series" as const,
    inputData: [{ time: 1, close: 10 }],
    data: [{ time: 1, close: 10 }],
    visuals: new Map<number, { isUp: boolean }>([[1, { isUp: true }]]),
  };

  const compareStudy = {
    id: "study-compare",
    paneId: "primary",
    kind: "line" as const,
    role: "study" as const,
    studyKind: "compare",
    inputData: [{ time: 1, close: 11 }],
    data: [{ time: 1, close: 11 }],
    visuals: new Map<number, { isUp: boolean }>([[1, { isUp: true }]]),
    api: compareApi,
  };

  const movingAverageStudy = {
    id: "study-ma",
    paneId: "pane-2",
    kind: "line" as const,
    role: "study" as const,
    studyKind: "indicator",
    indicator: { kind: "moving-average" },
    inputData: [{ time: 1, close: 12 }],
    data: [{ time: 1, close: 12 }],
    visuals: new Map<number, { isUp: boolean }>([[1, { isUp: true }]]),
    api: movingAverageApi,
  };

  const volumeStudy = {
    id: "study-volume",
    paneId: "pane-3",
    kind: "volume" as const,
    role: "study" as const,
    studyKind: "series",
    inputData: [{ time: 1, close: 13 }],
    data: [{ time: 1, close: 13 }],
    visuals: new Map<number, { isUp: boolean }>([[1, { isUp: true }]]),
    api: volumeApi,
  };

  const sourcesByApi = new Map<unknown, typeof mainSource | typeof compareStudy | typeof movingAverageStudy | typeof volumeStudy>([
    [mainApi, mainSource],
    [compareApi, compareStudy],
    [movingAverageApi, movingAverageStudy],
    [volumeApi, volumeStudy],
  ]);

  let currentMainSourceId: string | null = mainSource.id;
  let activeTradeLocation: any = null;

  const buildPreservedState = vi.fn((source) => ({
    id: source.id,
    chartType: source.chartType,
  }));
  const attachSeries = vi.fn((type) => ({ id: `attached-${type}` }));
  const removeCurrent = vi.fn(() => true);
  const renderMainSwitch = vi.fn();
  const emitChartTypeChange = vi.fn();

  const rebuildPrimary = vi.fn((source) => {
    source.data = [...source.inputData];
  });
  const syncPrimaryContext = vi.fn();
  const resetPrimaryViewport = vi.fn();
  const clearPrimaryPriceRangeOverride = vi.fn();
  const renderPrimary = vi.fn();
  const updateCanonical = vi.fn((existing: readonly unknown[], bar: unknown) => [...existing, bar]);

  const resolveDisplayData = vi.fn((source) =>
    source.inputData.map((bar: any) => ({ ...bar, resolved: true }))
  );
  const resetSecondaryViewport = vi.fn();
  const renderSecondary = vi.fn();

  const createPriceLine = vi.fn((source, options) => ({ sourceId: source.id, options }));
  const removePriceLine = vi.fn();
  const applyCompareOptions = vi.fn();
  const getCompareOptions = vi.fn(() => ({ baseline: "compare" }));
  const applyMovingAverageStudyOptions = vi.fn();
  const getMovingAverageStudyOptions = vi.fn(() => ({ length: 20 }));
  const applyScriptedStudyOptions = vi.fn();
  const getScriptedStudyOptions = vi.fn(() => ({ scriptId: "script-1" }));
  const registerSource = vi.fn();

  const setTradeLocationActive = vi.fn((next) => {
    activeTradeLocation = next;
  });
  const setVisibleLogicalRange = vi.fn();
  const setVisiblePriceRange = vi.fn();
  const renderTradeLocation = vi.fn();

  const owner = createChartSourceOwner({
    accessors: {
      mainSourceId: () => currentMainSourceId,
      getSourceByIdAndRole: (id, role) =>
        role === "main-series" && id === mainSource.id ? mainSource : undefined,
      getSourceByApiOrThrow: (api, message) => {
        const source = sourcesByApi.get(api);
        if (!source) {
          throw new Error(message);
        }
        return source;
      },
      listSourcesByPaneAndRole: (paneId, role) =>
        role !== "study"
          ? []
          : [compareStudy, movingAverageStudy, volumeStudy].filter((source) => source.paneId === paneId),
      listSourcesByRole: (role) =>
        role === "study" ? [compareStudy, movingAverageStudy, volumeStudy] : [],
    },
    mainSeriesSwitch: {
      removeCurrent,
      clearPriceRangeOverride: clearPrimaryPriceRangeOverride,
      buildPreservedState,
      attachSeries,
      render: renderMainSwitch,
      emitChartTypeChange,
    },
    primaryMutations: {
      rebuild: rebuildPrimary,
      syncContext: syncPrimaryContext,
      resetViewport: resetPrimaryViewport,
      clearPriceRangeOverride: clearPrimaryPriceRangeOverride,
      render: renderPrimary,
      updateCanonical,
      buildHistogramVisuals: (data) =>
        new Map(data.map((row: any) => [row.time, { color: row.color, isUp: true }])),
      normalizeHistogramData: (data) =>
        data.map((row: any) => ({ time: row.time, close: row.value })),
      normalizeHistogramBar: (bar: any) => ({ time: bar.time, close: bar.value }),
    },
    studySources: {
      primaryPriceScale: { id: "primary-scale" },
      getOrCreateSecondaryPriceScale: (paneId) => ({ id: `${paneId}-scale` }),
      createSourceState: (args) => args,
      registerSource,
      createMeta: (kind) => ({ id: `${kind}-meta`, label: `${kind} label` }),
    },
    secondaryMutations: {
      resolveDisplayData,
      resetViewport: resetSecondaryViewport,
      render: renderSecondary,
      updateCanonical,
      buildHistogramVisuals: (data) =>
        new Map(data.map((row: any) => [row.time, { color: row.color, isUp: true }])),
      normalizeHistogramData: (data) =>
        data.map((row: any) => ({ time: row.time, close: row.value })),
      normalizeHistogramBar: (bar: any) => ({ time: bar.time, close: bar.value }),
    },
    secondarySeriesApi: {
      assertSeriesActive: vi.fn(),
      applySeriesFormatterOptions: vi.fn(),
      render: vi.fn(),
      setSecondaryData: vi.fn(),
      updateSecondary: vi.fn(),
      setSecondaryHistogramLikeData: vi.fn(),
      updateSecondaryHistogramLike: vi.fn(),
      normalizeLineData: (data) => data,
      normalizeLineBar: (bar) => bar,
      setMarkers: vi.fn(),
      createPriceLine,
      removePriceLine,
      applyCompareOptions,
      getCompareOptions,
      applyMovingAverageStudyOptions,
      getMovingAverageStudyOptions,
      applyScriptedStudyOptions,
      getScriptedStudyOptions,
    },
    tradeLocation: {
      active: () => activeTradeLocation,
      setActive: setTradeLocationActive,
      setVisibleLogicalRange,
      setVisiblePriceRange,
      render: renderTradeLocation,
    },
  });

  return {
    owner,
    mainApi,
    compareApi,
    movingAverageApi,
    volumeApi,
    mainSource,
    compareStudy,
    movingAverageStudy,
    volumeStudy,
    calls: {
      buildPreservedState,
      attachSeries,
      removeCurrent,
      renderMainSwitch,
      emitChartTypeChange,
      rebuildPrimary,
      syncPrimaryContext,
      resetPrimaryViewport,
      clearPrimaryPriceRangeOverride,
      renderPrimary,
      updateCanonical,
      resolveDisplayData,
      resetSecondaryViewport,
      renderSecondary,
      createPriceLine,
      removePriceLine,
      applyCompareOptions,
      getCompareOptions,
      applyMovingAverageStudyOptions,
      getMovingAverageStudyOptions,
      applyScriptedStudyOptions,
      getScriptedStudyOptions,
      registerSource,
      setTradeLocationActive,
      setVisibleLogicalRange,
      setVisiblePriceRange,
      renderTradeLocation,
    },
    setActiveTradeLocation(next: any) {
      activeTradeLocation = next;
    },
    clearMainSource() {
      currentMainSourceId = null;
    },
  };
}

describe("chart source owner", () => {
  it("reads main/study sources and syncs pane-local study data through one owner surface", () => {
    const fixture = createOwnerFixture();

    expect(fixture.owner.getMainSource()).toBe(fixture.mainSource);
    expect(fixture.owner.getMainSourceOrThrow()).toBe(fixture.mainSource);
    expect(fixture.owner.getSourceByApi(fixture.compareApi, "line")).toBe(fixture.compareStudy);
    expect(fixture.owner.getStudySourcesForPane("primary")).toEqual([fixture.compareStudy]);
    expect(fixture.owner.getSecondarySeriesForPane("pane-2")).toEqual([fixture.movingAverageStudy]);
    expect(fixture.owner.buildPrimaryPaneSeries()).toEqual([
      fixture.mainSource,
      fixture.compareStudy,
    ]);

    fixture.owner.syncStudyContextData();

    expect(fixture.calls.resolveDisplayData).toHaveBeenCalledTimes(3);
    expect(fixture.compareStudy.data).toEqual([{ time: 1, close: 11, resolved: true }]);
    expect(fixture.movingAverageStudy.data).toEqual([{ time: 1, close: 12, resolved: true }]);
  });

  it("orchestrates chart-type switches and primary data mutations", () => {
    const fixture = createOwnerFixture();

    const nextApi = fixture.owner.setChartType("line");
    expect(nextApi).toEqual({ id: "attached-line" });
    expect(fixture.calls.removeCurrent).toHaveBeenCalledWith(fixture.mainApi);
    expect(fixture.calls.buildPreservedState).toHaveBeenCalledWith(fixture.mainSource);
    expect(fixture.calls.attachSeries).toHaveBeenCalledWith("line", {
      id: "main-1",
      chartType: "candlestick",
    });
    expect(fixture.calls.renderMainSwitch).toHaveBeenCalledTimes(1);
    expect(fixture.calls.emitChartTypeChange).toHaveBeenCalledWith("line");

    fixture.owner.setPrimaryData([{ time: 2, close: 20 }]);
    expect(fixture.mainSource.inputData).toEqual([{ time: 2, close: 20 }]);
    expect(fixture.mainSource.visuals.size).toBe(0);
    expect(fixture.calls.rebuildPrimary).toHaveBeenCalledTimes(1);
    expect(fixture.calls.syncPrimaryContext).toHaveBeenCalledWith(fixture.mainSource);
    expect(fixture.calls.resetPrimaryViewport).toHaveBeenCalledTimes(1);
    expect(fixture.calls.renderPrimary).toHaveBeenCalledTimes(1);

    fixture.owner.updatePrimaryData({ time: 3, close: 30 });
    expect(fixture.calls.updateCanonical).toHaveBeenCalledWith(
      [{ time: 2, close: 20 }],
      { time: 3, close: 30 },
    );
    expect(fixture.mainSource.inputData).toEqual([
      { time: 2, close: 20 },
      { time: 3, close: 30 },
    ]);
    expect(fixture.calls.clearPrimaryPriceRangeOverride).toHaveBeenCalledTimes(2);
  });

  it("composes secondary api deps and study attachment without rewriting leaf behavior", () => {
    const fixture = createOwnerFixture();
    const factoryDeps = fixture.owner.createSecondarySeriesFactoryDeps();

    expect(factoryDeps.createMeta("line")).toEqual({
      id: "line-meta",
      label: "line label",
    });

    const captured = factoryDeps.createApiDeps((apiDeps) => {
      apiDeps.createPriceLine(fixture.compareApi, "line", { price: 123 });
      apiDeps.removePriceLine(fixture.compareApi, "line", "line-1");
      apiDeps.applyCompareOptions(fixture.compareApi, { mode: "compare" });
      apiDeps.getCompareOptions(fixture.compareApi);
      apiDeps.applyMovingAverageStudyOptions(fixture.movingAverageApi, { length: 10 });
      apiDeps.getMovingAverageStudyOptions(fixture.movingAverageApi);
      apiDeps.applyScriptedStudyOptions(fixture.compareApi, { scriptId: "script-1" });
      apiDeps.getScriptedStudyOptions(fixture.compareApi);
      return apiDeps;
    });

    expect(captured.getSource(fixture.compareApi, "line")).toBe(fixture.compareStudy);
    expect(fixture.calls.createPriceLine).toHaveBeenCalledWith(fixture.compareStudy, {
      price: 123,
    });
    expect(fixture.calls.removePriceLine).toHaveBeenCalledWith(fixture.compareStudy, "line-1");
    expect(fixture.calls.applyCompareOptions).toHaveBeenCalledWith(fixture.compareStudy, {
      mode: "compare",
    });
    expect(fixture.calls.getCompareOptions).toHaveBeenCalledWith(fixture.compareStudy);
    expect(fixture.calls.applyMovingAverageStudyOptions).toHaveBeenCalledWith(
      fixture.movingAverageStudy,
      { length: 10 },
    );
    expect(fixture.calls.getMovingAverageStudyOptions).toHaveBeenCalledWith(
      fixture.movingAverageStudy,
    );
    expect(fixture.calls.applyScriptedStudyOptions).toHaveBeenCalledWith(
      fixture.compareStudy,
      { scriptId: "script-1" },
    );
    expect(fixture.calls.getScriptedStudyOptions).toHaveBeenCalledWith(fixture.compareStudy);

    factoryDeps.attachStudySeries({
      paneId: "pane-9",
      kind: "line",
      api: { id: "attached-study" },
      meta: { id: "study-9", label: "Study 9" },
      studyKind: "series",
    });

    expect(fixture.calls.registerSource).toHaveBeenCalledWith({
      paneId: "pane-9",
      kind: "line",
      api: { id: "attached-study" },
      meta: { id: "study-9", label: "Study 9" },
      priceScale: { id: "pane-9-scale" },
      priceScaleId: "pane-9-right",
      studyKind: "series",
      indicator: undefined,
    });

    const api = fixture.owner.addSecondarySeries({
      paneId: "pane-10",
      kind: "line",
      studyKind: "compare",
      createApi: () => ({ id: "secondary-api" }),
    });

    expect(api).toEqual({ id: "secondary-api" });
    expect(fixture.calls.registerSource).toHaveBeenLastCalledWith({
      paneId: "pane-10",
      kind: "line",
      api: { id: "secondary-api" },
      meta: { id: "line-meta", label: "line label" },
      priceScale: { id: "pane-10-scale" },
      priceScaleId: "pane-10-right",
      studyKind: "compare",
      indicator: undefined,
    });

    const lineApi = fixture.owner.addLineStudySeries("pane-11", "indicator", {
      indicator: { kind: "moving-average", length: 3 },
      createApi: () => ({ id: "line-study-api" }),
    });

    expect(lineApi).toEqual({ id: "line-study-api" });
    expect(fixture.calls.registerSource).toHaveBeenLastCalledWith({
      paneId: "pane-11",
      kind: "line",
      api: { id: "line-study-api" },
      meta: { id: "line-meta", label: "line label" },
      priceScale: { id: "pane-11-scale" },
      priceScaleId: "pane-11-right",
      studyKind: "indicator",
      indicator: { kind: "moving-average", length: 3 },
    });
  });

  it("orchestrates secondary mutations and refreshes trade location from owner state", () => {
    const fixture = createOwnerFixture();

    fixture.owner.setSecondaryData(fixture.compareApi, [{ time: 2, close: 22 }], "line");
    expect(fixture.compareStudy.inputData).toEqual([{ time: 2, close: 22 }]);
    expect(fixture.compareStudy.data).toEqual([{ time: 2, close: 22, resolved: true }]);
    expect(fixture.compareStudy.visuals.size).toBe(0);
    expect(fixture.calls.resetSecondaryViewport).toHaveBeenCalledTimes(1);
    expect(fixture.calls.renderSecondary).toHaveBeenCalledTimes(1);

    fixture.owner.updateSecondaryHistogramLikeData(
      fixture.volumeApi,
      { time: 3, value: 33, color: "green" },
      "volume",
    );
    expect(fixture.calls.updateCanonical).toHaveBeenCalledWith(
      [{ time: 1, close: 13 }],
      { time: 3, close: 33 },
    );
    expect(fixture.volumeStudy.visuals.get(3)).toEqual({ color: "green", isUp: true });

    fixture.clearMainSource();
    fixture.setActiveTradeLocation({
      request: { kind: "trade" },
      options: { fitRange: false },
      state: { id: "stale" },
    });
    fixture.owner.refreshTradeLocation();

    expect(fixture.calls.setTradeLocationActive).toHaveBeenCalledWith({
      request: { kind: "trade" },
      options: { fitRange: false },
      state: null,
    });
    expect(fixture.calls.renderTradeLocation).toHaveBeenCalledTimes(1);
    expect(fixture.calls.setVisibleLogicalRange).not.toHaveBeenCalled();
    expect(fixture.calls.setVisiblePriceRange).not.toHaveBeenCalled();
  });
});
