<script lang="ts">
  import type { TradingTicketModel } from "../../chartx/public/trading-surface";

  const EMPTY_MODEL: TradingTicketModel = {
    title: "Trading Ticket",
    symbol: "--",
    side: "buy",
    orderType: "market",
    quantity: {
      label: "Quantity",
      placeholderLabel: "--",
    },
    submitLabel: "Submit",
    state: {
      status: "loading",
      statusLabel: "Waiting for host adapter",
      submitEnabled: false,
    },
  };

  export let model: TradingTicketModel = EMPTY_MODEL;
  export let onSubmit: (model: TradingTicketModel) => void | Promise<void> = () => {};

  function statusClass(status: TradingTicketModel["state"]["status"]): string {
    if (status === "error") {
      return "status-banner error";
    }
    if (status === "submitting") {
      return "status-banner submitting";
    }
    if (status === "ready") {
      return "status-banner ready";
    }
    return "status-banner loading";
  }

  function sideClass(side: TradingTicketModel["side"]): string {
    return side === "buy" ? "badge positive" : "badge negative";
  }

  function fieldValueLabel(field: TradingTicketModel["quantity"]): string {
    return field.valueLabel ?? field.placeholderLabel ?? "--";
  }
</script>

<section
  class="trading-ticket-panel"
  data-trading-ticket
  data-trading-ticket-state={model.state.status}
  data-trading-ticket-side={model.side}
  data-trading-ticket-order-type={model.orderType}
>
  <header class="panel-header">
    <div>
      <p class="eyebrow">Trading Ticket</p>
      <h2>{model.title}</h2>
    </div>
    <div class="header-meta">
      <strong data-trading-ticket-symbol>{model.symbol}</strong>
      {#if model.accountLabel}
        <span data-trading-ticket-account>{model.accountLabel}</span>
      {/if}
    </div>
  </header>

  <div class={statusClass(model.state.status)} data-trading-ticket-status>
    <strong>{model.state.statusLabel ?? "Fixture state"}</strong>
    {#if model.state.errorLabel}
      <span data-trading-ticket-error>{model.state.errorLabel}</span>
    {/if}
  </div>

  <div class="ticket-grid">
    <article class="ticket-card">
      <div class="card-header">
        <h3>Order</h3>
        <div class="badge-row">
          <span class={sideClass(model.side)} data-trading-ticket-side-badge>{model.side}</span>
          <span class="badge neutral" data-trading-ticket-order-type-badge>{model.orderType}</span>
        </div>
      </div>
      <dl class="field-grid">
        <div class="field-row" data-trading-ticket-field="quantity">
          <dt>{model.quantity.label}</dt>
          <dd>{fieldValueLabel(model.quantity)}</dd>
        </div>
        {#if model.limitPrice}
          <div class="field-row" data-trading-ticket-field="limit-price">
            <dt>{model.limitPrice.label}</dt>
            <dd>{fieldValueLabel(model.limitPrice)}</dd>
          </div>
        {/if}
        {#if model.stopPrice}
          <div class="field-row" data-trading-ticket-field="stop-price">
            <dt>{model.stopPrice.label}</dt>
            <dd>{fieldValueLabel(model.stopPrice)}</dd>
          </div>
        {/if}
      </dl>
    </article>

    <article class="ticket-card">
      <div class="card-header">
        <h3>Summary</h3>
        <span class="section-detail">Host adapter shell</span>
      </div>
      {#if model.summaryLabel}
        <p class="summary-label" data-trading-ticket-summary>{model.summaryLabel}</p>
      {:else}
        <p class="summary-label muted">No fixture summary available.</p>
      {/if}

      <button
        type="button"
        class="submit-button"
        data-trading-ticket-submit
        disabled={!model.state.submitEnabled}
        aria-disabled={!model.state.submitEnabled}
        on:click={() => {
          void onSubmit(model);
        }}
      >
        {model.submitLabel}
      </button>
    </article>
  </div>
</section>

<style>
  .trading-ticket-panel {
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
  .header-meta,
  .card-header,
  .badge-row,
  .field-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .eyebrow,
  .section-detail,
  .summary-label,
  .field-row dt,
  .header-meta span {
    margin: 0;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(226, 232, 240, 0.62);
  }

  h2,
  h3,
  .header-meta strong,
  .field-row dd {
    margin: 0;
    font-weight: 600;
  }

  .status-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem;
    padding: 0.75rem 0.85rem;
    border-radius: 0.75rem;
    border: 1px solid transparent;
    font-size: 0.88rem;
  }

  .status-banner.ready {
    background: rgba(15, 118, 110, 0.18);
    border-color: rgba(45, 212, 191, 0.26);
  }

  .status-banner.submitting {
    background: rgba(180, 83, 9, 0.18);
    border-color: rgba(251, 191, 36, 0.3);
  }

  .status-banner.error {
    background: rgba(153, 27, 27, 0.2);
    border-color: rgba(248, 113, 113, 0.3);
  }

  .status-banner.loading {
    background: rgba(30, 41, 59, 0.72);
    border-color: rgba(148, 163, 184, 0.18);
  }

  .ticket-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 0.9rem;
  }

  .ticket-card {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    min-height: 0;
    padding: 0.95rem;
    border-radius: 0.8rem;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.16);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 4.2rem;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #f8fafc;
  }

  .badge.positive {
    background: rgba(22, 163, 74, 0.68);
  }

  .badge.negative {
    background: rgba(220, 38, 38, 0.7);
  }

  .badge.neutral {
    background: rgba(71, 85, 105, 0.92);
  }

  .field-grid {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin: 0;
  }

  .field-row dd {
    font-size: 1rem;
    text-transform: none;
    color: #f8fafc;
  }

  .summary-label {
    text-transform: none;
    letter-spacing: 0.02em;
    line-height: 1.45;
    color: #cbd5e1;
  }

  .summary-label.muted {
    color: rgba(148, 163, 184, 0.74);
  }

  .submit-button {
    min-height: 2.6rem;
    border: 0;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #0f766e, #155e75);
    color: #f8fafc;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .submit-button:disabled {
    background: rgba(51, 65, 85, 0.92);
    color: rgba(226, 232, 240, 0.58);
  }

  @media (max-width: 960px) {
    .panel-header,
    .header-meta,
    .card-header,
    .badge-row,
    .field-row {
      align-items: flex-start;
      flex-direction: column;
    }

    .submit-button {
      width: 100%;
    }
  }
</style>
