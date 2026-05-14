import {
  PriceRangeImpl,
  type PhaseOneMainChartType,
  type PhaseOneMainStyleSchemaId,
  type PhaseOneTradeLocationRequest,
  type PhaseOneTradeLocationState,
  type PhaseOneTradeOverlayOptions,
  type PaneModelState,
  type ChartBarSequence,
} from "../model";
import { createChartPrimarySeriesOwner } from "./chart-primary-series-owner";
import { createChartSeriesCommandOwner } from "./chart-series-command-owner";
import { createChartMainSeriesStateOwner } from "./chart-main-series-state-owner";
import { createChartTradeLocationOwner } from "./chart-trade-location-owner";
import { createChartInteractionShellOwner } from "./chart-interaction-shell-owner";
import { createChartHandlerRegistry } from "./chart-handler-registry";
import { createChartEventSubscriptionOwner } from "./chart-event-subscription-owner";
import {
  measureLayout,
  resolveBarSpacing,
} from "./chart-layout-geometry";
import {
  resolveDrawingMagnetOptions as resolveDrawingMagnetOptionsUseCase,
} from "./chart-drawing-snap";
import {
  resolveTrendLineDefaults as resolveTrendLineDefaultsUseCase,
} from "./chart-drawing-state";
import { createChartScaleOwner } from "./chart-scale-owner";
import { createChartShellOwner } from "./chart-shell-owner";
import { createPriceLineManager } from "./chart-price-line-management";
import { createChartSeriesBuildOwner } from "./chart-series-build-owner";
import {
  createMainBarSequenceFromSource as createMainBarSequenceFromSourceUseCase,
} from "./chart-main-source-runtime";
import { createChartSourceOwner } from "./chart-source-owner";
import { createChartStudyContextOwner } from "./chart-study-context-owner";
import { createChartPaneOwner } from "./chart-pane-owner";
import { createChartDrawingOwner } from "./chart-drawing-owner";
import { createChartSecondarySeriesApiOwner } from "./chart-secondary-series-api-owner";
import { createChartSourceMutationOwner } from "./chart-source-mutation-owner";
import { createChartStudySourceOwner } from "./chart-study-source-owner";
import { createChartMainSeriesSwitchOwner } from "./chart-main-series-switch-owner";
import { createChartViewState } from "./chart-view-state";
import { createChartDrawingInteractionOwner } from "./chart-drawing-interaction-owner";
import { createChartRenderCoordinator } from "./chart-render-coordinator";
import { createChartRenderInputOwner } from "./chart-render-input-owner";
import { createChartRenderCallbackOwner } from "./chart-render-callback-owner";
import { createChartRenderInvalidation } from "./chart-render-invalidation";
import { createChartStateShellOwner } from "./chart-state-shell-owner";
import { createChartStateRestoreShellOwner } from "./chart-state-restore-shell-owner";
import { createChartRuntimeQueryOwner } from "./chart-runtime-query-owner";
import { applyMainSeriesBuilderData } from "./chart-series-data-transforms";
import { formatSeriesKindLabel } from "./chart-series-labels";
import { assertCanvasElement } from "./chart-dom-guards";
import { createChartAdapterStateOwner } from "./chart-adapter-state-owner";
import { createChartPublicShellOwner } from "./chart-public-shell-owner";
import { createChartRuntimeContainer } from "./chart-runtime-container";
import type { ChartHarnessPublicLike } from "./chart-public-api";
import {
  BAR_SPACING_BOUNDS,
  CHART_BACKGROUND,
  DEFAULT_LAYOUT,
  DEFAULT_RIGHT_OFFSET,
  DRAWING_HIT_TOLERANCE,
  LINE_COLOR,
  MAX_BAR_SPACING,
  MIN_BAR_SPACING,
  PANE_DIVIDER_HIT_SLOP,
  createDefaultAreaOptions,
  createDefaultBarOptions,
  createDefaultBaselineOptions,
  createDefaultCandlestickOptions,
  createDefaultCompareOptions,
  createDefaultCrosshairOptions,
  createDefaultDrawingOptions,
  createDefaultHistogramOptions,
  createDefaultLayoutOptions,
  createDefaultLineOptions,
  createDefaultMovingAverageOptions,
  createDefaultPriceLineOptions,
  createDefaultVolumeOptions,
} from "./chart-default-options";
import type {
  ChartDrawingApi,
  ChartDrawingDescriptor,
  ChartDrawingKind,
  ChartSeriesApi,
  ChartSeriesKind,
  MainSeriesSourceState,
  RequiredDrawingOptions,
  ResolvedSeriesTarget,
  SeriesSourceState,
  StudySourceState,
} from "./chart-runtime-types";
import { DRAWING_PROPERTY_SCHEMAS } from "./chart-drawing-property-schema";
import type {
  PhaseOneAreaSeriesApi,
  PhaseOneAreaSeriesOptions,
  PhaseOneBarSeriesApi,
  PhaseOneBarSeriesOptions,
  PhaseOneBaselineSeriesApi,
  PhaseOneBaselineSeriesOptions,
  PhaseOneCandlestickSeriesApi,
  PhaseOneCandlestickSeriesOptions,
  PhaseOneChartOptions,
  PhaseOneCompareSeriesApi,
  PhaseOneCompareSeriesOptions,
  PhaseOneHistogramSeriesApi,
  PhaseOneHistogramSeriesOptions,
  PhaseOneHorizontalLineDrawingApi,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOneLineSeriesApi,
  PhaseOneLineSeriesOptions,
  PhaseOneMainSeriesApi,
  PhaseOneMainSeriesStateSnapshot,
  PhaseOneMovingAverageStudyApi,
  PhaseOneMovingAverageStudyOptions,
  PhaseOneOverlaySeriesApi,
  PhaseOnePaneApi,
  PhaseOnePaneEventHandler,
  PhaseOnePaneOptions,
  PhaseOnePriceLineOptions,
  PhaseOneSelectedDrawing,
  PhaseOneSeriesTarget,
  PhaseOneTrendLineDrawingApi,
  PhaseOneTrendLineDrawingOptions,
  PhaseOneVolumeSeriesApi,
  PhaseOneVolumeSeriesOptions,
  PhaseOneVolumeSeriesTarget,
} from "./chart-api-types";

type PanePoint = {
  x: number;
  y: number;
};

export class PhaseOneChartHarness {
  private readonly handlerRegistry = createChartHandlerRegistry();
  private readonly eventSubscriptionOwner = createChartEventSubscriptionOwner(this.handlerRegistry);
  private readonly runtime = createChartRuntimeContainer();
  private readonly adapterState = createChartAdapterStateOwner<PriceRangeImpl>();
  private readonly chartOptions: Required<NonNullable<PhaseOneChartOptions["layout"]>> = createDefaultLayoutOptions();
  private readonly crosshairOptions: Required<NonNullable<PhaseOneChartOptions["crosshair"]>> =
    createDefaultCrosshairOptions();
  private readonly drawingOptions: RequiredDrawingOptions = createDefaultDrawingOptions();
  private readonly candlestickOptions: Required<PhaseOneCandlestickSeriesOptions> = createDefaultCandlestickOptions();
  private readonly barOptions: Required<PhaseOneBarSeriesOptions> = createDefaultBarOptions();
  private readonly lineOptions: Required<PhaseOneLineSeriesOptions> = createDefaultLineOptions();
  private readonly defaultCompareOptions: Required<PhaseOneCompareSeriesOptions> = createDefaultCompareOptions();
  private readonly defaultMovingAverageOptions: Required<PhaseOneMovingAverageStudyOptions> =
    createDefaultMovingAverageOptions();
  private readonly areaOptions: Required<PhaseOneAreaSeriesOptions> = createDefaultAreaOptions();
  private readonly baselineOptions: Required<PhaseOneBaselineSeriesOptions> = createDefaultBaselineOptions();
  private readonly histogramOptions: Required<PhaseOneHistogramSeriesOptions> = createDefaultHistogramOptions();
  private readonly volumeOptions: Required<PhaseOneVolumeSeriesOptions> = createDefaultVolumeOptions();
  private readonly defaultPriceLineOptions: Required<PhaseOnePriceLineOptions> = createDefaultPriceLineOptions();
  private readonly renderInvalidation = createChartRenderInvalidation({
    getCanvas: () => this.adapterState.canvas(),
    renderCanvas: (canvas) => {
      this.render(canvas);
    },
  });

  private layoutGeometry() {
    return {
      ...DEFAULT_LAYOUT,
      ...this.chartOptions.plotInsets,
    };
  }
  private paneGap(): number {
    return this.chartOptions.paneGap;
  }
  private readonly priceLineManager = createPriceLineManager({
    defaultOptions: this.defaultPriceLineOptions,
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly seriesBuildOwner = createChartSeriesBuildOwner({
    defaults: {
      candlestickOptions: this.candlestickOptions,
      barOptions: this.barOptions,
      lineOptions: this.lineOptions,
      areaOptions: this.areaOptions,
      baselineOptions: this.baselineOptions,
      histogramOptions: this.histogramOptions,
      volumeOptions: this.volumeOptions,
    },
  });
  private readonly studyContextOwner = createChartStudyContextOwner<StudySourceState>({
    getContextSnapshot: () => this.runtime.contextSnapshot(),
    clearMainSource: () => this.runtime.clearMainSource(),
    bindMainSource: (mainSourceId, chartType, barSequence) =>
      this.runtime.bindMainSource(mainSourceId, chartType, barSequence),
    listStudySources: () => this.runtime.listSourcesByRole("study") as StudySourceState[],
    refreshTradeLocation: () => this.sourceOwner.refreshTradeLocation(),
  });
  private readonly viewState = createChartViewState<PanePoint, ResizeObserver>();
  private readonly tradeLocationOwner = createChartTradeLocationOwner<
    PhaseOneTradeLocationRequest,
    PhaseOneTradeOverlayOptions,
    PhaseOneTradeLocationState,
    MainSeriesSourceState
  >({
    ensureMainSource: () => {
      this.sourceOwner.getMainSourceOrThrow();
    },
    getMainSource: () => this.sourceOwner.getMainSource() as MainSeriesSourceState | null,
    setVisibleLogicalRange: (range) => this.scaleOwner.timeScaleApi().setVisibleLogicalRange(range),
    setVisiblePriceRange: (range) => this.scaleOwner.priceScaleApi().setVisibleRange(range),
    resetPrimaryPriceRangeOverride: () => {
      this.adapterState.setPrimaryPriceRangeOverride(null);
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly sourceMutationOwner = createChartSourceMutationOwner({
    syncMainSource: (source) => this.studyContextOwner.syncMainSource(source as MainSeriesSourceState),
    resolveStudyDisplayData: (source) => this.studyContextOwner.resolveDisplayData(source as StudySourceState),
    resetViewport: () => {
      this.adapterState.resetViewport(DEFAULT_RIGHT_OFFSET);
    },
    clearPrimaryPriceRangeOverride: () => {
      this.adapterState.setPrimaryPriceRangeOverride(null);
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly studySourceOwner = createChartStudySourceOwner<StudySourceState>({
    getPrimaryPriceScale: () => this.runtime.primaryPriceScale(),
    getOrCreateSecondaryPriceScale: (paneId) => this.runtime.getOrCreateSecondaryScale(paneId),
    createMeta: (kind) => this.seriesBuildOwner.createMeta(kind),
    createOptions: (kind) => this.seriesBuildOwner.createOptions(kind),
    registerSource: (source) => {
      this.runtime.registerSource(source);
    },
    defaultCompareOptions: this.defaultCompareOptions,
  });
  private readonly mainSeriesSwitchOwner = createChartMainSeriesSwitchOwner<ChartSeriesApi>({
    removeCurrent: (api) => this.runtime.removeSourceByApi(api) !== undefined,
    clearPriceRangeOverride: () => {
      this.adapterState.setPrimaryPriceRangeOverride(null);
    },
    attachSeries: (type, preserved) => this.primarySeriesOwner.attach(type, preserved as never),
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
    emitChartTypeChange: (type) => {
      this.handlerRegistry.emitChartTypeChange(type);
    },
  });
  private readonly sourceOwner = createChartSourceOwner({
    accessors: {
      mainSourceId: () => this.runtime.mainSourceId(),
      getSourceByIdAndRole: (id, role) => this.runtime.getSourceByIdAndRole(id, role),
      getSourceByApiOrThrow: (api, message) => this.runtime.getSourceByApiOrThrow(api as ChartSeriesApi, message),
      listSourcesByPaneAndRole: (paneId, role) => this.runtime.listSourcesByPaneAndRole(paneId, role),
      listSourcesByRole: (role) => this.runtime.listSourcesByRole(role),
    },
    mainSeriesSwitch: this.mainSeriesSwitchOwner.mainSeriesSwitch,
    primaryMutations: this.sourceMutationOwner.primaryMutations,
    studySources: this.studySourceOwner.studySources,
    secondaryMutations: this.sourceMutationOwner.secondaryMutations,
    secondarySeriesApi: createChartSecondarySeriesApiOwner({
      assertSeriesActive: (api) => this.runtimeQueryOwner.assertSeriesActive(api as ChartSeriesApi),
      getSourceByApiOrThrow: (api, message) =>
        this.runtime.getSourceByApiOrThrow(api as ChartSeriesApi, message) as SeriesSourceState,
      resolveDisplayData: this.sourceMutationOwner.secondarySeriesApiRuntime.resolveDisplayData,
      resetViewport: this.sourceMutationOwner.secondarySeriesApiRuntime.resetViewport,
      render: this.sourceMutationOwner.secondarySeriesApiRuntime.render,
      updateCanonical: this.sourceMutationOwner.secondarySeriesApiRuntime.updateCanonical,
      buildHistogramVisuals: this.sourceMutationOwner.secondarySeriesApiRuntime.buildHistogramVisuals,
      normalizeHistogramData: this.sourceMutationOwner.secondarySeriesApiRuntime.normalizeHistogramData,
      normalizeHistogramBar: this.sourceMutationOwner.secondarySeriesApiRuntime.normalizeHistogramBar,
      createPriceLineState: (options) => this.priceLineManager.createState(options),
      createPriceLine: (lines, state) => this.priceLineManager.createApi(lines, state),
      removePriceLine: (lines, line) => this.priceLineManager.remove(lines, line),
      defaultCompareOptions: this.defaultCompareOptions,
      defaultMovingAverageOptions: this.defaultMovingAverageOptions,
    }),
    tradeLocation: {
      active: () => this.tradeLocationOwner.getActiveSession(),
      setActive: (next) => {
        this.tradeLocationOwner.setActiveSession(next as never);
      },
      setVisibleLogicalRange: (range) => this.scaleOwner.timeScaleApi().setVisibleLogicalRange(range),
      setVisiblePriceRange: (range) => this.scaleOwner.priceScaleApi().setVisibleRange(range),
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    },
  });
  private readonly paneOwner = createChartPaneOwner({
    handlerRegistry: this.handlerRegistry,
    getPaneById: (paneId) => this.runtime.getPaneById(paneId),
    getPaneByIndex: (index) => this.runtime.getPaneByIndex(index),
    getPaneIndex: (paneId) => {
      const index = this.runtime.getPaneIndex(paneId);
      if (index === -1) {
        throw new Error("chartx phase-one pane has been removed");
      }
      return index;
    },
    listPanes: () => this.runtime.listPanes(),
    addSecondaryPane: (options) => this.runtime.addSecondaryPane(options),
    hasCanvas: () => this.adapterState.canvas() !== null,
    getLayout: () => {
      const canvas = this.adapterState.canvas();
      return canvas === null
        ? this.layoutGeometry()
        : measureLayout(canvas, this.layoutGeometry(), this.viewState.manualLayout(), {
          fitContainerHeight: this.chartOptions.fitContainerHeight,
        });
    },
    gap: () => this.paneGap(),
    getCrosshair: () => this.viewState.crosshair(),
    setCrosshair: (point) => {
      this.viewState.setCrosshair(point);
    },
    getSeriesCount: (paneId) => this.runtime.listSourcesByPane(paneId).length,
    getDrawingCount: (paneId) => this.drawingOwner.countDrawingsByPane(paneId),
    listSourcesByPane: (paneId) => this.runtime.listSourcesByPane(paneId),
    removePaneEntry: (paneId) => {
      this.runtime.removePaneById(paneId);
    },
    removeSecondaryScale: (paneId) => this.runtime.removeSecondaryScale(paneId),
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly drawingOwner = createChartDrawingOwner({
    allocateDrawingOrdinal: () => {
      return this.adapterState.allocateDrawingOrdinal();
    },
    formatSeriesKindLabel,
    resolveTarget: (target, options) => this.paneOwner.resolveSeriesTarget(target, options) as never,
    getPaneById: (paneId) => this.runtime.getPaneById(paneId),
    getPaneByIndex: (index) => this.runtime.getPaneByIndex(index),
    createPaneTarget: (pane) => ({ pane }),
    getRestorePaneId: (target) => target.pane.id,
    getPaneIndex: (paneId) => this.paneOwner.getPaneIndex(paneId),
    registry: this.runtime.getDrawingRegistry(),
    createPriceLineState: (options) => this.priceLineManager.createState(options),
    lineColor: LINE_COLOR,
    resolveTrendLineDefaults: () =>
      resolveTrendLineDefaultsUseCase(this.runtime.contextSnapshot().barSequence.axisBars),
    resolveMagnetOptions: (drawing) =>
      resolveDrawingMagnetOptionsUseCase(drawing as ChartDrawingDescriptor, this.drawingOptions),
    resolvePropertySchema: (type) => DRAWING_PROPERTY_SCHEMAS[type],
    view: {
      selectedDrawingId: () => this.viewState.selectedDrawingId(),
      setSelectedDrawingId: (id) => {
        this.viewState.setSelectedDrawingId(id);
      },
      notifySelectionChange: (selection) => {
        this.handlerRegistry.notifyDrawingSelectionChange(selection);
      },
      render: () => {
        this.renderInvalidation.renderIfAttached();
      },
    },
  });
  private readonly drawingInteractionOwner = createChartDrawingInteractionOwner<ChartDrawingDescriptor>({
    listPanes: () => this.runtime.listPanes(),
    paneGap: this.paneGap(),
    getPrimaryPriceScale: () => this.runtime.primaryPriceScale(),
    getSecondaryPriceScale: (paneId) => this.runtime.getSecondaryScale(paneId),
    getAxisBars: () => this.runtime.contextSnapshot().barSequence.axisBars,
    getBarSequence: () => this.runtime.contextSnapshot().barSequence,
    getTimeScale: () => this.runtime.timeScaleApi(),
    getDrawingOptions: () => this.drawingOptions,
    getDrawingById: (id) => this.drawingOwner.getDrawingById(id),
    listDrawingsByPane: (paneId) => this.drawingOwner.listDrawingsByPane(paneId),
    getSelectedDrawingId: () => this.viewState.selectedDrawingId(),
    clearDrawingSnapGuide: () => this.viewState.clearDrawingSnapGuide(),
    setDrawingSnapGuide: (guide) => this.viewState.setDrawingSnapGuide(guide),
    hitTolerance: DRAWING_HIT_TOLERANCE,
  });
  private readonly renderInputOwner = createChartRenderInputOwner<
    MainSeriesSourceState,
    SeriesSourceState,
    ChartDrawingDescriptor,
    PhaseOneTradeLocationState
  >({
    dpr: () => window.devicePixelRatio || 1,
    getLayout: (canvas) => measureLayout(canvas, this.layoutGeometry(), this.viewState.manualLayout(), {
      fitContainerHeight: this.chartOptions.fitContainerHeight,
    }),
    getChartOptions: () => this.chartOptions,
    getCrosshairOptions: () => this.crosshairOptions,
    getDrawingOptions: () => this.drawingOptions,
    getCrosshair: () => this.viewState.crosshair(),
    getSelectedDrawingId: () => this.viewState.selectedDrawingId(),
    getHoveredDrawingId: () => this.viewState.hoveredDrawingId(),
    getHoveredDrawingHandle: () => this.viewState.hoveredDrawingHandle(),
    getDrawingSnapGuide: () => this.viewState.drawingSnapGuide(),
    getManualBarSpacing: () => this.adapterState.barSpacing(),
    getRightOffset: () => this.adapterState.rightOffset(),
    getPrimaryScaleSeriesOnly: () => this.adapterState.primaryScaleSeriesOnly(),
    getPaneSpecs: () => this.runtime.listPanes(),
    getMainSource: () => this.sourceOwner.getMainSource() as MainSeriesSourceState | null,
    createMainBarSequenceFromSource: (source) =>
      createMainBarSequenceFromSourceUseCase(source as MainSeriesSourceState),
    getContextSnapshot: () => this.runtime.contextSnapshot(),
    getPrimaryStudies: () => this.sourceOwner.getStudySourcesForPane("primary") as StudySourceState[],
    buildPrimaryPaneSeries: (mainSource) =>
      this.sourceOwner.buildPrimaryPaneSeries(mainSource as MainSeriesSourceState | null) as readonly SeriesSourceState[],
    getStudySources: () => this.runtime.listSourcesByRole("study"),
    getSecondarySeriesForPane: (paneId) => this.sourceOwner.getSecondarySeriesForPane(paneId) as StudySourceState[],
    getDrawingsByPane: (paneId) => this.drawingOwner.listDrawingsByPane(paneId),
    getPaneIndex: (paneId) => this.paneOwner.getPaneIndex(paneId),
    getSecondaryScale: (paneId) => this.runtime.getSecondaryScale(paneId),
    getPrimaryPriceScale: () => this.runtime.primaryPriceScale(),
    getPrimaryPriceRangeOverride: () => this.adapterState.primaryPriceRangeOverride(),
    getActiveTradeLocationState: () => this.tradeLocationOwner.getState(),
    getTimeScale: () => this.runtime.timeScaleApi(),
    getTimeAxisFormatter: () => this.adapterState.timeAxisFormatter(),
    getPriceAxisFormatter: () => this.adapterState.priceAxisFormatter(),
  });
  private readonly renderCallbackOwner = createChartRenderCallbackOwner({
    getRendererRuntime: () => this.runtime.rendererRuntime(),
    drawGrid: (context, params) => {
      this.runtime.drawGrid(context, params);
    },
    emitCrosshairMove: (readout, crosshair) => {
      this.handlerRegistry.emitCrosshairMove(readout, crosshair);
    },
    getCrosshair: () => this.viewState.crosshair(),
    backgroundColor: () => CHART_BACKGROUND,
    resolveBarSpacing: (currentSpacing, paneWidth, pointCount) =>
      resolveBarSpacing(currentSpacing, paneWidth, pointCount, BAR_SPACING_BOUNDS),
  });
  private readonly renderCoordinator = createChartRenderCoordinator({
    ...this.renderInputOwner,
    ...this.renderCallbackOwner,
  });
  private readonly runtimeQueryOwner = createChartRuntimeQueryOwner<ChartSeriesApi>({
    buildMainBarSequence: () =>
      this.renderCoordinator.buildMainBarSequence(
        this.sourceOwner.getMainSource() as MainSeriesSourceState | null,
      ),
    getContextSnapshot: () => this.runtime.contextSnapshot(),
    listSources: () => this.runtime.listSources(),
    hasSourceApi: (api) => this.runtime.hasSourceApi(api),
  });
  private readonly scaleOwner = createChartScaleOwner({
    defaultLayout: DEFAULT_LAYOUT,
    paneGap: this.paneGap(),
    minBarSpacing: MIN_BAR_SPACING,
    maxBarSpacing: MAX_BAR_SPACING,
    getCanvas: () => this.adapterState.canvas(),
    getManualLayout: () => this.viewState.manualLayout(),
    getPointCount: () => this.runtimeQueryOwner.getPointCount(),
    getBarSpacing: () => this.adapterState.barSpacing(),
    setBarSpacing: (value) => {
      this.adapterState.setBarSpacing(value);
    },
    getRightOffset: () => this.adapterState.rightOffset(),
    setRightOffset: (value) => {
      this.adapterState.setRightOffset(value);
    },
    getTimeScale: () => this.runtime.timeScaleApi(),
    setTimeAxisFormatter: (formatter) => {
      this.adapterState.setTimeAxisFormatter(formatter);
    },
    getPrimaryPriceRangeOverride: () => this.adapterState.primaryPriceRangeOverride(),
    setPrimaryPriceRangeOverride: (range) => {
      this.adapterState.setPrimaryPriceRangeOverride(range);
    },
    getPrimaryPriceScale: () => this.runtime.primaryPriceScale(),
    getSecondaryVisibleRange: () => this.runtime.secondaryVisibleRange(),
    getPanes: () => this.runtime.listPanes(),
    setPriceAxisFormatter: (formatter) => {
      this.adapterState.setPriceAxisFormatter(formatter);
    },
    setPrimaryScaleSeriesOnly: (value) => {
      this.adapterState.setPrimaryScaleSeriesOnly(value);
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly shellOwner = createChartShellOwner({
    layoutOptions: this.chartOptions,
    crosshairOptions: this.crosshairOptions,
    drawingOptions: this.drawingOptions,
    setManualLayout: (layout) => {
      this.viewState.setManualLayout(layout);
    },
    clearDrawingSnapGuide: () => {
      this.viewState.clearDrawingSnapGuide();
    },
    clearDrawingSnapGuideTimeOnly: () => {
      this.viewState.clearDrawingSnapGuideTimeOnly();
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly primarySeriesOwner = createChartPrimarySeriesOwner<PhaseOneMainSeriesApi, MainSeriesSourceState>({
    getCurrentMainSourceId: () => this.runtime.mainSourceId(),
    getPrimaryPriceScale: () => this.runtime.primaryPriceScale(),
    createMeta: (chartType) => this.seriesBuildOwner.createMeta(chartType),
    createLabel: (chartType, id) => this.seriesBuildOwner.createLabel(chartType, id),
    createSourceState: (input) =>
      this.seriesBuildOwner.createMainSource({
        paneId: input.paneId,
        chartType: input.chartType,
        kind: input.kind,
        api: input.api,
        meta: input.meta,
        priceScale: input.priceScale,
        priceScaleId: input.priceScaleId,
      }) as MainSeriesSourceState,
    registerSource: (source) => this.runtime.registerSource(source),
    syncMainSource: (source) => this.studyContextOwner.syncMainSource(source),
    assertSeriesActive: (api) => this.runtimeQueryOwner.assertSeriesActive(api as ChartSeriesApi),
    getSourceByApi: (api, sourceKind) =>
      this.sourceOwner.getSourceByApi(api as ChartSeriesApi, sourceKind) as MainSeriesSourceState,
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
    setPrimaryData: (data) => this.sourceOwner.setPrimaryData(data),
    updatePrimaryData: (bar) => this.sourceOwner.updatePrimaryData(bar),
    setPrimaryHistogramLikeData: (data) => this.sourceOwner.setPrimaryHistogramLikeData(data),
    updatePrimaryHistogramLikeData: (bar) => this.sourceOwner.updatePrimaryHistogramLikeData(bar),
    createPriceLineState: (options) => this.priceLineManager.createState(options),
    createPriceLine: (lines, state) => this.priceLineManager.createApi(lines, state),
    removePriceLine: (lines, line) => this.priceLineManager.remove(lines, line),
  });
  private readonly seriesCommandOwner = createChartSeriesCommandOwner({
    resolveTarget: (target, options) =>
      this.paneOwner.resolveSeriesTarget(target, options) as ResolvedSeriesTarget,
    addPrimary: (kind) => this.primarySeriesOwner.add(kind),
    addSecondarySeries: (params) => this.sourceOwner.addSecondarySeries(params),
    addLineStudySeries: (paneId, studyKind, params) =>
      this.sourceOwner.addLineStudySeries(paneId, studyKind, params),
    getMovingAverageLength: () => this.defaultMovingAverageOptions.length,
    removeSourceByApi: (series) => this.runtime.removeSourceByApi(series as ChartSeriesApi),
    resetPrimaryRangeOverride: () => {
      this.adapterState.setPrimaryPriceRangeOverride(null);
    },
    resetViewportState: () => {
      this.adapterState.resetViewport(DEFAULT_RIGHT_OFFSET);
    },
    clearCrosshair: () => {
      this.viewState.setCrosshair(null);
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly mainSeriesStateOwner = createChartMainSeriesStateOwner<
    PhaseOneMainSeriesApi,
    MainSeriesSourceState
  >({
    getMainSource: () => this.sourceOwner.getMainSource() as MainSeriesSourceState | null,
    getMainSourceOrThrow: () => this.sourceOwner.getMainSourceOrThrow() as MainSeriesSourceState,
    attachMainSeries: (chartType) => this.primarySeriesOwner.attach(chartType),
    switchChartType: (chartType) => this.sourceOwner.setChartType(chartType) as PhaseOneMainSeriesApi,
    createOptions: (styleSchemaId) => this.seriesBuildOwner.createMainOptions(styleSchemaId),
    rebuildData: (source) => {
      source.data = applyMainSeriesBuilderData(source.inputData, source);
    },
    syncContext: (source) => {
      this.studyContextOwner.syncMainSource(source);
    },
    resetPrimaryPriceRangeOverride: () => {
      this.adapterState.setPrimaryPriceRangeOverride(null);
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly stateRestoreShellOwner = createChartStateRestoreShellOwner<
    PaneModelState,
    StudySourceState
  >({
    applyOptions: (options) => {
      this.shellOwner.applyOptions(options);
    },
    clearSelection: () => {
      this.drawingOwner.selectDrawing(null, false);
    },
    clearTradeLocation: () => {
      this.tradeLocationOwner.clear();
    },
    removeSourcesWhere: (predicate) => {
      this.runtime.removeSourcesWhere((source) => predicate(source as StudySourceState));
    },
    removeDrawingByApi: (api) => {
      this.runtime.removeDrawingByApi(api as ChartDrawingApi);
    },
    removeDrawing: (api) => {
      this.drawingOwner.removeDrawing(api as ChartDrawingApi);
    },
    getSecondarySeriesCountForPane: (paneId) =>
      this.sourceOwner.getSecondarySeriesForPane(paneId).length,
    removeSecondaryPane: (paneId) => {
      this.paneOwner.removePaneById(paneId);
    },
    addPane: (options) => {
      this.paneOwner.addPane(options);
    },
    emitPaneEvent: (type, paneId) => {
      this.paneOwner.emitPaneEvent(type, paneId);
    },
    applyMainSeriesState: (state) => {
      this.mainSeriesStateOwner.applyState(state);
    },
    getPaneByIndex: (index) => this.runtime.getPaneByIndex(index),
    createPaneHandle: (paneId) => this.paneOwner.createPaneHandle(paneId),
    addCandlestickSeries: (target) => this.seriesCommandOwner.addCandlestickSeries(target),
    addBarSeries: (target) => this.seriesCommandOwner.addBarSeries(target),
    addLineSeries: (target) => this.seriesCommandOwner.addLineSeries(target),
    addAreaSeries: (target) => this.seriesCommandOwner.addAreaSeries(target),
    addBaselineSeries: (target) => this.seriesCommandOwner.addBaselineSeries(target),
    addHistogramSeries: (target) => this.seriesCommandOwner.addHistogramSeries(target),
    addVolumeSeries: (target) => this.seriesCommandOwner.addVolumeSeries(target),
    addOverlaySeries: (paneId) => this.seriesCommandOwner.addOverlaySeriesToPane(paneId),
    addCompareSeries: (paneId) => this.seriesCommandOwner.addCompareSeriesToPane(paneId),
    addMovingAverageStudy: (paneId) => this.seriesCommandOwner.addMovingAverageStudyToPane(paneId),
    addScriptedStudy: (paneId, studyOptions) =>
      this.seriesCommandOwner.addScriptedStudyToPane(
        paneId,
        studyOptions ?? {
          scriptId: "",
          inputValues: {},
          inputContextMode: "chart-context",
          requestedSymbol: null,
          requestedResolution: null,
          requestedSession: null,
          requestedTimezone: null,
          mergePolicy: "carry-forward",
        },
      ),
    locateTrade: (request, overlay) => {
      this.tradeLocationOwner.locate(request, overlay);
    },
    restoreDrawings: (drawings) => {
      this.drawingOwner.restoreDrawings(drawings);
    },
    applyTimeScaleOptions: (options) => this.scaleOwner.timeScaleApi().applyOptions(options),
    setVisibleLogicalRange: (range) => this.scaleOwner.timeScaleApi().setVisibleLogicalRange(range),
    applyPriceScaleOptions: (options) => this.scaleOwner.priceScaleApi().applyOptions(options),
    setVisibleRange: (range) => this.scaleOwner.priceScaleApi().setVisibleRange(range),
    hasCanvas: () => this.adapterState.canvas() !== null,
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly stateShellOwner = createChartStateShellOwner<
    ChartDrawingDescriptor,
    StudySourceState
  >({
    snapshotInput: {
      getLayoutOptions: () => this.chartOptions,
      getCrosshairOptions: () => this.crosshairOptions,
      getBarSpacing: () => this.adapterState.barSpacing(),
      getRightOffset: () => this.adapterState.rightOffset(),
      getVisibleLogicalRange: () => this.scaleOwner.timeScaleApi().getVisibleLogicalRange(),
      getVisiblePriceRange: () => this.scaleOwner.priceScaleApi().getVisibleRange(),
      getPrimaryScaleSeriesOnly: () => this.adapterState.primaryScaleSeriesOnly(),
      getActiveTradeLocation: () => this.tradeLocationOwner.getActiveSession(),
      listDrawings: () => this.drawingOwner.listDrawings(),
      getDrawingOptions: () => this.drawingOptions,
    },
    coordinator: {
      listPanes: () => this.runtime.listPanes(),
      getMainSeriesState: () => this.mainSeriesStateOwner.getState(),
      listStudySources: () => this.runtime.listSourcesByRole("study") as StudySourceState[],
      getPaneIndex: (paneId) => this.paneOwner.getPaneIndex(paneId),
      getDefaultCompareOptions: () => this.defaultCompareOptions,
    },
    restoreCommands: this.stateRestoreShellOwner.restoreCommandsInput(),
  });
  private readonly stateCoordinator = this.stateShellOwner.coordinator();
  private readonly interactionShellOwner = createChartInteractionShellOwner({
    defaultLayout: DEFAULT_LAYOUT,
    paneGap: this.paneGap(),
    paneDividerHitSlop: PANE_DIVIDER_HIT_SLOP,
    barSpacingBounds: BAR_SPACING_BOUNDS,
    getCanvas: () => this.adapterState.canvas(),
    getManualLayout: () => this.viewState.manualLayout(),
    listPanes: () => this.runtime.listPanes(),
    getPointCount: () => this.runtimeQueryOwner.getPointCount(),
    getBarSpacing: () => this.adapterState.barSpacing(),
    setBarSpacing: (value) => {
      this.adapterState.setBarSpacing(value);
    },
    getRightOffset: () => this.adapterState.rightOffset(),
    setRightOffset: (value) => {
      this.adapterState.setRightOffset(value);
    },
    viewState: this.viewState,
    drawingInteractionOwner: this.drawingInteractionOwner,
    paneOwner: this.paneOwner,
    drawingOwner: this.drawingOwner,
    focusCanvas: () => {
      this.adapterState.canvas()?.focus({ preventScroll: true });
    },
    renderCanvas: (canvas) => {
      this.render(canvas);
    },
    buildReadout: (point, layout) => this.renderCoordinator.buildReadout(point, layout),
    emitClick: (readout, point) => {
      this.handlerRegistry.emitClick(readout, point);
    },
    setCanvas: (nextCanvas) => {
      this.adapterState.setCanvas(nextCanvas);
    },
    clearSubscriptions: () => {
      this.handlerRegistry.clearAll();
    },
  });
  private readonly publicShellOwner = createChartPublicShellOwner({
    detach: () => {
      this.interactionShellOwner.detach();
    },
    seriesCommandOwner: this.seriesCommandOwner,
    drawingOwner: this.drawingOwner,
    paneOwner: this.paneOwner,
    shellOwner: this.shellOwner,
    scaleOwner: this.scaleOwner,
    eventSubscriptionOwner: this.eventSubscriptionOwner,
    runtimeQueryOwner: this.runtimeQueryOwner,
    mainSeriesStateOwner: this.mainSeriesStateOwner,
    stateCoordinator: this.stateCoordinator,
    tradeLocationOwner: this.tradeLocationOwner,
    sourceOwner: this.sourceOwner,
  });

  private render(canvas: HTMLCanvasElement): void {
    this.renderCoordinator.render(canvas);
  }

  public attach(canvas: HTMLCanvasElement): void {
    assertCanvasElement(canvas);
    this.interactionShellOwner.attach(canvas);
  }

  public publicApiSurface(): ChartHarnessPublicLike {
    return this.publicShellOwner.publicApiSurface();
  }

}
