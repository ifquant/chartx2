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
  let featureCanvas: HTMLCanvasElement | undefined;

  let workbenchController: DemoController | null = null;
  let performanceController: PerformanceDemoController | null = null;
  let featureController: DemoController | null = null;

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

    if (!performanceCanvas) {
      return;
    }

    performanceController = mountPerformanceReportDemo(performanceCanvas, (snapshot) => {
      performanceSnapshot = snapshot;
    });
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

  function formatIntentTime(value: number): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
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
        <article class="demo-card workbench-card" data-demo-tab="workbench">
          <div class="card-head compact-head">
            <div class="toolbar-strip workstation-toolbar">
              <button>NDX</button>
              <button>1D</button>
              <div class="type-picker" aria-label="main chart type picker">
                {#each workbenchChartTypeActions as action}
                  <button
                    class:active={action.active}
                    on:click={() => runWorkbenchAction(action.id)}
                  >
                    {action.label}
                  </button>
                {/each}
              </div>
              <button>Indicators</button>
              <button>Alert</button>
              <button>Replay</button>
            </div>
          </div>

          <div class="workbench-shell">
            <aside class="tool-rail">
              {#each workbenchDrawingTools as tool}
                <button
                  class:active={tool.enabled && tool.id !== "none" && activeWorkbenchDrawingTool === tool.id}
                  class:disabled={!tool.enabled}
                  aria-label={tool.label}
                  aria-disabled={!tool.enabled}
                  title={tool.label}
                  disabled={!tool.enabled}
                  on:click={() => {
                    if (!tool.enabled) {
                      return;
                    }
                    setWorkbenchDrawingTool(tool.id);
                  }}
                >
                  {tool.icon}
                </button>
              {/each}
            </aside>

            <div class="workbench-main">
              <div class="chart-meta">
                <div class="market-line">
                  <strong>Nasdaq 100 Index</strong>
                  <span>1D</span>
                  <span>NASDAQ</span>
                  <span>O {workbenchReadout.formatted.open}</span>
                  <span>H {workbenchReadout.formatted.high}</span>
                  <span>L {workbenchReadout.formatted.low}</span>
                  <span>C {workbenchReadout.formatted.close}</span>
                </div>
                <div class="market-line">
                  <span>Pane {workbenchReadout.paneIndex === null ? "--" : workbenchReadout.paneIndex + 1}</span>
                  <span>{workbenchReadout.formatted.time}</span>
                </div>
              </div>

              <div class="chart-frame-shell">
                <div
                  class="chart-frame"
                  role="presentation"
                  on:pointermove={handleWorkbenchChartPointerMove}
                  on:pointerleave={clearWorkbenchToolPointer}
                >
                  {#if workbenchError}
                    <div class="error-state">
                      <p class="error-label">chart init failure</p>
                      <p>{workbenchError}</p>
                    </div>
                  {:else}
                    <canvas
                      bind:this={workbenchCanvas}
                      aria-label="chartx2 phase-one chart harness"
                    ></canvas>
                    {#if showWorkbenchHorizontalLinePreview}
                      <svg class="drawing-tool-preview" aria-hidden="true">
                        <line
                          class="drawing-tool-preview-line"
                          x1="0"
                          x2="100%"
                          y1={String(workbenchHorizontalPreviewY)}
                          y2={String(workbenchHorizontalPreviewY)}
                        ></line>
                      </svg>
                    {:else if showWorkbenchTrendLinePreview}
                      <svg class="drawing-tool-preview" aria-hidden="true">
                        <line
                          class="drawing-tool-preview-line"
                          x1={String(workbenchTrendPreviewX1)}
                          y1={String(workbenchTrendPreviewY1)}
                          x2={String(workbenchTrendPreviewX2)}
                          y2={String(workbenchTrendPreviewY2)}
                        ></line>
                      </svg>
                    {/if}
                  {/if}
                </div>
              </div>

              <div class="readout-bar">
                <span>Pane {workbenchReadout.paneIndex === null ? "--" : workbenchReadout.paneIndex + 1}</span>
                <span>O {workbenchReadout.formatted.open}</span>
                <span>H {workbenchReadout.formatted.high}</span>
                <span>L {workbenchReadout.formatted.low}</span>
                <span>C {workbenchReadout.formatted.close}</span>
                {#each workbenchReadout.series as series}
                  <span class="series-pill" style={`--series-color: ${series.color};`}>
                    {series.label} {series.formattedValue}
                  </span>
                {/each}
              </div>

              <div class="workbench-footer">
                <div class="time-strip">
                  <button class="active">1D</button>
                  <button>5D</button>
                  <button>1M</button>
                  <button>3M</button>
                  <button>6M</button>
                  <button>YTD</button>
                  <button>1Y</button>
                  <button>5Y</button>
                  <button>All</button>
                </div>
                {#if workbenchRenkoActions.length > 0}
                  <div class="mode-strip">
                    {#each workbenchRenkoActions as action}
                      <button
                        class:active={action.active}
                        on:click={() => runWorkbenchAction(action.id)}
                      >
                        {action.label}
                      </button>
                    {/each}
                  </div>
                {/if}
                {#if workbenchLineBreakActions.length > 0}
                  <div class="mode-strip">
                    {#each workbenchLineBreakActions as action}
                      <button
                        class:active={action.active}
                        on:click={() => runWorkbenchAction(action.id)}
                      >
                        {action.label}
                      </button>
                    {/each}
                  </div>
                {/if}
                <div class="action-strip">
                  {#each workbenchChartActions as action}
                    <button
                      class={`${actionClass(action.tone)} ${action.active ? "active" : ""}`}
                      on:click={() => runWorkbenchAction(action.id)}
                    >
                      {action.label}
                    </button>
                  {/each}
                </div>
              </div>
            </div>

            <aside class="workbench-sidebar">
              <section class="mini-card watch-card">
                <div class="sidebar-head">
                  <h4>Watchlist</h4>
                  <button>＋</button>
                </div>
                <div class="watch-head">
                  <span>Symbol</span>
                  <span>Last</span>
                  <span>Chg</span>
                </div>
                <div class="watch-body">
                  <article><strong>SPX</strong><span>6,368.86</span><span>-1.67%</span></article>
                  <article><strong>NDQ</strong><span>23,132.77</span><span>-1.93%</span></article>
                  <article><strong>DJI</strong><span>45,166.64</span><span>-1.73%</span></article>
                  <article><strong>VIX</strong><span>30.73</span><span>-1.03%</span></article>
                </div>
              </section>

              <section class="mini-card symbol-card">
                <div class="sidebar-head">
                  <h4>NDX</h4>
                  <span>NASDAQ</span>
                </div>
                <strong class="big-price">{workbenchReadout.formatted.close}</strong>
                <div class="metric-list compact">
                  {#each workbenchSnapshot.metrics.slice(0, 3) as metric}
                    <article>
                      <small>{metric.label}</small>
                      <strong>{metric.value}</strong>
                    </article>
                  {/each}
                </div>
              </section>

              {#if workbenchSnapshot.pointFigureControls}
                <section class="mini-card symbol-card">
                  <div class="sidebar-head">
                    <h4>P&F</h4>
                    <span>{workbenchSnapshot.pointFigureControls.visibleColumns ?? "--"} cols</span>
                  </div>
                  <div class="metric-list compact">
                    <article>
                      <small>Mode</small>
                      <strong>{workbenchSnapshot.pointFigureControls.mode}</strong>
                    </article>
                    <article>
                      <small>Box size</small>
                      <strong>{formatPointFigureBoxSize(workbenchSnapshot.pointFigureControls.effectiveBoxSize)} pts</strong>
                    </article>
                    <article>
                      <small>Reversal</small>
                      <strong>{workbenchSnapshot.pointFigureControls.reversalBoxes} boxes</strong>
                    </article>
                  </div>
                  <div class="mode-strip compact">
                    <button
                      class:active={workbenchSnapshot.pointFigureControls.mode === "auto"}
                      on:click={() => setPointFigureMode("auto")}
                    >
                      Auto
                    </button>
                    <button
                      class:active={workbenchSnapshot.pointFigureControls.mode === "atr"}
                      on:click={() => setPointFigureMode("atr")}
                    >
                      ATR
                    </button>
                    <button
                      class:active={workbenchSnapshot.pointFigureControls.mode === "percentage"}
                      on:click={() => setPointFigureMode("percentage")}
                    >
                      %
                    </button>
                    <button
                      class:active={workbenchSnapshot.pointFigureControls.mode === "traditional"}
                      on:click={() => setPointFigureMode("traditional")}
                    >
                      Trad
                    </button>
                    <button
                      class:active={workbenchSnapshot.pointFigureControls.mode === "fixed"}
                      on:click={() => setPointFigureMode("fixed")}
                    >
                      Fixed
                    </button>
                  </div>
                  {#if workbenchSnapshot.pointFigureControls.mode === "auto" || workbenchSnapshot.pointFigureControls.mode === "atr"}
                    <label class="inspector-field slider-field">
                      <span>Scale {workbenchSnapshot.pointFigureControls.autoScale.toFixed(2)}x</span>
                      <input
                        type="range"
                        min="0.35"
                        max="2.5"
                        step="0.05"
                        value={String(workbenchSnapshot.pointFigureControls.autoScale)}
                        on:input={(event) => setPointFigureAutoScale(Number((event.currentTarget as HTMLInputElement).value))}
                      />
                    </label>
                  {/if}
                  {#if workbenchSnapshot.pointFigureControls.mode === "atr"}
                    <label class="inspector-field slider-field">
                      <span>ATR length {workbenchSnapshot.pointFigureControls.atrLength}</span>
                      <input
                        type="range"
                        min="2"
                        max="60"
                        step="1"
                        value={String(workbenchSnapshot.pointFigureControls.atrLength)}
                        on:input={(event) => setPointFigureAtrLength(Number((event.currentTarget as HTMLInputElement).value))}
                      />
                    </label>
                  {/if}
                  {#if workbenchSnapshot.pointFigureControls.mode === "percentage"}
                    <label class="inspector-field slider-field">
                      <span>Percent {workbenchSnapshot.pointFigureControls.percentageValue.toFixed(1)}%</span>
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={String(workbenchSnapshot.pointFigureControls.percentageValue)}
                        on:input={(event) => setPointFigurePercentageValue(Number((event.currentTarget as HTMLInputElement).value))}
                      />
                    </label>
                  {/if}
                </section>
              {/if}

              {#if workbenchSnapshot.lineBreakControls}
                <section class="mini-card symbol-card">
                  <div class="sidebar-head">
                    <h4>Line Break</h4>
                    <span>{workbenchSnapshot.lineBreakControls.visibleColumns ?? "--"} cols</span>
                  </div>
                  <div class="metric-list compact">
                    <article>
                      <small>Mode</small>
                      <strong>{workbenchSnapshot.lineBreakControls.lineCount}-line</strong>
                    </article>
                    <article>
                      <small>Visible</small>
                      <strong>{workbenchSnapshot.lineBreakControls.visibleColumns ?? "--"} cols</strong>
                    </article>
                  </div>
                  <div class="mode-strip compact">
                    {#each workbenchLineBreakActions as action}
                      <button
                        class:active={action.active}
                        on:click={() => runWorkbenchAction(action.id)}
                      >
                        {action.label}
                      </button>
                    {/each}
                  </div>
                </section>
              {/if}

              {#if workbenchSnapshot.kagiControls}
                <section class="mini-card symbol-card">
                  <div class="sidebar-head">
                    <h4>Kagi</h4>
                    <span>{workbenchSnapshot.kagiControls.visibleColumns ?? "--"} cols</span>
                  </div>
                  <div class="metric-list compact">
                    <article>
                      <small>Mode</small>
                      <strong>{workbenchSnapshot.kagiControls.mode}</strong>
                    </article>
                    <article>
                      <small>Reversal</small>
                      <strong>{formatPointFigureBoxSize(workbenchSnapshot.kagiControls.effectiveReversalSize)} pts</strong>
                    </article>
                    <article>
                      <small>Visible</small>
                      <strong>{workbenchSnapshot.kagiControls.visibleColumns ?? "--"} cols</strong>
                    </article>
                  </div>
                  <div class="mode-strip compact">
                    <button
                      class:active={workbenchSnapshot.kagiControls.mode === "auto"}
                      on:click={() => setKagiMode("auto")}
                    >
                      Auto
                    </button>
                    <button
                      class:active={workbenchSnapshot.kagiControls.mode === "atr"}
                      on:click={() => setKagiMode("atr")}
                    >
                      ATR
                    </button>
                    <button
                      class:active={workbenchSnapshot.kagiControls.mode === "percentage"}
                      on:click={() => setKagiMode("percentage")}
                    >
                      %
                    </button>
                    <button
                      class:active={workbenchSnapshot.kagiControls.mode === "fixed"}
                      on:click={() => setKagiMode("fixed")}
                    >
                      Fixed
                    </button>
                  </div>
                  {#if workbenchSnapshot.kagiControls.mode === "auto" || workbenchSnapshot.kagiControls.mode === "atr"}
                    <label class="inspector-field slider-field">
                      <span>Scale {workbenchSnapshot.kagiControls.autoScale.toFixed(2)}x</span>
                      <input
                        type="range"
                        min="0.35"
                        max="2.5"
                        step="0.05"
                        value={String(workbenchSnapshot.kagiControls.autoScale)}
                        on:input={(event) => setKagiAutoScale(Number((event.currentTarget as HTMLInputElement).value))}
                      />
                    </label>
                  {/if}
                  {#if workbenchSnapshot.kagiControls.mode === "fixed"}
                    <label class="inspector-field slider-field">
                      <span>Fixed reversal {workbenchSnapshot.kagiControls.fixedReversalSize} pts</span>
                      <input
                        type="range"
                        min="10"
                        max="2000"
                        step="10"
                        value={String(workbenchSnapshot.kagiControls.fixedReversalSize)}
                        on:input={(event) => setKagiFixedReversalSize(Number((event.currentTarget as HTMLInputElement).value))}
                      />
                    </label>
                  {/if}
                  {#if workbenchSnapshot.kagiControls.mode === "atr"}
                    <label class="inspector-field slider-field">
                      <span>ATR length {workbenchSnapshot.kagiControls.atrLength}</span>
                      <input
                        type="range"
                        min="2"
                        max="60"
                        step="1"
                        value={String(workbenchSnapshot.kagiControls.atrLength)}
                        on:input={(event) => setKagiAtrLength(Number((event.currentTarget as HTMLInputElement).value))}
                      />
                    </label>
                  {/if}
                  {#if workbenchSnapshot.kagiControls.mode === "percentage"}
                    <label class="inspector-field slider-field">
                      <span>Percent {workbenchSnapshot.kagiControls.percentageValue.toFixed(1)}%</span>
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={String(workbenchSnapshot.kagiControls.percentageValue)}
                        on:input={(event) => setKagiPercentageValue(Number((event.currentTarget as HTMLInputElement).value))}
                      />
                    </label>
                  {/if}
                </section>
              {/if}

              <div class="workbench-sidebar-scroll">
                <section class="mini-card inspector-card">
                  <div class="sidebar-head">
                    <h4>Drawing</h4>
                    <span>{workbenchSnapshot.selectedDrawing?.state.type ?? "None"}</span>
                  </div>
                  {#if workbenchSnapshot.selectedDrawing}
                    <div class="inspector-sections">
                      {#each workbenchSnapshot.selectedDrawing.schema.sections as section}
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
                                {#if workbenchInspectorErrors[field.key]}
                                  <small class="inspector-field-error">{workbenchInspectorErrors[field.key]}</small>
                                {/if}
                              </label>
                            {/each}
                          </div>
                        </article>
                      {/each}
                    </div>
                  {:else}
                    <p class="inspector-empty">
                      {#if activeWorkbenchDrawingTool === "horizontal-line"}
                        Click the chart to place a horizontal line.
                      {:else if activeWorkbenchDrawingTool === "trend-line"}
                        {#if workbenchSnapshot.drawingTool?.pendingTrendLineStartTime !== null}
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
                    <span>{workbenchReadout.paneIndex === null ? "--" : workbenchReadout.paneIndex + 1} active</span>
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
                    {#if workbenchSnapshot.eventLog.length === 0}
                      <li>Waiting for the first chart event.</li>
                    {:else}
                      {#each workbenchSnapshot.eventLog as entry}
                        <li>{entry}</li>
                      {/each}
                    {/if}
                  </ul>
                </section>
              </div>
            </aside>
          </div>
        </article>
      {:else if activeTopTab === "performance"}
        <article class="demo-card performance-card" data-demo-tab="performance">
          <div class="card-head compact-head feature-header">
            <div class="feature-title-row">
              <h3>{performanceSnapshot.title}</h3>
              <span class="feature-summary-inline">{performanceSnapshot.summary}</span>
            </div>
          </div>

          <div class="performance-shell">
            <div class="performance-frame">
              <canvas
                bind:this={performanceCanvas}
                aria-label="chartx2 performance report canvas"
              ></canvas>
            </div>

            <aside class="performance-sidebar">
              <section class="mini-card symbol-card">
                <div class="sidebar-head">
                  <h4>Run</h4>
                  <span>{performanceSnapshot.selectedTradeId ?? "--"}</span>
                </div>
                <div class="metric-list compact">
                  {#each performanceSnapshot.metrics as metric}
                    <article>
                      <small>{metric.label}</small>
                      <strong>{metric.value}</strong>
                    </article>
                  {/each}
                </div>
              </section>

              <section class="mini-card inspector-card">
                <div class="sidebar-head">
                  <h4>Trade Intent</h4>
                  <span>{performanceSnapshot.selectedTradeIntent?.tradeId ?? "None"}</span>
                </div>
                {#if performanceSnapshot.selectedTradeIntent}
                  <div class="intent-grid">
                    <small>Symbol</small>
                    <strong>{performanceSnapshot.selectedTradeIntent.symbol}</strong>
                    <small>Side</small>
                    <strong>{performanceSnapshot.selectedTradeIntent.side}</strong>
                    <small>Entry</small>
                    <strong>{formatIntentTime(performanceSnapshot.selectedTradeIntent.entryTime)}</strong>
                    <small>Exit</small>
                    <strong>{formatIntentTime(performanceSnapshot.selectedTradeIntent.exitTime)}</strong>
                    <small>Entry Px</small>
                    <strong>{formatValue(performanceSnapshot.selectedTradeIntent.entryPrice)}</strong>
                    <small>Exit Px</small>
                    <strong>{formatValue(performanceSnapshot.selectedTradeIntent.exitPrice)}</strong>
                    <small>P&L</small>
                    <strong>{formatValue(performanceSnapshot.selectedTradeIntent.realizedPnl, 0)}</strong>
                    <small>Source</small>
                    <strong>{performanceSnapshot.selectedTradeIntent.sourceChartId}</strong>
                  </div>
                {:else}
                  <p class="inspector-empty">Click an equity point or trade row to emit a TradeLocationIntent.</p>
                {/if}
              </section>

              <section class="mini-card action-card">
                <h4>Activity</h4>
                <ul class="event-log">
                  {#if performanceSnapshot.eventLog.length === 0}
                    <li>Waiting for performance report events.</li>
                  {:else}
                    {#each performanceSnapshot.eventLog as entry}
                      <li>{entry}</li>
                    {/each}
                  {/if}
                </ul>
              </section>
            </aside>
          </div>
        </article>
      {:else}
        <article class="demo-card feature-card" data-demo-tab="feature">
          <div class="card-head compact-head feature-header">
            <div class="feature-title-row">
              <h3>{activeFeatureSummary?.label}</h3>
              <span class="feature-summary-inline">{activeFeatureSummary?.summary}</span>
            </div>
          </div>

          <div class="chart-frame feature-frame">
            {#if featureError}
              <div class="error-state">
                <p class="error-label">chart init failure</p>
                <p>{featureError}</p>
              </div>
            {:else}
              <canvas
                bind:this={featureCanvas}
                aria-label="chartx2 feature demo chart"
              ></canvas>
            {/if}
          </div>

          <div class="readout-bar feature-readout">
            <span>Pane {featureReadout.paneIndex === null ? "--" : featureReadout.paneIndex + 1}</span>
            <span>O {featureReadout.formatted.open}</span>
            <span>H {featureReadout.formatted.high}</span>
            <span>L {featureReadout.formatted.low}</span>
            <span>C {featureReadout.formatted.close}</span>
            {#each featureReadout.series as series}
              <span class="series-pill" style={`--series-color: ${series.color};`}>
                {series.label} {series.formattedValue}
              </span>
            {/each}
          </div>

          <div class="action-strip">
            {#each featureActions as action}
              <button
                class={`${actionClass(action.tone)} ${action.active ? "active" : ""}`}
                on:click={() => runFeatureAction(action.id)}
              >
                {action.label}
              </button>
            {/each}
          </div>

          <section class="feature-console">
            <article class="feature-console-card">
              <small>Summary</small>
              <p>{activeSnapshot.summary}</p>
            </article>

            <article class="feature-console-card">
              <small>Metrics</small>
              <div class="feature-metric-grid">
                {#each activeSnapshot.metrics as metric}
                  <div>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                {/each}
              </div>
            </article>

            <article class="feature-console-card">
              <small>Activity</small>
              <ul class="feature-activity">
                {#if activeSnapshot.eventLog.length === 0}
                  <li>Waiting for the first chart event.</li>
                {:else}
                  {#each activeSnapshot.eventLog as entry}
                    <li>{entry}</li>
                  {/each}
                {/if}
              </ul>
            </article>
          </section>
        </article>
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
  .layout-grid,
  .demo-card {
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

  .card-head h3,
  .sidebar-head h4 {
    margin: 0;
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

  .eyebrow {
    margin: 0 0 6px;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(24, 24, 27, 0.48);
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

  .top-tabs button,
  .toolbar-strip button,
  .action-btn,
  .tool-rail button,
  .time-strip button,
  .sidebar-head button {
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
    grid-template-rows: var(--card-head-height) minmax(0, 1fr);
  }

  .feature-card {
    grid-template-rows:
      var(--card-head-height)
      minmax(0, 1fr)
      var(--readout-height)
      var(--action-strip-height)
      var(--feature-console-height);
  }

  .card-head,
  .chart-meta,
  .market-line,
  .card-label-row,
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

  .compact-head {
    height: var(--card-head-height);
    align-items: center;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    padding: 0 10px;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(248, 245, 237, 0.92);
  }

  .subtle-copy {
    margin: 4px 0 0;
    color: rgba(24, 24, 27, 0.54);
    font-size: 0.88rem;
  }

  .head-copy {
    max-width: 460px;
    margin: 0;
    color: rgba(24, 24, 27, 0.68);
    line-height: 1.55;
  }

  .feature-header {
    justify-content: flex-start;
  }

  .feature-title-row {
    display: inline-flex;
    align-items: baseline;
    gap: 16px;
    flex-wrap: nowrap;
    min-width: 0;
    overflow: hidden;
  }

  .feature-summary-inline {
    color: rgba(24, 24, 27, 0.56);
    font-size: 0.92rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-strip {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    align-items: center;
    justify-content: flex-start;
    min-height: var(--action-strip-height);
    overflow-x: auto;
    overflow-y: hidden;
    min-width: 0;
    scrollbar-width: none;
    padding: 0 10px;
    background: rgba(243, 239, 231, 0.96);
  }

  .action-strip::-webkit-scrollbar {
    display: none;
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

  .toolbar-strip::-webkit-scrollbar {
    display: none;
  }

  .toolbar-strip button,
  .time-strip button,
  .sidebar-head button {
    flex: 0 0 auto;
    white-space: nowrap;
    padding: 6px 9px;
    border-radius: 7px;
    background: rgba(24, 24, 27, 0.04);
    font: inherit;
    font-weight: 600;
    color: rgba(24, 24, 27, 0.75);
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
    border-radius: 7px;
    background: transparent;
    color: rgba(24, 24, 27, 0.84);
    font: inherit;
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
    grid-template-rows: 34px minmax(0, 1fr) var(--readout-height) 68px;
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
    min-height: 0;
    background: #fffdf7;
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

  .feature-frame {
    min-height: 0;
  }

  .feature-console {
    display: grid;
    grid-template-columns: 1.1fr 1.5fr 1fr;
    gap: 0;
    min-height: var(--feature-console-height);
    border-top: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(244, 240, 232, 0.94);
  }

  .feature-console-card {
    min-height: 0;
    overflow: hidden;
    padding: 10px 12px;
    border-right: 1px solid rgba(24, 24, 27, 0.08);
    background: transparent;
  }

  .feature-console-card small {
    display: block;
    margin-bottom: 8px;
    color: rgba(24, 24, 27, 0.48);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    font-size: 0.72rem;
  }

  .feature-console-card p {
    margin: 4px 0 0;
    color: rgba(24, 24, 27, 0.7);
    line-height: 1.35;
    font-size: 0.92rem;
  }

  .feature-metric-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .feature-metric-grid span {
    display: block;
    color: rgba(24, 24, 27, 0.52);
    font-size: 0.78rem;
    margin-bottom: 2px;
  }

  .feature-metric-grid strong {
    font-size: 1rem;
  }

  .feature-activity {
    margin: 0;
    padding-left: 18px;
    color: rgba(24, 24, 27, 0.72);
    display: grid;
    gap: 8px;
    max-height: 100%;
    overflow: hidden;
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

  .readout-bar::-webkit-scrollbar {
    display: none;
  }

  .feature-readout {
    min-height: var(--readout-height);
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
    grid-template-rows: 28px auto var(--action-strip-height);
    gap: 0;
    min-height: 0;
    background: rgba(244, 240, 232, 0.96);
  }

  .time-strip {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    align-items: center;
    padding: 0 10px;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
  }

  .time-strip::-webkit-scrollbar {
    display: none;
  }

  .mode-strip {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    padding: 4px 10px;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(247, 243, 235, 0.9);
  }

  .mode-strip::-webkit-scrollbar {
    display: none;
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

  .mode-strip button.active {
    background: #18181b;
    color: #fffdf8;
  }

  .time-strip button.active {
    background: #18181b;
    color: #fffdf8;
  }

  .action-btn {
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(24, 24, 27, 0.05);
    color: rgba(24, 24, 27, 0.86);
    font: inherit;
    font-weight: 600;
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

  .big-price {
    display: block;
    margin-top: 4px;
    font-size: 1.45rem;
  }

  .price-meta {
    margin: 8px 0 0;
    line-height: 1.55;
    color: rgba(24, 24, 27, 0.7);
  }

  .metric-list {
    display: grid;
    gap: 0;
    margin-top: 10px;
  }

  .metric-list.compact {
    margin-top: 12px;
  }

  .compact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .inspector-card {
    min-height: 0;
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

  .note-card {
    background: rgba(255, 250, 237, 0.92);
  }

  .gap-card {
    background: rgba(248, 245, 255, 0.88);
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

  .performance-card {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-rows: var(--card-head-height) minmax(0, 1fr);
  }

  .performance-shell {
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 310px;
    gap: 0;
    border-top: 1px solid rgba(24, 24, 27, 0.08);
  }

  .performance-frame {
    min-height: 0;
    padding: 14px;
    background: #fffdf7;
  }

  .performance-frame canvas {
    width: 100%;
    height: 100%;
    min-height: 620px;
    display: block;
    border: 1px solid rgba(24, 24, 27, 0.12);
    background: #fffdf7;
  }

  .performance-sidebar {
    min-height: 0;
    overflow-y: auto;
    border-left: 1px solid rgba(24, 24, 27, 0.08);
    background: #f8f5ee;
  }

  .intent-grid {
    display: grid;
    grid-template-columns: 78px minmax(0, 1fr);
    gap: 8px 10px;
    align-items: baseline;
    padding-top: 4px;
  }

  .intent-grid small {
    color: rgba(24, 24, 27, 0.52);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .intent-grid strong {
    min-width: 0;
    overflow-wrap: anywhere;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.86rem;
  }

  @media (max-width: 1180px) {
    .workbench-shell {
      grid-template-columns: 38px minmax(0, 1fr) 220px;
    }

    .performance-shell {
      grid-template-columns: minmax(0, 1fr) 260px;
    }

    .feature-console {
      grid-template-columns: 1fr;
      grid-auto-rows: minmax(0, 1fr);
    }
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

    .card-head,
    .chart-meta,
    .market-line,
    .card-label-row,
    .readout-bar,
    .sidebar-head,
    .watch-head,
    .watch-body article,
    .feature-title-row {
      flex-wrap: wrap;
    }

    .workbench-shell {
      grid-template-columns: 1fr;
    }

    .performance-shell {
      grid-template-columns: 1fr;
    }

    .performance-frame canvas {
      min-height: 560px;
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
    .feature-card,
    .workbench-main,
    .workbench-footer {
      grid-template-rows: none;
    }
  }
</style>
