import { describe, expect, it, vi } from "vitest";

import {
  openWorkbenchSymbol,
  type WorkbenchHostAdapter,
} from "@chartx2/library";
import {
  createWorkbenchFixtureBarsPayload,
  createWorkbenchFixtureHostAdapter,
  createWorkbenchFixtureWatchlist,
  loadWorkbenchInitialSymbolPayload,
} from "../../src/lib/demo/workbench-fixtures";

describe("workbench host adapter", () => {
  it("exposes deterministic fixture watchlist items and bar payloads", async () => {
    const adapter = createWorkbenchFixtureHostAdapter();

    await expect(adapter.listWatchlistItems()).resolves.toEqual([
      expect.objectContaining({ symbol: "NDX" }),
      expect.objectContaining({ symbol: "SPX" }),
      expect.objectContaining({ symbol: "DJI" }),
      expect.objectContaining({ symbol: "VIX" }),
    ]);

    const watchlistItems = await adapter.listWatchlistItems();
    expect(watchlistItems.map((item) => item.symbol)).toEqual(["NDX", "SPX", "DJI", "VIX"]);

    await expect(adapter.resolveSymbol("NDX")).resolves.toEqual({
      symbol: "NDX",
      name: "Nasdaq 100",
      exchange: "NASDAQ",
      defaultTimeframe: "1D",
    });

    const spxPayload = await adapter.loadBars("SPX", "1D");
    const ndxPayload = await adapter.loadBars("NDX", "1D");

    expect(spxPayload.bars).toHaveLength(10_000);
    expect(ndxPayload.bars).toHaveLength(10_000);
    expect(spxPayload.bars[0]?.close).not.toBe(ndxPayload.bars[0]?.close);
  });

  it("falls back to the NDX fixture payload for unknown symbols", () => {
    const payload = createWorkbenchFixtureBarsPayload("UNKNOWN", "1D");
    const ndxPayload = createWorkbenchFixtureBarsPayload("NDX", "1D");

    expect(payload.symbol).toBe("NDX");
    expect(payload.timeframe).toBe("1D");
    expect(payload.exchangeLabel).toBe("NASDAQ");
    expect(payload.bars[0]).toEqual(ndxPayload.bars[0]);
    expect(payload.volume[0]).toEqual(ndxPayload.volume[0]);
    expect(payload.line[0]).toEqual(ndxPayload.line[0]);
  });

  it("creates aligned fixture payload data from the first watchlist symbol", () => {
    const rows = createWorkbenchFixtureWatchlist();
    const payload = createWorkbenchFixtureBarsPayload(rows[0]!.symbol, "1D");
    const lastBar = payload.bars.at(-1);

    expect(payload.symbol).toBe("NDX");
    expect(payload.exchangeLabel).toBe("NASDAQ");
    expect(lastBar?.close).toBe(23_132.77);
    expect(payload.volume.length).toBe(payload.bars.length);
    expect(payload.line.length).toBe(payload.bars.length);
    expect(payload.volume[0]?.time).toBe(payload.bars[0]?.time);
    expect(payload.line[0]?.time).toBe(payload.bars[0]?.time);
    expect(payload.volume.at(-1)?.time).toBe(payload.bars.at(-1)?.time);
    expect(payload.line.at(-1)?.time).toBe(payload.bars.at(-1)?.time);
  });

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
        bars: [
          { time: 1, open: 10, high: 12, low: 9, close: 11 },
          { time: 2, open: 11, high: 13, low: 10, close: 12 },
        ],
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

  it("loads the initial workbench symbol through the injected host adapter", async () => {
    const adapter: WorkbenchHostAdapter = {
      listWatchlistItems: vi.fn(async () => []),
      resolveSymbol: vi.fn(async (symbol) => ({
        symbol,
        name: "E-mini S&P 500",
        exchange: "CME",
        defaultTimeframe: "5m",
      })),
      loadBars: vi.fn(async (symbol, timeframe) => ({
        symbol,
        timeframe,
        exchangeLabel: "CME",
        bars: [
          { time: 1, open: 5200, high: 5210, low: 5195, close: 5208 },
        ],
        volume: [
          { time: 1, value: 3200, color: "#10b981" },
        ],
        line: [
          { time: 1, value: 5208 },
        ],
      })),
    };

    const result = await loadWorkbenchInitialSymbolPayload(adapter, "ES", "5m");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.symbol).toBe("ES");
      expect(result.payload.timeframe).toBe("5m");
      expect(result.payload.bars[0]?.close).toBe(5208);
      expect(result.exchangeLabel).toBe("CME");
    }
    expect(adapter.resolveSymbol).toHaveBeenCalledWith("ES");
    expect(adapter.loadBars).toHaveBeenCalledWith("ES", "5m");
  });

  it("reports initial injected host adapter failures without throwing", async () => {
    const adapter: WorkbenchHostAdapter = {
      listWatchlistItems: vi.fn(async () => []),
      resolveSymbol: vi.fn(async () => null),
      loadBars: vi.fn(async () => {
        throw new Error("loadBars should not run for unresolved symbols");
      }),
    };

    await expect(loadWorkbenchInitialSymbolPayload(adapter, "ES", "1D")).resolves.toEqual({
      ok: false,
      message: "failed to open initial symbol ES: symbol-not-found",
    });
    expect(adapter.loadBars).not.toHaveBeenCalled();
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
