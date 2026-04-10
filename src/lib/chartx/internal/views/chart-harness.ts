import {
  PlotRowValueIndex,
  PriceRangeImpl,
  PriceScale,
  SeriesDataStore,
  SourceRegistry,
  TimeScale,
  type OhlcDataPoint,
  type SourceDescriptor,
} from "../model";
import {
  AreaRenderer,
  BaselineRenderer,
  BarRenderer,
  CandlesticksRenderer,
  GridRenderer,
  HistogramRenderer,
  LineRenderer,
  type AreaItem,
  type BaselineItem,
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
export type PhaseOneReadoutSeriesDetail = {
  id: string;
  label: string;
  kind: string;
  value: number | null;
  color: string;
};
export type PhaseOneReadoutDetail = {
  active: boolean;
  paneIndex: number | null;
  time: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  price: number | null;
  series: readonly PhaseOneReadoutSeriesDetail[];
};

export type PhaseOnePriceLineOptions = {
  price?: number;
  color?: string;
  lineWidth?: number;
  title?: string;
};

export type PhaseOnePriceLineApi = {
  applyOptions(options: PhaseOnePriceLineOptions): void;
  remove(): void;
};

export type PhaseOneSeriesMarkerPosition = "aboveBar" | "belowBar" | "inBar";
export type PhaseOneSeriesMarkerShape = "circle" | "square" | "arrowUp" | "arrowDown";

export type PhaseOneSeriesMarker = {
  time: number;
  position?: PhaseOneSeriesMarkerPosition;
  shape?: PhaseOneSeriesMarkerShape;
  color?: string;
  text?: string;
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

export type PhaseOneCompareSeriesOptions = {
  affectMainScale?: boolean;
};

export type PhaseOneAreaSeriesOptions = {
  lineColor?: string;
  lineWidth?: number;
  topColor?: string;
  bottomColor?: string;
};

export type PhaseOneBaselineSeriesOptions = {
  baseValue?: number;
  lineWidth?: number;
  topLineColor?: string;
  topFillTopColor?: string;
  topFillBottomColor?: string;
  bottomLineColor?: string;
  bottomFillTopColor?: string;
  bottomFillBottomColor?: string;
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

export type PhaseOnePaneState = {
  paneIndex: number;
  height: number;
  isPrimary: boolean;
  resizable: boolean;
  hasSeries: boolean;
  seriesCount: number;
  seriesKinds: readonly string[];
  series: readonly PhaseOnePaneSeriesState[];
};

export type PhaseOnePaneSeriesState = {
  id: string;
  label: string;
  kind: string;
  sourceRole: "main-series" | "study";
  studyKind: "series" | "indicator" | "overlay" | "compare" | null;
  priceScaleId: string;
  pointCount: number;
};

export type PhaseOnePaneEvent = {
  type: PhaseOnePaneEventType;
  pane: PhaseOnePaneState;
  panes: readonly PhaseOnePaneState[];
};

export type PhaseOnePaneEventHandler = (event: PhaseOnePaneEvent) => void;

export type PhaseOneTimeScaleApi = {
  getVisibleLogicalRange(): { from: number; to: number } | null;
  setVisibleLogicalRange(range: { from: number; to: number }): void;
  applyOptions(options: {
    barSpacing?: number;
    rightOffset?: number;
    tickMarkFormatter?: ((time: number) => string) | null;
  }): void;
};

export type PhaseOnePriceScaleApi = {
  getVisibleRange(): { minValue: number; maxValue: number } | null;
  setVisibleRange(range: { minValue: number; maxValue: number } | null): void;
  applyOptions(options: {
    priceFormatter?: ((value: number) => string) | null;
    scaleSeriesOnly?: boolean;
  }): void;
};

export type PhaseOneCandlestickSeriesApi = {
  setData(data: readonly PhaseOneCandlestickData[]): void;
  update(bar: PhaseOneCandlestickData): void;
  applyOptions(options: PhaseOneCandlestickSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneBarSeriesApi = {
  setData(data: readonly PhaseOneCandlestickData[]): void;
  update(bar: PhaseOneCandlestickData): void;
  applyOptions(options: PhaseOneBarSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneLineSeriesApi = {
  setData(data: readonly PhaseOneLineData[]): void;
  update(bar: PhaseOneLineData): void;
  applyOptions(options: PhaseOneLineSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneAreaSeriesApi = {
  setData(data: readonly PhaseOneLineData[]): void;
  update(bar: PhaseOneLineData): void;
  applyOptions(options: PhaseOneAreaSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneBaselineSeriesApi = {
  setData(data: readonly PhaseOneLineData[]): void;
  update(bar: PhaseOneLineData): void;
  applyOptions(options: PhaseOneBaselineSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneHistogramSeriesApi = {
  setData(data: readonly PhaseOneHistogramData[]): void;
  update(bar: PhaseOneHistogramData): void;
  applyOptions(options: PhaseOneHistogramSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneVolumeSeriesApi = {
  setData(data: readonly PhaseOneVolumeData[]): void;
  update(bar: PhaseOneVolumeData): void;
  applyOptions(options: PhaseOneVolumeSeriesOptions): void;
  setMarkers(markers: readonly PhaseOneSeriesMarker[]): void;
  createPriceLine(options?: PhaseOnePriceLineOptions): PhaseOnePriceLineApi;
  removePriceLine(line: PhaseOnePriceLineApi): void;
};

export type PhaseOneOverlaySeriesApi = PhaseOneLineSeriesApi;
export type PhaseOneCompareSeriesApi = PhaseOneLineSeriesApi & {
  applyCompareOptions(options: PhaseOneCompareSeriesOptions): void;
  getCompareOptions(): Required<PhaseOneCompareSeriesOptions>;
};

export type PhaseOneChartApi = {
  addCandlestickSeries(target?: PhaseOneSeriesTarget): PhaseOneCandlestickSeriesApi;
  addBarSeries(target?: PhaseOneSeriesTarget): PhaseOneBarSeriesApi;
  addLineSeries(target?: PhaseOneSeriesTarget): PhaseOneLineSeriesApi;
  addAreaSeries(target?: PhaseOneSeriesTarget): PhaseOneAreaSeriesApi;
  addBaselineSeries(target?: PhaseOneSeriesTarget): PhaseOneBaselineSeriesApi;
  addHistogramSeries(target?: PhaseOneSeriesTarget): PhaseOneHistogramSeriesApi;
  addVolumeSeries(target?: PhaseOneVolumeSeriesTarget): PhaseOneVolumeSeriesApi;
  addOverlaySeries(target?: PhaseOneSeriesTarget): PhaseOneOverlaySeriesApi;
  addCompareSeries(target?: PhaseOneSeriesTarget): PhaseOneCompareSeriesApi;
  panes(): readonly PhaseOnePaneApi[];
  addPane(options?: PhaseOnePaneOptions): PhaseOnePaneApi;
  removePane(pane: PhaseOnePaneApi): void;
  applyOptions(options: PhaseOneChartOptions): void;
  removeSeries(
    series:
      | PhaseOneCandlestickSeriesApi
      | PhaseOneBarSeriesApi
      | PhaseOneLineSeriesApi
      | PhaseOneAreaSeriesApi
      | PhaseOneBaselineSeriesApi
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

type PriceLineState = {
  id: string;
  price: number;
  color: string;
  lineWidth: number;
  title: string;
};

type SeriesMarkerState = {
  time: number;
  position: PhaseOneSeriesMarkerPosition;
  shape: PhaseOneSeriesMarkerShape;
  color: string;
  text: string;
};

type ChartSeriesKind = "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume";

type ChartSeriesApi =
  | PhaseOneCandlestickSeriesApi
  | PhaseOneBarSeriesApi
  | PhaseOneLineSeriesApi
  | PhaseOneAreaSeriesApi
  | PhaseOneBaselineSeriesApi
  | PhaseOneHistogramSeriesApi
  | PhaseOneVolumeSeriesApi;

type StudySourceKind = "series" | "indicator" | "overlay" | "compare";

type BaseSeriesSourceState = {
  api:
    | PhaseOneCandlestickSeriesApi
    | PhaseOneBarSeriesApi
    | PhaseOneLineSeriesApi
    | PhaseOneAreaSeriesApi
    | PhaseOneBaselineSeriesApi
    | PhaseOneHistogramSeriesApi
    | PhaseOneVolumeSeriesApi;
  data: readonly PhaseOneCandlestickData[];
  store: SeriesDataStore<number>;
  priceScale: PriceScale;
  visuals: Map<number, HistogramVisual>;
  priceLines: Map<string, PriceLineState>;
  markers: readonly SeriesMarkerState[];
  options:
    | Required<PhaseOneCandlestickSeriesOptions>
    | Required<PhaseOneBarSeriesOptions>
    | Required<PhaseOneLineSeriesOptions>
    | Required<PhaseOneAreaSeriesOptions>
    | Required<PhaseOneBaselineSeriesOptions>
    | Required<PhaseOneHistogramSeriesOptions>
    | Required<PhaseOneVolumeSeriesOptions>;
};

type MainSeriesSourceState = SourceDescriptor<ChartSeriesKind, ChartSeriesApi> & BaseSeriesSourceState & {
  role: "main-series";
};

type StudySourceState = SourceDescriptor<ChartSeriesKind, ChartSeriesApi> & BaseSeriesSourceState & {
  role: "study";
  studyKind: StudySourceKind;
  compareOptions?: Required<PhaseOneCompareSeriesOptions>;
};

type SeriesSourceState = MainSeriesSourceState | StudySourceState;

type RowSet = ReturnType<SeriesDataStore<number>["setData"]>;

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
  private readonly sourceRegistry = new SourceRegistry<ChartSeriesKind, ChartSeriesApi, SeriesSourceState>();
  private readonly timeScale = new TimeScale();
  private readonly primaryPriceScale = new PriceScale();
  private readonly barRenderer = new BarRenderer();
  private readonly candlesRenderer = new CandlesticksRenderer();
  private readonly gridRenderer = new GridRenderer();
  private readonly histogramRenderer = new HistogramRenderer();
  private readonly lineRenderer = new LineRenderer();
  private readonly areaRenderer = new AreaRenderer();
  private readonly baselineRenderer = new BaselineRenderer();
  private readonly panes: PaneSpec[] = [{ id: "primary", kind: "primary", preferredHeight: null, resizable: false }];
  private nextPaneId = 1;
  private nextSeriesId = 1;
  private nextPriceLineId = 1;
  private currentMainSourceId: string | null = null;
  private readonly secondaryPanePriceScales = new Map<string, PriceScale>();
  private readonly priceLineHandleIds = new WeakMap<PhaseOnePriceLineApi, string>();
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
  private timeAxisFormatter: ((time: number) => string) | null = null;
  private priceAxisFormatter: ((value: number) => string) | null = null;
  private primaryScaleSeriesOnly = false;
  private primaryPriceRangeOverride: PriceRangeImpl | null = null;
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
  private readonly defaultCompareOptions: Required<PhaseOneCompareSeriesOptions> = {
    affectMainScale: true,
  };
  private readonly areaOptions: Required<PhaseOneAreaSeriesOptions> = {
    lineColor: LINE_COLOR,
    lineWidth: 2,
    topColor: "rgba(63, 111, 216, 0.28)",
    bottomColor: "rgba(63, 111, 216, 0.02)",
  };
  private readonly baselineOptions: Required<PhaseOneBaselineSeriesOptions> = {
    baseValue: 130,
    lineWidth: 2,
    topLineColor: "#0c8f62",
    topFillTopColor: "rgba(12, 143, 98, 0.26)",
    topFillBottomColor: "rgba(12, 143, 98, 0.03)",
    bottomLineColor: "#c7543e",
    bottomFillTopColor: "rgba(199, 84, 62, 0.03)",
    bottomFillBottomColor: "rgba(199, 84, 62, 0.24)",
  };
  private readonly histogramOptions: Required<PhaseOneHistogramSeriesOptions> = {
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
  private readonly volumeOptions: Required<PhaseOneVolumeSeriesOptions> = {
    upColor: UP_COLOR,
    downColor: DOWN_COLOR,
  };
  private readonly defaultPriceLineOptions: Required<PhaseOnePriceLineOptions> = {
    price: 0,
    color: "rgba(16, 16, 16, 0.48)",
    lineWidth: 1,
    title: "Price line",
  };
  private manualLayout: Pick<Layout, "width" | "height"> | null = null;
  private dragState: DragState | null = null;
  private paneResizeState: PaneResizeState | null = null;
  private resizeObserver: ResizeObserver | null = null;
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
      this.canvas.focus({ preventScroll: true });
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

    this.canvas.focus({ preventScroll: true });
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
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    const pointCount = this.getPointCount();
    if (this.canvas === null || pointCount === 0) {
      return;
    }

    const layout = measureLayout(this.canvas);
    const paneWidth = layout.width - layout.left - layout.right;
    const baseSpacing = calculateBaseBarSpacing(paneWidth, pointCount);
    const currentSpacing = this.barSpacing ?? baseSpacing;

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        this.barSpacing = clamp(currentSpacing * 1.15, MIN_BAR_SPACING, MAX_BAR_SPACING);
        this.render(this.canvas);
        return;
      case "ArrowDown":
        event.preventDefault();
        this.barSpacing = clamp(currentSpacing * 0.87, MIN_BAR_SPACING, MAX_BAR_SPACING);
        this.render(this.canvas);
        return;
      case "ArrowLeft":
        event.preventDefault();
        this.rightOffset -= 0.6;
        this.render(this.canvas);
        return;
      case "ArrowRight":
        event.preventDefault();
        this.rightOffset += 0.6;
        this.render(this.canvas);
        return;
      default:
        return;
    }
  };

  public attach(canvas: HTMLCanvasElement): void {
    assertCanvasElement(canvas);
    this.canvas = canvas;
    if (!this.canvas.hasAttribute("tabindex")) {
      this.canvas.tabIndex = 0;
    }
    this.canvas.style.cursor = "crosshair";
    this.render(canvas);
    window.addEventListener("resize", this.handleResize);
    const container = canvas.parentElement;
    if (container !== null && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.canvas !== null && this.manualLayout === null) {
          this.render(this.canvas);
        }
      });
      this.resizeObserver.observe(container);
    }
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("pointercancel", this.handlePointerUp);
    canvas.addEventListener("pointerleave", this.handlePointerLeave);
    canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    canvas.addEventListener("click", this.handleClick);
    canvas.addEventListener("keydown", this.handleKeyDown);
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
      this.canvas.removeEventListener("keydown", this.handleKeyDown);
    }
    window.removeEventListener("resize", this.handleResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
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
    if (this.currentMainSourceId !== null) {
      throw new Error("chartx phase-one chart supports only one primary series");
    }

    const meta = this.createSeriesMeta("candlestick");
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
        const state = this.getSourceByApi(api, "candlestick");
        const seriesOptions = state.options as Required<PhaseOneCandlestickSeriesOptions>;
        if (options.upColor !== undefined) {
          seriesOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          seriesOptions.downColor = options.downColor;
        }
        if (options.wickColor !== undefined) {
          seriesOptions.wickColor = options.wickColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "candlestick");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "candlestick");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "candlestick");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    const source = this.createMainSourceState(
      "primary",
      "candlestick",
      api,
      meta,
      this.primaryPriceScale,
      "primary-right",
    );
    this.sourceRegistry.register(source);
    this.currentMainSourceId = source.id;
    return api;
  }

  public addLineSeries(target?: PhaseOneSeriesTarget): PhaseOneLineSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryLineSeries();
    }
    return this.addSecondaryLineSeries(resolved.paneId);
  }

  public addAreaSeries(target?: PhaseOneSeriesTarget): PhaseOneAreaSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryAreaSeries();
    }
    return this.addSecondaryAreaSeries(resolved.paneId);
  }

  public addBaselineSeries(target?: PhaseOneSeriesTarget): PhaseOneBaselineSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    if (resolved.kind === "primary") {
      return this.addPrimaryBaselineSeries();
    }
    return this.addSecondaryBaselineSeries(resolved.paneId);
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

  public addOverlaySeries(target?: PhaseOneSeriesTarget): PhaseOneOverlaySeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    return this.addStudyLineSeries(resolved.kind === "primary" ? "primary" : resolved.paneId, "overlay");
  }

  public addCompareSeries(target?: PhaseOneSeriesTarget): PhaseOneCompareSeriesApi {
    const resolved = this.resolveSeriesTarget(target, { defaultToSecondary: false, allowPrimary: true });
    return this.addCompareStudySeries(resolved.kind === "primary" ? "primary" : resolved.paneId);
  }

  public removeSeries(
    series:
      | PhaseOneCandlestickSeriesApi
      | PhaseOneBarSeriesApi
      | PhaseOneLineSeriesApi
      | PhaseOneAreaSeriesApi
      | PhaseOneBaselineSeriesApi
      | PhaseOneHistogramSeriesApi
      | PhaseOneVolumeSeriesApi,
  ): void {
    const removed = this.sourceRegistry.removeByApi(series);
    if (removed === undefined) {
      throw new Error("chartx phase-one chart can remove only the currently attached series");
    }
    if (removed.role === "main-series") {
      this.currentMainSourceId = null;
      this.primaryPriceRangeOverride = null;
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
        const pointCount = this.getPointCount();
        if (pointCount <= 0) {
          return null;
        }

        const layout = this.canvas === null
          ? DEFAULT_LAYOUT
          : measureLayout(this.canvas, this.manualLayout);
        const paneWidth = Math.max(40, layout.width - layout.left - layout.right);
        const spacing = resolveBarSpacing(this.barSpacing, paneWidth, pointCount);
        const lastIndex = pointCount - 1;

        return {
          from: lastIndex - paneWidth / spacing + this.rightOffset,
          to: lastIndex + this.rightOffset,
        };
      },
      setVisibleLogicalRange: (range) => {
        const pointCount = this.getPointCount();
        if (!Number.isFinite(range.from) || !Number.isFinite(range.to) || range.to <= range.from) {
          throw new Error("chartx phase-one time scale visible range requires finite from/to with to > from");
        }
        if (pointCount <= 0) {
          throw new Error("chartx phase-one time scale visible range requires at least one data point");
        }
        const layout = this.canvas === null
          ? DEFAULT_LAYOUT
          : measureLayout(this.canvas, this.manualLayout);
        const paneWidth = Math.max(40, layout.width - layout.left - layout.right);
        const spacing = Math.max(MIN_BAR_SPACING, paneWidth / (range.to - range.from));
        const lastIndex = pointCount - 1;
        this.barSpacing = spacing;
        this.rightOffset = range.to - lastIndex;
        this.timeScale.applyOptions({
          width: paneWidth,
          pointCount,
          barSpacing: this.barSpacing,
          rightOffset: this.rightOffset,
        });
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      applyOptions: (options) => {
        if (options.barSpacing !== undefined) {
          this.barSpacing = clamp(options.barSpacing, MIN_BAR_SPACING, MAX_BAR_SPACING);
        }
        if (options.rightOffset !== undefined) {
          this.rightOffset = options.rightOffset;
        }
        if (options.tickMarkFormatter !== undefined) {
          this.timeAxisFormatter = options.tickMarkFormatter;
        }

        const layout = this.canvas === null
          ? DEFAULT_LAYOUT
          : measureLayout(this.canvas, this.manualLayout);
        const paneWidth = Math.max(40, layout.width - layout.left - layout.right);
        this.timeScale.applyOptions({
          width: paneWidth,
          pointCount: this.getPointCount(),
          barSpacing: resolveBarSpacing(this.barSpacing, paneWidth, this.getPointCount()),
          rightOffset: this.rightOffset,
        });

        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
    };
  }

  public priceScaleApi(): PhaseOnePriceScaleApi {
    return {
      getVisibleRange: () =>
        this.primaryPriceRangeOverride?.toRaw() ??
        this.primaryPriceScale.getPriceRange()?.toRaw() ??
        Array.from(this.secondaryPanePriceScales.values())[0]?.getPriceRange()?.toRaw() ??
        null,
      setVisibleRange: (range) => {
        this.primaryPriceRangeOverride = PriceRangeImpl.fromRaw(range);
        if (this.primaryPriceRangeOverride !== null && this.canvas !== null) {
          const layout = measureLayout(this.canvas, this.manualLayout);
          const plotHeight = Math.max(0, layout.height - layout.top - layout.bottom);
          const paneHeight = buildPaneFrames(this.panes, plotHeight).find((pane) => pane.kind === "primary")?.height ?? plotHeight;
          this.primaryPriceScale.applyOptions({
            height: paneHeight,
            priceRange: this.primaryPriceRangeOverride,
          });
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      applyOptions: (options) => {
        if (options.priceFormatter !== undefined) {
          this.priceAxisFormatter = options.priceFormatter;
        }
        if (options.scaleSeriesOnly !== undefined) {
          this.primaryScaleSeriesOnly = options.scaleSeriesOnly;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
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
    const source = this.getMainSourceOrThrow();
    source.data = [...data];
    source.visuals.clear();
    this.primaryPriceRangeOverride = null;
    this.barSpacing = null;
    this.rightOffset = DEFAULT_RIGHT_OFFSET;
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private updatePrimary(bar: PhaseOneCandlestickData): void {
    const source = this.getMainSourceOrThrow();
    source.data = source.store.update(bar).map((row) => ({
      time: row.time,
      open: row.value[PlotRowValueIndex.Open],
      high: row.value[PlotRowValueIndex.High],
      low: row.value[PlotRowValueIndex.Low],
      close: row.value[PlotRowValueIndex.Close],
    }));
    this.primaryPriceRangeOverride = null;
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private setPrimaryHistogramLikeData(
    data: readonly PhaseOneHistogramData[],
  ): void {
    this.getMainSourceOrThrow().visuals = buildHistogramVisuals(data);
    this.setPrimaryData(normalizeHistogramData(data));
  }

  private updatePrimaryHistogramLike(bar: PhaseOneHistogramData): void {
    const source = this.getMainSourceOrThrow();
    const previous = source.data.length === 0 ? null : source.data[source.data.length - 1];
    source.visuals.set(bar.time, {
      color: bar.color,
      isUp:
        bar.up ??
        (previous === null || bar.time <= previous.time
          ? (source.visuals.get(bar.time)?.isUp ?? true)
          : bar.value >= previous.close),
    });
    this.updatePrimary(normalizeHistogramBar(bar));
  }

  private getPointCount(): number {
    let pointCount = this.getMainSource()?.data.length ?? 0;
    for (const state of this.sourceRegistry.list()) {
      pointCount = Math.max(pointCount, state.data.length);
    }
    return pointCount;
  }

  private addPrimaryLineSeries(): PhaseOneLineSeriesApi {
    if (this.currentMainSourceId !== null) {
      throw new Error("chartx phase-one chart supports only one primary series");
    }

    const meta = this.createSeriesMeta("line");
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
        const state = this.getSourceByApi(api, "line");
        const seriesOptions = state.options as Required<PhaseOneLineSeriesOptions>;
        if (options.color !== undefined) {
          seriesOptions.color = options.color;
        }
        if (options.lineWidth !== undefined) {
          seriesOptions.lineWidth = Math.max(1, options.lineWidth);
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "line");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "line");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "line");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    const source = this.createMainSourceState("primary", "line", api, meta, this.primaryPriceScale, "primary-right");
    this.sourceRegistry.register(source);
    this.currentMainSourceId = source.id;
    return api;
  }

  private addPrimaryAreaSeries(): PhaseOneAreaSeriesApi {
    if (this.currentMainSourceId !== null) {
      throw new Error("chartx phase-one chart supports only one primary series");
    }

    const meta = this.createSeriesMeta("area");
    const api: PhaseOneAreaSeriesApi = {
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
        const state = this.getSourceByApi(api, "area");
        const seriesOptions = state.options as Required<PhaseOneAreaSeriesOptions>;
        if (options.lineColor !== undefined) {
          seriesOptions.lineColor = options.lineColor;
        }
        if (options.lineWidth !== undefined) {
          seriesOptions.lineWidth = Math.max(1, options.lineWidth);
        }
        if (options.topColor !== undefined) {
          seriesOptions.topColor = options.topColor;
        }
        if (options.bottomColor !== undefined) {
          seriesOptions.bottomColor = options.bottomColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "area");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "area");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "area");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    const source = this.createMainSourceState("primary", "area", api, meta, this.primaryPriceScale, "primary-right");
    this.sourceRegistry.register(source);
    this.currentMainSourceId = source.id;
    return api;
  }

  private addPrimaryBaselineSeries(): PhaseOneBaselineSeriesApi {
    if (this.currentMainSourceId !== null) {
      throw new Error("chartx phase-one chart supports only one primary series");
    }

    const meta = this.createSeriesMeta("baseline");
    const api: PhaseOneBaselineSeriesApi = {
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
        const state = this.getSourceByApi(api, "baseline");
        const seriesOptions = state.options as Required<PhaseOneBaselineSeriesOptions>;
        if (options.baseValue !== undefined) {
          seriesOptions.baseValue = options.baseValue;
        }
        if (options.lineWidth !== undefined) {
          seriesOptions.lineWidth = Math.max(1, options.lineWidth);
        }
        if (options.topLineColor !== undefined) {
          seriesOptions.topLineColor = options.topLineColor;
        }
        if (options.topFillTopColor !== undefined) {
          seriesOptions.topFillTopColor = options.topFillTopColor;
        }
        if (options.topFillBottomColor !== undefined) {
          seriesOptions.topFillBottomColor = options.topFillBottomColor;
        }
        if (options.bottomLineColor !== undefined) {
          seriesOptions.bottomLineColor = options.bottomLineColor;
        }
        if (options.bottomFillTopColor !== undefined) {
          seriesOptions.bottomFillTopColor = options.bottomFillTopColor;
        }
        if (options.bottomFillBottomColor !== undefined) {
          seriesOptions.bottomFillBottomColor = options.bottomFillBottomColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "baseline");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "baseline");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "baseline");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    const source = this.createMainSourceState("primary", "baseline", api, meta, this.primaryPriceScale, "primary-right");
    this.sourceRegistry.register(source);
    this.currentMainSourceId = source.id;
    return api;
  }

  private addPrimaryBarSeries(): PhaseOneBarSeriesApi {
    if (this.currentMainSourceId !== null) {
      throw new Error("chartx phase-one chart supports only one primary series");
    }

    const meta = this.createSeriesMeta("bar");
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
        const state = this.getSourceByApi(api, "bar");
        const seriesOptions = state.options as Required<PhaseOneBarSeriesOptions>;
        if (options.upColor !== undefined) {
          seriesOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          seriesOptions.downColor = options.downColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "bar");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "bar");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "bar");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    const source = this.createMainSourceState("primary", "bar", api, meta, this.primaryPriceScale, "primary-right");
    this.sourceRegistry.register(source);
    this.currentMainSourceId = source.id;
    return api;
  }

  private addPrimaryHistogramSeries(): PhaseOneHistogramSeriesApi {
    if (this.currentMainSourceId !== null) {
      throw new Error("chartx phase-one chart supports only one primary series");
    }

    const meta = this.createSeriesMeta("histogram");
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
        const state = this.getSourceByApi(api, "histogram");
        const seriesOptions = state.options as Required<PhaseOneHistogramSeriesOptions>;
        if (options.upColor !== undefined) {
          seriesOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          seriesOptions.downColor = options.downColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "histogram");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "histogram");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "histogram");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    const source = this.createMainSourceState("primary", "histogram", api, meta, this.primaryPriceScale, "primary-right");
    this.sourceRegistry.register(source);
    this.currentMainSourceId = source.id;
    return api;
  }

  private addSecondaryCandlestickSeries(target: string): PhaseOneCandlestickSeriesApi {
    const meta = this.createSeriesMeta("candlestick");
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
        const state = this.getSourceByApi(api, "candlestick");
        const seriesOptions = state.options as Required<PhaseOneCandlestickSeriesOptions>;
        if (options.upColor !== undefined) {
          seriesOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          seriesOptions.downColor = options.downColor;
        }
        if (options.wickColor !== undefined) {
          seriesOptions.wickColor = options.wickColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "candlestick");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "candlestick");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "candlestick");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    this.attachStudySeries(target, "candlestick", api, meta);
    return api;
  }

  private addSecondaryLineSeries(paneId: string): PhaseOneLineSeriesApi {
    return this.addStudyLineSeries(paneId, "series");
  }

  private addStudyLineSeries(
    paneId: string,
    studyKind: StudySourceKind,
  ): PhaseOneLineSeriesApi {
    const meta = this.createSeriesMeta("line");
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
        const state = this.getSourceByApi(api, "line");
        const seriesOptions = state.options as Required<PhaseOneLineSeriesOptions>;
        if (options.color !== undefined) {
          seriesOptions.color = options.color;
        }
        if (options.lineWidth !== undefined) {
          seriesOptions.lineWidth = Math.max(1, options.lineWidth);
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "line");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "line");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "line");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    this.attachStudySeries(paneId, "line", api, meta, studyKind);
    return api;
  }

  private addCompareStudySeries(paneId: string): PhaseOneCompareSeriesApi {
    const meta = this.createSeriesMeta("line");
    const api: PhaseOneCompareSeriesApi = {
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
        const state = this.getSourceByApi(api, "line");
        const seriesOptions = state.options as Required<PhaseOneLineSeriesOptions>;
        if (options.color !== undefined) {
          seriesOptions.color = options.color;
        }
        if (options.lineWidth !== undefined) {
          seriesOptions.lineWidth = Math.max(1, options.lineWidth);
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      applyCompareOptions: (options) => {
        this.assertSeriesActive(api);
        const state = this.getCompareStudyState(api);
        if (options.affectMainScale !== undefined) {
          state.compareOptions = {
            ...(state.compareOptions ?? this.defaultCompareOptions),
            affectMainScale: options.affectMainScale,
          };
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      getCompareOptions: () => {
        this.assertSeriesActive(api);
        const state = this.getCompareStudyState(api);
        return { ...(state.compareOptions ?? this.defaultCompareOptions) };
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "line");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "line");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "line");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    this.attachStudySeries(paneId, "line", api, meta, "compare");
    return api;
  }

  private addSecondaryAreaSeries(paneId: string): PhaseOneAreaSeriesApi {
    const meta = this.createSeriesMeta("area");
    const api: PhaseOneAreaSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setSecondaryData(api, normalizeLineData(data), "area");
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updateSecondary(api, normalizeLineBar(bar), "area");
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "area");
        const seriesOptions = state.options as Required<PhaseOneAreaSeriesOptions>;
        if (options.lineColor !== undefined) {
          seriesOptions.lineColor = options.lineColor;
        }
        if (options.lineWidth !== undefined) {
          seriesOptions.lineWidth = Math.max(1, options.lineWidth);
        }
        if (options.topColor !== undefined) {
          seriesOptions.topColor = options.topColor;
        }
        if (options.bottomColor !== undefined) {
          seriesOptions.bottomColor = options.bottomColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "area");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "area");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "area");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    this.attachStudySeries(paneId, "area", api, meta);
    return api;
  }

  private addSecondaryBaselineSeries(paneId: string): PhaseOneBaselineSeriesApi {
    const meta = this.createSeriesMeta("baseline");
    const api: PhaseOneBaselineSeriesApi = {
      setData: (data) => {
        this.assertSeriesActive(api);
        this.setSecondaryData(api, normalizeLineData(data), "baseline");
      },
      update: (bar) => {
        this.assertSeriesActive(api);
        this.updateSecondary(api, normalizeLineBar(bar), "baseline");
      },
      applyOptions: (options) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "baseline");
        const seriesOptions = state.options as Required<PhaseOneBaselineSeriesOptions>;
        if (options.baseValue !== undefined) {
          seriesOptions.baseValue = options.baseValue;
        }
        if (options.lineWidth !== undefined) {
          seriesOptions.lineWidth = Math.max(1, options.lineWidth);
        }
        if (options.topLineColor !== undefined) {
          seriesOptions.topLineColor = options.topLineColor;
        }
        if (options.topFillTopColor !== undefined) {
          seriesOptions.topFillTopColor = options.topFillTopColor;
        }
        if (options.topFillBottomColor !== undefined) {
          seriesOptions.topFillBottomColor = options.topFillBottomColor;
        }
        if (options.bottomLineColor !== undefined) {
          seriesOptions.bottomLineColor = options.bottomLineColor;
        }
        if (options.bottomFillTopColor !== undefined) {
          seriesOptions.bottomFillTopColor = options.bottomFillTopColor;
        }
        if (options.bottomFillBottomColor !== undefined) {
          seriesOptions.bottomFillBottomColor = options.bottomFillBottomColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "baseline");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "baseline");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "baseline");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    this.attachStudySeries(paneId, "baseline", api, meta);
    return api;
  }

  private addSecondaryBarSeries(paneId: string): PhaseOneBarSeriesApi {
    const meta = this.createSeriesMeta("bar");
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
        const state = this.getSourceByApi(api, "bar");
        const seriesOptions = state.options as Required<PhaseOneBarSeriesOptions>;
        if (options.upColor !== undefined) {
          seriesOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          seriesOptions.downColor = options.downColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "bar");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "bar");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "bar");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    this.attachStudySeries(paneId, "bar", api, meta);
    return api;
  }

  private addSecondaryHistogramSeries(paneId: string): PhaseOneHistogramSeriesApi {
    const meta = this.createSeriesMeta("histogram");
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
        const state = this.getSourceByApi(api, "histogram");
        const seriesOptions = state.options as Required<PhaseOneHistogramSeriesOptions>;
        if (options.upColor !== undefined) {
          seriesOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          seriesOptions.downColor = options.downColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "histogram");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "histogram");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "histogram");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    this.attachStudySeries(paneId, "histogram", api, meta);
    return api;
  }

  private addSecondaryVolumeSeries(paneId: string): PhaseOneVolumeSeriesApi {
    const meta = this.createSeriesMeta("volume");
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
        const state = this.getSourceByApi(api, "volume");
        const seriesOptions = state.options as Required<PhaseOneVolumeSeriesOptions>;
        if (options.upColor !== undefined) {
          seriesOptions.upColor = options.upColor;
        }
        if (options.downColor !== undefined) {
          seriesOptions.downColor = options.downColor;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      setMarkers: (markers) => {
        this.assertSeriesActive(api);
        this.setSecondaryMarkers(api, markers, "volume");
      },
      createPriceLine: (options = {}) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "volume");
        const priceLine = this.createPriceLineState(options);
        return this.createPriceLineApi(state.priceLines, priceLine);
      },
      removePriceLine: (line) => {
        this.assertSeriesActive(api);
        const state = this.getSourceByApi(api, "volume");
        this.removePriceLineFromMap(state.priceLines, line);
      },
    };
    this.attachStudySeries(paneId, "volume", api, meta);
    return api;
  }

  private attachStudySeries(
    paneId: string,
    kind: ChartSeriesKind,
    api: SeriesSourceState["api"],
    meta: { id: string; label: string },
    studyKind: StudySourceKind = "series",
  ): void {
    const priceScale = paneId === "primary"
      ? this.primaryPriceScale
      : this.getOrCreateSecondaryPanePriceScale(paneId);
    const priceScaleId = paneId === "primary" ? "primary-right" : `${paneId}-right`;
    this.sourceRegistry.register(
      this.createStudySourceState(
        paneId,
        kind,
        api,
        meta,
        priceScale,
        priceScaleId,
        studyKind,
      ),
    );
  }

  private setSecondaryData(
    api: SeriesSourceState["api"],
    data: readonly PhaseOneCandlestickData[],
    kind: ChartSeriesKind,
  ): void {
    const state = this.getSourceByApi(api, kind);
    state.data = [...data];
    state.visuals.clear();
    this.barSpacing = null;
    this.rightOffset = DEFAULT_RIGHT_OFFSET;
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private updateSecondary(
    api: SeriesSourceState["api"],
    bar: PhaseOneCandlestickData,
    kind: ChartSeriesKind,
  ): void {
    const state = this.getSourceByApi(api, kind);
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
    api: SeriesSourceState["api"],
    data: readonly PhaseOneHistogramData[] | readonly PhaseOneVolumeData[],
    kind: ChartSeriesKind,
  ): void {
    const state = this.getSourceByApi(api, kind);
    state.visuals = buildHistogramVisuals(data);
    this.setSecondaryData(api, normalizeHistogramData(data), kind);
  }

  private updateSecondaryHistogramLike(
    api: SeriesSourceState["api"],
    bar: PhaseOneHistogramData | PhaseOneVolumeData,
    kind: ChartSeriesKind,
  ): void {
    const state = this.getSourceByApi(api, kind);
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

  private setSecondaryMarkers(
    api: SeriesSourceState["api"],
    markers: readonly PhaseOneSeriesMarker[],
    kind: ChartSeriesKind,
  ): void {
    const state = this.getSourceByApi(api, kind);
    state.markers = normalizeMarkers(markers);
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
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
    return this.sourceRegistry.listByPane(paneId).length > 0;
  }

  private resolveSeriesTarget(
    target: PhaseOneSeriesTarget | PhaseOneVolumeSeriesTarget | undefined,
    options: { defaultToSecondary: boolean; allowPrimary: boolean },
  ): ResolvedSeriesTarget {
    if (target?.pane === undefined) {
      if (!options.defaultToSecondary) {
        return { kind: "primary" };
      }

      const existing = this.panes.find((pane) => pane.kind === "secondary")?.id;
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
    if (this.getSecondarySeriesForPane(paneId).length > 0) {
      throw new Error("chartx phase-one chart cannot remove a pane while a series is still attached");
    }

    const removedPaneState = this.buildPaneState(paneId);
    const index = this.getPaneIndex(paneId);
    this.panes.splice(index, 1);
    this.paneResizeHandlers.delete(paneId);
    this.secondaryPanePriceScales.delete(paneId);
    this.emitPaneEvent("removed", paneId, removedPaneState, this.buildPaneStateSnapshot());
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

  private emitPaneEvent(
    type: PhaseOnePaneEventType,
    paneId: string,
    explicitPaneState?: PhaseOnePaneState | null,
    explicitSnapshot?: readonly PhaseOnePaneState[],
  ): void {
    if (this.paneEventHandlers.size === 0) {
      return;
    }
    const paneState = explicitPaneState ?? this.buildPaneState(paneId);
    if (paneState === null) {
      return;
    }
    const event: PhaseOnePaneEvent = {
      type,
      pane: paneState,
      panes: explicitSnapshot ?? this.buildPaneStateSnapshot(),
    };
    for (const handler of this.paneEventHandlers) {
      handler(event);
    }
  }

  private buildPaneState(paneId: string): PhaseOnePaneState | null {
    const pane = this.getPaneById(paneId);
    if (pane === undefined) {
      return null;
    }
    const series = this.getPaneSeriesStates(paneId);
    const seriesKinds = series.map((item) => item.kind);
    return {
      paneIndex: this.getPaneIndex(paneId),
      height: this.getPaneHeight(paneId),
      isPrimary: pane.kind === "primary",
      resizable: pane.resizable,
      hasSeries: seriesKinds.length > 0,
      seriesCount: seriesKinds.length,
      seriesKinds,
      series,
    };
  }

  private buildPaneStateSnapshot(): readonly PhaseOnePaneState[] {
    return this.panes
      .map((pane) => this.buildPaneState(pane.id))
      .filter((pane): pane is PhaseOnePaneState => pane !== null);
  }

  private getPaneSeriesStates(paneId: string): readonly PhaseOnePaneSeriesState[] {
    return this.sourceRegistry.listByPane(paneId).map((source) => ({
      id: source.id,
      label: source.label,
      kind: source.kind,
      sourceRole: source.role,
      studyKind: source.role === "study" ? source.studyKind : null,
      priceScaleId: source.priceScaleId,
      pointCount: source.data.length,
    }));
  }

  private createSeriesMeta(kind: string): { id: string; label: string } {
    const ordinal = this.nextSeriesId;
    this.nextSeriesId += 1;
    return {
      id: `series-${ordinal}`,
      label: `${formatSeriesKindLabel(kind)} ${ordinal}`,
    };
  }

  private createPriceLineState(options: PhaseOnePriceLineOptions = {}): PriceLineState {
    const ordinal = this.nextPriceLineId;
    this.nextPriceLineId += 1;

    return {
      id: `price-line-${ordinal}`,
      price: options.price ?? this.defaultPriceLineOptions.price,
      color: options.color ?? this.defaultPriceLineOptions.color,
      lineWidth: Math.max(1, options.lineWidth ?? this.defaultPriceLineOptions.lineWidth),
      title: options.title ?? `Line ${ordinal}`,
    };
  }

  private createPriceLineApi(
    lines: Map<string, PriceLineState>,
    lineState: PriceLineState,
  ): PhaseOnePriceLineApi {
    const api: PhaseOnePriceLineApi = {
      applyOptions: (options) => {
        this.assertPriceLineActive(lines, api);
        const line = lines.get(lineState.id);
        if (line === undefined) {
          throw new Error("chartx phase-one price line has been removed");
        }
        if (options.price !== undefined) {
          line.price = options.price;
        }
        if (options.color !== undefined) {
          line.color = options.color;
        }
        if (options.lineWidth !== undefined) {
          line.lineWidth = Math.max(1, options.lineWidth);
        }
        if (options.title !== undefined) {
          line.title = options.title;
        }
        if (this.canvas !== null) {
          this.render(this.canvas);
        }
      },
      remove: () => {
        this.removePriceLineFromMap(lines, api);
      },
    };

    this.priceLineHandleIds.set(api, lineState.id);
    lines.set(lineState.id, lineState);
    return api;
  }

  private removePriceLineFromMap(lines: Map<string, PriceLineState>, line: PhaseOnePriceLineApi): void {
    const lineId = this.priceLineHandleIds.get(line);
    if (lineId === undefined || !lines.has(lineId)) {
      throw new Error("chartx phase-one price line has been removed");
    }

    lines.delete(lineId);
    if (this.canvas !== null) {
      this.render(this.canvas);
    }
  }

  private assertPriceLineActive(lines: Map<string, PriceLineState>, line: PhaseOnePriceLineApi): void {
    const lineId = this.priceLineHandleIds.get(line);
    if (lineId === undefined || !lines.has(lineId)) {
      throw new Error("chartx phase-one price line has been removed");
    }
  }

  private createSeriesOptions(
    kind: ChartSeriesKind,
  ):
    | Required<PhaseOneCandlestickSeriesOptions>
    | Required<PhaseOneBarSeriesOptions>
    | Required<PhaseOneLineSeriesOptions>
    | Required<PhaseOneAreaSeriesOptions>
    | Required<PhaseOneBaselineSeriesOptions>
    | Required<PhaseOneHistogramSeriesOptions>
    | Required<PhaseOneVolumeSeriesOptions> {
    switch (kind) {
      case "candlestick":
        return { ...this.candlestickOptions };
      case "bar":
        return { ...this.barOptions };
      case "line":
        return { ...this.lineOptions };
      case "area":
        return { ...this.areaOptions };
      case "baseline":
        return { ...this.baselineOptions };
      case "histogram":
        return { ...this.histogramOptions };
      case "volume":
        return { ...this.volumeOptions };
    }
  }

  private createMainSourceState(
    paneId: string,
    kind: ChartSeriesKind,
    api: ChartSeriesApi,
    meta: { id: string; label: string },
    priceScale: PriceScale,
    priceScaleId: string,
  ): MainSeriesSourceState {
    return {
      id: meta.id,
      label: meta.label,
      kind,
      role: "main-series",
      paneId,
      priceScaleId,
      visible: true,
      api,
      data: [],
      store: new SeriesDataStore<number>(),
      priceScale,
      visuals: new Map<number, HistogramVisual>(),
      priceLines: new Map<string, PriceLineState>(),
      markers: [],
      options: this.createSeriesOptions(kind),
    };
  }

  private createStudySourceState(
    paneId: string,
    kind: ChartSeriesKind,
    api: ChartSeriesApi,
    meta: { id: string; label: string },
    priceScale: PriceScale,
    priceScaleId: string,
    studyKind: StudySourceKind = "series",
  ): StudySourceState {
    return {
      id: meta.id,
      label: meta.label,
      kind,
      role: "study",
      studyKind,
      compareOptions:
        studyKind === "compare"
          ? { ...this.defaultCompareOptions }
          : undefined,
      paneId,
      priceScaleId,
      visible: true,
      api,
      data: [],
      store: new SeriesDataStore<number>(),
      priceScale,
      visuals: new Map<number, HistogramVisual>(),
      priceLines: new Map<string, PriceLineState>(),
      markers: [],
      options: this.createSeriesOptions(kind),
    };
  }

  private getMainSource(): MainSeriesSourceState | null {
    return this.currentMainSourceId === null
      ? null
      : ((this.sourceRegistry.getById(this.currentMainSourceId) as MainSeriesSourceState | undefined) ?? null);
  }

  private getMainSourceOrThrow(): MainSeriesSourceState {
    const source = this.getMainSource();
    if (source === null) {
      throw new Error("chartx phase-one chart requires a primary series before this operation");
    }
    return source;
  }

  private getStudySourcesForPane(paneId: string): StudySourceState[] {
    return this.sourceRegistry
      .listByPane(paneId)
      .filter((entry): entry is StudySourceState => entry.role === "study");
  }

  private getSecondarySeriesForPane(paneId: string): StudySourceState[] {
    return this.getStudySourcesForPane(paneId);
  }

  private getSourceByApi(
    api: ChartSeriesApi,
    kind?: ChartSeriesKind,
  ): SeriesSourceState {
    const source = this.sourceRegistry.getByApi(api);
    if (source === undefined) {
      throw new Error("chartx phase-one series has been removed");
    }
    if (kind !== undefined && source.kind !== kind) {
      throw new Error("chartx phase-one series is attached to an unexpected pane/source kind");
    }
    return source;
  }

  private getCompareStudyState(api: PhaseOneCompareSeriesApi): StudySourceState {
    const source = this.getSourceByApi(api, "line");
    if (source.role !== "study" || source.studyKind !== "compare") {
      throw new Error("chartx phase-one compare api is attached to an unexpected source kind");
    }
    return source;
  }

  private getOrCreateSecondaryPanePriceScale(paneId: string): PriceScale {
    const existing = this.secondaryPanePriceScales.get(paneId);
    if (existing !== undefined) {
      return existing;
    }

    const scale = new PriceScale();
    this.secondaryPanePriceScales.set(paneId, scale);
    return scale;
  }

  private resolveSecondaryPanePriceRange(
    paneSeries: readonly SeriesSourceState[],
    secondaryRows: ReadonlyMap<string, RowSet>,
  ): PriceRangeImpl | null {
    let merged: PriceRangeImpl | null = null;

    for (const state of paneSeries) {
      const rows = secondaryRows.get(state.id);
      if (rows === undefined || rows.length === 0) {
        continue;
      }

      const nextRange = state.store.priceRange(rows[0].index, rows[rows.length - 1].index);
      if (nextRange !== null) {
        merged = merged === null ? nextRange : merged.merge(nextRange);
      }
    }

    return merged;
  }

  private mergeSeriesRange(
    rows: RowSet,
    source: SeriesSourceState,
    merged: PriceRangeImpl | null,
  ): PriceRangeImpl | null {
    if (rows.length === 0) {
      return merged;
    }
    const nextRange = source.store.priceRange(rows[0].index, rows[rows.length - 1].index);
    if (nextRange === null) {
      return merged;
    }
    return merged === null ? nextRange : merged.merge(nextRange);
  }

  private buildPrimaryPaneSeries(
    mainSource: MainSeriesSourceState | null,
  ): readonly SeriesSourceState[] {
    const studies = this.getStudySourcesForPane("primary");
    return mainSource === null ? studies : [mainSource, ...studies];
  }

  private collectPriceLines(sources: readonly SeriesSourceState[]): Map<string, PriceLineState> {
    const lines = new Map<string, PriceLineState>();
    for (const source of sources) {
      for (const [lineId, line] of source.priceLines.entries()) {
        lines.set(lineId, line);
      }
    }
    return lines;
  }

  private renderSeriesSource(
    context: CanvasRenderingContext2D,
    state: SeriesSourceState,
    rows: RowSet,
    paneHeight: number,
    barWidth: number,
    priceScale: PriceScale,
    rangeMin: number | null,
  ): void {
    if (rows.length === 0) {
      return;
    }

    if (state.kind === "line") {
      const seriesOptions = state.options as Required<PhaseOneLineSeriesOptions>;
      const lineItems = rows.map((row): LineItem => ({
        x: this.timeScale.indexToCoordinate(row.index),
        y: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
      }));

      this.lineRenderer.draw(context, {
        items: lineItems,
        lineColor: seriesOptions.color,
        lineWidth: seriesOptions.lineWidth,
      });
      return;
    }

    if (state.kind === "area") {
      const seriesOptions = state.options as Required<PhaseOneAreaSeriesOptions>;
      const areaItems = rows.map((row): AreaItem => ({
        x: this.timeScale.indexToCoordinate(row.index),
        y: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
      }));

      this.areaRenderer.draw(context, {
        items: areaItems,
        lineColor: seriesOptions.lineColor,
        lineWidth: seriesOptions.lineWidth,
        topColor: seriesOptions.topColor,
        bottomColor: seriesOptions.bottomColor,
        baseY: paneHeight,
      });
      return;
    }

    if (state.kind === "baseline") {
      const seriesOptions = state.options as Required<PhaseOneBaselineSeriesOptions>;
      const baselineItems = rows.map((row): BaselineItem => ({
        x: this.timeScale.indexToCoordinate(row.index),
        y: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
      }));
      const baselineY = toCoordinate(priceScale.priceToCoordinate(seriesOptions.baseValue));

      this.baselineRenderer.draw(context, {
        items: baselineItems,
        baseY: baselineY,
        height: paneHeight,
        lineWidth: seriesOptions.lineWidth,
        topLineColor: seriesOptions.topLineColor,
        topFillTopColor: seriesOptions.topFillTopColor,
        topFillBottomColor: seriesOptions.topFillBottomColor,
        bottomLineColor: seriesOptions.bottomLineColor,
        bottomFillTopColor: seriesOptions.bottomFillTopColor,
        bottomFillBottomColor: seriesOptions.bottomFillBottomColor,
      });
      return;
    }

    if (state.kind === "bar") {
      const seriesOptions = state.options as Required<PhaseOneBarSeriesOptions>;
      const barItems = rows.map((row): BarItem => ({
        x: this.timeScale.indexToCoordinate(row.index),
        openY: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Open])),
        highY: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.High])),
        lowY: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Low])),
        closeY: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
        isUp: row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
      }));

      this.barRenderer.draw(context, {
        items: barItems,
        barWidth,
        upColor: seriesOptions.upColor,
        downColor: seriesOptions.downColor,
      });
      return;
    }

    if (state.kind === "candlestick") {
      const seriesOptions = state.options as Required<PhaseOneCandlestickSeriesOptions>;
      const candleItems = rows.map((row): CandlestickItem => ({
        x: this.timeScale.indexToCoordinate(row.index),
        openY: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Open])),
        highY: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.High])),
        lowY: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Low])),
        closeY: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
        isUp: row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
      }));

      this.candlesRenderer.draw(context, {
        items: candleItems,
        barWidth,
        upColor: seriesOptions.upColor,
        downColor: seriesOptions.downColor,
        wickColor: seriesOptions.wickColor,
      });
      return;
    }

    const seriesOptions =
      (state.options as Required<PhaseOneHistogramSeriesOptions | PhaseOneVolumeSeriesOptions>);
    const histogramRangeMin = rangeMin ?? 0;
    const histogramItems = rows.map((row): HistogramItem => ({
      x: this.timeScale.indexToCoordinate(row.index),
      valueY: toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close])),
      baseY: toCoordinate(priceScale.priceToCoordinate(histogramRangeMin)),
      isUp:
        state.visuals.get(row.time)?.isUp ??
        row.value[PlotRowValueIndex.Close] >= row.value[PlotRowValueIndex.Open],
      color: state.visuals.get(row.time)?.color,
    }));

    this.histogramRenderer.draw(context, {
      items: histogramItems,
      barWidth,
      upColor: seriesOptions.upColor,
      downColor: seriesOptions.downColor,
    });
  }

  private buildReadoutSeriesForPrimary(
    primarySources: readonly SeriesSourceState[],
    rowSets: ReadonlyMap<string, RowSet>,
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[] {
    return primarySources.flatMap((source) => {
      const rows = rowSets.get(source.id);
      if (rows === undefined) {
        return [];
      }
      return [{
        id: source.id,
        label: source.label,
        kind: source.kind,
        value: resolveSeriesReadoutValue(rows, crosshair, this.timeScale),
        color: resolveSeriesColor(source),
      }];
    });
  }

  private buildReadoutSeriesForPane(
    paneSeries: readonly SeriesSourceState[],
    crosshair: PanePoint | null,
  ): readonly PhaseOneReadoutSeriesDetail[] {
    return paneSeries.map((state) => {
      const rows = state.store.setData(state.data);
      return {
        id: state.id,
        label: state.label,
        kind: state.kind,
        value: resolveSeriesReadoutValue(rows, crosshair, this.timeScale),
        color: resolveSeriesColor(state),
      };
    });
  }

  private buildReadout(point: PanePoint | null, layout: Layout): PhaseOneReadoutDetail {
    const mainSource = this.getMainSource();
    const primaryRows = mainSource === null ? [] : mainSource.store.setData(mainSource.data);
    const primaryStudies = this.getStudySourcesForPane("primary");
    const primarySources = this.buildPrimaryPaneSeries(mainSource);
    const primaryRowSets = new Map<string, RowSet>();
    if (mainSource !== null) {
      primaryRowSets.set(mainSource.id, primaryRows);
    }
    for (const study of primaryStudies) {
      primaryRowSets.set(study.id, study.store.setData(study.data));
    }
    const paneFrames = buildPaneFrames(this.panes, layout.height - layout.top - layout.bottom);
    const activePane = point === null ? null : resolveActivePane(paneFrames, point.y);
    const logicalPoint = point === null ? null : resolveLocalPanePoint(activePane, point);
    const activePaneIndex = activePane === null ? null : this.getPaneIndex(activePane.id);

    if (primaryRows.length > 0) {
      const baseReadout = buildCrosshairReadout(
        primaryRows,
        logicalPoint === null ? null : { x: logicalPoint.x, y: logicalPoint.y },
        this.timeScale,
        this.primaryPriceScale,
      );
      const baseSeries = this.buildReadoutSeriesForPrimary(primarySources, primaryRowSets, logicalPoint);

      if (activePane !== null && activePane.kind === "secondary" && logicalPoint !== null) {
        const paneSeries = this.getSecondarySeriesForPane(activePane.id);
        const state = paneSeries[0];
        if (state !== undefined) {
          const paneSeriesReadout = this.buildReadoutSeriesForPane(
            paneSeries,
            logicalPoint,
          );
          if (state.kind === "candlestick" || state.kind === "bar") {
            const rows = state.store.setData(state.data);
            return {
              ...buildCrosshairReadout(
                rows,
                { x: logicalPoint.x, y: logicalPoint.y },
                this.timeScale,
                state.priceScale,
              ),
              paneIndex: activePaneIndex,
              series: paneSeriesReadout,
            };
          }
          return {
            ...baseReadout,
            paneIndex: activePaneIndex,
            price: state.priceScale.coordinateToPrice(logicalPoint.y),
            series: paneSeriesReadout,
          };
        }
      }

      return {
        ...baseReadout,
        paneIndex: activePaneIndex ?? 0,
        series: baseSeries,
      };
    }

    if (activePane !== null && activePane.kind === "secondary") {
      const paneSeries = this.getSecondarySeriesForPane(activePane.id);
      const state = paneSeries[0];
      if (state !== undefined) {
        const rows = state.store.setData(state.data);
        return {
          ...buildCrosshairReadout(
            rows,
            logicalPoint === null ? null : { x: logicalPoint.x, y: logicalPoint.y },
            this.timeScale,
            state.priceScale,
          ),
          paneIndex: activePaneIndex,
          series: this.buildReadoutSeriesForPane(paneSeries, logicalPoint),
        };
      }
    }

    return {
      active: false,
      paneIndex: activePaneIndex,
      time: null,
      open: null,
      high: null,
      low: null,
      close: null,
      price: null,
      series: [],
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
    const mainSource = this.getMainSource();
    const primaryRows = mainSource === null ? [] : mainSource.store.setData(mainSource.data);
    const primaryStudies = this.getStudySourcesForPane("primary");
    const primarySources = this.buildPrimaryPaneSeries(mainSource);
    const primaryRowSets = new Map<string, RowSet>();
    if (mainSource !== null) {
      primaryRowSets.set(mainSource.id, primaryRows);
    }
    for (const state of primaryStudies) {
      primaryRowSets.set(state.id, state.store.setData(state.data));
    }
    const secondaryRows = new Map<string, ReturnType<SeriesDataStore<number>["setData"]>>();
    let pointCount = primaryRows.length;
    for (const state of this.sourceRegistry.list().filter((entry) => entry.role === "study")) {
      const seriesId = state.id;
      const rows = state.paneId === "primary"
        ? (primaryRowSets.get(state.id) ?? state.store.setData(state.data))
        : state.store.setData(state.data);
      secondaryRows.set(seriesId, rows);
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

      context.save();
      context.beginPath();
      context.rect(0, 0, paneWidth, pane.height);
      context.clip();

      if (pane.kind === "primary" && primaryRows.length > 0 && mainSource !== null) {
        let computedPrimaryRange = mainSource.store.priceRange(
          primaryRows[0].index,
          primaryRows[primaryRows.length - 1].index,
        );
        for (const state of primaryStudies) {
          if (
            state.studyKind === "compare" &&
            (this.primaryScaleSeriesOnly || state.compareOptions?.affectMainScale === false)
          ) {
            continue;
          }
          const rows = primaryRowSets.get(state.id) ?? [];
          computedPrimaryRange = this.mergeSeriesRange(rows, state, computedPrimaryRange);
        }
        this.primaryPriceScale.applyOptions({
          height: pane.height,
          priceRange: this.primaryPriceRangeOverride ?? computedPrimaryRange,
        });

        const primaryRangeMin = (this.primaryPriceRangeOverride ?? computedPrimaryRange)?.minValue() ?? 0;
        for (const state of primarySources) {
          const rows = primaryRowSets.get(state.id) ?? [];
          this.renderSeriesSource(
            context,
            state,
            rows,
            pane.height,
            barWidth,
            this.primaryPriceScale,
            primaryRangeMin,
          );
        }

        drawPriceLines(
          context,
          paneWidth,
          pane.height,
          this.primaryPriceScale,
          this.collectPriceLines(primarySources),
          this.chartOptions,
          this.priceAxisFormatter,
        );

        for (const state of primarySources) {
          const rows = primaryRowSets.get(state.id) ?? [];
          drawSeriesMarkers(
            context,
            rows,
            state.markers,
            this.timeScale,
            this.primaryPriceScale,
            pane.height,
            state.kind,
          );
        }
      }

      if (pane.kind === "secondary") {
        const paneSeries = this.getSecondarySeriesForPane(pane.id);
        const panePriceScale = this.secondaryPanePriceScales.get(pane.id);
        const range = this.resolveSecondaryPanePriceRange(paneSeries, secondaryRows);
        if (panePriceScale !== undefined && range !== null) {
          panePriceScale.applyOptions({
            height: pane.height,
            priceRange: range,
          });
        }

        for (const state of paneSeries) {
          const rows = secondaryRows.get(state.id);
          if (rows === undefined || rows.length === 0) {
            continue;
          }
          this.renderSeriesSource(context, state, rows, pane.height, barWidth, state.priceScale, range?.minValue() ?? 0);
        }

        if (panePriceScale !== undefined) {
          const panePriceLines = new Map<string, PriceLineState>();
          for (const state of paneSeries) {
            for (const [lineId, line] of state.priceLines.entries()) {
              panePriceLines.set(lineId, line);
            }
          }

          drawPriceLines(
            context,
            paneWidth,
            pane.height,
            panePriceScale,
            panePriceLines,
            this.chartOptions,
            this.priceAxisFormatter,
          );
        }

        for (const state of paneSeries) {
          const rows = secondaryRows.get(state.id);
          if (rows === undefined || rows.length === 0) {
            continue;
          }

          drawSeriesMarkers(
            context,
            rows,
            state.markers,
            this.timeScale,
            state.priceScale,
            pane.height,
            state.kind,
          );
        }
      }

      context.restore();

      const legendEntries =
        pane.kind === "primary"
          ? this.buildReadoutSeriesForPrimary(
              primarySources,
              primaryRowSets,
              resolveLocalPanePoint(activePane?.id === pane.id ? activePane : null, this.crosshair),
            )
          : this.buildReadoutSeriesForPane(
              this.getSecondarySeriesForPane(pane.id),
              resolveLocalPanePoint(activePane?.id === pane.id ? activePane : null, this.crosshair),
            );
      drawPaneLegend(context, legendEntries);

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
          this.priceAxisFormatter,
        );
      }
    }

    for (const pane of paneFrames) {
      if (pane.kind !== "secondary") {
        continue;
      }
      const state = this.getSecondarySeriesForPane(pane.id)[0];
      const hasRows = this.getSecondarySeriesForPane(pane.id).some(
        (entry) => (secondaryRows.get(entry.id)?.length ?? 0) > 0,
      );
      if (state !== undefined && hasRows) {
        drawPriceAxis(
          context,
          layout,
          pane.top,
          pane.height,
          state.priceScale,
          resolveLocalPanePoint(activePane?.id === pane.id ? activePane : null, this.crosshair),
          this.chartOptions,
          state.kind === "volume" ? "volume" : "primary",
          this.priceAxisFormatter,
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
      this.timeAxisFormatter,
    );
    const readout = this.buildReadout(this.crosshair, layout);
    emitReadout(canvas, readout);
    this.emitCrosshairMove(readout);
  }

  private assertSeriesActive(series: ChartSeriesApi): void {
    if (!this.sourceRegistry.hasApi(series)) {
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
    addAreaSeries(target) {
      return harness.addAreaSeries(target);
    },
    addBaselineSeries(target) {
      return harness.addBaselineSeries(target);
    },
    addHistogramSeries(target) {
      return harness.addHistogramSeries(target);
    },
    addVolumeSeries(target) {
      return harness.addVolumeSeries(target);
    },
    addOverlaySeries(target) {
      return harness.addOverlaySeries(target);
    },
    addCompareSeries(target) {
      return harness.addCompareSeries(target);
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

function formatSeriesKindLabel(kind: string): string {
  switch (kind) {
    case "candlestick":
      return "Candlestick";
    case "line":
      return "Line";
    case "area":
      return "Area";
    case "baseline":
      return "Baseline";
    case "bar":
      return "Bar";
    case "histogram":
      return "Histogram";
    case "volume":
      return "Volume";
    default:
      return "Series";
  }
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
  const width = Math.max(480, availableWidth);
  const aspectHeight = Math.round((width / DEFAULT_LAYOUT.width) * DEFAULT_LAYOUT.height);

  return {
    ...DEFAULT_LAYOUT,
    width,
    height: Math.max(320, aspectHeight),
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
  if (currentSpacing !== null) {
    return Math.max(MIN_BAR_SPACING, currentSpacing);
  }

  return clamp(
    calculateBaseBarSpacing(paneWidth, pointCount),
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

function drawPaneLegend(
  context: CanvasRenderingContext2D,
  entries: readonly PhaseOneReadoutSeriesDetail[],
): void {
  if (entries.length === 0) {
    return;
  }

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "top";

  let x = 10;
  for (const entry of entries) {
    const value = entry.value === null ? "--" : formatLegendValue(entry.kind, entry.value);
    const text = `${entry.label} ${value}`;
    const textWidth = context.measureText(text).width;

    context.fillStyle = "rgba(255, 253, 247, 0.92)";
    context.strokeStyle = "rgba(16, 16, 16, 0.12)";
    context.lineWidth = 1;
    context.fillRect(x, 8, textWidth + 22, 18);
    context.strokeRect(x + 0.5, 8.5, textWidth + 21, 17);

    context.fillStyle = entry.color;
    context.beginPath();
    context.arc(x + 7, 17, 3, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(16, 16, 16, 0.78)";
    context.fillText(text, x + 13, 12);
    x += textWidth + 30;
  }

  context.restore();
}

function normalizeMarkers(markers: readonly PhaseOneSeriesMarker[]): readonly SeriesMarkerState[] {
  return markers.map((marker, index) => ({
    time: marker.time,
    position: marker.position ?? "aboveBar",
    shape: marker.shape ?? "circle",
    color: marker.color ?? "#2563eb",
    text: marker.text ?? "",
  })).sort((left, right) => left.time - right.time || left.text.localeCompare(right.text) || 0);
}

function drawPriceLines(
  context: CanvasRenderingContext2D,
  paneWidth: number,
  paneHeight: number,
  priceScale: PriceScale,
  priceLines: ReadonlyMap<string, PriceLineState>,
  options: Required<NonNullable<PhaseOneChartOptions["layout"]>>,
  formatter: ((value: number) => string) | null,
): void {
  if (priceLines.size === 0) {
    return;
  }

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textBaseline = "middle";
  context.setLineDash([4, 4]);

  for (const line of priceLines.values()) {
    const y = toCoordinate(priceScale.priceToCoordinate(line.price));
    if (y < 0 || y > paneHeight) {
      continue;
    }

    context.strokeStyle = line.color;
    context.lineWidth = line.lineWidth;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(paneWidth, y);
    context.stroke();

    const formattedPrice = formatPriceAxisLabel(line.price, formatter);
    const label = line.title.trim() === "" ? formattedPrice : `${line.title} ${formattedPrice}`;
    drawAxisTag(
      context,
      {
        text: label,
        x: Math.max(8, paneWidth - context.measureText(label).width - 22),
        y: y - 9,
      },
      {
        ...options,
        axisLabelBackground: "rgba(255, 253, 247, 0.9)",
        axisLabelBorder: line.color,
        axisTextColor: line.color,
      },
    );
  }

  context.restore();
}

function drawSeriesMarkers(
  context: CanvasRenderingContext2D,
  rows: readonly {
    time: number;
    index: Parameters<TimeScale["indexToCoordinate"]>[0];
    value: readonly number[];
  }[],
  markers: readonly SeriesMarkerState[],
  timeScale: TimeScale,
  priceScale: PriceScale,
  paneHeight: number,
  kind: ChartSeriesKind | null,
): void {
  if (markers.length === 0 || rows.length === 0 || kind === null) {
    return;
  }

  const rowsByTime = new Map(rows.map((row) => [row.time, row]));

  context.save();
  context.font = '11px "SF Mono", "Menlo", monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (const marker of markers) {
    const row = rowsByTime.get(marker.time);
    if (row === undefined) {
      continue;
    }

    const x = timeScale.indexToCoordinate(row.index);
    const y = markerYForRow(row, marker.position, priceScale, kind, paneHeight);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < -24 || x > 5000) {
      continue;
    }

    drawMarkerShape(context, x, y, marker.shape, marker.color);
    if (marker.text !== "") {
      const textY = marker.position === "belowBar" ? y + 13 : y - 13;
      context.fillStyle = marker.color;
      context.fillText(marker.text, x, textY);
    }
  }

  context.restore();
}

function markerYForRow(
  row: { value: readonly number[] },
  position: PhaseOneSeriesMarkerPosition,
  priceScale: PriceScale,
  kind: ChartSeriesKind | "candlestick" | "bar" | "line" | "area" | "baseline" | "histogram",
  paneHeight: number,
): number {
  const openY = toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Open]));
  const highY = toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.High]));
  const lowY = toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Low]));
  const closeY = toCoordinate(priceScale.priceToCoordinate(row.value[PlotRowValueIndex.Close]));

  if (position === "inBar") {
    if (kind === "histogram" || kind === "volume") {
      const range = priceScale.getPriceRange();
      const basePrice = range?.minValue() ?? 0;
      const baseY = toCoordinate(priceScale.priceToCoordinate(basePrice));
      return Math.max(12, Math.min(paneHeight - 12, (baseY + closeY) / 2));
    }
    return Math.max(12, Math.min(paneHeight - 12, closeY));
  }

  if (position === "aboveBar") {
    const anchor = kind === "line" || kind === "area" || kind === "baseline" ? closeY : highY;
    return Math.max(10, anchor - 14);
  }

  const anchor = kind === "line" || kind === "area" || kind === "baseline" ? closeY : lowY;
  return Math.min(paneHeight - 10, anchor + 14);
}

function drawMarkerShape(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  shape: PhaseOneSeriesMarkerShape,
  color: string,
): void {
  context.save();
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = 1.5;

  if (shape === "circle") {
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  if (shape === "square") {
    context.fillRect(x - 4, y - 4, 8, 8);
    context.restore();
    return;
  }

  context.beginPath();
  if (shape === "arrowUp") {
    context.moveTo(x, y - 6);
    context.lineTo(x + 6, y + 4);
    context.lineTo(x + 2, y + 4);
    context.lineTo(x + 2, y + 8);
    context.lineTo(x - 2, y + 8);
    context.lineTo(x - 2, y + 4);
    context.lineTo(x - 6, y + 4);
  } else {
    context.moveTo(x, y + 6);
    context.lineTo(x + 6, y - 4);
    context.lineTo(x + 2, y - 4);
    context.lineTo(x + 2, y - 8);
    context.lineTo(x - 2, y - 8);
    context.lineTo(x - 2, y - 4);
    context.lineTo(x - 6, y - 4);
  }
  context.closePath();
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
  formatter: ((value: number) => string) | null,
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
          : formatPriceAxisLabel(price, formatter),
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
            : formatPriceAxisLabel(price, formatter),
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
  formatter: ((time: number) => string) | null,
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
    const text = formatTimeAxisLabel(row.time, formatter);
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
    const text = formatTimeAxisLabel(row.time, formatter);
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

function formatPriceAxisLabel(value: number, formatter: ((value: number) => string) | null = null): string {
  if (formatter !== null) {
    return formatter(value);
  }
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

function formatTimeAxisLabel(value: number, formatter: ((time: number) => string) | null = null): string {
  if (formatter !== null) {
    return formatter(value);
  }
  if (Math.abs(value) < 100_000_000_000) {
    return `T ${value}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatLegendValue(kind: string, value: number): string {
  return kind === "volume" ? formatVolumeAxisLabel(value) : formatPriceAxisLabel(value);
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
      paneIndex: null,
      time: null,
      open: null,
      high: null,
      low: null,
      close: null,
      price: null,
      series: [],
    };
  }

  const logical = Math.round(timeScale.coordinateToLogical(crosshair.x));
  const row = rows[clamp(logical, 0, rows.length - 1)];

  return {
    active: true,
    paneIndex: null,
    time: row.time,
    open: row.value[PlotRowValueIndex.Open],
    high: row.value[PlotRowValueIndex.High],
    low: row.value[PlotRowValueIndex.Low],
    close: row.value[PlotRowValueIndex.Close],
    price: priceScale.coordinateToPrice(crosshair.y),
    series: [],
  };
}

function resolveSeriesReadoutValue(
  rows: readonly { time: number; value: [number, number, number, number] }[],
  crosshair: PanePoint | null,
  timeScale: TimeScale,
): number | null {
  if (rows.length === 0) {
    return null;
  }

  if (crosshair === null) {
    return rows[rows.length - 1]?.value[PlotRowValueIndex.Close] ?? null;
  }

  const logical = Math.round(timeScale.coordinateToLogical(crosshair.x));
  const row = rows[clamp(logical, 0, rows.length - 1)];
  return row?.value[PlotRowValueIndex.Close] ?? null;
}

function resolveSeriesColor(state: SeriesSourceState): string {
  const last = state.data[state.data.length - 1];
  switch (state.kind) {
    case "line": {
      const options = state.options as Required<PhaseOneLineSeriesOptions>;
      return options.color;
    }
    case "area": {
      const options = state.options as Required<PhaseOneAreaSeriesOptions>;
      return options.lineColor;
    }
    case "baseline": {
      const options = state.options as Required<PhaseOneBaselineSeriesOptions>;
      return last !== undefined && last.close >= options.baseValue
        ? options.topLineColor
        : options.bottomLineColor;
    }
    case "bar": {
      const options = state.options as Required<PhaseOneBarSeriesOptions>;
      return last !== undefined && last.close >= last.open ? options.upColor : options.downColor;
    }
    case "candlestick": {
      const options = state.options as Required<PhaseOneCandlestickSeriesOptions>;
      return last !== undefined && last.close >= last.open ? options.upColor : options.downColor;
    }
    case "histogram":
    case "volume": {
      const options = state.options as Required<PhaseOneHistogramSeriesOptions | PhaseOneVolumeSeriesOptions>;
      if (last === undefined) {
        return options.upColor;
      }
      const visual = state.visuals.get(last.time);
      return visual?.color ?? (visual?.isUp ?? (last.close >= last.open) ? options.upColor : options.downColor);
    }
  }
}

function assertCanvasElement(value: unknown): asserts value is HTMLCanvasElement {
  if (!(value instanceof HTMLCanvasElement)) {
    throw new Error("chartx phase-one chart requires an HTMLCanvasElement");
  }
}
