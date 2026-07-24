import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import * as chartxPackage from "../../src/lib";
import * as chartxPublic from "../../src/lib/public";
import * as packageDrawingInspector from "../../src/lib/workbench-drawing-inspector";
import * as workbenchBottomPanels from "../../src/lib/public/workbench-bottom-panels";
import * as workbenchDrawingInspector from "../../src/lib/public/workbench-drawing-inspector";
import * as workbenchWorkspaceTabs from "../../src/lib/public/workbench-workspace-tabs";

import type {
  AccountSyncSurfaceModel,
  ShareDialogModel,
  StrategyTesterPanelModel,
  TradingTicketModel,
  PhaseOneTimeFocusRequest,
  PhaseOneTimeFocusResult,
} from "../../src/lib/public";
import type { WorkbenchReplayPanelModel } from "../../src/lib/public/workbench-bottom-panels";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

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

  it("exposes only the public row-time focus types through the root barrel", () => {
    const request: PhaseOneTimeFocusRequest = { time: 1, maxDistance: 0 };
    const result: PhaseOneTimeFocusResult = { kind: "noData", requestedTime: 1 };
    expect(request.maxDistance).toBe(0);
    expect(result.kind).toBe("noData");
    expect(chartxPublic).not.toHaveProperty("resolveTimeFocus");
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

describe("package-facing source entries", () => {
  it("keeps package root shims separate from the public implementation folder", () => {
    const rootEntry = path.join(packageRoot, "src/lib/index.ts");
    const drawingInspectorEntry = path.join(
      packageRoot,
      "src/lib/workbench-drawing-inspector.ts",
    );

    expect(existsSync(rootEntry)).toBe(true);
    expect(existsSync(drawingInspectorEntry)).toBe(true);
    expect(readFileSync(rootEntry, "utf8")).toContain("./public/index");
    expect(readFileSync(drawingInspectorEntry, "utf8")).toContain(
      "./public/workbench-drawing-inspector",
    );
  });

  it("re-exports representative symbols through the package-facing module boundary", () => {
    expect(chartxPackage).toHaveProperty("ScriptExpressionBuilder");
    expect(chartxPackage).toHaveProperty("WorkbenchWorkspaceTabStrip");
    expect(chartxPackage).toHaveProperty("WorkbenchDrawingInspectorPanel");
    expect(packageDrawingInspector).toHaveProperty(
      "WorkbenchDrawingInspectorPanel",
    );
    expect(packageDrawingInspector).not.toHaveProperty("ReplayPanel");
  });
});
