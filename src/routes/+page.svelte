<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    getChartxFoundation,
    type PhaseOneDrawingPropertyField,
    type PhaseOneDrawingPropertyFieldSchema,
    type PhaseOneReadoutDetail,
  } from "$lib/chartx/public/market";
  import {
    FEATURE_TABS,
    mountFeatureDemo,
    mountWorkbenchDemo,
    type DemoAction,
    type DemoController,
    type DemoSnapshot,
    type FeatureExampleDescriptor,
    type FeatureTabId,
    type WorkbenchDrawingTool,
  } from "$lib/demo/chartx-demo";
  import {
    mountPerformanceReportDemo,
    type PerformanceDemoController,
    type PerformanceDemoSnapshot,
  } from "$lib/demo/performance-demo";
  import type { TradeLocationIntent } from "$lib/chartx/public/performance";
  import FeatureDemoPanel from "$lib/demo/components/FeatureDemoPanel.svelte";
  import MarketWorkbenchPanel from "$lib/demo/components/MarketWorkbenchPanel.svelte";
  import PerformanceWorkbenchPanel from "$lib/demo/components/PerformanceWorkbenchPanel.svelte";

  type TopTabId = "workbench" | "performance" | FeatureTabId;

  const foundation = getChartxFoundation();
  const topTabs: Array<{ id: TopTabId; label: string; available: boolean }> = [
    { id: "workbench", label: "Workbench", available: true },
    { id: "performance", label: "Performance", available: true },
    ...FEATURE_TABS.map((tab) => ({ id: tab.id, label: tab.label, available: tab.available })),
  ];

  const emptyReadout = (): PhaseOneReadoutDetail => ({
    active: false,
    paneIndex: null,
    time: null,
    open: null,
    high: null,
    low: null,
    close: null,
    price: null,
    formatted: {
      time: "--",
      open: "--",
      high: "--",
      low: "--",
      close: "--",
      price: "--",
    },
    series: [],
  });

  const emptySnapshot = (title: string, summary: string): DemoSnapshot => ({
    title,
    summary,
    metrics: [],
    eventLog: [],
  });
  const emptyPerformanceSnapshot = (): PerformanceDemoSnapshot => ({
    title: "Performance Report",
    summary: "Mounting the strategy performance report.",
    metrics: [],
    eventLog: [],
    selectedTradeId: null,
    selectedTradeIntent: null,
    optimization: {
      title: "Parameter Surface",
      summary: "Mounting the optimization surface.",
      selectedRunId: null,
      selectedRunIntent: null,
      renderMode: "surface-zero-3d",
      colorMetric: "robustness",
      thresholdPlaneMode: "z-zero",
      xParam: "fastLength",
      yParam: "slowLength",
      zMetric: "netProfit",
      filterKey: "threshold",
      filterValue: null,
      filterOptions: [],
      runLabel: "--",
    },
  });
  const workbenchDrawingTools: Array<{
    id: WorkbenchDrawingTool;
    label: string;
    icon: string;
    enabled: boolean;
  }> = [
    { id: "horizontal-line", label: "Horizontal line", icon: "—", enabled: true },
    { id: "trend-line", label: "Trend line", icon: "／", enabled: true },
    { id: "none", label: "Clear drawing tool", icon: "⌖", enabled: true },
    { id: "none", label: "Pitchfork", icon: "⌗", enabled: false },
    { id: "none", label: "Text", icon: "T", enabled: false },
    { id: "none", label: "Emoji", icon: "☺", enabled: false },
    { id: "none", label: "Circle", icon: "⊕", enabled: false },
    { id: "none", label: "Brush", icon: "⌂", enabled: false },
  ];

  let activeTopTab: TopTabId = "workbench";

  let workbenchCanvas: HTMLCanvasElement | undefined;
  let performanceCanvas: HTMLCanvasElement | undefined;
  let optimizationCanvas: HTMLCanvasElement | undefined;
  let featureCanvas: HTMLCanvasElement | undefined;

  let workbenchController: DemoController | null = null;
  let performanceController: PerformanceDemoController | null = null;
  let featureController: DemoController | null = null;
  let pendingWorkbenchTradeIntent: TradeLocationIntent | null = null;

  let workbenchReadout = emptyReadout();
  let featureReadout = emptyReadout();

  let workbenchSnapshot = emptySnapshot(
    "Workbench",
    "Mounting the default workstation example.",
  );
  let performanceSnapshot = emptyPerformanceSnapshot();
  let featureSnapshot = emptySnapshot("Feature", "Mounting the focused example.");

  let workbenchActions: readonly DemoAction[] = [];
  let featureActions: readonly DemoAction[] = [];

  let workbenchError = "";
  let featureError = "";
  let teardownWorkbenchReadout: (() => void) | null = null;
  let teardownFeatureReadout: (() => void) | null = null;
  let workbenchInspectorErrors: Partial<Record<PhaseOneDrawingPropertyField, string>> = {};
  let workbenchToolPointer: { x: number; y: number } | null = null;

  onMount(() => {
    void tick().then(() => {
      mountWorkbench();
    });

    return () => {
      teardownWorkbench();
      teardownPerformance();
      teardownFeature();
    };
  });

  function featureDescriptor(tabId: FeatureTabId): FeatureExampleDescriptor | undefined {
    return FEATURE_TABS.find((tab) => tab.id === tabId);
  }

  function bindReadout(
    canvas: HTMLCanvasElement,
    assign: (detail: PhaseOneReadoutDetail) => void,
  ): () => void {
    const handleReadout = (event: Event) => {
      assign((event as CustomEvent<PhaseOneReadoutDetail>).detail);
    };

    canvas.addEventListener("chartx:readout", handleReadout);
    return () => canvas.removeEventListener("chartx:readout", handleReadout);
  }

  async function showTopTab(tabId: TopTabId): Promise<void> {
    if (activeTopTab === tabId) {
      return;
    }

    if (tabId === "workbench") {
      teardownPerformance();
      teardownFeature();
      activeTopTab = "workbench";
      await tick();
      mountWorkbench();
      return;
    }

    if (tabId === "performance") {
      teardownWorkbench();
      teardownFeature();
      activeTopTab = "performance";
      await tick();
      mountPerformance();
      return;
    }

    const descriptor = featureDescriptor(tabId);
    if (!descriptor?.available) {
      return;
    }

    teardownWorkbench();
    teardownPerformance();
    activeTopTab = tabId;
    await tick();
    mountFeature(tabId);
  }

  function teardownWorkbench(): void {
    teardownWorkbenchReadout?.();
    teardownWorkbenchReadout = null;
    workbenchController?.destroy();
    workbenchController = null;
  }

  function teardownPerformance(): void {
    performanceController?.destroy();
    performanceController = null;
  }

  function teardownFeature(): void {
    teardownFeatureReadout?.();
    teardownFeatureReadout = null;
    featureController?.destroy();
    featureController = null;
  }

  function mountWorkbench(): void {
    teardownWorkbench();
    workbenchError = "";
    workbenchReadout = emptyReadout();
    workbenchInspectorErrors = {};

    if (!workbenchCanvas) {
      return;
    }

    teardownWorkbenchReadout = bindReadout(workbenchCanvas, (detail) => {
      workbenchReadout = detail;
    });

    try {
      workbenchController = mountWorkbenchDemo(workbenchCanvas, (snapshot) => {
        workbenchSnapshot = snapshot;
      });
      workbenchActions = workbenchController.actions();
      flushPendingWorkbenchTradeIntent();
    } catch (error) {
      workbenchError =
        error instanceof Error ? error.message : "Unknown workbench init failure";
      teardownWorkbenchReadout?.();
      teardownWorkbenchReadout = null;
    }
  }

  function mountFeature(featureId: FeatureTabId): void {
    teardownFeature();
    featureError = "";
    featureReadout = emptyReadout();

    if (!featureCanvas) {
      return;
    }

    teardownFeatureReadout = bindReadout(featureCanvas, (detail) => {
      featureReadout = detail;
    });

    try {
      featureController = mountFeatureDemo(featureCanvas, featureId, (snapshot) => {
        featureSnapshot = snapshot;
      });
      featureActions = featureController.actions();
    } catch (error) {
      featureError =
        error instanceof Error ? error.message : "Unknown feature demo init failure";
      teardownFeatureReadout?.();
      teardownFeatureReadout = null;
    }
  }

  function mountPerformance(): void {
    teardownPerformance();
    performanceSnapshot = emptyPerformanceSnapshot();

    if (!performanceCanvas || !optimizationCanvas) {
      return;
    }

    performanceController = mountPerformanceReportDemo(
      optimizationCanvas,
      performanceCanvas,
      (snapshot) => {
        performanceSnapshot = snapshot;
      },
      (intent) => {
        pendingWorkbenchTradeIntent = intent;
        if (activeTopTab === "workbench") {
          flushPendingWorkbenchTradeIntent();
          return;
        }
        void showTopTab("workbench");
      },
    );
  }

  function flushPendingWorkbenchTradeIntent(): void {
    if (pendingWorkbenchTradeIntent === null) {
      return;
    }
    workbenchController?.locateTrade?.(pendingWorkbenchTradeIntent);
    if (workbenchController !== null) {
      pendingWorkbenchTradeIntent = null;
    }
  }

  function runWorkbenchAction(actionId: string): void {
    workbenchController?.runAction(actionId);
    workbenchActions = workbenchController?.actions() ?? [];
  }

  function runFeatureAction(actionId: string): void {
    featureController?.runAction(actionId);
    featureActions = featureController?.actions() ?? [];
  }

  function setWorkbenchDrawingTool(tool: WorkbenchDrawingTool): void {
    workbenchController?.setDrawingTool?.(tool);
    workbenchActions = workbenchController?.actions() ?? [];
  }

  function setPointFigureAutoScale(value: number): void {
    workbenchController?.setPointFigureAutoScale?.(value);
  }

  function setPointFigureMode(value: "auto" | "fixed" | "atr" | "percentage" | "traditional"): void {
    workbenchController?.setPointFigureMode?.(value);
  }

  function setPointFigureAtrLength(value: number): void {
    workbenchController?.setPointFigureAtrLength?.(value);
  }

  function setPointFigurePercentageValue(value: number): void {
    workbenchController?.setPointFigurePercentageValue?.(value);
  }

  function setKagiMode(value: "auto" | "fixed" | "atr" | "percentage"): void {
    workbenchController?.setKagiMode?.(value);
  }

  function setKagiFixedReversalSize(value: number): void {
    workbenchController?.setKagiFixedReversalSize?.(value);
  }

  function setKagiAutoScale(value: number): void {
    workbenchController?.setKagiAutoScale?.(value);
  }

  function setKagiAtrLength(value: number): void {
    workbenchController?.setKagiAtrLength?.(value);
  }

  function setKagiPercentageValue(value: number): void {
    workbenchController?.setKagiPercentageValue?.(value);
  }

  function handleWorkbenchChartPointerMove(event: PointerEvent): void {
    const frame = event.currentTarget;
    if (!(frame instanceof HTMLElement)) {
      return;
    }
    const bounds = frame.getBoundingClientRect();
    workbenchToolPointer = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  }

  function clearWorkbenchToolPointer(): void {
    workbenchToolPointer = null;
  }

  function handleWindowKeyDown(event: KeyboardEvent): void {
    if (activeTopTab !== "workbench") {
      return;
    }
    if (event.key !== "Escape") {
      return;
    }
    if ((workbenchSnapshot.drawingTool?.activeTool ?? "none") === "none") {
      return;
    }
    setWorkbenchDrawingTool("none");
    event.preventDefault();
  }

  function formatValue(value: number | null, digits = 2): string {
    return value === null
      ? "--"
      : value.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: digits,
        });
  }

  function formatPointFigureBoxSize(value: number | null): string {
    if (value === null) {
      return "--";
    }
    return Math.abs(value - Math.round(value)) < 0.05 ? String(Math.round(value)) : value.toFixed(1);
  }

  function formatIntentTime(value: number): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  }

  function selectedDrawingFieldValue(field: PhaseOneDrawingPropertyField): string | number | boolean {
    const selected = workbenchSnapshot.selectedDrawing;
    if (selected === null || selected === undefined) {
      return "";
    }

    const options = selected.state.options as Record<string, unknown>;
    if (field.startsWith("magnetSources.")) {
      const key = field.slice("magnetSources.".length) as "open" | "high" | "low" | "close";
      return Boolean((options.magnetSources as Record<string, unknown> | undefined)?.[key]);
    }

    return (options[field] as string | number | boolean | undefined) ?? "";
  }

  function selectedDrawingFieldSchema(
    field: PhaseOneDrawingPropertyField,
  ): PhaseOneDrawingPropertyFieldSchema | null {
    const selected = workbenchSnapshot.selectedDrawing;
    if (selected === null || selected === undefined) {
      return null;
    }

    for (const section of selected.schema.sections) {
      const match = section.fields.find((entry) => entry.key === field);
      if (match !== undefined) {
        return match;
      }
    }

    return null;
  }

  function mergeSelectedDrawingOptionsPatch(
    patch: Record<string, unknown>,
  ): Record<string, unknown> | null {
    const selected = workbenchSnapshot.selectedDrawing;
    if (selected === null || selected === undefined) {
      return null;
    }

    const current = selected.state.options as Record<string, unknown>;
    return {
      ...current,
      ...patch,
      magnetSources: {
        ...((current.magnetSources as Record<string, unknown> | undefined) ?? {}),
        ...((patch.magnetSources as Record<string, unknown> | undefined) ?? {}),
      },
    };
  }

  function clearInspectorFieldErrors(fields: readonly PhaseOneDrawingPropertyField[]): void {
    const nextErrors = { ...workbenchInspectorErrors };
    for (const field of fields) {
      nextErrors[field] = undefined;
    }
    workbenchInspectorErrors = nextErrors;
  }

  function validateTrendLineCrossFieldOptions(nextOptions: Record<string, unknown>): boolean {
    const startTime = Number(nextOptions.startTime);
    const endTime = Number(nextOptions.endTime);
    const startPrice = Number(nextOptions.startPrice);
    const endPrice = Number(nextOptions.endPrice);

    if (startTime === endTime && startPrice === endPrice) {
      workbenchInspectorErrors = {
        ...workbenchInspectorErrors,
        startTime: "Trend-line endpoints must not overlap.",
        endTime: "Trend-line endpoints must not overlap.",
        startPrice: "Trend-line endpoints must not overlap.",
        endPrice: "Trend-line endpoints must not overlap.",
      };
      return false;
    }

    if (startTime >= endTime) {
      workbenchInspectorErrors = {
        ...workbenchInspectorErrors,
        startTime: "Start time must be before end time.",
        endTime: "End time must be after start time.",
      };
      return false;
    }

    clearInspectorFieldErrors(["startTime", "endTime", "startPrice", "endPrice"]);
    return true;
  }

  function updateSelectedDrawingField(
    field: PhaseOneDrawingPropertyField,
    control: PhaseOneDrawingPropertyFieldSchema["control"],
    event: Event,
  ): void {
    if (activeTopTab !== "workbench" || workbenchSnapshot.selectedDrawing == null) {
      return;
    }

    const target = event.currentTarget as HTMLInputElement | HTMLSelectElement | null;
    if (target === null) {
      return;
    }

    const fieldSchema = selectedDrawingFieldSchema(field);
    let nextValue: string | number | boolean;
    if (control === "toggle") {
      nextValue = (target as HTMLInputElement).checked;
    } else if (control === "number" || control === "time") {
      const parsed = Number(target.value);
      if (!Number.isFinite(parsed)) {
        workbenchInspectorErrors = {
          ...workbenchInspectorErrors,
          [field]: "Enter a valid number.",
        };
        return;
      }
      if (fieldSchema?.min !== undefined && parsed < fieldSchema.min) {
        workbenchInspectorErrors = {
          ...workbenchInspectorErrors,
          [field]: `Must be at least ${fieldSchema.min}.`,
        };
        return;
      }
      if (fieldSchema?.max !== undefined && parsed > fieldSchema.max) {
        workbenchInspectorErrors = {
          ...workbenchInspectorErrors,
          [field]: `Must be at most ${fieldSchema.max}.`,
        };
        return;
      }
      nextValue = parsed;
    } else {
      nextValue = target.value;
      if (fieldSchema?.required && String(nextValue).trim().length === 0) {
        workbenchInspectorErrors = {
          ...workbenchInspectorErrors,
          [field]: "This field is required.",
        };
        return;
      }
    }

    if (fieldSchema?.options !== undefined && !fieldSchema.options.some((option) => option.value === String(nextValue))) {
      workbenchInspectorErrors = {
        ...workbenchInspectorErrors,
        [field]: "Select a valid option.",
      };
      return;
    }

    const nextOptions: Record<string, unknown> = field.startsWith("magnetSources.")
      ? {
          magnetSources: {
            [field.slice("magnetSources.".length)]: nextValue,
          },
        }
      : { [field]: nextValue };

    const mergedOptions = mergeSelectedDrawingOptionsPatch(nextOptions);
    if (mergedOptions === null) {
      return;
    }

    if (
      workbenchSnapshot.selectedDrawing.state.type === "trend-line"
      && !validateTrendLineCrossFieldOptions(mergedOptions)
    ) {
      return;
    }

    workbenchInspectorErrors = {
      ...workbenchInspectorErrors,
      [field]: undefined,
    };
    workbenchController?.applySelectedDrawingOptions?.(nextOptions);
  }

  $: activeSnapshot = activeTopTab === "workbench" ? workbenchSnapshot : featureSnapshot;
  $: if (activeTopTab === "workbench" && workbenchSnapshot.selectedDrawing == null && Object.keys(workbenchInspectorErrors).length > 0) {
    workbenchInspectorErrors = {};
  }
  $: activeFeatureSummary =
    activeTopTab === "workbench" || activeTopTab === "performance"
      ? null
      : featureDescriptor(activeTopTab);
  $: completedPhaseOneSteps = foundation.phaseOneSteps.filter(
    (step) => step.status === "complete",
  ).length;
  $: workbenchChartTypeActions = workbenchActions.filter(
    (action) => action.group === "chart-type",
  );
  $: workbenchLineBreakActions = workbenchActions.filter(
    (action) => action.group === "line-break-option",
  );
  $: workbenchRenkoActions = workbenchActions.filter(
    (action) => action.group === "renko-option",
  );
  $: workbenchChartActions = workbenchActions.filter(
    (action) => action.group === "chart-action" || action.group === undefined,
  );
  $: activeWorkbenchDrawingTool = workbenchSnapshot.drawingTool?.activeTool ?? "none";
  $: workbenchTrendLinePreviewAnchor = workbenchSnapshot.drawingTool?.pendingTrendLineStartPoint ?? null;
  $: showWorkbenchHorizontalLinePreview =
    activeTopTab === "workbench"
    && activeWorkbenchDrawingTool === "horizontal-line"
    && workbenchToolPointer !== null;
  $: showWorkbenchTrendLinePreview =
    activeTopTab === "workbench"
    && activeWorkbenchDrawingTool === "trend-line"
    && workbenchTrendLinePreviewAnchor !== null
    && workbenchToolPointer !== null;
  $: workbenchHorizontalPreviewY = showWorkbenchHorizontalLinePreview ? workbenchToolPointer?.y ?? null : null;
  $: workbenchTrendPreviewX1 = showWorkbenchTrendLinePreview ? workbenchTrendLinePreviewAnchor?.x ?? null : null;
  $: workbenchTrendPreviewY1 = showWorkbenchTrendLinePreview ? workbenchTrendLinePreviewAnchor?.y ?? null : null;
  $: workbenchTrendPreviewX2 = showWorkbenchTrendLinePreview ? workbenchToolPointer?.x ?? null : null;
  $: workbenchTrendPreviewY2 = showWorkbenchTrendLinePreview ? workbenchToolPointer?.y ?? null : null;
</script>

<svelte:window on:keydown={handleWindowKeyDown} />

<svelte:head>
  <title>chartx2 | Demo Shell</title>
</svelte:head>

<main class="app-shell">
  <header class="topbar">
    <div class="brand-block">
      <span class="app-mark">chartx2</span>
    </div>

    <nav class="top-tabs" aria-label="chartx2 demo tabs">
      {#each topTabs as tab}
        <button
          class:active={tab.id === activeTopTab}
          class:disabled={!tab.available}
          aria-disabled={!tab.available}
          on:click={() => showTopTab(tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </nav>

    <div class="status-chip">
      <span>{completedPhaseOneSteps}</span>
    </div>
  </header>

  <section class="layout-grid">
    <section class="main-column">
      {#if activeTopTab === "workbench"}
        <MarketWorkbenchPanel
          bind:canvasElement={workbenchCanvas}
          chartTypeActions={workbenchChartTypeActions}
          lineBreakActions={workbenchLineBreakActions}
          renkoActions={workbenchRenkoActions}
          chartActions={workbenchChartActions}
          drawingTools={workbenchDrawingTools}
          activeDrawingTool={activeWorkbenchDrawingTool}
          readout={workbenchReadout}
          snapshot={workbenchSnapshot}
          error={workbenchError}
          inspectorErrors={workbenchInspectorErrors}
          showHorizontalPreview={showWorkbenchHorizontalLinePreview}
          showTrendPreview={showWorkbenchTrendLinePreview}
          horizontalPreviewY={workbenchHorizontalPreviewY}
          trendPreviewX1={workbenchTrendPreviewX1}
          trendPreviewY1={workbenchTrendPreviewY1}
          trendPreviewX2={workbenchTrendPreviewX2}
          trendPreviewY2={workbenchTrendPreviewY2}
          onRunAction={runWorkbenchAction}
          onSetDrawingTool={setWorkbenchDrawingTool}
          onPointerMove={handleWorkbenchChartPointerMove}
          onPointerLeave={clearWorkbenchToolPointer}
          onSetPointFigureAutoScale={setPointFigureAutoScale}
          onSetPointFigureMode={setPointFigureMode}
          onSetPointFigureAtrLength={setPointFigureAtrLength}
          onSetPointFigurePercentageValue={setPointFigurePercentageValue}
          onSetKagiMode={setKagiMode}
          onSetKagiFixedReversalSize={setKagiFixedReversalSize}
          onSetKagiAutoScale={setKagiAutoScale}
          onSetKagiAtrLength={setKagiAtrLength}
          onSetKagiPercentageValue={setKagiPercentageValue}
          {selectedDrawingFieldValue}
          {updateSelectedDrawingField}
          {formatPointFigureBoxSize}
        />
      {:else if activeTopTab === "performance"}
        <PerformanceWorkbenchPanel
          bind:reportCanvasElement={performanceCanvas}
          bind:optimizationCanvasElement={optimizationCanvas}
          snapshot={performanceSnapshot}
          {formatValue}
          {formatIntentTime}
              onOptimizationRenderModeChange={(value) => performanceController?.setOptimizationRenderMode(value)}
              onOptimizationColorMetricChange={(value) => performanceController?.setOptimizationColorMetric(value)}
              onOptimizationThresholdPlaneModeChange={(value) => performanceController?.setOptimizationThresholdPlaneMode(value)}
              onOptimizationXAxisChange={(value) => performanceController?.setOptimizationXAxis(value)}
          onOptimizationYAxisChange={(value) => performanceController?.setOptimizationYAxis(value)}
          onOptimizationZMetricChange={(value) => performanceController?.setOptimizationZMetric(value)}
          onOptimizationFilterValueChange={(value) => performanceController?.setOptimizationFilterValue(value)}
        />
      {:else}
        <FeatureDemoPanel
          bind:canvasElement={featureCanvas}
          title={activeFeatureSummary?.label}
          summary={activeFeatureSummary?.summary}
          error={featureError}
          readout={featureReadout}
          actions={featureActions}
          snapshot={activeSnapshot}
          onRunAction={runFeatureAction}
        />
      {/if}
    </section>
  </section>
</main>

<style>
  :global(html),
  :global(body) {
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: #f5f2eb;
    color: #18181b;
    font-family: "Segoe UI", "SF Pro Text", "Helvetica Neue", sans-serif;
  }

  .app-shell {
    --topbar-height: 46px;
    --card-head-height: 38px;
    --readout-height: 36px;
    --action-strip-height: 40px;
    --feature-console-height: clamp(110px, 13vh, 144px);
    height: 100vh;
    box-sizing: border-box;
    overflow: hidden;
    display: grid;
    grid-template-rows: var(--topbar-height) minmax(0, 1fr);
    gap: 0;
    background: #f3f0e8;
  }

  .topbar,
  .layout-grid {
    box-sizing: border-box;
  }

  .topbar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    height: 100%;
    min-height: 0;
    padding: 0 10px 0 12px;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: linear-gradient(180deg, #f8f5ee 0%, #f2eee6 100%);
    overflow: hidden;
  }

  .brand-block {
    display: inline-flex;
    align-items: center;
    gap: 0;
    min-width: 0;
  }

  .app-mark {
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(24, 24, 27, 0.42);
  }

  .top-tabs {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    padding: 0;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .top-tabs::-webkit-scrollbar {
    display: none;
  }

  .top-tabs button {
    border: 0;
    cursor: pointer;
    transition:
      transform 120ms ease,
      background 120ms ease,
      color 120ms ease;
  }

  .top-tabs button {
    flex: 0 0 auto;
    white-space: nowrap;
    padding: 5px 10px;
    border-radius: 7px;
    background: transparent;
    color: rgba(24, 24, 27, 0.64);
    font: inherit;
    font-size: 0.94rem;
    font-weight: 600;
  }

  .top-tabs button.active {
    background: #18181b;
    color: #fffdf8;
  }

  .top-tabs button.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .status-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    padding: 0 8px;
    border-left: 1px solid rgba(24, 24, 27, 0.08);
    white-space: nowrap;
    height: 100%;
  }

  .status-chip span {
    color: rgba(24, 24, 27, 0.74);
    font-size: 0.82rem;
    font-weight: 700;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    align-items: stretch;
    height: 100%;
    min-height: 0;
  }

  .main-column {
    display: grid;
    min-width: 0;
    min-height: 0;
  }

  @media (max-width: 1180px) {
  }

  @media (max-width: 840px) {
    .app-shell {
      --topbar-height: auto;
      --card-head-height: auto;
      --feature-console-height: auto;
      grid-template-rows: auto minmax(0, 1fr);
    }

    .topbar {
      grid-template-columns: 1fr;
      height: auto;
      min-height: auto;
      padding: 10px 12px;
    }

  }
</style>
