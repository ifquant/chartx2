<script lang="ts">
  import type { AccountSyncSummaryShellModel } from "$lib/chartx/public/account-sync-surface";
  import type { ShareArtifactSummaryModel } from "$lib/chartx/public/sharing-surface";
  import type { StrategyTesterSummaryShellModel } from "$lib/chartx/public/strategy-tester";
  import type { TradingTicketSummaryShellModel } from "$lib/chartx/public/trading-surface";
  import type { WorkbenchHostSummarySurfaceModel } from "$lib/chartx/public/workbench";
  import ShareArtifactSummaryCard from "$lib/demo/components/ShareArtifactSummaryCard.svelte";
  import WorkbenchHostSummaryStrip from "$lib/demo/components/WorkbenchHostSummaryStrip.svelte";

  export let shareSummary: ShareArtifactSummaryModel | null = null;
  export let hostSummarySurfaces: readonly WorkbenchHostSummarySurfaceModel[] = [];
  export let strategyTesterSummary: StrategyTesterSummaryShellModel | null = null;
  export let accountSyncSummary: AccountSyncSummaryShellModel | null = null;
  export let tradingTicketSummary: TradingTicketSummaryShellModel | null = null;
  export let onOpenShareShell: () => void | Promise<void>;
  export let onOpenStrategyTester: () => void | Promise<void>;
  export let onRefreshAccountSync: () => void | Promise<void>;
  export let onOpenTradingTicket: () => void | Promise<void>;
</script>

<div class="workbench-host-surface-dock" data-workbench-host-surface-dock>
  <ShareArtifactSummaryCard
    model={shareSummary}
    onOpenShell={onOpenShareShell}
  />
  <WorkbenchHostSummaryStrip
    surfaces={hostSummarySurfaces}
    strategyTesterSummary={strategyTesterSummary}
    accountSyncSummary={accountSyncSummary}
    tradingTicketSummary={tradingTicketSummary}
    onOpenStrategyTester={onOpenStrategyTester}
    onRefreshAccountSync={onRefreshAccountSync}
    onOpenTradingTicket={onOpenTradingTicket}
  />
</div>

<style>
  .workbench-host-surface-dock {
    display: grid;
    gap: 10px;
  }
</style>
