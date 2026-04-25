<script lang="ts">
  import type {
    PhaseOneDrawingPropertyField,
    PhaseOneDrawingPropertyFieldSchema,
    PhaseOneReadoutDetail,
  } from "$lib/chartx/public/market";
  import type {
    ChartWorkbenchModel,
    WorkbenchCommandPaletteModel,
    WorkbenchWorkspaceTabId,
  } from "$lib/chartx/public/workbench";
  import {
    formatWorkbenchCustomScriptExpressionText,
    parseWorkbenchCustomScriptExpressionText,
    validateWorkbenchCustomScriptDraft,
    type WorkbenchScriptExpression,
    type WorkbenchScriptField,
  } from "$lib/chartx/public/workbench-scripts";
  import type {
    DemoAction,
    DemoCustomScriptLibraryEntry,
    DemoSnapshot,
    WorkbenchDrawingTool,
  } from "$lib/demo/chartx-demo";
  import ScriptExpressionBuilder from "$lib/demo/components/ScriptExpressionBuilder.svelte";
  import ScriptLengthInput from "$lib/demo/components/ScriptLengthInput.svelte";

  export let chartTypeActions: readonly DemoAction[] = [];
  export let lineBreakActions: readonly DemoAction[] = [];
  export let renkoActions: readonly DemoAction[] = [];
  export let chartActions: readonly DemoAction[] = [];
  export let drawingTools: Array<{
    id: WorkbenchDrawingTool;
    label: string;
    icon: string;
    enabled: boolean;
  }> = [];
  export let activeDrawingTool: WorkbenchDrawingTool = "none";
  export let readout: PhaseOneReadoutDetail;
  export let snapshot: DemoSnapshot;
  export let workbench: ChartWorkbenchModel | null = null;
  export let commandPalette: WorkbenchCommandPaletteModel | null = null;
  export let commandPaletteOpen = false;
  export let canvasElement: HTMLCanvasElement | undefined = undefined;
  export let error = "";
  export let inspectorErrors: Partial<Record<PhaseOneDrawingPropertyField, string>> = {};
  export let showHorizontalPreview = false;
  export let showTrendPreview = false;
  export let horizontalPreviewY: number | null = null;
  export let trendPreviewX1: number | null = null;
  export let trendPreviewY1: number | null = null;
  export let trendPreviewX2: number | null = null;
  export let trendPreviewY2: number | null = null;
  export let onRunAction: (actionId: string) => void;
  export let onSetDrawingTool: (tool: WorkbenchDrawingTool) => void;
  export let onSetWorkspaceTab: (tabId: WorkbenchWorkspaceTabId) => void | Promise<void>;
  export let onCreateWorkspaceTab: () => void | Promise<void>;
  export let onCloseWorkspaceTab: (tabId: WorkbenchWorkspaceTabId) => void | Promise<void>;
  export let onToggleCommandPalette: () => void;
  export let onCloseCommandPalette: () => void;
  export let onExecuteCommand: (commandId: string) => void | Promise<void>;
  export let onOpenWatchlistSymbol: (symbol: string) => void;
  export let onOpenScreenerSymbol: (symbol: string) => void;
  export let onAddIndicator: (entryId: string, inputValues?: Record<string, number>) => void | Promise<void>;
  export let onAddCustomScriptToChart: (scriptId: string, inputValues?: Record<string, number>) => void | Promise<void>;
  export let onRemoveActiveScriptIndicator: (paneIndex: number) => void;
  export let onSaveCatalogScriptAsCustom: (entryId: string) => void;
  export let onSaveCustomScript: (scriptId: string | null, draft: {
    label: string;
    shortLabel: string;
    description: string;
    expressionText: string;
    placement: "overlay" | "separate-pane";
    defaultLength: number;
  }) => boolean;
  export let onDeleteCustomScript: (scriptId: string) => boolean;
  export let onDuplicateCustomScript: (scriptId: string) => void;
  export let onCreatePriceAlert: () => void | Promise<void>;
  export let onSaveLayout: () => void;
  export let onRestoreLayout: () => void;
  export let onResetLayout: () => void;
  export let onImportLayout: () => void;
  export let onExportLayout: () => void;
  export let onEnterReplay: () => void;
  export let onPlayReplay: () => void;
  export let onPauseReplay: () => void;
  export let onStepReplay: () => void;
  export let onExitReplay: () => void;
  export let onPointerMove: (event: PointerEvent) => void;
  export let onPointerLeave: () => void;
  export let onSetPointFigureAutoScale: (value: number) => void;
  export let onSetPointFigureMode: (value: "auto" | "fixed" | "atr" | "percentage" | "traditional") => void;
  export let onSetPointFigureAtrLength: (value: number) => void;
  export let onSetPointFigurePercentageValue: (value: number) => void;
  export let onSetKagiMode: (value: "auto" | "fixed" | "atr" | "percentage") => void;
  export let onSetKagiFixedReversalSize: (value: number) => void;
  export let onSetKagiAutoScale: (value: number) => void;
  export let onSetKagiAtrLength: (value: number) => void;
  export let onSetKagiPercentageValue: (value: number) => void;
  export let selectedDrawingFieldValue: (field: PhaseOneDrawingPropertyField) => string | number | boolean;
  export let updateSelectedDrawingField: (
    field: PhaseOneDrawingPropertyField,
    control: PhaseOneDrawingPropertyFieldSchema["control"],
    event: Event,
  ) => void;
  export let formatPointFigureBoxSize: (value: number | null) => string;
  let objectTreeNodes = workbench?.rightSidebar.objectTree.nodes ?? [];
  type SlotGridPosition = { col: number; row: number };
  type SlotView = {
    slotId: string;
    title: string;
    role: "primary" | "secondary";
    hostId: string | null;
    hostTitle: string;
    hostActive: boolean;
    hostSymbol: string;
    hostTimeframe: string;
    hostChartType: string;
    hostStatus: string;
    grid: SlotGridPosition;
  };
  let layoutPreset: string = "single";
  let slotViews: SlotView[] = [];
  let activeSlotView: SlotView | null = null;
  let activeGrid: SlotGridPosition = { col: 1, row: 1 };
  let replayState = snapshot.replay;
  let activeSidebarPanel = workbench?.activeRightSidebarPanel ?? "watchlist";
  let scriptedIndicatorDrafts: Record<string, Record<string, string>> = {};
  let customScriptLaunchDrafts: Record<string, string> = {};
  let editingCustomScriptId: string | null = null;
  let customScriptExpression: WorkbenchScriptExpression = {
    kind: "sma",
    input: {
      kind: "input",
      field: "close",
    },
    length: {
      kind: "numeric-input",
      inputId: "length",
    },
  };
  let customScriptDraft = {
    label: "",
    shortLabel: "",
    description: "",
    expressionText: "sma(close, length)",
    placement: "separate-pane" as "overlay" | "separate-pane",
    defaultLength: 20,
  };
  let customScriptDefaultLengthInput = "20";
  let customScriptDraftError: string | null = null;
  let customScriptImportExpressionInput = "";
  let customScriptImportError: string | null = null;
  let customScriptFilter = "";
  let customScriptSortMode: "newest" | "label" | "in-use" = "newest";
  let customScriptDraftPreviewLabel = "sma(close, length) · length 20 · separate-pane";
  let customScriptDefaultLengthErrorMessage: string | null = null;
  let customScriptLaunchErrors: Record<string, string | null> = {};
  let customScriptLaunchPayloads: Record<string, Record<string, number> | null> = {};
  let filteredCustomScripts: readonly DemoCustomScriptLibraryEntry[] = [];
  let pendingCustomScriptDeleteId: string | null = null;
  let pendingCustomScriptLoadId: string | null = null;
  let customScriptDraftBaseline = JSON.stringify({
    editingCustomScriptId,
    draft: customScriptDraft,
    defaultLength: customScriptDefaultLengthInput,
    expression: formatWorkbenchCustomScriptExpressionText(customScriptExpression),
  });

  function gridPositionForSlot(preset: string, index: number): SlotGridPosition {
    if (preset === "grid-2x2") {
      return { col: (index % 2) + 1, row: Math.floor(index / 2) + 1 };
    }
    return { col: index + 1, row: 1 };
  }

  function actionClass(tone: DemoAction["tone"]): string {
    if (tone === "accent") {
      return "action-btn accent";
    }
    if (tone === "danger") {
      return "action-btn danger";
    }
    return "action-btn";
  }

  function resetCustomScriptDraft(): void {
    pendingCustomScriptDeleteId = null;
    pendingCustomScriptLoadId = null;
    editingCustomScriptId = null;
    customScriptDraftError = null;
    customScriptImportError = null;
    customScriptImportExpressionInput = "";
    customScriptExpression = {
      kind: "sma",
      input: {
        kind: "input",
        field: "close",
      },
      length: {
        kind: "numeric-input",
        inputId: "length",
      },
    };
    customScriptDraft = {
      label: "",
      shortLabel: "",
      description: "",
      expressionText: "sma(close, length)",
      placement: "separate-pane",
      defaultLength: 20,
    };
    customScriptDefaultLengthInput = "20";
    customScriptDraftBaseline = serializeCustomScriptDraftState();
  }

  function requestCustomScriptDelete(scriptId: string): void {
    pendingCustomScriptLoadId = null;
    pendingCustomScriptDeleteId = scriptId;
  }

  function cancelCustomScriptDelete(scriptId: string): void {
    if (pendingCustomScriptDeleteId === scriptId) {
      pendingCustomScriptDeleteId = null;
    }
  }

  function layoutPersistenceMissing(): boolean {
    return (
      workbench?.adapterStatus.find((adapter) => adapter.id === "layout-persistence")?.state ===
      "missing"
    );
  }

  function ensureScriptDraft(entryId: string, inputId: string, defaultValue: number): void {
    scriptedIndicatorDrafts = {
      ...scriptedIndicatorDrafts,
      [entryId]: {
        ...(scriptedIndicatorDrafts[entryId] ?? {}),
        [inputId]: scriptedIndicatorDrafts[entryId]?.[inputId] ?? String(defaultValue),
      },
    };
  }

  function scriptDraftValue(entryId: string, inputId: string, defaultValue: number): string {
    ensureScriptDraft(entryId, inputId, defaultValue);
    return scriptedIndicatorDrafts[entryId]?.[inputId] ?? String(defaultValue);
  }

  function updateScriptDraft(entryId: string, inputId: string, value: string): void {
    scriptedIndicatorDrafts = {
      ...scriptedIndicatorDrafts,
      [entryId]: {
        ...(scriptedIndicatorDrafts[entryId] ?? {}),
        [inputId]: value,
      },
    };
  }

  function scriptInputPayload(entry: NonNullable<DemoSnapshot["indicatorCatalog"]>[number]): Record<string, number> | undefined {
    if (entry.engineKind !== "script" || (entry.scriptInputs?.length ?? 0) === 0) {
      return undefined;
    }
    const payload: Record<string, number> = {};
    for (const input of entry.scriptInputs ?? []) {
      payload[input.id] = Number(scriptedIndicatorDrafts[entry.id]?.[input.id] ?? input.defaultValue);
    }
    return payload;
  }

  function formatIndicatorInputValues(inputValues: Record<string, number> | undefined): string | null {
    if (inputValues === undefined) {
      return null;
    }
    const entries = Object.entries(inputValues);
    if (entries.length === 0) {
      return null;
    }
    return entries.map(([key, value]) => `${key} ${String(value)}`).join(" · ");
  }

  function scriptExecutionOwnerLabel(): string {
    return snapshot.scriptExecution?.owner === "host-adapter" ? "host adapter" : "local runtime";
  }

  function matchesCustomScriptFilter(script: DemoCustomScriptLibraryEntry, filter: string): boolean {
    const needle = filter.trim().toLowerCase();
    if (needle.length === 0) {
      return true;
    }
    return (
      script.label.toLowerCase().includes(needle) ||
      script.shortLabel.toLowerCase().includes(needle) ||
      script.description.toLowerCase().includes(needle) ||
      script.expressionText.toLowerCase().includes(needle)
    );
  }

  function customScriptSequenceValue(scriptId: string): number {
    const suffix = Number(scriptId.replace("custom-script-", ""));
    return Number.isFinite(suffix) ? suffix : 0;
  }

  function compareCustomScripts(
    left: DemoCustomScriptLibraryEntry,
    right: DemoCustomScriptLibraryEntry,
    mode: "newest" | "label" | "in-use",
  ): number {
    if (mode === "label") {
      return left.label.localeCompare(right.label);
    }
    if (mode === "in-use") {
      if (Boolean(left.inUse) !== Boolean(right.inUse)) {
        return left.inUse ? -1 : 1;
      }
    }
    return customScriptSequenceValue(right.id) - customScriptSequenceValue(left.id);
  }

  function serializeCustomScriptDraftState(): string {
    return JSON.stringify({
      editingCustomScriptId,
      draft: customScriptDraft,
      defaultLength: customScriptDefaultLengthInput,
      expression: formatWorkbenchCustomScriptExpressionText(customScriptExpression),
    });
  }

  function customScriptDraftIsDirty(): boolean {
    return serializeCustomScriptDraftState() !== customScriptDraftBaseline;
  }

  function customScriptById(scriptId: string): DemoCustomScriptLibraryEntry | null {
    return snapshot.customScripts?.find((entry) => entry.id === scriptId) ?? null;
  }

  function loadCustomScriptDraft(entry: DemoCustomScriptLibraryEntry): void {
    pendingCustomScriptDeleteId = null;
    pendingCustomScriptLoadId = null;
    editingCustomScriptId = entry.id;
    customScriptDraftError = null;
    customScriptImportError = null;
    customScriptImportExpressionInput = entry.expressionText;
    const parsed = parseWorkbenchCustomScriptExpressionText(entry.expressionText);
    customScriptExpression =
      parsed.ok
        ? parsed.expression
        : {
            kind: "sma",
            input: {
              kind: "input",
              field: "close",
            },
            length: {
              kind: "numeric-input",
              inputId: "length",
            },
          };
    customScriptDraft = {
      label: entry.label,
      shortLabel: entry.shortLabel,
      description: entry.description,
      expressionText: parsed.ok ? formatWorkbenchCustomScriptExpressionText(parsed.expression) : entry.expressionText,
      placement: entry.placement,
      defaultLength: entry.defaultLength,
    };
    customScriptDefaultLengthInput = String(entry.defaultLength);
    customScriptDraftBaseline = serializeCustomScriptDraftState();
  }

  function requestCustomScriptLoad(scriptId: string): void {
    const entry = customScriptById(scriptId);
    if (entry === null) {
      pendingCustomScriptLoadId = null;
      return;
    }
    pendingCustomScriptDeleteId = null;
    if (scriptId === editingCustomScriptId) {
      pendingCustomScriptLoadId = null;
      return;
    }
    if (!customScriptDraftIsDirty()) {
      loadCustomScriptDraft(entry);
      return;
    }
    pendingCustomScriptLoadId = scriptId;
  }

  function cancelPendingCustomScriptLoad(): void {
    pendingCustomScriptLoadId = null;
  }

  function discardCustomScriptDraftChanges(): void {
    if (pendingCustomScriptLoadId === null) {
      return;
    }
    const entry = customScriptById(pendingCustomScriptLoadId);
    if (entry === null) {
      resetCustomScriptDraft();
      return;
    }
    loadCustomScriptDraft(entry);
  }

  function confirmCustomScriptDelete(scriptId: string): void {
    const deleted = onDeleteCustomScript(scriptId);
    if (!deleted) {
      return;
    }
    if (pendingCustomScriptLoadId === scriptId) {
      pendingCustomScriptLoadId = null;
    }
    pendingCustomScriptDeleteId = null;
    if (editingCustomScriptId === scriptId) {
      resetCustomScriptDraft();
    }
  }

  type ScriptBuilderPath = readonly ("input" | "left" | "right")[];

  function createBuilderExpression(kind: WorkbenchScriptExpression["kind"]): WorkbenchScriptExpression {
    if (kind === "input") {
      return {
        kind: "input",
        field: "close",
      };
    }
    if (kind === "sma") {
      return {
        kind: "sma",
        input: {
          kind: "input",
          field: "close",
        },
        length: {
          kind: "numeric-input",
          inputId: "length",
        },
      };
    }
    return {
      kind: "subtract",
      left: {
        kind: "input",
        field: "close",
      },
      right: {
        kind: "sma",
        input: {
          kind: "input",
          field: "close",
        },
        length: {
          kind: "numeric-input",
          inputId: "length",
        },
      },
    };
  }

  function updateBuilderExpression(
    expression: WorkbenchScriptExpression,
    path: ScriptBuilderPath,
    updater: (expression: WorkbenchScriptExpression) => WorkbenchScriptExpression,
  ): WorkbenchScriptExpression {
    if (path.length === 0) {
      return updater(expression);
    }
    const [segment, ...rest] = path;
    if (segment === "input" && expression.kind === "sma") {
      return {
        ...expression,
        input: updateBuilderExpression(expression.input, rest, updater),
      };
    }
    if (segment === "left" && expression.kind === "subtract") {
      return {
        ...expression,
        left: updateBuilderExpression(expression.left, rest, updater),
      };
    }
    if (segment === "right" && expression.kind === "subtract") {
      return {
        ...expression,
        right: updateBuilderExpression(expression.right, rest, updater),
      };
    }
    return expression;
  }

  function syncCustomScriptExpression(nextExpression: WorkbenchScriptExpression): void {
    customScriptExpression = nextExpression;
    customScriptDraft = {
      ...customScriptDraft,
      expressionText: formatWorkbenchCustomScriptExpressionText(nextExpression),
    };
  }

  function syncImportExpressionToBuilder(): void {
    customScriptImportError = null;
    customScriptImportExpressionInput = formatWorkbenchCustomScriptExpressionText(customScriptExpression);
  }

  function importCustomScriptExpression(): void {
    const parsed = parseWorkbenchCustomScriptExpressionText(customScriptImportExpressionInput);
    if (!parsed.ok) {
      customScriptImportError = parsed.message;
      return;
    }
    customScriptImportError = null;
    customScriptImportExpressionInput = formatWorkbenchCustomScriptExpressionText(parsed.expression);
    syncCustomScriptExpression(parsed.expression);
  }

  function setCustomScriptNodeKind(path: ScriptBuilderPath, kind: WorkbenchScriptExpression["kind"]): void {
    syncCustomScriptExpression(
      updateBuilderExpression(customScriptExpression, path, () => createBuilderExpression(kind)),
    );
  }

  function setCustomScriptNodeField(path: ScriptBuilderPath, field: WorkbenchScriptField): void {
    syncCustomScriptExpression(
      updateBuilderExpression(customScriptExpression, path, (expression) =>
        expression.kind === "input"
          ? {
              ...expression,
              field,
            }
          : expression,
      ),
    );
  }

  function parseLengthInput(value: string): number | null {
    if (value.trim().length === 0) {
      return null;
    }
    return Number(value);
  }

  function submitCustomScriptDraft(): void {
    const nextLength = parseLengthInput(customScriptDefaultLengthInput);
    const validation = validateWorkbenchCustomScriptDraft({
      label: customScriptDraft.label.trim(),
      shortLabel: customScriptDraft.shortLabel.trim(),
      description: customScriptDraft.description.trim(),
      expressionText: formatWorkbenchCustomScriptExpressionText(customScriptExpression),
      placement: customScriptDraft.placement,
      defaultLength: nextLength ?? Number.NaN,
    });
    if (!validation.ok) {
      customScriptDraftError = validation.message;
      return;
    }
    customScriptDraftError = null;
    const saved = onSaveCustomScript(editingCustomScriptId, {
      label: customScriptDraft.label.trim(),
      shortLabel: customScriptDraft.shortLabel.trim(),
      description: customScriptDraft.description.trim(),
      expressionText: formatWorkbenchCustomScriptExpressionText(customScriptExpression),
      placement: customScriptDraft.placement,
      defaultLength: nextLength ?? Number.NaN,
    });
    if (saved) {
      resetCustomScriptDraft();
    } else if (editingCustomScriptId === null) {
      pendingCustomScriptDeleteId = null;
    }
  }

  $: objectTreeNodes = workbench?.rightSidebar.objectTree.nodes ?? [];
  $: replayState = snapshot.replay;
  $: layoutPreset = workbench?.layout.preset ?? "single";
  $: activeSidebarPanel = workbench?.activeRightSidebarPanel ?? "watchlist";
  $: for (const entry of snapshot.indicatorCatalog ?? []) {
    if (entry.engineKind !== "script") {
      continue;
    }
    for (const input of entry.scriptInputs ?? []) {
      ensureScriptDraft(entry.id, input.id, input.defaultValue);
    }
  }
  $: {
    let nextDrafts: Record<string, string> | null = null;
    for (const script of snapshot.customScripts ?? []) {
      if (customScriptLaunchDrafts[script.id] !== undefined) {
        continue;
      }
      nextDrafts = {
        ...(nextDrafts ?? customScriptLaunchDrafts),
        [script.id]: String(script.defaultLength),
      };
    }
    if (nextDrafts !== null) {
      customScriptLaunchDrafts = nextDrafts;
    }
  }
  $: {
    const value = parseLengthInput(customScriptDefaultLengthInput);
    customScriptDefaultLengthErrorMessage =
      value === null || !Number.isInteger(value) || value < 2 || value > 60
        ? "Default length must be an integer between 2 and 60."
        : null;
  }
  $: {
    const parsed = parseWorkbenchCustomScriptExpressionText(customScriptDraft.expressionText.trim());
    const lengthValue = parseLengthInput(customScriptDefaultLengthInput);
    const lengthLabel = Number.isFinite(lengthValue) ? String(lengthValue) : "--";
    customScriptDraftPreviewLabel = !parsed.ok
      ? `expression invalid · length ${lengthLabel} · ${customScriptDraft.placement}`
      : `${formatWorkbenchCustomScriptExpressionText(customScriptExpression)} · length ${lengthLabel} · ${customScriptDraft.placement}`;
  }
  $: {
    const nextErrors: Record<string, string | null> = {};
    const nextPayloads: Record<string, Record<string, number> | null> = {};
    for (const script of snapshot.customScripts ?? []) {
      const value =
        customScriptLaunchDrafts[script.id] === undefined
          ? script.defaultLength
          : parseLengthInput(customScriptLaunchDrafts[script.id] ?? "");
      nextErrors[script.id] =
        value === null
          ? "Length is required."
          : !Number.isInteger(value) || value < 2 || value > 60
            ? "Length must be an integer between 2 and 60."
            : null;
      nextPayloads[script.id] =
        value === null || !Number.isInteger(value) || value < 2 || value > 60
          ? null
          : { length: value };
    }
    customScriptLaunchErrors = nextErrors;
    customScriptLaunchPayloads = nextPayloads;
  }
  $: filteredCustomScripts = [...(snapshot.customScripts ?? [])]
    .filter((script) => matchesCustomScriptFilter(script, customScriptFilter))
    .sort((left, right) => compareCustomScripts(left, right, customScriptSortMode));
  $: if (
    pendingCustomScriptDeleteId !== null &&
    !filteredCustomScripts.some((script) => script.id === pendingCustomScriptDeleteId)
  ) {
    pendingCustomScriptDeleteId = null;
  }
  $: if (pendingCustomScriptLoadId !== null && customScriptById(pendingCustomScriptLoadId) === null) {
    pendingCustomScriptLoadId = null;
  }
  $: slotViews =
    workbench?.layout.slots.map((slot, index) => {
      const host = slot.chartHostId
        ? workbench?.chartHosts.find((entry) => entry.id === slot.chartHostId) ?? null
        : null;
      return {
        slotId: slot.id,
        title: slot.title,
        role: slot.role,
        hostId: slot.chartHostId ?? null,
        hostTitle: host?.title ?? slot.title,
        hostActive: host?.active ?? false,
        hostSymbol: host?.symbolLabel ?? "--",
        hostTimeframe: host?.timeframeLabel ?? "--",
        hostChartType: host?.chartTypeLabel ?? "--",
        hostStatus: host?.statusLabel ?? "",
        grid: gridPositionForSlot(workbench?.layout.preset ?? "single", index),
      } satisfies SlotView;
    }) ?? [];
  $: activeSlotView = slotViews.find((view) => view.hostActive) ?? slotViews[0] ?? null;
  $: activeGrid = activeSlotView?.grid ?? { col: 1, row: 1 };
</script>

<article class="demo-card workbench-card" data-demo-tab="workbench">
  <div class="card-head compact-head">
    <div class="toolbar-strip workstation-toolbar">
      <button>{workbench?.toolbar.activeSymbol ?? "NDX"}</button>
      <button>{workbench?.toolbar.timeframeLabel ?? "1D"}</button>
      <div class="type-picker" aria-label="main chart type picker">
        {#each chartTypeActions as action}
          <button
            class:active={action.active}
            on:click={() => onRunAction(action.id)}
          >
            {action.label}
          </button>
        {/each}
      </div>
      <button>{workbench?.toolbar.indicatorsLabel ?? "Indicators"}</button>
      <button>{workbench?.toolbar.alertLabel ?? "Alert"}</button>
      <button
        type="button"
        aria-pressed={replayState?.active ? "true" : "false"}
        on:click={() => {
          if (replayState?.active && replayState?.playing) {
            onPauseReplay();
            return;
          }
          if (replayState?.active) {
            onPlayReplay();
            return;
          }
          onEnterReplay();
        }}
      >{workbench?.toolbar.replayLabel ?? "Replay"}</button>
      <button>{workbench?.toolbar.layoutLabel ?? "Layout single"}</button>
      <button
        type="button"
        data-command-palette-trigger
        aria-expanded={commandPaletteOpen ? "true" : "false"}
        aria-controls="workbench-command-palette"
        on:click={onToggleCommandPalette}
      >Commands</button>
      <button on:click={onSaveLayout} disabled={replayState?.active || layoutPersistenceMissing()}>Save layout</button>
      <button on:click={onRestoreLayout} disabled={replayState?.active || layoutPersistenceMissing()}>Restore layout</button>
      <button on:click={onResetLayout} disabled={replayState?.active}>Reset layout</button>
      <button
        type="button"
        data-layout-import-trigger
        on:click={onImportLayout}
        disabled={workbench?.layoutTransfer.importEnabled === false}
      >{workbench?.layoutTransfer.importLabel ?? "Import layout"}</button>
      <button
        type="button"
        data-layout-export-trigger
        on:click={onExportLayout}
        disabled={workbench?.layoutTransfer.exportEnabled === false}
      >{workbench?.layoutTransfer.exportLabel ?? "Export layout"}</button>
    </div>
    {#if workbench?.statusNotice}
      <div
        class={`status-notice tone-${workbench.statusNotice.tone}`}
        data-workbench-status={workbench.statusNotice.tone}
      >
        {workbench.statusNotice.message}
      </div>
    {/if}
    <div class="workspace-tab-strip" data-workspace-tabs>
      {#each workbench?.workspaceTabs ?? [] as tab (tab.id)}
        <div
          class="workspace-tab-chip"
          class:active={tab.active}
          data-workspace-tab={tab.id}
          data-workspace-active={tab.active ? "true" : "false"}
          data-workspace-panel={tab.sidebarPanel}
          data-workspace-view={tab.viewId}
        >
          <button
            type="button"
            class="workspace-tab-main"
            disabled={!tab.enabled}
            aria-disabled={!tab.enabled}
            on:click={() => {
              if (!tab.enabled) {
                return;
              }
              void onSetWorkspaceTab(tab.id);
            }}
          >
            <strong>{tab.label}</strong>
            <span>{tab.symbolLabel ?? "--"} · {tab.timeframeLabel ?? "--"}</span>
          </button>
          {#if tab.closeable}
            <button
              type="button"
              class="workspace-tab-close"
              aria-label={`Close ${tab.label}`}
              data-workspace-tab-close={tab.id}
              on:click={(event) => {
                event.stopPropagation();
                void onCloseWorkspaceTab(tab.id);
              }}
            >×</button>
          {/if}
        </div>
      {/each}
      <button
        type="button"
        class="workspace-tab-create"
        data-workspace-tab-create
        on:click={() => {
          void onCreateWorkspaceTab();
        }}
      >＋</button>
    </div>
  </div>

  {#if commandPaletteOpen}
    <button
      type="button"
      class="command-palette-backdrop"
      data-command-palette-backdrop
      aria-label="Close workbench commands"
      on:click={onCloseCommandPalette}
    ></button>
    <div
      id="workbench-command-palette"
      class="command-palette"
      data-command-palette
      role="dialog"
      aria-modal="true"
      aria-label={commandPalette?.title ?? "Workbench Commands"}
    >
      <div class="command-palette-head">
        <strong>{commandPalette?.title ?? "Workbench Commands"}</strong>
        <span>Cmd/Ctrl+K</span>
      </div>
      <div class="command-palette-list">
        {#each commandPalette?.entries ?? [] as entry (entry.id)}
          <button
            type="button"
            class:active={entry.active}
            data-command-entry={entry.id}
            data-command-active={entry.active ? "true" : "false"}
            disabled={!entry.enabled}
            aria-disabled={!entry.enabled}
            on:click={() => {
              if (!entry.enabled) {
                return;
              }
              void onExecuteCommand(entry.id);
            }}
          >
            <span>{entry.label}</span>
            <span class="command-palette-meta">
              {#if entry.shortcutLabel}
                <kbd>{entry.shortcutLabel}</kbd>
              {/if}
              {#if entry.active}
                <em>Active</em>
              {/if}
            </span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="workbench-shell">
    <aside class="tool-rail">
      {#each drawingTools as tool}
        <button
          class:active={tool.enabled && tool.id !== "none" && activeDrawingTool === tool.id}
          class:disabled={!tool.enabled}
          aria-label={tool.label}
          aria-disabled={!tool.enabled}
          title={tool.label}
          disabled={!tool.enabled}
          on:click={() => {
            if (!tool.enabled) {
              return;
            }
            onSetDrawingTool(tool.id);
          }}
        >
          {tool.icon}
        </button>
      {/each}
    </aside>

    <div class="workbench-main">
      <div class="chart-meta">
        <div class="market-line">
          <strong>{workbench?.toolbar.activeSymbol ?? "NDX"} {workbench?.layout.preset === "single" ? "Workbench" : "Layout"}</strong>
          <span>{workbench?.toolbar.timeframeLabel ?? "1D"}</span>
          <span>{workbench?.toolbar.exchangeLabel ?? "NASDAQ"}</span>
          <span>O {readout.formatted.open}</span>
          <span>H {readout.formatted.high}</span>
          <span>L {readout.formatted.low}</span>
          <span>C {readout.formatted.close}</span>
        </div>
        <div class="market-line">
          <span>Pane {readout.paneIndex === null ? "--" : readout.paneIndex + 1}</span>
          <span>{readout.formatted.time}</span>
        </div>
      </div>

      <div
        class="chart-frame-shell"
        data-workbench-layout
        data-workbench-layout-preset={layoutPreset}
      >
        <div class="workbench-layout" class:split={layoutPreset === "main-plus-secondary"} class:grid={layoutPreset === "grid-2x2"}>
          {#if layoutPreset !== "single"}
            {#each slotViews as slotView (slotView.slotId)}
              <section
                class="chart-slot"
                class:active={slotView.hostActive}
                data-chart-slot={slotView.slotId}
                style={`grid-column: ${slotView.grid.col}; grid-row: ${slotView.grid.row};`}
              >
                <article
                  class="chart-host-card"
                  class:active={slotView.hostActive}
                  class:empty={!slotView.hostId}
                  data-chart-host={slotView.hostId ?? undefined}
                  data-chart-host-active={slotView.hostActive ? "true" : "false"}
                  data-chart-host-symbol={slotView.hostSymbol}
                >
                  <div class="chart-host-badge">
                    <strong>{slotView.hostSymbol}</strong>
                    <span class="chart-host-badge-detail"
                      >{slotView.hostTimeframe} · {slotView.hostChartType}</span
                    >
                    {#if slotView.hostActive}
                      <span class="chart-host-badge-tag">Live</span>
                    {:else if slotView.hostStatus}
                      <span class="chart-host-badge-tag">{slotView.hostStatus}</span>
                    {:else}
                      <span class="chart-host-badge-tag">Read-only</span>
                    {/if}
                  </div>

                  {#if !slotView.hostActive}
                    <div class="chart-host-summary" aria-label="chart host summary">
                      <p class="chart-host-summary-title">{slotView.hostTitle}</p>
                      <p class="chart-host-summary-detail">
                        {slotView.role === "primary" ? "Primary slot" : "Secondary slot"}
                      </p>
                      <p class="chart-host-summary-detail">This host is a shell in this slice.</p>
                    </div>
                  {/if}
                </article>
              </section>
            {/each}
          {/if}

          <div
            class="live-chart"
            style={`grid-column: ${activeGrid.col}; grid-row: ${activeGrid.row};`}
          >
            {#if layoutPreset !== "single"}
              <div class="live-chart-badge">
                <strong>{activeSlotView?.hostSymbol ?? workbench?.toolbar.activeSymbol ?? "NDX"}</strong>
                <span>
                  {activeSlotView?.hostTimeframe ?? workbench?.toolbar.timeframeLabel ?? "1D"}
                  {" · "}
                  {activeSlotView?.hostChartType ?? workbench?.toolbar.chartTypeLabel ?? "Candles"}
                </span>
              </div>
            {/if}
            <div
              class="chart-frame"
              role="presentation"
              on:pointermove={onPointerMove}
              on:pointerleave={onPointerLeave}
            >
              {#if error}
                <div class="error-state">
                  <p class="error-label">chart init failure</p>
                  <p>{error}</p>
                </div>
              {:else}
                <canvas bind:this={canvasElement} aria-label="chartx2 phase-one chart harness"></canvas>
                {#if showHorizontalPreview}
                  <svg class="drawing-tool-preview" aria-hidden="true">
                    <line
                      class="drawing-tool-preview-line"
                      x1="0"
                      x2="100%"
                      y1={String(horizontalPreviewY)}
                      y2={String(horizontalPreviewY)}
                    ></line>
                  </svg>
                {:else if showTrendPreview}
                  <svg class="drawing-tool-preview" aria-hidden="true">
                    <line
                      class="drawing-tool-preview-line"
                      x1={String(trendPreviewX1)}
                      y1={String(trendPreviewY1)}
                      x2={String(trendPreviewX2)}
                      y2={String(trendPreviewY2)}
                    ></line>
                  </svg>
                {/if}
              {/if}
            </div>
          </div>
        </div>
      </div>

      <div class="readout-bar">
        <span>Pane {readout.paneIndex === null ? "--" : readout.paneIndex + 1}</span>
        <span>O {readout.formatted.open}</span>
        <span>H {readout.formatted.high}</span>
        <span>L {readout.formatted.low}</span>
        <span>C {readout.formatted.close}</span>
        {#each readout.series as series}
          <span class="series-pill" style={`--series-color: ${series.color};`}>
            {series.label} {series.formattedValue}
          </span>
        {/each}
      </div>

      <div class="workbench-footer">
        <div class="bottom-tab-strip" data-workbench-bottom-tabs>
          {#each workbench?.bottomPanel.tabs ?? [] as tab}
            <button
              type="button"
              class:active={tab.id === workbench?.bottomPanel.activeTab}
              data-bottom-tab={tab.id}
              data-bottom-tab-active={tab.id === workbench?.bottomPanel.activeTab ? "true" : "false"}
              disabled={!tab.enabled}
              aria-disabled={!tab.enabled}
            >
              {tab.label}
            </button>
          {/each}
        </div>
        <div class="time-strip">
          {#each workbench?.bottomPanel.ranges ?? ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"] as range}
            <button class:active={range === (workbench?.bottomPanel.activeRange ?? "1D")}>{range}</button>
          {/each}
        </div>
        {#if renkoActions.length > 0}
          <div class="mode-strip">
            {#each renkoActions as action}
              <button
                class:active={action.active}
                on:click={() => onRunAction(action.id)}
              >
                {action.label}
              </button>
            {/each}
          </div>
        {/if}
        {#if lineBreakActions.length > 0}
          <div class="mode-strip">
            {#each lineBreakActions as action}
              <button
                class:active={action.active}
                on:click={() => onRunAction(action.id)}
              >
                {action.label}
              </button>
            {/each}
          </div>
        {/if}
        <div class="action-strip">
          {#each chartActions as action}
            <button
              class={`${actionClass(action.tone)} ${action.active ? "active" : ""}`}
              data-demo-action={action.id}
              on:click={() => onRunAction(action.id)}
            >
              {action.label}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <aside class="workbench-sidebar">
      <section
        class="mini-card watch-card"
        class:active-focus={activeSidebarPanel === "watchlist"}
        data-workbench-panel="watchlist"
        data-workbench-panel-active={activeSidebarPanel === "watchlist" ? "true" : "false"}
      >
        <div class="sidebar-head">
          <h4>{workbench?.rightSidebar.watchlist.title ?? "Watchlist"}</h4>
          <button>＋</button>
        </div>
        <div class="watch-head">
          <span>Symbol</span>
          <span>Last</span>
          <span>Chg</span>
        </div>
        <div class="watch-body">
          {#each workbench?.rightSidebar.watchlist.items ?? [] as item}
            <button
              class="watch-row"
              class:active={item.id === workbench?.rightSidebar.watchlist.activeItemId}
              aria-current={item.id === workbench?.rightSidebar.watchlist.activeItemId ? "true" : undefined}
              data-watchlist-symbol={item.symbol}
              type="button"
              on:click={() => onOpenWatchlistSymbol(item.symbol)}
            >
              <strong>{item.symbol}</strong>
              <span>{item.lastLabel}</span>
              <span>{item.changeLabel}</span>
            </button>
          {:else}
            <p class="watch-empty">{workbench?.rightSidebar.watchlist.emptyLabel ?? "No watchlist symbols loaded"}</p>
          {/each}
        </div>
      </section>

      <section
        class="mini-card watch-card screener-card"
        class:active-focus={activeSidebarPanel === "screener"}
        data-workbench-panel="screener"
        data-workbench-panel-active={activeSidebarPanel === "screener" ? "true" : "false"}
      >
        <div class="sidebar-head">
          <h4>{workbench?.rightSidebar.screener.title ?? "Screener"}</h4>
          <span data-screener-summary>{workbench?.rightSidebar.screener.summaryLabel ?? "0 matches"}</span>
        </div>
        <div class="screener-head">
          <strong data-screener-mode>{workbench?.rightSidebar.screener.modeLabel ?? "Local watchlist movers"}</strong>
          <div class="screener-filters">
            {#each workbench?.rightSidebar.screener.filters ?? [] as filter}
              <button
                type="button"
                class:active={filter.active}
                data-screener-filter={filter.id}
                data-screener-filter-active={filter.active ? "true" : "false"}
                disabled={filter.enabled === false}
                aria-disabled={filter.enabled === false}
                on:click={() => {
                  if (filter.enabled === false) {
                    return;
                  }
                  onRunAction(filter.id);
                }}
              >
                {filter.label}
              </button>
            {/each}
          </div>
        </div>
        <div class="watch-head screener-columns">
          <span>Symbol</span>
          <span>Last</span>
          <span>Move</span>
        </div>
        <div class="watch-body">
          {#each workbench?.rightSidebar.screener.results ?? [] as result}
            <button
              class="watch-row screener-row"
              type="button"
              data-screener-result={result.id}
              data-screener-symbol={result.symbol}
              on:click={() => onOpenScreenerSymbol(result.symbol)}
            >
              <span class="screener-symbol-block">
                <strong>{result.symbol}</strong>
                <small>{result.rankLabel}</small>
              </span>
              <span>{result.lastLabel}</span>
              <span class={`screener-change screener-change-${result.changeTone ?? "neutral"}`}>
                {result.changeLabel}
              </span>
            </button>
          {:else}
            <p class="screener-empty">{workbench?.rightSidebar.screener.emptyLabel ?? "No local screener matches"}</p>
          {/each}
        </div>
      </section>

      <section
        class="mini-card watch-card alert-card"
        class:active-focus={activeSidebarPanel === "alerts"}
        data-workbench-panel="alerts"
        data-workbench-panel-active={activeSidebarPanel === "alerts" ? "true" : "false"}
      >
        <div class="sidebar-head">
          <h4>{workbench?.rightSidebar.alerts.title ?? "Alerts"}</h4>
          <button
            type="button"
            aria-label="Create price alert"
            on:click={() => {
              void onCreatePriceAlert();
            }}
          >＋</button>
        </div>
        <div class="watch-head">
          <span>Name</span>
          <span>Rule</span>
          <span>State</span>
        </div>
        <div class="watch-body">
          {#each workbench?.rightSidebar.alerts.items ?? [] as item}
            <article>
              <strong>{item.label}</strong>
              <span>{item.conditionLabel}</span>
              <span>{item.status}</span>
            </article>
          {:else}
            <p class="watch-empty">{workbench?.rightSidebar.alerts.emptyLabel ?? "No active alerts"}</p>
          {/each}
        </div>
      </section>

      <section class="mini-card indicator-card">
        <div class="sidebar-head">
          <h4>Indicators</h4>
          <span>{snapshot.activeIndicators?.length ?? 0} active</span>
        </div>
        {#if snapshot.scriptExecution}
          <div
            class={`script-execution-status state-${snapshot.scriptExecution.state}`}
            data-script-execution-surface
            data-script-execution-state={snapshot.scriptExecution.state}
            data-script-execution-owner={snapshot.scriptExecution.owner}
          >
            <strong>{snapshot.scriptExecution.adapterLabel}</strong>
            <span>{snapshot.scriptExecution.adapterDetailLabel}</span>
            <span>
              {snapshot.scriptExecution.scriptLabel ?? "No script selected"} · {snapshot.scriptExecution.message}
            </span>
          </div>
        {/if}
        <div class="indicator-list">
          {#each snapshot.indicatorCatalog ?? [] as entry}
            {#if entry.engineKind === "script" && (entry.scriptInputs?.length ?? 0) > 0}
              <article
                class="indicator-entry scripted-entry"
                title={entry.enabled ? entry.description : entry.unavailableReason ?? entry.description}
              >
                <strong>{entry.label}</strong>
                <span>{entry.shortLabel} · {entry.family} · builtin · {scriptExecutionOwnerLabel()}</span>
                <div class="script-input-grid">
                  {#each entry.scriptInputs ?? [] as input}
                    <label class="script-input-field">
                      <span>{input.label}</span>
                      <input
                        type="number"
                        min={String(input.min)}
                        max={String(input.max)}
                        step={String(input.step)}
                        value={scriptDraftValue(entry.id, input.id, input.defaultValue)}
                        data-script-input-entry={entry.id}
                        data-script-input-id={input.id}
                        on:input={(event) =>
                          updateScriptDraft(entry.id, input.id, (event.currentTarget as HTMLInputElement).value)}
                      />
                    </label>
                  {/each}
                </div>
                <div class="custom-script-row-actions">
                  <button
                    class="indicator-add-btn"
                    type="button"
                    disabled={!entry.enabled}
                    aria-disabled={!entry.enabled}
                    data-script-add-entry={entry.id}
                    on:click={() => onAddIndicator(entry.id, scriptInputPayload(entry))}
                  >
                    Add
                  </button>
                  {#if entry.source !== "custom"}
                    <button
                      type="button"
                      class="indicator-secondary-btn"
                      data-script-save-catalog-entry={entry.id}
                      on:click={() => onSaveCatalogScriptAsCustom(entry.id)}
                    >
                      Save preset
                    </button>
                  {/if}
                </div>
                {#if !entry.enabled && entry.unavailableReason}
                  <small>{entry.unavailableReason}</small>
                {/if}
              </article>
            {:else}
              <button
                class="indicator-entry"
                type="button"
                disabled={!entry.enabled}
                aria-disabled={!entry.enabled}
                title={entry.enabled ? entry.description : entry.unavailableReason ?? entry.description}
                on:click={() => onAddIndicator(entry.id)}
              >
                <strong>{entry.label}</strong>
                <span>{entry.shortLabel} · {entry.family}</span>
                {#if !entry.enabled && entry.unavailableReason}
                  <small>{entry.unavailableReason}</small>
                {/if}
              </button>
            {/if}
          {:else}
            <p class="indicator-empty">No catalog entries published.</p>
          {/each}
        </div>
        <div class="active-indicator-list">
          {#each snapshot.activeIndicators ?? [] as indicator}
            <article>
              <strong>{indicator.label}</strong>
              <span>
                {indicator.placement}
                {#if formatIndicatorInputValues(indicator.inputValues) !== null}
                  {" · "}
                  {formatIndicatorInputValues(indicator.inputValues)}
                {/if}
                {#if indicator.kind === "script" && indicator.source === "chart-state-fallback"}
                  {" · "}engine-restored
                {/if}
              </span>
              {#if indicator.kind === "script" && indicator.paneIndex !== undefined && indicator.removable === true}
                <button
                  type="button"
                  class="indicator-secondary-btn"
                  data-active-script-remove={String(indicator.paneIndex)}
                  on:click={() => onRemoveActiveScriptIndicator(indicator.paneIndex!)}
                >
                  Remove
                </button>
              {/if}
            </article>
          {:else}
            <p class="indicator-empty">No active indicators.</p>
          {/each}
        </div>
        <div class="custom-script-library" data-custom-script-library>
          <div class="sidebar-head compact-subhead">
            <h4>Script Library</h4>
            <span>
              {filteredCustomScripts.length}
              {#if customScriptFilter.trim().length > 0}
                / {snapshot.customScripts?.length ?? 0}
              {/if}
              {" "}saved
            </span>
          </div>
          <div class="custom-script-actions">
            <label class="script-input-field">
              <span>Filter saved scripts</span>
              <input
                type="text"
                bind:value={customScriptFilter}
                data-custom-script-filter
                placeholder="label, short label, or expression"
              />
            </label>
            <label class="script-input-field">
              <span>Sort saved scripts</span>
              <select bind:value={customScriptSortMode} data-custom-script-sort>
                <option value="newest">Newest first</option>
                <option value="label">Label A-Z</option>
                <option value="in-use">In use first</option>
              </select>
            </label>
            <button
              type="button"
              class="indicator-secondary-btn"
              data-custom-script-filter-clear
              disabled={customScriptFilter.trim().length === 0}
              on:click={() => {
                customScriptFilter = "";
              }}
            >
              Clear filter
            </button>
          </div>
          <div class="custom-script-form" data-custom-script-form>
            <label class="script-input-field">
              <span>Label</span>
              <input
                type="text"
                bind:value={customScriptDraft.label}
                data-custom-script-field="label"
                placeholder="My Close SMA"
              />
            </label>
            <label class="script-input-field">
              <span>Short label</span>
              <input
                type="text"
                bind:value={customScriptDraft.shortLabel}
                data-custom-script-field="short-label"
                placeholder="Close SMA"
              />
            </label>
            <label class="script-input-field">
              <span>Description</span>
              <input
                type="text"
                bind:value={customScriptDraft.description}
                data-custom-script-field="description"
                placeholder="Close-price SMA saved in the local workbench library."
              />
            </label>
            <div class="script-input-field">
              <span>Expression builder</span>
              <ScriptExpressionBuilder
                expression={customScriptExpression}
                path={[]}
                onSetKind={setCustomScriptNodeKind}
                onSetField={setCustomScriptNodeField}
              />
            </div>
            <label class="script-input-field">
              <span>Import expression</span>
              <input
                type="text"
                bind:value={customScriptImportExpressionInput}
                data-custom-script-import-expression
                placeholder="subtract(close, sma(close, length))"
              />
            </label>
            <div class="custom-script-actions">
              <button
                type="button"
                class="indicator-secondary-btn"
                data-custom-script-import-apply
                on:click={importCustomScriptExpression}
              >
                Apply expression
              </button>
              <button
                type="button"
                class="indicator-secondary-btn"
                data-custom-script-import-reset
                disabled={customScriptImportExpressionInput === formatWorkbenchCustomScriptExpressionText(customScriptExpression)}
                on:click={syncImportExpressionToBuilder}
              >
                Use builder expression
              </button>
            </div>
            {#if customScriptImportError}
              <p class="indicator-empty" data-custom-script-import-error>{customScriptImportError}</p>
            {/if}
            <div class="script-input-grid dual">
              <label class="script-input-field">
                <span>Placement</span>
                <select bind:value={customScriptDraft.placement} data-custom-script-field="placement">
                  <option value="separate-pane">Separate pane</option>
                  <option value="overlay" disabled>Overlay (not yet supported)</option>
                </select>
              </label>
            </div>
            <p class="custom-script-preview">Custom scripted indicators currently save as separate-pane studies only.</p>
            <label class="script-input-field">
              <span>Default length</span>
              <ScriptLengthInput
                bind:value={customScriptDefaultLengthInput}
                data-custom-script-field="default-length"
              />
            </label>
            {#if customScriptDefaultLengthErrorMessage}
              <p class="indicator-empty" data-custom-script-default-length-error>{customScriptDefaultLengthErrorMessage}</p>
            {/if}
            <p class="custom-script-preview" data-custom-script-expression-preview>
              {formatWorkbenchCustomScriptExpressionText(customScriptExpression)}
            </p>
            <p class="custom-script-preview" data-custom-script-preview>{customScriptDraftPreviewLabel}</p>
            {#if customScriptDraftError}
              <p class="indicator-empty" data-custom-script-error>{customScriptDraftError}</p>
            {/if}
            {#if pendingCustomScriptLoadId !== null}
              <div class="custom-script-actions" data-custom-script-dirty-fence>
                <p class="indicator-empty">
                  Unsaved script changes. Discard them before loading
                  {customScriptById(pendingCustomScriptLoadId)?.label ?? "another saved script"}.
                </p>
                <button
                  type="button"
                  class="indicator-secondary-btn danger"
                  data-custom-script-dirty-discard
                  on:click={discardCustomScriptDraftChanges}
                >
                  Discard and load
                </button>
                <button
                  type="button"
                  class="indicator-secondary-btn"
                  data-custom-script-dirty-cancel
                  on:click={cancelPendingCustomScriptLoad}
                >
                  Keep current draft
                </button>
              </div>
            {/if}
            <div class="custom-script-actions">
              <button
                type="button"
                class="indicator-add-btn"
                data-custom-script-save
                disabled={customScriptDefaultLengthErrorMessage !== null}
                on:click={submitCustomScriptDraft}
              >
                {#if customScriptDefaultLengthErrorMessage}
                  Fix default length
                {:else}
                  {editingCustomScriptId === null ? "Save script" : "Update script"}
                {/if}
              </button>
              {#if editingCustomScriptId !== null}
                <button type="button" class="indicator-secondary-btn" data-custom-script-cancel on:click={resetCustomScriptDraft}>
                  Cancel
                </button>
              {/if}
            </div>
          </div>
          <div class="custom-script-list">
            {#each filteredCustomScripts as script}
              <article class="custom-script-entry" data-custom-script={script.id}>
                <div class="custom-script-copy">
                  <strong>{script.label}</strong>
                  <span>{script.expressionText} · {script.placement} · length {script.defaultLength} · {scriptExecutionOwnerLabel()}</span>
                  {#if script.inUse}
                    <span class="indicator-empty" data-custom-script-in-use={script.id}>
                      In use on an active chart. Remove active uses before editing or deleting.
                    </span>
                  {/if}
                </div>
                <label class="script-input-field compact-launch-field">
                  <span>Length</span>
                  <ScriptLengthInput
                    bind:value={customScriptLaunchDrafts[script.id]}
                    data-custom-script-launch-length={script.id}
                  />
                </label>
                {#if customScriptLaunchErrors[script.id]}
                  <p class="indicator-empty" data-custom-script-launch-error={script.id}>
                    {customScriptLaunchErrors[script.id]}
                  </p>
                {/if}
                <div class="custom-script-row-actions">
                  <button
                    type="button"
                    class="indicator-add-btn"
                    data-custom-script-add={script.id}
                    disabled={customScriptLaunchPayloads[script.id] === null}
                    on:click={() => {
                      const payload = customScriptLaunchPayloads[script.id];
                      if (payload === null) {
                        return;
                      }
                      onAddCustomScriptToChart(script.id, payload);
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    class="indicator-secondary-btn"
                    data-custom-script-edit={script.id}
                    disabled={script.inUse}
                    on:click={() => requestCustomScriptLoad(script.id)}
                  >
                    Edit
                  </button>
                  <button type="button" class="indicator-secondary-btn" data-custom-script-duplicate={script.id} on:click={() => onDuplicateCustomScript(script.id)}>
                    Duplicate
                  </button>
                  {#if pendingCustomScriptDeleteId === script.id}
                    <button
                      type="button"
                      class="indicator-secondary-btn danger"
                      data-custom-script-delete-confirm={script.id}
                      disabled={script.inUse}
                      on:click={() => confirmCustomScriptDelete(script.id)}
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      class="indicator-secondary-btn"
                      data-custom-script-delete-cancel={script.id}
                      disabled={script.inUse}
                      on:click={() => cancelCustomScriptDelete(script.id)}
                    >
                      Cancel
                    </button>
                  {:else}
                    <button
                      type="button"
                      class="indicator-secondary-btn danger"
                      data-custom-script-delete={script.id}
                      disabled={script.inUse}
                      on:click={() => requestCustomScriptDelete(script.id)}
                    >
                      Delete
                    </button>
                  {/if}
                </div>
              </article>
            {:else}
              <p class="indicator-empty" data-custom-script-empty>
                {#if (snapshot.customScripts?.length ?? 0) === 0}
                  No saved custom scripts.
                {:else}
                  No saved custom scripts match the current filter.
                {/if}
              </p>
              {#if (snapshot.customScripts?.length ?? 0) > 0 && customScriptFilter.trim().length > 0}
                <div class="custom-script-actions">
                  <button
                    type="button"
                    class="indicator-secondary-btn"
                    data-custom-script-empty-clear
                    on:click={() => {
                      customScriptFilter = "";
                    }}
                  >
                    Clear filter and show all
                  </button>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </section>

      <section class="mini-card replay-card" data-replay-panel>
        <div class="sidebar-head">
          <h4>Replay</h4>
          <span>{replayState?.active ? "active" : "ready"}</span>
        </div>
        <div
          class="replay-summary"
          data-replay-active={replayState?.active ? "true" : "false"}
          data-replay-playing={replayState?.playing ? "true" : "false"}
          data-replay-current-step={String(replayState?.currentStep ?? 0)}
          data-replay-total-steps={String(replayState?.totalSteps ?? 0)}
        >
          <strong>{replayState?.currentTimeLabel ?? "--"}</strong>
          <span>{replayState?.currentStep ?? 0} / {replayState?.totalSteps ?? 0}</span>
          <span>{replayState?.startTimeLabel ?? "--"} → {replayState?.endTimeLabel ?? "--"}</span>
        </div>
        <div class="replay-controls">
          {#if !(replayState?.active ?? false)}
            <button type="button" data-replay-control="enter" on:click={onEnterReplay}>
              Enter replay
            </button>
          {:else}
            <button
              type="button"
              data-replay-control={replayState?.playing ? "pause" : "play"}
              on:click={() => {
                if (replayState?.playing) {
                  onPauseReplay();
                  return;
                }
                onPlayReplay();
              }}
            >
              {replayState?.playing ? "Pause" : "Play"}
            </button>
            <button type="button" data-replay-control="step" on:click={onStepReplay}>
              Step
            </button>
            <button type="button" data-replay-control="exit" on:click={onExitReplay}>
              Exit
            </button>
          {/if}
        </div>
      </section>

      <section class="mini-card symbol-card">
        <div class="sidebar-head">
          <h4>{workbench?.toolbar.activeSymbol ?? "NDX"}</h4>
          <span>{workbench?.toolbar.exchangeLabel ?? "NASDAQ"}</span>
        </div>
        <strong class="big-price">{readout.formatted.close}</strong>
        <div class="metric-list compact">
          {#each snapshot.metrics.slice(0, 3) as metric}
            <article>
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
            </article>
          {/each}
        </div>
      </section>

      <section class="mini-card adapter-card" data-workbench-panel="adapters">
        <div class="sidebar-head">
          <h4>Adapters</h4>
          <span>{workbench?.adapterStatus.length ?? 0} tracked</span>
        </div>
        <div class="adapter-list">
          {#each workbench?.adapterStatus ?? [] as adapter}
            <article
              class={`adapter-row state-${adapter.state}`}
              data-adapter-status={adapter.id}
              data-adapter-state={adapter.state}
            >
              <strong>{adapter.label}</strong>
              <span>{adapter.detailLabel}</span>
            </article>
          {/each}
        </div>
      </section>

      <div class="workbench-sidebar-scroll">
        {#if snapshot.pointFigureControls}
          <section class="mini-card symbol-card">
            <div class="sidebar-head">
              <h4>P&amp;F</h4>
              <span>{snapshot.pointFigureControls.visibleColumns ?? "--"} cols</span>
            </div>
            <div class="metric-list compact">
              <article>
                <small>Mode</small>
                <strong>{snapshot.pointFigureControls.mode}</strong>
              </article>
              <article>
                <small>Box size</small>
                <strong>{formatPointFigureBoxSize(snapshot.pointFigureControls.effectiveBoxSize)} pts</strong>
              </article>
              <article>
                <small>Reversal</small>
                <strong>{snapshot.pointFigureControls.reversalBoxes} boxes</strong>
              </article>
            </div>
            <div class="mode-strip compact">
              <button
                class:active={snapshot.pointFigureControls.mode === "auto"}
                on:click={() => onSetPointFigureMode("auto")}
              >
                Auto
              </button>
              <button
                class:active={snapshot.pointFigureControls.mode === "atr"}
                on:click={() => onSetPointFigureMode("atr")}
              >
                ATR
              </button>
              <button
                class:active={snapshot.pointFigureControls.mode === "percentage"}
                on:click={() => onSetPointFigureMode("percentage")}
              >
                %
              </button>
              <button
                class:active={snapshot.pointFigureControls.mode === "traditional"}
                on:click={() => onSetPointFigureMode("traditional")}
              >
                Trad
              </button>
              <button
                class:active={snapshot.pointFigureControls.mode === "fixed"}
                on:click={() => onSetPointFigureMode("fixed")}
              >
                Fixed
              </button>
            </div>
            {#if snapshot.pointFigureControls.mode === "auto" || snapshot.pointFigureControls.mode === "atr"}
              <label class="inspector-field slider-field">
                <span>Scale {snapshot.pointFigureControls.autoScale.toFixed(2)}x</span>
                <input
                  type="range"
                  min="0.35"
                  max="2.5"
                  step="0.05"
                  value={String(snapshot.pointFigureControls.autoScale)}
                  on:input={(event) => onSetPointFigureAutoScale(Number((event.currentTarget as HTMLInputElement).value))}
                />
              </label>
            {/if}
            {#if snapshot.pointFigureControls.mode === "atr"}
              <label class="inspector-field slider-field">
                <span>ATR length {snapshot.pointFigureControls.atrLength}</span>
                <input
                  type="range"
                  min="2"
                  max="60"
                  step="1"
                  value={String(snapshot.pointFigureControls.atrLength)}
                  on:input={(event) => onSetPointFigureAtrLength(Number((event.currentTarget as HTMLInputElement).value))}
                />
              </label>
            {/if}
            {#if snapshot.pointFigureControls.mode === "percentage"}
              <label class="inspector-field slider-field">
                <span>Percent {snapshot.pointFigureControls.percentageValue.toFixed(1)}%</span>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={String(snapshot.pointFigureControls.percentageValue)}
                  on:input={(event) => onSetPointFigurePercentageValue(Number((event.currentTarget as HTMLInputElement).value))}
                />
              </label>
            {/if}
          </section>
        {/if}

        {#if snapshot.lineBreakControls}
          <section class="mini-card symbol-card">
            <div class="sidebar-head">
              <h4>Line Break</h4>
              <span>{snapshot.lineBreakControls.visibleColumns ?? "--"} cols</span>
            </div>
            <div class="metric-list compact">
              <article>
                <small>Mode</small>
                <strong>{snapshot.lineBreakControls.lineCount}-line</strong>
              </article>
              <article>
                <small>Visible</small>
                <strong>{snapshot.lineBreakControls.visibleColumns ?? "--"} cols</strong>
              </article>
            </div>
            <div class="mode-strip compact">
              {#each lineBreakActions as action}
                <button
                  class:active={action.active}
                  on:click={() => onRunAction(action.id)}
                >
                  {action.label}
                </button>
              {/each}
            </div>
          </section>
        {/if}

        {#if snapshot.kagiControls}
          <section class="mini-card symbol-card">
            <div class="sidebar-head">
              <h4>Kagi</h4>
              <span>{snapshot.kagiControls.visibleColumns ?? "--"} cols</span>
            </div>
            <div class="metric-list compact">
              <article>
                <small>Mode</small>
                <strong>{snapshot.kagiControls.mode}</strong>
              </article>
              <article>
                <small>Reversal</small>
                <strong>{formatPointFigureBoxSize(snapshot.kagiControls.effectiveReversalSize)} pts</strong>
              </article>
              <article>
                <small>Visible</small>
                <strong>{snapshot.kagiControls.visibleColumns ?? "--"} cols</strong>
              </article>
            </div>
            <div class="mode-strip compact">
              <button
                class:active={snapshot.kagiControls.mode === "auto"}
                on:click={() => onSetKagiMode("auto")}
              >
                Auto
              </button>
              <button
                class:active={snapshot.kagiControls.mode === "atr"}
                on:click={() => onSetKagiMode("atr")}
              >
                ATR
              </button>
              <button
                class:active={snapshot.kagiControls.mode === "percentage"}
                on:click={() => onSetKagiMode("percentage")}
              >
                %
              </button>
              <button
                class:active={snapshot.kagiControls.mode === "fixed"}
                on:click={() => onSetKagiMode("fixed")}
              >
                Fixed
              </button>
            </div>
            {#if snapshot.kagiControls.mode === "auto" || snapshot.kagiControls.mode === "atr"}
              <label class="inspector-field slider-field">
                <span>Scale {snapshot.kagiControls.autoScale.toFixed(2)}x</span>
                <input
                  type="range"
                  min="0.35"
                  max="2.5"
                  step="0.05"
                  value={String(snapshot.kagiControls.autoScale)}
                  on:input={(event) => onSetKagiAutoScale(Number((event.currentTarget as HTMLInputElement).value))}
                />
              </label>
            {/if}
            {#if snapshot.kagiControls.mode === "fixed"}
              <label class="inspector-field slider-field">
                <span>Fixed reversal {snapshot.kagiControls.fixedReversalSize} pts</span>
                <input
                  type="range"
                  min="10"
                  max="2000"
                  step="10"
                  value={String(snapshot.kagiControls.fixedReversalSize)}
                  on:input={(event) => onSetKagiFixedReversalSize(Number((event.currentTarget as HTMLInputElement).value))}
                />
              </label>
            {/if}
            {#if snapshot.kagiControls.mode === "atr"}
              <label class="inspector-field slider-field">
                <span>ATR length {snapshot.kagiControls.atrLength}</span>
                <input
                  type="range"
                  min="2"
                  max="60"
                  step="1"
                  value={String(snapshot.kagiControls.atrLength)}
                  on:input={(event) => onSetKagiAtrLength(Number((event.currentTarget as HTMLInputElement).value))}
                />
              </label>
            {/if}
            {#if snapshot.kagiControls.mode === "percentage"}
              <label class="inspector-field slider-field">
                <span>Percent {snapshot.kagiControls.percentageValue.toFixed(1)}%</span>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={String(snapshot.kagiControls.percentageValue)}
                  on:input={(event) => onSetKagiPercentageValue(Number((event.currentTarget as HTMLInputElement).value))}
                />
              </label>
            {/if}
          </section>
        {/if}

        <section
          class="mini-card object-tree-card"
          class:active-focus={activeSidebarPanel === "object-tree"}
          data-workbench-panel="object-tree"
          data-workbench-panel-active={activeSidebarPanel === "object-tree" ? "true" : "false"}
        >
          <div class="sidebar-head">
            <h4>{workbench?.rightSidebar.objectTree.title ?? "Object Tree"}</h4>
            <span>{workbench?.rightSidebar.objectTree.summaryLabel ?? ""}</span>
          </div>

          <div class="object-tree-body">
            {#if objectTreeNodes.length === 0}
              <p class="object-tree-empty">{workbench?.rightSidebar.objectTree.emptyLabel ?? "No chart objects"}</p>
            {:else}
              <ul class="object-tree-list" role="tree" aria-label="Workbench object tree">
                {#each objectTreeNodes as node (node.id)}
                  <li
                    class="object-tree-node"
                    class:muted={node.muted ?? false}
                    role="treeitem"
                    aria-level={node.depth + 1}
                    aria-selected="false"
                    data-object-tree-node={node.id}
                    data-object-tree-kind={node.kind}
                    style={`--object-tree-depth: ${node.depth};`}
                  >
                    <div class="object-tree-text">
                      <strong>{node.label}</strong>
                      {#if node.detailLabel}
                        <span class="object-tree-detail">{node.detailLabel}</span>
                      {/if}
                    </div>
                    {#if node.badgeLabel}
                      <span class="object-tree-badge">{node.badgeLabel}</span>
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </section>

        <section class="mini-card inspector-card">
          <div class="sidebar-head">
            <h4>Drawing</h4>
            <span>{snapshot.selectedDrawing?.state.type ?? "None"}</span>
          </div>
          {#if snapshot.selectedDrawing}
            <div class="inspector-sections">
              {#each snapshot.selectedDrawing.schema.sections as section}
                <article class="inspector-section">
                  <strong>{section.label}</strong>
                  <div class="inspector-fields">
                    {#each section.fields as field}
                      <label class="inspector-field">
                        <span>{field.label}</span>
                        {#if field.control === "toggle"}
                          <input
                            type="checkbox"
                            checked={Boolean(selectedDrawingFieldValue(field.key))}
                            on:change={(event) => updateSelectedDrawingField(field.key, field.control, event)}
                          />
                        {:else if field.control === "select"}
                          <select
                            value={String(selectedDrawingFieldValue(field.key))}
                            on:change={(event) => updateSelectedDrawingField(field.key, field.control, event)}
                          >
                            {#each field.options ?? [] as option}
                              <option value={option.value}>{option.label}</option>
                            {/each}
                          </select>
                        {:else if field.control === "color"}
                          <input
                            type="color"
                            value={String(selectedDrawingFieldValue(field.key))}
                            on:input={(event) => updateSelectedDrawingField(field.key, field.control, event)}
                          />
                        {:else if field.control === "text"}
                          <input
                            type="text"
                            value={String(selectedDrawingFieldValue(field.key))}
                            required={field.required ?? false}
                            on:change={(event) => updateSelectedDrawingField(field.key, field.control, event)}
                          />
                        {:else}
                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step ?? (field.control === "time" ? "60000" : "1")}
                            value={String(selectedDrawingFieldValue(field.key))}
                            on:change={(event) => updateSelectedDrawingField(field.key, field.control, event)}
                          />
                        {/if}
                        {#if inspectorErrors[field.key]}
                          <small class="inspector-field-error">{inspectorErrors[field.key]}</small>
                        {/if}
                      </label>
                    {/each}
                  </div>
                </article>
              {/each}
            </div>
          {:else}
            <p class="inspector-empty">
              {#if activeDrawingTool === "horizontal-line"}
                Click the chart to place a horizontal line.
              {:else if activeDrawingTool === "trend-line"}
                {#if snapshot.drawingTool?.pendingTrendLineStartTime !== null}
                  Click a second bar to finish the trend line. Press Escape to cancel.
                {:else}
                  Click the chart to place the trend-line start point. Press Escape to cancel.
                {/if}
              {:else}
                Click a horizontal line or trend line on the chart to inspect its properties.
              {/if}
            </p>
          {/if}
        </section>

        <section class="mini-card panes-card">
          <div class="sidebar-head">
            <h4>Panes</h4>
            <span>{readout.paneIndex === null ? "--" : readout.paneIndex + 1} active</span>
          </div>
          <div class="pane-list">
            <article class="pane-row active">
              <strong>Pane 1</strong>
              <span>Price</span>
            </article>
            <article class="pane-row">
              <strong>Pane 2</strong>
              <span>Volume</span>
            </article>
            <article class="pane-row">
              <strong>Pane 3</strong>
              <span>Study</span>
            </article>
          </div>
        </section>

        <section class="mini-card action-card">
          <h4>Activity</h4>
          <ul class="event-log">
            {#if snapshot.eventLog.length === 0}
              <li>Waiting for the first chart event.</li>
            {:else}
              {#each snapshot.eventLog as entry}
                <li>{entry}</li>
              {/each}
            {/if}
          </ul>
        </section>
      </div>
    </aside>
  </div>
</article>

<style>
  .demo-card {
    display: grid;
    gap: 0;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    padding: 0;
    border-radius: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .workbench-card {
    position: relative;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .command-palette-backdrop {
    position: absolute;
    inset: 0;
    z-index: 11;
    border: 0;
    background: rgba(24, 24, 27, 0.14);
    cursor: default;
  }

  .command-palette {
    position: absolute;
    top: 50px;
    left: 50%;
    z-index: 12;
    display: grid;
    gap: 10px;
    width: min(460px, calc(100% - 24px));
    padding: 12px;
    border: 1px solid rgba(24, 24, 27, 0.12);
    border-radius: 14px;
    background: rgba(255, 252, 244, 0.98);
    box-shadow: 0 24px 48px rgba(24, 24, 27, 0.18);
    transform: translateX(-50%);
  }

  .command-palette-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: rgba(24, 24, 27, 0.68);
    font-size: 0.8rem;
  }

  .command-palette-head strong {
    color: #18181b;
    font-size: 0.96rem;
  }

  .command-palette-list {
    display: grid;
    gap: 6px;
  }

  .command-palette-list button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    border: 0;
    border-radius: 10px;
    background: rgba(24, 24, 27, 0.04);
    color: #18181b;
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }

  .command-palette-list button.active {
    background: rgba(24, 24, 27, 0.92);
    color: #fffdf8;
  }

  .command-palette-list button:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }

  .command-palette-meta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: rgba(24, 24, 27, 0.6);
    font-size: 0.75rem;
  }

  .command-palette-list button.active .command-palette-meta {
    color: rgba(255, 253, 248, 0.78);
  }

  .command-palette-meta kbd,
  .command-palette-meta em {
    padding: 3px 7px;
    border-radius: 999px;
    background: rgba(24, 24, 27, 0.08);
    font: inherit;
    font-size: 0.72rem;
    font-style: normal;
  }

  .command-palette-list button.active .command-palette-meta kbd,
  .command-palette-list button.active .command-palette-meta em {
    background: rgba(255, 253, 248, 0.14);
  }

  .card-head,
  .chart-meta,
  .market-line,
  .readout-bar,
  .sidebar-head,
  .watch-head,
  .watch-body article {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: nowrap;
  }

  .sidebar-head h4 {
    margin: 0;
  }

  .compact-head {
    display: grid;
    grid-template-rows: auto auto auto;
    gap: 8px;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    padding: 10px;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(248, 245, 237, 0.92);
  }

  .toolbar-strip {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    align-items: center;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .toolbar-strip::-webkit-scrollbar,
  .readout-bar::-webkit-scrollbar,
  .action-strip::-webkit-scrollbar,
  .mode-strip::-webkit-scrollbar,
  .time-strip::-webkit-scrollbar,
  .workspace-tab-strip::-webkit-scrollbar,
  .bottom-tab-strip::-webkit-scrollbar {
    display: none;
  }

  .toolbar-strip button,
  .time-strip button,
  .workspace-tab-strip button,
  .bottom-tab-strip button,
  .sidebar-head button {
    flex: 0 0 auto;
    white-space: nowrap;
    padding: 6px 9px;
    border: 0;
    border-radius: 7px;
    background: rgba(24, 24, 27, 0.04);
    font: inherit;
    font-weight: 600;
    color: rgba(24, 24, 27, 0.75);
    cursor: pointer;
    transition:
      transform 120ms ease,
      background 120ms ease,
      color 120ms ease;
  }

  .type-picker {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px;
    border-radius: 9px;
    background: rgba(24, 24, 27, 0.05);
  }

  .type-picker button {
    padding: 5px 8px;
    border-radius: 7px;
    background: transparent;
    color: rgba(24, 24, 27, 0.62);
    font-size: 0.82rem;
  }

  .type-picker button.active,
  .action-btn.active {
    background: #18181b;
    color: #fffdf8;
  }

  .status-notice {
    padding: 8px 10px;
    border-radius: 10px;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .status-notice.tone-success {
    background: rgba(22, 163, 74, 0.12);
    color: #166534;
  }

  .status-notice.tone-warning {
    background: rgba(217, 119, 6, 0.14);
    color: #92400e;
  }

  .status-notice.tone-error {
    background: rgba(220, 38, 38, 0.12);
    color: #991b1b;
  }

  .status-notice.tone-info {
    background: rgba(37, 99, 235, 0.12);
    color: #1d4ed8;
  }

  .workspace-tab-strip,
  .bottom-tab-strip {
    display: flex;
    gap: 6px;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .workspace-tab-chip.active,
  .bottom-tab-strip button.active {
    background: #18181b;
    color: #fffdf8;
  }

  .workspace-tab-chip {
    display: inline-flex;
    align-items: stretch;
    min-width: 0;
    border-radius: 10px;
    background: rgba(24, 24, 27, 0.06);
  }

  .workspace-tab-main {
    display: grid;
    gap: 2px;
    min-width: 112px;
    padding: 8px 10px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .workspace-tab-main strong {
    font-size: 0.82rem;
  }

  .workspace-tab-main span {
    font-size: 0.72rem;
    opacity: 0.72;
  }

  .workspace-tab-close,
  .workspace-tab-create {
    width: 30px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .workspace-tab-create {
    border-radius: 10px;
    background: rgba(24, 24, 27, 0.06);
  }

  .workbench-shell {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 268px;
    gap: 0;
    align-items: stretch;
    min-height: 0;
    overflow: hidden;
  }

  .tool-rail {
    display: grid;
    gap: 4px;
    align-content: start;
    padding: 6px 2px;
    border-right: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(245, 242, 234, 0.95);
  }

  .tool-rail button {
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: rgba(24, 24, 27, 0.84);
    font: inherit;
    cursor: pointer;
  }

  .tool-rail button.active {
    background: #18181b;
    color: #fffdf8;
  }

  .tool-rail button.disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }

  .workbench-main {
    display: grid;
    grid-template-rows: 34px minmax(0, 1fr) var(--readout-height, 36px) 68px;
    gap: 0;
    min-height: 0;
    overflow: hidden;
    background: #f9f6ef;
  }

  .chart-meta {
    min-height: 34px;
    min-width: 0;
    overflow: hidden;
    padding: 0 10px;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(250, 247, 241, 0.98);
  }

  .market-line {
    color: rgba(24, 24, 27, 0.66);
    font-size: 0.82rem;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .market-line strong {
    color: #18181b;
  }

  .chart-frame-shell {
    position: relative;
    min-height: 0;
    background: #fffdf7;
  }

  .workbench-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    gap: 0;
    height: 100%;
    min-height: 0;
    background: #fffdf7;
  }

  .workbench-layout.split {
    grid-template-columns: minmax(0, 1fr) 292px;
  }

  .workbench-layout.grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  }

  .chart-slot {
    position: relative;
    min-height: 0;
    border-right: 1px solid rgba(24, 24, 27, 0.08);
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(255, 253, 247, 0.96);
  }

  .workbench-layout:not(.split):not(.grid) .chart-slot {
    border-right: 0;
    border-bottom: 0;
  }

  .workbench-layout.split .chart-slot:nth-child(2) {
    border-right: 0;
  }

  .chart-host-card {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    border: 2px solid rgba(24, 24, 27, 0.08);
    background: rgba(255, 253, 247, 0.94);
  }

  .chart-host-card.active {
    border-color: rgba(24, 24, 27, 0.28);
  }

  .chart-host-card.empty {
    opacity: 0.8;
  }

  .chart-host-badge {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 10px 10px 8px 10px;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(247, 243, 235, 0.96);
    color: rgba(24, 24, 27, 0.78);
  }

  .chart-host-badge strong {
    color: #18181b;
    font-size: 0.9rem;
  }

  .chart-host-badge-detail {
    font-size: 0.78rem;
    color: rgba(24, 24, 27, 0.64);
  }

  .chart-host-badge-tag {
    margin-left: auto;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(24, 24, 27, 0.06);
    font-size: 0.74rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(24, 24, 27, 0.72);
  }

  .chart-host-card.active .chart-host-badge-tag {
    background: rgba(24, 24, 27, 0.9);
    color: #fffdf8;
  }

  .chart-host-summary {
    display: grid;
    gap: 6px;
    padding: 12px 12px 14px 12px;
    align-content: start;
    color: rgba(24, 24, 27, 0.68);
    font-size: 0.82rem;
  }

  .chart-host-summary-title {
    margin: 0;
    color: #18181b;
    font-weight: 700;
  }

  .chart-host-summary-detail {
    margin: 0;
  }

  .live-chart {
    position: relative;
    z-index: 2;
    min-height: 0;
    outline: 2px solid rgba(24, 24, 27, 0.24);
    outline-offset: 2px;
  }

  .live-chart-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    display: inline-flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    align-items: center;
    padding: 6px 10px;
    border-radius: 12px;
    background: rgba(24, 24, 27, 0.78);
    color: rgba(255, 253, 248, 0.96);
    font-size: 0.8rem;
    z-index: 3;
    pointer-events: none;
    box-shadow: 0 10px 26px rgba(24, 24, 27, 0.18);
  }

  .live-chart-badge strong {
    color: #fffdf8;
  }

  .chart-frame {
    position: relative;
    height: 100%;
    min-height: 0;
    border-radius: 0;
    overflow: hidden;
    border: 0;
    background: #fffdf7;
  }

  .drawing-tool-preview {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .drawing-tool-preview-line {
    stroke: rgba(147, 51, 234, 0.9);
    stroke-width: 2;
    stroke-dasharray: 6 6;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  .readout-bar {
    padding: 0 10px;
    border-top: 1px solid rgba(24, 24, 27, 0.08);
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(247, 243, 235, 0.96);
    color: rgba(24, 24, 27, 0.72);
    font-size: 0.82rem;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .series-pill {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 4px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--series-color) 12%, white);
    color: rgba(24, 24, 27, 0.8);
  }

  .series-pill::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--series-color);
  }

  .workbench-footer {
    display: grid;
    grid-template-rows: 28px 28px auto var(--action-strip-height, 40px);
    gap: 0;
    min-height: 0;
    background: rgba(244, 240, 232, 0.96);
  }

  .bottom-tab-strip,
  .time-strip,
  .mode-strip,
  .action-strip {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    padding: 0 10px;
  }

  .bottom-tab-strip {
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
  }

  .time-strip {
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
  }

  .mode-strip {
    padding: 4px 10px;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(247, 243, 235, 0.9);
  }

  .mode-strip button {
    flex: 0 0 auto;
    white-space: nowrap;
    padding: 5px 9px;
    border: 0;
    border-radius: 999px;
    background: rgba(24, 24, 27, 0.05);
    color: rgba(24, 24, 27, 0.66);
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .mode-strip button.active,
  .time-strip button.active {
    background: #18181b;
    color: #fffdf8;
  }

  .action-strip {
    min-height: var(--action-strip-height, 40px);
    justify-content: flex-start;
    min-width: 0;
    background: rgba(243, 239, 231, 0.96);
  }

  .action-btn {
    padding: 8px 12px;
    border: 0;
    border-radius: 8px;
    background: rgba(24, 24, 27, 0.05);
    color: rgba(24, 24, 27, 0.86);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .action-btn.accent {
    background: #18181b;
    color: #fffdf8;
  }

  .action-btn.danger {
    background: rgba(199, 84, 62, 0.12);
    color: #9f2f1c;
  }

  .action-btn.danger.active {
    background: #9f2f1c;
    color: #fffdf8;
  }

  .workbench-sidebar {
    display: grid;
    grid-template-rows: auto auto auto minmax(0, 1fr);
    gap: 0;
    min-height: 0;
    overflow: hidden;
    border-left: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(244, 240, 232, 0.96);
  }

  .workbench-sidebar-scroll {
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
  }

  .mini-card {
    padding: 10px 12px;
    border-radius: 0;
    border: 0;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: transparent;
    box-shadow: none;
  }

  .mini-card.active-focus {
    background: rgba(255, 255, 255, 0.58);
    box-shadow: inset 3px 0 0 #18181b;
  }

  .watch-head,
  .watch-body {
    color: rgba(24, 24, 27, 0.58);
    font-size: 0.8rem;
  }

  .watch-body {
    display: grid;
    gap: 6px;
    margin-top: 8px;
    align-content: start;
    overflow: hidden;
  }

  .watch-body strong {
    color: #18181b;
  }

  .watch-empty {
    margin: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(24, 24, 27, 0.04);
  }

  .watch-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 8px;
    align-items: center;
    width: 100%;
    padding: 7px 8px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .watch-row:hover,
  .watch-row.active {
    background: rgba(24, 24, 27, 0.07);
  }

  .watch-row.active strong {
    color: #18181b;
  }

  .screener-head {
    display: grid;
    gap: 8px;
    margin-top: 8px;
  }

  .screener-head strong {
    color: #18181b;
    font-size: 0.84rem;
  }

  .screener-filters {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .screener-filters button {
    padding: 5px 8px;
    border: 0;
    border-radius: 999px;
    background: rgba(24, 24, 27, 0.05);
    color: rgba(24, 24, 27, 0.72);
    font: inherit;
    font-size: 0.76rem;
    cursor: pointer;
  }

  .screener-filters button.active {
    background: #18181b;
    color: #fffdf8;
  }

  .screener-columns {
    margin-top: 10px;
  }

  .screener-row {
    align-items: start;
  }

  .screener-symbol-block {
    display: grid;
    gap: 2px;
  }

  .screener-symbol-block small,
  .screener-empty {
    color: rgba(24, 24, 27, 0.56);
  }

  .screener-change-positive {
    color: #15803d;
  }

  .screener-change-negative {
    color: #b91c1c;
  }

  .indicator-list,
  .active-indicator-list {
    display: grid;
    gap: 6px;
    margin-top: 8px;
  }

  .indicator-entry {
    display: grid;
    gap: 6px;
    width: 100%;
    padding: 8px;
    border: 0;
    border-radius: 8px;
    background: rgba(24, 24, 27, 0.04);
    color: rgba(24, 24, 27, 0.68);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .indicator-entry strong,
  .active-indicator-list strong {
    color: #18181b;
    font-size: 0.82rem;
  }

  .indicator-entry span,
  .active-indicator-list span {
    font-size: 0.74rem;
    text-transform: capitalize;
  }

  .indicator-entry small,
  .indicator-empty {
    margin: 0;
    color: rgba(159, 47, 28, 0.78);
    font-size: 0.72rem;
    line-height: 1.35;
  }

  .indicator-entry:hover:not(:disabled) {
    background: rgba(24, 24, 27, 0.08);
  }

  .scripted-entry {
    cursor: default;
  }

  .script-input-grid {
    display: grid;
    gap: 6px;
  }

  .script-input-grid.dual {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .script-execution-status {
    display: grid;
    gap: 4px;
    margin: 8px 0 10px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(24, 24, 27, 0.04);
  }

  .script-execution-status strong {
    color: #18181b;
  }

  .script-execution-status span {
    color: rgba(24, 24, 27, 0.64);
    font-size: 0.76rem;
    text-transform: none;
  }

  .script-execution-status.state-running {
    background: rgba(37, 99, 235, 0.1);
  }

  .script-execution-status.state-success {
    background: rgba(15, 118, 110, 0.12);
  }

  .script-execution-status.state-error {
    background: rgba(185, 28, 28, 0.1);
  }

  .script-input-field {
    display: grid;
    gap: 4px;
  }

  .script-input-field span {
    font-size: 0.7rem;
    text-transform: none;
    color: rgba(24, 24, 27, 0.58);
  }

  .script-input-field input,
  .script-input-field select {
    width: 100%;
    border: 1px solid rgba(24, 24, 27, 0.12);
    border-radius: 7px;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.92);
    color: #18181b;
    font: inherit;
  }

  .indicator-add-btn {
    justify-self: start;
    border: 0;
    border-radius: 7px;
    padding: 6px 10px;
    background: rgba(15, 118, 110, 0.14);
    color: #0f766e;
    font: inherit;
    cursor: pointer;
  }

  .indicator-add-btn:disabled {
    opacity: 0.46;
    cursor: not-allowed;
  }

  .indicator-secondary-btn {
    justify-self: start;
    border: 1px solid rgba(24, 24, 27, 0.12);
    border-radius: 7px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.86);
    color: #18181b;
    font: inherit;
    cursor: pointer;
  }

  .indicator-secondary-btn.danger {
    color: #b91c1c;
  }

  .indicator-entry:disabled {
    opacity: 0.46;
    cursor: not-allowed;
  }

  .active-indicator-list {
    padding-top: 8px;
    border-top: 1px solid rgba(24, 24, 27, 0.08);
  }

  .active-indicator-list article {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
    color: rgba(24, 24, 27, 0.62);
    font-size: 0.78rem;
  }

  .custom-script-library {
    display: grid;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(24, 24, 27, 0.08);
  }

  .compact-subhead {
    margin-top: 0;
  }

  .custom-script-form,
  .custom-script-list {
    display: grid;
    gap: 8px;
  }

  .custom-script-preview {
    margin: 0;
    font-size: 0.72rem;
    color: rgba(24, 24, 27, 0.62);
  }

  :global(.script-builder-node) {
    display: grid;
    gap: 8px;
    padding: 8px;
    border: 1px solid rgba(24, 24, 27, 0.08);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.6);
  }

  :global(.compact-builder-field) {
    gap: 2px;
  }

  :global(.script-builder-branch) {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .custom-script-actions,
  .custom-script-row-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .custom-script-entry {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
    padding: 8px;
    border-radius: 8px;
    background: rgba(24, 24, 27, 0.04);
  }

  .custom-script-copy {
    display: grid;
    gap: 4px;
    color: rgba(24, 24, 27, 0.66);
  }

  .compact-launch-field {
    min-width: 92px;
  }

  .adapter-list {
    display: grid;
    gap: 8px;
    margin-top: 8px;
  }

  .adapter-row {
    display: grid;
    gap: 4px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(24, 24, 27, 0.04);
  }

  .adapter-row strong {
    color: #18181b;
  }

  .adapter-row span {
    color: rgba(24, 24, 27, 0.62);
    font-size: 0.8rem;
  }

  .adapter-row.state-missing {
    background: rgba(217, 119, 6, 0.12);
  }

  .adapter-row.state-live {
    background: rgba(37, 99, 235, 0.1);
  }

  .replay-summary {
    display: grid;
    gap: 4px;
    margin-top: 8px;
    color: rgba(24, 24, 27, 0.64);
    font-size: 0.76rem;
  }

  .replay-summary strong {
    color: #18181b;
    font-size: 0.84rem;
  }

  .replay-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .replay-controls button {
    border: 0;
    border-radius: 8px;
    padding: 7px 10px;
    background: rgba(24, 24, 27, 0.08);
    color: #18181b;
    font: inherit;
    cursor: pointer;
  }

  .replay-controls button:hover {
    background: rgba(24, 24, 27, 0.12);
  }

  .object-tree-body {
    display: grid;
    gap: 6px;
    margin-top: 8px;
  }

  .object-tree-list {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .object-tree-node {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: start;
    padding: 7px 8px;
    padding-left: calc(8px + var(--object-tree-depth, 0) * 14px);
    border-radius: 8px;
    background: rgba(24, 24, 27, 0.04);
    color: rgba(24, 24, 27, 0.72);
  }

  .object-tree-node.muted {
    opacity: 0.52;
  }

  .object-tree-text {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .object-tree-text strong {
    display: block;
    color: #18181b;
    font-size: 0.82rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .object-tree-detail {
    color: rgba(24, 24, 27, 0.56);
    font-size: 0.74rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .object-tree-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(24, 24, 27, 0.08);
    color: rgba(24, 24, 27, 0.66);
    font-size: 0.72rem;
    font-weight: 650;
    text-transform: capitalize;
    white-space: nowrap;
  }

  .object-tree-empty {
    margin: 0;
    color: rgba(24, 24, 27, 0.58);
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .big-price {
    display: block;
    margin-top: 4px;
    font-size: 1.45rem;
  }

  .metric-list {
    display: grid;
    gap: 0;
    margin-top: 10px;
  }

  .metric-list.compact {
    margin-top: 12px;
  }

  .metric-list article {
    padding: 8px 0;
    border-radius: 0;
    border-top: 1px solid rgba(24, 24, 27, 0.08);
    background: transparent;
  }

  .metric-list small {
    display: block;
    margin-bottom: 2px;
    color: rgba(24, 24, 27, 0.5);
    font-size: 0.72rem;
  }

  .inspector-empty {
    margin: 10px 0 0;
    color: rgba(24, 24, 27, 0.58);
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .inspector-sections {
    display: grid;
    gap: 12px;
    margin-top: 10px;
  }

  .inspector-section {
    display: grid;
    gap: 8px;
  }

  .inspector-section strong {
    font-size: 0.76rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(24, 24, 27, 0.44);
  }

  .inspector-fields {
    display: grid;
    gap: 8px;
  }

  .inspector-field {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    color: rgba(24, 24, 27, 0.74);
    font-size: 0.78rem;
  }

  .inspector-field input[type="text"],
  .inspector-field input[type="number"],
  .inspector-field input[type="color"],
  .inspector-field select {
    width: 112px;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid rgba(24, 24, 27, 0.12);
    background: rgba(255, 253, 247, 0.92);
    color: #18181b;
    border-radius: 8px;
    padding: 6px 8px;
    font: inherit;
  }

  .inspector-field input[type="color"] {
    padding: 2px;
    height: 32px;
  }

  .inspector-field input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }

  .slider-field {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .slider-field input[type="range"] {
    width: 100%;
  }

  .inspector-field-error {
    grid-column: 1 / -1;
    color: #9f2f1c;
    font-size: 0.72rem;
    line-height: 1.35;
  }

  .pane-list {
    display: grid;
    gap: 0;
    margin-top: 8px;
    border-top: 1px solid rgba(24, 24, 27, 0.08);
  }

  .pane-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    color: rgba(24, 24, 27, 0.64);
    font-size: 0.78rem;
  }

  .pane-row strong {
    color: #18181b;
    font-size: 0.8rem;
  }

  .pane-row.active {
    background: linear-gradient(90deg, rgba(24, 24, 27, 0.06), transparent 80%);
  }

  .event-log {
    margin: 8px 0 0;
    padding-left: 18px;
    color: rgba(24, 24, 27, 0.72);
    display: grid;
    gap: 6px;
    overflow: visible;
    max-height: none;
    font-size: 0.8rem;
  }

  .error-state {
    display: grid;
    place-items: center;
    min-height: 320px;
    padding: 24px;
    text-align: center;
    color: #9f2f1c;
    background: rgba(199, 84, 62, 0.06);
  }

  .error-label {
    margin-bottom: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  @media (max-width: 1180px) {
    .workbench-shell {
      grid-template-columns: 38px minmax(0, 1fr) 220px;
    }
  }

  @media (max-width: 840px) {
    .card-head,
    .chart-meta,
    .market-line,
    .readout-bar,
    .sidebar-head,
    .watch-head,
    .watch-body article {
      flex-wrap: wrap;
    }

    .workbench-shell {
      grid-template-columns: 1fr;
    }

    .tool-rail {
      grid-auto-flow: column;
      grid-template-columns: repeat(8, minmax(44px, 1fr));
      overflow-x: auto;
    }

    .workbench-sidebar {
      grid-template-columns: 1fr;
      grid-template-rows: none;
    }

    .chart-frame {
      min-height: 420px;
    }

    .workbench-card,
    .workbench-main,
    .workbench-footer {
      grid-template-rows: none;
    }
  }
</style>
