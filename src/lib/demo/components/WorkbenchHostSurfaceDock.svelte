<script lang="ts">
  import type { AccountSyncSummaryShellModel } from "../../chartx/public/account-sync-surface";
  import type { ShareArtifactSummaryModel } from "../../chartx/public/sharing-surface";
  import type { StrategyTesterSummaryShellModel } from "../../chartx/public/strategy-tester";
  import type { TradingTicketSummaryShellModel } from "../../chartx/public/trading-surface";
  import type { WorkbenchHostSummarySurfaceModel } from "../../chartx/public/workbench";
  import ShareArtifactSummaryCard from "./ShareArtifactSummaryCard.svelte";
  import WorkbenchHostSummaryStrip from "./WorkbenchHostSummaryStrip.svelte";

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
