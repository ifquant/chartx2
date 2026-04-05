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
  $: activeReadout = activeTopTab === "workbench" ? workbenchReadout : featureReadout;
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
      <p class="eyebrow">chartx2</p>
      <h1>NDX</h1>
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
      <strong>{completedPhaseOneSteps}/{foundation.phaseOneSteps.length}</strong>
      <span>phase-one steps complete</span>
    </div>
  </header>

  <section class:feature-layout={activeTopTab !== "workbench"} class="layout-grid">
    <section class="main-column">
      {#if activeTopTab === "workbench"}
        <article class="demo-card" data-demo-tab="workbench">
          <div class="card-head">
            <div>
              <p class="eyebrow">Complete Example</p>
              <h3>Workbench</h3>
            </div>
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
                <p class="price-meta">{workbenchSnapshot.featureGap}</p>
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
                <h4>Workbench Notes</h4>
                <p>{workbenchSnapshot.note}</p>
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
        <article class="demo-card" data-demo-tab="feature">
          <div class="card-head">
            <div>
              <p class="eyebrow">Focused Example</p>
              <h3>{activeFeatureSummary?.label}</h3>
            </div>
            <p class="head-copy">{activeFeatureSummary?.summary}</p>
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
              <strong>{activeSnapshot.title}</strong>
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

    {#if activeTopTab === "workbench"}
    <aside class="context-rail">
      <section class="context-card summary-card">
        <p class="eyebrow">{activeTopTab === "workbench" ? "Workbench" : "Feature Demo"}</p>
        <h3>{activeSnapshot.title}</h3>
        <p>{activeSnapshot.summary}</p>
      </section>

      <section class="context-card dashboard-card">
        <div class="card-label-row">
          <span class="eyebrow">Current Readout</span>
          <span>{formatTime(activeReadout.time)}</span>
        </div>
        <div class="readout-grid compact-grid">
          <article>
            <small>Open</small>
            <strong>{formatValue(activeReadout.open)}</strong>
          </article>
          <article>
            <small>High</small>
            <strong>{formatValue(activeReadout.high)}</strong>
          </article>
          <article>
            <small>Low</small>
            <strong>{formatValue(activeReadout.low)}</strong>
          </article>
          <article>
            <small>Close</small>
            <strong>{formatValue(activeReadout.close)}</strong>
          </article>
        </div>

        <div class="card-label-row metrics-head">
          <span class="eyebrow">Metrics</span>
          <span>{activeSnapshot.metrics.length}</span>
        </div>
        <div class="metric-list compact-grid">
          {#each activeSnapshot.metrics as metric}
            <article>
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
            </article>
          {/each}
        </div>
      </section>

      <section class="context-card activity-card">
        <div class="card-label-row">
          <span class="eyebrow">Activity</span>
          <span>{activeSnapshot.eventLog.length}</span>
        </div>
        <ul class="event-log">
          {#if activeSnapshot.eventLog.length === 0}
            <li>Waiting for the first chart event.</li>
          {:else}
            {#each activeSnapshot.eventLog as entry}
              <li>{entry}</li>
            {/each}
          {/if}
        </ul>

        {#if activeSnapshot.note}
          <div class="context-copy">
            <small>Note</small>
            <p>{activeSnapshot.note}</p>
          </div>
        {/if}

        {#if activeSnapshot.featureGap}
          <div class="context-copy">
            <small>Current gap</small>
            <p>{activeSnapshot.featureGap}</p>
          </div>
        {/if}
      </section>
    </aside>
    {/if}
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
    height: 100vh;
    padding: 24px;
    box-sizing: border-box;
    overflow: hidden;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 18px;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 28%),
      linear-gradient(180deg, #f7f3eb 0%, #f1ede5 100%);
  }

  .topbar,
  .layout-grid,
  .demo-card,
  .context-card {
    box-sizing: border-box;
  }

  .topbar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 18px;
    align-items: center;
    padding: 18px 20px;
    border: 1px solid rgba(24, 24, 27, 0.08);
    border-radius: 24px;
    background: rgba(255, 252, 246, 0.9);
    box-shadow: 0 14px 40px rgba(34, 32, 28, 0.06);
  }

  .brand-block h1,
  .card-head h3,
  .context-card h3,
  .sidebar-head h4 {
    margin: 0;
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
    flex-wrap: wrap;
    gap: 10px;
    padding: 8px;
    border-radius: 18px;
    background: rgba(24, 24, 27, 0.04);
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
    padding: 10px 14px;
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
    display: grid;
    gap: 2px;
    justify-items: end;
    padding: 10px 14px;
    border-radius: 16px;
    background: rgba(24, 24, 27, 0.04);
  }

  .status-chip strong {
    font-size: 1.15rem;
  }

  .status-chip span {
    color: rgba(24, 24, 27, 0.58);
    font-size: 0.88rem;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 330px;
    gap: 18px;
    align-items: stretch;
    min-height: 0;
  }

  .main-column {
    min-width: 0;
    min-height: 0;
  }

  .feature-layout {
    grid-template-columns: 1fr;
  }

  .demo-card {
    display: grid;
    gap: 16px;
    height: 100%;
    min-height: 0;
    padding: 20px;
    border-radius: 28px;
    border: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(255, 252, 246, 0.9);
    box-shadow: 0 18px 48px rgba(38, 33, 24, 0.07);
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
    flex-wrap: wrap;
  }

  .head-copy {
    max-width: 460px;
    margin: 0;
    color: rgba(24, 24, 27, 0.68);
    line-height: 1.55;
  }

  .action-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: flex-start;
  }

  .toolbar-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .toolbar-strip button,
  .time-strip button,
  .sidebar-head button {
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(24, 24, 27, 0.05);
    font: inherit;
    font-weight: 600;
    color: rgba(24, 24, 27, 0.75);
  }

  .workbench-shell {
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr) 280px;
    gap: 16px;
    align-items: stretch;
    min-height: 0;
  }

  .tool-rail {
    display: grid;
    gap: 10px;
    align-content: start;
  }

  .tool-rail button {
    width: 54px;
    height: 54px;
    border-radius: 18px;
    background: rgba(24, 24, 27, 0.04);
    color: rgba(24, 24, 27, 0.84);
    font: inherit;
  }

  .workbench-main {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    gap: 14px;
    min-height: 0;
  }

  .market-line {
    color: rgba(24, 24, 27, 0.66);
    font-size: 0.95rem;
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
  }

  .feature-console-card {
    min-height: 0;
    padding: 14px 16px;
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
    margin: 8px 0 0;
    color: rgba(24, 24, 27, 0.7);
    line-height: 1.45;
  }

  .feature-metric-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .feature-metric-grid span {
    display: block;
    color: rgba(24, 24, 27, 0.52);
    font-size: 0.82rem;
    margin-bottom: 2px;
  }

  .feature-activity {
    margin: 0;
    padding-left: 18px;
    color: rgba(24, 24, 27, 0.72);
    display: grid;
    gap: 8px;
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
  }

  .feature-readout {
    min-height: 52px;
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
    gap: 12px;
  }

  .time-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
  }

  .mini-card,
  .context-card {
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
  }

  .watch-body strong {
    color: #18181b;
  }

  .big-price {
    display: block;
    margin-top: 8px;
    font-size: 2rem;
  }

  .price-meta,
  .context-card p {
    margin: 8px 0 0;
    line-height: 1.55;
    color: rgba(24, 24, 27, 0.7);
  }

  .context-rail {
    display: grid;
    grid-template-rows: auto minmax(0, 1.3fr) minmax(0, 1fr);
    gap: 14px;
    align-self: stretch;
    min-height: 0;
  }

  .readout-grid,
  .metric-list {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .metric-list.compact {
    margin-top: 16px;
  }

  .readout-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .compact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-card,
  .activity-card {
    min-height: 0;
    overflow: hidden;
  }

  .metrics-head {
    margin-top: 16px;
  }

  .readout-grid article,
  .metric-list article {
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(24, 24, 27, 0.04);
  }

  .readout-grid small,
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
  }

  .context-copy {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid rgba(24, 24, 27, 0.08);
  }

  .context-copy small {
    display: block;
    margin-bottom: 6px;
    color: rgba(24, 24, 27, 0.48);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    font-size: 0.72rem;
  }

  .context-copy p {
    margin: 0;
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

  @media (max-width: 1340px) {
    .workbench-shell {
      grid-template-columns: 54px minmax(0, 1fr);
    }

    .workbench-sidebar {
      grid-column: 1 / -1;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: none;
    }
  }

  @media (max-width: 1220px) {
    .layout-grid {
      grid-template-columns: 1fr;
    }

    .context-rail {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: none;
    }

    .feature-console {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .app-shell {
      padding: 16px;
    }

    .topbar,
    .workbench-shell {
      grid-template-columns: 1fr;
    }

    .tool-rail {
      grid-auto-flow: column;
      grid-template-columns: repeat(8, minmax(0, 1fr));
      overflow-x: auto;
    }

    .workbench-sidebar,
    .context-rail {
      grid-template-columns: 1fr;
      grid-template-rows: none;
    }

    .chart-frame {
      min-height: 420px;
    }
  }
</style>
