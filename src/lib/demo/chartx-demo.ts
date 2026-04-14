import {
  createChartxPhaseOneChart,
  type PhaseOneCandlestickData,
  type PhaseOneCandlestickSeriesApi,
  type PhaseOneChartApi,
  type PhaseOneChartTypeChangeHandler,
  type PhaseOneChartOptions,
  type PhaseOneClickEvent,
  type PhaseOneCrosshairMoveEvent,
  type PhaseOneDrawingPropertySchema,
  type PhaseOneDrawingStateSnapshot,
  type PhaseOneHorizontalLineDrawingOptions,
  type PhaseOneHistogramData,
  type PhaseOneLineData,
  type PhaseOneMainChartType,
  type PhaseOnePaneApi,
  type PhaseOnePaneEvent,
  type PhaseOnePaneState,
  type PhaseOneTrendLineDrawingOptions,
  type PhaseOneVolumeData,
} from "$lib/chartx/public";

export type DemoTabId = "workbench" | "features";
export type FeatureTabId =
  | "series"
  | "panes"
  | "interactions"
  | "scales"
  | "annotations"
  | "data"
  | "styling"
  | "events";

export type DemoActionTone = "default" | "accent" | "danger";

export type DemoAction = {
  id: string;
  label: string;
  tone?: DemoActionTone;
  group?: "chart-type" | "chart-action" | "renko-option" | "point-figure-option";
  active?: boolean;
};

export type DemoMetric = {
  label: string;
  value: string;
};

export type DemoSnapshot = {
  title: string;
  summary: string;
  metrics: readonly DemoMetric[];
  eventLog: readonly string[];
  note?: string;
  featureGap?: string;
  drawingTool?: {
    activeTool: WorkbenchDrawingTool;
    pendingTrendLineStartTime: number | null;
    pendingTrendLineStartPoint: { x: number; y: number } | null;
  };
  selectedDrawing?: {
    state: PhaseOneDrawingStateSnapshot;
    schema: PhaseOneDrawingPropertySchema;
  } | null;
};

export type DemoController = {
  actions(): readonly DemoAction[];
  runAction(actionId: string): void;
  applySelectedDrawingOptions?(options: Record<string, unknown>): void;
  setDrawingTool?(tool: WorkbenchDrawingTool): void;
  destroy(): void;
};

export type FeatureExampleDescriptor = {
  id: FeatureTabId;
  label: string;
  summary: string;
  available: boolean;
};

type SnapshotPublisher = (snapshot: DemoSnapshot) => void;
type EventLog = string[];
type ThemeId = "warm" | "ink";
type WorkbenchMainChartType = Exclude<PhaseOneMainChartType, "histogram">;
export type WorkbenchDrawingTool = "none" | "horizontal-line" | "trend-line";
type WorkbenchRenkoMode = "auto" | "fixed";
type WorkbenchPointFigureMode = "auto" | "fixed";

const DAY = 60_000;
const BASE_TIME = Date.UTC(2026, 2, 2, 1, 30, 0);
const WORKBENCH_PREVIEW_CANVAS_INSET = {
  left: 18,
  top: 28,
} as const;

const WARM_THEME: Required<NonNullable<PhaseOneChartOptions["layout"]>> &
  Required<NonNullable<PhaseOneChartOptions["crosshair"]>> = {
  backgroundColor: "#fffdf7",
  paneBackgroundColor: "#fffaf0",
  gridColor: "rgba(16, 16, 16, 0.08)",
  frameColor: "rgba(16, 16, 16, 0.18)",
  axisTextColor: "rgba(16, 16, 16, 0.74)",
  axisLabelBackground: "rgba(255, 253, 247, 0.96)",
  axisLabelBorder: "rgba(16, 16, 16, 0.14)",
  axisActiveBackground: "#101010",
  axisActiveText: "#fffdf7",
  lineColor: "rgba(16, 16, 16, 0.48)",
  pointColor: "#101010",
};

const INK_THEME: Required<NonNullable<PhaseOneChartOptions["layout"]>> &
  Required<NonNullable<PhaseOneChartOptions["crosshair"]>> = {
  backgroundColor: "#f3f7fb",
  paneBackgroundColor: "#edf3fa",
  gridColor: "rgba(15, 23, 42, 0.08)",
  frameColor: "rgba(15, 23, 42, 0.18)",
  axisTextColor: "rgba(15, 23, 42, 0.7)",
  axisLabelBackground: "rgba(255, 255, 255, 0.94)",
  axisLabelBorder: "rgba(15, 23, 42, 0.12)",
  axisActiveBackground: "#0f172a",
  axisActiveText: "#f8fafc",
  lineColor: "rgba(15, 23, 42, 0.42)",
  pointColor: "#0f172a",
};

export const FEATURE_TABS: readonly FeatureExampleDescriptor[] = [
  {
    id: "series",
    label: "Series",
    summary: "Compare the current candlestick, bar, line, area, baseline, histogram, and volume paths.",
    available: true,
  },
  {
    id: "panes",
    label: "Panes",
    summary: "Show pane lifecycle, resizing, and controlled multi-series composition.",
    available: true,
  },
  {
    id: "interactions",
    label: "Interactions",
    summary: "Surface crosshair, click, pan, and zoom behavior in one focused chart.",
    available: true,
  },
  {
    id: "scales",
    label: "Scales",
    summary: "Expose the visible logical and price ranges driven by the public scale handles.",
    available: true,
  },
  {
    id: "annotations",
    label: "Annotations",
    summary: "Show the first public price-line path while markers remain an explicit next gap.",
    available: true,
  },
  {
    id: "data",
    label: "Data",
    summary: "Exercise setData, append, replace-last, and invalid update handling.",
    available: true,
  },
  {
    id: "styling",
    label: "Styling",
    summary: "Switch themes and per-series style options without touching chart internals.",
    available: true,
  },
  {
    id: "events",
    label: "Events",
    summary: "Show crosshair, click, pane lifecycle, and pane resize subscriptions together.",
    available: true,
  },
] as const;

export function mountWorkbenchDemo(
  canvas: HTMLCanvasElement,
  publish: SnapshotPublisher,
): DemoController {
  const log: EventLog = [];
  let chart: PhaseOneChartApi | null = null;
  let studyPaneEnabled = true;
  let emptyPaneCount = 0;
  let theme: ThemeId = "warm";
  let mainChartType: WorkbenchMainChartType = "candlestick";
  let renkoMode: WorkbenchRenkoMode = "auto";
  let renkoFixedBoxSize = 4;
  let pointFigureMode: WorkbenchPointFigureMode = "fixed";
  let pointFigureFixedBoxSize = 360;
  let pointFigureReversalBoxes = 5;
  let barSpacing = 15;
  let rightOffset = 0.8;
  let drawingTool: WorkbenchDrawingTool = "none";
  let pendingTrendLineStart: { time: number; price: number; point: { x: number; y: number } | null } | null = null;
  let latestReadout: PhaseOneCrosshairMoveEvent | null = null;
  let latestClick: PhaseOneClickEvent | null = null;
  let latestPaneEvent: PhaseOnePaneEvent | null = null;
  let paneSnapshot: readonly PhaseOnePaneState[] = [];
  let teardownChartTypeSubscription: (() => void) | null = null;

  const workbenchSeries = (chartType: WorkbenchMainChartType) => {
    const bars =
      chartType === "point-figure"
        ? createPointFigureWorkbenchBars(96)
        : createWorkbenchBars(10_000);
    return {
      bars,
      volume: createVolumeData(bars),
      line: createLineData(bars, chartType === "point-figure" ? 18 : 6),
      visibleTrendStartBar: bars.at(-52) ?? bars[0]!,
      visibleTrendEndBar: bars.at(-18) ?? bars.at(-1) ?? bars[0]!,
    };
  };

  const publishSnapshot = () => {
    const visibleLogical = chart?.timeScale().getVisibleLogicalRange() ?? null;
    const visiblePrice = chart?.priceScale().getVisibleRange() ?? null;

    publish({
      title: "Workbench",
      summary:
        "The default example now behaves like a compact chart terminal instead of a document-like homepage.",
      metrics: [
        { label: "Theme", value: theme === "warm" ? "Warm terminal" : "Ink terminal" },
        { label: "Main type", value: formatWorkbenchChartType(mainChartType) },
        ...(mainChartType === "renko"
          ? [{
              label: "Renko",
              value: renkoMode === "auto" ? "Auto box" : `Fixed ${renkoFixedBoxSize}`,
            }]
          : []),
        ...(mainChartType === "point-figure"
          ? [{
              label: "P&F",
              value:
                pointFigureMode === "auto"
                  ? `Auto box · ${pointFigureReversalBoxes} rev`
                  : `Fixed ${pointFigureFixedBoxSize} pts · ${pointFigureReversalBoxes} rev`,
            }]
          : []),
        { label: "Panes", value: String(paneSnapshot.length) },
        {
          label: "Visible bars",
          value: visibleLogical === null ? "--" : `${visibleLogical.from.toFixed(1)} → ${visibleLogical.to.toFixed(1)}`,
        },
        {
          label: "Price range",
          value:
            visiblePrice === null
              ? "--"
              : `${visiblePrice.minValue.toFixed(2)} → ${visiblePrice.maxValue.toFixed(2)}`,
        },
        {
          label: "Active pane",
          value: latestReadout?.paneIndex === null || latestReadout === null ? "--" : `Pane ${latestReadout.paneIndex + 1}`,
        },
      ],
      eventLog: [...log],
      note:
        latestPaneEvent === null
          ? "Use the buttons below the chart to mutate panes and scales through the public API."
          : `Last pane event: ${latestPaneEvent.type} on pane ${latestPaneEvent.pane.paneIndex + 1}`,
      featureGap:
        pendingTrendLineStart !== null
          ? `Trend line start armed at ${formatTime(pendingTrendLineStart.time)} · ${pendingTrendLineStart.price.toFixed(2)}`
          : latestClick?.price === null || latestClick === null
            ? "Click the chart to pin the last inspected price into the right panel."
            : `Last click: ${latestClick.price.toFixed(2)} at ${formatTime(latestClick.time)}`,
      drawingTool: {
        activeTool: drawingTool,
        pendingTrendLineStartTime: pendingTrendLineStart?.time ?? null,
        pendingTrendLineStartPoint: pendingTrendLineStart?.point ?? null,
      },
      selectedDrawing:
        chart === null
          ? null
          : (() => {
              const state = chart.getSelectedDrawingState();
              const schema = chart.getSelectedDrawingPropertySchema();
              return state === null || schema === null ? null : { state, schema };
            })(),
    });
  };

  const rebuild = () => {
    const {
      bars,
      volume,
      line,
      visibleTrendStartBar,
      visibleTrendEndBar,
    } = workbenchSeries(mainChartType);

    chart?.destroy();
    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions(theme === "warm" ? warmChartOptions() : inkChartOptions());
    chart.timeScale().applyOptions({ barSpacing, rightOffset });
    teardownChartTypeSubscription?.();
    const handleChartTypeChange: PhaseOneChartTypeChangeHandler = (type) => {
      if (type !== "histogram") {
        mainChartType = type;
      }
      pushLog(log, `chart type ${type}`);
      publishSnapshot();
    };
    chart.subscribeChartTypeChange(handleChartTypeChange);
    teardownChartTypeSubscription = () => {
      chart?.unsubscribeChartTypeChange(handleChartTypeChange);
      teardownChartTypeSubscription = null;
    };
    chart.subscribePaneEvents((event) => {
      latestPaneEvent = event;
      paneSnapshot = event.panes;
      pushLog(log, `${event.type} pane ${event.pane.paneIndex + 1}`);
      publishSnapshot();
    });

    if (mainChartType === "candlestick") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
    } else if (mainChartType === "line-break") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      chart.setChartType("line-break");
    } else if (mainChartType === "kagi") {
      const mainSeries = chart.addLineSeries();
      mainSeries.setData(line);
      chart.setChartType("kagi");
    } else if (mainChartType === "point-figure") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      chart.setChartType("point-figure").applyOptions({
        pointFigureBoxSizeMode: pointFigureMode,
        pointFigureBoxSize: pointFigureMode === "fixed" ? pointFigureFixedBoxSize : null,
        pointFigureReversalBoxes,
      });
    } else if (mainChartType === "volume-candles") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      chart.setChartType("volume-candles");
    } else if (mainChartType === "hollow-candles") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      chart.setChartType("hollow-candles");
    } else if (mainChartType === "heikin-ashi") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      chart.setChartType("heikin-ashi");
    } else if (mainChartType === "renko") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      const renkoSeries = chart.setChartType("renko");
      renkoSeries.applyOptions({
        renkoBoxSizeMode: renkoMode,
        renkoBoxSize: renkoMode === "fixed" ? renkoFixedBoxSize : null,
      });
    } else if (mainChartType === "bar") {
      const mainSeries = chart.addBarSeries();
      mainSeries.setData(bars);
    } else if (mainChartType === "hlc-bars") {
      const mainSeries = chart.addBarSeries();
      mainSeries.setData(bars);
      chart.setChartType("hlc-bars");
    } else if (mainChartType === "high-low") {
      const mainSeries = chart.addBarSeries();
      mainSeries.setData(bars);
      chart.setChartType("high-low");
    } else if (mainChartType === "line") {
      const mainSeries = chart.addLineSeries();
      mainSeries.setData(line);
    } else if (mainChartType === "line-markers") {
      const mainSeries = chart.addLineSeries();
      mainSeries.setData(line);
      chart.setChartType("line-markers");
    } else if (mainChartType === "stepline") {
      const mainSeries = chart.addLineSeries();
      mainSeries.setData(line);
      chart.setChartType("stepline");
    } else if (mainChartType === "area") {
      const mainSeries = chart.addAreaSeries();
      mainSeries.setData(line);
    } else {
      const mainSeries = chart.addBaselineSeries();
      mainSeries.applyOptions({ baseValue: 16_950 });
      mainSeries.setData(line);
    }

    {
      const volumePane = chart.addPane({ height: 126 });
      const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
      volumeSeries.setData(volume);
    }

    if (studyPaneEnabled) {
      const studyPane = chart.addPane({ height: 126 });
      const studySeries = chart.addLineSeries({ pane: studyPane });
      studySeries.applyOptions({
        color: theme === "warm" ? "#365cb7" : "#2563eb",
        lineWidth: 3,
      });
      studySeries.setData(line);
    }

    for (let index = 0; index < emptyPaneCount; index += 1) {
      chart.addPane({ height: 88, resizable: true });
    }

    chart.addHorizontalLineDrawing(undefined, {
      price: 16_940,
      title: "Swing low",
      color: theme === "warm" ? "#9333ea" : "#7c3aed",
      lineWidth: 2,
      magnetEnabled: true,
      timeMagnetPolicy: "previous",
    });
    chart.addTrendLineDrawing(undefined, {
      startTime: visibleTrendStartBar.time,
      startPrice: visibleTrendStartBar.low - 18,
      endTime: visibleTrendEndBar.time,
      endPrice: visibleTrendEndBar.high + 14,
      color: theme === "warm" ? "#ea580c" : "#2563eb",
      lineWidth: 3,
      magnetEnabled: true,
      timeMagnetEnabled: true,
      timeMagnetPolicy: "nearest",
    });

    chart.subscribeCrosshairMove((event) => {
      latestReadout = event;
      publishSnapshot();
    });
    chart.subscribeClick((event) => {
      latestClick = event;
      if (event.time !== null && event.price !== null && drawingTool !== "none") {
        if (drawingTool === "horizontal-line") {
          const drawing = chart?.addHorizontalLineDrawing(undefined, {
            price: event.price,
            title: `Horizontal line ${formatTime(event.time)}`,
            color: theme === "warm" ? "#9333ea" : "#7c3aed",
            lineWidth: 2,
            magnetEnabled: true,
            timeMagnetEnabled: false,
          });
          drawing?.select();
          drawingTool = "none";
          pendingTrendLineStart = null;
          pushLog(log, `tool created horizontal-line ${event.price.toFixed(2)}`);
          publishSnapshot();
          return;
        }

        if (pendingTrendLineStart === null) {
          pendingTrendLineStart = {
            time: event.time,
            price: event.price,
            point:
              event.point === null
                ? null
                : {
                    x: event.point.x + WORKBENCH_PREVIEW_CANVAS_INSET.left,
                    y: event.point.y + WORKBENCH_PREVIEW_CANVAS_INSET.top,
                  },
          };
          pushLog(log, `tool armed trend-line ${formatTime(event.time)} ${event.price.toFixed(2)}`);
          publishSnapshot();
          return;
        }

        if (pendingTrendLineStart.time === event.time) {
          pushLog(log, "trend-line tool needs a second click on a different bar");
          publishSnapshot();
          return;
        }

        const start =
          pendingTrendLineStart.time < event.time
            ? pendingTrendLineStart
            : { time: event.time, price: event.price };
        const end =
          pendingTrendLineStart.time < event.time
            ? { time: event.time, price: event.price }
            : pendingTrendLineStart;
        const drawing = chart?.addTrendLineDrawing(undefined, {
          startTime: start.time,
          startPrice: start.price,
          endTime: end.time,
          endPrice: end.price,
          color: theme === "warm" ? "#ea580c" : "#2563eb",
          lineWidth: 3,
          magnetEnabled: true,
          timeMagnetEnabled: true,
          timeMagnetPolicy: "nearest",
        });
        drawing?.select();
        drawingTool = "none";
        pendingTrendLineStart = null;
        pushLog(log, `tool created trend-line ${formatTime(start.time)} → ${formatTime(end.time)}`);
        publishSnapshot();
        return;
      }
      pushLog(log, `click ${formatTime(event.time)} ${formatMaybeNumber(event.price)}`);
      publishSnapshot();
    });
    chart.subscribeDrawingSelectionChange((selection) => {
      pushLog(log, selection === null ? "drawing cleared" : `drawing ${selection.kind} selected`);
      publishSnapshot();
    });
    paneSnapshot = chart.panes().map(paneStateFromHandle);
    publishSnapshot();
  };

  rebuild();

  return {
    actions() {
      return [
        {
          id: "main-candlestick",
          label: "Candles",
          group: "chart-type",
          active: mainChartType === "candlestick",
        },
        {
          id: "main-heikin-ashi",
          label: "Heikin",
          group: "chart-type",
          active: mainChartType === "heikin-ashi",
        },
        {
          id: "main-line-break",
          label: "Line Break",
          group: "chart-type",
          active: mainChartType === "line-break",
        },
        {
          id: "main-kagi",
          label: "Kagi",
          group: "chart-type",
          active: mainChartType === "kagi",
        },
        {
          id: "main-point-figure",
          label: "P&F",
          group: "chart-type",
          active: mainChartType === "point-figure",
        },
        {
          id: "main-volume-candles",
          label: "Vol Candles",
          group: "chart-type",
          active: mainChartType === "volume-candles",
        },
        {
          id: "main-hollow-candles",
          label: "Hollow",
          group: "chart-type",
          active: mainChartType === "hollow-candles",
        },
        {
          id: "main-renko",
          label: "Renko",
          group: "chart-type",
          active: mainChartType === "renko",
        },
        {
          id: "main-bar",
          label: "Bar",
          group: "chart-type",
          active: mainChartType === "bar",
        },
        {
          id: "main-hlc-bars",
          label: "HLC",
          group: "chart-type",
          active: mainChartType === "hlc-bars",
        },
        {
          id: "main-high-low",
          label: "Hi-Lo",
          group: "chart-type",
          active: mainChartType === "high-low",
        },
        {
          id: "main-line",
          label: "Line",
          group: "chart-type",
          active: mainChartType === "line",
        },
        {
          id: "main-line-markers",
          label: "Markers",
          group: "chart-type",
          active: mainChartType === "line-markers",
        },
        {
          id: "main-stepline",
          label: "Step",
          group: "chart-type",
          active: mainChartType === "stepline",
        },
        {
          id: "main-area",
          label: "Area",
          group: "chart-type",
          active: mainChartType === "area",
        },
        {
          id: "main-baseline",
          label: "Baseline",
          group: "chart-type",
          active: mainChartType === "baseline",
        },
        {
          id: "toggle-study",
          label: studyPaneEnabled ? "Hide study pane" : "Show study pane",
          tone: "default",
          group: "chart-action",
        },
        ...(mainChartType === "renko"
          ? [
              {
                id: "renko-auto",
                label: "Renko Auto",
                group: "renko-option" as const,
                active: renkoMode === "auto",
              },
              {
                id: "renko-box-2",
                label: "Box 2",
                group: "renko-option" as const,
                active: renkoMode === "fixed" && renkoFixedBoxSize === 2,
              },
              {
                id: "renko-box-4",
                label: "Box 4",
                group: "renko-option" as const,
                active: renkoMode === "fixed" && renkoFixedBoxSize === 4,
              },
              {
                id: "renko-box-8",
                label: "Box 8",
                group: "renko-option" as const,
                active: renkoMode === "fixed" && renkoFixedBoxSize === 8,
              },
            ]
          : []),
        ...(mainChartType === "point-figure"
          ? [
              {
                id: "point-figure-auto",
                label: "P&F Auto",
                group: "point-figure-option" as const,
                active: pointFigureMode === "auto",
              },
              {
                id: "point-figure-box-180",
                label: "Box 180",
                group: "point-figure-option" as const,
                active: pointFigureMode === "fixed" && pointFigureFixedBoxSize === 180,
              },
              {
                id: "point-figure-box-360",
                label: "Box 360",
                group: "point-figure-option" as const,
                active: pointFigureMode === "fixed" && pointFigureFixedBoxSize === 360,
              },
              {
                id: "point-figure-box-720",
                label: "Box 720",
                group: "point-figure-option" as const,
                active: pointFigureMode === "fixed" && pointFigureFixedBoxSize === 720,
              },
            ]
          : []),
        { id: "add-pane", label: "Add empty pane", tone: "default", group: "chart-action" },
        { id: "trim-pane", label: "Remove empty pane", tone: "danger", group: "chart-action" },
        { id: "zoom-in", label: "Zoom in", tone: "accent", group: "chart-action" },
        { id: "shift-right", label: "Shift right", tone: "default", group: "chart-action" },
        {
          id: "theme",
          label: theme === "warm" ? "Switch to ink" : "Switch to warm",
          tone: "default",
          group: "chart-action",
        },
      ];
    },
    runAction(actionId) {
      if (chart === null) {
        return;
      }

      const switchMainChartType = (nextType: WorkbenchMainChartType) => {
        const currentChart = chart;
        if (currentChart === null) {
          return;
        }
        const previousType = mainChartType;
        mainChartType = nextType;
        if (previousType === "point-figure" || nextType === "point-figure") {
          rebuild();
          return;
        }

        currentChart.setChartType(nextType);
        publishSnapshot();
      };

      switch (actionId) {
        case "main-candlestick":
          switchMainChartType("candlestick");
          return;
        case "main-line-break":
          switchMainChartType("line-break");
          return;
        case "main-kagi":
          switchMainChartType("kagi");
          return;
        case "main-point-figure":
          switchMainChartType("point-figure");
          return;
        case "point-figure-auto":
          pointFigureMode = "auto";
          chart.setChartType("point-figure").applyOptions({
            pointFigureBoxSizeMode: "auto",
            pointFigureBoxSize: null,
            pointFigureReversalBoxes,
          });
          publishSnapshot();
          return;
        case "point-figure-box-180":
          pointFigureMode = "fixed";
          pointFigureFixedBoxSize = 180;
          chart.setChartType("point-figure").applyOptions({
            pointFigureBoxSizeMode: "fixed",
            pointFigureBoxSize: 180,
            pointFigureReversalBoxes,
          });
          publishSnapshot();
          return;
        case "point-figure-box-360":
          pointFigureMode = "fixed";
          pointFigureFixedBoxSize = 360;
          chart.setChartType("point-figure").applyOptions({
            pointFigureBoxSizeMode: "fixed",
            pointFigureBoxSize: 360,
            pointFigureReversalBoxes,
          });
          publishSnapshot();
          return;
        case "point-figure-box-720":
          pointFigureMode = "fixed";
          pointFigureFixedBoxSize = 720;
          chart.setChartType("point-figure").applyOptions({
            pointFigureBoxSizeMode: "fixed",
            pointFigureBoxSize: 720,
            pointFigureReversalBoxes,
          });
          publishSnapshot();
          return;
        case "main-volume-candles":
          switchMainChartType("volume-candles");
          return;
        case "main-hollow-candles":
          switchMainChartType("hollow-candles");
          return;
        case "main-bar":
          switchMainChartType("bar");
          return;
        case "main-hlc-bars":
          switchMainChartType("hlc-bars");
          return;
        case "main-high-low":
          switchMainChartType("high-low");
          return;
        case "main-renko":
          switchMainChartType("renko");
          return;
        case "renko-auto":
          renkoMode = "auto";
          chart.setChartType("renko").applyOptions({
            renkoBoxSizeMode: "auto",
            renkoBoxSize: null,
          });
          publishSnapshot();
          return;
        case "renko-box-2":
          renkoMode = "fixed";
          renkoFixedBoxSize = 2;
          chart.setChartType("renko").applyOptions({
            renkoBoxSizeMode: "fixed",
            renkoBoxSize: 2,
          });
          publishSnapshot();
          return;
        case "renko-box-4":
          renkoMode = "fixed";
          renkoFixedBoxSize = 4;
          chart.setChartType("renko").applyOptions({
            renkoBoxSizeMode: "fixed",
            renkoBoxSize: 4,
          });
          publishSnapshot();
          return;
        case "renko-box-8":
          renkoMode = "fixed";
          renkoFixedBoxSize = 8;
          chart.setChartType("renko").applyOptions({
            renkoBoxSizeMode: "fixed",
            renkoBoxSize: 8,
          });
          publishSnapshot();
          return;
        case "main-heikin-ashi":
          switchMainChartType("heikin-ashi");
          return;
        case "main-line":
          switchMainChartType("line");
          return;
        case "main-line-markers":
          switchMainChartType("line-markers");
          return;
        case "main-stepline":
          switchMainChartType("stepline");
          return;
        case "main-area":
          switchMainChartType("area");
          return;
        case "main-baseline":
          switchMainChartType("baseline");
          return;
        case "toggle-study":
          studyPaneEnabled = !studyPaneEnabled;
          rebuild();
          return;
        case "add-pane":
          emptyPaneCount += 1;
          rebuild();
          return;
        case "trim-pane":
          emptyPaneCount = Math.max(0, emptyPaneCount - 1);
          rebuild();
          return;
        case "zoom-in":
          barSpacing = Math.min(barSpacing + 2, 30);
          chart.timeScale().applyOptions({ barSpacing, rightOffset });
          publishSnapshot();
          return;
        case "shift-right":
          rightOffset += 0.6;
          chart.timeScale().applyOptions({ barSpacing, rightOffset });
          publishSnapshot();
          return;
        case "theme":
          theme = theme === "warm" ? "ink" : "warm";
          rebuild();
          return;
        default:
          return;
      }
    },
    applySelectedDrawingOptions(options) {
      if (chart === null) {
        return;
      }
      chart.applySelectedDrawingOptions(
        options as PhaseOneHorizontalLineDrawingOptions | PhaseOneTrendLineDrawingOptions,
      );
      publishSnapshot();
    },
    setDrawingTool(tool) {
      if (drawingTool === tool) {
        drawingTool = "none";
        pendingTrendLineStart = null;
      } else {
        drawingTool = tool;
        pendingTrendLineStart = null;
      }
      publishSnapshot();
    },
    destroy() {
      teardownChartTypeSubscription?.();
      chart?.destroy();
      chart = null;
    },
  };
}

export function mountFeatureDemo(
  canvas: HTMLCanvasElement,
  featureId: FeatureTabId,
  publish: SnapshotPublisher,
): DemoController {
  switch (featureId) {
    case "series":
      return mountSeriesFeature(canvas, publish);
    case "panes":
      return mountPanesFeature(canvas, publish);
    case "interactions":
      return mountInteractionsFeature(canvas, publish);
    case "scales":
      return mountScalesFeature(canvas, publish);
    case "data":
      return mountDataFeature(canvas, publish);
    case "styling":
      return mountStylingFeature(canvas, publish);
    case "events":
      return mountEventsFeature(canvas, publish);
    case "annotations":
      return mountAnnotationsFeature(canvas, publish);
  }
}

function mountSeriesFeature(canvas: HTMLCanvasElement, publish: SnapshotPublisher): DemoController {
  const bars = createBars(34);
  const line = createLineData(bars, 5);
  const histogram = createHistogramData(bars);
  const volume = createVolumeData(bars);
  const log: EventLog = [];
  let chart: PhaseOneChartApi | null = null;
  let kind: "candlestick" | "bar" | "line" | "area" | "baseline" | "histogram" | "volume" = "candlestick";

  const rebuild = () => {
    chart?.destroy();
    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions(warmChartOptions());

    if (kind === "candlestick") {
      const series = chart.addCandlestickSeries();
      series.setData(bars);
    } else if (kind === "bar") {
      const series = chart.addBarSeries();
      series.setData(bars);
    } else if (kind === "line") {
      const series = chart.addLineSeries();
      series.setData(line);
    } else if (kind === "area") {
      const series = chart.addAreaSeries();
      series.setData(line);
    } else if (kind === "baseline") {
      const series = chart.addBaselineSeries();
      series.applyOptions({ baseValue: 130 });
      series.setData(line);
    } else if (kind === "histogram") {
      const series = chart.addHistogramSeries();
      series.setData(histogram);
    } else {
      const series = chart.addVolumeSeries();
      series.setData(volume);
    }

    pushLog(log, `render ${kind}`);
    publishSnapshot();
  };

  const publishSnapshot = () => {
    publish({
      title: "Series",
      summary:
        "This tab turns the same public entrypoint through the series shapes already implemented in chartx2.",
      metrics: [
        { label: "Active series", value: kind },
        { label: "Data points", value: String(kind === "line" || kind === "area" || kind === "baseline" ? line.length : bars.length) },
        { label: "Missing", value: "--" },
      ],
      eventLog: [...log],
      note: "These examples stay on the public API and make the current series breadth legible.",
      featureGap: "The basic series floor now includes baseline, so the next gaps move past core shapes and into richer chart breadth.",
    });
  };

  rebuild();

  return {
    actions() {
      return [
        { id: "candlestick", label: "Candles" },
        { id: "bar", label: "Bar" },
        { id: "line", label: "Line" },
        { id: "area", label: "Area" },
        { id: "baseline", label: "Baseline" },
        { id: "histogram", label: "Histogram" },
        { id: "volume", label: "Volume" },
      ];
    },
    runAction(actionId) {
      kind = actionId as typeof kind;
      rebuild();
    },
    destroy() {
      chart?.destroy();
      chart = null;
    },
  };
}

function formatWorkbenchChartType(kind: WorkbenchMainChartType): string {
  switch (kind) {
    case "candlestick":
      return "Candles";
    case "line-break":
      return "Line Break";
    case "kagi":
      return "Kagi";
    case "point-figure":
      return "Point Figure";
    case "volume-candles":
      return "Volume Candles";
    case "hollow-candles":
      return "Hollow Candles";
    case "heikin-ashi":
      return "Heikin Ashi";
    case "renko":
      return "Renko";
    case "bar":
      return "Bar";
    case "hlc-bars":
      return "HLC Bars";
    case "high-low":
      return "High-Low";
    case "line":
      return "Line";
    case "line-markers":
      return "Line Markers";
    case "stepline":
      return "Stepline";
    case "area":
      return "Area";
    case "baseline":
      return "Baseline";
  }
}

function mountPanesFeature(canvas: HTMLCanvasElement, publish: SnapshotPublisher): DemoController {
  const bars = createBars(40);
  const volume = createVolumeData(bars);
  const line = createLineData(bars, 8);
  const histogram = createHistogramData(bars);
  const log: EventLog = [];
  let chart: PhaseOneChartApi | null = null;
  let extraPaneCount = 0;
  let studyHeight = 124;
  let multiSeries = true;
  let latestPanes: readonly PhaseOnePaneState[] = [];

  const rebuild = () => {
    chart?.destroy();
    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions(warmChartOptions());
    chart.subscribePaneEvents((event) => {
      latestPanes = event.panes;
      pushLog(log, `${event.type} pane ${event.pane.paneIndex + 1}`);
      publishSnapshot();
    });

    const mainSeries = chart.addCandlestickSeries();
    mainSeries.setData(bars);

    const volumePane = chart.addPane({ height: 118 });
    const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
    volumeSeries.setData(volume);

    const studyPane = chart.addPane({ height: studyHeight });
    const lineSeries = chart.addLineSeries({ pane: studyPane });
    lineSeries.applyOptions({ color: "#3b82f6", lineWidth: 3 });
    lineSeries.setData(line);

    if (multiSeries) {
      const histogramSeries = chart.addHistogramSeries({ pane: studyPane });
      histogramSeries.applyOptions({ upColor: "#0f766e", downColor: "#0f766e" });
      histogramSeries.setData(histogram);
    }

    for (let index = 0; index < extraPaneCount; index += 1) {
      chart.addPane({ height: 88 });
    }

    latestPanes = chart.panes().map(paneStateFromHandle);
    publishSnapshot();
  };

  const publishSnapshot = () => {
    const studyPane = latestPanes.find((pane) => !pane.isPrimary && pane.seriesKinds.includes("line"));
    publish({
      title: "Panes",
      summary:
        "Panes are one of chartx2's strongest current differentiators, so this view makes pane lifecycle and composition explicit.",
      metrics: [
        { label: "Pane count", value: String(latestPanes.length) },
        { label: "Study height", value: `${studyHeight}px` },
        { label: "Study series", value: studyPane ? String(studyPane.seriesCount) : "--" },
      ],
      eventLog: [...log],
      note: "Add and trim empty panes while keeping a dedicated volume pane and a controlled study pane.",
      featureGap: multiSeries
        ? "Multi-series composition is still intentionally constrained to controlled secondary panes."
        : "Turn multi-series back on to see one pane carry more than one study series.",
    });
  };

  rebuild();

  return {
    actions() {
      return [
        { id: "add-pane", label: "Add empty pane" },
        { id: "trim-pane", label: "Remove empty pane", tone: "danger" },
        { id: "grow-study", label: "Grow study pane", tone: "accent" },
        { id: "toggle-multi", label: multiSeries ? "Single-series study" : "Multi-series study" },
      ];
    },
    runAction(actionId) {
      switch (actionId) {
        case "add-pane":
          extraPaneCount += 1;
          break;
        case "trim-pane":
          extraPaneCount = Math.max(0, extraPaneCount - 1);
          break;
        case "grow-study":
          studyHeight = studyHeight >= 164 ? 118 : studyHeight + 18;
          break;
        case "toggle-multi":
          multiSeries = !multiSeries;
          break;
        default:
          return;
      }

      rebuild();
    },
    destroy() {
      chart?.destroy();
      chart = null;
    },
  };
}

function mountInteractionsFeature(
  canvas: HTMLCanvasElement,
  publish: SnapshotPublisher,
): DemoController {
  const bars = createBars(44);
  const volume = createVolumeData(bars);
  const log: EventLog = [];
  let chart: PhaseOneChartApi | null = null;
  let barSpacing = 15;
  let rightOffset = 0.8;
  let crosshairMoves = 0;
  let clicks = 0;
  let latestReadout: PhaseOneCrosshairMoveEvent | null = null;

  const rebuild = () => {
    chart?.destroy();
    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions(warmChartOptions());
    chart.timeScale().applyOptions({ barSpacing, rightOffset });

    const mainSeries = chart.addCandlestickSeries();
    const volumePane = chart.addPane({ height: 118 });
    const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
    mainSeries.setData(bars);
    volumeSeries.setData(volume);

    chart.subscribeCrosshairMove((event) => {
      crosshairMoves += 1;
      latestReadout = event;
      publishSnapshot();
    });
    chart.subscribeClick((event) => {
      clicks += 1;
      pushLog(log, `click ${formatTime(event.time)} ${formatMaybeNumber(event.price)}`);
      publishSnapshot();
    });

    publishSnapshot();
  };

  const publishSnapshot = () => {
    publish({
      title: "Interactions",
      summary:
        "This tab keeps the chart live so crosshair, click, pan, and zoom can be exercised without any route-level chart logic.",
      metrics: [
        { label: "Crosshair moves", value: String(crosshairMoves) },
        { label: "Clicks", value: String(clicks) },
        { label: "Bar spacing", value: barSpacing.toFixed(1) },
        { label: "Right offset", value: rightOffset.toFixed(1) },
        {
          label: "Active readout",
          value:
            latestReadout?.paneIndex === null || latestReadout === null
              ? "--"
              : `${formatTime(latestReadout.time)} ${formatMaybeNumber(latestReadout.price)}`,
        },
      ],
      eventLog: [...log],
      note: "Hover and click inside the feature chart, then use the controls to change the viewport.",
    });
  };

  rebuild();

  return {
    actions() {
      return [
        { id: "zoom-in", label: "Zoom in", tone: "accent" },
        { id: "zoom-out", label: "Zoom out" },
        { id: "shift-left", label: "Shift left" },
        { id: "shift-right", label: "Shift right" },
      ];
    },
    runAction(actionId) {
      if (chart === null) {
        return;
      }

      if (actionId === "zoom-in") {
        barSpacing = Math.min(barSpacing + 2, 30);
      } else if (actionId === "zoom-out") {
        barSpacing = Math.max(barSpacing - 2, 6);
      } else if (actionId === "shift-left") {
        rightOffset -= 0.6;
      } else if (actionId === "shift-right") {
        rightOffset += 0.6;
      } else {
        return;
      }

      chart.timeScale().applyOptions({ barSpacing, rightOffset });
      pushLog(log, `${actionId} ${barSpacing.toFixed(1)} / ${rightOffset.toFixed(1)}`);
      publishSnapshot();
    },
    destroy() {
      chart?.destroy();
      chart = null;
    },
  };
}

function mountScalesFeature(canvas: HTMLCanvasElement, publish: SnapshotPublisher): DemoController {
  const bars = createBars(38);
  const log: EventLog = [];
  let chart: PhaseOneChartApi | null = null;
  let barSpacing = 14;
  let rightOffset = 0.8;

  const rebuild = () => {
    chart?.destroy();
    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions(warmChartOptions());
    chart.timeScale().applyOptions({ barSpacing, rightOffset });
    const series = chart.addCandlestickSeries();
    series.setData(bars);
    publishSnapshot();
  };

  const publishSnapshot = () => {
    const visibleLogical = chart?.timeScale().getVisibleLogicalRange() ?? null;
    const visiblePrice = chart?.priceScale().getVisibleRange() ?? null;
    publish({
      title: "Scales",
      summary:
        "Scale demos expose the public handles directly so visible ranges and offsets are inspectable without digging into internals.",
      metrics: [
        { label: "Bar spacing", value: barSpacing.toFixed(1) },
        { label: "Right offset", value: rightOffset.toFixed(1) },
        {
          label: "Logical range",
          value: visibleLogical === null ? "--" : `${visibleLogical.from.toFixed(1)} → ${visibleLogical.to.toFixed(1)}`,
        },
        {
          label: "Price range",
          value:
            visiblePrice === null
              ? "--"
              : `${visiblePrice.minValue.toFixed(2)} → ${visiblePrice.maxValue.toFixed(2)}`,
        },
      ],
      eventLog: [...log],
      note: "These are the current scale handles chartx2 already exposes through the public API.",
    });
  };

  rebuild();

  return {
    actions() {
      return [
        { id: "spacing-up", label: "Spacing +" },
        { id: "spacing-down", label: "Spacing -" },
        { id: "offset-up", label: "Offset +" },
        { id: "offset-down", label: "Offset -" },
      ];
    },
    runAction(actionId) {
      if (chart === null) {
        return;
      }

      switch (actionId) {
        case "spacing-up":
          barSpacing = Math.min(barSpacing + 2, 30);
          break;
        case "spacing-down":
          barSpacing = Math.max(barSpacing - 2, 6);
          break;
        case "offset-up":
          rightOffset += 0.5;
          break;
        case "offset-down":
          rightOffset -= 0.5;
          break;
        default:
          return;
      }

      chart.timeScale().applyOptions({ barSpacing, rightOffset });
      pushLog(log, `${actionId} => ${barSpacing.toFixed(1)} / ${rightOffset.toFixed(1)}`);
      publishSnapshot();
    },
    destroy() {
      chart?.destroy();
      chart = null;
    },
  };
}

function mountDataFeature(canvas: HTMLCanvasElement, publish: SnapshotPublisher): DemoController {
  const baseBars = createBars(16);
  const log: EventLog = [];
  let chart: PhaseOneChartApi | null = null;
  let series: PhaseOneCandlestickSeriesApi | null = null;
  let bars = [...baseBars];
  let lastError = "";

  const rebuild = () => {
    chart?.destroy();
    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions(warmChartOptions());
    series = chart.addCandlestickSeries();
    series.setData(bars);
    publishSnapshot();
  };

  const publishSnapshot = () => {
    publish({
      title: "Data",
      summary:
        "This demo keeps the write path explicit: reset, append, replace-last, and fail on out-of-order updates through the public API.",
      metrics: [
        { label: "Bars", value: String(bars.length) },
        { label: "Last close", value: bars.length === 0 ? "--" : bars[bars.length - 1].close.toFixed(2) },
        { label: "Last time", value: bars.length === 0 ? "--" : formatTime(bars[bars.length - 1].time) },
      ],
      eventLog: [...log],
      note: lastError === "" ? "Use the buttons to mutate the current dataset." : `Last data error: ${lastError}`,
    });
  };

  rebuild();

  return {
    actions() {
      return [
        { id: "reset", label: "Reset" },
        { id: "append", label: "Append", tone: "accent" },
        { id: "replace-last", label: "Replace last" },
        { id: "bad-update", label: "Invalid update", tone: "danger" },
      ];
    },
    runAction(actionId) {
      if (series === null) {
        return;
      }

      lastError = "";
      try {
        if (actionId === "reset") {
          bars = [...baseBars];
          series.setData(bars);
          pushLog(log, "reset data");
        } else if (actionId === "append") {
          const next = createNextBar(bars[bars.length - 1]);
          bars = [...bars, next];
          series.update(next);
          pushLog(log, `append ${formatTime(next.time)}`);
        } else if (actionId === "replace-last") {
          const last = bars[bars.length - 1];
          const replacement = {
            ...last,
            high: last.high + 4,
            close: last.close + 3,
          };
          bars = [...bars.slice(0, -1), replacement];
          series.update(replacement);
          pushLog(log, `replace ${formatTime(replacement.time)}`);
        } else if (actionId === "bad-update") {
          const invalid = {
            ...bars[bars.length - 1],
            time: bars[bars.length - 2]?.time ?? bars[bars.length - 1].time - DAY,
          };
          series.update(invalid);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown data update failure";
        pushLog(log, "invalid update rejected");
      }

      publishSnapshot();
    },
    destroy() {
      chart?.destroy();
      chart = null;
      series = null;
    },
  };
}

function mountStylingFeature(canvas: HTMLCanvasElement, publish: SnapshotPublisher): DemoController {
  const bars = createBars(28);
  const volume = createVolumeData(bars);
  const log: EventLog = [];
  let chart: PhaseOneChartApi | null = null;
  let theme: ThemeId = "warm";
  let accent: "default" | "contrast" = "default";

  const rebuild = () => {
    chart?.destroy();
    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions(theme === "warm" ? warmChartOptions() : inkChartOptions());

    const candle = chart.addCandlestickSeries();
    const volumePane = chart.addPane({ height: 120 });
    const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
    candle.setData(bars);
    volumeSeries.setData(volume);

    if (accent === "contrast") {
      candle.applyOptions({
        upColor: "#0891b2",
        downColor: "#dc2626",
        wickColor: "#0f172a",
      });
      volumeSeries.applyOptions({
        upColor: "#14b8a6",
        downColor: "#ef4444",
      });
    } else {
      candle.applyOptions({
        upColor: "#0c8f62",
        downColor: "#c7543e",
        wickColor: "rgba(16, 16, 16, 0.72)",
      });
      volumeSeries.applyOptions({
        upColor: "#0c8f62",
        downColor: "#c7543e",
      });
    }

    publishSnapshot();
  };

  const publishSnapshot = () => {
    publish({
      title: "Styling",
      summary:
        "The styling tab keeps chart-level and series-level options visible so chartx2 reads like infrastructure, not just a screenshot demo.",
      metrics: [
        { label: "Theme", value: theme },
        { label: "Accent set", value: accent },
        { label: "Pane count", value: chart === null ? "--" : String(chart.panes().length) },
      ],
      eventLog: [...log],
      note: "This is still a narrow public options surface, but it is real and visible from one place.",
    });
  };

  rebuild();

  return {
    actions() {
      return [
        { id: "warm", label: "Warm theme" },
        { id: "ink", label: "Ink theme" },
        { id: "default-style", label: "Default candles" },
        { id: "contrast-style", label: "Contrast candles", tone: "accent" },
      ];
    },
    runAction(actionId) {
      if (actionId === "warm") {
        theme = "warm";
        pushLog(log, "warm theme");
      } else if (actionId === "ink") {
        theme = "ink";
        pushLog(log, "ink theme");
      } else if (actionId === "default-style") {
        accent = "default";
        pushLog(log, "default style");
      } else if (actionId === "contrast-style") {
        accent = "contrast";
        pushLog(log, "contrast style");
      } else {
        return;
      }

      rebuild();
    },
    destroy() {
      chart?.destroy();
      chart = null;
    },
  };
}

function mountEventsFeature(canvas: HTMLCanvasElement, publish: SnapshotPublisher): DemoController {
  const bars = createBars(34);
  const volume = createVolumeData(bars);
  const log: EventLog = [];
  let chart: PhaseOneChartApi | null = null;
  let latestPanes: readonly PhaseOnePaneState[] = [];
  let clickCount = 0;
  let crosshairCount = 0;
  let paneEventCount = 0;
  let resizes = 0;

  const rebuild = () => {
    chart?.destroy();
    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions(warmChartOptions());
    chart.subscribePaneEvents((event) => {
      paneEventCount += 1;
      latestPanes = event.panes;
      pushLog(log, `${event.type} pane ${event.pane.paneIndex + 1}`);
      publishSnapshot();
    });

    const candle = chart.addCandlestickSeries();
    const studyPane = chart.addPane({ height: 120 });
    const volumeSeries = chart.addVolumeSeries({ pane: studyPane });
    candle.setData(bars);
    volumeSeries.setData(volume);

    studyPane.subscribeResize((event) => {
      resizes += 1;
      pushLog(log, `resize pane ${event.paneIndex + 1} to ${Math.round(event.height)}px`);
      publishSnapshot();
    });
    chart.subscribeCrosshairMove(() => {
      crosshairCount += 1;
      publishSnapshot();
    });
    chart.subscribeClick(() => {
      clickCount += 1;
      pushLog(log, "click event");
      publishSnapshot();
    });
    latestPanes = chart.panes().map(paneStateFromHandle);
    publishSnapshot();
  };

  const publishSnapshot = () => {
    publish({
      title: "Events",
      summary:
        "This example makes the event layer explicit: chart-level click and crosshair events plus pane bus and pane resize callbacks.",
      metrics: [
        { label: "Crosshair", value: String(crosshairCount) },
        { label: "Clicks", value: String(clickCount) },
        { label: "Pane events", value: String(paneEventCount) },
        { label: "Resize callbacks", value: String(resizes) },
      ],
      eventLog: [...log],
      note:
        latestPanes.length === 0
          ? "No pane snapshot yet."
          : `Current panes: ${latestPanes.map((pane) => `#${pane.paneIndex + 1} ${pane.seriesKinds.join("+") || "empty"}`).join(" | ")}`,
    });
  };

  rebuild();

  return {
    actions() {
      return [
        { id: "add-pane", label: "Add pane" },
        { id: "resize-study", label: "Resize study", tone: "accent" },
        { id: "trim-pane", label: "Remove empty", tone: "danger" },
      ];
    },
    runAction(actionId) {
      if (chart === null) {
        return;
      }

      if (actionId === "add-pane") {
        chart.addPane({ height: 96 });
      } else if (actionId === "resize-study") {
        const secondary = chart.panes().find((pane) => !pane.isPrimary());
        if (secondary) {
          secondary.applyOptions({ height: secondary.getHeight() + 18 });
        }
      } else if (actionId === "trim-pane") {
        const removable = [...chart.panes()]
          .reverse()
          .find((pane) => !pane.isPrimary() && !pane.hasSeries());
        if (removable) {
          chart.removePane(removable);
        }
      }

      latestPanes = chart.panes().map(paneStateFromHandle);
      publishSnapshot();
    },
    destroy() {
      chart?.destroy();
      chart = null;
    },
  };
}

function mountAnnotationsFeature(canvas: HTMLCanvasElement, publish: SnapshotPublisher): DemoController {
  const bars = createBars(34);
  const line = createLineData(bars, 5);
  const log: EventLog = [];
  let chart: PhaseOneChartApi | null = null;
  let mode: "candles" | "study" = "candles";
  let supportPrice = 16_920;
  let resistancePrice = 17_140;
  let showResistance = true;

  const publishSnapshot = () => {
    publish({
      title: "Annotations",
      summary:
        "This tab turns on the first real annotation surface through public series-level price lines.",
      metrics: [
        { label: "Mode", value: mode === "candles" ? "candlestick" : "line study" },
        { label: "Price lines", value: showResistance ? "2" : "1" },
        { label: "Markers", value: "deferred" },
      ],
      eventLog: [...log],
      note: "Support and resistance lines are rendered through the public series API, not a demo-only overlay.",
      featureGap: "Markers are still the next explicit annotation gap after price lines.",
    });
  };

  const rebuild = () => {
    chart?.destroy();
    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions(warmChartOptions());

    if (mode === "candles") {
      const series = chart.addCandlestickSeries();
      series.setData(bars);
      series.createPriceLine({
        price: supportPrice,
        color: "#0c8f62",
        title: "Support",
      });
      if (showResistance) {
        series.createPriceLine({
          price: resistancePrice,
          color: "#c7543e",
          title: "Resistance",
        });
      }
    } else {
      const series = chart.addLineSeries();
      series.applyOptions({ color: "#365cb7", lineWidth: 3 });
      series.setData(line);
      series.createPriceLine({
        price: 16_980,
        color: "#365cb7",
        title: "Signal",
      });
      if (showResistance) {
        series.createPriceLine({
          price: 17_120,
          color: "#c7543e",
          title: "Ceiling",
        });
      }
    }

    pushLog(log, `${mode} price lines ${showResistance ? "support+resistance" : "support-only"}`);
    publishSnapshot();
  };

  rebuild();

  return {
    actions() {
      return [
        { id: "mode", label: mode === "candles" ? "Switch to line study" : "Switch to candles" },
        { id: "toggle-resistance", label: showResistance ? "Hide resistance" : "Show resistance" },
        { id: "raise-support", label: "Raise support", tone: "accent" },
      ];
    },
    runAction(actionId) {
      if (actionId === "mode") {
        mode = mode === "candles" ? "study" : "candles";
      } else if (actionId === "toggle-resistance") {
        showResistance = !showResistance;
      } else if (actionId === "raise-support") {
        supportPrice += 18;
        resistancePrice += 12;
      } else {
        return;
      }

      rebuild();
    },
    destroy() {
      chart?.destroy();
      chart = null;
    },
  };
}

function createBars(count: number): PhaseOneCandlestickData[] {
  const bars: PhaseOneCandlestickData[] = [];
  let close = 16_860;

  for (let index = 0; index < count; index += 1) {
    const drift = Math.sin(index / 3.6) * 54 + Math.cos(index / 5.2) * 22;
    const open = close + Math.sin(index / 2.7) * 12;
    const nextClose = open + drift;
    const high = Math.max(open, nextClose) + 18 + (index % 4) * 3;
    const low = Math.min(open, nextClose) - 16 - (index % 3) * 2;

    bars.push({
      time: BASE_TIME + index * DAY,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(nextClose),
      volume: 760_000 + index * 22_000 + Math.round(Math.abs(nextClose - open) * 8_400),
    });

    close = nextClose;
  }

  return bars;
}

function createWorkbenchBars(count: number): PhaseOneCandlestickData[] {
  const bars: PhaseOneCandlestickData[] = [];
  let close = 16_860;

  for (let index = 0; index < count; index += 1) {
    const regime = Math.sin(index / 17) * 42 + Math.cos(index / 29) * 24;
    const openGap = Math.sin(index / 2.1) * 18 + Math.cos(index / 1.35) * 12 + ((index % 6) - 2.5) * 3;
    const body = regime + Math.sin(index / 4.4) * 61 + Math.cos(index / 7.3) * 27;
    const open = close + openGap;
    const nextClose = open + body;
    const upperShadow = 14 + (index % 5) * 7 + Math.abs(Math.sin(index / 3.3)) * 12;
    const lowerShadow = 12 + (index % 4) * 6 + Math.abs(Math.cos(index / 2.8)) * 11;
    const high = Math.max(open, nextClose) + upperShadow;
    const low = Math.min(open, nextClose) - lowerShadow;

    bars.push({
      time: BASE_TIME + index * DAY,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(nextClose),
      volume: 760_000 + index * 22_000 + Math.round(Math.abs(nextClose - open) * 8_400),
    });

    close = nextClose;
  }

  return bars;
}

function createPointFigureWorkbenchBars(count: number): PhaseOneCandlestickData[] {
  const bars: PhaseOneCandlestickData[] = [];
  let close = 16_860;
  const drifts = [84, 42, -76, -28, 96, 38, -88, -34] as const;

  for (let index = 0; index < count; index += 1) {
    const regimeDrift = drifts[Math.floor(index / 12) % drifts.length] ?? 48;
    const openGap = Math.sin(index / 10.5) * 4 + Math.cos(index / 8.2) * 3;
    const body = regimeDrift + Math.sin(index / 6.6) * 10 + Math.cos(index / 12.4) * 8;
    const open = close + openGap;
    const nextClose = open + body;
    const upperShadow = 8 + Math.abs(Math.sin(index / 7.4)) * 5;
    const lowerShadow = 7 + Math.abs(Math.cos(index / 6.7)) * 5;
    const high = Math.max(open, nextClose) + upperShadow;
    const low = Math.min(open, nextClose) - lowerShadow;

    bars.push({
      time: BASE_TIME + index * DAY,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(nextClose),
      volume: 720_000 + index * 16_000 + Math.round(Math.abs(nextClose - open) * 6_500),
    });

    close = nextClose;
  }

  return bars;
}

function createVolumeData(bars: readonly PhaseOneCandlestickData[]): PhaseOneVolumeData[] {
  return bars.map((bar, index) => ({
    time: bar.time,
    value: bar.volume ?? 760_000 + index * 22_000 + Math.round(Math.abs(bar.close - bar.open) * 8_400),
    up: bar.close >= bar.open,
  }));
}

function createHistogramData(bars: readonly PhaseOneCandlestickData[]): PhaseOneHistogramData[] {
  return bars.map((bar, index) => ({
    time: bar.time,
    value: 48 + Math.round(Math.abs(bar.close - bar.open) * 0.55) + (index % 5) * 9,
    up: bar.close >= bar.open,
  }));
}

function createLineData(
  bars: readonly PhaseOneCandlestickData[],
  offset: number,
): PhaseOneLineData[] {
  return bars.map((bar, index) => ({
    time: bar.time,
    value: round(bar.close - offset + Math.sin(index / 3.2) * 24),
  }));
}

function createNextBar(lastBar: PhaseOneCandlestickData): PhaseOneCandlestickData {
  const open = lastBar.close;
  const close = round(open + 42 - (lastBar.time / DAY) % 3 * 11);

  return {
    time: lastBar.time + DAY,
    open,
    high: Math.max(open, close) + 24,
    low: Math.min(open, close) - 18,
    close,
  };
}

function paneStateFromHandle(pane: PhaseOnePaneApi): PhaseOnePaneState {
  return {
    paneIndex: pane.paneIndex(),
    height: pane.getHeight(),
    isPrimary: pane.isPrimary(),
    resizable: pane.isResizable(),
    hasSeries: pane.hasSeries(),
    seriesCount: 0,
    seriesKinds: [],
    series: [],
  };
}

function warmChartOptions(): PhaseOneChartOptions {
  return {
    layout: {
      backgroundColor: WARM_THEME.backgroundColor,
      paneBackgroundColor: WARM_THEME.paneBackgroundColor,
      gridColor: WARM_THEME.gridColor,
      frameColor: WARM_THEME.frameColor,
      axisTextColor: WARM_THEME.axisTextColor,
      axisLabelBackground: WARM_THEME.axisLabelBackground,
      axisLabelBorder: WARM_THEME.axisLabelBorder,
      axisActiveBackground: WARM_THEME.axisActiveBackground,
      axisActiveText: WARM_THEME.axisActiveText,
    },
    crosshair: {
      lineColor: WARM_THEME.lineColor,
      pointColor: WARM_THEME.pointColor,
    },
  };
}

function inkChartOptions(): PhaseOneChartOptions {
  return {
    layout: {
      backgroundColor: INK_THEME.backgroundColor,
      paneBackgroundColor: INK_THEME.paneBackgroundColor,
      gridColor: INK_THEME.gridColor,
      frameColor: INK_THEME.frameColor,
      axisTextColor: INK_THEME.axisTextColor,
      axisLabelBackground: INK_THEME.axisLabelBackground,
      axisLabelBorder: INK_THEME.axisLabelBorder,
      axisActiveBackground: INK_THEME.axisActiveBackground,
      axisActiveText: INK_THEME.axisActiveText,
    },
    crosshair: {
      lineColor: INK_THEME.lineColor,
      pointColor: INK_THEME.pointColor,
    },
  };
}

function pushLog(log: EventLog, message: string): void {
  log.unshift(message);
  log.splice(6);
}

function formatTime(value: number | null): string {
  if (value === null) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatMaybeNumber(value: number | null): string {
  return value === null ? "--" : value.toFixed(2);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
