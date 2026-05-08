import { describe, expect, it } from "vitest";
import * as chartxPublic from "../../src/lib/public";
import * as workbenchBottomPanels from "../../src/lib/public/workbench-bottom-panels";
import * as workbenchDrawingInspector from "../../src/lib/public/workbench-drawing-inspector";
import * as workbenchWorkspaceTabs from "../../src/lib/public/workbench-workspace-tabs";

import type {
  AccountSyncSurfaceModel,
  ShareDialogModel,
  StrategyTesterPanelModel,
  TradingTicketModel,
} from "../../src/lib/public";
import type { WorkbenchReplayPanelModel } from "../../src/lib/public/workbench-bottom-panels";

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

  it("re-exports script authoring controls through the public index", () => {
    expect(chartxPublic).toHaveProperty("ScriptExpressionBuilder");
    expect(chartxPublic).not.toHaveProperty("ScriptLengthInput");
  });

  it("re-exports workbench bottom-panel primitives through the public index", () => {
    const replay: WorkbenchReplayPanelModel = {
      available: true,
      active: true,
      playing: false,
      currentStep: 12,
      totalSteps: 64,
      currentTimeLabel: "2026-05-08 10:30",
      startTimeLabel: "2026-05-08 09:00",
      endTimeLabel: "2026-05-08 15:00",
    };

    expect(replay.totalSteps).toBe(64);
    expect(chartxPublic).toHaveProperty("ActivityLogPanel");
    expect(chartxPublic).toHaveProperty("ReplayPanel");
    expect(chartxPublic).toHaveProperty("TimePresetsPanel");
    expect(workbenchBottomPanels).toHaveProperty("ActivityLogPanel");
    expect(workbenchBottomPanels).toHaveProperty("ReplayPanel");
    expect(workbenchBottomPanels).toHaveProperty("TimePresetsPanel");
    expect(workbenchBottomPanels).not.toHaveProperty("ScriptExpressionBuilder");
  });

  it("re-exports the workbench workspace tab strip through a focused public barrel", () => {
    expect(chartxPublic).toHaveProperty("WorkbenchWorkspaceTabStrip");
    expect(workbenchWorkspaceTabs).toHaveProperty("WorkbenchWorkspaceTabStrip");
    expect(workbenchWorkspaceTabs).not.toHaveProperty("ReplayPanel");
  });

  it("re-exports the workbench drawing inspector through a focused public barrel", () => {
    expect(chartxPublic).toHaveProperty("WorkbenchDrawingInspectorPanel");
    expect(workbenchDrawingInspector).toHaveProperty("WorkbenchDrawingInspectorPanel");
    expect(workbenchDrawingInspector).not.toHaveProperty("ReplayPanel");
  });
});
