<script lang="ts">
  import type { StrategyTesterSummaryShellModel } from "$lib/chartx/public/strategy-tester";
  import HostSurfaceSummaryCard from "$lib/demo/components/HostSurfaceSummaryCard.svelte";

  export let model: StrategyTesterSummaryShellModel | null = null;
  export let onOpenPanel: () => void;
</script>

{#if model}
  <HostSurfaceSummaryCard
    label="Strategy tester shell"
    title={model.title}
    subtitle={model.runLabel}
    statusLabel={model.statusLabel}
    actionLabel="Open tester"
    onAction={onOpenPanel}
    rootAttributes={{ "data-strategy-tester-summary-card": "" }}
    subtitleAttributes={{ "data-strategy-tester-summary-run": "" }}
    statusAttributes={{ "data-strategy-tester-summary-status": "" }}
    actionAttributes={{ "data-strategy-tester-summary-open": "" }}
  >
    <div class="strategy-summary-grid">
      {#each model.highlights as metric}
        <article data-strategy-tester-summary-metric={metric.id}>
          <span>{metric.label}</span>
          <strong>{metric.valueLabel}</strong>
        </article>
      {/each}
    </div>
  </HostSurfaceSummaryCard>
{/if}

<style>
  .strategy-summary-grid span {
    color: rgba(15, 23, 42, 0.7);
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
