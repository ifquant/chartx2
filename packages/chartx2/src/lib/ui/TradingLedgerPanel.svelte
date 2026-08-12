<script lang="ts">
  import {
    resolveTradingLedgerColumns,
    resolveTradingLedgerRowCells,
    type TradingLedgerPanelModel,
    type TradingLedgerRowModel,
  } from "../public/trading-ledger-surface";

  const EMPTY_MODEL: TradingLedgerPanelModel = {
    tabs: [],
    activeTabId: "loading",
    rows: [],
    emptyLabel: "No orders or trades",
    detailTitle: "Detail",
    detailEmptyLabel: "No row selected",
  };

  type Props = {
    model?: TradingLedgerPanelModel;
    onSelectTab?: (tabId: string) => void | Promise<void>;
    onSelectRow?: (rowId: string) => void | Promise<void>;
  };

  let {
    model = EMPTY_MODEL,
    onSelectTab = () => {},
    onSelectRow = () => {},
  }: Props = $props();

  // Svelte derives this ID from the component tree, so multiple mounted panels
  // stay unique while SSR and hydration agree on the same prefix.
  let instanceId = $props.id();

  let tabButtons = $state<HTMLButtonElement[]>([]);
  let rowButtons = $state<HTMLButtonElement[]>([]);

  function toneClass(tone: TradingLedgerRowModel["tone"] | undefined): string | undefined {
    if (tone === "red") {
      return "red";
    }
    if (tone === "green") {
      return "green";
    }
    return undefined;
  }

  function selectedRow(modelValue: TradingLedgerPanelModel): TradingLedgerRowModel | null {
    if (!modelValue.rows.length) {
      return null;
    }
    if (!modelValue.selectedRowId) {
      return modelValue.rows[0] ?? null;
    }
    return modelValue.rows.find((row) => row.id === modelValue.selectedRowId) ?? modelValue.rows[0] ?? null;
  }

  function activeTabIndex(modelValue: TradingLedgerPanelModel): number {
    return Math.max(0, modelValue.tabs.findIndex((tab) => tab.id === modelValue.activeTabId));
  }

  function panelIdForIndex(index: number): string {
    return `${instanceId}-panel-${index}`;
  }

  function tabIdForIndex(index: number): string {
    return `${instanceId}-tab-${index}`;
  }

  function selectRelativeTab(event: KeyboardEvent, index: number): void {
    if (!model.tabs.length) return;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % model.tabs.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + model.tabs.length) % model.tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = model.tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = model.tabs[nextIndex];
    tabButtons[nextIndex]?.focus();
    void onSelectTab(next.id);
  }

  function selectRelativeRow(event: KeyboardEvent, index: number): void {
    if (!model.rows.length) return;
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = Math.min(model.rows.length - 1, index + 1);
    if (event.key === "ArrowUp") nextIndex = Math.max(0, index - 1);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = model.rows.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = model.rows[nextIndex];
    rowButtons[nextIndex]?.focus();
    void onSelectRow(next.id);
  }
</script>

<section class="trading-ledger-panel" data-trading-ledger data-trading-ledger-active-tab={model.activeTabId}>
  <div class="ledger-tabs" role="tablist" aria-label={model.title ?? "Trading ledger tabs"}>
    {#each model.tabs as tab, index}
      <button
        type="button"
        class:active={model.activeTabId === tab.id}
        data-trading-ledger-tab={tab.id}
        role="tab"
        id={tabIdForIndex(index)}
        aria-selected={model.activeTabId === tab.id}
        aria-controls={panelIdForIndex(index)}
        tabindex={model.activeTabId === tab.id ? 0 : -1}
        bind:this={tabButtons[index]}
        onclick={() => {
          void onSelectTab(tab.id);
        }}
        onkeydown={(event) => selectRelativeTab(event, index)}
      >
        {tab.label}
        {#if tab.badgeLabel}
          <small>{tab.badgeLabel}</small>
        {/if}
      </button>
    {/each}
  </div>

  {#each model.tabs as tab, tabIndex}
    <div
      class="ledger-body"
      role="tabpanel"
      id={panelIdForIndex(tabIndex)}
      aria-labelledby={tabIdForIndex(tabIndex)}
      tabindex="0"
      hidden={model.activeTabId !== tab.id}
    >
      {#if model.activeTabId === tab.id}
        <div class="ledger-table" role="grid" aria-label={model.title ?? "Trading ledger rows"}>
        <div class="ledger-row header" role="row" style={`--ledger-column-count: ${resolveTradingLedgerColumns(model).length}`}>
          {#each resolveTradingLedgerColumns(model) as column}
            <span role="columnheader">{column.label}</span>
          {/each}
        </div>
        {#if model.rows.length === 0}
          <div class="empty-row">{model.emptyLabel ?? "No orders or trades"}</div>
        {:else}
          {#each model.rows as row, index}
            <button
              type="button"
              class:ledger-row={true}
              class:selected={selectedRow(model)?.id === row.id}
              data-trading-ledger-row={row.id}
              role="row"
              aria-selected={selectedRow(model)?.id === row.id}
              tabindex={selectedRow(model)?.id === row.id ? 0 : -1}
              style={`--ledger-column-count: ${resolveTradingLedgerColumns(model).length}`}
              bind:this={rowButtons[index]}
              onclick={() => {
                void onSelectRow(row.id);
              }}
              onkeydown={(event) => selectRelativeRow(event, index)}
            >
              {#each resolveTradingLedgerRowCells(row, resolveTradingLedgerColumns(model)) as cell}
                <span role="gridcell" class={toneClass(cell.tone)}>{cell.valueLabel}</span>
              {/each}
            </button>
          {/each}
        {/if}
      </div>

      <aside class="detail-card" aria-label="Selected ledger row detail">
        <div class="detail-head">
          <strong>{model.detailTitle ?? "Detail"}</strong>
          <span>{selectedRow(model)?.id ?? "未选择"}</span>
        </div>
        {#if !selectedRow(model)}
          <div class="detail-empty">{model.detailEmptyLabel ?? "No row selected"}</div>
        {:else}
          {#each selectedRow(model)?.detailFields ?? [] as field}
            <div class="detail-row">
              <span>{field.label}</span>
              <strong class={toneClass(field.tone)}>{field.valueLabel}</strong>
            </div>
          {/each}
        {/if}
        </aside>
      {/if}
    </div>
  {/each}
</section>

<style>
  .trading-ledger-panel {
    min-height: 0;
    display: grid;
    grid-template-rows: 28px minmax(0, 1fr);
    overflow: hidden;
  }

  .ledger-body {
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) 240px;
    overflow: hidden;
  }

  .ledger-tabs {
    display: flex;
    align-items: end;
    gap: 1px;
    padding-left: 4px;
    background: #d8dee1;
    border-bottom: 1px solid #8f9aa1;
    overflow: hidden;
  }

  .ledger-tabs button {
    min-width: 72px;
    height: 25px;
    border: 1px solid #8b979e;
    border-bottom: 0;
    border-radius: 3px 3px 0 0;
    padding: 4px 8px;
    text-align: left;
    background: #eef2f3;
    font-weight: 800;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 6px;
  }

  .ledger-tabs button small {
    color: #56707a;
    font-size: 10px;
    font-weight: 800;
  }

  .ledger-tabs .active {
    background: #fff;
    color: #0f5964;
  }

  .ledger-tabs .active small {
    color: inherit;
  }

  .ledger-table {
    display: grid;
    grid-auto-rows: minmax(26px, auto);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    overflow: auto;
  }

  .ledger-row {
    display: grid;
    grid-template-columns: repeat(var(--ledger-column-count), minmax(0, 1fr));
    border-bottom: 1px solid #e1e7e9;
    border-left: 0;
    border-top: 0;
    border-right: 0;
    background: transparent;
    text-align: left;
  }

  .ledger-row.selected {
    background: #eef6f7;
  }

  .ledger-row span {
    display: flex;
    align-items: center;
    min-width: 0;
    padding: 0 8px;
    border-right: 1px solid #e1e7e9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty-row {
    display: grid;
    place-items: center;
    padding: 16px;
    color: #607279;
    font-size: 11px;
    border-bottom: 1px solid #e1e7e9;
  }

  .detail-card {
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 8px;
    padding: 10px;
    border-left: 1px solid #d5dfe3;
    background: #f5f8f9;
    overflow: auto;
  }

  .detail-head {
    display: grid;
    gap: 2px;
  }

  .detail-head strong {
    font-size: 12px;
  }

  .detail-head span {
    color: #63757c;
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .detail-row {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #dde6e9;
    font-size: 11px;
  }

  .detail-row span {
    color: #5c6f76;
    font-weight: 700;
  }

  .detail-row strong {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .detail-empty {
    color: #66797f;
    font-size: 11px;
    line-height: 1.5;
  }

  .red {
    color: #c34237;
  }

  .green {
    color: #17835a;
  }
</style>
