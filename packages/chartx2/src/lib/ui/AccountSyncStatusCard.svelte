<script lang="ts">
  import type { AccountSyncSurfaceModel } from "../public/account-sync-surface";

  export let model: AccountSyncSurfaceModel | null = null;
  export let onRefresh: () => void = () => {};
</script>

{#if model}
  <section class="mini-card account-sync-card" data-workbench-panel="account-sync">
    <div class="sidebar-head">
      <h4>Account Sync</h4>
      <button
        type="button"
        disabled={model.state.status === "loading"}
        data-account-sync-refresh
        on:click={onRefresh}
      >
        {model.actionLabel ?? "Refresh"}
      </button>
    </div>

    <div class="account-sync-summary">
      <strong>{model.providerLabel}</strong>
      {#if model.accountLabel}
        <span>{model.accountLabel}</span>
      {/if}
    </div>

    <article
      class={`account-sync-status status-${model.state.status}`}
      data-account-sync-status={model.state.status}
    >
      <strong>{model.state.statusLabel}</strong>
      {#if model.state.detailLabel}
        <span>{model.state.detailLabel}</span>
      {/if}
      {#if model.state.errorLabel}
        <small>{model.state.errorLabel}</small>
      {/if}
    </article>

    <div class="account-sync-targets">
      {#each model.targets as target}
        <article
          class={`account-sync-target target-${target.state}`}
          data-account-sync-target={target.id}
        >
          <div class="account-sync-target-head">
            <strong>{target.label}</strong>
            <span>{target.stateLabel}</span>
          </div>
          {#if target.detailLabel}
            <span>{target.detailLabel}</span>
          {/if}
          {#if target.lastUpdatedLabel}
            <small>{target.lastUpdatedLabel}</small>
          {/if}
          {#if target.errorLabel}
            <small>{target.errorLabel}</small>
          {/if}
        </article>
      {/each}
    </div>
  </section>
{/if}

<style>
  .account-sync-card {
    display: grid;
    gap: 10px;
  }

  .account-sync-summary {
    display: grid;
    gap: 2px;
  }

  .account-sync-summary span,
  .account-sync-status span,
  .account-sync-target > span,
  .account-sync-status small,
  .account-sync-target small {
    color: rgba(24, 24, 27, 0.62);
    font-size: 0.76rem;
    line-height: 1.45;
  }

  .account-sync-status,
  .account-sync-target {
    display: grid;
    gap: 4px;
    padding: 9px 10px;
    border-radius: 10px;
    background: rgba(24, 24, 27, 0.04);
  }

  .account-sync-status.status-ready,
  .account-sync-target.target-synced {
    background: rgba(22, 163, 74, 0.08);
  }

  .account-sync-status.status-loading,
  .account-sync-target.target-syncing {
    background: rgba(37, 99, 235, 0.08);
  }

  .account-sync-status.status-error,
  .account-sync-target.target-error {
    background: rgba(220, 38, 38, 0.08);
  }

  .account-sync-targets {
    display: grid;
    gap: 8px;
  }

  .account-sync-target-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .account-sync-card :global(button[disabled]) {
    cursor: default;
    opacity: 0.6;
  }
</style>
