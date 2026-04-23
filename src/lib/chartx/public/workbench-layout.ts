import type { PhaseOneChartStateSnapshot, PhaseOneMainChartType } from "./market";
import type { BottomPanelTabId } from "./workbench";

export type WorkbenchLayoutRightSidebarPanel =
  | "watchlist"
  | "alerts"
  | "object-tree"
  | "screener";

export interface WorkbenchLayoutStateV1 {
  kind: "workbench-layout";
  version: 1;
  activeSymbol: string;
  activeTimeframe: string;
  chartType: PhaseOneMainChartType;
  chartState: PhaseOneChartStateSnapshot | null;
  panels: {
    rightSidebar: WorkbenchLayoutRightSidebarPanel;
    bottomTab: BottomPanelTabId;
  };
}

export type WorkbenchLayoutState = WorkbenchLayoutStateV1;

export interface WorkbenchLayoutStateInput {
  activeSymbol: string;
  activeTimeframe: string;
  chartType: PhaseOneMainChartType;
  chartState: PhaseOneChartStateSnapshot | null;
  rightSidebar?: WorkbenchLayoutRightSidebarPanel;
  bottomTab?: BottomPanelTabId;
}

export interface WorkbenchLayoutPersistenceProvider {
  loadWorkbenchLayout(): Promise<WorkbenchLayoutState | null>;
  saveWorkbenchLayout(state: WorkbenchLayoutState): Promise<void>;
  clearWorkbenchLayout(): Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const PHASE_ONE_MAIN_CHART_TYPES: readonly PhaseOneMainChartType[] = [
  "candlestick",
  "line-break",
  "kagi",
  "point-figure",
  "columns",
  "volume-candles",
  "hollow-candles",
  "heikin-ashi",
  "renko",
  "bar",
  "hlc-bars",
  "high-low",
  "hlc-area",
  "line",
  "line-markers",
  "stepline",
  "area",
  "baseline",
  "histogram",
];

function isWorkbenchLayoutRightSidebarPanel(
  value: unknown,
): value is WorkbenchLayoutRightSidebarPanel {
  return (
    value === "watchlist" ||
    value === "alerts" ||
    value === "object-tree" ||
    value === "screener"
  );
}

function isBottomPanelTabId(value: unknown): value is BottomPanelTabId {
  return (
    value === "time-presets" ||
    value === "logs" ||
    value === "replay" ||
    value === "performance-link" ||
    value === "custom"
  );
}

function isPhaseOneChartStateSnapshot(value: unknown): value is PhaseOneChartStateSnapshot {
  if (!isRecord(value) || Array.isArray(value)) {
    return false;
  }
  if (
    !isRecord(value.options) ||
    !isRecord(value.timeScale) ||
    !isRecord(value.priceScale) ||
    !Array.isArray(value.panes) ||
    !Array.isArray(value.series) ||
    !Array.isArray(value.studies) ||
    !Array.isArray(value.drawings)
  ) {
    return false;
  }
  if (!(value.mainSeries === null || (isRecord(value.mainSeries) && !Array.isArray(value.mainSeries)))) {
    return false;
  }
  if (!(value.tradeLocation === null || (isRecord(value.tradeLocation) && !Array.isArray(value.tradeLocation)))) {
    return false;
  }
  return true;
}

export function createWorkbenchLayoutState(
  input: WorkbenchLayoutStateInput,
): WorkbenchLayoutStateV1 {
  return {
    kind: "workbench-layout",
    version: 1,
    activeSymbol: input.activeSymbol,
    activeTimeframe: input.activeTimeframe,
    chartType: input.chartType,
    chartState: input.chartState,
    panels: {
      rightSidebar: input.rightSidebar ?? "watchlist",
      bottomTab: input.bottomTab ?? "time-presets",
    },
  };
}

export function isWorkbenchLayoutState(value: unknown): value is WorkbenchLayoutState {
  if (!isRecord(value)) {
    return false;
  }
  if (value.kind !== "workbench-layout" || value.version !== 1) {
    return false;
  }
  if (typeof value.activeSymbol !== "string" || value.activeSymbol.trim().length === 0) {
    return false;
  }
  if (typeof value.activeTimeframe !== "string" || value.activeTimeframe.trim().length === 0) {
    return false;
  }
  if (
    typeof value.chartType !== "string" ||
    !PHASE_ONE_MAIN_CHART_TYPES.includes(value.chartType as PhaseOneMainChartType)
  ) {
    return false;
  }
  if (!(value.chartState === null || isPhaseOneChartStateSnapshot(value.chartState))) {
    return false;
  }
  if (!isRecord(value.panels)) {
    return false;
  }
  if (
    !isWorkbenchLayoutRightSidebarPanel(value.panels.rightSidebar) ||
    !isBottomPanelTabId(value.panels.bottomTab)
  ) {
    return false;
  }
  return true;
}

export function createLocalStorageWorkbenchLayoutProvider(
  storage: Storage,
  key = "chartx2:workbench-layout:v1",
): WorkbenchLayoutPersistenceProvider {
  return {
    async loadWorkbenchLayout() {
      try {
        const raw = storage.getItem(key);
        if (raw === null) {
          return null;
        }
        try {
          const parsed: unknown = JSON.parse(raw);
          return isWorkbenchLayoutState(parsed) ? parsed : null;
        } catch {
          return null;
        }
      } catch {
        return null;
      }
    },
    async saveWorkbenchLayout(state) {
      try {
        storage.setItem(key, JSON.stringify(state));
      } catch {
        // Ignore storage quota and access failures in the local UI provider.
      }
    },
    async clearWorkbenchLayout() {
      try {
        storage.removeItem(key);
      } catch {
        // Ignore storage access failures in the local UI provider.
      }
    },
  };
}
