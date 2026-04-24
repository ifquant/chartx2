import type {
  PhaseOneCandlestickData,
  PhaseOneLineData,
  PhaseOneVolumeData,
} from "$lib/chartx/public/market";
import type { WatchlistItemModel } from "$lib/chartx/public/workbench";
import {
  openWorkbenchSymbol,
  type WorkbenchBarsPayload,
  type WorkbenchHostAdapter,
  type WorkbenchSymbolDescriptor,
} from "../chartx/public/workbench-host";

const BASE_TIME = Date.UTC(2026, 2, 2, 1, 30, 0);
const BAR_INTERVAL_MS = 60_000;
const DEFAULT_BAR_COUNT = 10_000;
const GENERIC_BASE_CLOSE = 23_000;

type FixtureSymbol = {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  defaultTimeframe: string;
  lastLabel: string;
  changeLabel: string;
  changeTone: "negative";
  lastValue: number;
  changePercent: number;
  offset: number;
};

export type WorkbenchInitialSymbolLoadResult =
  | {
      ok: true;
      payload: WorkbenchBarsPayload;
      exchangeLabel: string;
    }
  | {
      ok: false;
      message: string;
    };

const FIXTURE_SYMBOLS: readonly FixtureSymbol[] = [
  {
    id: "ndx",
    symbol: "NDX",
    name: "Nasdaq 100",
    exchange: "NASDAQ",
    defaultTimeframe: "1D",
    lastLabel: "23,132.77",
    changeLabel: "-1.93%",
    changeTone: "negative",
    lastValue: 23_132.77,
    changePercent: -1.93,
    offset: 0,
  },
  {
    id: "spx",
    symbol: "SPX",
    name: "S&P 500",
    exchange: "NYSE",
    defaultTimeframe: "1D",
    lastLabel: "6,368.86",
    changeLabel: "-1.67%",
    changeTone: "negative",
    lastValue: 6_368.86,
    changePercent: -1.67,
    offset: 420,
  },
  {
    id: "dji",
    symbol: "DJI",
    name: "Dow Jones Industrial Average",
    exchange: "DJI",
    defaultTimeframe: "1D",
    lastLabel: "45,166.64",
    changeLabel: "-1.73%",
    changeTone: "negative",
    lastValue: 45_166.64,
    changePercent: -1.73,
    offset: 860,
  },
  {
    id: "vix",
    symbol: "VIX",
    name: "Volatility Index",
    exchange: "CBOE",
    defaultTimeframe: "1D",
    lastLabel: "$30,73 local",
    changeLabel: "−1,03 percent",
    changeTone: "negative",
    lastValue: 30.73,
    changePercent: -1.03,
    offset: -320,
  },
];

const FIXTURE_BY_SYMBOL = new Map(
  FIXTURE_SYMBOLS.map((fixture) => [fixture.symbol, fixture]),
);

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function fixtureSymbolOrDefault(symbol: string): FixtureSymbol {
  return FIXTURE_BY_SYMBOL.get(normalizeSymbol(symbol)) ?? FIXTURE_BY_SYMBOL.get("NDX")!;
}

function shiftBars(
  bars: readonly PhaseOneCandlestickData[],
  delta: number,
): PhaseOneCandlestickData[] {
  return bars.map((bar) => ({
    time: bar.time,
    open: round(bar.open + delta),
    high: round(bar.high + delta),
    low: round(bar.low + delta),
    close: round(bar.close + delta),
    volume: bar.volume,
  }));
}

export function createWorkbenchFixtureWatchlist(): WatchlistItemModel[] {
  return FIXTURE_SYMBOLS.map((fixture) => ({
    id: fixture.id,
    symbol: fixture.symbol,
    name: fixture.name,
    lastLabel: fixture.lastLabel,
    lastValue: fixture.lastValue,
    changeLabel: fixture.changeLabel,
    changePercent: fixture.changePercent,
    changeTone: fixture.changeTone,
  }));
}

export function createWorkbenchBars(
  count: number,
  offset = 0,
): PhaseOneCandlestickData[] {
  const bars: PhaseOneCandlestickData[] = [];
  let close = round(GENERIC_BASE_CLOSE + offset * 0.04);

  for (let index = 0; index < count; index += 1) {
    const phase = index + offset / 40;
    const open = round(close + Math.sin(phase / 4.3) * 6.5 + Math.cos(phase / 6.8) * 4.2);
    const drift =
      Math.sin(phase / 3.2) * 14.4 +
      Math.cos(phase / 8.1) * 7.2 +
      Math.sin(phase / 19.5) * 5.4;
    const nextClose = round(open + drift);
    const high = round(
      Math.max(open, nextClose) + 6 + (index % 4) * 1.5 + Math.abs(Math.sin(phase / 5.9)) * 3,
    );
    const low = round(
      Math.min(open, nextClose) - 5 - (index % 3) * 1.25 - Math.abs(Math.cos(phase / 5.5)) * 2.5,
    );

    bars.push({
      time: BASE_TIME + index * BAR_INTERVAL_MS,
      open,
      high,
      low,
      close: nextClose,
      volume: 780_000 + index * 19_000 + Math.round(Math.abs(nextClose - open) * 8_000),
    });

    close = nextClose;
  }

  return bars;
}

export function createVolumeData(
  bars: readonly PhaseOneCandlestickData[],
): PhaseOneVolumeData[] {
  return bars.map((bar, index) => {
    const up = bar.close >= bar.open;

    return {
      time: bar.time,
      value:
        bar.volume ?? 780_000 + index * 19_000 + Math.round(Math.abs(bar.close - bar.open) * 8_000),
      color: up ? "#16a34a" : "#dc2626",
      up,
    };
  });
}

export function createLineData(
  bars: readonly PhaseOneCandlestickData[],
  smoothing = 6,
): PhaseOneLineData[] {
  const windowSize = Math.max(1, Math.trunc(smoothing));

  return bars.map((bar, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const windowBars = bars.slice(start, index + 1);
    const averageClose =
      windowBars.reduce((sum, item) => sum + item.close, 0) / windowBars.length;

    return {
      time: bar.time,
      value: round(averageClose),
    };
  });
}

export function createWorkbenchFixtureBarsPayload(
  symbol: string,
  timeframe = "1D",
): WorkbenchBarsPayload {
  const fixture = fixtureSymbolOrDefault(symbol);
  const bars = createWorkbenchBars(DEFAULT_BAR_COUNT, fixture.offset);
  const shift = fixture.lastValue - bars[bars.length - 1]!.close;
  const adjustedBars = shiftBars(bars, shift);

  return {
    symbol: fixture.symbol,
    timeframe,
    exchangeLabel: fixture.exchange,
    bars: adjustedBars,
    volume: createVolumeData(adjustedBars),
    line: createLineData(adjustedBars),
  };
}

export async function loadWorkbenchInitialSymbolPayload(
  hostAdapter: WorkbenchHostAdapter,
  symbol: string,
  timeframe: string,
): Promise<WorkbenchInitialSymbolLoadResult> {
  try {
    const result = await openWorkbenchSymbol(hostAdapter, {
      symbol,
      timeframe,
      source: "host",
    });

    if (!result.ok) {
      return {
        ok: false,
        message: `failed to open initial symbol ${symbol}: ${result.reason}`,
      };
    }

    return {
      ok: true,
      payload: result.payload,
      exchangeLabel: result.payload.exchangeLabel ?? result.symbol.exchange ?? "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      message: `failed to open initial symbol ${symbol}: ${message}`,
    };
  }
}

export function createWorkbenchFixtureHostAdapter(): WorkbenchHostAdapter {
  return {
    async listWatchlistItems() {
      return createWorkbenchFixtureWatchlist();
    },
    async resolveSymbol(symbol: string): Promise<WorkbenchSymbolDescriptor | null> {
      const fixture = FIXTURE_BY_SYMBOL.get(normalizeSymbol(symbol));

      if (fixture === undefined) {
        return null;
      }

      return {
        symbol: fixture.symbol,
        name: fixture.name,
        exchange: fixture.exchange,
        defaultTimeframe: fixture.defaultTimeframe,
      };
    },
    async loadBars(symbol: string, timeframe: string) {
      return createWorkbenchFixtureBarsPayload(symbol, timeframe);
    },
  };
}
