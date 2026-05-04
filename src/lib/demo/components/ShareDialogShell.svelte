<script lang="ts">
  import type { ShareDialogModel, ShareVisibility } from "$lib/chartx/public/sharing-surface";

  export let model: ShareDialogModel | null = null;
  export let open = false;
  export let onClose: () => void;
  export let onRunAction: (actionId: string) => void;

  const visibilityActions: Array<{ value: ShareVisibility; label: string; actionId: string }> = [
    { value: "private", label: "Private", actionId: "share-dialog-visibility-private" },
    { value: "unlisted", label: "Unlisted", actionId: "share-dialog-visibility-unlisted" },
    { value: "public", label: "Public", actionId: "share-dialog-visibility-public" },
  ];
</script>

{#if open && model}
  <button
    type="button"
    class="share-dialog-backdrop"
    aria-label="Close share dialog"
    on:click={onClose}
  ></button>
  <div
    id="workbench-share-dialog"
    class="share-dialog"
    data-share-dialog
    role="dialog"
    aria-modal="true"
    aria-label="Share layout"
  >
    <header class="share-dialog-head">
      <div>
        <strong>Share Layout</strong>
        <p>{model.descriptionLabel}</p>
      </div>
      <button type="button" class="share-dialog-close" aria-label="Close share dialog" on:click={onClose}>
        ×
      </button>
    </header>

    <div class="share-dialog-body">
      <div class="share-dialog-block">
        <span class="share-dialog-label">Artifact</span>
        <strong>{model.title}</strong>
        <small>{model.artifactType}</small>
      </div>

      {#if (model.artifactFields?.length ?? 0) > 0}
        <div class="share-dialog-metadata" data-share-dialog-metadata>
          {#each model.artifactFields ?? [] as field}
            <article data-share-dialog-field={field.id}>
              <span class="share-dialog-label">{field.label}</span>
              <strong>{field.valueLabel}</strong>
            </article>
          {/each}
        </div>
      {/if}

      <div class="share-dialog-block">
        <span class="share-dialog-label">Visibility</span>
        <div class="share-dialog-visibility">
          {#each visibilityActions as visibility}
            <button
              type="button"
              class:active={model.visibility === visibility.value}
              data-share-dialog-visibility={visibility.value}
              aria-pressed={model.visibility === visibility.value ? "true" : "false"}
              on:click={() => onRunAction(visibility.actionId)}
            >
              {visibility.label}
            </button>
          {/each}
        </div>
      </div>

      <div
        class={`share-dialog-state tone-${model.state.status}`}
        data-share-dialog-state
        data-share-dialog-status={model.state.status}
      >
        <strong>{model.state.statusLabel ?? "Ready"}</strong>
        {#if model.state.errorLabel}
          <span>{model.state.errorLabel}</span>
        {/if}
      </div>

      {#if model.link}
        <div class="share-dialog-link">
          <span class="share-dialog-label">{model.link.label}</span>
          <a href={model.link.href} target="_blank" rel="noreferrer" data-share-dialog-link>
            {model.link.href}
          </a>
          {#if (model.secondaryActions?.length ?? 0) > 0}
            <div class="share-dialog-secondary-actions">
              {#each model.secondaryActions ?? [] as action}
                <button
                  type="button"
                  class:primary={action.tone === "primary"}
                  data-share-dialog-action={action.id}
                  disabled={action.disabled}
                  on:click={() => onRunAction(action.id)}
                >
                  {action.label}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      {#if (model.historyEntries?.length ?? 0) > 0}
        <div class="share-dialog-history" data-share-dialog-history>
          <span class="share-dialog-label">History</span>
          <div class="share-dialog-history-list">
            {#each model.historyEntries ?? [] as entry}
              <article data-share-dialog-history-entry={entry.id}>
                <div class="share-dialog-history-head">
                  <strong>{entry.versionLabel}</strong>
                  <span>{entry.createdAtLabel}</span>
                </div>
                <div class="share-dialog-history-meta">
                  <small>{entry.statusLabel}</small>
                  <small>{entry.visibility}</small>
                </div>
                {#if entry.noteLabel}
                  <p>{entry.noteLabel}</p>
                {/if}
              </article>
            {/each}
          </div>
        </div>
      {/if}

      {#if (model.reviewEntries?.length ?? 0) > 0}
        <div class="share-dialog-review-queue" data-share-dialog-review-queue>
          <span class="share-dialog-label">Import review</span>
          <div class="share-dialog-review-list">
            {#each model.reviewEntries ?? [] as entry}
              <article data-share-dialog-review-entry={entry.id}>
                <div class="share-dialog-history-head">
                  <strong>{entry.label}</strong>
                  <span>{entry.statusLabel}</span>
                </div>
                <div class="share-dialog-history-meta">
                  <small>{entry.targetLabel}</small>
                </div>
                {#if entry.noteLabel}
                  <p>{entry.noteLabel}</p>
                {/if}
              </article>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <footer class="share-dialog-actions">
      <button type="button" class="secondary" on:click={onClose}>Close</button>
      <button
        type="button"
        class="primary"
        data-share-dialog-publish
        disabled={!model.state.publishEnabled}
        on:click={() => onRunAction("share-dialog-publish")}
      >
        {model.state.status === "publishing" ? "Publishing..." : model.publishLabel}
      </button>
    </footer>
  </div>
{/if}

<style>
  .share-dialog-backdrop {
    position: fixed;
    inset: 0;
    border: none;
    background: rgba(15, 23, 42, 0.48);
    z-index: 20;
  }

  .share-dialog {
    position: fixed;
    top: 7.5rem;
    right: 2rem;
    width: min(30rem, calc(100vw - 2rem));
    display: grid;
    gap: 1rem;
    padding: 1.1rem;
    border: 1px solid rgba(15, 23, 42, 0.16);
    border-radius: 1rem;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.98));
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
    color: #0f172a;
    z-index: 21;
  }

  .share-dialog-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .share-dialog-head p {
    margin: 0.35rem 0 0;
    color: rgba(15, 23, 42, 0.72);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .share-dialog-close {
    width: 2rem;
    height: 2rem;
    border: 1px solid rgba(15, 23, 42, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
  }

  .share-dialog-body {
    display: grid;
    gap: 0.9rem;
  }

  .share-dialog-block,
  .share-dialog-link {
    display: grid;
    gap: 0.3rem;
  }

  .share-dialog-metadata {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 0.7rem;
  }

  .share-dialog-metadata article {
    display: grid;
    gap: 0.22rem;
    padding: 0.7rem 0.8rem;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 0.85rem;
    background: rgba(248, 250, 252, 0.9);
  }

  .share-dialog-history {
    display: grid;
    gap: 0.45rem;
  }

  .share-dialog-history-list {
    display: grid;
    gap: 0.55rem;
  }

  .share-dialog-review-list {
    display: grid;
    gap: 0.55rem;
  }

  .share-dialog-history-list article {
    display: grid;
    gap: 0.25rem;
    padding: 0.75rem 0.85rem;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 0.85rem;
    background: rgba(248, 250, 252, 0.9);
  }

  .share-dialog-review-list article {
    display: grid;
    gap: 0.25rem;
    padding: 0.75rem 0.85rem;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 0.85rem;
    background: rgba(248, 250, 252, 0.9);
  }

  .share-dialog-history-head,
  .share-dialog-history-meta {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .share-dialog-history-meta small,
  .share-dialog-history-list p {
    color: rgba(15, 23, 42, 0.62);
    margin: 0;
  }

  .share-dialog-label {
    color: rgba(15, 23, 42, 0.58);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .share-dialog-block small {
    color: rgba(15, 23, 42, 0.62);
  }

  .share-dialog-visibility {
    display: flex;
    gap: 0.5rem;
  }

  .share-dialog-visibility button,
  .share-dialog-actions button,
  .share-dialog-close {
    cursor: pointer;
    transition:
      transform 120ms ease,
      background-color 120ms ease,
      border-color 120ms ease;
  }

  .share-dialog-visibility button {
    padding: 0.55rem 0.8rem;
    border: 1px solid rgba(15, 23, 42, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    color: rgba(15, 23, 42, 0.74);
    font-weight: 600;
  }

  .share-dialog-visibility button.active {
    border-color: rgba(37, 99, 235, 0.45);
    background: rgba(219, 234, 254, 0.92);
    color: #1d4ed8;
  }

  .share-dialog-state {
    display: grid;
    gap: 0.25rem;
    padding: 0.85rem 0.95rem;
    border-radius: 0.85rem;
    background: rgba(226, 232, 240, 0.78);
  }

  .share-dialog-state.tone-ready {
    background: rgba(219, 234, 254, 0.82);
  }

  .share-dialog-state.tone-publishing,
  .share-dialog-state.tone-loading {
    background: rgba(254, 240, 138, 0.55);
  }

  .share-dialog-state.tone-error {
    background: rgba(254, 226, 226, 0.82);
    color: #991b1b;
  }

  .share-dialog-link a {
    color: #1d4ed8;
    overflow-wrap: anywhere;
  }

  .share-dialog-secondary-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 0.35rem;
  }

  .share-dialog-secondary-actions button {
    padding: 0.55rem 0.8rem;
    border: 1px solid rgba(15, 23, 42, 0.14);
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.82);
    color: #0f172a;
    font-weight: 600;
  }

  .share-dialog-secondary-actions button.primary {
    border-color: rgba(37, 99, 235, 0.42);
    background: rgba(219, 234, 254, 0.92);
    color: #1d4ed8;
  }

  .share-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
  }

  .share-dialog-actions button {
    min-width: 7.5rem;
    padding: 0.7rem 1rem;
    border-radius: 0.85rem;
    border: 1px solid rgba(15, 23, 42, 0.14);
    font-weight: 700;
  }

  .share-dialog-actions button.secondary {
    background: rgba(255, 255, 255, 0.82);
    color: #0f172a;
  }

  .share-dialog-actions button.primary {
    border-color: rgba(37, 99, 235, 0.42);
    background: linear-gradient(180deg, #3b82f6, #2563eb);
    color: #eff6ff;
  }

  .share-dialog-actions button:disabled {
    cursor: default;
    opacity: 0.65;
  }

  @media (max-width: 840px) {
    .share-dialog {
      top: auto;
      right: 0.75rem;
      bottom: 0.75rem;
      left: 0.75rem;
      width: auto;
    }
  }
</style>
