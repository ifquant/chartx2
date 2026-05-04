<script lang="ts">
  import type { StrategyTesterSummaryShellModel } from "$lib/chartx/public/strategy-tester";

  export let model: StrategyTesterSummaryShellModel | null = null;
  export let onOpenPanel: () => void;
</script>

{#if model}
  <section class="strategy-summary-card" data-strategy-tester-summary-card>
    <div class="strategy-summary-head">
      <div>
        <span class="strategy-summary-label">Strategy tester shell</span>
        <strong>{model.title}</strong>
        {#if model.runLabel}
          <small data-strategy-tester-summary-run>{model.runLabel}</small>
        {/if}
      </div>
      <button type="button" data-strategy-tester-summary-open on:click={onOpenPanel}>Open tester</button>
    </div>

    <p class="strategy-summary-status" data-strategy-tester-summary-status>{model.statusLabel}</p>

    <div class="strategy-summary-grid">
      {#each model.highlights as metric}
        <article data-strategy-tester-summary-metric={metric.id}>
          <span>{metric.label}</span>
          <strong>{metric.valueLabel}</strong>
        </article>
      {/each}
    </div>
  </section>
{/if}

<style>
  .strategy-summary-card {
    display: grid;
    gap: 0.7rem;
    padding: 0.9rem 1rem;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 1rem;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.92));
  }

  .strategy-summary-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
  }

  .strategy-summary-label {
    display: block;
    color: rgba(15, 23, 42, 0.56);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.2rem;
  }

  .strategy-summary-head small,
  .strategy-summary-status,
  .strategy-summary-grid span {
    color: rgba(15, 23, 42, 0.7);
  }

  .strategy-summary-head button {
    border: 1px solid rgba(15, 23, 42, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    padding: 0.35rem 0.7rem;
    font-size: 0.82rem;
  }

  .strategy-summary-status {
    margin: 0;
    font-size: 0.9rem;
  }

  .strategy-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 0.6rem;
  }

  .strategy-summary-grid article {
    display: grid;
    gap: 0.18rem;
    padding: 0.65rem 0.75rem;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 0.85rem;
    background: rgba(255, 255, 255, 0.72);
  }
</style>
