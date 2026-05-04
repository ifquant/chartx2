<script lang="ts">
  import type { AccountSyncSummaryShellModel } from "$lib/chartx/public/account-sync-surface";

  export let model: AccountSyncSummaryShellModel | null = null;
  export let onRefresh: () => void = () => {};
</script>

{#if model}
  <section class="account-sync-summary-card" data-account-sync-summary-card>
    <div class="account-sync-summary-head">
      <div>
        <span class="account-sync-summary-label">Account sync shell</span>
        <strong>{model.providerLabel}</strong>
        {#if model.accountLabel}
          <small data-account-sync-summary-account>{model.accountLabel}</small>
        {/if}
      </div>
      <button
        type="button"
        data-account-sync-summary-refresh
        disabled={model.actionEnabled === false}
        on:click={onRefresh}
      >
        {model.actionLabel ?? "Refresh"}
      </button>
    </div>

    <p class="account-sync-summary-status" data-account-sync-summary-status>{model.statusLabel}</p>

    <div class="account-sync-summary-targets">
      {#each model.targetSummaries as target, index}
        <span data-account-sync-summary-target={index}>{target}</span>
      {/each}
    </div>
  </section>
{/if}

<style>
  .account-sync-summary-card {
    display: grid;
    gap: 0.7rem;
    padding: 0.9rem 1rem;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 1rem;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.92));
  }

  .account-sync-summary-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
  }

  .account-sync-summary-label {
    display: block;
    color: rgba(15, 23, 42, 0.56);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.2rem;
  }

  .account-sync-summary-head small,
  .account-sync-summary-status,
  .account-sync-summary-targets span {
    color: rgba(15, 23, 42, 0.7);
  }

  .account-sync-summary-head button {
    border: 1px solid rgba(15, 23, 42, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    padding: 0.35rem 0.7rem;
    font-size: 0.82rem;
  }

  .account-sync-summary-status {
    margin: 0;
    font-size: 0.9rem;
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
