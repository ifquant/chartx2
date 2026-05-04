<script lang="ts">
  import type { AccountSyncSummaryShellModel } from "../../chartx/public/account-sync-surface";
  import HostSurfaceSummaryCard from "./HostSurfaceSummaryCard.svelte";

  export let model: AccountSyncSummaryShellModel | null = null;
  export let onRefresh: () => void = () => {};
</script>

{#if model}
  <HostSurfaceSummaryCard
    label="Account sync shell"
    title={model.providerLabel}
    subtitle={model.accountLabel}
    statusLabel={model.statusLabel}
    actionLabel={model.actionLabel ?? "Refresh"}
    actionDisabled={model.actionEnabled === false}
    onAction={onRefresh}
    rootAttributes={{ "data-account-sync-summary-card": "" }}
    subtitleAttributes={{ "data-account-sync-summary-account": "" }}
    statusAttributes={{ "data-account-sync-summary-status": "" }}
    actionAttributes={{ "data-account-sync-summary-refresh": "" }}
  >
    <div class="account-sync-summary-targets">
      {#each model.targetSummaries as target, index}
        <span data-account-sync-summary-target={index}>{target}</span>
      {/each}
    </div>
  </HostSurfaceSummaryCard>
{/if}

<style>
  .account-sync-summary-targets span {
    color: rgba(15, 23, 42, 0.7);
  }

  .account-sync-summary-targets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  .account-sync-summary-targets span {
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: rgba(226, 232, 240, 0.8);
    font-size: 0.78rem;
  }
</style>
