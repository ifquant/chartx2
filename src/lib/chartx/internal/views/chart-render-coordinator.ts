import {
  buildPaneFrames,
  createTimeBasedChartBarSequence,
  type ChartBarSequence,
  type Coordinate,
  type PaneFrame,
  type PaneModelState,
  type PlotRow,
  type PriceScale,
  type TimeScale,
} from "../model";
import { drawMainSeriesRenderer } from "../renderers";
import { buildRawReadout as buildRawReadoutUseCase } from "./chart-readout";
import {
  formatReadoutDetail as formatReadoutDetailUseCase,
  formatSeriesReadoutValue as formatSeriesReadoutValueForStateUseCase,
} from "./chart-readout-format";
import { formatPriceAxisLabel, formatTimeAxisLabel, formatVolumeAxisLabel } from "./chart-axis-format";
import { buildMagnetAxisTag, buildMagnetTimeAxisTag, drawPriceAxis, drawTimeAxis } from "./chart-axis-tags";
import {
  renderPrimaryPaneContent as renderPrimaryPaneContentUseCase,
  renderSecondaryPaneContent as renderSecondaryPaneContentUseCase,
} from "./chart-pane-render";
import { renderPriceAxes as renderPriceAxesUseCase, renderTimeAxis as renderTimeAxisUseCase } from "./chart-axis-render";
import { finishChartRender as finishChartRenderUseCase } from "./chart-render-tail";
import {
  prepareCanvasRenderSurface as prepareCanvasRenderSurfaceUseCase,
  renderEmptyPlotFrame as renderEmptyPlotFrameUseCase,
} from "./chart-render-surface";
import {
  applyPrimaryPaneScale as applyPrimaryPaneScaleUseCase,
  applySecondaryPaneScale as applySecondaryPaneScaleUseCase,
} from "./chart-pane-scale";
import {
  buildPrimaryPaneDecorations as buildPrimaryPaneDecorationsUseCase,
  buildSecondaryPaneDecorations as buildSecondaryPaneDecorationsUseCase,
} from "./chart-pane-decorations";
import { drawPriceLines, drawSeriesMarkers, drawTradeLocationOverlay } from "./chart-pane-decoration-render";
import { drawDrawingSnapGuide, drawPaneDrawings } from "./chart-pane-drawing-render";
import { resolveDrawingTimeCoordinate } from "./chart-drawing-geometry";
import { buildChartRenderState as buildChartRenderStateUseCase } from "./chart-render-state";
import { renderPaneChrome as renderPaneChromeUseCase } from "./chart-pane-chrome";
import {
  buildReadoutSeriesForPane as buildReadoutSeriesForPaneUseCase,
  buildReadoutSeriesForPrimary as buildReadoutSeriesForPrimaryUseCase,
} from "./chart-readout-series";
import type { PhaseOneReadoutBody, PhaseOneReadoutDetail, PhaseOneReadoutSeriesDetail } from "./chart-api-types";

type Layout = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type PanePoint = {
  x: number;
  y: number;
} | null;

type RowSet = readonly PlotRow<number>[];

type HistogramVisual = {
  color?: string;
  isUp: boolean;
};

type SeriesMarkerLike = {
  time: number;
  position?: string;
  shape?: string;
  color?: string;
  text?: string;
};

type DrawingLike = {
  id: string;
  paneId: string;
  kind: "horizontal-line" | "trend-line";
  price?: number | null;
};

type DrawingSnapGuideLike = {
  paneId: string;
  price: number | null;
  time: number | null;
};

type TradeLocationStateLike = unknown;

type ContextBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type BarSequenceLike = ChartBarSequence<number> & {
  axisBars: readonly {
    time: number;
    index: number;
    value: readonly number[];
  }[];
};

type ChartContextSnapshot = {
  mainSourceId: string | null;
  barSequence: BarSequenceLike;
};

type SeriesSourceLike = {
  id: string;
  label: string;
  paneId: string;
  role: "main-series" | "study";
  kind: string;
  renderer?: string;
  options: Record<string, unknown>;
  inputData: readonly ContextBar[];
  visuals: Map<number, HistogramVisual>;
  markers: readonly SeriesMarkerLike[];
  data: unknown;
  store: {
    setData(data: unknown): RowSet;
  };
  priceScale: PriceScale;
};

type MainSeriesSourceLike = SeriesSourceLike & {
  chartType: string;
};

type ChartLayoutOptions = {
  backgroundColor: string;
  paneBackgroundColor: string;
  gridColor: string;
  frameColor: string;
  axisTextColor: string;
  axisLabelBackground: string;
  axisLabelBorder: string;
  axisActiveBackground: string;
  axisActiveText: string;
};

type ChartCrosshairOptions = {
  lineColor: string;
  pointColor: string;
};

type ChartDrawingOptions = {
  magnetLabelVisible: boolean;
  timeMagnetLabelVisible: boolean;
};

type RendererRuntime = {
  lineRenderer: unknown;
  areaRenderer: unknown;
  baselineRenderer: unknown;
  barRenderer: unknown;
  candlesRenderer: unknown;
  pointFigureRenderer: unknown;
  histogramRenderer: unknown;
  kagiRenderer: unknown;
};

function toCoordinate(value: Coordinate | null): Coordinate {
  return (value ?? 0) as Coordinate;
}

function rendererForSeriesKind(kind: string): string {
  switch (kind) {
    case "line":
      return "line";
    case "area":
      return "area";
    case "baseline":
      return "area";
    case "bar":
      return "bars";
    case "candlestick":
      return "candles";
    case "histogram":
    case "volume":
      return "columns";
    default:
      return "line";
  }
}

export function createChartRenderCoordinator(deps: {
  dpr(): number;
  getLayout(canvas: HTMLCanvasElement): Layout;
  getChartOptions(): ChartLayoutOptions;
  getCrosshairOptions(): ChartCrosshairOptions;
  getDrawingOptions(): ChartDrawingOptions;
  getCrosshair(): PanePoint;
  getSelectedDrawingId(): string | null;
  getHoveredDrawingId(): string | null;
  getHoveredDrawingHandle(): "start" | "end" | null;
  getDrawingSnapGuide(): DrawingSnapGuideLike | null;
  getManualBarSpacing(): number | null;
  getRightOffset(): number;
  getPrimaryScaleSeriesOnly(): boolean;
  getPaneSpecs(): readonly PaneModelState[];
  getMainSource(): MainSeriesSourceLike | null;
  createMainBarSequenceFromSource(source: unknown): ChartBarSequence<number>;
  getContextSnapshot(): ChartContextSnapshot;
  getPrimaryStudies(): readonly SeriesSourceLike[];
  buildPrimaryPaneSeries(mainSource: unknown | null): readonly SeriesSourceLike[];
  getStudySources(): readonly SeriesSourceLike[];
  getSecondarySeriesForPane(paneId: string): readonly SeriesSourceLike[];
  getDrawingsByPane(paneId: string): readonly DrawingLike[];
  getPaneIndex(paneId: string): number;
  getSecondaryScale(paneId: string): PriceScale | undefined;
  getPrimaryPriceScale(): PriceScale;
  getPrimaryPriceRangeOverride(): { toRaw(): { minValue: number; maxValue: number } } | null;
  getActiveTradeLocationState(): TradeLocationStateLike | null;
  getTimeScale(): TimeScale;
  getTimeAxisFormatter(): ((time: number) => string) | null;
  getPriceAxisFormatter(): ((price: number) => string) | null;
  getRendererRuntime(): RendererRuntime;
  drawGrid(
    context: CanvasRenderingContext2D,
    params: { width: number; height: number; columns: number; rows: number; lineColor: string },
  ): void;
  drawPaneLegend(context: CanvasRenderingContext2D, entries: readonly PhaseOneReadoutSeriesDetail[]): void;
  drawCrosshair(
    context: CanvasRenderingContext2D,
    paneWidth: number,
    paneHeight: number,
    crosshair: PanePoint,
    options: ChartCrosshairOptions,
  ): void;
  emitReadout(canvas: HTMLCanvasElement, detail: PhaseOneReadoutDetail): void;
  emitCrosshairMove(readout: PhaseOneReadoutDetail): void;
  backgroundColor(): string;
  resolveBarSpacing(currentSpacing: number | null, paneWidth: number, pointCount: number): number;
}): {
  renderSeriesSource(
    context: CanvasRenderingContext2D,
    state: SeriesSourceLike,
    rows: RowSet,
    paneHeight: number,
    barWidth: number,
    priceScale: PriceScale,
    rangeMin: number | null,
  ): void;
  buildReadoutSeriesForPrimary(
    primarySources: readonly SeriesSourceLike[],
    rowSets: ReadonlyMap<string, RowSet>,
    crosshair: PanePoint,
  ): readonly PhaseOneReadoutSeriesDetail[];
  buildReadoutSeriesForPane(
    paneSeries: readonly SeriesSourceLike[],
    crosshair: PanePoint,
  ): readonly PhaseOneReadoutSeriesDetail[];
  buildMainBarSequence(source: MainSeriesSourceLike | null): ChartBarSequence<number>;
  buildRawReadout(point: PanePoint, layout: Layout): PhaseOneReadoutBody;
  buildReadout(point: PanePoint, layout: Layout): PhaseOneReadoutDetail;
  formatSeriesReadoutValueForState(state: SeriesSourceLike, value: number | null): string;
  render(canvas: HTMLCanvasElement): void;
} {
  const owner = {
    renderSeriesSource(
      context: CanvasRenderingContext2D,
      state: SeriesSourceLike,
      rows: RowSet,
      paneHeight: number,
      barWidth: number,
      priceScale: PriceScale,
      rangeMin: number | null,
    ): void {
      if (rows.length === 0) {
        return;
      }

      const renderer = (state.role === "main-series" ? state.renderer : rendererForSeriesKind(state.kind)) as never;
      drawMainSeriesRenderer({
        context,
        renderer,
        rows: rows as never,
        paneHeight,
        barWidth,
        priceScale,
        rangeMin,
        timeToX: (index) => deps.getTimeScale().indexToCoordinate(index),
        priceToY: (value) => toCoordinate(priceScale.priceToCoordinate(value)),
        options: state.options,
        inputData: state.inputData,
        visuals: state.visuals as never,
        runtime: deps.getRendererRuntime() as never,
      });
    },

    buildReadoutSeriesForPrimary(
      primarySources: readonly SeriesSourceLike[],
      rowSets: ReadonlyMap<string, RowSet>,
      crosshair: PanePoint,
    ): readonly PhaseOneReadoutSeriesDetail[] {
      return buildReadoutSeriesForPrimaryUseCase(primarySources as never, rowSets, crosshair, {
        timeScale: deps.getTimeScale(),
        formatValue: (state, value) =>
          owner.formatSeriesReadoutValueForState(state as unknown as SeriesSourceLike, value),
      });
    },

    buildReadoutSeriesForPane(
      paneSeries: readonly SeriesSourceLike[],
      crosshair: PanePoint,
    ): readonly PhaseOneReadoutSeriesDetail[] {
      return buildReadoutSeriesForPaneUseCase(paneSeries as never, crosshair, {
        timeScale: deps.getTimeScale(),
        formatValue: (state, value) =>
          owner.formatSeriesReadoutValueForState(state as unknown as SeriesSourceLike, value),
      });
    },

    buildMainBarSequence(source: MainSeriesSourceLike | null): ChartBarSequence<number> {
      if (source === null) {
        return createTimeBasedChartBarSequence([]);
      }

      const context = deps.getContextSnapshot();
      if (context.mainSourceId === source.id) {
        return context.barSequence;
      }

      return deps.createMainBarSequenceFromSource(source);
    },

    buildRawReadout(point: PanePoint, layout: Layout): PhaseOneReadoutBody {
      const mainSource = deps.getMainSource();
      const mainSequence = owner.buildMainBarSequence(mainSource);
      return buildRawReadoutUseCase({
        point,
        paneFrames: buildPaneFrames(
          deps.getPaneSpecs(),
          layout.height - layout.top - layout.bottom,
          16,
        ),
        mainSourceId: mainSource?.id ?? null,
        primaryRows: mainSequence.bars,
        primaryStudies: deps.getPrimaryStudies() as never,
        primarySources: deps.buildPrimaryPaneSeries(mainSource) as never,
        timeScale: deps.getTimeScale(),
        primaryPriceScale: deps.getPrimaryPriceScale(),
        getPaneIndex: (paneId) => deps.getPaneIndex(paneId),
        getSecondarySeriesForPane: (paneId) => deps.getSecondarySeriesForPane(paneId) as never,
        buildReadoutSeriesForPrimary: (primarySources, rowSets, crosshair) =>
          owner.buildReadoutSeriesForPrimary(
            primarySources as unknown as readonly SeriesSourceLike[],
            rowSets,
            crosshair,
          ),
        buildReadoutSeriesForPane: (paneSeries, crosshair) =>
          owner.buildReadoutSeriesForPane(
            paneSeries as unknown as readonly SeriesSourceLike[],
            crosshair,
          ),
      });
    },

    buildReadout(point: PanePoint, layout: Layout): PhaseOneReadoutDetail {
      return formatReadoutDetailUseCase(owner.buildRawReadout(point, layout), {
        formatTime: (value) => formatTimeAxisLabel(value, deps.getTimeAxisFormatter()),
        formatPrice: (value) => formatPriceAxisLabel(value, deps.getPriceAxisFormatter()),
      });
    },

    formatSeriesReadoutValueForState(state: SeriesSourceLike, value: number | null): string {
      return formatSeriesReadoutValueForStateUseCase(state as never, value, {
        formatPrice: (nextValue) => formatPriceAxisLabel(nextValue, deps.getPriceAxisFormatter()),
        formatVolume: (nextValue) => formatVolumeAxisLabel(nextValue),
      });
    },

    render(canvas: HTMLCanvasElement): void {
      const dpr = deps.dpr();
      const layout = deps.getLayout(canvas);
      const context = canvas.getContext("2d");
      if (context === null) {
        throw new Error("Canvas 2D context is unavailable");
      }

      const chartOptions = deps.getChartOptions();
      const drawingOptions = deps.getDrawingOptions();
      const crosshair = deps.getCrosshair();
      const drawingSnapGuide = deps.getDrawingSnapGuide();
      const selectedDrawingId = deps.getSelectedDrawingId();
      const hoveredDrawingId = deps.getHoveredDrawingId();
      const hoveredDrawingHandle = deps.getHoveredDrawingHandle();
      const primaryPriceScale = deps.getPrimaryPriceScale();
      const timeScale = deps.getTimeScale();
      const contextSnapshot = deps.getContextSnapshot();

      prepareCanvasRenderSurfaceUseCase({
        canvas,
        context,
        layout,
        dpr,
        backgroundColor: chartOptions.backgroundColor,
      });

      const paneWidth = layout.width - layout.left - layout.right;
      const plotHeight = layout.height - layout.top - layout.bottom;
      const mainSource = deps.getMainSource();
      const mainSequence = owner.buildMainBarSequence(mainSource);
      const primaryStudies = deps.getPrimaryStudies();
      const primarySources = deps.buildPrimaryPaneSeries(mainSource);
      const renderState = buildChartRenderStateUseCase({
        paneSpecs: deps.getPaneSpecs(),
        plotHeight,
        paneGap: 16,
        paneWidth,
        crosshair,
        mainSourceId: mainSource?.id ?? null,
        mainSequence,
        primaryStudies: primaryStudies as never,
        primarySources: primarySources as never,
        studySources: deps.getStudySources() as never,
      });
      const {
        primaryRows,
        primaryTimeAxisRows,
        primaryRowSets,
        secondaryRows,
        pointCount,
        paneFrames,
        activePane,
        barWidth,
      } = renderState;

      if (pointCount === 0) {
        renderEmptyPlotFrameUseCase({
          context,
          layout,
          paneWidth,
          plotHeight,
          paneBackgroundColor: chartOptions.paneBackgroundColor,
          frameColor: chartOptions.frameColor,
        });
        return;
      }

      timeScale.applyOptions({
        width: paneWidth,
        pointCount,
        barSpacing: deps.resolveBarSpacing(deps.getManualBarSpacing(), paneWidth, pointCount),
        rightOffset: deps.getRightOffset(),
      });

      for (const pane of paneFrames) {
        context.save();
        context.translate(layout.left, layout.top + pane.top);
        context.fillStyle = chartOptions.paneBackgroundColor;
        context.fillRect(0, 0, paneWidth, pane.height);
        deps.drawGrid(context, {
          width: paneWidth,
          height: pane.height,
          columns: 8,
          rows: 5,
          lineColor: chartOptions.gridColor,
        });

        context.save();
        context.beginPath();
        context.rect(0, 0, paneWidth, pane.height);
        context.clip();

        if (pane.kind === "primary") {
          const primaryPaneDecorations = buildPrimaryPaneDecorationsUseCase({
            sources: primarySources as never,
            drawings: deps.getDrawingsByPane("primary") as never,
            drawingSnapGuide: drawingSnapGuide as never,
            tradeLocationState: deps.getActiveTradeLocationState() as never,
          });
          const { rangeMin: primaryRangeMin } = applyPrimaryPaneScaleUseCase({
            mainSource: mainSource as never,
            primaryStudies: primaryStudies as never,
            primaryRowSets,
            primaryScaleSeriesOnly: deps.getPrimaryScaleSeriesOnly(),
            priceRangeOverride: deps.getPrimaryPriceRangeOverride() as never,
            paneHeight: pane.height,
            priceScale: primaryPriceScale,
          });

          renderPrimaryPaneContentUseCase({
            hasPrimaryData: primaryRows.length > 0,
            mainSourceExists: mainSource !== null,
            primarySources,
            primaryRowsFor: (source) => primaryRowSets.get(source.id) ?? [],
            renderSeries: (source, rows) => {
              owner.renderSeriesSource(
                context,
                source as SeriesSourceLike,
                rows as RowSet,
                pane.height,
                barWidth,
                primaryPriceScale,
                primaryRangeMin,
              );
            },
            drawPriceLines: () => {
              drawPriceLines(
                context,
                paneWidth,
                pane.height,
                primaryPriceScale,
                primaryPaneDecorations.priceLines,
                chartOptions as never,
                deps.getPriceAxisFormatter(),
              );
            },
            drawDrawings: (drawings) => {
              drawPaneDrawings(
                context,
                drawings as never,
                {
                  resolveDrawingTimeCoordinate: (time) =>
                    resolveDrawingTimeCoordinate(time, contextSnapshot.barSequence.axisBars, timeScale),
                  priceScale: primaryPriceScale,
                  selectedDrawingId,
                  hoveredDrawingId,
                  hoveredDrawingHandle,
                },
              );
            },
            primaryDrawings: primaryPaneDecorations.drawings,
            drawTradeLocationOverlay: () => {
              drawTradeLocationOverlay(
                context,
                primaryPaneDecorations.tradeLocationState,
                pane.height,
                timeScale,
                primaryPriceScale,
                {
                  backgroundColor: deps.backgroundColor(),
                },
              );
            },
            drawDrawingSnapGuide: () => {
              drawDrawingSnapGuide(
                context,
                paneWidth,
                pane.height,
                primaryPaneDecorations.snapGuide,
                {
                  priceScale: primaryPriceScale,
                  resolveDrawingTimeCoordinate: (time) =>
                    resolveDrawingTimeCoordinate(time, contextSnapshot.barSequence.axisBars, timeScale),
                },
              );
            },
            drawMarkers: (source, rows) => {
              drawSeriesMarkers(
                context,
                rows as never,
                (source as SeriesSourceLike).markers as never,
                timeScale,
                primaryPriceScale,
                pane.height,
                (source as SeriesSourceLike).kind as never,
              );
            },
          });
        }

        if (pane.kind === "secondary") {
          const paneSeries = deps.getSecondarySeriesForPane(pane.id);
          const secondaryPaneDecorations = buildSecondaryPaneDecorationsUseCase({
            paneId: pane.id,
            sources: paneSeries as never,
            drawings: deps.getDrawingsByPane(pane.id) as never,
            drawingSnapGuide: drawingSnapGuide as never,
          });
          const panePriceScale = deps.getSecondaryScale(pane.id);
          const { hasPriceScale, rangeMin } = applySecondaryPaneScaleUseCase({
            paneSeries: paneSeries as never,
            secondaryRows,
            paneHeight: pane.height,
            priceScale: panePriceScale,
          });
          renderSecondaryPaneContentUseCase({
            paneSeries,
            hasPriceScale,
            rowsFor: (source) => secondaryRows.get(source.id),
            hasRows: (rows) => (rows?.length ?? 0) > 0,
            applyPriceScaleRange: () => {},
            renderSeries: (source, rows) => {
              owner.renderSeriesSource(
                context,
                source as SeriesSourceLike,
                rows as RowSet,
                pane.height,
                barWidth,
                (source as SeriesSourceLike).priceScale,
                rangeMin,
              );
            },
            drawPriceLines: () => {
              if (panePriceScale !== undefined) {
                drawPriceLines(
                  context,
                  paneWidth,
                  pane.height,
                  panePriceScale,
                  secondaryPaneDecorations.priceLines,
                  chartOptions as never,
                  deps.getPriceAxisFormatter(),
                );
              }
            },
            drawDrawings: (drawings) => {
              if (panePriceScale !== undefined) {
                drawPaneDrawings(
                  context,
                  drawings as never,
                  {
                    resolveDrawingTimeCoordinate: (time) =>
                      resolveDrawingTimeCoordinate(time, contextSnapshot.barSequence.axisBars, timeScale),
                    priceScale: panePriceScale,
                    selectedDrawingId,
                    hoveredDrawingId,
                    hoveredDrawingHandle,
                  },
                );
              }
            },
            paneDrawings: secondaryPaneDecorations.drawings,
            drawDrawingSnapGuide: () => {
              if (panePriceScale !== undefined) {
                drawDrawingSnapGuide(
                  context,
                  paneWidth,
                  pane.height,
                  secondaryPaneDecorations.snapGuide,
                  {
                    priceScale: panePriceScale,
                    resolveDrawingTimeCoordinate: (time) =>
                      resolveDrawingTimeCoordinate(time, contextSnapshot.barSequence.axisBars, timeScale),
                  },
                );
              }
            },
            drawMarkers: (source, rows) => {
              drawSeriesMarkers(
                context,
                rows as never,
                (source as SeriesSourceLike).markers as never,
                timeScale,
                (source as SeriesSourceLike).priceScale,
                pane.height,
                (source as SeriesSourceLike).kind as never,
              );
            },
          });
        }

        context.restore();

        renderPaneChromeUseCase({
          pane,
          activePane,
          crosshair,
          primarySources,
          primaryRowSets,
          getSecondarySeriesForPane: (paneId) => deps.getSecondarySeriesForPane(paneId),
          buildReadoutSeriesForPrimary: (nextPrimarySources, rowSets, nextCrosshair) =>
            owner.buildReadoutSeriesForPrimary(
              nextPrimarySources as readonly SeriesSourceLike[],
              rowSets as ReadonlyMap<string, RowSet>,
              nextCrosshair,
            ),
          buildReadoutSeriesForPane: (paneSeries, nextCrosshair) =>
            owner.buildReadoutSeriesForPane(paneSeries as readonly SeriesSourceLike[], nextCrosshair),
          drawLegend: (entries) => {
            deps.drawPaneLegend(context, entries);
          },
          drawCrosshair: (localCrosshair) => {
            deps.drawCrosshair(context, paneWidth, pane.height, localCrosshair, deps.getCrosshairOptions());
          },
          drawFrameBorder: () => {
            context.strokeStyle = chartOptions.frameColor;
            context.strokeRect(0.5, 0.5, paneWidth - 1, pane.height - 1);
          },
        });
        context.restore();
      }

      renderPriceAxesUseCase({
        paneFrames,
        activePane,
        crosshair,
        hasPrimaryRows: primaryRows.length > 0,
        findPrimaryPane: (panes) => panes.find((pane) => pane.kind === "primary"),
        drawPrimaryAxis: (pane, localCrosshair) => {
          drawPriceAxis(
            context,
            layout,
            pane.top,
            pane.height,
            primaryPriceScale,
            localCrosshair,
            chartOptions as never,
            "primary",
            deps.getPriceAxisFormatter(),
            drawingOptions.magnetLabelVisible
              && drawingSnapGuide?.paneId === "primary"
              && drawingSnapGuide.price !== null
              ? buildMagnetAxisTag(
                  layout,
                  pane.top,
                  primaryPriceScale,
                  drawingSnapGuide as never,
                  deps.getPriceAxisFormatter(),
                )
              : null,
          );
        },
        getSecondaryAxisState: (paneId) => deps.getSecondarySeriesForPane(paneId)[0],
        secondaryPaneHasRows: (paneId) =>
          deps.getSecondarySeriesForPane(paneId).some(
            (entry) => (secondaryRows.get(entry.id)?.length ?? 0) > 0,
          ),
        drawSecondaryAxis: (pane, state, localCrosshair) => {
          drawPriceAxis(
            context,
            layout,
            pane.top,
            pane.height,
            (state as SeriesSourceLike).priceScale,
            localCrosshair,
            chartOptions as never,
            (state as SeriesSourceLike).kind === "volume" ? "volume" : "primary",
            deps.getPriceAxisFormatter(),
            drawingOptions.magnetLabelVisible
              && drawingSnapGuide?.paneId === pane.id
              && drawingSnapGuide.price !== null
              ? buildMagnetAxisTag(
                  layout,
                  pane.top,
                  (state as SeriesSourceLike).priceScale,
                  drawingSnapGuide as never,
                  deps.getPriceAxisFormatter(),
                )
              : null,
          );
        },
      });

      const firstSecondaryRows = secondaryRows.values().next().value;
      finishChartRenderUseCase({
        primaryRows: primaryTimeAxisRows,
        firstSecondaryRows,
        hasRows: (rows) => (rows?.length ?? 0) > 0,
        renderTimeAxis: (rows) => {
          renderTimeAxisUseCase({
            primaryRows: rows,
            firstSecondaryRows: undefined,
            hasRows: (nextRows) => (nextRows?.length ?? 0) > 0,
            draw: (timeAxisRows) => {
              drawTimeAxis(
                context,
                layout,
                timeAxisRows as never,
                timeScale,
                crosshair,
                chartOptions as never,
                deps.getTimeAxisFormatter(),
                drawingOptions.timeMagnetLabelVisible && drawingSnapGuide?.time != null
                  ? buildMagnetTimeAxisTag(
                      layout,
                      timeAxisRows as never,
                      timeScale,
                      drawingSnapGuide as never,
                      deps.getTimeAxisFormatter(),
                    )
                  : null,
              );
            },
          });
        },
        buildReadout: () => owner.buildReadout(crosshair, layout),
        publishReadout: (readout) => {
          deps.emitReadout(canvas, readout);
        },
        publishCrosshairMove: (readout) => {
          deps.emitCrosshairMove(readout);
        },
      });
    },
  };

  return owner;
}
