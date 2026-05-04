<script lang="ts">
  import type { ShareArtifactSummaryModel } from "$lib/chartx/public/sharing-surface";

  export let model: ShareArtifactSummaryModel | null = null;
  export let onOpenShell: () => void;
</script>

{#if model}
  <section class="share-summary-card" data-share-summary-card>
    <div class="share-summary-head">
      <div>
        <span class="share-summary-label">Shared artifact</span>
        <strong>{model.title}</strong>
      </div>
      <button type="button" data-share-summary-open-shell on:click={onOpenShell}>Manage</button>
    </div>

    <div class="share-summary-meta">
      <small data-share-summary-status>{model.statusLabel}</small>
      <small data-share-summary-visibility>{model.visibility}</small>
      <small>{model.artifactType}</small>
    </div>

    {#if model.href}
      <a href={model.href} target="_blank" rel="noreferrer" data-share-summary-link>{model.href}</a>
    {/if}

    <div class="share-summary-tags">
      {#if model.versionLabel}
        <span data-share-summary-version>{model.versionLabel}</span>
      {/if}
      {#if model.reviewLabel}
        <span data-share-summary-review>{model.reviewLabel}</span>
      {/if}
      {#if model.permissionLabel}
        <span data-share-summary-permission>{model.permissionLabel}</span>
      {/if}
    </div>
  </section>
{/if}

<style>
  .share-summary-card {
    display: grid;
    gap: 0.6rem;
    padding: 0.85rem 1rem;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 0.95rem;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.92));
  }

  .share-summary-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
  }

  .share-summary-head button {
    border: 1px solid rgba(15, 23, 42, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    padding: 0.35rem 0.7rem;
    font-size: 0.82rem;
  }

  .share-summary-label {
    display: block;
    color: rgba(15, 23, 42, 0.56);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.2rem;
  }

  .share-summary-meta,
  .share-summary-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  .share-summary-meta small,
  .share-summary-tags span {
    color: rgba(15, 23, 42, 0.7);
  }

  .share-summary-tags span {
    padding: 0.18rem 0.5rem;
    border-radius: 999px;
    background: rgba(226, 232, 240, 0.8);
    font-size: 0.78rem;
  }

  .share-summary-card a {
    color: #0f172a;
    font-size: 0.86rem;
    overflow-wrap: anywhere;
  }
</style>
