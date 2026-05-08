<script lang="ts">
  import type {
    WorkbenchWorkspaceTabId,
    WorkbenchWorkspaceTabModel,
  } from "../public/workbench";

  export let tabs: readonly WorkbenchWorkspaceTabModel[] = [];
  export let onSelectTab: (tabId: WorkbenchWorkspaceTabId) => void | Promise<void> = () => {};
  export let onCloseTab: (tabId: WorkbenchWorkspaceTabId) => void | Promise<void> = () => {};
  export let onCreateTab: () => void | Promise<void> = () => {};

  function handleSelectTab(tab: WorkbenchWorkspaceTabModel): void {
    if (!tab.enabled) {
      return;
    }

    void onSelectTab(tab.id);
  }

  function handleCloseTab(event: MouseEvent, tabId: WorkbenchWorkspaceTabId): void {
    event.stopPropagation();
    void onCloseTab(tabId);
  }

  function handleCreateTab(): void {
    void onCreateTab();
  }
</script>

<div class="workspace-tab-strip" data-workspace-tabs>
  {#each tabs as tab (tab.id)}
    <div
      class="workspace-tab-chip"
      class:active={tab.active}
      data-workspace-tab={tab.id}
      data-workspace-active={tab.active ? "true" : "false"}
      data-workspace-panel={tab.sidebarPanel}
      data-workspace-view={tab.viewId}
    >
      <button
        type="button"
        class="workspace-tab-main"
        data-workspace-tab-trigger={tab.id}
        disabled={!tab.enabled}
        aria-disabled={!tab.enabled}
        on:click={() => handleSelectTab(tab)}
      >
        <strong>{tab.label}</strong>
        <span class="workspace-tab-detail" data-workspace-tab-detail
          >{tab.symbolLabel ?? "--"} · {tab.timeframeLabel ?? "--"}</span
        >
      </button>
      {#if tab.closeable}
        <button
          type="button"
          class="workspace-tab-close"
          aria-label={`Close ${tab.label}`}
          data-workspace-tab-close={tab.id}
          on:click={(event) => handleCloseTab(event, tab.id)}
        >
          ×
        </button>
      {/if}
    </div>
  {/each}
  <button
    type="button"
    class="workspace-tab-create"
    data-workspace-tab-create
    on:click={handleCreateTab}
  >
    ＋
  </button>
</div>

<style>
  .workspace-tab-strip {
    display: flex;
    gap: 6px;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .workspace-tab-strip::-webkit-scrollbar {
    display: none;
  }

  .workspace-tab-chip.active {
    background: #18181b;
    color: #fffdf8;
  }

  .workspace-tab-chip {
    display: inline-flex;
    align-items: stretch;
    min-width: 0;
    border-radius: 10px;
    background: rgba(24, 24, 27, 0.06);
  }

  .workspace-tab-strip button {
    flex: 0 0 auto;
    white-space: nowrap;
    border: 0;
    font: inherit;
  }

  .workspace-tab-main {
    display: grid;
    gap: 2px;
    min-width: 112px;
    padding: 8px 10px;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    border-radius: 10px 0 0 10px;
  }

  .workspace-tab-main strong {
    font-size: 0.82rem;
  }

  .workspace-tab-detail {
    font-size: 0.72rem;
    opacity: 0.72;
  }

  .workspace-tab-close,
  .workspace-tab-create {
    width: 30px;
    padding: 6px 9px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .workspace-tab-close {
    border-radius: 0 10px 10px 0;
  }

  .workspace-tab-create {
    border-radius: 10px;
    background: rgba(24, 24, 27, 0.06);
  }

  @media (max-width: 840px) {
    .workspace-tab-strip {
      gap: 0.45rem;
    }

    .workspace-tab-chip {
      border-radius: 0.85rem;
    }

    .workspace-tab-main {
      min-width: 0;
      padding: 0.58rem 0.7rem;
    }

    .workspace-tab-detail {
      display: none;
    }

    .workspace-tab-close,
    .workspace-tab-create {
      width: 26px;
      padding: 0;
    }
  }
</style>
