<script lang="ts">
  import type { AccountSyncSurfaceModel } from "./account-sync-surface";
  import type { ShareDialogModel } from "./sharing-surface";
  import type { StrategyTesterPanelModel } from "./strategy-tester";
  import type { TradingTicketModel } from "./trading-surface";
  import type { WorkbenchHostSummarySurfaceModel } from "./workbench";
  import {
    AccountSyncStatusCard,
    ShareDialogShell,
    StrategyTesterPanel,
    TradingTicketPanel,
    WorkbenchHostSurfaceDock,
  } from "./host-shell-components";

  let shareDialogOpen = false;
  let activeBottomSurface: "strategy" | "trading" | null = null;

  const hostSummarySurfaces: readonly WorkbenchHostSummarySurfaceModel[] = [
    { id: "strategy-tester-summary", kind: "strategy-tester" },
    { id: "account-sync-summary", kind: "account-sync" },
    { id: "trading-ticket-summary", kind: "trading-ticket" },
  ];

  const shareDialog: ShareDialogModel = {
    artifactType: "layout",
    title: "Alpha2 Workspace Layout",
    descriptionLabel: "Fixture-backed publish shell mounted through the public chartx boundary.",
    visibility: "private",
    summaryCard: {
      title: "Alpha2 Workspace Layout",
      artifactType: "layout",
      visibility: "private",
      statusLabel: "Ready to publish",
      href: "https://example.invalid/layouts/alpha2-main",
      versionLabel: "v5",
      reviewLabel: "2 review items",
      permissionLabel: "Owner only",
    },
    artifactFields: [
      { id: "symbol", label: "Primary symbol", valueLabel: "NQ1!" },
      { id: "layout", label: "Layout", valueLabel: "Main plus secondary" },
    ],
    secondaryActions: [
      { id: "copy-link", label: "Copy link" },
      { id: "review", label: "Open review" },
    ],
    publishLabel: "Publish",
    state: {
      status: "ready",
      publishEnabled: true,
      statusLabel: "Ready",
    },
  };

  const strategyTester: StrategyTesterPanelModel = {
    title: "Strategy Tester",
    runLabel: "Fixture run #17",
    summaryShell: {
      title: "Strategy Tester",
      runLabel: "Fixture run #17",
      statusLabel: "Stable shell",
      highlights: [
        { id: "net-profit", label: "Net profit", valueLabel: "+12,340", tone: "positive" },
        { id: "profit-factor", label: "Profit factor", valueLabel: "1.68" },
      ],
    },
    summaryMetrics: [
      { id: "net-profit", label: "Net profit", valueLabel: "+12,340", tone: "positive" },
      { id: "profit-factor", label: "Profit factor", valueLabel: "1.68" },
    ],
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "trades", label: "Trades", badgeLabel: "24" },
    ],
    trades: [
      {
        id: "trade-1",
        side: "long",
        symbolLabel: "NQ1!",
        entryTimeLabel: "09:31",
        exitTimeLabel: "10:14",
        pnlLabel: "+1,420",
        statusLabel: "Closed",
      },
    ],
    equityCurve: [{ id: "eq-1", timeLabel: "Run close", equityLabel: "112,340", value: 112340 }],
    state: {
      status: "ready",
      activeTabId: "overview",
      statusLabel: "Fixture-backed tester shell",
    },
  };

  const tradingTicket: TradingTicketModel = {
    title: "Trading Ticket",
    symbol: "NQ1!",
    summaryShell: {
      title: "Trading Ticket",
      symbol: "NQ1!",
      statusLabel: "Ready for review",
      side: "buy",
      orderType: "limit",
      quantityLabel: "2 contracts",
      accountLabel: "SIM-01",
    },
    side: "buy",
    orderType: "limit",
    quantity: {
      label: "Quantity",
      valueLabel: "2 contracts",
    },
    limitPrice: {
      label: "Limit price",
      valueLabel: "21,452.25",
    },
    accountLabel: "SIM-01",
    summaryLabel: "Bracket entry",
    submitLabel: "Review order",
    state: {
      status: "ready",
      statusLabel: "Local ticket shell",
      submitEnabled: true,
    },
  };

  const accountSync: AccountSyncSurfaceModel = {
    providerLabel: "Workspace Sync",
    accountLabel: "alpha2-main",
    summaryShell: {
      providerLabel: "Workspace Sync",
      accountLabel: "alpha2-main",
      statusLabel: "Synced 20s ago",
      targetSummaries: ["Layouts synced", "Watchlists synced"],
      actionLabel: "Refresh",
      actionEnabled: true,
    },
    state: {
      status: "ready",
      statusLabel: "Connected",
      detailLabel: "Fixture-backed sync status",
    },
    targets: [
      {
        id: "layouts",
        label: "Layouts",
        state: "synced",
        stateLabel: "Synced",
        lastUpdatedLabel: "20 seconds ago",
      },
      {
        id: "watchlists",
        label: "Watchlists",
        state: "synced",
        stateLabel: "Synced",
        lastUpdatedLabel: "20 seconds ago",
      },
    ],
    actionLabel: "Refresh",
  };
</script>

<div class="alpha2-host-example" data-alpha2-host-example>
  <div class="alpha2-host-actions">
    <button type="button" on:click={() => { shareDialogOpen = true; }}>Open share</button>
    <button type="button" on:click={() => { activeBottomSurface = "strategy"; }}>Open strategy tester</button>
    <button type="button" on:click={() => { activeBottomSurface = "trading"; }}>Open trading ticket</button>
  </div>

  <WorkbenchHostSurfaceDock
    shareSummary={shareDialog.summaryCard ?? null}
    hostSummarySurfaces={hostSummarySurfaces}
    strategyTesterSummary={strategyTester.summaryShell ?? null}
    tradingTicketSummary={tradingTicket.summaryShell ?? null}
    accountSyncSummary={accountSync.summaryShell ?? null}
    onOpenShareShell={() => {
      shareDialogOpen = true;
    }}
    onOpenStrategyTester={() => {
      activeBottomSurface = "strategy";
    }}
    onOpenTradingTicket={() => {
      activeBottomSurface = "trading";
    }}
    onRefreshAccountSync={() => {
      // Host-owned refresh callback.
    }}
  />

  <ShareDialogShell
    model={shareDialog}
    open={shareDialogOpen}
    onClose={() => {
      shareDialogOpen = false;
    }}
    onRunAction={() => {
      // Host-owned action execution.
    }}
  />

  <div class="alpha2-host-status">
    <AccountSyncStatusCard
      model={accountSync}
      onRefresh={() => {
        // Host-owned refresh callback.
      }}
    />
  </div>

  {#if activeBottomSurface === "strategy"}
    <div class="alpha2-host-panel">
      <StrategyTesterPanel
        model={strategyTester}
        onLocateTrade={() => {
          // Host-owned locate behavior.
        }}
      />
    </div>
  {:else if activeBottomSurface === "trading"}
    <div class="alpha2-host-panel">
      <TradingTicketPanel
        model={tradingTicket}
      />
    </div>
  {/if}
</div>

<style>
  .alpha2-host-example {
    display: grid;
    gap: 14px;
  }

  .alpha2-host-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .alpha2-host-actions button {
    padding: 0.6rem 0.85rem;
    border: 1px solid rgba(15, 23, 42, 0.14);
    border-radius: 999px;
    background: rgba(255, 250, 243, 0.86);
    color: #0f172a;
    font: inherit;
  }

  .alpha2-host-status,
  .alpha2-host-panel {
    padding: 12px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 18px;
    background: rgba(255, 250, 243, 0.84);
  }
</style>
