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
  saveWorkbenchLayout(state: WorkbenchLayoutState): Promise<boolean>;
  clearWorkbenchLayout(): Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}

function isNumberRangeRecord(
  value: unknown,
): value is {
  from: number;
  to: number;
} {
  return isRecord(value) && isNumber(value.from) && isNumber(value.to);
}

function isVisibleRangeRecord(
  value: unknown,
): value is {
  minValue: number;
  maxValue: number;
} {
  return isRecord(value) && isNumber(value.minValue) && isNumber(value.maxValue);
}

function isAllowedSeriesKind(value: unknown): value is "candlestick" | "bar" | "line" | "area" | "baseline" | "histogram" | "volume" {
  return (
    value === "candlestick" ||
    value === "bar" ||
    value === "line" ||
    value === "area" ||
    value === "baseline" ||
    value === "histogram" ||
    value === "volume"
  );
}

function isAllowedStudyType(value: unknown): value is "overlay" | "compare" | "moving-average" {
  return value === "overlay" || value === "compare" || value === "moving-average";
}

function isAllowedDrawingType(value: unknown): value is "horizontal-line" | "trend-line" {
  return value === "horizontal-line" || value === "trend-line";
}

function isOhlcDataRow(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNumber(value.time) &&
    isNumber(value.open) &&
    isNumber(value.high) &&
    isNumber(value.low) &&
    isNumber(value.close)
  );
}

function isLineDataRow(value: unknown): boolean {
  return isRecord(value) && isNumber(value.time) && isNumber(value.value);
}

function isSeriesDataRows(
  kind: PhaseOneChartStateSnapshot["series"][number]["kind"],
  value: unknown,
): boolean {
  if (!Array.isArray(value)) {
    return false;
  }
  if (kind === "candlestick" || kind === "bar") {
    return value.every((row) => isOhlcDataRow(row));
  }
  return value.every((row) => isLineDataRow(row));
}

function isPhaseOneMainSeriesStateSnapshot(
  value: unknown,
): value is Exclude<PhaseOneChartStateSnapshot["mainSeries"], null> {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.chartType === "string" &&
    PHASE_ONE_MAIN_CHART_TYPES.includes(value.chartType as PhaseOneMainChartType) &&
    typeof value.inputCapability === "string" &&
    typeof value.builder === "string" &&
    typeof value.renderer === "string" &&
    typeof value.styleSchemaId === "string" &&
    typeof value.styleOptionSurface === "string" &&
    isRecord(value.styleOptions) &&
    isRecord(value.lineBreakOptions) &&
    isRecord(value.renkoOptions) &&
    isRecord(value.pointFigureOptions) &&
    isRecord(value.kagiOptions)
  );
}

function isPhaseOneSeriesSnapshot(value: unknown): value is PhaseOneChartStateSnapshot["series"][number] {
  if (!isRecord(value) || !isAllowedSeriesKind(value.kind) || !isNumber(value.paneIndex)) {
    return false;
  }
  return isRecord(value.options) && isSeriesDataRows(value.kind, value.data);
}

function isPhaseOneStudySnapshot(value: unknown): value is PhaseOneChartStateSnapshot["studies"][number] {
  if (!isRecord(value) || !isAllowedStudyType(value.type) || !isNumber(value.paneIndex)) {
    return false;
  }
  if (!isRecord(value.seriesOptions)) {
    return false;
  }
  if (value.type === "overlay") {
    return Array.isArray(value.data) && value.data.every((row) => isLineDataRow(row));
  }
  if (value.type === "compare") {
    return (
      isRecord(value.compareOptions) &&
      Array.isArray(value.data) &&
      value.data.every((row) => isLineDataRow(row))
    );
  }
  return isRecord(value.studyOptions);
}

function isPhaseOneDrawingSnapshot(
  value: unknown,
): value is PhaseOneChartStateSnapshot["drawings"][number] {
  return (
    isRecord(value) &&
    isAllowedDrawingType(value.type) &&
    isNumber(value.paneIndex) &&
    isRecord(value.options)
  );
}

function isPhaseOneTradeLocationSnapshot(
  value: unknown,
): value is NonNullable<PhaseOneChartStateSnapshot["tradeLocation"]> {
  return isRecord(value) && isRecord(value.request) && isRecord(value.overlay);
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
  if (!isRecord(value)) {
    return false;
  }
  const options = value.options;
  const timeScale = value.timeScale;
  const priceScale = value.priceScale;
  const panes = value.panes;
  const series = value.series;
  const studies = value.studies;
  const drawings = value.drawings;
  const mainSeries = value.mainSeries;
  const tradeLocation = value.tradeLocation;
  if (
    !isRecord(options) ||
    !isRecord(timeScale) ||
    !isRecord(priceScale) ||
    !Array.isArray(panes) ||
    !Array.isArray(series) ||
    !Array.isArray(studies) ||
    !Array.isArray(drawings)
  ) {
    return false;
  }
  if (
    !isNullableNumber(timeScale.barSpacing) ||
    !isNumber(timeScale.rightOffset) ||
    !(timeScale.visibleLogicalRange === null || isNumberRangeRecord(timeScale.visibleLogicalRange))
  ) {
    return false;
  }
  if (
    !(priceScale.visibleRange === null || isVisibleRangeRecord(priceScale.visibleRange)) ||
    !isBoolean(priceScale.scaleSeriesOnly)
  ) {
    return false;
  }
  if (
    panes.some(
      (pane) => !isRecord(pane) || !isNullableNumber(pane.height) || !isBoolean(pane.resizable),
    )
  ) {
    return false;
  }
  if (!(mainSeries === null || isPhaseOneMainSeriesStateSnapshot(mainSeries))) {
    return false;
  }
  if (!series.every((item) => isPhaseOneSeriesSnapshot(item))) {
    return false;
  }
  if (!studies.every((item) => isPhaseOneStudySnapshot(item))) {
    return false;
  }
  if (!drawings.every((item) => isPhaseOneDrawingSnapshot(item))) {
    return false;
  }
  if (!(tradeLocation === null || isPhaseOneTradeLocationSnapshot(tradeLocation))) {
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
        return true;
      } catch {
        return false;
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
