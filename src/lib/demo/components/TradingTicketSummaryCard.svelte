<script lang="ts">
  import type { TradingTicketSummaryShellModel } from "../../chartx/public/trading-surface";
  import HostSurfaceSummaryCard from "./HostSurfaceSummaryCard.svelte";

  export let model: TradingTicketSummaryShellModel | null = null;
  export let onOpenPanel: () => void;

  function toneClass(side: TradingTicketSummaryShellModel["side"]): string {
    return side === "buy" ? "positive" : "negative";
  }
</script>

{#if model}
  <HostSurfaceSummaryCard
    label="Trading ticket shell"
    title={model.title}
    subtitle={model.symbol}
    statusLabel={model.statusLabel}
    actionLabel="Open ticket"
    onAction={onOpenPanel}
    rootAttributes={{ "data-trading-ticket-summary-card": "" }}
    subtitleAttributes={{ "data-trading-ticket-summary-symbol": "" }}
    statusAttributes={{ "data-trading-ticket-summary-status": "" }}
    actionAttributes={{ "data-trading-ticket-summary-open": "" }}
  >
    <div class="trading-summary-meta">
      <span class={`summary-pill ${toneClass(model.side)}`} data-trading-ticket-summary-side>{model.side}</span>
      <span class="summary-pill" data-trading-ticket-summary-order-type>{model.orderType}</span>
      {#if model.quantityLabel}
        <span class="summary-pill" data-trading-ticket-summary-quantity>{model.quantityLabel}</span>
      {/if}
      {#if model.accountLabel}
        <span class="summary-pill" data-trading-ticket-summary-account>{model.accountLabel}</span>
      {/if}
    </div>
  </HostSurfaceSummaryCard>
{/if}

<style>
  .trading-summary-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  .summary-pill {
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: rgba(226, 232, 240, 0.8);
    color: rgba(15, 23, 42, 0.78);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .summary-pill.positive {
    background: rgba(187, 247, 208, 0.9);
  }

  .summary-pill.negative {
    background: rgba(254, 202, 202, 0.9);
  }
</style>
