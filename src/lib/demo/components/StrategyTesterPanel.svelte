<script lang="ts">
  import type {
    StrategyTesterAction,
    StrategyTesterEquityPoint,
    StrategyTesterFilterOption,
    StrategyTesterParameterField,
    StrategyTesterPanelModel,
    StrategyTesterRunMetric,
    StrategyTesterRunOption,
    StrategyTesterSummaryMetric,
    StrategyTesterTradeDetail,
    StrategyTesterTradeRow,
  } from "../../chartx/public/strategy-tester";
  import type { TradeLocationIntent } from "../../chartx/public/performance";

  const EMPTY_PANEL: StrategyTesterPanelModel = {
    title: "Strategy Tester",
    runMetrics: [],
    runOptions: [],
    activeRunOptionId: "default",
    summaryMetrics: [],
    tabs: [],
    filterOptions: [],
    activeFilterId: "all",
    trades: [],
    equityCurve: [],
    state: {
      status: "empty",
      activeTabId: "overview",
      emptyLabel: "No strategy test selected.",
    },
  };

  export let model: StrategyTesterPanelModel = EMPTY_PANEL;
  export let onLocateTrade: (intent: TradeLocationIntent) => void | Promise<void> = () => {};

  function metricToneClass(metric: StrategyTesterSummaryMetric): string {
    if (metric.tone === "positive") {
      return "metric-card positive";
    }
    if (metric.tone === "negative") {
      return "metric-card negative";
    }
    return "metric-card";
  }

  function runMetricToneClass(metric: StrategyTesterRunMetric): string {
    return metric.valueLabel.length > 0 ? "run-metric" : "run-metric empty";
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
  let activeRunOptionId = model.activeRunOptionId ?? model.runOptions?.[0]?.id ?? "default";
  let activeFilterId = model.activeFilterId ?? model.filterOptions?.[0]?.id ?? "all";
  let selectedTradeId: string | null = null;
  let parameterDraft: Record<string, string> = {};
  let actionBanner = "";
  let lastModelStateKey = "";
  let lastParameterDraftKey = "";

  function syncSelectionForTab(nextTabId: string): void {
    activeTabId = nextTabId;
    if (selectedTradeId === null) {
      return;
    }
    const stillPresent = effectiveTrades.some((trade) => trade.id === selectedTradeId);
    if (!stillPresent) {
      selectedTradeId = null;
    }
  }

  function selectTrade(tradeId: string | null): void {
    selectedTradeId = tradeId;
  }

  function selectFilter(nextFilterId: string): void {
    activeFilterId = nextFilterId;
    if (selectedTradeId === null) {
      return;
    }
    if (!visibleTrades.some((trade) => trade.id === selectedTradeId)) {
      selectedTradeId = null;
    }
  }

  function selectRunOption(nextRunOptionId: string): void {
    const nextOption = model.runOptions?.find((option) => option.id === nextRunOptionId) ?? null;
    activeRunOptionId = nextRunOptionId;
    selectedTradeId = null;
    activeFilterId = nextOption?.activeFilterId ?? nextOption?.filterOptions?.[0]?.id ?? model.activeFilterId ?? "all";
  }

  function parameterDraftFromFields(fields: readonly StrategyTesterParameterField[]): Record<string, string> {
    return Object.fromEntries(fields.map((field) => [field.id, field.value]));
  }

  function updateParameterDraft(fieldId: string, value: string): void {
    parameterDraft = {
      ...parameterDraft,
      [fieldId]: value,
    };
  }

  function parameterDraftValue(field: StrategyTesterParameterField): string {
    return parameterDraft[field.id] ?? field.value;
  }

  function resetParameterDraft(): void {
    parameterDraft = parameterDraftFromFields(effectiveParameterFields);
  }

  function runActionShell(action: StrategyTesterAction): void {
    if (action.disabled) {
      return;
    }
    if (action.requiresDirtyDraft && !parameterDraftDirty) {
      actionBanner = `Edit parameters before using ${action.label.toLowerCase()}.`;
      return;
    }
    actionBanner = action.resultLabel ?? `${action.label} requested.`;
  }

  function resolveVisibleTradeIds(filter: StrategyTesterFilterOption | null): Set<string> | null {
    if (!filter?.tradeIds) {
      return null;
    }
    return new Set(filter.tradeIds);
  }

  function pointIsActive(point: StrategyTesterEquityPoint): boolean {
    if (resolvedSelectedTradeId !== null) {
      return point.tradeId === resolvedSelectedTradeId;
    }
    return point.active ?? false;
  }

  function tradeIsActive(trade: StrategyTesterTradeRow): boolean {
    if (resolvedSelectedTradeId !== null) {
      return trade.id === resolvedSelectedTradeId;
    }
    return false;
  }

  $: state = model.state;
  $: {
    const nextModelStateKey = `${model.title}:${model.runLabel ?? ""}:${model.state.activeTabId}:${model.activeRunOptionId ?? ""}:${model.activeFilterId ?? ""}`;
    if (nextModelStateKey !== lastModelStateKey) {
      lastModelStateKey = nextModelStateKey;
      selectedTradeId = null;
      activeTabId = model.state.activeTabId;
      activeRunOptionId = model.activeRunOptionId ?? model.runOptions?.[0]?.id ?? "default";
      activeFilterId = model.activeFilterId ?? model.filterOptions?.[0]?.id ?? "all";
    }
  }
  $: if (model.tabs.every((tab) => tab.id !== activeTabId)) {
    activeTabId = model.state.activeTabId;
  }
  $: if ((model.runOptions?.length ?? 0) > 0 && model.runOptions?.every((option) => option.id !== activeRunOptionId)) {
    activeRunOptionId = model.activeRunOptionId ?? model.runOptions?.[0]?.id ?? "default";
  }
  $: effectiveRunOption =
    model.runOptions?.find((option) => option.id === activeRunOptionId) ?? model.runOptions?.[0] ?? null;
  $: effectiveRunLabel = effectiveRunOption?.runLabel ?? model.runLabel;
  $: effectiveRunMetrics = effectiveRunOption?.runMetrics ?? model.runMetrics ?? [];
  $: effectiveParameterFields = effectiveRunOption?.parameterFields ?? [];
  $: effectiveActions = effectiveRunOption?.actions ?? [];
  $: effectiveSummaryMetrics = effectiveRunOption?.summaryMetrics ?? model.summaryMetrics;
  $: effectiveFilterOptions = effectiveRunOption?.filterOptions ?? model.filterOptions ?? [];
  $: effectiveTrades = effectiveRunOption?.trades ?? model.trades;
  $: effectiveTradeDetails = effectiveRunOption?.tradeDetails ?? model.tradeDetails ?? [];
  $: effectiveEquityCurve = effectiveRunOption?.equityCurve ?? model.equityCurve;
  $: if ((effectiveFilterOptions.length ?? 0) > 0 && effectiveFilterOptions.every((option) => option.id !== activeFilterId)) {
    activeFilterId = effectiveRunOption?.activeFilterId ?? model.activeFilterId ?? effectiveFilterOptions[0]?.id ?? "all";
  }
  $: activeTab = model.tabs.find((tab) => tab.id === activeTabId) ?? model.tabs[0] ?? null;
  $: activeFilter =
    effectiveFilterOptions.find((option) => option.id === activeFilterId) ?? effectiveFilterOptions[0] ?? null;
  $: visibleTradeIds = resolveVisibleTradeIds(activeFilter);
  $: visibleTrades = visibleTradeIds ? effectiveTrades.filter((trade) => visibleTradeIds.has(trade.id)) : effectiveTrades;
  $: visibleEquityCurve = visibleTradeIds
    ? effectiveEquityCurve.filter((point) => point.tradeId === undefined || visibleTradeIds.has(point.tradeId))
    : effectiveEquityCurve;
  $: nextParameterDraftKey = `${activeRunOptionId}:${effectiveParameterFields.map((field) => `${field.id}=${field.value}`).join("|")}`;
  $: if (lastParameterDraftKey !== nextParameterDraftKey) {
    lastParameterDraftKey = nextParameterDraftKey;
    parameterDraft = parameterDraftFromFields(effectiveParameterFields);
    actionBanner = "";
  }
  $: parameterDraftDirty = effectiveParameterFields.some((field) => parameterDraft[field.id] !== field.value);
  $: parameterRenderKey = `${activeRunOptionId}:${JSON.stringify(parameterDraft)}`;
  $: fallbackSelectedTradeId = visibleEquityCurve.find((point) => point.active && point.tradeId)?.tradeId ?? null;
  $: resolvedSelectedTradeId = selectedTradeId ?? fallbackSelectedTradeId;
  $: selectedTradeDetail =
    effectiveTradeDetails.find((detail) => detail.tradeId === resolvedSelectedTradeId) ?? null;
  $: hasSummary = effectiveSummaryMetrics.length > 0;
  $: hasTrades = visibleTrades.length > 0;
  $: hasEquity = visibleEquityCurve.length > 0;
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
    {#if effectiveRunLabel}
      <p class="run-label" data-strategy-tester-run>{effectiveRunLabel}</p>
    {/if}
  </header>

  {#if (model.runOptions?.length ?? 0) > 0}
    <nav class="run-options" aria-label="Strategy tester runs" data-strategy-tester-run-options>
      {#each model.runOptions ?? [] as option}
        <button
          type="button"
          class:active={option.id === activeRunOptionId}
          class="run-option-chip"
          data-strategy-tester-run-option={option.id}
          data-strategy-tester-run-option-active={option.id === activeRunOptionId ? "true" : "false"}
          on:click={() => selectRunOption(option.id)}
        >
          <span>{option.label}</span>
          {#if option.badgeLabel}
            <span class="filter-badge">{option.badgeLabel}</span>
          {/if}
        </button>
      {/each}
    </nav>
  {/if}

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

  {#if effectiveFilterOptions.length > 0}
    <nav class="filters" aria-label="Strategy tester filters" data-strategy-tester-filters>
      {#each effectiveFilterOptions as filter}
        <button
          type="button"
          class:active={filter.id === activeFilterId}
          class:disabled={filter.disabled}
          class="filter-chip"
          data-strategy-tester-filter={filter.id}
          data-strategy-tester-filter-active={filter.id === activeFilterId ? "true" : "false"}
          data-strategy-tester-filter-disabled={filter.disabled ? "true" : "false"}
          disabled={filter.disabled}
          on:click={() => {
            if (filter.disabled) {
              return;
            }
            selectFilter(filter.id);
          }}
        >
          <span>{filter.label}</span>
          {#if filter.badgeLabel}
            <span class="filter-badge">{filter.badgeLabel}</span>
          {/if}
        </button>
      {/each}
    </nav>
  {/if}

  {#if effectiveRunMetrics.length > 0}
    <section class="run-metrics" data-strategy-tester-run-metrics>
      {#each effectiveRunMetrics as metric}
        <article class={runMetricToneClass(metric)} data-strategy-tester-run-metric={metric.id}>
          <span>{metric.label}</span>
          <strong>{metric.valueLabel}</strong>
        </article>
      {/each}
    </section>
  {/if}

  {#if effectiveParameterFields.length > 0}
    <section
      class="parameter-shell-card"
      data-strategy-tester-parameter-shell
      data-strategy-tester-parameter-dirty={parameterDraftDirty ? "true" : "false"}
    >
      <div class="section-header">
        <div class="trade-detail-title-block">
          <h3>Parameter Set</h3>
          <span class="section-detail">
            {parameterDraftDirty ? "Draft diverges from the active run shell" : "Draft matches the active run shell"}
          </span>
        </div>
        <button
          type="button"
          class="parameter-reset-button"
          data-strategy-tester-parameter-reset
          disabled={!parameterDraftDirty}
          on:click={resetParameterDraft}
        >
          Reset draft
        </button>
      </div>
      <div class="parameter-grid">
        {#key parameterRenderKey}
          {#each effectiveParameterFields as field}
            <label class="parameter-field" data-strategy-tester-parameter-field={field.id}>
              <span>{field.label}</span>
              {#if field.kind === "select"}
                <select
                  data-strategy-tester-parameter-input={field.id}
                  value={parameterDraftValue(field)}
                  on:change={(event) => updateParameterDraft(field.id, (event.currentTarget as HTMLSelectElement).value)}
                >
                  {#each field.options ?? [] as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              {:else}
                <div class="parameter-input-row">
                  <input
                    type="number"
                    step={field.step ?? 1}
                    data-strategy-tester-parameter-input={field.id}
                    value={parameterDraftValue(field)}
                    on:input={(event) => updateParameterDraft(field.id, (event.currentTarget as HTMLInputElement).value)}
                  />
                  {#if field.suffixLabel}
                    <span class="parameter-suffix">{field.suffixLabel}</span>
                  {/if}
                </div>
              {/if}
            </label>
          {/each}
        {/key}
      </div>
    </section>
  {/if}

  {#if effectiveActions.length > 0}
    <section class="action-shell-card" data-strategy-tester-action-shell>
      <div class="section-header">
        <div class="trade-detail-title-block">
          <h3>Run Actions</h3>
          <span class="section-detail">Local tester shell actions only</span>
        </div>
      </div>
      <div class="action-shell-row">
        {#each effectiveActions as action}
          <button
            type="button"
            class:primary={action.tone === "primary"}
            class="tester-action-button"
            data-strategy-tester-action={action.id}
            disabled={action.disabled ?? false}
            on:click={() => runActionShell(action)}
          >
            {action.label}
          </button>
        {/each}
      </div>
      {#if actionBanner}
        <p class="action-banner" data-strategy-tester-action-banner>{actionBanner}</p>
      {/if}
    </section>
  {/if}

  {#if selectedTradeDetail}
    <section class="trade-detail-card" data-strategy-tester-trade-detail={selectedTradeDetail.tradeId}>
      <div class="section-header">
        <div class="trade-detail-title-block">
          <h3>{selectedTradeDetail.title ?? "Selected Trade"}</h3>
          {#if selectedTradeDetail.subtitle}
            <span class="section-detail">{selectedTradeDetail.subtitle}</span>
          {/if}
        </div>
        {#if selectedTradeDetail.statusLabel}
          <span class="trade-detail-status">{selectedTradeDetail.statusLabel}</span>
        {/if}
      </div>
      <div class="trade-detail-grid">
        {#each selectedTradeDetail.fields as field}
          <article data-strategy-tester-trade-detail-field={field.id}>
            <small>{field.label}</small>
            <strong>{field.valueLabel}</strong>
          </article>
        {/each}
      </div>
      {#if selectedTradeDetail.locateIntent}
        <button
          type="button"
          class="locate-trade-button"
          data-strategy-tester-locate-trade={selectedTradeDetail.tradeId}
          on:click={() => {
            void onLocateTrade(selectedTradeDetail.locateIntent!);
          }}
        >
          {selectedTradeDetail.locateLabel ?? "Locate on chart"}
        </button>
      {/if}
    </section>
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
            {#each effectiveSummaryMetrics as metric}
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
          <span class="section-detail">{visibleEquityCurve.length} points</span>
        </div>
        {#if hasEquity}
          <div class="equity-viewport" data-strategy-tester-equity>
            {#each visibleEquityCurve as point, index}
              <button
                type="button"
                class:active={pointIsActive(point)}
                class="equity-point"
                style={pointStyle(point, index, visibleEquityCurve)}
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
              <strong>{visibleEquityCurve[0]?.equityLabel ?? "--"}</strong>
            </div>
            <div class="equity-last" data-strategy-tester-equity-last={visibleEquityCurve[visibleEquityCurve.length - 1]?.id ?? ""}>
              <p class="section-detail">Latest</p>
              <strong>{visibleEquityCurve[visibleEquityCurve.length - 1]?.equityLabel ?? "--"}</strong>
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
          <span class="section-detail">{visibleTrades.length} rows</span>
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
              {#each visibleTrades as trade}
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
          <p class="section-empty" data-strategy-tester-trades-empty>
            No trades match {activeFilter?.label ?? "the current filter"}.
          </p>
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
  .run-options,
  .filters,
  .run-metrics,
  .metric-grid,
  .panel-grid {
    display: grid;
    gap: 0.75rem;
  }

  .tabs {
    grid-template-columns: repeat(auto-fit, minmax(7rem, max-content));
  }

  .run-options {
    grid-template-columns: repeat(auto-fit, minmax(7rem, max-content));
  }

  .filters {
    grid-template-columns: repeat(auto-fit, minmax(7rem, max-content));
  }

  .run-metrics {
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  }

  .tab-chip,
  .metric-card,
  .run-metric,
  .parameter-shell-card,
  .action-shell-card,
  .trade-detail-card,
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

  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 0.7rem;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.55);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .run-option-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 0.7rem;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.55);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .run-option-chip.active {
    border-color: rgba(34, 197, 94, 0.45);
    background: rgba(20, 83, 45, 0.45);
  }

  .filter-chip.active {
    border-color: rgba(96, 165, 250, 0.65);
    background: rgba(30, 41, 59, 0.95);
  }

  .filter-chip.disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .run-metric {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.7rem 0.8rem;
  }

  .run-metric strong {
    font-size: 0.95rem;
    color: #e2e8f0;
  }

  .parameter-shell-card {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 0.9rem;
  }

  .parameter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 0.75rem;
  }

  .parameter-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    color: #94a3b8;
    font-size: 0.78rem;
  }

  .parameter-field input,
  .parameter-field select {
    padding: 0.5rem 0.65rem;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 0.65rem;
    background: rgba(15, 23, 42, 0.8);
    color: #e2e8f0;
    font: inherit;
  }

  .parameter-input-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .parameter-input-row input {
    flex: 1 1 auto;
  }

  .parameter-suffix {
    color: #94a3b8;
    font-size: 0.78rem;
  }

  .parameter-reset-button {
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 0.7rem;
    background: rgba(15, 23, 42, 0.8);
    color: #e2e8f0;
    font: inherit;
    cursor: pointer;
  }

  .parameter-reset-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-shell-card {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 0.9rem;
  }

  .action-shell-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
  }

  .tester-action-button {
    padding: 0.55rem 0.8rem;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 0.7rem;
    background: rgba(15, 23, 42, 0.8);
    color: #e2e8f0;
    font: inherit;
    cursor: pointer;
  }

  .tester-action-button.primary {
    border-color: rgba(96, 165, 250, 0.45);
    background: rgba(30, 41, 59, 0.95);
  }

  .tester-action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-banner {
    color: #94a3b8;
    font-size: 0.82rem;
  }

  .trade-detail-card {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 0.9rem;
  }

  .trade-detail-title-block {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .trade-detail-status {
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: rgba(51, 65, 85, 0.9);
    color: #e2e8f0;
    font-size: 0.72rem;
    text-transform: uppercase;
  }

  .trade-detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 0.75rem;
  }

  .trade-detail-grid article {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .trade-detail-grid small {
    color: #94a3b8;
    font-size: 0.78rem;
  }

  .locate-trade-button {
    align-self: flex-start;
    padding: 0.55rem 0.8rem;
    border: 1px solid rgba(96, 165, 250, 0.45);
    border-radius: 0.7rem;
    background: rgba(30, 41, 59, 0.9);
    color: #e2e8f0;
    font: inherit;
    cursor: pointer;
  }

  .tab-badge,
  .filter-badge,
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
