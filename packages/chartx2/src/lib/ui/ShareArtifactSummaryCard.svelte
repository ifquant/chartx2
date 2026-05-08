<script lang="ts">
  import type { ShareArtifactSummaryModel } from "../public/sharing-surface";
  import HostSurfaceSummaryCard from "./HostSurfaceSummaryCard.svelte";

  export let model: ShareArtifactSummaryModel | null = null;
  export let onOpenShell: () => void;
</script>

{#if model}
  <HostSurfaceSummaryCard
    label="Shared artifact"
    title={model.title}
    statusLabel={model.statusLabel}
    actionLabel="Manage"
    onAction={onOpenShell}
    rootAttributes={{ "data-share-summary-card": "" }}
    statusAttributes={{ "data-share-summary-status": "" }}
    actionAttributes={{ "data-share-summary-open-shell": "" }}
  >
    <div class="share-summary-meta">
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
  </HostSurfaceSummaryCard>
{/if}

<style>
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

  a[data-share-summary-link] {
    color: #0f172a;
    font-size: 0.86rem;
    overflow-wrap: anywhere;
  }
</style>
