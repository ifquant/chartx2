import {
  createChartxPhaseOneChart,
  inferAverageTrueRange,
  inferPercentageBoxSize,
  inferPointFigureBoxSize,
  inferTraditionalPointFigureBoxSize,
  type PhaseOneCandlestickData,
  type PhaseOneCandlestickSeriesApi,
  type PhaseOneChartApi,
  type PhaseOneChartTypeChangeHandler,
  type PhaseOneChartStateSnapshot,
  type PhaseOneChartOptions,
  type PhaseOneClickEvent,
  type PhaseOneCrosshairMoveEvent,
  type PhaseOneDrawingPropertySchema,
  type PhaseOneDrawingStateSnapshot,
  type PhaseOneHorizontalLineDrawingOptions,
  type PhaseOneHistogramData,
  type PhaseOneMainChartType,
  type PhaseOneMainSeriesRenderer,
  type PhaseOnePaneApi,
  type PhaseOnePaneEvent,
  type PhaseOnePaneState,
  type PhaseOneTradeLocationRequest,
  type PhaseOneTrendLineDrawingOptions,
} from "$lib/chartx/public/market";
import {
  createChartWorkbenchModel,
  type AlertSummaryModel,
  type ChartWorkbenchModel,
  type ObjectTreePanelModel,
  type WatchlistItemModel,
  type WorkbenchObjectTreeNodeModel,
} from "$lib/chartx/public/workbench";
import {
  createWorkbenchLayoutState,
  type WorkbenchLayoutPersistenceProvider,
  type WorkbenchLayoutState,
} from "$lib/chartx/public/workbench-layout";
import {
  createWorkbenchAlertsState,
  toAlertSummaryModel,
  type WorkbenchAlertsPersistenceProvider,
  type WorkbenchAlertStateV1,
} from "$lib/chartx/public/workbench-alerts";
import {
  getWorkbenchIndicatorCatalogEntry,
  WORKBENCH_INDICATOR_CATALOG,
  type WorkbenchIndicatorCatalogEntry,
} from "$lib/chartx/public/workbench-indicators";
import {
  openWorkbenchSymbol,
  type WorkbenchBarsPayload,
  type WorkbenchHostAdapter,
  type WorkbenchSymbolOpenSource,
} from "$lib/chartx/public/workbench-host";
import type { TradeLocationIntent } from "$lib/chartx/public/performance";
import {
  createCompressedPriceBasedChartBarSequence,
  createDirectionColumnPriceBasedChartBarSequence,
} from "$lib/chartx/internal/model/chart-bar-sequence";
import {
  buildKagiData,
  buildLineBreakData,
  buildPointFigureData,
  buildRenkoData,
  inferKagiReversalSize,
} from "$lib/chartx/internal/model/main-series-builders";
import { createPlotRows } from "$lib/chartx/internal/model/series-data";
import {
  createLineData,
  createVolumeData,
  createWorkbenchBars,
  createWorkbenchFixtureBarsPayload,
  createWorkbenchFixtureHostAdapter,
  loadWorkbenchInitialSymbolPayload,
} from "$lib/demo/workbench-fixtures";

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
  group?:
    | "chart-type"
    | "chart-action"
    | "renko-option"
    | "point-figure-option"
    | "line-break-option"
    | "kagi-option";
  active?: boolean;
};

export type DemoMetric = {
  label: string;
  value: string;
};

type DemoActiveIndicator = {
  id: string;
  label: string;
  kind: WorkbenchIndicatorCatalogEntry["engineKind"];
  placement: WorkbenchIndicatorCatalogEntry["placement"];
};

export type DemoSnapshot = {
  title: string;
  summary: string;
  metrics: readonly DemoMetric[];
  eventLog: readonly string[];
  workbench?: ChartWorkbenchModel | null;
  indicatorCatalog?: readonly WorkbenchIndicatorCatalogEntry[];
  activeIndicators?: readonly DemoActiveIndicator[];
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
  pointFigureControls?: {
    mode: WorkbenchPointFigureMode;
    autoBoxSize: number | null;
    effectiveBoxSize: number | null;
    autoScale: number;
    reversalBoxes: number;
    visibleColumns: number | null;
    atrLength: number;
    percentageValue: number;
  } | null;
  lineBreakControls?: {
    lineCount: number;
    visibleColumns: number | null;
  } | null;
  kagiControls?: {
    mode: WorkbenchKagiMode;
    autoReversalSize: number | null;
    effectiveReversalSize: number | null;
    fixedReversalSize: number;
    autoScale: number;
    atrLength: number;
    percentageValue: number;
    visibleColumns: number | null;
  } | null;
};

export type DemoController = {
  actions(): readonly DemoAction[];
  runAction(actionId: string): void;
  openSymbol?(symbol: string): Promise<boolean>;
  createPriceAlert?(): Promise<boolean>;
  saveLayout?(): Promise<boolean>;
  restoreLayout?(): Promise<boolean>;
  resetLayout?(): Promise<boolean>;
  addIndicatorFromCatalog?(entryId: string): boolean;
  locateTrade?(intent: TradeLocationIntent): boolean;
  applySelectedDrawingOptions?(options: Record<string, unknown>): void;
  setDrawingTool?(tool: WorkbenchDrawingTool): void;
  setPointFigureAutoScale?(scale: number): void;
  setPointFigureMode?(mode: WorkbenchPointFigureMode): void;
  setPointFigureAtrLength?(length: number): void;
  setPointFigurePercentageValue?(value: number): void;
  setKagiMode?(mode: WorkbenchKagiMode): void;
  setKagiFixedReversalSize?(value: number): void;
  setKagiAutoScale?(scale: number): void;
  setKagiAtrLength?(length: number): void;
  setKagiPercentageValue?(value: number): void;
  destroy(): void;
};

export type FeatureExampleDescriptor = {
  id: FeatureTabId;
  label: string;
  summary: string;
  available: boolean;
};

export type WorkbenchDemoOptions = {
  hostAdapter?: WorkbenchHostAdapter;
  initialSymbol?: string;
  initialTimeframe?: string;
  persistenceProvider?: WorkbenchLayoutPersistenceProvider;
  alertsProvider?: WorkbenchAlertsPersistenceProvider;
};

type SnapshotPublisher = (snapshot: DemoSnapshot) => void;
type EventLog = string[];
type ThemeId = "warm" | "ink";
type WorkbenchAlertState = WorkbenchAlertStateV1;
type WorkbenchMainChartType = Exclude<PhaseOneMainChartType, "histogram">;
export type WorkbenchDrawingTool = "none" | "horizontal-line" | "trend-line";
type WorkbenchRenkoMode = "auto" | "fixed";
type WorkbenchPointFigureMode = "auto" | "fixed" | "atr" | "percentage" | "traditional";
type WorkbenchKagiMode = "auto" | "fixed" | "atr" | "percentage";
type DemoWorkbenchLayoutPreset = "single" | "main-plus-secondary";
type DemoWorkbenchChartHostId = "market-main" | "market-secondary";
type DemoWorkbenchChartHostRecord = {
  id: DemoWorkbenchChartHostId;
  symbol: string;
  timeframe: string;
  chartType: WorkbenchMainChartType;
  chartState: PhaseOneChartStateSnapshot | null;
};

type WorkbenchObjectTreeInput = {
  symbol: string;
  chartTypeLabel: string;
  panes: readonly PhaseOnePaneState[];
  chartProjection: WorkbenchObjectTreeChartProjection;
  alerts: readonly WorkbenchAlertState[];
};

type WorkbenchObjectTreeChartProjection = {
  mainSeries: {
    chartType: PhaseOneMainChartType;
    renderer: PhaseOneMainSeriesRenderer;
  } | null;
  series: readonly {
    kind: PhaseOneChartStateSnapshot["series"][number]["kind"];
    paneIndex: number;
    pointCount: number;
  }[];
  studies: readonly {
    type: PhaseOneChartStateSnapshot["studies"][number]["type"];
    paneIndex: number;
  }[];
  drawings: readonly {
    type: PhaseOneChartStateSnapshot["drawings"][number]["type"];
    paneIndex: number;
    visible: boolean;
  }[];
  tradeLocation: {
    request: PhaseOneTradeLocationRequest;
  } | null;
};

function emptyWorkbenchObjectTreeChartProjection(): WorkbenchObjectTreeChartProjection {
  return {
    mainSeries: null,
    series: [],
    studies: [],
    drawings: [],
    tradeLocation: null,
  };
}

function projectWorkbenchObjectTreeChartState(
  chartState: PhaseOneChartStateSnapshot | null,
): WorkbenchObjectTreeChartProjection {
  if (chartState === null) {
    return emptyWorkbenchObjectTreeChartProjection();
  }

  return {
    mainSeries:
      chartState.mainSeries === null
        ? null
        : {
            chartType: chartState.mainSeries.chartType,
            renderer: chartState.mainSeries.renderer,
          },
    series: chartState.series.map((series) => ({
      kind: series.kind,
      paneIndex: series.paneIndex,
      pointCount: series.data.length,
    })),
    studies: chartState.studies.map((study) => ({
      type: study.type,
      paneIndex: study.paneIndex,
    })),
    drawings: chartState.drawings.map((drawing) => ({
      type: drawing.type,
      paneIndex: drawing.paneIndex,
      visible: drawing.options.visible !== false,
    })),
    tradeLocation:
      chartState.tradeLocation === null
        ? null
        : {
            request: chartState.tradeLocation.request,
          },
  };
}

function paneSnapshotWithProjectedCounts(
  panes: readonly PhaseOnePaneState[],
  projection: WorkbenchObjectTreeChartProjection,
): readonly PhaseOnePaneState[] {
  const counts = new Map<number, number>();
  const kinds = new Map<number, string[]>();
  const bumpPane = (paneIndex: number, kind: string) => {
    counts.set(paneIndex, (counts.get(paneIndex) ?? 0) + 1);
    kinds.set(paneIndex, [...(kinds.get(paneIndex) ?? []), kind]);
  };

  if (projection.mainSeries !== null) {
    bumpPane(0, projection.mainSeries.chartType);
  }
  for (const series of projection.series) {
    bumpPane(series.paneIndex, series.kind);
  }
  for (const study of projection.studies) {
    bumpPane(study.paneIndex, study.type);
  }

  return panes.map((pane) => {
    const seriesCount = counts.get(pane.paneIndex) ?? pane.seriesCount;
    const seriesKinds = kinds.get(pane.paneIndex) ?? pane.seriesKinds;
    return {
      ...pane,
      hasSeries: seriesCount > 0,
      seriesCount,
      seriesKinds,
    };
  });
}

function toWorkbenchMainChartType(type: PhaseOneMainChartType): WorkbenchMainChartType | null {
  return type === "histogram" ? null : type;
}

function formatObjectTreeKind(value: string): string {
  return value
    .split("-")
    .map((part) => (part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
    .join(" ");
}

function formatObjectTreePointCount(count: number): string {
  return `${count} pt${count === 1 ? "" : "s"}`;
}

function paneObjectTreeDetail(pane: PhaseOnePaneState): string {
  return `${Math.round(pane.height)}px · ${pane.seriesCount} series`;
}

function buildWorkbenchObjectTree(input: WorkbenchObjectTreeInput): ObjectTreePanelModel {
  const nodes: WorkbenchObjectTreeNodeModel[] = [
    {
      id: "chart:active",
      kind: "chart",
      label: input.symbol,
      detailLabel: input.chartTypeLabel,
      depth: 0,
    },
  ];

  const panes = [...input.panes].sort((left, right) => left.paneIndex - right.paneIndex);
  for (const pane of panes) {
    nodes.push({
      id: `pane:${pane.paneIndex}`,
      kind: "pane",
      label: pane.isPrimary ? "Main pane" : `Pane ${pane.paneIndex + 1}`,
      detailLabel: paneObjectTreeDetail(pane),
      badgeLabel: pane.isPrimary ? "root" : undefined,
      depth: 1,
      muted: !pane.hasSeries,
    });
  }

  const paneDepth = (paneIndex: number): number =>
    panes.some((pane) => pane.paneIndex === paneIndex) ? 2 : 1;

  if (input.chartProjection.mainSeries !== null) {
    nodes.push({
      id: "main-series:active",
      kind: "main-series",
      label: "Main series",
      detailLabel: formatObjectTreeKind(input.chartProjection.mainSeries.chartType),
      badgeLabel: input.chartProjection.mainSeries.renderer,
      depth: paneDepth(0),
    });
  }

  input.chartProjection.series.forEach((series, index) => {
    nodes.push({
      id: `series:${index}`,
      kind: "series",
      label: formatObjectTreeKind(series.kind),
      detailLabel: `Pane ${series.paneIndex + 1} · ${formatObjectTreePointCount(series.pointCount)}`,
      depth: paneDepth(series.paneIndex),
    });
  });

  input.chartProjection.studies.forEach((study, index) => {
    nodes.push({
      id: `study:${index}`,
      kind: "study",
      label: formatObjectTreeKind(study.type),
      detailLabel: `Pane ${study.paneIndex + 1}`,
      depth: paneDepth(study.paneIndex),
    });
  });

  input.chartProjection.drawings.forEach((drawing, index) => {
    nodes.push({
      id: `drawing:${index}`,
      kind: "drawing",
      label: formatObjectTreeKind(drawing.type),
      detailLabel: `Pane ${drawing.paneIndex + 1}`,
      depth: paneDepth(drawing.paneIndex),
      muted: !drawing.visible,
    });
  });

  for (const alert of input.alerts) {
    nodes.push({
      id: `alert:${alert.id}`,
      kind: "alert",
      label: alert.label,
      detailLabel: alert.condition.kind === "price-crosses"
        ? `${alert.condition.direction} ${alert.condition.price.toFixed(0)}`
        : formatObjectTreeKind(alert.condition.kind),
      badgeLabel: alert.status,
      depth: 1,
      muted: alert.status === "paused",
    });
  }

  const tradeLocation = input.chartProjection.tradeLocation;
  if (tradeLocation !== null) {
    nodes.push({
      id: "trade-location:active",
      kind: "trade-location",
      label: `Trade ${tradeLocation.request.tradeId}`,
      detailLabel: `${tradeLocation.request.side} · ${formatTime(tradeLocation.request.entryTime)} → ${formatTime(tradeLocation.request.exitTime)}`,
      badgeLabel: input.symbol,
      depth: 1,
    });
  }

  const objectCount = nodes.length;
  return {
    title: "Object Tree",
    summaryLabel: `${objectCount} object${objectCount === 1 ? "" : "s"}`,
    emptyLabel: "No chart objects",
    nodes,
  };
}

function createWorkbenchDemoLayoutState(input: {
  activeSymbol: string;
  activeTimeframe: string;
  chartType: WorkbenchMainChartType;
  chart?: Pick<PhaseOneChartApi, "getChartState"> | null;
}): WorkbenchLayoutState {
  return createWorkbenchLayoutState({
    activeSymbol: input.activeSymbol,
    activeTimeframe: input.activeTimeframe,
    chartType: input.chartType,
    chartState: input.chart?.getChartState() ?? null,
  });
}

function drawingToolsForSnapshot(
  activeTool: WorkbenchDrawingTool,
): ReadonlyArray<{
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  active?: boolean;
}> {
  return [
    {
      id: "horizontal-line",
      label: "Horizontal line",
      icon: "—",
      enabled: true,
      active: activeTool === "horizontal-line",
    },
    {
      id: "trend-line",
      label: "Trend line",
      icon: "／",
      enabled: true,
      active: activeTool === "trend-line",
    },
    {
      id: "none",
      label: "Clear drawing tool",
      icon: "⌖",
      enabled: true,
      active: activeTool === "none",
    },
  ];
}

type DefaultDrawingAnchors = {
  horizontalPrice: number;
  trendStartTime: number;
  trendStartPrice: number;
  trendEndTime: number;
  trendEndPrice: number;
};

function formatPointFigureBoxSize(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }
  if (Math.abs(value - Math.round(value)) < 0.05) {
    return String(Math.round(value));
  }
  return value.toFixed(1);
}

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
  options: WorkbenchDemoOptions = {},
): DemoController {
  const log: EventLog = [];
  const hasInjectedHostAdapter = options.hostAdapter !== undefined;
  const hostAdapter = options.hostAdapter ?? createWorkbenchFixtureHostAdapter();
  let chart: PhaseOneChartApi | null = null;
  const requestedInitialSymbol = options.initialSymbol ?? "NDX";
  let activeTimeframe = options.initialTimeframe ?? "1D";
  let activeBarsPayload: WorkbenchBarsPayload = createWorkbenchFixtureBarsPayload(
    hasInjectedHostAdapter ? "NDX" : requestedInitialSymbol,
    activeTimeframe,
  );
  let activeSymbol = hasInjectedHostAdapter ? activeBarsPayload.symbol : requestedInitialSymbol;
  let activeExchangeLabel = activeBarsPayload.exchangeLabel ?? "NASDAQ";
  let workbenchWatchlist: readonly WatchlistItemModel[] = [];
  let destroyed = false;
  let symbolOpenSequence = 0;
  let layoutOperationSequence = 0;
  let studyPaneEnabled = true;
  let emptyPaneCount = 0;
  let theme: ThemeId = "warm";
  let mainChartType: WorkbenchMainChartType = "candlestick";
  let layoutPreset: DemoWorkbenchLayoutPreset = "single";
  let activeChartHostId: DemoWorkbenchChartHostId = "market-main";
  let hostActivationSequence = 0;
  let suppressDefaultDrawingsNextRebuild = false;
  const defaultSecondarySymbol =
    requestedInitialSymbol === "NDX"
      ? "SPX"
      : requestedInitialSymbol === "SPX"
        ? "NDX"
        : "SPX";
  const chartHostRecords: Record<DemoWorkbenchChartHostId, DemoWorkbenchChartHostRecord> = {
    "market-main": {
      id: "market-main",
      symbol: activeSymbol,
      timeframe: activeTimeframe,
      chartType: mainChartType,
      chartState: null,
    },
    "market-secondary": {
      id: "market-secondary",
      symbol: defaultSecondarySymbol,
      timeframe: activeTimeframe,
      chartType: "candlestick",
      chartState: null,
    },
  };
  let renkoMode: WorkbenchRenkoMode = "auto";
  let renkoFixedBoxSize = 4;
  let lineBreakCount = 3;
  let pointFigureMode: WorkbenchPointFigureMode = "auto";
  let pointFigureFixedBoxSize = 120;
  let pointFigureAutoScale = 1;
  let pointFigureReversalBoxes = 3;
  let pointFigureAtrLength = 14;
  let pointFigurePercentageValue = 1;
  let kagiMode: WorkbenchKagiMode = "auto";
  let kagiFixedReversalSize = 120;
  let kagiAutoScale = 1;
  let kagiAtrLength = 14;
  let kagiPercentageValue = 1;
  let barSpacing = 15;
  let rightOffset = 0.8;
  let drawingTool: WorkbenchDrawingTool = "none";
  let pendingTrendLineStart: { time: number; price: number; point: { x: number; y: number } | null } | null = null;
  let latestReadout: PhaseOneCrosshairMoveEvent | null = null;
  let latestClick: PhaseOneClickEvent | null = null;
  let latestPaneEvent: PhaseOnePaneEvent | null = null;
  let paneSnapshot: readonly PhaseOnePaneState[] = [];
  let objectTreeChartProjection = emptyWorkbenchObjectTreeChartProjection();
  let teardownChartTypeSubscription: (() => void) | null = null;
  let activeTradeLocationIntent: TradeLocationIntent | null = null;
  let activeIndicators: DemoActiveIndicator[] = [];
  let workbenchAlerts: WorkbenchAlertState[] = [];
  let alertMutationVersion = 0;
  let alertsLoadPromise: Promise<boolean> | null = null;
  let alertsSavePromise: Promise<unknown> = Promise.resolve();
  let alertsLoadCompleted = options.alertsProvider === undefined;
  let alertsLoadFailed = false;

  const buildWorkbenchChartHostModel = (input: {
    record: DemoWorkbenchChartHostRecord;
    slotId: "slot-main" | "slot-side";
    active: boolean;
  }) => ({
    id: input.record.id,
    family: "market" as const,
    title: `${input.record.symbol} market chart`,
    slotId: input.slotId,
    active: input.active,
    symbolLabel: input.record.symbol,
    timeframeLabel: input.record.timeframe,
    chartTypeLabel: formatWorkbenchChartType(input.record.chartType),
  });

  const snapshotLiveChartIntoHostRecord = (hostId: DemoWorkbenchChartHostId) => {
    const record = chartHostRecords[hostId];
    record.symbol = activeSymbol;
    record.timeframe = activeTimeframe;
    record.chartType = mainChartType;
    if (chart === null) {
      record.chartState = null;
      return;
    }
    try {
      record.chartState = chart.getChartState();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      pushLog(log, `failed to snapshot host ${hostId}: ${message}`);
      record.chartState = null;
    }
  };

  const updateActiveHostChartType = () => {
    chartHostRecords[activeChartHostId].chartType = mainChartType;
  };

  const latestActiveClose = (): number | null => {
    const latestBar = activeBarsPayload.bars.at(-1);
    return latestBar === undefined ? null : latestBar.close;
  };

  const latestActiveTimestamp = (): number => activeBarsPayload.bars.at(-1)?.time ?? Date.now();

  const refreshObjectTreeProjection = () => {
    const chartState = chart?.getChartState() ?? null;
    objectTreeChartProjection = projectWorkbenchObjectTreeChartState(chartState);
    if (chart !== null) {
      paneSnapshot = paneSnapshotWithProjectedCounts(
        chart.panes().map(paneStateFromHandle),
        objectTreeChartProjection,
      );
    }
  };

  const refreshObjectTreeProjectionAndPublish = () => {
    refreshObjectTreeProjection();
    publishSnapshot();
  };

  const createDemoWorkbenchAlerts = (): WorkbenchAlertState[] => {
    const basePrice = latestActiveClose() ?? 23_000;
    const now = latestActiveTimestamp();
    return [
      {
        id: "alert-demo-breakout",
        label: `${activeSymbol} breakout`,
        condition: {
          kind: "price-crosses",
          symbol: activeSymbol,
          timeframe: activeTimeframe,
          price: Math.round(basePrice) + 120,
          direction: "above",
        },
        status: "armed",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "alert-demo-pullback",
        label: `${activeSymbol} pullback`,
        condition: {
          kind: "price-crosses",
          symbol: activeSymbol,
          timeframe: activeTimeframe,
          price: Math.round(basePrice) - 160,
          direction: "below",
        },
        status: "armed",
        createdAt: now,
        updatedAt: now,
      },
    ];
  };

  const isActivePriceAlertTriggered = (alert: WorkbenchAlertState, close: number): boolean => {
    const condition = alert.condition;
    if (
      alert.status !== "armed" ||
      condition.kind !== "price-crosses" ||
      condition.symbol !== activeSymbol ||
      condition.timeframe !== activeTimeframe
    ) {
      return false;
    }
    if (condition.direction === "above") {
      return close >= condition.price;
    }
    if (condition.direction === "below") {
      return close <= condition.price;
    }
    return false;
  };

  const evaluateActivePriceAlerts = (): boolean => {
    const close = latestActiveClose();
    if (close === null) {
      return false;
    }

    let changed = false;
    const triggeredAt = latestActiveTimestamp();
    workbenchAlerts = workbenchAlerts.map((alert) => {
      if (!isActivePriceAlertTriggered(alert, close)) {
        return alert;
      }
      changed = true;
      return {
        ...alert,
        status: "triggered",
        updatedAt: triggeredAt,
        triggeredAt,
      };
    });
    return changed;
  };

  const saveWorkbenchAlerts = async (): Promise<boolean> => {
    const provider = options.alertsProvider;
    if (provider === undefined) {
      return true;
    }
    const state = createWorkbenchAlertsState({ alerts: [...workbenchAlerts] });
    const savePromise = alertsSavePromise.then(
      () => provider.saveWorkbenchAlerts(state),
      () => provider.saveWorkbenchAlerts(state),
    );
    alertsSavePromise = savePromise.catch(() => undefined);
    return savePromise;
  };

  const ensureWorkbenchAlertsLoaded = async (): Promise<boolean> => {
    if (options.alertsProvider === undefined) {
      return true;
    }
    if (alertsLoadCompleted) {
      return !alertsLoadFailed;
    }
    return alertsLoadPromise === null ? true : alertsLoadPromise;
  };

  const persistEvaluatedWorkbenchAlerts = () => {
    if (!evaluateActivePriceAlerts() || options.alertsProvider === undefined) {
      return;
    }
    void saveWorkbenchAlerts().catch((error: unknown) => {
      if (destroyed) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      pushLog(log, `failed to save evaluated alerts: ${message}`);
      publishSnapshot();
    });
  };

  if (options.alertsProvider === undefined) {
    workbenchAlerts = createDemoWorkbenchAlerts();
    evaluateActivePriceAlerts();
  }

  const workbenchSeries = (_chartType: WorkbenchMainChartType) => {
    const bars = activeBarsPayload.bars;
    return {
      bars,
      volume: activeBarsPayload.volume,
      line: activeBarsPayload.line,
      visibleTrendStartBar: bars.at(-52) ?? bars[0]!,
      visibleTrendEndBar: bars.at(-18) ?? bars.at(-1) ?? bars[0]!,
    };
  };

  const resolveMainDrawingRows = (
    bars: readonly PhaseOneCandlestickData[],
    lineBreakRows: readonly PhaseOneCandlestickData[] | null,
    pointFigureRows: readonly PhaseOneCandlestickData[] | null,
    kagiRows: readonly PhaseOneCandlestickData[] | null,
  ): readonly PhaseOneCandlestickData[] => {
    if (mainChartType === "line-break") {
      return lineBreakRows ?? bars;
    }
    if (mainChartType === "point-figure") {
      return pointFigureRows ?? bars;
    }
    if (mainChartType === "renko") {
      return buildRenkoData(bars, {
        boxSizeMode: renkoMode,
        boxSize: renkoMode === "fixed" ? renkoFixedBoxSize : null,
      });
    }
    if (mainChartType === "kagi") {
      return kagiRows ?? bars;
    }
    return bars;
  };

  const applyTradeLocation = (intent: TradeLocationIntent, logEvent: boolean): boolean => {
    activeTradeLocationIntent = intent;
    if (chart === null) {
      if (logEvent) {
        pushLog(log, `failed to locate trade ${intent.tradeId}: workbench chart unavailable`);
        publishSnapshot();
      }
      return false;
    }

    const state = chart.locateTrade(intent, {
      fitRange: true,
      showMarkers: true,
      showSpan: true,
      showConnector: true,
    });
    if (state === null) {
      if (logEvent) {
        pushLog(log, `failed to locate trade ${intent.tradeId}: chart returned no trade location state`);
        publishSnapshot();
      }
      return false;
    }

    if (logEvent) {
      pushLog(
        log,
        `located trade ${intent.tradeId} on workbench ${formatTime(state.resolvedEntryTime)} → ${formatTime(state.resolvedExitTime)}`,
      );
    }
    refreshObjectTreeProjectionAndPublish();
    return true;
  };

  const resolveDefaultDrawingAnchors = (
    rows: readonly PhaseOneCandlestickData[],
  ): DefaultDrawingAnchors | null => {
    if (rows.length === 0) {
      return null;
    }

    const windowSize = Math.min(Math.max(rows.length, 1), 24);
    const visibleRows = rows.slice(Math.max(0, rows.length - windowSize));
    if (visibleRows.length === 0) {
      return null;
    }

    const lows = visibleRows.map((row) => row.low);
    const highs = visibleRows.map((row) => row.high);
    const minLow = Math.min(...lows);
    const maxHigh = Math.max(...highs);
    const priceRange = Math.max(maxHigh - minLow, 1);
    const pad = Math.max(priceRange * 0.06, 8);
    const horizontalPrice = minLow + priceRange * 0.18;

    const startIndex = Math.max(0, Math.floor((visibleRows.length - 1) * 0.18));
    let endIndex = Math.max(startIndex + 1, Math.floor((visibleRows.length - 1) * 0.8));
    if (endIndex >= visibleRows.length) {
      endIndex = visibleRows.length - 1;
    }

    const startRow = visibleRows[startIndex] ?? visibleRows[0]!;
    let endRow = visibleRows[endIndex] ?? visibleRows[visibleRows.length - 1]!;
    if (endRow.time === startRow.time) {
      endRow = visibleRows.findLast((row) => row.time !== startRow.time) ?? endRow;
    }

    if (endRow.time === startRow.time) {
      return {
        horizontalPrice,
        trendStartTime: startRow.time,
        trendStartPrice: startRow.low - pad,
        trendEndTime: endRow.time + 1,
        trendEndPrice: endRow.high + pad,
      };
    }

    return {
      horizontalPrice,
      trendStartTime: startRow.time,
      trendStartPrice: startRow.low - pad,
      trendEndTime: endRow.time,
      trendEndPrice: endRow.high + pad,
    };
  };

  function publishSnapshot() {
    const visibleLogical = chart?.timeScale().getVisibleLogicalRange() ?? null;
    const visiblePrice = chart?.priceScale().getVisibleRange() ?? null;
    const lineBreakBars =
      mainChartType === "line-break"
        ? workbenchSeries("line-break").bars
        : null;
    const effectiveLineBreakRows =
      lineBreakBars === null ? null : buildLineBreakData(lineBreakBars, lineBreakCount);
    const lineBreakVisibleColumns =
      mainChartType !== "line-break" || visibleLogical === null
        ? null
        : Math.max(0, Math.round(visibleLogical.to - visibleLogical.from));
    const kagiBars =
      mainChartType === "kagi"
        ? workbenchSeries("kagi").bars
        : null;
    const inferredKagiReversalSize =
      kagiBars === null ? null : inferKagiReversalSize(kagiBars);
    const effectiveKagiAutoReversalSize =
      inferredKagiReversalSize === null ? null : Math.max(1, Math.round(inferredKagiReversalSize * kagiAutoScale));
    const effectiveKagiAtrReversalSize =
      kagiBars === null
        ? null
        : Math.max(1, Math.round(inferAverageTrueRange(kagiBars, kagiAtrLength) * kagiAutoScale));
    const effectiveKagiPercentageReversalSize =
      kagiBars === null ? null : inferPercentageBoxSize(kagiBars, kagiPercentageValue);
    const effectiveKagiReversalSize =
      kagiMode === "fixed"
        ? kagiFixedReversalSize
        : kagiMode === "atr"
          ? effectiveKagiAtrReversalSize
          : kagiMode === "percentage"
            ? effectiveKagiPercentageReversalSize
            : effectiveKagiAutoReversalSize;
    const kagiRows =
      kagiBars === null
        ? null
        : buildKagiData(kagiBars, {
            reversalMode: kagiMode,
            reversalSize: kagiMode === "fixed" ? kagiFixedReversalSize : null,
            reversalScale: kagiAutoScale,
            atrLength: kagiAtrLength,
            percentageValue: kagiPercentageValue,
          });
    const kagiVisibleColumns =
      mainChartType !== "kagi" || visibleLogical === null
        ? null
        : Math.max(0, Math.round(visibleLogical.to - visibleLogical.from));
    const pointFigureBars =
      mainChartType === "point-figure"
        ? workbenchSeries("point-figure").bars
        : null;
    const inferredPointFigureBoxSize =
      pointFigureBars === null ? null : inferPointFigureBoxSize(pointFigureBars, pointFigureReversalBoxes);
    const effectivePointFigureAutoBoxSize =
      inferredPointFigureBoxSize === null ? null : Math.max(1, Math.round(inferredPointFigureBoxSize * pointFigureAutoScale));
    const effectivePointFigureAtrBoxSize =
      pointFigureBars === null
        ? null
        : Math.max(1, Math.round(inferAverageTrueRange(pointFigureBars, pointFigureAtrLength) * pointFigureAutoScale));
    const effectivePointFigurePercentageBoxSize =
      pointFigureBars === null ? null : inferPercentageBoxSize(pointFigureBars, pointFigurePercentageValue);
    const effectivePointFigureTraditionalBoxSize =
      pointFigureBars === null ? null : inferTraditionalPointFigureBoxSize(pointFigureBars);
    const effectivePointFigureBoxSize =
      pointFigureMode === "fixed"
        ? pointFigureFixedBoxSize
        : pointFigureMode === "atr"
          ? effectivePointFigureAtrBoxSize
          : pointFigureMode === "percentage"
            ? effectivePointFigurePercentageBoxSize
            : pointFigureMode === "traditional"
              ? effectivePointFigureTraditionalBoxSize
            : effectivePointFigureAutoBoxSize;
    const pointFigureVisibleColumns =
      mainChartType !== "point-figure" || visibleLogical === null
        ? null
        : Math.max(0, Math.round(visibleLogical.to - visibleLogical.from));

    const activeWatchlistItemId = workbenchWatchlist.find((item) => item.symbol === activeSymbol)?.id;
    const alertItems: AlertSummaryModel[] = workbenchAlerts.map(toAlertSummaryModel);
    const objectTree = buildWorkbenchObjectTree({
      symbol: activeSymbol,
      chartTypeLabel: formatWorkbenchChartType(mainChartType),
      panes: paneSnapshot,
      chartProjection: objectTreeChartProjection,
      alerts: workbenchAlerts,
    });
    const chartHosts =
      layoutPreset === "single"
        ? [
            buildWorkbenchChartHostModel({
              record: chartHostRecords[activeChartHostId],
              slotId: "slot-main",
              active: true,
            }),
          ]
        : [
            buildWorkbenchChartHostModel({
              record: chartHostRecords["market-main"],
              slotId: "slot-main",
              active: activeChartHostId === "market-main",
            }),
            buildWorkbenchChartHostModel({
              record: chartHostRecords["market-secondary"],
              slotId: "slot-side",
              active: activeChartHostId === "market-secondary",
            }),
          ];
    const workbenchModel = createChartWorkbenchModel({
      title: "Market Workbench",
      symbol: activeSymbol,
      exchangeLabel: activeExchangeLabel,
      timeframeLabel: activeTimeframe,
      chartTypeLabel: formatWorkbenchChartType(mainChartType),
      drawingTools: drawingToolsForSnapshot(drawingTool),
      activeToolId: drawingTool,
      watchlistItems: workbenchWatchlist,
      activeWatchlistItemId,
      alertItems,
      objectTree,
      activeRange: activeTimeframe,
      layoutPreset,
      chartHosts,
    });

    publish({
      title: "Workbench",
      summary:
        "The default example now behaves like a compact chart terminal instead of a document-like homepage.",
      workbench: workbenchModel,
      indicatorCatalog: WORKBENCH_INDICATOR_CATALOG,
      activeIndicators: [...activeIndicators],
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
                    ? `Auto ${formatPointFigureBoxSize(effectivePointFigureAutoBoxSize)} pts · ${pointFigureReversalBoxes} rev`
                    : pointFigureMode === "atr"
                      ? `ATR ${formatPointFigureBoxSize(effectivePointFigureAtrBoxSize)} pts · ${pointFigureAtrLength} len`
                      : pointFigureMode === "percentage"
                        ? `${pointFigurePercentageValue.toFixed(1)}% · ${formatPointFigureBoxSize(effectivePointFigurePercentageBoxSize)} pts`
                        : pointFigureMode === "traditional"
                          ? `Traditional ${formatPointFigureBoxSize(effectivePointFigureTraditionalBoxSize)} pts · ${pointFigureReversalBoxes} rev`
                          : `Fixed ${pointFigureFixedBoxSize} pts · ${pointFigureReversalBoxes} rev`,
              }]
          : []),
        ...(mainChartType === "line-break"
          ? [{
              label: "Line Break",
              value: `${lineBreakCount} lines · ${effectiveLineBreakRows?.length ?? 0} bricks`,
            }]
          : []),
        ...(mainChartType === "kagi"
          ? [{
              label: "Kagi",
              value:
                kagiMode === "auto"
                  ? `Auto ${formatPointFigureBoxSize(effectiveKagiAutoReversalSize)} pts`
                  : kagiMode === "atr"
                    ? `ATR ${formatPointFigureBoxSize(effectiveKagiAtrReversalSize)} pts`
                    : kagiMode === "percentage"
                      ? `${kagiPercentageValue.toFixed(1)}% · ${formatPointFigureBoxSize(effectiveKagiPercentageReversalSize)} pts`
                      : `Fixed ${kagiFixedReversalSize} pts`,
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
      pointFigureControls:
        mainChartType === "point-figure"
          ? {
              autoBoxSize: effectivePointFigureAutoBoxSize,
              effectiveBoxSize: effectivePointFigureBoxSize,
              mode: pointFigureMode,
              autoScale: pointFigureAutoScale,
              reversalBoxes: pointFigureReversalBoxes,
              visibleColumns: pointFigureVisibleColumns,
              atrLength: pointFigureAtrLength,
              percentageValue: pointFigurePercentageValue,
            }
          : null,
      lineBreakControls:
        mainChartType === "line-break"
          ? {
              lineCount: lineBreakCount,
              visibleColumns: lineBreakVisibleColumns,
            }
          : null,
      kagiControls:
        mainChartType === "kagi"
          ? {
              mode: kagiMode,
              autoReversalSize: effectiveKagiAutoReversalSize,
              effectiveReversalSize: effectiveKagiReversalSize,
              fixedReversalSize: kagiFixedReversalSize,
              autoScale: kagiAutoScale,
              atrLength: kagiAtrLength,
              percentageValue: kagiPercentageValue,
              visibleColumns: kagiVisibleColumns,
            }
          : null,
    });
  }

  if (options.alertsProvider !== undefined) {
    const loadStartedAtMutationVersion = alertMutationVersion;
    alertsLoadPromise = options.alertsProvider
      .loadWorkbenchAlerts()
      .then((state) => {
        if (destroyed) {
          return false;
        }
        if (alertMutationVersion !== loadStartedAtMutationVersion) {
          return true;
        }
        workbenchAlerts = state === null ? [] : [...state.alerts];
        persistEvaluatedWorkbenchAlerts();
        publishSnapshot();
        return true;
      })
      .catch((error: unknown) => {
        if (destroyed) {
          return false;
        }
        const message = error instanceof Error ? error.message : String(error);
        pushLog(log, `failed to load alerts: ${message}`);
        publishSnapshot();
        alertsLoadFailed = true;
        return false;
      })
      .finally(() => {
        alertsLoadCompleted = true;
      });
  }

  hostAdapter.listWatchlistItems()
    .then((items) => {
      if (destroyed) {
        return;
      }
      workbenchWatchlist = items;
      publishSnapshot();
    })
    .catch((error: unknown) => {
      if (destroyed) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      pushLog(log, `failed to load watchlist: ${message}`);
      publishSnapshot();
    });

  if (hasInjectedHostAdapter) {
    const requestSequence = ++symbolOpenSequence;
    loadWorkbenchInitialSymbolPayload(hostAdapter, requestedInitialSymbol, activeTimeframe)
      .then((result) => {
        if (destroyed || requestSequence !== symbolOpenSequence) {
          return;
        }

        if (!result.ok) {
          pushLog(log, result.message);
          publishSnapshot();
          return;
        }

        activeSymbol = result.payload.symbol;
        activeTimeframe = result.payload.timeframe;
        activeExchangeLabel = result.exchangeLabel;
        activeBarsPayload = result.payload;
        activeTradeLocationIntent = null;
        pendingTrendLineStart = null;
        drawingTool = "none";
        latestClick = null;
        latestReadout = null;
        mainChartType = "candlestick";
        activeChartHostId = "market-main";
        chartHostRecords["market-main"].symbol = activeSymbol;
        chartHostRecords["market-main"].timeframe = activeTimeframe;
        chartHostRecords["market-main"].chartType = mainChartType;
        chartHostRecords["market-main"].chartState = null;
        if (options.alertsProvider === undefined) {
          workbenchAlerts = createDemoWorkbenchAlerts();
        }
        persistEvaluatedWorkbenchAlerts();
        pushLog(log, `opened initial symbol ${activeSymbol} from host`);
        rebuild();
      })
      .catch((error: unknown) => {
        if (destroyed || requestSequence !== symbolOpenSequence) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        pushLog(log, `failed to open initial symbol ${requestedInitialSymbol}: ${message}`);
        publishSnapshot();
      });
  }

  const openWorkbenchDemoSymbol = async (input: {
    targetHostId: DemoWorkbenchChartHostId;
    symbol: string;
    timeframe: string;
    source: WorkbenchSymbolOpenSource;
    chartType?: WorkbenchMainChartType;
    clearHostChartState?: boolean;
    successLog?: (symbol: string) => string;
    failureLogPrefix: string;
  }): Promise<boolean> => {
    const requestSequence = ++symbolOpenSequence;
    let result: Awaited<ReturnType<typeof openWorkbenchSymbol>>;

    try {
      result = await openWorkbenchSymbol(hostAdapter, {
        symbol: input.symbol,
        timeframe: input.timeframe,
        source: input.source,
      });
    } catch (error) {
      if (destroyed || requestSequence !== symbolOpenSequence) {
        return false;
      }
      const message = error instanceof Error ? error.message : String(error);
      pushLog(log, `${input.failureLogPrefix}: ${message}`);
      publishSnapshot();
      return false;
    }

    if (destroyed || requestSequence !== symbolOpenSequence) {
      return false;
    }
    if (!result.ok) {
      pushLog(log, `${input.failureLogPrefix}: ${result.reason}`);
      publishSnapshot();
      return false;
    }

    activeChartHostId = input.targetHostId;
    activeSymbol = result.payload.symbol;
    activeTimeframe = result.payload.timeframe;
    activeExchangeLabel = result.payload.exchangeLabel ?? result.symbol.exchange ?? "";
    activeBarsPayload = result.payload;
    activeTradeLocationIntent = null;
    pendingTrendLineStart = null;
    drawingTool = "none";
    latestClick = null;
    latestReadout = null;
    mainChartType = input.chartType ?? "candlestick";
    chartHostRecords[activeChartHostId].symbol = activeSymbol;
    chartHostRecords[activeChartHostId].timeframe = activeTimeframe;
    chartHostRecords[activeChartHostId].chartType = mainChartType;
    if (input.clearHostChartState === true) {
      chartHostRecords[activeChartHostId].chartState = null;
    }
    if (options.alertsProvider === undefined) {
      workbenchAlerts = createDemoWorkbenchAlerts();
      alertMutationVersion += 1;
    }
    persistEvaluatedWorkbenchAlerts();
    if (input.successLog !== undefined) {
      pushLog(log, input.successLog(activeSymbol));
    }
    rebuild();
    return true;
  };

  const applyHostChartSnapshot = (input: {
    chartState: PhaseOneChartStateSnapshot;
    failureLogPrefix: string;
  }): boolean => {
    if (chart === null) {
      return false;
    }
    try {
      chart.applyChartState(input.chartState);
      refreshObjectTreeProjection();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushLog(log, `${input.failureLogPrefix}: ${message}`);
      publishSnapshot();
      return false;
    }
  };

  const setDemoLayoutPreset = (preset: DemoWorkbenchLayoutPreset) => {
    if (layoutPreset === preset) {
      return;
    }
    layoutPreset = preset;
    pushLog(log, preset === "single" ? "layout preset single" : "layout preset main-plus-secondary");
    publishSnapshot();
  };

  const activateDemoChartHost = async (targetHostId: DemoWorkbenchChartHostId): Promise<boolean> => {
    if (destroyed) {
      return false;
    }
    if (targetHostId === activeChartHostId) {
      publishSnapshot();
      return true;
    }

    const activationSequence = ++hostActivationSequence;
    snapshotLiveChartIntoHostRecord(activeChartHostId);

    const targetRecord = chartHostRecords[targetHostId];
    const shouldRestoreSnapshot = targetRecord.chartState !== null;
    if (shouldRestoreSnapshot) {
      suppressDefaultDrawingsNextRebuild = true;
    }

    const opened = await openWorkbenchDemoSymbol({
      targetHostId,
      symbol: targetRecord.symbol,
      timeframe: targetRecord.timeframe,
      source: "host",
      chartType: targetRecord.chartType,
      successLog: (openedSymbol) => `activated ${targetHostId} host (${openedSymbol})`,
      failureLogPrefix: `failed to activate ${targetHostId}`,
    });

    if (!opened || destroyed || activationSequence !== hostActivationSequence) {
      suppressDefaultDrawingsNextRebuild = false;
      return opened;
    }

    if (shouldRestoreSnapshot && targetRecord.chartState !== null) {
      const restored = applyHostChartSnapshot({
        chartState: targetRecord.chartState,
        failureLogPrefix: `failed to restore ${targetHostId} snapshot`,
      });
      if (restored) {
        pushLog(log, `restored ${targetHostId} snapshot (demo-local)`);
      }
    }

    publishSnapshot();
    return true;
  };

  const rebuild = () => {
    activeIndicators = [];
    const {
      bars,
      volume,
      line,
    } = workbenchSeries(mainChartType);
    const suppressSecondaryPanes = false;
    const lineBreakRows =
      mainChartType === "line-break"
        ? buildLineBreakData(bars, lineBreakCount)
        : null;
    const lineBreakLogicalLength =
      lineBreakRows === null
        ? null
        : createCompressedPriceBasedChartBarSequence(createPlotRows(lineBreakRows)).logicalLength;
    const pointFigureRows =
      mainChartType === "point-figure"
        ? buildPointFigureData(bars, {
            boxSizeMode: pointFigureMode,
            boxSize: pointFigureMode === "fixed" ? pointFigureFixedBoxSize : null,
            boxSizeScale: pointFigureAutoScale,
            reversalBoxes: pointFigureReversalBoxes,
            atrLength: pointFigureAtrLength,
            percentageValue: pointFigurePercentageValue,
          })
        : null;
    const pointFigureLogicalLength =
      pointFigureRows === null
        ? null
        : createDirectionColumnPriceBasedChartBarSequence(createPlotRows(pointFigureRows)).logicalLength;
    const kagiRows =
      mainChartType === "kagi"
        ? buildKagiData(bars, {
            reversalMode: kagiMode,
            reversalSize: kagiMode === "fixed" ? kagiFixedReversalSize : null,
            reversalScale: kagiAutoScale,
            atrLength: kagiAtrLength,
            percentageValue: kagiPercentageValue,
          })
        : null;
    const kagiLogicalLength =
      kagiRows === null
        ? null
        : createCompressedPriceBasedChartBarSequence(createPlotRows(kagiRows)).logicalLength;
    const effectiveBarSpacing =
      mainChartType === "point-figure"
        ? Math.max(
            12,
            Math.min(
              24,
              Math.floor(
                (Math.max(canvas.clientWidth || canvas.width || 960, 960) - 36) /
                  Math.max(Math.min(pointFigureLogicalLength ?? 1, 24) + 1, 1),
                ),
              ),
            )
        : mainChartType === "kagi"
          ? Math.max(
              22,
              Math.min(
                42,
                Math.floor(
                  (Math.max(canvas.clientWidth || canvas.width || 960, 960) - 36) /
                    Math.max(Math.min(kagiLogicalLength ?? 1, 18) + 1, 1),
                ),
              ),
            )
        : mainChartType === "line-break"
          ? Math.max(
              12,
              Math.min(
                24,
                Math.floor(
                  (Math.max(canvas.clientWidth || canvas.width || 960, 960) - 36) /
                    Math.max(Math.min(lineBreakLogicalLength ?? 1, 24) + 1, 1),
                ),
              ),
            )
        : barSpacing;
    const effectiveRightOffset =
      mainChartType === "point-figure" || mainChartType === "line-break" || mainChartType === "kagi"
        ? Math.min(rightOffset, 0.1)
        : rightOffset;
    const defaultDrawingRows = resolveMainDrawingRows(bars, lineBreakRows, pointFigureRows, kagiRows);
    const defaultDrawingAnchors = resolveDefaultDrawingAnchors(defaultDrawingRows);
    const volumeRows = mainChartType === "kagi" ? kagiRows ?? bars : bars;
    const lineRows = mainChartType === "kagi" ? kagiRows ?? bars : bars;
    const volumeData = createVolumeData(volumeRows);
    const lineData = createLineData(lineRows, mainChartType === "kagi" ? 14 : 6);

    chart?.destroy();
    chart = createChartxPhaseOneChart(canvas);
    chart.applyOptions(theme === "warm" ? warmChartOptions() : inkChartOptions());
    chart.timeScale().applyOptions({
      rightOffset: effectiveRightOffset,
      barSpacing: effectiveBarSpacing,
    });
    teardownChartTypeSubscription?.();
    const handleChartTypeChange: PhaseOneChartTypeChangeHandler = (type) => {
      if (type !== "histogram") {
        mainChartType = type;
        updateActiveHostChartType();
      }
      pushLog(log, `chart type ${type}`);
      refreshObjectTreeProjectionAndPublish();
    };
    chart.subscribeChartTypeChange(handleChartTypeChange);
    teardownChartTypeSubscription = () => {
      chart?.unsubscribeChartTypeChange(handleChartTypeChange);
      teardownChartTypeSubscription = null;
    };
    chart.subscribePaneEvents((event) => {
      latestPaneEvent = event;
      paneSnapshot = paneSnapshotWithProjectedCounts(event.panes, objectTreeChartProjection);
      pushLog(log, `${event.type} pane ${event.pane.paneIndex + 1}`);
      publishSnapshot();
    });

    if (mainChartType === "candlestick") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
    } else if (mainChartType === "line-break") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      const chartTypeSeries = chart.setChartType("line-break");
      chartTypeSeries.applyOptions({
        lineBreakCount,
      });
      if (lineBreakLogicalLength !== null) {
        const lastLogical = lineBreakLogicalLength - 1;
        const targetVisibleColumns = Math.max(14, Math.min(24, lineBreakLogicalLength));
        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(-0.5, lastLogical - targetVisibleColumns + 1 - 0.5),
          to: lastLogical + 0.5,
        });
      }
    } else if (mainChartType === "kagi") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      const chartTypeSeries = chart.setChartType("kagi");
      chartTypeSeries.applyOptions({
        kagiReversalMode: kagiMode,
        kagiReversalSize: kagiMode === "fixed" ? kagiFixedReversalSize : null,
        kagiReversalScale: kagiAutoScale,
        kagiAtrLength: kagiAtrLength,
        kagiPercentageValue: kagiPercentageValue,
      });
      if (kagiLogicalLength !== null) {
        const lastLogical = kagiLogicalLength - 1;
        if (kagiLogicalLength <= 18) {
          chart.timeScale().setVisibleLogicalRange({
            from: -0.5,
            to: lastLogical + 0.5,
          });
        } else {
          const targetVisibleColumns = Math.max(12, Math.min(18, kagiLogicalLength));
          chart.timeScale().setVisibleLogicalRange({
            from: Math.max(-0.5, lastLogical - targetVisibleColumns + 1 - 0.5),
            to: lastLogical + 0.5,
          });
        }
      }
    } else if (mainChartType === "point-figure") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      const chartTypeSeries = chart.setChartType("point-figure");
      chartTypeSeries.applyOptions({
        pointFigureBoxSizeMode: pointFigureMode,
        pointFigureBoxSize: pointFigureMode === "fixed" ? pointFigureFixedBoxSize : null,
        pointFigureBoxSizeScale: pointFigureAutoScale,
        pointFigureReversalBoxes,
        pointFigureAtrLength: pointFigureAtrLength,
        pointFigurePercentageValue: pointFigurePercentageValue,
      });
      if (pointFigureLogicalLength !== null) {
        const lastLogical = pointFigureLogicalLength - 1;
        if (pointFigureLogicalLength <= 24) {
          chart.timeScale().setVisibleLogicalRange({
            from: -0.5,
            to: lastLogical + 0.5,
          });
        } else {
          const targetVisibleColumns = Math.max(16, Math.min(26, pointFigureLogicalLength));
          chart.timeScale().setVisibleLogicalRange({
            from: Math.max(-0.5, lastLogical - targetVisibleColumns + 1 - 0.5),
            to: lastLogical + 0.5,
          });
        }
      }
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
    } else if (mainChartType === "columns") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      chart.setChartType("columns");
    } else if (mainChartType === "hlc-area") {
      const mainSeries = chart.addCandlestickSeries();
      mainSeries.setData(bars);
      chart.setChartType("hlc-area");
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

    if (!suppressSecondaryPanes) {
      const volumePane = chart.addPane({ height: 126 });
      const volumeSeries = chart.addVolumeSeries({ pane: volumePane });
      volumeSeries.setData(volumeData);
    }

    if (!suppressSecondaryPanes && studyPaneEnabled) {
      const studyPane = chart.addPane({ height: 126 });
      const studySeries = chart.addLineSeries({ pane: studyPane });
      studySeries.applyOptions({
        color: theme === "warm" ? "#365cb7" : "#2563eb",
        lineWidth: 3,
      });
      studySeries.setData(lineData);
    }

    for (let index = 0; index < emptyPaneCount; index += 1) {
      chart.addPane({ height: 88, resizable: true });
    }

    if (activeTradeLocationIntent !== null) {
      applyTradeLocation(activeTradeLocationIntent, false);
    }

    const shouldAddDefaultDrawings =
      defaultDrawingAnchors !== null && !suppressDefaultDrawingsNextRebuild;
    suppressDefaultDrawingsNextRebuild = false;
    if (shouldAddDefaultDrawings && defaultDrawingAnchors !== null) {
      const activeChart = chart;
      queueMicrotask(() => {
        if (chart !== activeChart) {
          return;
        }
        chart.addHorizontalLineDrawing(undefined, {
          price: defaultDrawingAnchors.horizontalPrice,
          title: "Swing low",
          color: theme === "warm" ? "#9333ea" : "#7c3aed",
          lineWidth: 2,
          magnetEnabled: true,
          timeMagnetPolicy: "previous",
        });
        chart.addTrendLineDrawing(undefined, {
          startTime: defaultDrawingAnchors.trendStartTime,
          startPrice: defaultDrawingAnchors.trendStartPrice,
          endTime: defaultDrawingAnchors.trendEndTime,
          endPrice: defaultDrawingAnchors.trendEndPrice,
          color: theme === "warm" ? "#ea580c" : "#2563eb",
          lineWidth: 3,
          magnetEnabled: true,
          timeMagnetEnabled: true,
          timeMagnetPolicy: "nearest",
        });
        refreshObjectTreeProjectionAndPublish();
      });
    }

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
          refreshObjectTreeProjectionAndPublish();
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
        refreshObjectTreeProjectionAndPublish();
        return;
      }
      pushLog(log, `click ${formatTime(event.time)} ${formatMaybeNumber(event.price)}`);
      publishSnapshot();
    });
    chart.subscribeDrawingSelectionChange((selection) => {
      pushLog(log, selection === null ? "drawing cleared" : `drawing ${selection.kind} selected`);
      publishSnapshot();
    });
    refreshObjectTreeProjectionAndPublish();
  };

  rebuild();

  const addActiveIndicator = (entry: WorkbenchIndicatorCatalogEntry) => {
    activeIndicators = [
      ...activeIndicators,
      {
        id: entry.id,
        label: entry.label,
        kind: entry.engineKind,
        placement: entry.placement,
      },
    ];
  };

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
        ...(mainChartType === "line-break"
          ? [
              {
                id: "line-break-2",
                label: "2-Line",
                group: "line-break-option" as const,
                active: lineBreakCount === 2,
              },
              {
                id: "line-break-3",
                label: "3-Line",
                group: "line-break-option" as const,
                active: lineBreakCount === 3,
              },
              {
                id: "line-break-5",
                label: "5-Line",
                group: "line-break-option" as const,
                active: lineBreakCount === 5,
              },
            ]
          : []),
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
          id: "main-columns",
          label: "Columns",
          group: "chart-type",
          active: mainChartType === "columns",
        },
        {
          id: "main-hlc-area",
          label: "HLC Area",
          group: "chart-type",
          active: mainChartType === "hlc-area",
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
                id: "point-figure-atr",
                label: "P&F ATR",
                group: "point-figure-option" as const,
                active: pointFigureMode === "atr",
              },
              {
                id: "point-figure-percentage",
                label: "P&F %",
                group: "point-figure-option" as const,
                active: pointFigureMode === "percentage",
              },
              {
                id: "point-figure-traditional",
                label: "P&F Trad",
                group: "point-figure-option" as const,
                active: pointFigureMode === "traditional",
              },
              {
                id: "point-figure-fixed",
                label: "P&F Fixed",
                group: "point-figure-option" as const,
                active: pointFigureMode === "fixed",
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
        {
          id: "layout-single",
          label: "Layout single",
          tone: "default",
          group: "chart-action",
          active: layoutPreset === "single",
        },
        {
          id: "layout-split",
          label: "Layout split",
          tone: "default",
          group: "chart-action",
          active: layoutPreset === "main-plus-secondary",
        },
        {
          id: "host-main",
          label: "Activate main host",
          tone: "default",
          group: "chart-action",
          active: activeChartHostId === "market-main",
        },
        {
          id: "host-secondary",
          label: "Activate secondary host",
          tone: "default",
          group: "chart-action",
          active: activeChartHostId === "market-secondary",
        },
      ];
    },
    runAction(actionId) {
      switch (actionId) {
        case "layout-single":
          setDemoLayoutPreset("single");
          return;
        case "layout-split":
          setDemoLayoutPreset("main-plus-secondary");
          return;
        case "host-main":
          void activateDemoChartHost("market-main");
          return;
        case "host-secondary":
          if (layoutPreset !== "main-plus-secondary") {
            pushLog(log, "secondary host requires split layout preset");
            publishSnapshot();
            return;
          }
          void activateDemoChartHost("market-secondary");
          return;
        default:
          break;
      }

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
        updateActiveHostChartType();
        if (
          previousType === "point-figure" ||
          nextType === "point-figure" ||
          previousType === "line-break" ||
          nextType === "line-break"
        ) {
          rebuild();
          return;
        }

        currentChart.setChartType(nextType);
        refreshObjectTreeProjectionAndPublish();
      };

      switch (actionId) {
        case "main-candlestick":
          switchMainChartType("candlestick");
          return;
        case "main-line-break":
          switchMainChartType("line-break");
          return;
        case "line-break-2":
          lineBreakCount = 2;
          rebuild();
          return;
        case "line-break-3":
          lineBreakCount = 3;
          rebuild();
          return;
        case "line-break-5":
          lineBreakCount = 5;
          rebuild();
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
            pointFigureBoxSizeScale: pointFigureAutoScale,
            pointFigureReversalBoxes,
            pointFigureAtrLength: pointFigureAtrLength,
            pointFigurePercentageValue: pointFigurePercentageValue,
          });
          rebuild();
          return;
        case "point-figure-atr":
          pointFigureMode = "atr";
          chart.setChartType("point-figure").applyOptions({
            pointFigureBoxSizeMode: "atr",
            pointFigureBoxSize: null,
            pointFigureBoxSizeScale: pointFigureAutoScale,
            pointFigureReversalBoxes,
            pointFigureAtrLength: pointFigureAtrLength,
            pointFigurePercentageValue: pointFigurePercentageValue,
          });
          rebuild();
          return;
        case "point-figure-percentage":
          pointFigureMode = "percentage";
          chart.setChartType("point-figure").applyOptions({
            pointFigureBoxSizeMode: "percentage",
            pointFigureBoxSize: null,
            pointFigureBoxSizeScale: 1,
            pointFigureReversalBoxes,
            pointFigureAtrLength: pointFigureAtrLength,
            pointFigurePercentageValue: pointFigurePercentageValue,
          });
          rebuild();
          return;
        case "point-figure-traditional":
          pointFigureMode = "traditional";
          chart.setChartType("point-figure").applyOptions({
            pointFigureBoxSizeMode: "traditional",
            pointFigureBoxSize: null,
            pointFigureBoxSizeScale: 1,
            pointFigureReversalBoxes,
            pointFigureAtrLength: pointFigureAtrLength,
            pointFigurePercentageValue: pointFigurePercentageValue,
          });
          rebuild();
          return;
        case "point-figure-fixed":
          pointFigureMode = "fixed";
          chart.setChartType("point-figure").applyOptions({
            pointFigureBoxSizeMode: "fixed",
            pointFigureBoxSize: pointFigureFixedBoxSize,
            pointFigureBoxSizeScale: 1,
            pointFigureReversalBoxes,
            pointFigureAtrLength: pointFigureAtrLength,
            pointFigurePercentageValue: pointFigurePercentageValue,
          });
          rebuild();
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
        case "main-columns":
          switchMainChartType("columns");
          return;
        case "main-hlc-area":
          switchMainChartType("hlc-area");
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
          refreshObjectTreeProjectionAndPublish();
          return;
        case "renko-box-2":
          renkoMode = "fixed";
          renkoFixedBoxSize = 2;
          chart.setChartType("renko").applyOptions({
            renkoBoxSizeMode: "fixed",
            renkoBoxSize: 2,
          });
          refreshObjectTreeProjectionAndPublish();
          return;
        case "renko-box-4":
          renkoMode = "fixed";
          renkoFixedBoxSize = 4;
          chart.setChartType("renko").applyOptions({
            renkoBoxSizeMode: "fixed",
            renkoBoxSize: 4,
          });
          refreshObjectTreeProjectionAndPublish();
          return;
        case "renko-box-8":
          renkoMode = "fixed";
          renkoFixedBoxSize = 8;
          chart.setChartType("renko").applyOptions({
            renkoBoxSizeMode: "fixed",
            renkoBoxSize: 8,
          });
          refreshObjectTreeProjectionAndPublish();
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
      refreshObjectTreeProjectionAndPublish();
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
    setPointFigureAutoScale(scale) {
      pointFigureAutoScale = Math.min(2.5, Math.max(0.35, scale));
      if (mainChartType === "point-figure") {
        rebuild();
        return;
      }
      publishSnapshot();
    },
    setPointFigureMode(mode) {
      pointFigureMode = mode;
      if (mainChartType === "point-figure") {
        rebuild();
        return;
      }
      publishSnapshot();
    },
    setPointFigureAtrLength(length) {
      pointFigureAtrLength = Math.min(60, Math.max(2, Math.round(length)));
      if (mainChartType === "point-figure") {
        rebuild();
        return;
      }
      publishSnapshot();
    },
    setPointFigurePercentageValue(value) {
      pointFigurePercentageValue = Math.min(10, Math.max(0.1, value));
      if (mainChartType === "point-figure") {
        rebuild();
        return;
      }
      publishSnapshot();
    },
    setKagiMode(mode) {
      kagiMode = mode;
      if (mainChartType === "kagi") {
        rebuild();
        return;
      }
      publishSnapshot();
    },
    setKagiFixedReversalSize(value) {
      kagiFixedReversalSize = Math.min(2_000, Math.max(10, Math.round(value)));
      if (mainChartType === "kagi") {
        rebuild();
        return;
      }
      publishSnapshot();
    },
    setKagiAutoScale(scale) {
      kagiAutoScale = Math.min(2.5, Math.max(0.35, scale));
      if (mainChartType === "kagi") {
        rebuild();
        return;
      }
      publishSnapshot();
    },
    setKagiAtrLength(length) {
      kagiAtrLength = Math.min(60, Math.max(2, Math.round(length)));
      if (mainChartType === "kagi") {
        rebuild();
        return;
      }
      publishSnapshot();
    },
    setKagiPercentageValue(value) {
      kagiPercentageValue = Math.min(10, Math.max(0.1, value));
      if (mainChartType === "kagi") {
        rebuild();
        return;
      }
      publishSnapshot();
    },
    addIndicatorFromCatalog(entryId) {
      const entry = getWorkbenchIndicatorCatalogEntry(entryId);
      if (entry === null) {
        pushLog(log, `failed to add indicator ${entryId}: unknown catalog entry`);
        publishSnapshot();
        return false;
      }
      if (!entry.enabled) {
        pushLog(log, `failed to add indicator ${entry.label}: ${entry.unavailableReason ?? "disabled"}`);
        publishSnapshot();
        return false;
      }
      if (chart === null) {
        pushLog(log, `failed to add indicator ${entry.label}: chart unavailable`);
        publishSnapshot();
        return false;
      }

      if (entry.engineKind === "moving-average") {
        const pane = chart.addPane({ height: 126 });
        const study = chart.addMovingAverageStudy({ pane });
        study.applyStudyOptions({ length: 20 });
        addActiveIndicator(entry);
        pushLog(log, "added indicator Moving Average");
        refreshObjectTreeProjectionAndPublish();
        return true;
      }

      if (entry.engineKind === "compare") {
        const compare = chart.addCompareSeries();
        compare.setData(activeBarsPayload.line);
        compare.applyCompareOptions({
          requestedSymbol: activeSymbol,
          requestedResolution: activeTimeframe,
          inputContextMode: "chart-context",
          affectMainScale: false,
        });
        addActiveIndicator(entry);
        pushLog(log, "added indicator Compare");
        refreshObjectTreeProjectionAndPublish();
        return true;
      }

      const overlay = chart.addOverlaySeries();
      overlay.applyOptions({
        color: theme === "warm" ? "#c2410c" : "#38bdf8",
        lineWidth: 3,
      });
      overlay.setData(activeBarsPayload.line);
      addActiveIndicator(entry);
      pushLog(log, "added indicator Overlay Line");
      refreshObjectTreeProjectionAndPublish();
      return true;
    },
    async openSymbol(symbol) {
      layoutOperationSequence += 1;
      const targetHostId = activeChartHostId;
      chartHostRecords[targetHostId].symbol = symbol;
      chartHostRecords[targetHostId].chartType = mainChartType;
      chartHostRecords[targetHostId].chartState = null;
      return openWorkbenchDemoSymbol({
        targetHostId,
        symbol,
        timeframe: chartHostRecords[targetHostId].timeframe,
        source: "watchlist",
        chartType: chartHostRecords[targetHostId].chartType,
        clearHostChartState: true,
        successLog: (openedSymbol) => `opened symbol ${openedSymbol} from watchlist`,
        failureLogPrefix: `failed to open ${symbol}`,
      });
    },
    async createPriceAlert() {
      if (!(await ensureWorkbenchAlertsLoaded()) || destroyed) {
        return false;
      }

      const latestClose = latestActiveClose();
      if (latestClose === null) {
        pushLog(log, `failed to create alert ${activeSymbol}: no active close`);
        publishSnapshot();
        return false;
      }

      const now = latestActiveTimestamp();
      const targetPrice = Math.round(latestClose) + 25;
      const alert: WorkbenchAlertState = {
        id: `alert-${activeSymbol.toLowerCase()}-${activeTimeframe.toLowerCase()}-${workbenchAlerts.length + 1}`,
        label: `${activeSymbol} price cross`,
        condition: {
          kind: "price-crosses",
          symbol: activeSymbol,
          timeframe: activeTimeframe,
          price: targetPrice,
          direction: "above",
        },
        status: "armed",
        createdAt: now,
        updatedAt: now,
      };
      const previousAlerts = workbenchAlerts;
      workbenchAlerts = [...workbenchAlerts, alert];
      alertMutationVersion += 1;
      evaluateActivePriceAlerts();

      try {
        const saved = await saveWorkbenchAlerts();
        if (destroyed) {
          return false;
        }
        if (!saved) {
          workbenchAlerts = previousAlerts;
          pushLog(log, `failed to create alert ${activeSymbol}: alerts provider rejected the alert`);
          publishSnapshot();
          return false;
        }
      } catch (error) {
        if (destroyed) {
          return false;
        }
        workbenchAlerts = previousAlerts;
        const message = error instanceof Error ? error.message : String(error);
        pushLog(log, `failed to create alert ${activeSymbol}: ${message}`);
        publishSnapshot();
        return false;
      }

      pushLog(log, `created alert ${activeSymbol} price crosses ${targetPrice.toFixed(2)}`);
      publishSnapshot();
      return true;
    },
    // Demo note: layout persistence is still active-host-only in this slice (no multi-host save/restore yet).
    async saveLayout() {
      layoutOperationSequence += 1;
      const provider = options.persistenceProvider;
      if (provider === undefined) {
        pushLog(log, "failed to save layout: persistence provider unavailable");
        publishSnapshot();
        return false;
      }

      try {
        const state = createWorkbenchDemoLayoutState({
          activeSymbol,
          activeTimeframe,
          chartType: mainChartType,
          chart,
        });
        const saved = await provider.saveWorkbenchLayout(state);
        if (destroyed) {
          return false;
        }
        if (!saved) {
          pushLog(log, "failed to save layout: persistence provider rejected the layout");
          publishSnapshot();
          return false;
        }
        pushLog(log, `saved layout ${state.activeSymbol}`);
        publishSnapshot();
        return true;
      } catch (error) {
        if (destroyed) {
          return false;
        }
        const message = error instanceof Error ? error.message : String(error);
        pushLog(log, `failed to save layout: ${message}`);
        publishSnapshot();
        return false;
      }
    },
    async restoreLayout() {
      const provider = options.persistenceProvider;
      if (provider === undefined) {
        pushLog(log, "failed to restore layout: persistence provider unavailable");
        publishSnapshot();
        return false;
      }

      const layoutOperation = ++layoutOperationSequence;
      let state: WorkbenchLayoutState | null;
      try {
        state = await provider.loadWorkbenchLayout();
      } catch (error) {
        if (destroyed) {
          return false;
        }
        const message = error instanceof Error ? error.message : String(error);
        pushLog(log, `failed to restore layout: ${message}`);
        publishSnapshot();
        return false;
      }

      if (destroyed || layoutOperation !== layoutOperationSequence) {
        return false;
      }
      if (state === null) {
        pushLog(log, "failed to restore layout: no saved layout");
        publishSnapshot();
        return false;
      }

      const chartType = toWorkbenchMainChartType(state.chartType);
      if (chartType === null) {
        pushLog(log, `failed to restore layout ${state.activeSymbol}: unsupported chart type ${state.chartType}`);
        publishSnapshot();
        return false;
      }

      chartHostRecords[activeChartHostId].symbol = state.activeSymbol;
      chartHostRecords[activeChartHostId].timeframe = state.activeTimeframe;
      chartHostRecords[activeChartHostId].chartType = chartType;
      chartHostRecords[activeChartHostId].chartState = state.chartState;
      const shouldSuppressDefaultDrawings = state.chartState !== null;
      if (shouldSuppressDefaultDrawings) {
        suppressDefaultDrawingsNextRebuild = true;
      }
      const opened = await openWorkbenchDemoSymbol({
        targetHostId: activeChartHostId,
        symbol: state.activeSymbol,
        timeframe: state.activeTimeframe,
        source: "host",
        chartType,
        failureLogPrefix: `failed to restore layout ${state.activeSymbol}`,
      });
      if (!opened) {
        suppressDefaultDrawingsNextRebuild = false;
        return false;
      }
      if (destroyed || layoutOperation !== layoutOperationSequence) {
        return false;
      }

      try {
        if (state.chartState !== null) {
          chart?.applyChartState(state.chartState);
          refreshObjectTreeProjection();
        }
      } catch (error) {
        if (destroyed) {
          return false;
        }
        const message = error instanceof Error ? error.message : String(error);
        pushLog(log, `failed to restore layout ${state.activeSymbol}: ${message}`);
        publishSnapshot();
        return false;
      }

      if (destroyed || layoutOperation !== layoutOperationSequence) {
        return false;
      }
      pushLog(log, `restored layout ${state.activeSymbol}`);
      publishSnapshot();
      return true;
    },
    async resetLayout() {
      layoutOperationSequence += 1;
      chartHostRecords[activeChartHostId].symbol = "NDX";
      chartHostRecords[activeChartHostId].timeframe = "1D";
      chartHostRecords[activeChartHostId].chartType = "candlestick";
      chartHostRecords[activeChartHostId].chartState = null;
      const opened = await openWorkbenchDemoSymbol({
        targetHostId: activeChartHostId,
        symbol: "NDX",
        timeframe: "1D",
        source: "host",
        chartType: "candlestick",
        clearHostChartState: true,
        failureLogPrefix: "failed to reset layout",
      });
      if (!opened) {
        return false;
      }

      if (destroyed) {
        return false;
      }
      pushLog(log, "reset layout");
      publishSnapshot();
      return true;
    },
    locateTrade(intent) {
      return applyTradeLocation(intent, true);
    },
    destroy() {
      destroyed = true;
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
    case "columns":
      return "Columns";
    case "hlc-area":
      return "HLC Area";
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
              : `${latestReadout.formatted.time} ${latestReadout.formatted.price}`,
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

function createHistogramData(bars: readonly PhaseOneCandlestickData[]): PhaseOneHistogramData[] {
  return bars.map((bar, index) => ({
    time: bar.time,
    value: 48 + Math.round(Math.abs(bar.close - bar.open) * 0.55) + (index % 5) * 9,
    up: bar.close >= bar.open,
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
