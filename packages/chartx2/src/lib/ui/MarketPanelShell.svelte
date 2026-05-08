<script lang="ts">
  import type { MarketPanelModel, MarketPanelTone } from "../public/market-panel-surface";

  const EMPTY_MODEL: MarketPanelModel = {
    tabs: [],
    activeTabId: "loading",
    depthRows: [],
    profileRows: [],
  };

  export let model: MarketPanelModel = EMPTY_MODEL;
  export let onSelectTab: (tabId: string) => void | Promise<void> = () => {};

  function toneClass(tone?: MarketPanelTone): string | undefined {
    if (tone === "red") {
      return "red";
    }
    if (tone === "green") {
      return "green";
    }
    return undefined;
  }
</script>

<section class="market-panel-shell" data-market-panel-shell data-market-panel-active-tab={model.activeTabId}>
  <div class="side-tabs" aria-label={model.title ?? "Market panel tabs"}>
    {#each model.tabs as tab}
      <button
        type="button"
        class:active={model.activeTabId === tab.id}
        data-market-panel-tab={tab.id}
        onclick={() => {
          void onSelectTab(tab.id);
        }}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#if model.activeTabId === "ladder"}
    <div class="ladder">
      <div class="green">买量</div><div>价格</div><div class="red">卖量</div>
      {#each model.depthRows as row}
        <div class={toneClass(row.bidTone)}>{row.bidSize ?? ""}</div>
        <div>{row.price}</div>
        <div class={toneClass(row.askTone)}>{row.askSize ?? ""}</div>
      {/each}
    </div>
  {:else}
    <div class="profile-grid">
      {#each model.profileRows as row}
        <div class="profile-row">
          <span>{row.label}</span>
          <strong class={toneClass(row.tone)}>{row.valueLabel}</strong>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .market-panel-shell {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: 30px minmax(0, 1fr);
    overflow: hidden;
  }

  .side-tabs {
    display: flex;
    border-bottom: 1px solid #8f9aa1;
    background: #e4eaec;
  }

  .side-tabs button {
    flex: 1;
    display: grid;
    place-items: center;
    border-right: 1px solid #c3cdd2;
    border-top: 0;
    border-left: 0;
    border-bottom: 0;
    background: transparent;
    font-weight: 800;
  }

  .side-tabs .active {
    background: #fff;
    color: #0f5964;
  }

  .ladder {
    display: grid;
    grid-template-columns: 1fr 0.9fr 1fr;
    align-content: start;
    background: #101719;
    color: #dbe5e8;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    overflow: hidden;
  }

  .ladder div {
    padding: 4px 3px;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    text-align: right;
  }

  .profile-grid {
    display: grid;
    align-content: start;
    background: #101719;
    color: #dbe5e8;
    font-size: 11px;
    padding: 8px;
    gap: 6px;
    overflow: auto;
  }

  .profile-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .profile-row span {
    color: #93a7ad;
    font-weight: 700;
  }

  .profile-row strong {
    text-align: right;
  }

  .red {
    color: #e06b5f;
  }

  .green {
    color: #56b987;
  }
</style>
