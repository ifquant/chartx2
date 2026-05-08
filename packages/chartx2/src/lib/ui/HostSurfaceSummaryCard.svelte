<script lang="ts">
  export let label = "";
  export let title = "";
  export let subtitle: string | undefined = undefined;
  export let statusLabel = "";
  export let actionLabel: string | undefined = undefined;
  export let actionDisabled = false;
  export let onAction: () => void = () => {};
  export let rootAttributes: Record<string, string> = {};
  export let subtitleAttributes: Record<string, string> = {};
  export let statusAttributes: Record<string, string> = {};
  export let actionAttributes: Record<string, string> = {};
  const elementTag = "section";
</script>

<svelte:element this={elementTag} class="host-summary-card" {...rootAttributes}>
  <div class="host-summary-head">
    <div>
      <span class="host-summary-label">{label}</span>
      <strong>{title}</strong>
      {#if subtitle}
        <small {...subtitleAttributes}>{subtitle}</small>
      {/if}
    </div>
    {#if actionLabel}
      <button
        type="button"
        disabled={actionDisabled}
        on:click={onAction}
        {...actionAttributes}
      >
        {actionLabel}
      </button>
    {/if}
  </div>

  <p class="host-summary-status" {...statusAttributes}>{statusLabel}</p>
  <div class="host-summary-body">
    <slot />
  </div>
</svelte:element>

<style>
  .host-summary-card {
    display: grid;
    gap: 0.7rem;
    padding: 0.9rem 1rem;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 1rem;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.92));
  }

  .host-summary-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
  }

  .host-summary-label {
    display: block;
    color: rgba(15, 23, 42, 0.56);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.2rem;
  }

  .host-summary-head small,
  .host-summary-status {
    color: rgba(15, 23, 42, 0.7);
  }

  .host-summary-head button {
    border: 1px solid rgba(15, 23, 42, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    padding: 0.35rem 0.7rem;
    font-size: 0.82rem;
  }

  .host-summary-status {
    margin: 0;
    font-size: 0.9rem;
  }

  .host-summary-body {
    display: grid;
    gap: 0.6rem;
  }
</style>
