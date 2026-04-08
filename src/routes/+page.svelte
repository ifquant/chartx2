<script lang="ts">
  import { onMount, tick } from "svelte";
  import { getChartxFoundation, type PhaseOneReadoutDetail } from "$lib/chartx/public";
  import {
    FEATURE_TABS,
    mountFeatureDemo,
    mountWorkbenchDemo,
    type DemoAction,
    type DemoController,
    type DemoSnapshot,
    type FeatureExampleDescriptor,
    type FeatureTabId,
  } from "$lib/demo/chartx-demo";

  type TopTabId = "workbench" | FeatureTabId;

  const foundation = getChartxFoundation();
  const topTabs: Array<{ id: TopTabId; label: string; available: boolean }> = [
    { id: "workbench", label: "Workbench", available: true },
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
    series: [],
  });

  const emptySnapshot = (title: string, summary: string): DemoSnapshot => ({
    title,
    summary,
    metrics: [],
    eventLog: [],
  });

  let activeTopTab: TopTabId = "workbench";

  let workbenchCanvas: HTMLCanvasElement | undefined;
  let featureCanvas: HTMLCanvasElement | undefined;

  let workbenchController: DemoController | null = null;
  let featureController: DemoController | null = null;

  let workbenchReadout = emptyReadout();
  let featureReadout = emptyReadout();

  let workbenchSnapshot = emptySnapshot(
    "Workbench",
    "Mounting the default workstation example.",
  );
  let featureSnapshot = emptySnapshot("Feature", "Mounting the focused example.");

  let workbenchActions: readonly DemoAction[] = [];
  let featureActions: readonly DemoAction[] = [];

  let workbenchError = "";
  let featureError = "";
  let teardownWorkbenchReadout: (() => void) | null = null;
  let teardownFeatureReadout: (() => void) | null = null;

  onMount(() => {
    void tick().then(() => {
      mountWorkbench();
    });

    return () => {
      teardownWorkbench();
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
      teardownFeature();
      activeTopTab = "workbench";
      await tick();
      mountWorkbench();
      return;
    }

    const descriptor = featureDescriptor(tabId);
    if (!descriptor?.available) {
      return;
    }

    teardownWorkbench();
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

  function runWorkbenchAction(actionId: string): void {
    workbenchController?.runAction(actionId);
    workbenchActions = workbenchController?.actions() ?? [];
  }

  function runFeatureAction(actionId: string): void {
    featureController?.runAction(actionId);
    featureActions = featureController?.actions() ?? [];
  }

  function formatValue(value: number | null, digits = 2): string {
    return value === null
      ? "--"
      : value.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: digits,
        });
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

  function actionClass(tone: DemoAction["tone"]): string {
    if (tone === "accent") {
      return "action-btn accent";
    }
    if (tone === "danger") {
      return "action-btn danger";
    }
    return "action-btn";
  }

  $: activeSnapshot = activeTopTab === "workbench" ? workbenchSnapshot : featureSnapshot;
  $: activeFeatureSummary =
    activeTopTab === "workbench" ? null : featureDescriptor(activeTopTab);
  $: completedPhaseOneSteps = foundation.phaseOneSteps.filter(
    (step) => step.status === "complete",
  ).length;
</script>

<svelte:head>
  <title>chartx2 | Demo Shell</title>
</svelte:head>

<main class="app-shell">
  <header class="topbar">
    <div class="brand-block">
      <span class="app-mark">chartx2</span>
      <div class="symbol-block">
        <strong>NDX</strong>
        <small>NASDAQ 100</small>
      </div>
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
              <button>Indicators</button>
              <button>Alert</button>
              <button>Replay</button>
            </div>
          </div>

          <div class="workbench-shell">
            <aside class="tool-rail">
              <button>＋</button>
              <button>⌖</button>
              <button>／</button>
              <button>⌗</button>
              <button>T</button>
              <button>☺</button>
              <button>⊕</button>
              <button>⌂</button>
            </aside>

            <div class="workbench-main">
              <div class="chart-meta">
                <div class="market-line">
                  <strong>Nasdaq 100 Index</strong>
                  <span>1D</span>
                  <span>NASDAQ</span>
                  <span>O {formatValue(workbenchReadout.open)}</span>
                  <span>H {formatValue(workbenchReadout.high)}</span>
                  <span>L {formatValue(workbenchReadout.low)}</span>
                  <span>C {formatValue(workbenchReadout.close)}</span>
                </div>
                <div class="market-line">
                  <span>Pane {workbenchReadout.paneIndex === null ? "--" : workbenchReadout.paneIndex + 1}</span>
                  <span>{formatTime(workbenchReadout.time)}</span>
                </div>
              </div>

              <div class="chart-frame-shell">
                <div class="quote-cards">
                  <article class="quote-card sell">
                    <strong>{formatValue(workbenchReadout.close)}</strong>
                    <small>SELL</small>
                  </article>
                  <article class="quote-card buy">
                    <strong>{formatValue(workbenchReadout.close)}</strong>
                    <small>BUY</small>
                  </article>
                </div>

                <div class="chart-frame">
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
                  {/if}
                </div>
              </div>

              <div class="readout-bar">
                <span>Pane {workbenchReadout.paneIndex === null ? "--" : workbenchReadout.paneIndex + 1}</span>
                <span>O {formatValue(workbenchReadout.open)}</span>
                <span>H {formatValue(workbenchReadout.high)}</span>
                <span>L {formatValue(workbenchReadout.low)}</span>
                <span>C {formatValue(workbenchReadout.close)}</span>
                {#each workbenchReadout.series as series}
                  <span class="series-pill" style={`--series-color: ${series.color};`}>
                    {series.label} {formatValue(series.value)}
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
                <div class="action-strip">
                  {#each workbenchActions as action}
                    <button
                      class={actionClass(action.tone)}
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
                <strong class="big-price">{formatValue(workbenchReadout.close)}</strong>
                <div class="metric-list compact">
                  {#each workbenchSnapshot.metrics.slice(0, 3) as metric}
                    <article>
                      <small>{metric.label}</small>
                      <strong>{metric.value}</strong>
                    </article>
                  {/each}
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
            <span>O {formatValue(featureReadout.open)}</span>
            <span>H {formatValue(featureReadout.high)}</span>
            <span>L {formatValue(featureReadout.low)}</span>
            <span>C {formatValue(featureReadout.close)}</span>
            {#each featureReadout.series as series}
              <span class="series-pill" style={`--series-color: ${series.color};`}>
                {series.label} {formatValue(series.value)}
              </span>
            {/each}
          </div>

          <div class="action-strip">
            {#each featureActions as action}
              <button
                class={actionClass(action.tone)}
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
    --shell-gap: 14px;
    --topbar-height: clamp(82px, 9.2vh, 98px);
    --card-head-height: 60px;
    --readout-height: 52px;
    --action-strip-height: 48px;
    --feature-console-height: clamp(124px, 15vh, 156px);
    height: 100vh;
    padding: clamp(14px, 1.8vw, 24px);
    box-sizing: border-box;
    overflow: hidden;
    display: grid;
    grid-template-rows: var(--topbar-height) minmax(0, 1fr);
    gap: var(--shell-gap);
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 28%),
      linear-gradient(180deg, #f7f3eb 0%, #f1ede5 100%);
  }

  .topbar,
  .layout-grid,
  .demo-card {
    box-sizing: border-box;
  }

  .topbar {
    display: grid;
    grid-template-columns: minmax(180px, 240px) minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    height: 100%;
    min-height: 0;
    padding: 14px 18px;
    border: 1px solid rgba(24, 24, 27, 0.08);
    border-radius: 24px;
    background: rgba(255, 252, 246, 0.9);
    box-shadow: 0 14px 40px rgba(34, 32, 28, 0.06);
    overflow: hidden;
  }

  .card-head h3,
  .sidebar-head h4 {
    margin: 0;
  }

  .brand-block {
    display: inline-grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .app-mark {
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(24, 24, 27, 0.48);
  }

  .symbol-block {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .symbol-block strong {
    font-size: clamp(1.35rem, 1.2rem + 1vw, 2rem);
    line-height: 1;
  }

  .symbol-block small {
    color: rgba(24, 24, 27, 0.52);
    font-size: 0.82rem;
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
    gap: 8px;
    padding: 6px;
    border-radius: 18px;
    background: rgba(24, 24, 27, 0.04);
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
    padding: 9px 13px;
    border-radius: 999px;
    background: transparent;
    color: rgba(24, 24, 27, 0.64);
    font: inherit;
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
    min-width: 58px;
    padding: 8px 12px;
    border-radius: 14px;
    background: rgba(24, 24, 27, 0.04);
    white-space: nowrap;
  }

  .status-chip span {
    color: rgba(24, 24, 27, 0.74);
    font-size: 1rem;
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
    gap: 16px;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    padding: 20px;
    border-radius: 28px;
    border: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(255, 252, 246, 0.9);
    box-shadow: 0 18px 48px rgba(38, 33, 24, 0.07);
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
    gap: 12px;
    align-items: center;
    justify-content: flex-start;
    min-height: var(--action-strip-height);
    overflow-x: auto;
    overflow-y: hidden;
    min-width: 0;
    scrollbar-width: none;
  }

  .action-strip::-webkit-scrollbar {
    display: none;
  }

  .toolbar-strip {
    display: flex;
    flex-wrap: nowrap;
    gap: 10px;
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
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(24, 24, 27, 0.05);
    font: inherit;
    font-weight: 600;
    color: rgba(24, 24, 27, 0.75);
  }

  .workbench-shell {
    display: grid;
    grid-template-columns: 50px minmax(0, 1fr) 248px;
    gap: 16px;
    align-items: stretch;
    min-height: 0;
    overflow: hidden;
  }

  .tool-rail {
    display: grid;
    gap: 10px;
    align-content: start;
  }

  .tool-rail button {
    width: 50px;
    height: 50px;
    border-radius: 16px;
    background: rgba(24, 24, 27, 0.04);
    color: rgba(24, 24, 27, 0.84);
    font: inherit;
  }

  .workbench-main {
    display: grid;
    grid-template-rows: 58px minmax(0, 1fr) var(--readout-height) 94px;
    gap: 14px;
    min-height: 0;
    overflow: hidden;
  }

  .chart-meta {
    min-height: 58px;
    min-width: 0;
    overflow: hidden;
  }

  .market-line {
    color: rgba(24, 24, 27, 0.66);
    font-size: 0.95rem;
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
  }

  .quote-cards {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 2;
    display: flex;
    gap: 12px;
  }

  .quote-card {
    min-width: 112px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(24, 24, 27, 0.08);
    box-shadow: 0 14px 28px rgba(26, 25, 21, 0.08);
  }

  .quote-card strong,
  .quote-card small {
    display: block;
  }

  .quote-card.sell strong {
    color: #c7543e;
  }

  .quote-card.buy strong {
    color: #365cb7;
  }

  .chart-frame {
    height: 100%;
    min-height: 0;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(24, 24, 27, 0.09);
    background: #fffdf7;
  }

  .feature-frame {
    min-height: 0;
  }

  .feature-console {
    display: grid;
    grid-template-columns: 1.1fr 1.5fr 1fr;
    gap: 12px;
    min-height: var(--feature-console-height);
  }

  .feature-console-card {
    min-height: 0;
    overflow: hidden;
    padding: 12px 14px;
    border-radius: 18px;
    background: rgba(24, 24, 27, 0.04);
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
    padding: 12px 14px;
    border-radius: 18px;
    background: rgba(24, 24, 27, 0.04);
    color: rgba(24, 24, 27, 0.72);
    font-size: 0.95rem;
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
    padding: 8px 12px;
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
    grid-template-rows: 40px var(--action-strip-height);
    gap: 10px;
    min-height: 0;
  }

  .time-strip {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .time-strip::-webkit-scrollbar {
    display: none;
  }

  .time-strip button.active {
    background: #18181b;
    color: #fffdf8;
  }

  .action-btn {
    padding: 11px 16px;
    border-radius: 14px;
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

  .workbench-sidebar {
    display: grid;
    grid-template-rows: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
    min-height: 0;
    overflow: hidden;
  }

  .mini-card {
    padding: 16px;
    border-radius: 22px;
    border: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(255, 252, 246, 0.9);
    box-shadow: 0 14px 34px rgba(38, 33, 24, 0.06);
  }

  .watch-head,
  .watch-body {
    color: rgba(24, 24, 27, 0.58);
    font-size: 0.88rem;
  }

  .watch-body {
    display: grid;
    gap: 10px;
    margin-top: 12px;
    align-content: start;
    overflow: hidden;
  }

  .watch-body strong {
    color: #18181b;
  }

  .big-price {
    display: block;
    margin-top: 8px;
    font-size: 2rem;
  }

  .price-meta {
    margin: 8px 0 0;
    line-height: 1.55;
    color: rgba(24, 24, 27, 0.7);
  }

  .metric-list {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .metric-list.compact {
    margin-top: 16px;
  }

  .compact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-list article {
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(24, 24, 27, 0.04);
  }

  .metric-list small {
    display: block;
    margin-bottom: 4px;
    color: rgba(24, 24, 27, 0.5);
  }

  .event-log {
    margin: 12px 0 0;
    padding-left: 18px;
    color: rgba(24, 24, 27, 0.72);
    display: grid;
    gap: 8px;
    overflow: hidden;
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
    background: rgba(199, 84, 62, 0.08);
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
      grid-template-columns: 44px minmax(0, 1fr) 220px;
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
      padding: 16px;
      grid-template-rows: auto minmax(0, 1fr);
    }

    .topbar {
      grid-template-columns: 1fr;
      height: auto;
      min-height: auto;
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
