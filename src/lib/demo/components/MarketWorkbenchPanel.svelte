<script lang="ts">
  import type {
    PhaseOneDrawingPropertyField,
    PhaseOneDrawingPropertyFieldSchema,
    PhaseOneReadoutDetail,
  } from "$lib/chartx/public/market";
  import type { ChartWorkbenchModel } from "$lib/chartx/public/workbench";
  import type {
    DemoAction,
    DemoSnapshot,
    WorkbenchDrawingTool,
  } from "$lib/demo/chartx-demo";

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
  export let onOpenWatchlistSymbol: (symbol: string) => void;
  export let onAddIndicator: (entryId: string) => void;
  export let onSaveLayout: () => void;
  export let onRestoreLayout: () => void;
  export let onResetLayout: () => void;
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
      <button>{workbench?.toolbar.replayLabel ?? "Replay"}</button>
      <button>{workbench?.toolbar.layoutLabel ?? "Layout single"}</button>
      <button on:click={onSaveLayout}>Save layout</button>
      <button on:click={onRestoreLayout}>Restore layout</button>
      <button on:click={onResetLayout}>Reset layout</button>
    </div>
  </div>

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

      <div class="chart-frame-shell">
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
            <canvas
              bind:this={canvasElement}
              aria-label="chartx2 phase-one chart harness"
            ></canvas>
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
              on:click={() => onRunAction(action.id)}
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
              type="button"
              on:click={() => onOpenWatchlistSymbol(item.symbol)}
            >
              <strong>{item.symbol}</strong>
              <span>{item.lastLabel}</span>
              <span>{item.changeLabel}</span>
            </button>
          {/each}
        </div>
      </section>

      <section class="mini-card watch-card">
        <div class="sidebar-head">
          <h4>{workbench?.rightSidebar.alerts.title ?? "Alerts"}</h4>
          <button>＋</button>
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
          {/each}
        </div>
      </section>

      <section class="mini-card indicator-card">
        <div class="sidebar-head">
          <h4>Indicators</h4>
          <span>{snapshot.activeIndicators?.length ?? 0} active</span>
        </div>
        <div class="indicator-list">
          {#each snapshot.indicatorCatalog ?? [] as entry}
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
          {:else}
            <p class="indicator-empty">No catalog entries published.</p>
          {/each}
        </div>
        <div class="active-indicator-list">
          {#each snapshot.activeIndicators ?? [] as indicator}
            <article>
              <strong>{indicator.label}</strong>
              <span>{indicator.placement}</span>
            </article>
          {:else}
            <p class="indicator-empty">No active indicators.</p>
          {/each}
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
    grid-template-rows: var(--card-head-height, 38px) minmax(0, 1fr);
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
    height: var(--card-head-height, 38px);
    align-items: center;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    padding: 0 10px;
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
  .time-strip::-webkit-scrollbar {
    display: none;
  }

  .toolbar-strip button,
  .time-strip button,
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
    grid-template-rows: 28px auto var(--action-strip-height, 40px);
    gap: 0;
    min-height: 0;
    background: rgba(244, 240, 232, 0.96);
  }

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

  .indicator-list,
  .active-indicator-list {
    display: grid;
    gap: 6px;
    margin-top: 8px;
  }

  .indicator-entry {
    display: grid;
    gap: 2px;
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
