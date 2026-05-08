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
export type WorkbenchSidebarPanelId = "watchlist" | "alerts" | "object-tree" | "screener";
export type WorkbenchWorkspaceViewId = "trade" | "scan" | "alerts" | "inspect";
export type WorkbenchWorkspaceTabId = string;

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
  emptyLabel: string;
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
  emptyLabel: string;
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

export interface WorkbenchReplayPanelModel {
  available: boolean;
  active: boolean;
  playing: boolean;
  currentStep: number;
  totalSteps: number;
  currentTimeLabel: string;
  startTimeLabel: string;
  endTimeLabel: string;
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

export interface WorkbenchCommandEntryModel {
  id: string;
  label: string;
  shortcutLabel?: string;
  enabled: boolean;
  active?: boolean;
}

export interface WorkbenchCommandPaletteModel {
  title: string;
  entries: readonly WorkbenchCommandEntryModel[];
}

export interface WorkbenchWorkspaceTabModel {
  id: WorkbenchWorkspaceTabId;
  label: string;
  viewId: WorkbenchWorkspaceViewId;
  active: boolean;
  enabled: boolean;
  closeable?: boolean;
  sidebarPanel: WorkbenchSidebarPanelId;
  bottomTab: BottomPanelTabId;
  symbolLabel?: string;
  timeframeLabel?: string;
}

export interface WorkbenchLayoutTransferModel {
  importLabel: string;
  exportLabel: string;
  importEnabled: boolean;
  exportEnabled: boolean;
}

export interface WorkbenchStatusNoticeModel {
  tone: "info" | "warning" | "error" | "success";
  message: string;
}

export interface WorkbenchAdapterStatusModel {
  id: string;
  label: string;
  state: "live" | "local" | "missing" | "degraded";
  detailLabel: string;
}

export type WorkbenchHostSummarySurfaceKind =
  | "strategy-tester"
  | "account-sync"
  | "trading-ticket";

export interface WorkbenchHostSummarySurfaceModel {
  id: string;
  kind: WorkbenchHostSummarySurfaceKind;
}

export interface ChartWorkbenchModel {
  title: string;
  toolbar: WorkbenchToolbarModel;
  leftToolbar: LeftDrawingToolbarModel;
  rightSidebar: RightSidebarModel;
  bottomPanel: BottomPanelModel;
  layout: MultiChartLayoutModel;
  chartHosts: readonly ChartHostModel[];
  commandPalette: WorkbenchCommandPaletteModel;
  workspaceTabs: readonly WorkbenchWorkspaceTabModel[];
  activeRightSidebarPanel: WorkbenchSidebarPanelId;
  layoutTransfer: WorkbenchLayoutTransferModel;
  statusNotice: WorkbenchStatusNoticeModel | null;
  adapterStatus: readonly WorkbenchAdapterStatusModel[];
  hostSummarySurfaces: readonly WorkbenchHostSummarySurfaceModel[];
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
  watchlistEmptyLabel?: string;
  screener?: ScreenerPanelModel;
  alertItems?: readonly AlertSummaryModel[];
  alertsEmptyLabel?: string;
  objectTree?: ObjectTreePanelModel;
  activeRange?: string;
  ranges?: readonly string[];
  activeTab?: BottomPanelTabId;
  enabledBottomTabs?: readonly BottomPanelTabId[];
  layoutPreset?: MultiChartLayoutPreset;
  symbolMode?: WorkbenchSymbolMode;
  chartHosts?: readonly ChartHostModel[];
  commandPalette?: WorkbenchCommandPaletteModel;
  workspaceTabs?: readonly WorkbenchWorkspaceTabModel[];
  activeRightSidebarPanel?: WorkbenchSidebarPanelId;
  layoutTransfer?: WorkbenchLayoutTransferModel;
  statusNotice?: WorkbenchStatusNoticeModel | null;
  adapterStatus?: readonly WorkbenchAdapterStatusModel[];
  hostSummarySurfaces?: readonly WorkbenchHostSummarySurfaceModel[];
}

const DEFAULT_RANGES = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"] as const;
const DEFAULT_PLACEHOLDERS = ["news", "object-tree", "screener", "symbol-detail"] as const;
const DEFAULT_BOTTOM_TABS: readonly BottomPanelTabModel[] = [
  { id: "time-presets", label: "Time presets", enabled: true },
  { id: "logs", label: "Logs", enabled: false },
  { id: "replay", label: "Replay", enabled: false },
  { id: "performance-link", label: "Performance", enabled: false },
  { id: "custom", label: "Trading", enabled: false },
];
const DEFAULT_WORKSPACE_TABS: readonly Omit<WorkbenchWorkspaceTabModel, "active">[] = [
  {
    id: "trade",
    label: "Trade",
    viewId: "trade",
    enabled: true,
    sidebarPanel: "watchlist",
    bottomTab: "time-presets",
  },
  {
    id: "scan",
    label: "Scan",
    viewId: "scan",
    enabled: true,
    sidebarPanel: "screener",
    bottomTab: "time-presets",
  },
  {
    id: "alerts",
    label: "Alerts",
    viewId: "alerts",
    enabled: true,
    sidebarPanel: "alerts",
    bottomTab: "logs",
  },
  {
    id: "inspect",
    label: "Inspect",
    viewId: "inspect",
    enabled: true,
    sidebarPanel: "object-tree",
    bottomTab: "logs",
  },
] as const;

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

function defaultWorkspaceTabsForPanel(
  activeRightSidebarPanel: WorkbenchSidebarPanelId,
): WorkbenchWorkspaceTabModel[] {
  const activeTabId =
    DEFAULT_WORKSPACE_TABS.find((tab) => tab.sidebarPanel === activeRightSidebarPanel)?.id ?? "trade";
  return DEFAULT_WORKSPACE_TABS.map((tab) => ({
    ...tab,
    active: tab.id === activeTabId,
  }));
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
  const activeRightSidebarPanel = input.activeRightSidebarPanel ?? "watchlist";
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
        emptyLabel: input.watchlistEmptyLabel ?? "No watchlist symbols loaded",
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
        emptyLabel: input.alertsEmptyLabel ?? "No active alerts",
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
    commandPalette: input.commandPalette ?? {
      title: "Workbench Commands",
      entries: [],
    },
    workspaceTabs:
      input.workspaceTabs ?? defaultWorkspaceTabsForPanel(activeRightSidebarPanel),
    activeRightSidebarPanel,
    layoutTransfer: input.layoutTransfer ?? {
      importLabel: "Import layout",
      exportLabel: "Export layout",
      importEnabled: false,
      exportEnabled: false,
    },
    statusNotice: input.statusNotice ?? null,
    adapterStatus: input.adapterStatus ?? [],
    hostSummarySurfaces: input.hostSummarySurfaces ?? [],
  };
}
