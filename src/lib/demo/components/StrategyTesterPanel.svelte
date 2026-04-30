<script lang="ts">
  import type {
    StrategyTesterEquityPoint,
    StrategyTesterPanelModel,
    StrategyTesterSummaryMetric,
    StrategyTesterTradeRow,
  } from "$lib/chartx/public/strategy-tester";

  const EMPTY_PANEL: StrategyTesterPanelModel = {
    title: "Strategy Tester",
    summaryMetrics: [],
    tabs: [],
    trades: [],
    equityCurve: [],
    state: {
      status: "empty",
      activeTabId: "overview",
      emptyLabel: "No strategy test selected.",
    },
  };

  export let model: StrategyTesterPanelModel = EMPTY_PANEL;

  function metricToneClass(metric: StrategyTesterSummaryMetric): string {
    if (metric.tone === "positive") {
      return "metric-card positive";
    }
    if (metric.tone === "negative") {
      return "metric-card negative";
    }
    return "metric-card";
  }

  function tradeSideClass(trade: StrategyTesterTradeRow): string {
    return trade.side === "long" ? "trade-side long" : "trade-side short";
  }

  function pointStyle(
    point: StrategyTesterEquityPoint,
    index: number,
    points: readonly StrategyTesterEquityPoint[],
  ): string {
    if (points.length <= 1) {
      return "left: 0%; bottom: 50%;";
    }
    const maxValue = Math.max(...points.map((entry) => entry.value));
    const minValue = Math.min(...points.map((entry) => entry.value));
    const horizontal = (index / (points.length - 1)) * 100;
    const span = maxValue - minValue;
    const vertical = span === 0 ? 50 : ((point.value - minValue) / span) * 100;
    return `left: ${horizontal}%; bottom: ${vertical}%;`;
  }

  let activeTabId = model.state.activeTabId;
  let selectedTradeId: string | null = null;
  let lastModelStateKey = "";

  function syncSelectionForTab(nextTabId: string): void {
    activeTabId = nextTabId;
    if (selectedTradeId === null) {
      return;
    }
    const stillPresent = model.trades.some((trade) => trade.id === selectedTradeId);
    if (!stillPresent) {
      selectedTradeId = null;
    }
  }

  function selectTrade(tradeId: string | null): void {
    selectedTradeId = tradeId;
  }

  function pointIsActive(point: StrategyTesterEquityPoint): boolean {
    if (selectedTradeId !== null) {
      return point.tradeId === selectedTradeId;
    }
    return point.active ?? false;
  }

  function tradeIsActive(trade: StrategyTesterTradeRow): boolean {
    if (selectedTradeId !== null) {
      return trade.id === selectedTradeId;
    }
    return false;
  }

  $: state = model.state;
  $: {
    const nextModelStateKey = `${model.title}:${model.runLabel ?? ""}:${model.state.activeTabId}`;
    if (nextModelStateKey !== lastModelStateKey) {
      lastModelStateKey = nextModelStateKey;
      selectedTradeId = null;
      activeTabId = model.state.activeTabId;
    }
  }
  $: if (model.tabs.every((tab) => tab.id !== activeTabId)) {
    activeTabId = model.state.activeTabId;
  }
  $: activeTab = model.tabs.find((tab) => tab.id === activeTabId) ?? model.tabs[0] ?? null;
  $: hasSummary = model.summaryMetrics.length > 0;
  $: hasTrades = model.trades.length > 0;
  $: hasEquity = model.equityCurve.length > 0;
  $: showSummary = activeTabId === "overview" || activeTabId === "ratios" || activeTabId === "trades";
  $: showEquity = activeTabId === "overview" || activeTabId === "trades";
  $: showTrades = activeTabId === "trades" || activeTabId === "list";
</script>

<section
  class="strategy-tester-panel"
  data-strategy-tester-panel
  data-strategy-tester-state={state.status}
  data-strategy-tester-active-tab={activeTabId}
>
  <header class="panel-header">
    <div>
      <p class="eyebrow">Strategy Tester</p>
      <h2>{model.title}</h2>
    </div>
    {#if model.runLabel}
      <p class="run-label" data-strategy-tester-run>{model.runLabel}</p>
    {/if}
  </header>

  {#if model.tabs.length > 0}
    <nav class="tabs" aria-label="Strategy tester tabs" data-strategy-tester-tabs>
      {#each model.tabs as tab}
        <button
          type="button"
          class:active={tab.id === activeTabId}
          class:disabled={tab.disabled}
          class="tab-chip"
          data-strategy-tester-tab={tab.id}
          data-strategy-tester-tab-active={tab.id === activeTabId ? "true" : "false"}
          data-strategy-tester-tab-disabled={tab.disabled ? "true" : "false"}
          disabled={tab.disabled}
          aria-pressed={tab.id === activeTabId ? "true" : "false"}
          on:click={() => {
            if (tab.disabled) {
              return;
            }
            syncSelectionForTab(tab.id);
          }}
        >
          <span>{tab.label}</span>
          {#if tab.badgeLabel}
            <span class="tab-badge">{tab.badgeLabel}</span>
          {/if}
        </button>
      {/each}
    </nav>
  {/if}

  {#if state.status === "error"}
    <div class="state-banner error" data-strategy-tester-error>
      <strong>Error</strong>
      <span>{state.errorLabel ?? "The strategy tester could not load."}</span>
    </div>
  {:else if state.status === "empty"}
    <div class="state-banner empty" data-strategy-tester-empty>
      <strong>Empty</strong>
      <span>{state.emptyLabel ?? "No strategy tester data is available yet."}</span>
    </div>
  {:else}
    {#if state.status === "loading"}
      <div class="state-banner loading" data-strategy-tester-loading>
        <strong>Loading</strong>
        <span>{state.statusLabel ?? "Preparing strategy tester data."}</span>
      </div>
    {/if}

    <div class="panel-grid">
      {#if showSummary}
      <section class="summary-card" data-strategy-tester-section="summary">
        <div class="section-header">
          <h3>Summary</h3>
          {#if activeTab}
            <span class="section-detail" data-strategy-tester-active-tab-label>{activeTab.label}</span>
          {/if}
        </div>
        {#if hasSummary}
          <div class="metric-grid">
            {#each model.summaryMetrics as metric}
              <article
                class={metricToneClass(metric)}
                data-strategy-tester-metric={metric.id}
              >
                <p class="metric-label">{metric.label}</p>
                <strong class="metric-value">{metric.valueLabel}</strong>
                {#if metric.detailLabel}
                  <span class="metric-detail">{metric.detailLabel}</span>
                {/if}
              </article>
            {/each}
          </div>
        {:else}
          <p class="section-empty" data-strategy-tester-summary-empty>No summary metrics.</p>
        {/if}
      </section>
      {/if}

      {#if showEquity}
      <section class="equity-card" data-strategy-tester-section="equity">
        <div class="section-header">
          <h3>Equity Curve</h3>
          <span class="section-detail">{model.equityCurve.length} points</span>
        </div>
        {#if hasEquity}
          <div class="equity-viewport" data-strategy-tester-equity>
            {#each model.equityCurve as point, index}
              <button
                type="button"
                class:active={pointIsActive(point)}
                class="equity-point"
                style={pointStyle(point, index, model.equityCurve)}
                data-strategy-tester-equity-point={point.id}
                data-strategy-tester-equity-active={pointIsActive(point) ? "true" : "false"}
                aria-label={`${point.timeLabel} ${point.equityLabel}`}
                on:click={() => selectTrade(point.tradeId ?? null)}
              ></button>
            {/each}
          </div>
          <div class="equity-footer">
            <div>
              <p class="section-detail">First</p>
              <strong>{model.equityCurve[0]?.equityLabel}</strong>
            </div>
            <div class="equity-last" data-strategy-tester-equity-last={model.equityCurve[model.equityCurve.length - 1]?.id ?? ""}>
              <p class="section-detail">Latest</p>
              <strong>{model.equityCurve[model.equityCurve.length - 1]?.equityLabel}</strong>
            </div>
          </div>
        {:else}
          <p class="section-empty" data-strategy-tester-equity-empty>No equity points.</p>
        {/if}
      </section>
      {/if}

      {#if showTrades}
      <section class="trades-card" data-strategy-tester-section="trades">
        <div class="section-header">
          <h3>Trades</h3>
          <span class="section-detail">{model.trades.length} rows</span>
        </div>
        {#if hasTrades}
          <div class="trade-table" role="table" aria-label="Strategy tester trades">
            <div class="trade-table-head" role="rowgroup">
              <div class="trade-row header" role="row">
                <span role="columnheader">Side</span>
                <span role="columnheader">Entry</span>
                <span role="columnheader">Exit</span>
                <span role="columnheader">P&amp;L</span>
              </div>
            </div>
            <div class="trade-table-body" role="rowgroup" data-strategy-tester-trades>
              {#each model.trades as trade}
                <button
                  type="button"
                  class:active={tradeIsActive(trade)}
                  class="trade-row"
                  role="row"
                  data-strategy-tester-trade-row={trade.id}
                  data-strategy-tester-trade-active={tradeIsActive(trade) ? "true" : "false"}
                  on:click={() => selectTrade(trade.id)}
                >
                  <div class="trade-main" role="cell">
                    <span class={tradeSideClass(trade)}>{trade.side}</span>
                    {#if trade.symbolLabel}
                      <span class="trade-symbol">{trade.symbolLabel}</span>
                    {/if}
                  </div>
                  <div role="cell">
                    <strong>{trade.entryTimeLabel}</strong>
                    {#if trade.entryPriceLabel}
                      <span>{trade.entryPriceLabel}</span>
                    {/if}
                  </div>
                  <div role="cell">
                    <strong>{trade.exitTimeLabel}</strong>
                    {#if trade.exitPriceLabel}
                      <span>{trade.exitPriceLabel}</span>
                    {/if}
                  </div>
                  <div role="cell" class="trade-pnl-cell">
                    <strong>{trade.pnlLabel}</strong>
                    {#if trade.durationLabel || trade.quantityLabel || trade.statusLabel}
                      <span>
                        {trade.durationLabel ?? trade.quantityLabel ?? trade.statusLabel}
                      </span>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {:else}
          <p class="section-empty" data-strategy-tester-trades-empty>No closed trades.</p>
        {/if}
      </section>
      {/if}
    </div>
  {/if}
</section>

<style>
  .strategy-tester-panel {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1rem;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 0.9rem;
    background: rgba(15, 23, 42, 0.78);
    color: #e2e8f0;
  }

  .panel-header,
  .section-header,
  .equity-footer,
  .trade-main {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .eyebrow,
  .section-detail,
  .metric-label,
  .metric-detail,
  .trade-row span,
  .run-label {
    color: #94a3b8;
    font-size: 0.78rem;
  }

  h2,
  h3,
  p {
    margin: 0;
  }

  .tabs,
  .metric-grid,
  .panel-grid {
    display: grid;
    gap: 0.75rem;
  }

  .tabs {
    grid-template-columns: repeat(auto-fit, minmax(7rem, max-content));
  }

  .tab-chip,
  .metric-card,
  .summary-card,
  .equity-card,
  .trades-card,
  .state-banner {
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 0.8rem;
    background: rgba(15, 23, 42, 0.55);
  }

  .tab-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 0.75rem;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .tab-chip.active {
    border-color: rgba(96, 165, 250, 0.65);
    background: rgba(30, 41, 59, 0.95);
  }

  .tab-chip.disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .tab-badge,
  .trade-side {
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    background: rgba(51, 65, 85, 0.9);
    color: #e2e8f0;
    font-size: 0.72rem;
    text-transform: uppercase;
  }

  .panel-grid {
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  }

  .summary-card,
  .equity-card,
  .trades-card,
  .state-banner {
    padding: 0.9rem;
  }

  .metric-grid {
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  }

  .metric-card {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.75rem;
  }

  .metric-card.positive {
    border-color: rgba(34, 197, 94, 0.4);
  }

  .metric-card.negative {
    border-color: rgba(248, 113, 113, 0.4);
  }

  .metric-value {
    font-size: 1.1rem;
  }

  .state-banner {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .state-banner.error {
    border-color: rgba(248, 113, 113, 0.4);
  }

  .state-banner.loading {
    border-color: rgba(96, 165, 250, 0.45);
  }

  .equity-viewport {
    position: relative;
    min-height: 10rem;
    margin-top: 0.8rem;
    border-radius: 0.7rem;
    background:
      linear-gradient(to top, rgba(148, 163, 184, 0.08), rgba(148, 163, 184, 0)),
      linear-gradient(to right, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
    background-size: auto, 14% 100%;
  }

  .equity-point {
    position: absolute;
    width: 0.7rem;
    height: 0.7rem;
    transform: translate(-50%, 50%);
    border: 0;
    border-radius: 999px;
    background: #38bdf8;
    box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.9);
  }

  .equity-point.active {
    background: #f8fafc;
  }

  .trade-table {
    margin-top: 0.8rem;
  }

  .trade-row {
    display: grid;
    grid-template-columns: minmax(7rem, 1fr) minmax(8rem, 1fr) minmax(8rem, 1fr) minmax(7rem, 1fr);
    gap: 0.75rem;
    width: 100%;
    padding: 0.65rem 0;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-top: 1px solid rgba(148, 163, 184, 0.12);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .trade-row.header {
    padding-top: 0;
    border-top: 0;
    cursor: default;
  }

  .trade-row.active {
    background: rgba(30, 41, 59, 0.75);
  }

  .trade-row > div,
  .trade-row > span {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .trade-side.long {
    background: rgba(34, 197, 94, 0.16);
  }

  .trade-side.short {
    background: rgba(248, 113, 113, 0.16);
  }

  .trade-symbol {
    font-size: 0.78rem;
  }

  .trade-pnl-cell {
    align-items: flex-end;
  }

  .section-empty {
    margin-top: 0.8rem;
    color: #94a3b8;
  }

  @media (max-width: 720px) {
    .trade-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
