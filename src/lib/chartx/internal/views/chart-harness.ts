import {
  PlotRowValueIndex,
  PriceScale,
  SeriesDataStore,
  TimeScale,
  type OhlcDataPoint,
} from "../model";
import {
  BarRenderer,
  CandlesticksRenderer,
  GridRenderer,
  HistogramRenderer,
  LineRenderer,
  type BarItem,
  type CandlestickItem,
  type HistogramItem,
  type LineItem,
} from "../renderers";
import type { Coordinate } from "../model";

const CHART_BACKGROUND = "#fffdf7";
const PANE_BACKGROUND = "#fffaf0";
const GRID_COLOR = "rgba(16, 16, 16, 0.08)";
const FRAME_COLOR = "rgba(16, 16, 16, 0.18)";
const UP_COLOR = "#0c8f62";
const DOWN_COLOR = "#c7543e";
const WICK_COLOR = "rgba(16, 16, 16, 0.72)";
const LINE_COLOR = "#3f6fd8";
const CROSSHAIR_COLOR = "rgba(16, 16, 16, 0.5)";
const CROSSHAIR_POINT_COLOR = "#101010";
const AXIS_TEXT_COLOR = "rgba(16, 16, 16, 0.72)";
const AXIS_LABEL_BACKGROUND = "rgba(255, 253, 247, 0.96)";
const AXIS_LABEL_BORDER = "rgba(16, 16, 16, 0.14)";
const AXIS_ACTIVE_BACKGROUND = "#101010";
const AXIS_ACTIVE_TEXT = "#fffdf7";
const DEFAULT_RIGHT_OFFSET = 0.8;
const MIN_BAR_SPACING = 4;
const MAX_BAR_SPACING = 36;

export type PhaseOneCandlestickData = OhlcDataPoint<number>;
export type PhaseOneLineData = {
  time: number;
  value: number;
};
export type PhaseOneHistogramData = {
  time: number;
  value: number;
  color?: string;
  up?: boolean;
};
export type PhaseOneVolumeData = {
  time: number;
  value: number;
  color?: string;
  up?: boolean;
};
export type PhaseOneReadoutDetail = {
  active: boolean;
  time: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  price: number | null;
};

export type PhaseOneCrosshairMoveEvent = PhaseOneReadoutDetail & {
  point: PanePoint | null;
};

export type PhaseOneCrosshairMoveHandler = (event: PhaseOneCrosshairMoveEvent) => void;
export type PhaseOneClickEvent = PhaseOneReadoutDetail & {
  point: PanePoint | null;
};
export type PhaseOneClickHandler = (event: PhaseOneClickEvent) => void;
export type PhaseOneChartOptions = {
  layout?: {
    backgroundColor?: string;
    paneBackgroundColor?: string;
    gridColor?: string;
    frameColor?: string;
    axisTextColor?: string;
    axisLabelBackground?: string;
    axisLabelBorder?: string;
    axisActiveBackground?: string;
    axisActiveText?: string;
  };
  crosshair?: {
    lineColor?: string;
    pointColor?: string;
  };
};

export type PhaseOneCandlestickSeriesOptions = {
  upColor?: string;
  downColor?: string;
  wickColor?: string;
};

export type PhaseOneBarSeriesOptions = {
  upColor?: string;
  downColor?: string;
};

export type PhaseOneLineSeriesOptions = {
  color?: string;
  lineWidth?: number;
};

export type PhaseOneHistogramSeriesOptions = {
  upColor?: string;
  downColor?: string;
};

export type PhaseOneVolumeSeriesOptions = {
  upColor?: string;
  downColor?: string;
};

export type PhaseOnePaneKind = "primary" | "secondary";

export type PhaseOnePaneApi = {
  paneIndex(): number;
  getHeight(): number;
  getOptions(): Required<PhaseOnePaneOptions>;
  applyOptions(options: PhaseOnePaneOptions): void;
  setHeight(height: number): void;
  isPrimary(): boolean;
  isResizable(): boolean;
  subscribeResize(handler: PhaseOnePaneResizeHandler): void;
  unsubscribeResize(handler: PhaseOnePaneResizeHandler): void;
  hasSeries(): boolean;
  remove(): void;
};

export type PhaseOnePaneOptions = {
  height?: number;
  resizable?: boolean;
};

export type PhaseOneSeriesTarget = {
  pane?: number | PhaseOnePaneApi;
};

export type PhaseOneVolumeSeriesTarget = PhaseOneSeriesTarget;

export type PhaseOnePaneResizeEvent = {
  paneIndex: number;
  height: number;
  isPrimary: boolean;
};

export type PhaseOnePaneResizeHandler = (event: PhaseOnePaneResizeEvent) => void;

export type PhaseOnePaneEventType = "added" | "options" | "resized" | "removed";

export type PhaseOnePaneEvent = {
  type: PhaseOnePaneEventType;
  paneIndex: number;
  height: number;
  isPrimary: boolean;
  resizable: boolean;
  hasSeries: boolean;
};

export type PhaseOnePaneEventHandler = (event: PhaseOnePaneEvent) => void;

export type PhaseOneTimeScaleApi = {
  getVisibleLogicalRange(): { from: number; to: number } | null;
  applyOptions(options: { barSpacing?: number; rightOffset?: number }): void;
};

export type PhaseOnePriceScaleApi = {
  getVisibleRange(): { minValue: number; maxValue: number } | null;
};

export type PhaseOneCandlestickSeriesApi = {
  setData(data: readonly PhaseOneCandlestickData[]): void;
  update(bar: PhaseOneCandlestickData): void;
  applyOptions(options: PhaseOneCandlestickSeriesOptions): void;
};

export type PhaseOneBarSeriesApi = {
  setData(data: readonly PhaseOneCandlestickData[]): void;
  update(bar: PhaseOneCandlestickData): void;
  applyOptions(options: PhaseOneBarSeriesOptions): void;
};

export type PhaseOneLineSeriesApi = {
  setData(data: readonly PhaseOneLineData[]): void;
  update(bar: PhaseOneLineData): void;
  applyOptions(options: PhaseOneLineSeriesOptions): void;
};

export type PhaseOneHistogramSeriesApi = {
  setData(data: readonly PhaseOneHistogramData[]): void;
  update(bar: PhaseOneHistogramData): void;
  applyOptions(options: PhaseOneHistogramSeriesOptions): void;
};

export type PhaseOneVolumeSeriesApi = {
  setData(data: readonly PhaseOneVolumeData[]): void;
  update(bar: PhaseOneVolumeData): void;
  applyOptions(options: PhaseOneVolumeSeriesOptions): void;
};

export type PhaseOneChartApi = {
  addCandlestickSeries(target?: PhaseOneSeriesTarget): PhaseOneCandlestickSeriesApi;
  addBarSeries(target?: PhaseOneSeriesTarget): PhaseOneBarSeriesApi;
  addLineSeries(target?: PhaseOneSeriesTarget): PhaseOneLineSeriesApi;
  addHistogramSeries(target?: PhaseOneSeriesTarget): PhaseOneHistogramSeriesApi;
  addVolumeSeries(target?: PhaseOneVolumeSeriesTarget): PhaseOneVolumeSeriesApi;
  panes(): readonly PhaseOnePaneApi[];
  addPane(options?: PhaseOnePaneOptions): PhaseOnePaneApi;
  removePane(pane: PhaseOnePaneApi): void;
  applyOptions(options: PhaseOneChartOptions): void;
  removeSeries(
    series:
      | PhaseOneCandlestickSeriesApi
      | PhaseOneBarSeriesApi
      | PhaseOneLineSeriesApi
      | PhaseOneHistogramSeriesApi
      | PhaseOneVolumeSeriesApi,
  ): void;
  resize(width: number, height: number): void;
  timeScale(): PhaseOneTimeScaleApi;
  priceScale(): PhaseOnePriceScaleApi;
  subscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void;
  unsubscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void;
  subscribeClick(handler: PhaseOneClickHandler): void;
  unsubscribeClick(handler: PhaseOneClickHandler): void;
  subscribePaneEvents(handler: PhaseOnePaneEventHandler): void;
  unsubscribePaneEvents(handler: PhaseOnePaneEventHandler): void;
  destroy(): void;
};

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
};

type DragState = {
  startClientX: number;
  startRightOffset: number;
};

type PaneResizeState = {
  dividerAfterPaneId: string;
  dividerBeforePaneId: string;
  startClientY: number;
  startUpperHeight: number;
  startLowerHeight: number;
};

type AxisTag = {
  text: string;
  x: number;
  y: number;
  active?: boolean;
};

type HistogramVisual = {
  color?: string;
  isUp: boolean;
};

type SecondarySeriesKind = "candlestick" | "line" | "bar" | "histogram" | "volume";

type SecondarySeriesState = {
  paneId: string;
  kind: SecondarySeriesKind;
  api:
    | PhaseOneCandlestickSeriesApi
    | PhaseOneBarSeriesApi
    | PhaseOneLineSeriesApi
    | PhaseOneHistogramSeriesApi
    | PhaseOneVolumeSeriesApi;
  data: readonly PhaseOneCandlestickData[];
  store: SeriesDataStore<number>;
  priceScale: PriceScale;
  visuals: Map<number, HistogramVisual>;
};

type PaneFrame = {
  id: string;
  kind: PhaseOnePaneKind;
  top: number;
  height: number;
};

type PaneSpec = {
  id: string;
  kind: PhaseOnePaneKind;
  preferredHeight: number | null;
  resizable: boolean;
};

type ResolvedSeriesTarget =
  | { kind: "primary" }
  | { kind: "secondary"; paneId: string };

const DEFAULT_LAYOUT: Layout = {
  width: 960,
  height: 520,
  top: 28,
  right: 18,
  bottom: 34,
  left: 18,
};

const PANE_GAP = 10;
const PANE_DIVIDER_HIT_SLOP = 6;

export class PhaseOneChartHarness {
  private readonly paneHandleIds = new WeakMap<PhaseOnePaneApi, string>();
  private readonly paneResizeHandlers = new Map<string, Set<PhaseOnePaneResizeHandler>>();
  private readonly paneEventHandlers = new Set<PhaseOnePaneEventHandler>();
  private readonly primaryStore = new SeriesDataStore<number>();
  private readonly timeScale = new TimeScale();
  private readonly primaryPriceScale = new PriceScale();
  private readonly barRenderer = new BarRenderer();
  private readonly candlesRenderer = new CandlesticksRenderer();
  private readonly gridRenderer = new GridRenderer();
  private readonly histogramRenderer = new HistogramRenderer();
  private readonly lineRenderer = new LineRenderer();
  private primaryData: readonly PhaseOneCandlestickData[] = [];
  private readonly panes: PaneSpec[] = [{ id: "primary", kind: "primary", preferredHeight: null, resizable: false }];
  private nextPaneId = 1;
  private primarySeriesType: "candlestick" | "bar" | "line" | "histogram" | null = null;
  private currentPrimarySeriesApi:
    | PhaseOneCandlestickSeriesApi
    | PhaseOneBarSeriesApi
    | PhaseOneLineSeriesApi
    | PhaseOneHistogramSeriesApi
    | null = null;
  private readonly secondarySeries = new Map<string, SecondarySeriesState>();
  private canvas: HTMLCanvasElement | null = null;
  private crosshair: PanePoint | null = null;
  private barSpacing: number | null = null;
  private rightOffset = DEFAULT_RIGHT_OFFSET;
  private readonly chartOptions: Required<NonNullable<PhaseOneChartOptions["layout"]>> = {
    backgroundColor: CHART_BACKGROUND,
    paneBackgroundColor: PANE_BACKGROUND,
    gridColor: GRID_COLOR,
    frameColor: FRAME_COLOR,
    axisTextColor: AXIS_TEXT_COLOR,
    axisLabelBackground: AXIS_LABEL_BACKGROUND,
    axisLabelBorder: AXIS_LABEL_BORDER,
    axisActiveBackground: AXIS_ACTIVE_BACKGROUND,
    axisActiveText: AXIS_ACTIVE_TEXT,
  };
  private readonly crosshairOptions: Required<NonNullable<PhaseOneChartOptions["crosshair"]>> = {
    lineColor: CROSSHAIR_COLOR,
    pointColor: CROSSHAIR_POINT_COLOR,
  };
  private readonly candlestickOptions: Required<PhaseOneCandlestickSeriesOptions> = {
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
    wickColor: WICK_COLOR,
  };
  private readonly barOptions: Required<PhaseOneBarSeriesOptions> = {
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
  private readonly lineOptions: Required<PhaseOneLineSeriesOptions> = {
    color: LINE_COLOR,
    lineWidth: 2,
  };
  private readonly histogramOptions: Required<PhaseOneHistogramSeriesOptions> = {
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
  private readonly volumeOptions: Required<PhaseOneVolumeSeriesOptions> = {
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
  private primaryHistogramVisuals = new Map<number, HistogramVisual>();
  private manualLayout: Pick<Layout, "width" | "height"> | null = null;
  private dragState: DragState | null = null;
  private paneResizeState: PaneResizeState | null = null;
  private readonly crosshairMoveHandlers = new Set<PhaseOneCrosshairMoveHandler>();
  private readonly clickHandlers = new Set<PhaseOneClickHandler>();
  private readonly handleResize = () => {
    if (this.canvas !== null && this.manualLayout === null) {
      this.render(this.canvas);
    }
  };
  private readonly handlePointerMove = (event: PointerEvent) => {
    if (this.canvas === null) {
      return;
    }

    const layout = measureLayout(this.canvas);
    const paneFrames = buildPaneFrames(this.panes, layout.height - layout.top - layout.bottom);
    if (this.paneResizeState !== null) {
      this.applyPaneResize(event.clientY, layout, paneFrames);
      this.crosshair = resolvePanePoint(this.canvas, event, layout);
      this.render(this.canvas);
      return;
    }

    const pointCount = this.getPointCount();
    if (this.dragState !== null && pointCount > 0) {
      const paneWidth = layout.width - layout.left - layout.right;
      const spacing = resolveBarSpacing(this.barSpacing, paneWidth, pointCount);
      const deltaBars = (event.clientX - this.dragState.startClientX) / spacing;
      this.rightOffset = this.dragState.startRightOffset - deltaBars;
    }

    const divider = resolvePaneDivider(this.panes, paneFrames, resolvePanePoint(this.canvas, event, layout)?.y ?? null);
    this.canvas.style.cursor = divider === null ? (this.dragState === null ? "crosshair" : "grabbing") : "row-resize";

    this.crosshair = resolvePanePoint(this.canvas, event, layout);
    this.render(this.canvas);
  };
  private readonly handlePointerLeave = () => {
    if (this.canvas === null || this.crosshair === null || this.dragState !== null || this.paneResizeState !== null) {
      return;
    }

    this.crosshair = null;
    this.canvas.style.cursor = "default";
    this.render(this.canvas);
  };
  private readonly handlePointerDown = (event: PointerEvent) => {
    if (this.canvas === null || this.getPointCount() === 0) {
      return;
    }

    const layout = measureLayout(this.canvas);
    const paneFrames = buildPaneFrames(this.panes, layout.height - layout.top - layout.bottom);
    const point = resolvePanePoint(this.canvas, event, layout);
    const divider = resolvePaneDivider(this.panes, paneFrames, point?.y ?? null);
    if (divider !== null) {
      this.paneResizeState = {
        dividerAfterPaneId: divider.upperPaneId,
        dividerBeforePaneId: divider.lowerPaneId,
        startClientY: event.clientY,
        startUpperHeight: divider.upperHeight,
        startLowerHeight: divider.lowerHeight,
      };
      this.canvas.style.cursor = "row-resize";
      this.canvas.setPointerCapture(event.pointerId);
      return;
    }

    this.dragState = {
      startClientX: event.clientX,
      startRightOffset: this.rightOffset,
    };
    this.canvas.style.cursor = "grabbing";
    this.canvas.setPointerCapture(event.pointerId);
  };
  private readonly handlePointerUp = (event: PointerEvent) => {
    if (this.canvas === null) {
      return;
    }

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.dragState = null;
    this.paneResizeState = null;
    this.canvas.style.cursor = this.crosshair === null ? "default" : "crosshair";
  };
  private readonly handleWheel = (event: WheelEvent) => {
    const pointCount = this.getPointCount();
    if (this.canvas === null || pointCount === 0) {
      return;
    }

    event.preventDefault();
    const layout = measureLayout(this.canvas);
    const paneWidth = layout.width - layout.left - layout.right;
    const baseSpacing = calculateBaseBarSpacing(paneWidth, pointCount);
    const currentSpacing = this.barSpacing ?? baseSpacing;
    const factor = event.deltaY < 0 ? 1.15 : 0.87;
    this.barSpacing = clamp(currentSpacing * factor, MIN_BAR_SPACING, MAX_BAR_SPACING);
    this.render(this.canvas);
  };
  private readonly handleClick = (event: MouseEvent) => {
    if (this.canvas === null) {
      return;
    }

    const layout = measureLayout(this.canvas, this.manualLayout);
    const point = resolvePanePoint(this.canvas, event, layout);
    const readout = this.buildReadout(point, layout);

    for (const handler of this.clickHandlers) {
      handler({
        ...readout,
        point,
      });
    }
  };

  public attach(canvas: HTMLCanvasElement): void {
    assertCanvasElement(canvas);
    this.canvas = canvas;
    this.canvas.style.cursor = "crosshair";
    this.render(canvas);
    window.addEventListener("resize", this.handleResize);
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("pointercancel", this.handlePointerUp);
    canvas.addEventListener("pointerleave", this.handlePointerLeave);
    canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    canvas.addEventListener("click", this.handleClick);
  }

  public detach(): void {
    if (this.canvas !== null) {
      this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
      this.canvas.removeEventListener("pointermove", this.handlePointerMove);
      this.canvas.removeEventListener("pointerup", this.handlePointerUp);
      this.canvas.removeEventListener("pointercancel", this.handlePointerUp);
      this.canvas.removeEventListener("pointerleave", this.handlePointerLeave);
      this.canvas.removeEventListener("wheel", this.handleWheel);
      this.canvas.removeEventListener("click", this.handleClick);
    }
    window.removeEventListener("resize", this.handleResize);
    this.canvas = null;
    this.crosshair = null;
    this.dragState = null;
    this.paneResizeState = null;
    this.crosshairMoveHandlers.clear();
    this.clickHandlers.clear();
    this.paneResizeHandlers.clear();
    this.paneEventHandlers.clear();
  }

  public addCandlestickSeries(target?: PhaseOneSeriesTarget): PhaseOneCandlestickSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "secondary") {
      return this.addSecondaryCandlestickSeries(resolved.paneId);
    }

    return this.addPrimaryCandlestickSeries();
  }

  private addPrimaryCandlestickSeries(): PhaseOneCandlestickSeriesApi {
    if (this.currentPrimarySeriesApi !== null) {
      throw new Error("chartx phase-one chart supports only one primary series");
    }

    this.primarySeriesType = "candlestick";
    this.primaryHistogramVisuals.clear();
    const api: PhaseOneCandlestickSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setPrimaryData(data);
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updatePrimary(bar);
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        if (options.upColor !== undefined) {
          this.candlestickOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          this.candlestickOptions.downColor = options.downColor;
        }
        if (options.wickColor !== undefined) {
          this.candlestickOptions.wickColor = options.wickColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
    this.currentPrimarySeriesApi = api;
    return api;
  }

  public addLineSeries(target?: PhaseOneSeriesTarget): PhaseOneLineSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryLineSeries();
    }
    return this.addSecondaryLineSeries(resolved.paneId);
  }

  public addBarSeries(target?: PhaseOneSeriesTarget): PhaseOneBarSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryBarSeries();
    }
    return this.addSecondaryBarSeries(resolved.paneId);
  }

  public addHistogramSeries(target?: PhaseOneSeriesTarget): PhaseOneHistogramSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryHistogramSeries();
    }
    return this.addSecondaryHistogramSeries(resolved.paneId);
  }

  public addVolumeSeries(target?: PhaseOneVolumeSeriesTarget): PhaseOneVolumeSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: true, allowPrimary: false });
    if (resolved.kind === "primary") {
      throw new Error("chartx phase-one chart volume series requires a secondary pane");
    }
    return this.addSecondaryVolumeSeries(resolved.paneId);
  }

  public removeSeries(
    series:
      | PhaseOneCandlestickSeriesApi
      | PhaseOneBarSeriesApi
      | PhaseOneLineSeriesApi
      | PhaseOneHistogramSeriesApi
      | PhaseOneVolumeSeriesApi,
  ): void {
    if (this.currentPrimarySeriesApi === series) {
      this.currentPrimarySeriesApi = null;
      this.primarySeriesType = null;
      this.primaryData = [];
      this.primaryHistogramVisuals.clear();
    } else {
      const state = Array.from(this.secondarySeries.values()).find((entry) => entry.api === series);
      if (state === undefined) {
        throw new Error("chartx phase-one chart can remove only the currently attached series");
      }
      this.secondarySeries.delete(state.paneId);
    }
    this.crosshair = null;
    this.barSpacing = null;
    this.rightOffset = DEFAULT_RIGHT_OFFSET;

    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  public panesApi(): readonly PhaseOnePaneApi[] {
    return this.panes.map((pane) => this.createPaneHandle(pane.id));
  }

  public addPane(options: PhaseOnePaneOptions = {}): PhaseOnePaneApi {
    const pane: PaneSpec = {
      id: `pane-${this.nextPaneId}`,
      kind: "secondary",
      preferredHeight: normalizePaneHeight(options.height),
      resizable: options.resizable ?? true,
    };
    this.nextPaneId += 1;
    this.panes.push(pane);
    this.emitPaneEvent("added", pane.id);
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
    return this.createPaneHandle(pane.id);
  }

  public removePaneByHandle(paneHandle: PhaseOnePaneApi): void {
    const paneId = this.paneHandleIds.get(paneHandle);
    if (paneId === undefined) {
      throw new Error("chartx phase-one chart removePane requires a pane handle created by this chart");
    }

    this.removePaneById(paneId);
  }

  public applyOptions(options: PhaseOneChartOptions): void {
    if (options.layout?.backgroundColor !== undefined) {
      this.chartOptions.backgroundColor = options.layout.backgroundColor;
    }
    if (options.layout?.paneBackgroundColor !== undefined) {
      this.chartOptions.paneBackgroundColor = options.layout.paneBackgroundColor;
    }
    if (options.layout?.gridColor !== undefined) {
      this.chartOptions.gridColor = options.layout.gridColor;
    }
    if (options.layout?.frameColor !== undefined) {
      this.chartOptions.frameColor = options.layout.frameColor;
    }
    if (options.layout?.axisTextColor !== undefined) {
      this.chartOptions.axisTextColor = options.layout.axisTextColor;
    }
    if (options.layout?.axisLabelBackground !== undefined) {
      this.chartOptions.axisLabelBackground = options.layout.axisLabelBackground;
    }
    if (options.layout?.axisLabelBorder !== undefined) {
      this.chartOptions.axisLabelBorder = options.layout.axisLabelBorder;
    }
    if (options.layout?.axisActiveBackground !== undefined) {
      this.chartOptions.axisActiveBackground = options.layout.axisActiveBackground;
    }
    if (options.layout?.axisActiveText !== undefined) {
      this.chartOptions.axisActiveText = options.layout.axisActiveText;
    }
    if (options.crosshair?.lineColor !== undefined) {
      this.crosshairOptions.lineColor = options.crosshair.lineColor;
    }
    if (options.crosshair?.pointColor !== undefined) {
      this.crosshairOptions.pointColor = options.crosshair.pointColor;
    }

    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  public resize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error("chartx phase-one chart resize requires positive finite width and height");
    }

    this.manualLayout = {
      width: Math.round(width),
      height: Math.round(height),
    };
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  public timeScaleApi(): PhaseOneTimeScaleApi {
    return {
      getVisibleLogicalRange: () => {
        const range = this.timeScale.visibleLogicalRange().logicalRange();
        if (range === null) {
          return null;
        }

        return {
          from: range.left(),
          to: range.right(),
        };
      },
      applyOptions: (options) => {
        if (options.barSpacing !== undefined) {
          this.barSpacing = clamp(options.barSpacing, MIN_BAR_SPACING, MAX_BAR_SPACING);
        }
        if (options.rightOffset !== undefined) {
          this.rightOffset = options.rightOffset;
        }

        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
  }

  public priceScaleApi(): PhaseOnePriceScaleApi {
    return {
      getVisibleRange: () =>
        this.primaryPriceScale.getPriceRange()?.toRaw() ??
        Array.from(this.secondarySeries.values())[0]?.priceScale.getPriceRange()?.toRaw() ??
        null,
    };
  }

  public subscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void {
    this.crosshairMoveHandlers.add(handler);
  }

  public unsubscribeCrosshairMove(handler: PhaseOneCrosshairMoveHandler): void {
    this.crosshairMoveHandlers.delete(handler);
  }

  public subscribeClick(handler: PhaseOneClickHandler): void {
    this.clickHandlers.add(handler);
  }

  public unsubscribeClick(handler: PhaseOneClickHandler): void {
    this.clickHandlers.delete(handler);
  }

  public subscribePaneEvents(handler: PhaseOnePaneEventHandler): void {
    this.paneEventHandlers.add(handler);
  }

  public unsubscribePaneEvents(handler: PhaseOnePaneEventHandler): void {
    this.paneEventHandlers.delete(handler);
  }

  public setData(data: readonly PhaseOneCandlestickData[]): void {
    this.setPrimaryData(data);
  }

  public update(bar: PhaseOneCandlestickData): void {
    this.updatePrimary(bar);
  }

  private setPrimaryData(data: readonly PhaseOneCandlestickData[]): void {
    if (this.currentPrimarySeriesApi === null) {
      throw new Error("chartx phase-one chart requires a primary series before setData");
    }

    this.primaryData = [...data];
    this.primaryHistogramVisuals.clear();
    this.barSpacing = null;
    this.rightOffset = DEFAULT_RIGHT_OFFSET;
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private updatePrimary(bar: PhaseOneCandlestickData): void {
    if (this.currentPrimarySeriesApi === null) {
      throw new Error("chartx phase-one chart requires a primary series before update");
    }

    this.primaryData = this.primaryStore.update(bar).map((row) => ({
      time: row.time,
      open: row.value[PlotRowValueIndex.Open],
      high: row.value[PlotRowValueIndex.High],
      low: row.value[PlotRowValueIndex.Low],
      close: row.value[PlotRowValueIndex.Close],
    }));
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private setPrimaryHistogramLikeData(
    data: readonly PhaseOneHistogramData[],
  ): void {
    this.primaryHistogramVisuals = buildHistogramVisuals(data);
    this.setPrimaryData(normalizeHistogramData(data));
  }

  private updatePrimaryHistogramLike(bar: PhaseOneHistogramData): void {
    const previous = this.primaryData.length === 0 ? null : this.primaryData[this.primaryData.length - 1];
    this.primaryHistogramVisuals.set(bar.time, {
      color: bar.color,
      isUp:
        bar.up ??
        (previous === null || bar.time <= previous.time
          ? (this.primaryHistogramVisuals.get(bar.time)?.isUp ?? true)
          : bar.value >= previous.close),
    });
    this.updatePrimary(normalizeHistogramBar(bar));
  }

  private getPointCount(): number {
    let pointCount = this.primaryData.length;
    for (const state of this.secondarySeries.values()) {
      pointCount = Math.max(pointCount, state.data.length);
    }
    return pointCount;
  }

  private addPrimaryLineSeries(): PhaseOneLineSeriesApi {
    if (this.currentPrimarySeriesApi !== null) {
      throw new Error("chartx phase-one chart supports only one primary series");
    }

    this.primarySeriesType = "line";
    this.primaryHistogramVisuals.clear();
    const api: PhaseOneLineSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setPrimaryData(normalizeLineData(data));
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updatePrimary(normalizeLineBar(bar));
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        if (options.color !== undefined) {
          this.lineOptions.color = options.color;
        }
        if (options.lineWidth !== undefined) {
          this.lineOptions.lineWidth = Math.max(1, options.lineWidth);
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
    this.currentPrimarySeriesApi = api;
    return api;
  }

  private addPrimaryBarSeries(): PhaseOneBarSeriesApi {
    if (this.currentPrimarySeriesApi !== null) {
      throw new Error("chartx phase-one chart supports only one primary series");
    }

    this.primarySeriesType = "bar";
    this.primaryHistogramVisuals.clear();
    const api: PhaseOneBarSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setPrimaryData(data);
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updatePrimary(bar);
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        if (options.upColor !== undefined) {
          this.barOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          this.barOptions.downColor = options.downColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
    this.currentPrimarySeriesApi = api;
    return api;
  }

  private addPrimaryHistogramSeries(): PhaseOneHistogramSeriesApi {
    if (this.currentPrimarySeriesApi !== null) {
      throw new Error("chartx phase-one chart supports only one primary series");
    }

    this.primarySeriesType = "histogram";
    const api: PhaseOneHistogramSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setPrimaryHistogramLikeData(data);
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updatePrimaryHistogramLike(bar);
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        if (options.upColor !== undefined) {
          this.histogramOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          this.histogramOptions.downColor = options.downColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
    this.currentPrimarySeriesApi = api;
    return api;
  }

  private addSecondaryCandlestickSeries(target: string): PhaseOneCandlestickSeriesApi {
    const api: PhaseOneCandlestickSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setSecondaryData(api, data, "candlestick");
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updateSecondary(api, bar, "candlestick");
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        if (options.upColor !== undefined) {
          this.candlestickOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          this.candlestickOptions.downColor = options.downColor;
        }
        if (options.wickColor !== undefined) {
          this.candlestickOptions.wickColor = options.wickColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
    this.attachSecondarySeries(target, "candlestick", api);
    return api;
  }

  private addSecondaryLineSeries(paneId: string): PhaseOneLineSeriesApi {
    const api: PhaseOneLineSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setSecondaryData(api, normalizeLineData(data), "line");
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updateSecondary(api, normalizeLineBar(bar), "line");
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        if (options.color !== undefined) {
          this.lineOptions.color = options.color;
        }
        if (options.lineWidth !== undefined) {
          this.lineOptions.lineWidth = Math.max(1, options.lineWidth);
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
    this.attachSecondarySeries(paneId, "line", api);
    return api;
  }

  private addSecondaryBarSeries(paneId: string): PhaseOneBarSeriesApi {
    const api: PhaseOneBarSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setSecondaryData(api, data, "bar");
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updateSecondary(api, bar, "bar");
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        if (options.upColor !== undefined) {
          this.barOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          this.barOptions.downColor = options.downColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
    this.attachSecondarySeries(paneId, "bar", api);
    return api;
  }

  private addSecondaryHistogramSeries(paneId: string): PhaseOneHistogramSeriesApi {
    const api: PhaseOneHistogramSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setSecondaryHistogramLikeData(api, data, "histogram");
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updateSecondaryHistogramLike(api, bar, "histogram");
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        if (options.upColor !== undefined) {
          this.histogramOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          this.histogramOptions.downColor = options.downColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
    this.attachSecondarySeries(paneId, "histogram", api);
    return api;
  }

  private addSecondaryVolumeSeries(paneId: string): PhaseOneVolumeSeriesApi {
    const api: PhaseOneVolumeSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setSecondaryHistogramLikeData(api, data, "volume");
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updateSecondaryHistogramLike(api, bar, "volume");
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        if (options.upColor !== undefined) {
          this.volumeOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          this.volumeOptions.downColor = options.downColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
    this.attachSecondarySeries(paneId, "volume", api);
    return api;
  }

  private attachSecondarySeries(
    paneId: string,
    kind: SecondarySeriesKind,
    api: SecondarySeriesState["api"],
  ): void {
    const existing = this.secondarySeries.get(paneId);
    if (existing !== undefined) {
      throw new Error("chartx phase-one chart supports only one series per secondary pane");
    }

    this.secondarySeries.set(paneId, {
      paneId,
      kind,
      api,
      data: [],
      store: new SeriesDataStore<number>(),
      priceScale: new PriceScale(),
      visuals: new Map<number, HistogramVisual>(),
    });
  }

  private setSecondaryData(
    api: SecondarySeriesState["api"],
    data: readonly PhaseOneCandlestickData[],
    kind: SecondarySeriesKind,
  ): void {
    const state = this.getSecondaryStateByApi(api, kind);
    state.data = [...data];
    state.visuals.clear();
    this.barSpacing = null;
    this.rightOffset = DEFAULT_RIGHT_OFFSET;
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private updateSecondary(
    api: SecondarySeriesState["api"],
    bar: PhaseOneCandlestickData,
    kind: SecondarySeriesKind,
  ): void {
    const state = this.getSecondaryStateByApi(api, kind);
    state.data = state.store.update(bar).map((row) => ({
      time: row.time,
      open: row.value[PlotRowValueIndex.Open],
      high: row.value[PlotRowValueIndex.High],
      low: row.value[PlotRowValueIndex.Low],
      close: row.value[PlotRowValueIndex.Close],
    }));
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private setSecondaryHistogramLikeData(
    api: SecondarySeriesState["api"],
    data: readonly PhaseOneHistogramData[] | readonly PhaseOneVolumeData[],
    kind: SecondarySeriesKind,
  ): void {
    const state = this.getSecondaryStateByApi(api, kind);
    state.visuals = buildHistogramVisuals(data);
    this.setSecondaryData(api, normalizeHistogramData(data), kind);
  }

  private updateSecondaryHistogramLike(
    api: SecondarySeriesState["api"],
    bar: PhaseOneHistogramData | PhaseOneVolumeData,
    kind: SecondarySeriesKind,
  ): void {
    const state = this.getSecondaryStateByApi(api, kind);
    const previous = state.data.length === 0 ? null : state.data[state.data.length - 1];
    state.visuals.set(bar.time, {
      color: bar.color,
      isUp:
        bar.up ??
        (previous === null || bar.time <= previous.time
          ? (state.visuals.get(bar.time)?.isUp ?? true)
          : bar.value >= previous.close),
    });
    this.updateSecondary(api, normalizeHistogramBar(bar), kind);
  }

  private getSecondaryStateByApi(
    api: SecondarySeriesState["api"],
    kind?: SecondarySeriesKind,
  ): SecondarySeriesState {
    const state = Array.from(this.secondarySeries.values()).find((entry) => entry.api === api);
    if (state === undefined) {
      throw new Error("chartx phase-one series has been removed");
    }
    if (kind !== undefined && state.kind !== kind) {
      throw new Error("chartx phase-one series is attached to an unexpected secondary pane kind");
    }
    return state;
  }

  private createPaneHandle(paneId: string): PhaseOnePaneApi {
    const pane: PhaseOnePaneApi = {
      paneIndex: () => this.getPaneIndex(paneId),
      getHeight: () => this.getPaneHeight(paneId),
      getOptions: () => this.getPaneOptions(paneId),
      applyOptions: (options) => {
        this.applyPaneOptions(paneId, options);
      },
      setHeight: (height) => {
        this.setPaneHeight(paneId, height);
      },
      isPrimary: () => this.getPaneById(paneId)?.kind === "primary",
      isResizable: () => this.getPaneById(paneId)?.resizable ?? false,
      subscribeResize: (handler) => {
        this.subscribePaneResize(paneId, handler);
      },
      unsubscribeResize: (handler) => {
        this.unsubscribePaneResize(paneId, handler);
      },
      hasSeries: () => this.paneHasSeries(paneId),
      remove: () => {
        this.removePaneById(paneId);
      },
    };
    this.paneHandleIds.set(pane, paneId);
    return pane;
  }

  private subscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void {
    if (this.getPaneById(paneId) === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }
    const handlers = this.paneResizeHandlers.get(paneId) ?? new Set<PhaseOnePaneResizeHandler>();
    handlers.add(handler);
    this.paneResizeHandlers.set(paneId, handlers);
  }

  private unsubscribePaneResize(paneId: string, handler: PhaseOnePaneResizeHandler): void {
    const handlers = this.paneResizeHandlers.get(paneId);
    if (handlers === undefined) {
      return;
    }
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.paneResizeHandlers.delete(paneId);
    }
  }

  private getPaneById(paneId: string): PaneSpec | undefined {
    return this.panes.find((pane) => pane.id === paneId);
  }

  private getPaneIndex(paneId: string): number {
    const index = this.panes.findIndex((pane) => pane.id === paneId);
    if (index === -1) {
      throw new Error("chartx phase-one pane has been removed");
    }
    return index;
  }

  private getPaneHeight(paneId: string): number {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }

    if (this.canvas === null) {
      return pane.preferredHeight ?? 0;
    }

    const layout = measureLayout(this.canvas, this.manualLayout);
    const frames = buildPaneFrames(this.panes, layout.height - layout.top - layout.bottom);
    const frame = frames.find((entry) => entry.id === paneId);
    if (frame === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }

    return frame.height;
  }

  private getPaneOptions(paneId: string): Required<PhaseOnePaneOptions> {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }

    return {
      height: pane.preferredHeight ?? 0,
      resizable: pane.resizable,
    };
  }

  private applyPaneOptions(paneId: string, options: PhaseOnePaneOptions): void {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }

    let optionsChanged = false;
    if (options.resizable !== undefined) {
      if (pane.kind === "primary") {
        throw new Error("chartx phase-one chart does not support changing primary pane resizability");
      }
      if (pane.resizable !== options.resizable) {
        pane.resizable = options.resizable;
        optionsChanged = true;
      }
    }

    if (options.height !== undefined) {
      this.setPaneHeight(paneId, options.height);
      if (optionsChanged) {
        this.emitPaneEvent("options", paneId);
      }
      return;
    }

    if (optionsChanged) {
      this.emitPaneEvent("options", paneId);
    }
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private setPaneHeight(paneId: string, height: number): void {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }
    if (pane.kind === "primary") {
      throw new Error("chartx phase-one chart does not support setting the primary pane height directly");
    }

    const nextHeight = normalizePaneHeight(height);
    const previousHeight = pane.preferredHeight;
    pane.preferredHeight = nextHeight;
    if (previousHeight !== nextHeight) {
      this.emitPaneResize(paneId);
      this.emitPaneEvent("resized", paneId);
    }
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private applyPaneResize(clientY: number, layout: Layout, paneFrames: readonly PaneFrame[]): void {
    if (this.paneResizeState === null) {
      return;
    }

    const delta = Math.round(clientY - this.paneResizeState.startClientY);
    const upperPane = this.getPaneById(this.paneResizeState.dividerAfterPaneId);
    const lowerPane = this.getPaneById(this.paneResizeState.dividerBeforePaneId);
    if (upperPane === undefined || lowerPane === undefined) {
      return;
    }

    const controlsUpperPane = upperPane.kind === "secondary";
    const controlledPane = controlsUpperPane ? upperPane : lowerPane;
    if (!controlledPane.resizable) {
      return;
    }

    const minControlled = normalizePaneHeight(72);
    const startControlled = controlsUpperPane
      ? this.paneResizeState.startUpperHeight
      : this.paneResizeState.startLowerHeight;
    const requestedHeight = controlsUpperPane
      ? startControlled + delta
      : startControlled - delta;
    const minPrimaryHeight = 160;
    const totalResizableSpan = this.paneResizeState.startUpperHeight + this.paneResizeState.startLowerHeight;
    const maxControlled = Math.max(minControlled, totalResizableSpan - minPrimaryHeight);
    const nextControlled = clamp(Math.round(requestedHeight), minControlled, maxControlled);

    const previousHeight = controlledPane.preferredHeight;
    controlledPane.preferredHeight = normalizePaneHeight(nextControlled);
    if (previousHeight !== controlledPane.preferredHeight) {
      this.emitPaneResize(controlledPane.id);
      this.emitPaneEvent("resized", controlledPane.id);
    }

    if (this.canvas !== null) {
      const updatedFrames = buildPaneFrames(this.panes, layout.height - layout.top - layout.bottom);
      const divider = resolvePaneDividerByIds(
        updatedFrames,
        this.paneResizeState.dividerAfterPaneId,
        this.paneResizeState.dividerBeforePaneId,
      );
      if (divider !== null) {
        this.crosshair = {
          x: this.crosshair?.x ?? 0,
          y: divider.position,
        };
      }
    }
  }

  private paneHasSeries(paneId: string): boolean {
    if (paneId === "primary") {
      return this.currentPrimarySeriesApi !== null;
    }
    return this.secondarySeries.has(paneId);
  }

  private resolveSeriesTarget(
    target: PhaseOneSeriesTarget | PhaseOneVolumeSeriesTarget | undefined,
    options: { defaultToSecondary: boolean; allowPrimary: boolean },
  ): ResolvedSeriesTarget {
    if (target?.pane === undefined) {
      if (!options.defaultToSecondary) {
        return { kind: "primary" };
      }

      const existing = this.panes.find((pane) => pane.kind === "secondary" && !this.secondarySeries.has(pane.id))?.id;
      if (existing !== undefined) {
        return { kind: "secondary", paneId: existing };
      }

      const pane = this.addPane();
      const paneId = this.paneHandleIds.get(pane);
      if (paneId === undefined) {
        throw new Error("chartx phase-one chart failed to create a secondary pane");
      }
      return { kind: "secondary", paneId };
    }

    const pane =
      typeof target.pane === "number"
        ? this.panes[target.pane]
        : this.getPaneByHandle(target.pane);
    if (pane === undefined) {
      throw new Error("chartx phase-one chart series pane index is out of range");
    }

    if (pane.kind === "primary") {
      if (!options.allowPrimary) {
        throw new Error("chartx phase-one chart targeted series requires a secondary pane");
      }
      return { kind: "primary" };
    }

    if (this.secondarySeries.has(pane.id)) {
      throw new Error("chartx phase-one chart supports only one series per secondary pane");
    }
    return { kind: "secondary", paneId: pane.id };
  }

  private getPaneByHandle(handle: PhaseOnePaneApi): PaneSpec | undefined {
    const paneId = this.paneHandleIds.get(handle);
    if (paneId === undefined) {
      throw new Error("chartx phase-one chart pane handle must come from this chart");
    }
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }
    return pane;
  }

  private removePaneById(paneId: string): void {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      throw new Error("chartx phase-one pane has been removed");
    }
    if (pane.kind === "primary") {
      throw new Error("chartx phase-one chart cannot remove the primary pane");
    }
    if (this.secondarySeries.has(paneId)) {
      throw new Error("chartx phase-one chart cannot remove a pane while a series is still attached");
    }

    this.emitPaneEvent("removed", paneId);
    const index = this.getPaneIndex(paneId);
    this.panes.splice(index, 1);
    this.paneResizeHandlers.delete(paneId);
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private emitPaneResize(paneId: string): void {
    const handlers = this.paneResizeHandlers.get(paneId);
    if (handlers === undefined || handlers.size === 0) {
      return;
    }
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      return;
    }
    const event: PhaseOnePaneResizeEvent = {
      paneIndex: this.getPaneIndex(paneId),
      height: this.getPaneHeight(paneId),
      isPrimary: pane.kind === "primary",
    };
    for (const handler of handlers) {
      handler(event);
    }
  }

  private emitPaneEvent(type: PhaseOnePaneEventType, paneId: string): void {
    if (this.paneEventHandlers.size === 0) {
      return;
    }
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      return;
    }
    const event: PhaseOnePaneEvent = {
      type,
      paneIndex: this.getPaneIndex(paneId),
      height: this.getPaneHeight(paneId),
      isPrimary: pane.kind === "primary",
      resizable: pane.resizable,
      hasSeries: this.paneHasSeries(paneId),
    };
    for (const handler of this.paneEventHandlers) {
      handler(event);
    }
  }

  private buildReadout(point: PanePoint | null, layout: Layout): PhaseOneReadoutDetail {
    const primaryRows = this.primaryStore.setData(this.primaryData);
    const paneFrames = buildPaneFrames(this.panes, layout.height - layout.top - layout.bottom);
    const activePane = point === null ? null : resolveActivePane(paneFrames, point.y);
    const logicalPoint = point === null ? null : resolveLocalPanePoint(activePane, point);

    if (primaryRows.length > 0) {
      const baseReadout = buildCrosshairReadout(
        primaryRows,
        logicalPoint === null ? null : { x: logicalPoint.x, y: logicalPoint.y },
        this.timeScale,
        this.primaryPriceScale,
      );

      if (activePane !== null && activePane.kind === "secondary" && logicalPoint !== null) {
        const state = this.secondarySeries.get(activePane.id);
        if (state !== undefined) {
          if (state.kind === "candlestick" || state.kind === "bar") {
            const rows = state.store.setData(state.data);
            return buildCrosshairReadout(
              rows,
              { x: logicalPoint.x, y: logicalPoint.y },
              this.timeScale,
              state.priceScale,
            );
          }
          return {
            ...baseReadout,
            price: state.priceScale.coordinateToPrice(logicalPoint.y),
          };
        }
      }

      return baseReadout;
    }

    if (activePane !== null && activePane.kind === "secondary") {
      const state = this.secondarySeries.get(activePane.id);
      if (state !== undefined) {
        const rows = state.store.setData(state.data);
        return {
          ...buildCrosshairReadout(
            rows,
            logicalPoint === null ? null : { x: logicalPoint.x, y: logicalPoint.y },
            this.timeScale,
            state.priceScale,
          ),
        };
      }
    }

    return {
      active: false,
      time: null,
      open: null,
      high: null,
      low: null,
      close: null,
      price: null,
    };
  }

  public render(canvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    const layout = measureLayout(canvas, this.manualLayout);
    canvas.width = Math.round(layout.width * dpr);
    canvas.height = Math.round(layout.height * dpr);
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;

    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("Canvas 2D context is unavailable");
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
    context.clearRect(0, 0, layout.width, layout.height);
    context.fillStyle = this.chartOptions.backgroundColor;
    context.fillRect(0, 0, layout.width, layout.height);

    const paneWidth = layout.width - layout.left - layout.right;
    const plotHeight = layout.height - layout.top - layout.bottom;
    const primaryRows = this.primaryStore.setData(this.primaryData);
    const secondaryRows = new Map<string, ReturnType<SeriesDataStore<number>["setData"]>>();
    let pointCount = primaryRows.length;
    for (const [paneId, state] of this.secondarySeries.entries()) {
      const rows = state.store.setData(state.data);
      secondaryRows.set(paneId, rows);
      pointCount = Math.max(pointCount, rows.length);
    }

    if (pointCount === 0) {
      context.save();
      context.translate(layout.left, layout.top);
      context.fillStyle = this.chartOptions.paneBackgroundColor;
      context.fillRect(0, 0, paneWidth, plotHeight);
      context.strokeStyle = this.chartOptions.frameColor;
      context.strokeRect(0.5, 0.5, paneWidth - 1, plotHeight - 1);
      context.restore();
      return;
    }

    this.timeScale.applyOptions({
      width: paneWidth,
      pointCount,
      barSpacing: resolveBarSpacing(this.barSpacing, paneWidth, pointCount),
      rightOffset: this.rightOffset,
    });

    const paneFrames = buildPaneFrames(this.panes, plotHeight);
    const activePane = this.crosshair === null ? null : resolveActivePane(paneFrames, this.crosshair.y);
    const barWidth = paneWidth / Math.max(pointCount * 1.8, 24);

    for (const pane of paneFrames) {
      context.save();
      context.translate(layout.left, layout.top + pane.top);
      context.fillStyle = this.chartOptions.paneBackgroundColor;
      context.fillRect(0, 0, paneWidth, pane.height);
      this.gridRenderer.draw(context, {
        width: paneWidth,
        height: pane.height,
        columns: 8,
        rows: 5,
        lineColor: this.chartOptions.gridColor,
      });

      if (pane.kind === "primary" && primaryRows.length > 0) {
        const primaryRange = this.primaryStore.priceRange(
          primaryRows[0].index,
          primaryRows[primaryRows.length - 1].index,
        );
        this.primaryPriceScale.applyOptions({
          height: pane.height,
          priceRange: primaryRange,
        });

        const items = primaryRows.map((row): CandlestickItem => ({
          x: this.timeScale.indexToCoordinate(row.index),
          openY: toCoordinate(this.primaryPriceScale.priceToCoordinate(row.value[PlotRowValueIndex.Open])),
          highY: toCoordinate(this.primaryPriceScale.priceToCoordinate(row.value[PlotRowValueIndex.High])),
          lowY: toCoordinate(this.primaryPriceScale.priceToCoordinate(row.value[PlotRowValueIndex.Low])),
          closeY: toCoordinate(this.primaryPriceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
          isUp: row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
        }));

        if (this.primarySeriesType === "line") {
          const lineItems = primaryRows.map((row): LineItem => ({
            x: this.timeScale.indexToCoordinate(row.index),
            y: toCoordinate(this.primaryPriceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
          }));

          this.lineRenderer.draw(context, {
            items: lineItems,
            lineColor: this.lineOptions.color,
            lineWidth: this.lineOptions.lineWidth,
          });
        } else if (this.primarySeriesType === "bar") {
          const barItems = primaryRows.map((row): BarItem => ({
            x: this.timeScale.indexToCoordinate(row.index),
            openY: toCoordinate(this.primaryPriceScale.priceToCoordinate(row.value[PlotRowValueIndex.Open])),
            highY: toCoordinate(this.primaryPriceScale.priceToCoordinate(row.value[PlotRowValueIndex.High])),
            lowY: toCoordinate(this.primaryPriceScale.priceToCoordinate(row.value[PlotRowValueIndex.Low])),
            closeY: toCoordinate(this.primaryPriceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
            isUp: row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
          }));

          this.barRenderer.draw(context, {
            items: barItems,
            barWidth,
            upColor: this.barOptions.upColor,
            downColor: this.barOptions.downColor,
          });
        } else if (this.primarySeriesType === "histogram") {
          const primaryRangeMin = primaryRange?.minValue() ?? 0;
          const histogramItems = primaryRows.map((row): HistogramItem => ({
            x: this.timeScale.indexToCoordinate(row.index),
            valueY: toCoordinate(this.primaryPriceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
            baseY: toCoordinate(this.primaryPriceScale.priceToCoordinate(primaryRangeMin)),
            isUp:
              this.primaryHistogramVisuals.get(row.time)?.isUp ??
              row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
            color: this.primaryHistogramVisuals.get(row.time)?.color,
          }));

          this.histogramRenderer.draw(context, {
            items: histogramItems,
            barWidth,
            upColor: this.histogramOptions.upColor,
            downColor: this.histogramOptions.downColor,
          });
        } else {
          this.candlesRenderer.draw(context, {
            items,
            barWidth,
            upColor: this.candlestickOptions.upColor,
            downColor: this.candlestickOptions.downColor,
            wickColor: this.candlestickOptions.wickColor,
          });
        }
      }

      if (pane.kind === "secondary") {
        const state = this.secondarySeries.get(pane.id);
        const rows = state === undefined ? undefined : secondaryRows.get(pane.id);
        if (state !== undefined && rows !== undefined && rows.length > 0) {
          const range = state.store.priceRange(
            rows[0].index,
            rows[rows.length - 1].index,
          );
          state.priceScale.applyOptions({
            height: pane.height,
            priceRange: range,
          });

          if (state.kind === "line") {
            const lineItems = rows.map((row): LineItem => ({
              x: this.timeScale.indexToCoordinate(row.index),
              y: toCoordinate(state.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
            }));

            this.lineRenderer.draw(context, {
              items: lineItems,
              lineColor: this.lineOptions.color,
              lineWidth: this.lineOptions.lineWidth,
            });
          } else if (state.kind === "bar") {
            const barItems = rows.map((row): BarItem => ({
              x: this.timeScale.indexToCoordinate(row.index),
              openY: toCoordinate(state.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Open])),
              highY: toCoordinate(state.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.High])),
              lowY: toCoordinate(state.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Low])),
              closeY: toCoordinate(state.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
              isUp: row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
            }));

            this.barRenderer.draw(context, {
              items: barItems,
              barWidth,
              upColor: this.barOptions.upColor,
              downColor: this.barOptions.downColor,
            });
          } else if (state.kind === "candlestick") {
            const candleItems = rows.map((row): CandlestickItem => ({
              x: this.timeScale.indexToCoordinate(row.index),
              openY: toCoordinate(state.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Open])),
              highY: toCoordinate(state.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.High])),
              lowY: toCoordinate(state.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Low])),
              closeY: toCoordinate(state.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
              isUp: row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
            }));

            this.candlesRenderer.draw(context, {
              items: candleItems,
              barWidth,
              upColor: this.candlestickOptions.upColor,
              downColor: this.candlestickOptions.downColor,
              wickColor: this.candlestickOptions.wickColor,
            });
          } else {
            const rangeMin = range?.minValue() ?? 0;
            const histogramItems = rows.map((row): HistogramItem => ({
              x: this.timeScale.indexToCoordinate(row.index),
              valueY: toCoordinate(state.priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
              baseY: toCoordinate(state.priceScale.priceToCoordinate(rangeMin)),
              isUp:
                state.visuals.get(row.time)?.isUp ??
                row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
              color: state.visuals.get(row.time)?.color,
            }));

            this.histogramRenderer.draw(context, {
              items: histogramItems,
              barWidth,
              upColor: state.kind === "volume" ? this.volumeOptions.upColor : this.histogramOptions.upColor,
              downColor: state.kind === "volume" ? this.volumeOptions.downColor : this.histogramOptions.downColor,
            });
          }
        }
      }

      const paneCrosshair = resolveLocalPanePoint(activePane?.id === pane.id ? activePane : null, this.crosshair);
      drawCrosshair(context, paneWidth, pane.height, paneCrosshair, this.crosshairOptions);
      context.strokeStyle = this.chartOptions.frameColor;
      context.strokeRect(0.5, 0.5, paneWidth - 1, pane.height - 1);
      context.restore();
    }

    if (primaryRows.length > 0) {
      const primaryPane = paneFrames.find((pane) => pane.kind === "primary");
      if (primaryPane !== undefined) {
        drawPriceAxis(
          context,
          layout,
          primaryPane.top,
          primaryPane.height,
          this.primaryPriceScale,
          resolveLocalPanePoint(activePane?.kind === "primary" ? activePane : null, this.crosshair),
          this.chartOptions,
          "primary",
        );
      }
    }

    for (const pane of paneFrames) {
      if (pane.kind !== "secondary") {
        continue;
      }
      const state = this.secondarySeries.get(pane.id);
      const rows = state === undefined ? undefined : secondaryRows.get(pane.id);
      if (state !== undefined && rows !== undefined && rows.length > 0) {
        drawPriceAxis(
          context,
          layout,
          pane.top,
          pane.height,
          state.priceScale,
          resolveLocalPanePoint(activePane?.id === pane.id ? activePane : null, this.crosshair),
          this.chartOptions,
          state.kind === "volume" ? "volume" : "primary",
        );
      }
    }

    const firstSecondaryRows = secondaryRows.values().next().value;
    drawTimeAxis(
      context,
      layout,
      primaryRows.length > 0 ? primaryRows : (firstSecondaryRows ?? []),
      this.timeScale,
      this.crosshair,
      this.chartOptions,
    );
    const readout = this.buildReadout(this.crosshair, layout);
    emitReadout(canvas, readout);
    this.emitCrosshairMove(readout);
  }

  private assertSeriesActive(
    series:
      | PhaseOneCandlestickSeriesApi
      | PhaseOneBarSeriesApi
      | PhaseOneLineSeriesApi
      | PhaseOneHistogramSeriesApi
      | PhaseOneVolumeSeriesApi,
  ): void {
    if (
      this.currentPrimarySeriesApi !== series &&
      !Array.from(this.secondarySeries.values()).some((entry) => entry.api === series)
    ) {
      throw new Error("chartx phase-one series has been removed");
    }
  }

  private emitCrosshairMove(readout: PhaseOneReadoutDetail): void {
    const event: PhaseOneCrosshairMoveEvent = {
      ...readout,
      point:
        this.crosshair === null
          ? null
          : {
              x: this.crosshair.x,
              y: this.crosshair.y,
            },
    };

    for (const handler of this.crosshairMoveHandlers) {
      handler(event);
    }
  }
}

export function createPhaseOneChart(canvas: HTMLCanvasElement): PhaseOneChartApi {
  assertCanvasElement(canvas);

  const harness = new PhaseOneChartHarness();
  harness.attach(canvas);

  return {
    addCandlestickSeries(target) {
      return harness.addCandlestickSeries(target);
    },
    addBarSeries(target) {
      return harness.addBarSeries(target);
    },
    addLineSeries(target) {
      return harness.addLineSeries(target);
    },
    addHistogramSeries(target) {
      return harness.addHistogramSeries(target);
    },
    addVolumeSeries(target) {
      return harness.addVolumeSeries(target);
    },
    panes() {
      return harness.panesApi();
    },
    addPane(options) {
      return harness.addPane(options);
    },
    removePane(pane) {
      harness.removePaneByHandle(pane);
    },
    applyOptions(options) {
      harness.applyOptions(options);
    },
    removeSeries(series) {
      harness.removeSeries(series);
    },
    resize(width, height) {
      harness.resize(width, height);
    },
    timeScale() {
      return harness.timeScaleApi();
    },
    priceScale() {
      return harness.priceScaleApi();
    },
    subscribeCrosshairMove(handler) {
      harness.subscribeCrosshairMove(handler);
    },
    unsubscribeCrosshairMove(handler) {
      harness.unsubscribeCrosshairMove(handler);
    },
    subscribeClick(handler) {
      harness.subscribeClick(handler);
    },
    unsubscribeClick(handler) {
      harness.unsubscribeClick(handler);
    },
    subscribePaneEvents(handler) {
      harness.subscribePaneEvents(handler);
    },
    unsubscribePaneEvents(handler) {
      harness.unsubscribePaneEvents(handler);
    },
    destroy() {
      harness.detach();
    },
  };
}

export function mountPhaseOneChartHarness(canvas: HTMLCanvasElement): () => void {
  const chart = createPhaseOneChart(canvas);
  const bars = buildDemoBars();
  const volumePane = chart.addPane({ height: 136 });
  const series = chart.addCandlestickSeries();
  const volume = chart.addVolumeSeries({ pane: volumePane });
  series.setData(bars);
  volume.setData(buildDemoVolumeBars(bars));

  return () => {
    chart.destroy();
  };
}

function buildDemoBars(): readonly OhlcDataPoint<number>[] {
  let lastClose = 16_500;
  const startTime = Date.UTC(2025, 0, 2, 9, 30);

  return Array.from({ length: 42 }, (_, index) => {
    const drift = Math.sin(index / 5) * 42;
    const open = lastClose + Math.cos(index / 3) * 18;
    const close = open + drift;
    const high = Math.max(open, close) + 26 + (index % 3) * 3;
    const low = Math.min(open, close) - 24 - (index % 4) * 2;
    lastClose = close;

    return {
      time: startTime + index * 60_000,
      open,
      high,
      low,
      close,
    };
  });
}

function buildDemoVolumeBars(
  bars: readonly OhlcDataPoint<number>[],
): readonly PhaseOneVolumeData[] {
  return bars.map((bar, index) => ({
    time: bar.time,
    value: 680_000 + (index % 7) * 120_000 + Math.abs(bar.close - bar.open) * 8_500,
    up: bar.close >= bar.open,
  }));
}

function normalizeLineData(data: readonly PhaseOneLineData[]): readonly PhaseOneCandlestickData[] {
  return data.map(normalizeLineBar);
}

function normalizeLineBar(bar: PhaseOneLineData): PhaseOneCandlestickData {
  return {
    time: bar.time,
    open: bar.value,
    high: bar.value,
    low: bar.value,
    close: bar.value,
  };
}

function normalizeHistogramData(
  data: readonly PhaseOneHistogramData[] | readonly PhaseOneVolumeData[],
): readonly PhaseOneCandlestickData[] {
  return data.map(normalizeHistogramBar);
}

function normalizeHistogramBar(
  bar: PhaseOneHistogramData | PhaseOneVolumeData,
): PhaseOneCandlestickData {
  return {
    time: bar.time,
    open: 0,
    high: Math.max(0, bar.value),
    low: Math.min(0, bar.value),
    close: bar.value,
  };
}

function buildHistogramVisuals(
  data: readonly PhaseOneHistogramData[] | readonly PhaseOneVolumeData[],
): Map<number, HistogramVisual> {
  const visuals = new Map<number, HistogramVisual>();

  for (let index = 0; index < data.length; index += 1) {
    const item = data[index];
    const previous = index === 0 ? null : data[index - 1];
    visuals.set(item.time, {
      color: item.color,
      isUp: item.up ?? (previous === null ? true : item.value >= previous.value),
    });
  }

  return visuals;
}

function normalizePaneHeight(height: number | undefined): number {
  if (height === undefined || !Number.isFinite(height)) {
    return 136;
  }
  return Math.max(72, Math.round(height));
}

function buildPaneFrames(
  panes: readonly PaneSpec[],
  plotHeight: number,
): PaneFrame[] {
  if (panes.length === 0) {
    return [];
  }

  const gap = panes.length > 1 ? PANE_GAP : 0;
  const totalGap = gap * Math.max(0, panes.length - 1);
  const secondaryPanes = panes.filter((pane) => pane.kind === "secondary");
  const preferredSecondaryTotal = secondaryPanes.reduce(
    (sum, pane) => sum + normalizePaneHeight(pane.preferredHeight ?? undefined),
    0,
  );
  const maxSecondaryTotal = Math.max(0, plotHeight - totalGap - 160);
  const secondaryScale =
    preferredSecondaryTotal > 0 && preferredSecondaryTotal > maxSecondaryTotal
      ? maxSecondaryTotal / preferredSecondaryTotal
      : 1;

  const secondaryHeights = new Map<string, number>();
  for (const pane of secondaryPanes) {
    secondaryHeights.set(
      pane.id,
      Math.round(normalizePaneHeight(pane.preferredHeight ?? undefined) * secondaryScale),
    );
  }

  const secondaryTotal = Array.from(secondaryHeights.values()).reduce((sum, height) => sum + height, 0);
  const primaryHeight = Math.max(160, plotHeight - totalGap - secondaryTotal);

  const frames: PaneFrame[] = [];
  let top = 0;
  for (const pane of panes) {
    const height = pane.kind === "primary" ? primaryHeight : secondaryHeights.get(pane.id) ?? normalizePaneHeight(undefined);
    frames.push({
      id: pane.id,
      kind: pane.kind,
      top,
      height,
    });
    top += height + gap;
  }

  if (frames.length > 0) {
    const last = frames[frames.length - 1];
    last.height = Math.max(48, plotHeight - last.top);
  }

  return frames;
}

function resolvePaneDivider(
  paneSpecs: readonly PaneSpec[],
  panes: readonly PaneFrame[],
  y: number | null,
): { upperPaneId: string; lowerPaneId: string; upperHeight: number; lowerHeight: number; position: number } | null {
  if (y === null) {
    return null;
  }

  for (let index = 0; index < panes.length - 1; index += 1) {
    const upper = panes[index];
    const lower = panes[index + 1];
    const upperSpec = paneSpecs.find((pane) => pane.id === upper.id);
    const lowerSpec = paneSpecs.find((pane) => pane.id === lower.id);
    const canResize =
      upper.kind === "primary"
        ? (lowerSpec?.resizable ?? false)
        : (upperSpec?.resizable ?? false);
    if (!canResize) {
      continue;
    }
    const dividerPosition = upper.top + upper.height + PANE_GAP / 2;
    if (Math.abs(y - dividerPosition) <= PANE_DIVIDER_HIT_SLOP) {
      return {
        upperPaneId: upper.id,
        lowerPaneId: lower.id,
        upperHeight: upper.height,
        lowerHeight: lower.height,
        position: dividerPosition,
      };
    }
  }

  return null;
}

function resolvePaneDividerByIds(
  panes: readonly PaneFrame[],
  upperPaneId: string,
  lowerPaneId: string,
): { upperPaneId: string; lowerPaneId: string; upperHeight: number; lowerHeight: number; position: number } | null {
  const upper = panes.find((pane) => pane.id === upperPaneId);
  const lower = panes.find((pane) => pane.id === lowerPaneId);
  if (upper === undefined || lower === undefined) {
    return null;
  }

  return {
    upperPaneId,
    lowerPaneId,
    upperHeight: upper.height,
    lowerHeight: lower.height,
    position: upper.top + upper.height + PANE_GAP / 2,
  };
}

function resolveActivePane(
  panes: readonly PaneFrame[],
  y: number,
): PaneFrame | null {
  return panes.find((pane) => y >= pane.top && y <= pane.top + pane.height) ?? null;
}

function resolveLocalPanePoint(
  pane: PaneFrame | null | undefined,
  point: PanePoint | null,
): PanePoint | null {
  if (pane === null || pane === undefined || point === null) {
    return null;
  }

  return {
    x: point.x,
    y: point.y - pane.top,
  };
}

function toCoordinate(value: Coordinate | null): Coordinate {
  return (value ?? 0) as Coordinate;
}

function measureLayout(
  canvas: HTMLCanvasElement,
  manualLayout: Pick<Layout, "width" | "height"> | null = null,
): Layout {
  if (manualLayout !== null) {
    return {
      ...DEFAULT_LAYOUT,
      width: manualLayout.width,
      height: manualLayout.height,
    };
  }

  const container = canvas.parentElement;
  if (container === null) {
    return DEFAULT_LAYOUT;
  }

  const styles = window.getComputedStyle(container);
  const horizontalPadding =
    parseFloat(styles.paddingLeft || "0") + parseFloat(styles.paddingRight || "0");
  const availableWidth = Math.floor(container.clientWidth - horizontalPadding);
  const width = clamp(availableWidth, 480, DEFAULT_LAYOUT.width);
  const height = Math.round((width / DEFAULT_LAYOUT.width) * DEFAULT_LAYOUT.height);

  return {
    ...DEFAULT_LAYOUT,
    width,
    height: Math.max(320, height),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function calculateBaseBarSpacing(paneWidth: number, pointCount: number): number {
  return paneWidth / Math.max(pointCount + 2, 12);
}

function resolveBarSpacing(
  currentSpacing: number | null,
  paneWidth: number,
  pointCount: number,
): number {
  return clamp(
    currentSpacing ?? calculateBaseBarSpacing(paneWidth, pointCount),
    MIN_BAR_SPACING,
    MAX_BAR_SPACING,
  );
}

function resolvePanePoint(
  canvas: HTMLCanvasElement,
  event: Pick<MouseEvent, "clientX" | "clientY">,
  layout: Layout,
): PanePoint | null {
  const rect = canvas.getBoundingClientRect();
  const localX = event.clientX - rect.left - layout.left;
  const localY = event.clientY - rect.top - layout.top;
  const paneWidth = layout.width - layout.left - layout.right;
  const paneHeight = layout.height - layout.top - layout.bottom;

  if (localX < 0 || localX > paneWidth || localY < 0 || localY > paneHeight) {
    return null;
  }

  return {
    x: clamp(localX, 0, paneWidth),
    y: clamp(localY, 0, paneHeight),
  };
}

function drawCrosshair(
  context: CanvasRenderingContext2D,
  paneWidth: number,
  paneHeight: number,
  crosshair: PanePoint | null,
  options: { lineColor: string; pointColor: string },
): void {
  if (crosshair === null) {
    return;
  }

  context.save();
  context.strokeStyle = options.lineColor;
  context.lineWidth = 1;
  context.setLineDash([4, 4]);

  context.beginPath();
  context.moveTo(Math.round(crosshair.x) + 0.5, 0);
  context.lineTo(Math.round(crosshair.x) + 0.5, paneHeight);
  context.stroke();

  context.beginPath();
  context.moveTo(0, Math.round(crosshair.y) + 0.5);
  context.lineTo(paneWidth, Math.round(crosshair.y) + 0.5);
  context.stroke();

  context.setLineDash([]);
  context.fillStyle = options.pointColor;
  context.beginPath();
  context.arc(crosshair.x, crosshair.y, 2.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawPriceAxis(
  context: CanvasRenderingContext2D,
  layout: Layout,
  paneTop: number,
  paneHeight: number,
  priceScale: PriceScale,
  crosshair: PanePoint | null,
  options: Required<NonNullable<PhaseOneChartOptions["layout"]>>,
  axisType: "primary" | "volume",
): void {
  const range = priceScale.getPriceRange();
  if (range === null) {
    return;
  }

  const tickCount = clamp(Math.floor(paneHeight / 76), 3, 7);
  const labels: AxisTag[] = Array.from({ length: tickCount }, (_, index) => {
    const ratio = tickCount === 1 ? 0 : index / (tickCount - 1);
    const price = range.maxValue() - range.length() * ratio;
    return {
      text:
        axisType === "volume"
          ? formatVolumeAxisLabel(price)
          : formatPriceAxisLabel(price),
      x: layout.width - layout.right + 6,
      y: layout.top + paneTop + paneHeight * ratio - 9,
    };
  });

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "middle";

  for (const label of labels) {
    drawAxisTag(context, label, options);
  }

  if (crosshair !== null) {
    const price = priceScale.coordinateToPrice(crosshair.y);
    if (price !== null) {
      drawAxisTag(context, {
        text:
          axisType === "volume"
            ? formatVolumeAxisLabel(price)
            : formatPriceAxisLabel(price),
        x: layout.width - layout.right + 6,
        y: layout.top + paneTop + crosshair.y - 9,
        active: true,
      }, options);
    }
  }

  context.restore();
}

function drawTimeAxis(
  context: CanvasRenderingContext2D,
  layout: Layout,
  rows: readonly { time: number; index: number }[],
  timeScale: TimeScale,
  crosshair: PanePoint | null,
  options: Required<NonNullable<PhaseOneChartOptions["layout"]>>,
): void {
  if (rows.length === 0) {
    return;
  }

  const paneHeight = layout.height - layout.top - layout.bottom;
  const visible = timeScale.visibleStrictRange();
  const start = visible === null ? 0 : clamp(visible.left(), 0, rows.length - 1);
  const end = visible === null ? rows.length - 1 : clamp(visible.right(), 0, rows.length - 1);
  const tickCount = clamp(Math.floor((layout.width - layout.left - layout.right) / 140), 3, 7);
  const anchors = collectVisibleTimeAnchors(rows, start, end, tickCount);

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "top";
  context.fillStyle = options.axisTextColor;

  for (const row of anchors) {
    const text = formatTimeAxisLabel(row.time);
    const x = layout.left + timeScale.indexToCoordinate(row.index as never);
    drawAxisTag(context, {
      text,
      x: clampCenterTag(x, context.measureText(text).width, layout.left, layout.width - layout.right),
      y: layout.top + paneHeight + 8,
    }, options);
  }

  if (crosshair !== null) {
    const logical = Math.round(timeScale.coordinateToLogical(crosshair.x));
    const row = rows[clamp(logical, 0, rows.length - 1)];
    const text = formatTimeAxisLabel(row.time);
    drawAxisTag(context, {
      text,
      x: clampCenterTag(layout.left + crosshair.x, context.measureText(text).width, layout.left, layout.width - layout.right),
      y: layout.top + paneHeight + 8,
      active: true,
    }, options);
  }

  context.restore();
}

function drawAxisTag(
  context: CanvasRenderingContext2D,
  tag: AxisTag,
  options: Required<NonNullable<PhaseOneChartOptions["layout"]>>,
): void {
  const textWidth = context.measureText(tag.text).width;
  const boxWidth = Math.ceil(textWidth + 12);
  const boxHeight = 18;

  context.fillStyle = tag.active ? options.axisActiveBackground : options.axisLabelBackground;
  context.strokeStyle = tag.active ? options.axisActiveBackground : options.axisLabelBorder;
  context.lineWidth = 1;
  context.fillRect(tag.x, tag.y, boxWidth, boxHeight);
  context.strokeRect(tag.x + 0.5, tag.y + 0.5, boxWidth - 1, boxHeight - 1);
  context.fillStyle = tag.active ? options.axisActiveText : options.axisTextColor;
  context.fillText(
    tag.text,
    tag.x + 6,
    tag.y + (context.textBaseline === "middle" ? boxHeight / 2 : 4),
  );
}

function collectVisibleTimeAnchors(
  rows: readonly { time: number; index: number }[],
  start: number,
  end: number,
  tickCount: number,
): Array<{ time: number; index: number }> {
  const anchors: Array<{ time: number; index: number }> = [];
  const seen = new Set<number>();

  for (let index = 0; index < tickCount; index += 1) {
    const ratio = tickCount === 1 ? 0 : index / (tickCount - 1);
    const candidate = clamp(Math.round(start + (end - start) * ratio), start, end);
    if (!seen.has(candidate)) {
      seen.add(candidate);
      anchors.push(rows[candidate]);
    }
  }

  return anchors;
}

function clampCenterTag(
  centerX: number,
  textWidth: number,
  minX: number,
  maxX: number,
): number {
  const boxWidth = Math.ceil(textWidth + 12);
  return clamp(centerX - boxWidth / 2, minX, maxX - boxWidth);
}

function formatPriceAxisLabel(value: number): string {
  const digits = Math.abs(value) >= 1000 ? 2 : 3;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function formatVolumeAxisLabel(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (absolute >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absolute >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

function formatTimeAxisLabel(value: number): string {
  if (Math.abs(value) < 100_000_000_000) {
    return `T ${value}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function emitReadout(canvas: HTMLCanvasElement, detail: PhaseOneReadoutDetail): void {
  canvas.dispatchEvent(
    new CustomEvent<PhaseOneReadoutDetail>("chartx:readout", {
      detail,
    }),
  );
}

function buildCrosshairReadout(
  rows: readonly { time: number; value: [number, number, number, number] }[],
  crosshair: PanePoint | null,
  timeScale: TimeScale,
  priceScale: PriceScale,
): PhaseOneReadoutDetail {
  if (crosshair === null || rows.length === 0) {
    return {
      active: false,
      time: null,
      open: null,
      high: null,
      low: null,
      close: null,
      price: null,
    };
  }

  const logical = Math.round(timeScale.coordinateToLogical(crosshair.x));
  const row = rows[clamp(logical, 0, rows.length - 1)];

  return {
    active: true,
    time: row.time,
    open: row.value[PlotRowValueIndex.Open],
    high: row.value[PlotRowValueIndex.High],
    low: row.value[PlotRowValueIndex.Low],
    close: row.value[PlotRowValueIndex.Close],
    price: priceScale.coordinateToPrice(crosshair.y),
  };
}

function assertCanvasElement(value: unknown): asserts value is HTMLCanvasElement {
  if (!(value instanceof HTMLCanvasElement)) {
    throw new Error("chartx phase-one chart requires an HTMLCanvasElement");
  }
}
