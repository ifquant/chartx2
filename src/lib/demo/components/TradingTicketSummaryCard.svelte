<script lang="ts">
  import type { TradingTicketSummaryShellModel } from "$lib/chartx/public/trading-surface";

  export let model: TradingTicketSummaryShellModel | null = null;
  export let onOpenPanel: () => void;

  function toneClass(side: TradingTicketSummaryShellModel["side"]): string {
    return side === "buy" ? "positive" : "negative";
  }
</script>

{#if model}
  <section class="trading-summary-card" data-trading-ticket-summary-card>
    <div class="trading-summary-head">
      <div>
        <span class="trading-summary-label">Trading ticket shell</span>
        <strong>{model.title}</strong>
        <small data-trading-ticket-summary-symbol>{model.symbol}</small>
      </div>
      <button type="button" data-trading-ticket-summary-open on:click={onOpenPanel}>Open ticket</button>
    </div>

    <p class="trading-summary-status" data-trading-ticket-summary-status>{model.statusLabel}</p>

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
  </section>
{/if}

<style>
  .trading-summary-card {
    display: grid;
    gap: 0.7rem;
    padding: 0.9rem 1rem;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 1rem;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.92));
  }

  .trading-summary-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
  }

  .trading-summary-label {
    display: block;
    color: rgba(15, 23, 42, 0.56);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.2rem;
  }

  .trading-summary-head small,
  .trading-summary-status {
    color: rgba(15, 23, 42, 0.7);
  }

  .trading-summary-head button {
    border: 1px solid rgba(15, 23, 42, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    padding: 0.35rem 0.7rem;
    font-size: 0.82rem;
  }

  .trading-summary-status {
    margin: 0;
    font-size: 0.9rem;
  }

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
