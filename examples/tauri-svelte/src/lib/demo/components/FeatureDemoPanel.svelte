<script lang="ts">
  import type { PhaseOneReadoutDetail } from "@chartx2/library";
  import type { DemoAction, DemoSnapshot } from "$lib/demo/chartx-demo";

  export let title: string | undefined;
  export let summary: string | undefined;
  export let canvasElement: HTMLCanvasElement | undefined = undefined;
  export let error = "";
  export let readout: PhaseOneReadoutDetail;
  export let actions: readonly DemoAction[] = [];
  export let snapshot: DemoSnapshot;
  export let onRunAction: (actionId: string) => void;

  function actionClass(tone: DemoAction["tone"]): string {
    if (tone === "accent") {
      return "action-btn accent";
    }
    if (tone === "danger") {
      return "action-btn danger";
    }
    return "action-btn";
  }
</script>

<article class="demo-card feature-card" data-demo-tab="feature">
  <div class="card-head compact-head feature-header">
    <div class="feature-title-row">
      <h3>{title}</h3>
      <span class="feature-summary-inline">{summary}</span>
    </div>
  </div>

  <div class="chart-frame feature-frame">
    {#if error}
      <div class="error-state">
        <p class="error-label">chart init failure</p>
        <p>{error}</p>
      </div>
    {:else}
      <canvas
        bind:this={canvasElement}
        aria-label="chartx2 feature demo chart"
      ></canvas>
    {/if}
  </div>

  <div class="readout-bar feature-readout">
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

  <div class="action-strip">
    {#each actions as action}
      <button
        class={`${actionClass(action.tone)} ${action.active ? "active" : ""}`}
        on:click={() => onRunAction(action.id)}
      >
        {action.label}
      </button>
    {/each}
  </div>

  <section class="feature-console">
    <article class="feature-console-card">
      <small>Summary</small>
      <p>{snapshot.summary}</p>
    </article>

    <article class="feature-console-card">
      <small>Metrics</small>
      <div class="feature-metric-grid">
        {#each snapshot.metrics as metric}
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
        {#if snapshot.eventLog.length === 0}
          <li>Waiting for the first chart event.</li>
        {:else}
          {#each snapshot.eventLog as entry}
            <li>{entry}</li>
          {/each}
        {/if}
      </ul>
    </article>
  </section>
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

  .feature-card {
    grid-template-rows:
      var(--card-head-height, 38px)
      minmax(0, 1fr)
      var(--readout-height, 36px)
      var(--action-strip-height, 40px)
      var(--feature-console-height, clamp(110px, 13vh, 144px));
  }

  .card-head,
  .readout-bar,
  .feature-title-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: nowrap;
  }

  .card-head h3 {
    margin: 0;
  }

  .compact-head {
    height: var(--card-head-height, 38px);
    align-items: center;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    padding: 0 10px;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: rgba(248, 245, 237, 0.92);
  }

  .feature-header {
    justify-content: flex-start;
  }

  .feature-title-row {
    display: inline-flex;
    align-items: baseline;
    gap: 16px;
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

  .chart-frame {
    position: relative;
    height: 100%;
    min-height: 0;
    border-radius: 0;
    overflow: hidden;
    border: 0;
    background: #fffdf7;
  }

  .feature-frame {
    min-height: 0;
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
    min-height: var(--readout-height, 36px);
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

  .action-strip {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    align-items: center;
    justify-content: flex-start;
    min-height: var(--action-strip-height, 40px);
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

  .action-btn {
    padding: 8px 12px;
    border: 0;
    border-radius: 8px;
    background: rgba(24, 24, 27, 0.05);
    color: rgba(24, 24, 27, 0.86);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 120ms ease,
      background 120ms ease,
      color 120ms ease;
  }

  .action-btn.active,
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

  .feature-console {
    display: grid;
    grid-template-columns: 1.1fr 1.5fr 1fr;
    gap: 0;
    min-height: var(--feature-console-height, clamp(110px, 13vh, 144px));
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
    .feature-console {
      grid-template-columns: 1fr;
      grid-auto-rows: minmax(0, 1fr);
    }
  }

  @media (max-width: 840px) {
    .card-head,
    .readout-bar,
    .feature-title-row {
      flex-wrap: wrap;
    }
  }
</style>
