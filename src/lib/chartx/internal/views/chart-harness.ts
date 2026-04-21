import {
  createCompressedPriceBasedChartBarSequence,
  createDirectionColumnPriceBasedChartBarSequence,
  buildHeikinAshiData,
  buildKagiData,
  buildLineBreakData,
  buildPointFigureData,
  buildRenkoData,
  ChartModel,
  createMainSeriesStateSnapshot,
  resolveTradeLocationState,
  resolveTradeOverlayOptions,
  DrawingRegistry,
  PaneCollection,
  PriceRangeImpl,
  PriceScale,
  resolvePaneDivider,
  resolvePaneDividerByIds,
  TimeScale,
  type PhaseOneMainChartType,
  type PhaseOneMainStyleSchemaId,
  type PhaseOneTradeLocationRequest,
  type PhaseOneTradeLocationState,
  type PhaseOneTradeOverlayOptions,
  type PaneModelState,
  type ChartBarSequence,
} from "../model";
import {
  AreaRenderer,
  BaselineRenderer,
  BarRenderer,
  CandlesticksRenderer,
  GridRenderer,
  HistogramRenderer,
  KagiRenderer,
  LineRenderer,
  PointFigureRenderer,
} from "../renderers";
import { createMainSeriesSourceState } from "./chart-main-series-source";
import { createChartPrimarySeriesOwner } from "./chart-primary-series-owner";
import { createChartSeriesCommandOwner } from "./chart-series-command-owner";
import { createChartMainSeriesStateOwner } from "./chart-main-series-state-owner";
import { createChartTradeLocationOwner } from "./chart-trade-location-owner";
import { buildCrosshairReadout } from "./chart-crosshair-readout";
import { createChartInteractionOwner } from "./chart-interaction-owner";
import { createChartHandlerRegistry } from "./chart-handler-registry";
import { createChartEventSubscriptionOwner } from "./chart-event-subscription-owner";
import {
  calculateBaseBarSpacing,
  measureLayout,
  resolveBarSpacing,
  resolvePanePoint,
} from "./chart-layout-geometry";
import {
  resolveDrawingMagnetOptions as resolveDrawingMagnetOptionsUseCase,
} from "./chart-drawing-snap";
import {
  applyDrawingMagnetOverrides as applyDrawingMagnetOverridesUseCase,
  normalizeDrawingMagnetOverrides as normalizeDrawingMagnetOverridesUseCase,
} from "./chart-drawing-magnet";
import {
  applyHorizontalLineDrawingOptions as applyHorizontalLineDrawingOptionsUseCase,
  applyTrendLineDrawingOptions as applyTrendLineDrawingOptionsUseCase,
} from "./chart-drawing-options";
import {
  resolveTrendLineDefaults as resolveTrendLineDefaultsUseCase,
} from "./chart-drawing-state";
import { createChartScaleOwner } from "./chart-scale-owner";
import { createChartShellOwner } from "./chart-shell-owner";
import { createAttachedChart } from "./chart-factory";
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
import {
  emitClickRuntime as emitClickRuntimeUseCase,
} from "./chart-event-runtime";
import { createChartCanvasLifecycleOwner } from "./chart-canvas-lifecycle-owner";
import {
  createChartViewState,
  type DrawingSnapGuideState,
} from "./chart-view-state";
import { createChartDrawingInteractionOwner } from "./chart-drawing-interaction-owner";
import { createChartRenderCoordinator } from "./chart-render-coordinator";
import { createChartRenderInputOwner } from "./chart-render-input-owner";
import { createChartRenderCallbackOwner } from "./chart-render-callback-owner";
import { createChartRenderInvalidation } from "./chart-render-invalidation";
import { createChartStateCoordinator } from "./chart-state-coordinator";
import { createChartStateSnapshotInputOwner } from "./chart-state-snapshot-input-owner";
import { createChartStateRestoreCommandOwner } from "./chart-state-restore-command-owner";
import { applyChartTemplate, createChartTemplate, normalizeChartTemplate } from "./chart-template";
import { createChartRuntimeQueryOwner } from "./chart-runtime-query-owner";
import { applyMainSeriesBuilderData } from "./chart-series-data-transforms";
import { formatSeriesKindLabel } from "./chart-series-labels";
import { mountPhaseOneChartDemo } from "./chart-demo-mount";
import { assertCanvasElement } from "./chart-dom-guards";
import { createChartPublicSurfaceOwner } from "./chart-public-surface-owner";
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
  PANE_GAP,
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
  ChartDrawingState,
  ChartSeriesApi,
  ChartSeriesKind,
  MainSeriesSourceState,
  RequiredDrawingMagnetSources,
  RequiredDrawingOptions,
  ResolvedSeriesTarget,
  SeriesSourceState,
  StudySourceState,
} from "./chart-runtime-types";
import { DRAWING_PROPERTY_SCHEMAS } from "./chart-drawing-property-schema";
export * from "./chart-api-types";
import type {
  PhaseOneAreaSeriesApi,
  PhaseOneAreaSeriesOptions,
  PhaseOneBarSeriesApi,
  PhaseOneBarSeriesOptions,
  PhaseOneBaselineSeriesApi,
  PhaseOneBaselineSeriesOptions,
  PhaseOneCandlestickData,
  PhaseOneCandlestickSeriesApi,
  PhaseOneCandlestickSeriesOptions,
  PhaseOneChartApi,
  PhaseOneChartOptions,
  PhaseOneChartStateSnapshot,
  PhaseOneChartTemplate,
  PhaseOneChartTemplateInput,
  PhaseOneClickHandler,
  PhaseOneCompareSeriesApi,
  PhaseOneCompareSeriesOptions,
  PhaseOneCrosshairMoveHandler,
  PhaseOneDrawingPropertySchema,
  PhaseOneDrawingSelectionChangeHandler,
  PhaseOneDrawingStateSnapshot,
  PhaseOneHistogramSeriesApi,
  PhaseOneHistogramSeriesOptions,
  PhaseOneHorizontalLineDrawingApi,
  PhaseOneHorizontalLineDrawingOptions,
  PhaseOneLineData,
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
  PhaseOnePriceScaleApi,
  PhaseOneReadoutBody,
  PhaseOneReadoutDetail,
  PhaseOneReadoutSeriesDetail,
  PhaseOneSelectedDrawing,
  PhaseOneSeriesTarget,
  PhaseOneTimeScaleApi,
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
  private readonly chartModel = new ChartModel<
    ChartSeriesKind,
    ChartSeriesApi,
    SeriesSourceState,
    PhaseOneMainChartType
  >();
  private readonly drawingRegistry = new DrawingRegistry<ChartDrawingKind, ChartDrawingApi, ChartDrawingDescriptor>();
  private readonly timeScale = new TimeScale();
  private readonly barRenderer = new BarRenderer();
  private readonly candlesRenderer = new CandlesticksRenderer();
  private readonly gridRenderer = new GridRenderer();
  private readonly histogramRenderer = new HistogramRenderer();
  private readonly lineRenderer = new LineRenderer();
  private readonly pointFigureRenderer = new PointFigureRenderer();
  private readonly kagiRenderer = new KagiRenderer();
  private readonly areaRenderer = new AreaRenderer();
  private readonly baselineRenderer = new BaselineRenderer();
  private nextDrawingId = 1;
  private canvas: HTMLCanvasElement | null = null;
  private crosshair: PanePoint | null = null;
  private barSpacing: number | null = null;
  private rightOffset = DEFAULT_RIGHT_OFFSET;
  private readonly chartOptions: Required<NonNullable<PhaseOneChartOptions["layout"]>> = createDefaultLayoutOptions();
  private readonly crosshairOptions: Required<NonNullable<PhaseOneChartOptions["crosshair"]>> =
    createDefaultCrosshairOptions();
  private readonly drawingOptions: RequiredDrawingOptions = createDefaultDrawingOptions();
  private timeAxisFormatter: ((time: number) => string) | null = null;
  private priceAxisFormatter: ((value: number) => string) | null = null;
  private primaryScaleSeriesOnly = false;
  private primaryPriceRangeOverride: PriceRangeImpl | null = null;
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
    getCanvas: () => this.canvas,
    renderCanvas: (canvas) => {
      this.render(canvas);
    },
  });
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
    getContextSnapshot: () => this.chartModel.context().snapshot(),
    clearMainSource: () => this.chartModel.clearMainSource(),
    bindMainSource: (mainSourceId, chartType, barSequence) =>
      this.chartModel.bindMainSource(mainSourceId, chartType, barSequence),
    listStudySources: () => this.chartModel.listSourcesByRole("study") as StudySourceState[],
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
      this.primaryPriceRangeOverride = null;
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly sourceMutationOwner = createChartSourceMutationOwner({
    syncMainSource: (source) => this.studyContextOwner.syncMainSource(source as MainSeriesSourceState),
    resolveStudyDisplayData: (source) => this.studyContextOwner.resolveDisplayData(source as StudySourceState),
    resetViewport: () => {
      this.barSpacing = null;
      this.rightOffset = DEFAULT_RIGHT_OFFSET;
    },
    clearPrimaryPriceRangeOverride: () => {
      this.primaryPriceRangeOverride = null;
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly studySourceOwner = createChartStudySourceOwner<StudySourceState>({
    getPrimaryPriceScale: () => this.primaryPriceScale,
    getOrCreateSecondaryPriceScale: (paneId) => this.chartModel.getOrCreateSecondaryScale(paneId),
    createMeta: (kind) => this.seriesBuildOwner.createMeta(kind),
    createOptions: (kind) => this.seriesBuildOwner.createOptions(kind),
    registerSource: (source) => {
      this.chartModel.registerSource(source);
    },
    defaultCompareOptions: this.defaultCompareOptions,
  });
  private readonly mainSeriesSwitchOwner = createChartMainSeriesSwitchOwner<ChartSeriesApi>({
    removeCurrent: (api) => this.chartModel.removeSourceByApi(api) !== undefined,
    clearPriceRangeOverride: () => {
      this.primaryPriceRangeOverride = null;
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
      mainSourceId: () => this.chartModel.mainSourceId(),
      getSourceByIdAndRole: (id, role) => this.chartModel.getSourceByIdAndRole(id, role),
      getSourceByApiOrThrow: (api, message) => this.chartModel.getSourceByApiOrThrow(api as ChartSeriesApi, message),
      listSourcesByPaneAndRole: (paneId, role) => this.chartModel.listSourcesByPaneAndRole(paneId, role),
      listSourcesByRole: (role) => this.chartModel.listSourcesByRole(role),
    },
    mainSeriesSwitch: this.mainSeriesSwitchOwner.mainSeriesSwitch,
    primaryMutations: this.sourceMutationOwner.primaryMutations,
    studySources: this.studySourceOwner.studySources,
    secondaryMutations: this.sourceMutationOwner.secondaryMutations,
    secondarySeriesApi: createChartSecondarySeriesApiOwner({
      assertSeriesActive: (api) => this.runtimeQueryOwner.assertSeriesActive(api as ChartSeriesApi),
      getSourceByApiOrThrow: (api, message) =>
        this.chartModel.getSourceByApiOrThrow(api as ChartSeriesApi, message) as SeriesSourceState,
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
    getPaneById: (paneId) => this.panes.getById(paneId),
    getPaneByIndex: (index) => this.panes.getByIndex(index),
    getPaneIndex: (paneId) => {
      const index = this.panes.getIndex(paneId);
      if (index === -1) {
        throw new Error("chartx phase-one pane has been removed");
      }
      return index;
    },
    listPanes: () => this.panes.list(),
    addSecondaryPane: (options) => this.panes.addSecondaryPane(options),
    hasCanvas: () => this.canvas !== null,
    getLayout: () => (this.canvas === null ? DEFAULT_LAYOUT : measureLayout(this.canvas, DEFAULT_LAYOUT, this.viewState.manualLayout())),
    gap: PANE_GAP,
    getCrosshair: () => this.viewState.crosshair(),
    setCrosshair: (point) => {
      this.viewState.setCrosshair(point);
    },
    getSeriesCount: (paneId) => this.chartModel.listSourcesByPane(paneId).length,
    getDrawingCount: (paneId) => this.drawingOwner.countDrawingsByPane(paneId),
    listSourcesByPane: (paneId) => this.chartModel.listSourcesByPane(paneId),
    removePaneEntry: (paneId) => {
      this.panes.removeById(paneId);
    },
    removeSecondaryScale: (paneId) => this.chartModel.removeSecondaryScale(paneId),
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly drawingOwner = createChartDrawingOwner({
    allocateDrawingOrdinal: () => {
      const ordinal = this.nextDrawingId;
      this.nextDrawingId += 1;
      return ordinal;
    },
    formatSeriesKindLabel,
    resolveTarget: (target, options) => this.paneOwner.resolveSeriesTarget(target, options) as never,
    getPaneById: (paneId) => this.panes.getById(paneId),
    getPaneByIndex: (index) => this.panes.getByIndex(index),
    createPaneTarget: (pane) => ({ pane }),
    getRestorePaneId: (target) => target.pane.id,
    getPaneIndex: (paneId) => this.paneOwner.getPaneIndex(paneId),
    registry: this.drawingRegistry,
    createPriceLineState: (options) => this.priceLineManager.createState(options),
    lineColor: LINE_COLOR,
    resolveTrendLineDefaults: () =>
      resolveTrendLineDefaultsUseCase(this.chartModel.context().snapshot().barSequence.axisBars),
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
    listPanes: () => this.panes.list(),
    paneGap: PANE_GAP,
    getPrimaryPriceScale: () => this.primaryPriceScale,
    getSecondaryPriceScale: (paneId) => this.chartModel.getSecondaryScale(paneId),
    getAxisBars: () => this.chartModel.context().snapshot().barSequence.axisBars,
    getBarSequence: () => this.chartModel.context().snapshot().barSequence,
    getTimeScale: () => this.timeScale,
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
    getLayout: (canvas) => measureLayout(canvas, DEFAULT_LAYOUT, this.viewState.manualLayout()),
    getChartOptions: () => this.chartOptions,
    getCrosshairOptions: () => this.crosshairOptions,
    getDrawingOptions: () => this.drawingOptions,
    getCrosshair: () => this.viewState.crosshair(),
    getSelectedDrawingId: () => this.viewState.selectedDrawingId(),
    getHoveredDrawingId: () => this.viewState.hoveredDrawingId(),
    getHoveredDrawingHandle: () => this.viewState.hoveredDrawingHandle(),
    getDrawingSnapGuide: () => this.viewState.drawingSnapGuide(),
    getManualBarSpacing: () => this.barSpacing,
    getRightOffset: () => this.rightOffset,
    getPrimaryScaleSeriesOnly: () => this.primaryScaleSeriesOnly,
    getPaneSpecs: () => this.panes.list(),
    getMainSource: () => this.sourceOwner.getMainSource() as MainSeriesSourceState | null,
    createMainBarSequenceFromSource: (source) =>
      createMainBarSequenceFromSourceUseCase(source as MainSeriesSourceState),
    getContextSnapshot: () => this.chartModel.context().snapshot(),
    getPrimaryStudies: () => this.sourceOwner.getStudySourcesForPane("primary") as StudySourceState[],
    buildPrimaryPaneSeries: (mainSource) =>
      this.sourceOwner.buildPrimaryPaneSeries(mainSource as MainSeriesSourceState | null) as readonly SeriesSourceState[],
    getStudySources: () => this.chartModel.listSourcesByRole("study"),
    getSecondarySeriesForPane: (paneId) => this.sourceOwner.getSecondarySeriesForPane(paneId) as StudySourceState[],
    getDrawingsByPane: (paneId) => this.drawingOwner.listDrawingsByPane(paneId),
    getPaneIndex: (paneId) => this.paneOwner.getPaneIndex(paneId),
    getSecondaryScale: (paneId) => this.chartModel.getSecondaryScale(paneId),
    getPrimaryPriceScale: () => this.primaryPriceScale,
    getPrimaryPriceRangeOverride: () => this.primaryPriceRangeOverride,
    getActiveTradeLocationState: () => this.tradeLocationOwner.getState(),
    getTimeScale: () => this.timeScale,
    getTimeAxisFormatter: () => this.timeAxisFormatter,
    getPriceAxisFormatter: () => this.priceAxisFormatter,
  });
  private readonly renderCallbackOwner = createChartRenderCallbackOwner({
    getRendererRuntime: () => ({
      lineRenderer: this.lineRenderer,
      areaRenderer: this.areaRenderer,
      baselineRenderer: this.baselineRenderer,
      barRenderer: this.barRenderer,
      candlesRenderer: this.candlesRenderer,
      pointFigureRenderer: this.pointFigureRenderer,
      histogramRenderer: this.histogramRenderer,
      kagiRenderer: this.kagiRenderer,
    }),
    drawGrid: (context, params) => {
      this.gridRenderer.draw(context, params);
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
    getContextSnapshot: () => this.chartModel.context().snapshot(),
    listSources: () => this.chartModel.listSources(),
    hasSourceApi: (api) => this.chartModel.hasSourceApi(api),
  });
  private readonly scaleOwner = createChartScaleOwner({
    defaultLayout: DEFAULT_LAYOUT,
    paneGap: PANE_GAP,
    minBarSpacing: MIN_BAR_SPACING,
    maxBarSpacing: MAX_BAR_SPACING,
    getCanvas: () => this.canvas,
    getManualLayout: () => this.viewState.manualLayout(),
    getPointCount: () => this.runtimeQueryOwner.getPointCount(),
    getBarSpacing: () => this.barSpacing,
    setBarSpacing: (value) => {
      this.barSpacing = value;
    },
    getRightOffset: () => this.rightOffset,
    setRightOffset: (value) => {
      this.rightOffset = value;
    },
    getTimeScale: () => this.timeScale,
    setTimeAxisFormatter: (formatter) => {
      this.timeAxisFormatter = formatter;
    },
    getPrimaryPriceRangeOverride: () => this.primaryPriceRangeOverride,
    setPrimaryPriceRangeOverride: (range) => {
      this.primaryPriceRangeOverride = range;
    },
    getPrimaryPriceScale: () => this.primaryPriceScale,
    getSecondaryVisibleRange: () =>
      this.chartModel.secondaryScales()[0]?.getPriceRange()?.toRaw() ?? null,
    getPanes: () => this.panes.list(),
    setPriceAxisFormatter: (formatter) => {
      this.priceAxisFormatter = formatter;
    },
    setPrimaryScaleSeriesOnly: (value) => {
      this.primaryScaleSeriesOnly = value;
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
    getCurrentMainSourceId: () => this.chartModel.mainSourceId(),
    getPrimaryPriceScale: () => this.primaryPriceScale,
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
    registerSource: (source) => this.chartModel.registerSource(source),
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
    removeSourceByApi: (series) => this.chartModel.removeSourceByApi(series as ChartSeriesApi),
    resetPrimaryRangeOverride: () => {
      this.primaryPriceRangeOverride = null;
    },
    resetViewportState: () => {
      this.barSpacing = null;
      this.rightOffset = DEFAULT_RIGHT_OFFSET;
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
      this.primaryPriceRangeOverride = null;
    },
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly stateSnapshotInputOwner = createChartStateSnapshotInputOwner<ChartDrawingDescriptor>({
    getLayoutOptions: () => this.chartOptions,
    getCrosshairOptions: () => this.crosshairOptions,
    getBarSpacing: () => this.barSpacing,
    getRightOffset: () => this.rightOffset,
    getVisibleLogicalRange: () => this.scaleOwner.timeScaleApi().getVisibleLogicalRange(),
    getVisiblePriceRange: () => this.scaleOwner.priceScaleApi().getVisibleRange(),
    getPrimaryScaleSeriesOnly: () => this.primaryScaleSeriesOnly,
    getActiveTradeLocation: () => this.tradeLocationOwner.getActiveSession(),
    listDrawings: () => this.drawingOwner.listDrawings(),
    getDrawingOptions: () => this.drawingOptions,
  });
  private readonly stateRestoreCommandOwner = createChartStateRestoreCommandOwner<
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
      this.chartModel.removeSourcesWhere((source) => predicate(source as StudySourceState));
    },
    removeDrawingByApi: (api) => {
      this.drawingRegistry.removeByApi(api as ChartDrawingApi);
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
    getPaneByIndex: (index) => this.panes.getByIndex(index),
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
    hasCanvas: () => this.canvas !== null,
    render: () => {
      this.renderInvalidation.renderIfAttached();
    },
  });
  private readonly stateCoordinator = createChartStateCoordinator({
    getOptions: this.stateSnapshotInputOwner.getOptions,
    getTimeScaleState: this.stateSnapshotInputOwner.getTimeScaleState,
    getPriceScaleState: this.stateSnapshotInputOwner.getPriceScaleState,
    listPanes: () => this.panes.list(),
    getMainSeriesState: () => this.mainSeriesStateOwner.getState(),
    listStudySources: () => this.chartModel.listSourcesByRole("study"),
    getPaneIndex: (paneId) => this.paneOwner.getPaneIndex(paneId),
    getDefaultCompareOptions: () => this.defaultCompareOptions,
    getTradeLocationState: this.stateSnapshotInputOwner.getTradeLocationState,
    listDrawings: this.stateSnapshotInputOwner.listDrawings,
    resolveDrawingMagnetOptions: this.stateSnapshotInputOwner.resolveDrawingMagnetOptions,
    validateDrawings: this.stateSnapshotInputOwner.validateDrawings,
    ...this.stateRestoreCommandOwner,
  });
  private get panes(): PaneCollection {
    return this.chartModel.panes();
  }

  private get primaryPriceScale(): PriceScale {
    return this.chartModel.primaryScale();
  }
  private readonly interactionHandlers = createChartInteractionOwner({
    defaultLayout: DEFAULT_LAYOUT,
    paneGap: PANE_GAP,
    paneDividerHitSlop: PANE_DIVIDER_HIT_SLOP,
    barSpacingBounds: BAR_SPACING_BOUNDS,
    getCanvas: () => this.canvas,
    getManualLayout: () => this.viewState.manualLayout(),
    listPanes: () => this.panes.list(),
    getPointCount: () => this.runtimeQueryOwner.getPointCount(),
    getBarSpacing: () => this.barSpacing,
    setBarSpacing: (value) => {
      this.barSpacing = value;
    },
    getRightOffset: () => this.rightOffset,
    setRightOffset: (value) => {
      this.rightOffset = value;
    },
    viewState: this.viewState,
    drawingInteractionOwner: this.drawingInteractionOwner,
    paneOwner: this.paneOwner,
    drawingOwner: this.drawingOwner,
    focusCanvas: () => {
      this.canvas?.focus({ preventScroll: true });
    },
    renderCanvas: (canvas) => {
      this.render(canvas);
    },
    buildReadout: (point, layout) => this.renderCoordinator.buildReadout(point, layout),
    emitClick: (readout, point) => {
      this.handlerRegistry.emitClick(readout, point);
    },
  });
  private readonly handleResize = this.interactionHandlers.handleResize;
  private readonly handlePointerMove = this.interactionHandlers.handlePointerMove;
  private readonly handlePointerLeave = this.interactionHandlers.handlePointerLeave;
  private readonly handlePointerDown = this.interactionHandlers.handlePointerDown;
  private readonly handlePointerUp = this.interactionHandlers.handlePointerUp;
  private readonly handleWheel = this.interactionHandlers.handleWheel;
  private readonly handleClick = this.interactionHandlers.handleClick;
  private readonly handleKeyDown = this.interactionHandlers.handleKeyDown;
  private readonly canvasLifecycleOwner = createChartCanvasLifecycleOwner({
    getManualLayout: () => this.viewState.manualLayout(),
    getCanvas: () => this.canvas,
    setCanvas: (nextCanvas) => {
      this.canvas = nextCanvas;
    },
    renderCanvas: (nextCanvas) => {
      this.render(nextCanvas);
    },
    getResizeObserver: () => this.viewState.resizeObserver(),
    setResizeObserver: (observer) => {
      this.viewState.setResizeObserver(observer);
    },
    handlers: {
      handleResize: this.handleResize as EventListener,
      handlePointerDown: this.handlePointerDown as EventListener,
      handlePointerMove: this.handlePointerMove as EventListener,
      handlePointerUp: this.handlePointerUp as EventListener,
      handlePointerLeave: this.handlePointerLeave as EventListener,
      handleWheel: this.handleWheel as EventListener,
      handleClick: this.handleClick as EventListener,
      handleKeyDown: this.handleKeyDown as EventListener,
    },
    clearInteractionState: () => {
      this.viewState.clearInteractionState();
    },
    clearSubscriptions: () => {
      this.handlerRegistry.clearAll();
    },
  });
  private readonly publicSurfaceOwner = createChartPublicSurfaceOwner({
    detach: () => {
      this.canvasLifecycleOwner.detach();
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
    this.canvasLifecycleOwner.attach(canvas);
  }

  public publicApiSurface(): ChartHarnessPublicLike {
    return this.publicSurfaceOwner.publicApiSurface();
  }

}

export function createPhaseOneChart(canvas: HTMLCanvasElement): PhaseOneChartApi {
  return createAttachedChart(canvas, () => new PhaseOneChartHarness());
}

export function mountPhaseOneChartHarness(canvas: HTMLCanvasElement): () => void {
  return mountPhaseOneChartDemo(canvas, createPhaseOneChart);
}
