import { describe, expect, it } from "vitest";

import type {
  AccountSyncSurfaceModel,
  ShareDialogModel,
  StrategyTesterPanelModel,
  TradingTicketModel,
} from "../../src/lib/public";

describe("public chartx barrel", () => {
  it("re-exports host integration shell contracts through the public index", () => {
    const shareDialog: ShareDialogModel = {
      artifactType: "layout",
      title: "My shared layout",
      visibility: "private",
      publishLabel: "Publish",
      state: {
        status: "ready",
        publishEnabled: true,
      },
    };
    const strategyTester: StrategyTesterPanelModel = {
      title: "Strategy Tester",
      summaryMetrics: [],
      tabs: [],
      trades: [],
      equityCurve: [],
      state: {
        status: "ready",
        activeTabId: "overview",
      },
    };
    const tradingTicket: TradingTicketModel = {
      title: "Trading Ticket",
      symbol: "NQ",
      side: "buy",
      orderType: "limit",
      quantity: {
        label: "Quantity",
      },
      submitLabel: "Review order",
      state: {
        status: "ready",
        submitEnabled: true,
      },
    };
    const accountSync: AccountSyncSurfaceModel = {
      providerLabel: "Workspace Sync",
      state: {
        status: "ready",
        statusLabel: "Connected",
      },
      targets: [],
    };

    expect(shareDialog.publishLabel).toBe("Publish");
    expect(strategyTester.state.activeTabId).toBe("overview");
    expect(tradingTicket.symbol).toBe("NQ");
    expect(accountSync.providerLabel).toBe("Workspace Sync");
  });
});
