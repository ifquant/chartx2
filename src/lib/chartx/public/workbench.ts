import type { RunLocationIntent, TradeLocationIntent } from "./performance";

export type ChartFamily = "market" | "performance";
export type ChartHostId = string;
export type ChartSlotId = string;
export type MultiChartLayoutPreset = "single" | "grid-2x2" | "main-plus-secondary";
export type WorkbenchSymbolMode = "shared" | "independent";
export type BottomPanelTabId =
  | "time-presets"
  | "logs"
  | "replay"
  | "performance-link"
  | "custom";

export interface WorkbenchToolbarModel {
  activeSymbol: string;
  exchangeLabel?: string;
  timeframeLabel: string;
  chartTypeLabel: string;
  indicatorsLabel: string;
  alertLabel: string;
  replayLabel: string;
  layoutLabel: string;
}

export interface WorkbenchToolDescriptor {
  id: string;
  label: string;
  icon?: string;
  active?: boolean;
  enabled?: boolean;
}

export interface LeftDrawingToolbarModel {
  activeToolId: string;
  tools: readonly WorkbenchToolDescriptor[];
}

export interface WatchlistItemModel {
  id: string;
  symbol: string;
  name?: string;
  lastLabel: string;
  lastValue?: number;
  changeLabel: string;
  changePercent?: number;
  changeTone?: "positive" | "negative" | "neutral";
}

export interface WatchlistPanelModel {
  title: string;
  activeListId: string;
  activeItemId?: string;
  items: readonly WatchlistItemModel[];
}

export interface AlertSummaryModel {
  id: string;
  label: string;
  conditionLabel: string;
  status: "armed" | "paused" | "triggered";
}

export interface AlertPanelModel {
  title: string;
  items: readonly AlertSummaryModel[];
}

export interface ScreenerResultModel {
  id: string;
  symbol: string;
  name?: string;
  lastLabel: string;
  changeLabel: string;
  rankLabel: string;
  noteLabel?: string;
  changeTone?: "positive" | "negative" | "neutral";
}

export interface ScreenerPanelModel {
  title: string;
  modeLabel: string;
  summaryLabel: string;
  filters: readonly WorkbenchToolDescriptor[];
  results: readonly ScreenerResultModel[];
  emptyLabel: string;
}

export type WorkbenchObjectTreeNodeKind =
  | "chart"
  | "pane"
  | "main-series"
  | "series"
  | "study"
  | "drawing"
  | "alert"
  | "trade-location";

export interface WorkbenchObjectTreeNodeModel {
  id: string;
  kind: WorkbenchObjectTreeNodeKind;
  label: string;
  detailLabel?: string;
  badgeLabel?: string;
  depth: number;
  muted?: boolean;
}

export interface ObjectTreePanelModel {
  title: string;
  summaryLabel: string;
  nodes: readonly WorkbenchObjectTreeNodeModel[];
  emptyLabel: string;
}

export interface RightSidebarModel {
  watchlist: WatchlistPanelModel;
  screener: ScreenerPanelModel;
  alerts: AlertPanelModel;
  objectTree: ObjectTreePanelModel;
  placeholders: readonly ("news" | "object-tree" | "screener" | "symbol-detail")[];
}

export interface BottomPanelTabModel {
  id: BottomPanelTabId;
  label: string;
  enabled: boolean;
}

export interface BottomPanelModel {
  activeRange: string;
  ranges: readonly string[];
  activeTab: BottomPanelTabId;
  tabs: readonly BottomPanelTabModel[];
}

export interface ChartHostModel {
  id: ChartHostId;
  family: ChartFamily;
  title: string;
  slotId: ChartSlotId;
  active: boolean;
  symbolLabel?: string;
  timeframeLabel?: string;
  chartTypeLabel?: string;
  statusLabel?: string;
}

export interface ChartSlotModel {
  id: ChartSlotId;
  title: string;
  role: "primary" | "secondary";
  chartHostId: ChartHostId | null;
}

export interface MultiChartLayoutModel {
  preset: MultiChartLayoutPreset;
  symbolMode: WorkbenchSymbolMode;
  activeChartHostId: ChartHostId | null;
  slots: readonly ChartSlotModel[];
}

export interface ChartWorkbenchModel {
  title: string;
  toolbar: WorkbenchToolbarModel;
  leftToolbar: LeftDrawingToolbarModel;
  rightSidebar: RightSidebarModel;
  bottomPanel: BottomPanelModel;
  layout: MultiChartLayoutModel;
  chartHosts: readonly ChartHostModel[];
}

export interface MarketDataSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
}

export interface MarketDataAdapter {
  searchSymbols(query: string): Promise<readonly MarketDataSearchResult[]>;
  resolveBars(
    symbol: string,
    timeframe: string,
    range?: { from: number; to: number },
  ): Promise<unknown>;
  subscribeBars?(
    symbol: string,
    timeframe: string,
    onData: (payload: unknown) => void,
  ): Promise<() => void>;
  getSessionMetadata?(symbol: string): Promise<{
    timezone?: string;
    tradingSessions?: readonly string[];
  }>;
}

export interface WatchlistProvider {
  loadLists(): Promise<readonly WatchlistPanelModel[]>;
  saveList(list: WatchlistPanelModel): Promise<void>;
}

export interface AlertProvider {
  listAlerts(): Promise<readonly AlertSummaryModel[]>;
  saveAlert(alert: AlertSummaryModel): Promise<void>;
  removeAlert(alertId: string): Promise<void>;
}

export interface PerformanceProvider {
  loadRunSummaries(): Promise<unknown>;
  loadTradeList(runId: string): Promise<unknown>;
  loadReportDataset(runId: string): Promise<unknown>;
  loadOptimizationDataset(sweepId: string): Promise<unknown>;
}

export interface WorkbenchPersistenceProvider {
  loadWorkbenchState(): Promise<ChartWorkbenchModel | null>;
  saveWorkbenchState(state: ChartWorkbenchModel): Promise<void>;
}

export interface SymbolLocationIntent {
  kind: "locate-symbol";
  symbol: string;
  timeframe?: string;
  source: "search" | "watchlist" | "host";
}

export interface WorkbenchSelectionSync {
  activeChartHostId: ChartHostId | null;
  activeSymbol: string;
  activeTimeframe: string;
}

export interface HostIntentBridge {
  openSymbol(intent: SymbolLocationIntent): Promise<void> | void;
  locateRun(intent: RunLocationIntent): Promise<void> | void;
  locateTrade(intent: TradeLocationIntent): Promise<void> | void;
  syncWorkbenchSelection(selection: WorkbenchSelectionSync): Promise<void> | void;
}

export interface ChartWorkbenchModelInput {
  title?: string;
  symbol: string;
  exchangeLabel?: string;
  timeframeLabel: string;
  chartTypeLabel: string;
  drawingTools?: readonly WorkbenchToolDescriptor[];
  activeToolId?: string;
  watchlistItems?: readonly WatchlistItemModel[];
  activeWatchlistItemId?: string;
  screener?: ScreenerPanelModel;
  alertItems?: readonly AlertSummaryModel[];
  objectTree?: ObjectTreePanelModel;
  activeRange?: string;
  ranges?: readonly string[];
  activeTab?: BottomPanelTabId;
  enabledBottomTabs?: readonly BottomPanelTabId[];
  layoutPreset?: MultiChartLayoutPreset;
  symbolMode?: WorkbenchSymbolMode;
  chartHosts?: readonly ChartHostModel[];
}

const DEFAULT_RANGES = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"] as const;
const DEFAULT_PLACEHOLDERS = ["news", "object-tree", "screener", "symbol-detail"] as const;
const DEFAULT_BOTTOM_TABS: readonly BottomPanelTabModel[] = [
  { id: "time-presets", label: "Time presets", enabled: true },
  { id: "logs", label: "Logs", enabled: false },
  { id: "replay", label: "Replay", enabled: false },
  { id: "performance-link", label: "Performance", enabled: false },
];

function createDefaultObjectTree(input: ChartWorkbenchModelInput): ObjectTreePanelModel {
  return {
    title: "Object Tree",
    summaryLabel: "1 object",
    emptyLabel: "No chart objects",
    nodes: [
      {
        id: `chart:${input.symbol}`,
        kind: "chart",
        label: input.symbol,
        detailLabel: input.chartTypeLabel,
        depth: 0,
      },
    ],
  };
}

function defaultSlotsForPreset(preset: MultiChartLayoutPreset): ChartSlotModel[] {
  if (preset === "grid-2x2") {
    return [
      { id: "slot-1", title: "Chart 1", role: "primary", chartHostId: null },
      { id: "slot-2", title: "Chart 2", role: "secondary", chartHostId: null },
      { id: "slot-3", title: "Chart 3", role: "secondary", chartHostId: null },
      { id: "slot-4", title: "Chart 4", role: "secondary", chartHostId: null },
    ];
  }
  if (preset === "main-plus-secondary") {
    return [
      { id: "slot-main", title: "Primary chart", role: "primary", chartHostId: null },
      { id: "slot-side", title: "Secondary chart", role: "secondary", chartHostId: null },
    ];
  }
  return [{ id: "slot-main", title: "Primary chart", role: "primary", chartHostId: null }];
}

export function createChartWorkbenchModel(
  input: ChartWorkbenchModelInput,
): ChartWorkbenchModel {
  const chartHostsInput = input.chartHosts ?? [
    {
      id: "market-main",
      family: "market",
      title: `${input.symbol} chart`,
      slotId: "slot-main",
      active: true,
    },
  ];
  const normalizedActiveHostId =
    chartHostsInput.find((host) => host.active)?.id ?? chartHostsInput[0]?.id ?? null;
  const chartHosts = chartHostsInput.map((host) => ({
    ...host,
    active: host.id === normalizedActiveHostId,
    symbolLabel: host.symbolLabel ?? input.symbol,
    timeframeLabel: host.timeframeLabel ?? input.timeframeLabel,
    chartTypeLabel: host.chartTypeLabel ?? input.chartTypeLabel,
    statusLabel: host.statusLabel ?? (host.id === normalizedActiveHostId ? "Active" : undefined),
  }));
  const layoutPreset = input.layoutPreset ?? "single";
  const enabledBottomTabs = new Set(input.enabledBottomTabs ?? []);
  const defaultSlots = defaultSlotsForPreset(layoutPreset);
  const hostBySlotId = new Map(chartHosts.map((host) => [host.slotId, host]));
  const slots = defaultSlots.map((slot) => {
    const host = hostBySlotId.get(slot.id) ?? null;
    return {
      ...slot,
      chartHostId: host?.id ?? null,
      title: host?.title ?? slot.title,
    };
  });

  return {
    title: input.title ?? "Chart Workbench",
    toolbar: {
      activeSymbol: input.symbol,
      exchangeLabel: input.exchangeLabel,
      timeframeLabel: input.timeframeLabel,
      chartTypeLabel: input.chartTypeLabel,
      indicatorsLabel: "Indicators",
      alertLabel: "Alert",
      replayLabel: "Replay",
      layoutLabel:
        layoutPreset === "grid-2x2"
          ? "Layout 2x2"
          : layoutPreset === "main-plus-secondary"
            ? "Layout split"
            : "Layout single",
    },
    leftToolbar: {
      activeToolId: input.activeToolId ?? "none",
      tools: input.drawingTools ?? [],
    },
    rightSidebar: {
      watchlist: {
        title: "Watchlist",
        activeListId: "default",
        activeItemId: input.activeWatchlistItemId,
        items: input.watchlistItems ?? [],
      },
      screener: input.screener ?? {
        title: "Screener",
        modeLabel: "Local watchlist movers",
        summaryLabel: "0 matches",
        filters: [],
        results: [],
        emptyLabel: "No local screener matches",
      },
      alerts: {
        title: "Alerts",
        items: input.alertItems ?? [],
      },
      objectTree: input.objectTree ?? createDefaultObjectTree(input),
      placeholders: DEFAULT_PLACEHOLDERS,
    },
    bottomPanel: {
      activeRange: input.activeRange ?? "1D",
      ranges: input.ranges ?? DEFAULT_RANGES,
      activeTab: input.activeTab ?? "time-presets",
      tabs: DEFAULT_BOTTOM_TABS.map((tab) => ({
        ...tab,
        enabled: tab.enabled || enabledBottomTabs.has(tab.id),
      })),
    },
    layout: {
      preset: layoutPreset,
      symbolMode: input.symbolMode ?? "shared",
      activeChartHostId: normalizedActiveHostId,
      slots,
    },
    chartHosts,
  };
}
