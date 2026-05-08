<script lang="ts">
  import type { AccountSyncSummaryShellModel } from "../public/account-sync-surface";
  import type { StrategyTesterSummaryShellModel } from "../public/strategy-tester";
  import type { TradingTicketSummaryShellModel } from "../public/trading-surface";
  import type { WorkbenchHostSummarySurfaceModel } from "../public/workbench";
  import AccountSyncSummaryCard from "./AccountSyncSummaryCard.svelte";
  import StrategyTesterSummaryCard from "./StrategyTesterSummaryCard.svelte";
  import TradingTicketSummaryCard from "./TradingTicketSummaryCard.svelte";

  export let surfaces: readonly WorkbenchHostSummarySurfaceModel[] = [];
  export let strategyTesterSummary: StrategyTesterSummaryShellModel | null = null;
  export let accountSyncSummary: AccountSyncSummaryShellModel | null = null;
  export let tradingTicketSummary: TradingTicketSummaryShellModel | null = null;
  export let onOpenStrategyTester: () => void | Promise<void>;
  export let onRefreshAccountSync: () => void | Promise<void>;
  export let onOpenTradingTicket: () => void | Promise<void>;
</script>

{#if surfaces.length > 0}
  <div class="workbench-summary-strip">
    {#each surfaces as summarySurface (summarySurface.id)}
      {#if summarySurface.kind === "strategy-tester" && strategyTesterSummary}
        <StrategyTesterSummaryCard
          model={strategyTesterSummary}
          onOpenPanel={onOpenStrategyTester}
        />
      {:else if summarySurface.kind === "account-sync" && accountSyncSummary}
        <AccountSyncSummaryCard
          model={accountSyncSummary}
          onRefresh={onRefreshAccountSync}
        />
      {:else if summarySurface.kind === "trading-ticket" && tradingTicketSummary}
        <TradingTicketSummaryCard
          model={tradingTicketSummary}
          onOpenPanel={onOpenTradingTicket}
        />
      {/if}
    {/each}
  </div>
{/if}

<style>
  .workbench-summary-strip {
    display: grid;
    gap: 8px;
    padding: 8px 10px 10px;
  }
</style>
