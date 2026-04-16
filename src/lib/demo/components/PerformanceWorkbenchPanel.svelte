<script lang="ts">
  import type { PerformanceDemoSnapshot } from "$lib/demo/performance-demo";
  import type { OptimizationMetricKey } from "$lib/chartx/public/performance";

  export let snapshot: PerformanceDemoSnapshot;
  export let reportCanvasElement: HTMLCanvasElement | undefined = undefined;
  export let optimizationCanvasElement: HTMLCanvasElement | undefined = undefined;
  export let formatValue: (value: number | null, digits?: number) => string;
  export let formatIntentTime: (value: number) => string;
  export let onOptimizationXAxisChange: (value: string) => void;
  export let onOptimizationYAxisChange: (value: string) => void;
  export let onOptimizationZMetricChange: (value: OptimizationMetricKey) => void;
  export let onOptimizationFilterValueChange: (value: string) => void;
  export let onOptimizationRenderModeChange: (value: "heatmap" | "scatter-3d" | "wireframe-3d" | "surface-3d" | "surface-zero-3d") => void;
  export let onOptimizationColorMetricChange: (value: "topology" | "robustness") => void;
  export let onOptimizationThresholdPlaneModeChange: (value: "none" | "z-zero") => void;

  const parameterOptions = ["fastLength", "slowLength", "threshold"];
  const renderModeOptions = ["heatmap", "scatter-3d", "wireframe-3d", "surface-3d", "surface-zero-3d"] as const;
  const colorMetricOptions = ["robustness", "topology"] as const;
  const thresholdPlaneOptions = [
    { value: "z-zero", label: "Z = 0" },
    { value: "none", label: "None" },
  ] as const;
  const zMetricOptions: OptimizationMetricKey[] = [
    "netProfit",
    "sharpe",
    "maxDrawdown",
    "profitFactor",
    "stabilityScore",
  ];
</script>

<article class="demo-card performance-card" data-demo-tab="performance">
  <div class="card-head compact-head feature-header">
    <div class="feature-title-row">
      <h3>{snapshot.title}</h3>
      <span class="feature-summary-inline">{snapshot.summary}</span>
    </div>
  </div>

  <div class="performance-shell">
    <div class="performance-frame">
      <section class="surface-shell">
        <div class="surface-controls">
          <label>
            <span>View</span>
            <select
              value={snapshot.optimization.renderMode}
              on:change={(event) =>
                onOptimizationRenderModeChange(
                  (event.currentTarget as HTMLSelectElement).value as
                    | "heatmap"
                    | "scatter-3d"
                    | "wireframe-3d"
                    | "surface-3d"
                    | "surface-zero-3d",
                )}
            >
              {#each renderModeOptions as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>X</span>
            <select
              value={snapshot.optimization.xParam}
              on:change={(event) => onOptimizationXAxisChange((event.currentTarget as HTMLSelectElement).value)}
            >
              {#each parameterOptions as option}
                <option value={option} disabled={option === snapshot.optimization.yParam}>{option}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Y</span>
            <select
              value={snapshot.optimization.yParam}
              on:change={(event) => onOptimizationYAxisChange((event.currentTarget as HTMLSelectElement).value)}
            >
              {#each parameterOptions as option}
                <option value={option} disabled={option === snapshot.optimization.xParam}>{option}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Z</span>
            <select
              value={snapshot.optimization.zMetric}
              on:change={(event) => onOptimizationZMetricChange((event.currentTarget as HTMLSelectElement).value as OptimizationMetricKey)}
            >
              {#each zMetricOptions as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Color</span>
            <select
              value={snapshot.optimization.colorMetric}
              on:change={(event) =>
                onOptimizationColorMetricChange((event.currentTarget as HTMLSelectElement).value as "topology" | "robustness")}
            >
              {#each colorMetricOptions as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Plane</span>
            <select
              value={snapshot.optimization.thresholdPlaneMode}
              on:change={(event) =>
                onOptimizationThresholdPlaneModeChange((event.currentTarget as HTMLSelectElement).value as "none" | "z-zero")}
            >
              {#each thresholdPlaneOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </label>
          {#if snapshot.optimization.filterKey}
            <label>
              <span>{snapshot.optimization.filterKey}</span>
              <select
                value={snapshot.optimization.filterValue ?? ""}
                on:change={(event) => onOptimizationFilterValueChange((event.currentTarget as HTMLSelectElement).value)}
              >
                {#each snapshot.optimization.filterOptions as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
            </label>
          {/if}
        </div>

        <canvas
          bind:this={optimizationCanvasElement}
          aria-label="chartx2 optimization surface canvas"
        ></canvas>
        {#if snapshot.optimization.renderMode !== "heatmap"}
          <p class="surface-hint">Drag inside the surface to rotate the 3D camera. Click a point to switch the active run.</p>
        {/if}
      </section>

      <canvas
        bind:this={reportCanvasElement}
        aria-label="chartx2 performance report canvas"
      ></canvas>
    </div>

    <aside class="performance-sidebar">
      <section class="mini-card symbol-card">
        <div class="sidebar-head">
          <h4>Run</h4>
          <span>{snapshot.optimization.selectedRunId ?? "--"}</span>
        </div>
        <p class="run-label">{snapshot.optimization.runLabel}</p>
        <div class="metric-list compact">
          {#each snapshot.metrics as metric}
            <article>
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
            </article>
          {/each}
        </div>
      </section>

      <section class="mini-card inspector-card">
        <div class="sidebar-head">
          <h4>Run Intent</h4>
          <span>{snapshot.optimization.selectedRunIntent?.runId ?? "None"}</span>
        </div>
        {#if snapshot.optimization.selectedRunIntent}
          <div class="intent-grid">
            <small>Run</small>
            <strong>{snapshot.optimization.selectedRunIntent.runId}</strong>
            <small>Strategy</small>
            <strong>{snapshot.optimization.selectedRunIntent.strategyId}</strong>
            <small>Params</small>
            <strong>{snapshot.optimization.runLabel}</strong>
            <small>Source</small>
            <strong>{snapshot.optimization.selectedRunIntent.sourceReportId}</strong>
          </div>
        {:else}
          <p class="inspector-empty">Click a heatmap cell to emit a RunLocationIntent and switch the performance report.</p>
        {/if}
      </section>

      <section class="mini-card inspector-card">
        <div class="sidebar-head">
          <h4>Trade Intent</h4>
          <span>{snapshot.selectedTradeIntent?.tradeId ?? "None"}</span>
        </div>
        {#if snapshot.selectedTradeIntent}
          <div class="intent-grid">
            <small>Symbol</small>
            <strong>{snapshot.selectedTradeIntent.symbol}</strong>
            <small>Side</small>
            <strong>{snapshot.selectedTradeIntent.side}</strong>
            <small>Entry</small>
            <strong>{formatIntentTime(snapshot.selectedTradeIntent.entryTime)}</strong>
            <small>Exit</small>
            <strong>{formatIntentTime(snapshot.selectedTradeIntent.exitTime)}</strong>
            <small>Entry Px</small>
            <strong>{formatValue(snapshot.selectedTradeIntent.entryPrice)}</strong>
            <small>Exit Px</small>
            <strong>{formatValue(snapshot.selectedTradeIntent.exitPrice)}</strong>
            <small>P&amp;L</small>
            <strong>{formatValue(snapshot.selectedTradeIntent.realizedPnl, 0)}</strong>
            <small>Source</small>
            <strong>{snapshot.selectedTradeIntent.sourceChartId}</strong>
          </div>
        {:else}
          <p class="inspector-empty">Click an equity point or trade row to emit a TradeLocationIntent.</p>
        {/if}
      </section>

      <section class="mini-card action-card">
        <h4>Activity</h4>
        <ul class="event-log">
          {#if snapshot.eventLog.length === 0}
            <li>Waiting for performance report events.</li>
          {:else}
            {#each snapshot.eventLog as entry}
              <li>{entry}</li>
            {/each}
          {/if}
        </ul>
      </section>
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

  .performance-card {
    grid-template-rows: var(--card-head-height, 38px) minmax(0, 1fr);
  }

  .card-head,
  .sidebar-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: nowrap;
  }

  .card-head h3,
  .sidebar-head h4 {
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
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 12px;
    background: #fffdf7;
  }

  .performance-frame canvas {
    width: 100%;
    display: block;
    border: 1px solid rgba(24, 24, 27, 0.12);
    background: #fffdf7;
  }

  .surface-shell {
    display: grid;
    gap: 8px;
  }

  .surface-shell canvas {
    height: 300px;
  }

  .performance-frame > canvas {
    min-height: 620px;
    height: 100%;
  }

  .surface-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .surface-controls label {
    display: inline-grid;
    gap: 4px;
    min-width: 110px;
  }

  .surface-hint {
    margin: 0;
    color: rgba(24, 24, 27, 0.58);
    font-size: 0.76rem;
  }

  .surface-controls span {
    color: rgba(24, 24, 27, 0.52);
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .surface-controls select {
    border: 1px solid rgba(24, 24, 27, 0.12);
    background: rgba(255, 255, 255, 0.84);
    padding: 6px 8px;
    font: inherit;
  }

  .run-label {
    margin: 10px 0 0;
    color: rgba(24, 24, 27, 0.66);
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .performance-sidebar {
    min-height: 0;
    overflow-y: auto;
    border-left: 1px solid rgba(24, 24, 27, 0.08);
    background: #f8f5ee;
  }

  .mini-card {
    padding: 10px 12px;
    border-radius: 0;
    border: 0;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: transparent;
    box-shadow: none;
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

  @media (max-width: 1180px) {
    .performance-shell {
      grid-template-columns: minmax(0, 1fr) 260px;
    }
  }

  @media (max-width: 840px) {
    .card-head,
    .sidebar-head,
    .feature-title-row {
      flex-wrap: wrap;
    }

    .performance-shell {
      grid-template-columns: 1fr;
    }

    .performance-frame canvas {
      min-height: 560px;
    }
  }
</style>
