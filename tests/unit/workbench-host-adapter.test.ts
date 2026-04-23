import { describe, expect, it, vi } from "vitest";

import {
  openWorkbenchSymbol,
  type WorkbenchHostAdapter,
} from "../../src/lib/chartx/public/workbench-host";

const NDX_BARS = [
  { time: 1, open: 10, high: 12, low: 9, close: 11 },
  { time: 2, open: 11, high: 13, low: 10, close: 12 },
] as const;

describe("workbench host adapter", () => {
  it("resolves a symbol and loads bars through one open-symbol helper", async () => {
    const adapter: WorkbenchHostAdapter = {
      listWatchlistItems: vi.fn(async () => []),
      resolveSymbol: vi.fn(async (symbol) => ({
        symbol,
        name: "Nasdaq 100",
        exchange: "NASDAQ",
        defaultTimeframe: "1D",
      })),
      loadBars: vi.fn(async (symbol, timeframe) => ({
        symbol,
        timeframe,
        exchangeLabel: "NASDAQ",
        bars: NDX_BARS,
        volume: [
          { time: 1, value: 1000, color: "#10b981" },
          { time: 2, value: 1200, color: "#10b981" },
        ],
        line: [
          { time: 1, value: 11 },
          { time: 2, value: 12 },
        ],
      })),
    };

    const result = await openWorkbenchSymbol(adapter, {
      symbol: "NDX",
      timeframe: "1D",
      source: "watchlist",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.symbol.symbol).toBe("NDX");
      expect(result.payload.bars).toHaveLength(2);
      expect(result.payload.timeframe).toBe("1D");
    }
    expect(adapter.resolveSymbol).toHaveBeenCalledWith("NDX");
    expect(adapter.loadBars).toHaveBeenCalledWith("NDX", "1D");
  });

  it("reports an unresolved symbol without loading bars", async () => {
    const adapter: WorkbenchHostAdapter = {
      listWatchlistItems: vi.fn(async () => []),
      resolveSymbol: vi.fn(async () => null),
      loadBars: vi.fn(async () => {
        throw new Error("loadBars should not run for unresolved symbols");
      }),
    };

    const result = await openWorkbenchSymbol(adapter, {
      symbol: "MISSING",
      timeframe: "1D",
      source: "watchlist",
    });

    expect(result).toEqual({
      ok: false,
      reason: "symbol-not-found",
      symbol: "MISSING",
    });
    expect(adapter.loadBars).not.toHaveBeenCalled();
  });

  it("reports empty data when the adapter resolves a symbol but returns no bars", async () => {
    const adapter: WorkbenchHostAdapter = {
      listWatchlistItems: vi.fn(async () => []),
      resolveSymbol: vi.fn(async (symbol) => ({
        symbol,
        name: "Empty Instrument",
        exchange: "TEST",
      })),
      loadBars: vi.fn(async (symbol, timeframe) => ({
        symbol,
        timeframe,
        exchangeLabel: "TEST",
        bars: [],
        volume: [],
        line: [],
      })),
    };

    const result = await openWorkbenchSymbol(adapter, {
      symbol: "EMPTY",
      timeframe: "1D",
      source: "watchlist",
    });

    expect(result).toEqual({
      ok: false,
      reason: "empty-bars",
      symbol: "EMPTY",
    });
  });
});
