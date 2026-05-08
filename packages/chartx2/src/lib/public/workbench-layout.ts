import type {
  PhaseOneChartStateSnapshot,
  PhaseOneMainChartType,
} from "./market";
import type { BottomPanelTabId, WorkbenchWorkspaceViewId } from "./workbench";
import type {
  WorkbenchScriptDefinition,
  WorkbenchScriptExpression,
  WorkbenchScriptField,
  WorkbenchScriptPlacement,
} from "./workbench-scripts";

export type WorkbenchLayoutRightSidebarPanel =
  | "watchlist"
  | "alerts"
  | "object-tree"
  | "screener";

export type WorkbenchLayoutScriptedIndicatorPlacement = "overlay" | "separate-pane";

type WorkbenchLayoutScriptedStudySnapshot = Extract<
  PhaseOneChartStateSnapshot["studies"][number],
  { type: "scripted-study" }
>;

export type WorkbenchLayoutScriptedStudyOptions =
  WorkbenchLayoutScriptedStudySnapshot["studyOptions"];

export interface WorkbenchLayoutScriptedIndicatorDescriptor {
  id: string;
  label: string;
  kind: "script";
  placement: WorkbenchLayoutScriptedIndicatorPlacement;
  studyOptions: WorkbenchLayoutScriptedStudyOptions;
}

export type WorkbenchLayoutScriptedStudyDescriptor =
  WorkbenchLayoutScriptedIndicatorDescriptor;

export interface WorkbenchLayoutWorkspaceTabState {
  id: string;
  label: string;
  viewId: WorkbenchWorkspaceViewId;
  activeSymbol: string;
  activeTimeframe: string;
  chartType: PhaseOneMainChartType;
  chartState: PhaseOneChartStateSnapshot | null;
  scriptedIndicators?: readonly WorkbenchLayoutScriptedIndicatorDescriptor[];
  panels: {
    rightSidebar: WorkbenchLayoutRightSidebarPanel;
    bottomTab: BottomPanelTabId;
  };
}

export interface WorkbenchLayoutStateV1 {
  kind: "workbench-layout";
  version: 1;
  activeSymbol: string;
  activeTimeframe: string;
  chartType: PhaseOneMainChartType;
  chartState: PhaseOneChartStateSnapshot | null;
  customScripts?: readonly WorkbenchScriptDefinition[];
  scriptedIndicators?: readonly WorkbenchLayoutScriptedIndicatorDescriptor[];
  panels: {
    rightSidebar: WorkbenchLayoutRightSidebarPanel;
    bottomTab: BottomPanelTabId;
  };
  workspace?: {
    activeTabId: string;
    tabs: readonly WorkbenchLayoutWorkspaceTabState[];
  };
}

export type WorkbenchLayoutState = WorkbenchLayoutStateV1;

export interface WorkbenchLayoutStateInput {
  activeSymbol: string;
  activeTimeframe: string;
  chartType: PhaseOneMainChartType;
  chartState: PhaseOneChartStateSnapshot | null;
  customScripts?: readonly WorkbenchScriptDefinition[];
  scriptedIndicators?: readonly WorkbenchLayoutScriptedIndicatorDescriptor[];
  rightSidebar?: WorkbenchLayoutRightSidebarPanel;
  bottomTab?: BottomPanelTabId;
  workspace?: WorkbenchLayoutStateV1["workspace"];
}

function remapChartStatePaneIndexes(
  chartState: PhaseOneChartStateSnapshot,
  removedPaneIndexes: readonly number[],
): PhaseOneChartStateSnapshot {
  if (removedPaneIndexes.length === 0) {
    return chartState;
  }
  const removedPaneSet = new Set(removedPaneIndexes);
  const remapPaneIndex = (paneIndex: number): number =>
    paneIndex - removedPaneIndexes.filter((removedIndex) => removedIndex < paneIndex).length;

  return {
    ...chartState,
    panes: chartState.panes.filter((_, paneIndex) => !removedPaneSet.has(paneIndex)),
    series: chartState.series
      .filter((series) => !removedPaneSet.has(series.paneIndex))
      .map((series) => ({
        ...series,
        paneIndex: remapPaneIndex(series.paneIndex),
      })),
    studies: chartState.studies
      .filter((study) => !removedPaneSet.has(study.paneIndex))
      .map((study) => ({
        ...study,
        paneIndex: remapPaneIndex(study.paneIndex),
      })),
    drawings: chartState.drawings
      .filter((drawing) => !removedPaneSet.has(drawing.paneIndex))
      .map((drawing) => ({
        ...drawing,
        paneIndex: remapPaneIndex(drawing.paneIndex),
      })),
  };
}

export function stripWorkbenchLayoutPaneIndexesFromChartState(
  chartState: PhaseOneChartStateSnapshot | null,
  paneIndexes: readonly number[],
): PhaseOneChartStateSnapshot | null {
  if (chartState === null) {
    return null;
  }

  const removablePaneIndexes = [...new Set(paneIndexes)]
    .filter((paneIndex) => Number.isInteger(paneIndex) && paneIndex > 0)
    .sort((left, right) => left - right);

  if (removablePaneIndexes.length === 0) {
    return chartState;
  }

  return remapChartStatePaneIndexes(chartState, removablePaneIndexes);
}

export function stripWorkbenchLayoutScriptedStudiesFromChartState(
  chartState: PhaseOneChartStateSnapshot | null,
): PhaseOneChartStateSnapshot | null {
  if (chartState === null) {
    return null;
  }

  const scriptedStudyPaneIndexes = [
    ...new Set(
      chartState.studies.flatMap((study) =>
        study.type === "scripted-study" ? [study.paneIndex] : [],
      ),
    ),
  ].sort((left, right) => left - right);

  if (scriptedStudyPaneIndexes.length === 0) {
    return chartState;
  }

  const scriptedPaneSet = new Set(scriptedStudyPaneIndexes);
  const filteredChartState = {
    ...chartState,
    studies: chartState.studies.filter((study) => study.type !== "scripted-study"),
  };

  const panesStillInUse = new Set<number>();
  for (const series of filteredChartState.series) {
    panesStillInUse.add(series.paneIndex);
  }
  for (const study of filteredChartState.studies) {
    panesStillInUse.add(study.paneIndex);
  }
  for (const drawing of filteredChartState.drawings) {
    panesStillInUse.add(drawing.paneIndex);
  }

  const removablePaneIndexes = scriptedStudyPaneIndexes.filter(
    (paneIndex) => paneIndex > 0 && !panesStillInUse.has(paneIndex) && scriptedPaneSet.has(paneIndex),
  );

  return stripWorkbenchLayoutPaneIndexesFromChartState(filteredChartState, removablePaneIndexes);
}

function sanitizeWorkbenchLayoutChartState(
  chartState: PhaseOneChartStateSnapshot | null,
  scriptedIndicators: readonly WorkbenchLayoutScriptedIndicatorDescriptor[] | undefined,
): PhaseOneChartStateSnapshot | null {
  if (scriptedIndicators === undefined || scriptedIndicators.length === 0) {
    return chartState;
  }
  const strippedChartState = stripWorkbenchLayoutScriptedStudiesFromChartState(chartState);
  if (strippedChartState === null) {
    return null;
  }
  const trailingPaneIndexes = strippedChartState.panes
    .map((_, paneIndex) => paneIndex)
    .filter((paneIndex) => paneIndex > 0)
    .slice(-scriptedIndicators.length);
  return stripWorkbenchLayoutPaneIndexesFromChartState(strippedChartState, trailingPaneIndexes);
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

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
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

function isAllowedStudyType(
  value: unknown,
): value is "overlay" | "compare" | "moving-average" | "scripted-study" {
  return (
    value === "overlay" ||
    value === "compare" ||
    value === "moving-average" ||
    value === "scripted-study"
  );
}

function isAllowedDrawingType(value: unknown): value is "horizontal-line" | "trend-line" {
  return value === "horizontal-line" || value === "trend-line";
}

function isWorkbenchLayoutScriptedIndicatorPlacement(
  value: unknown,
): value is WorkbenchLayoutScriptedIndicatorPlacement {
  return value === "overlay" || value === "separate-pane";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStudyInputContextMode(value: unknown): value is "chart-context" | "requested-context" {
  return value === "chart-context" || value === "requested-context";
}

function isStudyMergePolicy(value: unknown): value is "carry-forward" | "gaps" | "exact" {
  return value === "carry-forward" || value === "gaps" || value === "exact";
}

function isWorkbenchLayoutScriptedStudyOptions(
  value: unknown,
): value is WorkbenchLayoutScriptedStudyOptions {
  return (
    isRecord(value) &&
    isNonEmptyString(value.scriptId) &&
    isRecord(value.inputValues) &&
    Object.values(value.inputValues).every((entry) => isNumber(entry)) &&
    isStudyInputContextMode(value.inputContextMode) &&
    isNullableString(value.requestedSymbol) &&
    isNullableString(value.requestedResolution) &&
    isNullableString(value.requestedSession) &&
    isNullableString(value.requestedTimezone) &&
    isStudyMergePolicy(value.mergePolicy)
  );
}

function isWorkbenchLayoutScriptedIndicatorDescriptor(
  value: unknown,
): value is WorkbenchLayoutScriptedIndicatorDescriptor {
  if (!isRecord(value)) {
    return false;
  }
  const legacyStudyOptions =
    isNonEmptyString(value.scriptId) &&
    (value.inputValues === undefined ||
      (isRecord(value.inputValues) &&
        Object.values(value.inputValues).every((entry) => isNumber(entry))))
      ? normalizeWorkbenchLayoutScriptedStudyOptions({
          scriptId: value.scriptId,
          inputValues: value.inputValues,
        })
      : null;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.label) &&
    value.kind === "script" &&
    isWorkbenchLayoutScriptedIndicatorPlacement(value.placement) &&
    (isWorkbenchLayoutScriptedStudyOptions(value.studyOptions) || legacyStudyOptions !== null)
  );
}

function isWorkbenchLayoutScriptedIndicatorDescriptorList(
  value: unknown,
): value is readonly WorkbenchLayoutScriptedIndicatorDescriptor[] {
  return Array.isArray(value) && value.every((indicator) => isWorkbenchLayoutScriptedIndicatorDescriptor(indicator));
}

function normalizeWorkbenchLayoutScriptedIndicatorInputValues(
  value: unknown,
): Readonly<Record<string, number>> | null {
  if (!isRecord(value)) {
    return null;
  }
  const normalizedEntries = Object.entries(value).flatMap(([key, entry]) => {
    if (!isNonEmptyString(key) || !isNumber(entry)) {
      return [];
    }
    return [[key.trim(), entry] as const];
  });
  return Object.fromEntries(normalizedEntries);
}

const DEFAULT_WORKBENCH_LAYOUT_SCRIPTED_STUDY_OPTIONS: WorkbenchLayoutScriptedStudyOptions = {
  scriptId: "",
  inputValues: {},
  inputContextMode: "chart-context",
  requestedSymbol: null,
  requestedResolution: null,
  requestedSession: null,
  requestedTimezone: null,
  mergePolicy: "carry-forward",
};

function normalizeWorkbenchLayoutScriptedStudyOptions(
  value: unknown,
): WorkbenchLayoutScriptedStudyOptions | null {
  if (!isRecord(value) || !isNonEmptyString(value.scriptId)) {
    return null;
  }
  if (
    value.inputValues !== undefined &&
    normalizeWorkbenchLayoutScriptedIndicatorInputValues(value.inputValues) === null
  ) {
    return null;
  }
  if (
    value.inputContextMode !== undefined &&
    !isStudyInputContextMode(value.inputContextMode)
  ) {
    return null;
  }
  if (
    value.requestedSymbol !== undefined &&
    !isNullableString(value.requestedSymbol)
  ) {
    return null;
  }
  if (
    value.requestedResolution !== undefined &&
    !isNullableString(value.requestedResolution)
  ) {
    return null;
  }
  if (
    value.requestedSession !== undefined &&
    !isNullableString(value.requestedSession)
  ) {
    return null;
  }
  if (
    value.requestedTimezone !== undefined &&
    !isNullableString(value.requestedTimezone)
  ) {
    return null;
  }
  if (value.mergePolicy !== undefined && !isStudyMergePolicy(value.mergePolicy)) {
    return null;
  }
  return {
    scriptId: value.scriptId.trim(),
    inputValues:
      normalizeWorkbenchLayoutScriptedIndicatorInputValues(value.inputValues) ??
      { ...DEFAULT_WORKBENCH_LAYOUT_SCRIPTED_STUDY_OPTIONS.inputValues },
    inputContextMode:
      value.inputContextMode ?? DEFAULT_WORKBENCH_LAYOUT_SCRIPTED_STUDY_OPTIONS.inputContextMode,
    requestedSymbol:
      value.requestedSymbol ?? DEFAULT_WORKBENCH_LAYOUT_SCRIPTED_STUDY_OPTIONS.requestedSymbol,
    requestedResolution:
      value.requestedResolution ??
      DEFAULT_WORKBENCH_LAYOUT_SCRIPTED_STUDY_OPTIONS.requestedResolution,
    requestedSession:
      value.requestedSession ?? DEFAULT_WORKBENCH_LAYOUT_SCRIPTED_STUDY_OPTIONS.requestedSession,
    requestedTimezone:
      value.requestedTimezone ?? DEFAULT_WORKBENCH_LAYOUT_SCRIPTED_STUDY_OPTIONS.requestedTimezone,
    mergePolicy:
      value.mergePolicy ?? DEFAULT_WORKBENCH_LAYOUT_SCRIPTED_STUDY_OPTIONS.mergePolicy,
  };
}

function resolveWorkbenchLayoutScriptedStudyOptionsSource(
  value: Record<string, unknown>,
): unknown {
  if (value.studyOptions !== undefined) {
    return value.studyOptions;
  }
  return {
    scriptId: value.scriptId,
    inputValues: value.inputValues,
  };
}

export function normalizeWorkbenchLayoutScriptedIndicatorDescriptor(
  value: unknown,
): WorkbenchLayoutScriptedIndicatorDescriptor | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.label) ||
    value.kind !== "script" ||
    !isWorkbenchLayoutScriptedIndicatorPlacement(value.placement)
  ) {
    return null;
  }
  const studyOptions = normalizeWorkbenchLayoutScriptedStudyOptions(
    resolveWorkbenchLayoutScriptedStudyOptionsSource(value),
  );
  if (studyOptions === null) {
    return null;
  }
  return {
    id: value.id.trim(),
    label: value.label.trim(),
    kind: "script",
    placement: value.placement,
    studyOptions,
  };
}

export function createWorkbenchLayoutScriptedIndicatorDescriptor(input: {
  id: string;
  label: string;
  placement: WorkbenchLayoutScriptedIndicatorPlacement;
  scriptId: string;
  inputValues?: Record<string, number>;
}): WorkbenchLayoutScriptedIndicatorDescriptor | null {
  return normalizeWorkbenchLayoutScriptedIndicatorDescriptor({
    id: input.id,
    label: input.label,
    kind: "script",
    placement: input.placement,
    studyOptions: {
      scriptId: input.scriptId,
      inputValues: input.inputValues,
    },
  });
}

export function normalizeWorkbenchLayoutScriptedIndicatorDescriptors(
  input: readonly WorkbenchLayoutScriptedIndicatorDescriptor[] | undefined,
): readonly WorkbenchLayoutScriptedIndicatorDescriptor[] | undefined {
  if (input === undefined) {
    return undefined;
  }
  const normalized = input.flatMap((descriptor) => {
    const next = normalizeWorkbenchLayoutScriptedIndicatorDescriptor(descriptor);
    return next === null ? [] : [next];
  });
  return normalized.length > 0 ? normalized : undefined;
}

function isWorkbenchScriptField(value: unknown): value is WorkbenchScriptField {
  return (
    value === "open" ||
    value === "high" ||
    value === "low" ||
    value === "close" ||
    value === "hl2" ||
    value === "hlc3"
  );
}

function isWorkbenchScriptPlacement(value: unknown): value is WorkbenchScriptPlacement {
  return value === "overlay" || value === "separate-pane";
}

function isWorkbenchScriptNumericValue(value: unknown): boolean {
  return isNumber(value) || (isRecord(value) && value.kind === "numeric-input" && isNonEmptyString(value.inputId));
}

function isWorkbenchScriptExpressionNode(value: unknown): value is WorkbenchScriptExpression {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return false;
  }
  if (value.kind === "input") {
    return isWorkbenchScriptField(value.field);
  }
  if (value.kind === "sma") {
    return isWorkbenchScriptExpressionNode(value.input) && isWorkbenchScriptNumericValue(value.length);
  }
  if (value.kind === "subtract") {
    return isWorkbenchScriptExpressionNode(value.left) && isWorkbenchScriptExpressionNode(value.right);
  }
  return false;
}

function isWorkbenchScriptDefinitionValue(value: unknown): value is WorkbenchScriptDefinition {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    value.version === 1 &&
    (value.source === undefined || value.source === "builtin" || value.source === "custom") &&
    isNonEmptyString(value.label) &&
    isNonEmptyString(value.description) &&
    isNonEmptyString(value.shortLabel) &&
    isWorkbenchScriptPlacement(value.placement) &&
    (value.inputs === undefined ||
      (Array.isArray(value.inputs) &&
        value.inputs.every(
          (input) =>
            isRecord(input) &&
            isNonEmptyString(input.id) &&
            isNonEmptyString(input.label) &&
            isNumber(input.min) &&
            isNumber(input.max) &&
            isNumber(input.step) &&
            isNumber(input.defaultValue),
        ))) &&
    isWorkbenchScriptExpressionNode(value.expression)
  );
}

function isWorkbenchScriptDefinitionList(value: unknown): value is readonly WorkbenchScriptDefinition[] {
  return Array.isArray(value) && value.every((definition) => isWorkbenchScriptDefinitionValue(definition));
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
  if (value.type === "scripted-study") {
    return isWorkbenchLayoutScriptedStudyOptions(value.studyOptions);
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

function isWorkbenchWorkspaceViewId(value: unknown): value is WorkbenchWorkspaceViewId {
  return value === "trade" || value === "scan" || value === "alerts" || value === "inspect";
}

function isWorkbenchLayoutWorkspaceState(value: unknown): value is NonNullable<WorkbenchLayoutStateV1["workspace"]> {
  if (!isRecord(value) || typeof value.activeTabId !== "string" || !Array.isArray(value.tabs)) {
    return false;
  }
  if (
    value.tabs.some((tab) => {
      if (
        !isRecord(tab) ||
        typeof tab.id !== "string" ||
        typeof tab.label !== "string" ||
        !isWorkbenchWorkspaceViewId(tab.viewId) ||
        typeof tab.activeSymbol !== "string" ||
        tab.activeSymbol.trim().length === 0 ||
        typeof tab.activeTimeframe !== "string" ||
        tab.activeTimeframe.trim().length === 0 ||
        typeof tab.chartType !== "string" ||
        !PHASE_ONE_MAIN_CHART_TYPES.includes(tab.chartType as PhaseOneMainChartType) ||
        !(tab.chartState === null || isPhaseOneChartStateSnapshot(tab.chartState)) ||
        !(tab.scriptedIndicators === undefined ||
          isWorkbenchLayoutScriptedIndicatorDescriptorList(tab.scriptedIndicators)) ||
        !isRecord(tab.panels) ||
        !isWorkbenchLayoutRightSidebarPanel(tab.panels.rightSidebar) ||
        !isBottomPanelTabId(tab.panels.bottomTab)
      ) {
        return true;
      }
      return false;
    })
  ) {
    return false;
  }
  return value.tabs.some((tab) => isRecord(tab) && tab.id === value.activeTabId);
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
  const scriptedIndicators = normalizeWorkbenchLayoutScriptedIndicatorDescriptors(input.scriptedIndicators);
  return {
    kind: "workbench-layout",
    version: 1,
    activeSymbol: input.activeSymbol,
    activeTimeframe: input.activeTimeframe,
    chartType: input.chartType,
    chartState: sanitizeWorkbenchLayoutChartState(input.chartState, scriptedIndicators),
    customScripts: input.customScripts,
    scriptedIndicators,
    panels: {
      rightSidebar: input.rightSidebar ?? "watchlist",
      bottomTab: input.bottomTab ?? "time-presets",
    },
    workspace: input.workspace === undefined
      ? undefined
      : {
          activeTabId: input.workspace.activeTabId,
          tabs: input.workspace.tabs.map((tab) => ({
            ...tab,
            chartState: sanitizeWorkbenchLayoutChartState(
              tab.chartState,
              normalizeWorkbenchLayoutScriptedIndicatorDescriptors(tab.scriptedIndicators),
            ),
            scriptedIndicators: normalizeWorkbenchLayoutScriptedIndicatorDescriptors(tab.scriptedIndicators),
          })),
        },
  };
}

export function isWorkbenchLayoutState(value: unknown): value is WorkbenchLayoutState {
  return normalizeWorkbenchLayoutState(value) !== null;
}

export function normalizeWorkbenchLayoutState(value: unknown): WorkbenchLayoutState | null {
  if (!isRecord(value)) {
    return null;
  }
  if (value.kind !== "workbench-layout" || value.version !== 1) {
    return null;
  }
  if (typeof value.activeSymbol !== "string" || value.activeSymbol.trim().length === 0) {
    return null;
  }
  if (typeof value.activeTimeframe !== "string" || value.activeTimeframe.trim().length === 0) {
    return null;
  }
  if (
    typeof value.chartType !== "string" ||
    !PHASE_ONE_MAIN_CHART_TYPES.includes(value.chartType as PhaseOneMainChartType)
  ) {
    return null;
  }
  if (!(value.chartState === null || isPhaseOneChartStateSnapshot(value.chartState))) {
    return null;
  }
  if (!(value.customScripts === undefined || isWorkbenchScriptDefinitionList(value.customScripts))) {
    return null;
  }
  if (
    !(value.scriptedIndicators === undefined ||
      isWorkbenchLayoutScriptedIndicatorDescriptorList(value.scriptedIndicators))
  ) {
    return null;
  }
  if (!isRecord(value.panels)) {
    return null;
  }
  if (
    !isWorkbenchLayoutRightSidebarPanel(value.panels.rightSidebar) ||
    !isBottomPanelTabId(value.panels.bottomTab)
  ) {
    return null;
  }
  if (!(value.workspace === undefined || isWorkbenchLayoutWorkspaceState(value.workspace))) {
    return null;
  }
  return createWorkbenchLayoutState({
    activeSymbol: value.activeSymbol,
    activeTimeframe: value.activeTimeframe,
    chartType: value.chartType as PhaseOneMainChartType,
    chartState: value.chartState,
    customScripts: value.customScripts,
    scriptedIndicators: value.scriptedIndicators,
    rightSidebar: value.panels.rightSidebar,
    bottomTab: value.panels.bottomTab,
    workspace:
      value.workspace === undefined
        ? undefined
        : {
            activeTabId: value.workspace.activeTabId,
            tabs: value.workspace.tabs.map((tab) => ({
              id: tab.id,
              label: tab.label,
              viewId: tab.viewId,
              activeSymbol: tab.activeSymbol,
              activeTimeframe: tab.activeTimeframe,
              chartType: tab.chartType,
              chartState: tab.chartState,
              scriptedIndicators: tab.scriptedIndicators,
              panels: {
                rightSidebar: tab.panels.rightSidebar,
                bottomTab: tab.panels.bottomTab,
              },
            })),
          },
  });
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
          return normalizeWorkbenchLayoutState(parsed);
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
