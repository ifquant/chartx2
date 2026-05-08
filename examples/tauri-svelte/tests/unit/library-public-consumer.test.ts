import { describe, expect, it, vi } from "vitest";

import {
  ActivityLogPanel,
  AccountSyncStatusCard,
  ChartFrameShell,
  PhaseOneMarketChartSurface,
  ReplayPanel,
  StrategyTesterPanel,
  TimePresetsPanel,
  TradingTicketPanel,
  WorkbenchDrawingInspectorPanel,
  WorkbenchHostSurfaceDock,
  WorkbenchWorkspaceTabStrip,
  createChartxPhaseOneChart,
  getChartxFoundation,
  openWorkbenchSymbol,
  type WorkbenchHostAdapter,
} from "@chartx2/library";

describe("@chartx2/library public consumer boundary", () => {
  it("exports reusable shells and chart helpers from the package barrel", () => {
    expect(ActivityLogPanel).toBeDefined();
    expect(ChartFrameShell).toBeDefined();
    expect(PhaseOneMarketChartSurface).toBeDefined();
    expect(ReplayPanel).toBeDefined();
    expect(StrategyTesterPanel).toBeDefined();
    expect(TimePresetsPanel).toBeDefined();
    expect(TradingTicketPanel).toBeDefined();
    expect(AccountSyncStatusCard).toBeDefined();
    expect(WorkbenchDrawingInspectorPanel).toBeDefined();
    expect(WorkbenchHostSurfaceDock).toBeDefined();
    expect(WorkbenchWorkspaceTabStrip).toBeDefined();
    expect(typeof getChartxFoundation).toBe("function");
    expect(typeof createChartxPhaseOneChart).toBe("function");
  });

  it("opens a symbol through the public workbench host adapter contract", async () => {
    const adapter: WorkbenchHostAdapter = {
      listWatchlistItems: vi.fn(async () => []),
      resolveSymbol: vi.fn(async (symbol) => ({
        symbol,
        name: "螺纹钢 2605",
        exchange: "SHFE",
        defaultTimeframe: "1m",
      })),
      loadBars: vi.fn(async (symbol, timeframe) => ({
        symbol,
        timeframe,
        exchangeLabel: "SHFE",
        bars: [
          { time: 1, open: 3700, high: 3718, low: 3695, close: 3712 },
          { time: 2, open: 3712, high: 3724, low: 3708, close: 3719 },
        ],
        volume: [
          { time: 1, value: 812000, color: "#ef4444" },
          { time: 2, value: 643000, color: "#ef4444" },
        ],
        line: [
          { time: 1, value: 3712 },
          { time: 2, value: 3719 },
        ],
      })),
    };

    const result = await openWorkbenchSymbol(adapter, {
      symbol: "rb2605",
      timeframe: "1m",
      source: "host",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe("host");
      expect(result.symbol.symbol).toBe("rb2605");
      expect(result.payload.exchangeLabel).toBe("SHFE");
      expect(result.payload.bars[0]?.close).toBe(3712);
    }
    expect(adapter.resolveSymbol).toHaveBeenCalledWith("rb2605");
    expect(adapter.loadBars).toHaveBeenCalledWith("rb2605", "1m");
  });
});
