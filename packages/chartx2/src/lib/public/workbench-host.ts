import type {
  PhaseOneCandlestickData,
  PhaseOneLineData,
  PhaseOneVolumeData,
} from "./market";
import type { TradeLocationIntent } from "./performance";
import type { WatchlistItemModel } from "./workbench";

export type WorkbenchSymbolOpenSource = "search" | "watchlist" | "host";

export interface WorkbenchSymbolDescriptor {
  symbol: string;
  name: string;
  exchange?: string;
  defaultTimeframe?: string;
}

export interface WorkbenchBarsPayload {
  symbol: string;
  timeframe: string;
  exchangeLabel?: string;
  bars: readonly PhaseOneCandlestickData[];
  volume: readonly PhaseOneVolumeData[];
  line: readonly PhaseOneLineData[];
}

export interface WorkbenchHostAdapter {
  listWatchlistItems(): Promise<readonly WatchlistItemModel[]>;
  resolveSymbol(symbol: string): Promise<WorkbenchSymbolDescriptor | null>;
  loadBars(symbol: string, timeframe: string): Promise<WorkbenchBarsPayload>;
}

export interface WorkbenchOpenSymbolIntent {
  symbol: string;
  timeframe?: string;
  source: WorkbenchSymbolOpenSource;
}

export interface WorkbenchTradeIntentLocator {
  locateTrade?(intent: TradeLocationIntent): boolean;
}

export type WorkbenchTradeIntentRetryScheduler = (flush: () => void) => void;

export type WorkbenchOpenSymbolResult =
  | {
      ok: true;
      source: WorkbenchSymbolOpenSource;
      symbol: WorkbenchSymbolDescriptor;
      payload: WorkbenchBarsPayload;
    }
  | {
      ok: false;
      reason: "symbol-not-found" | "empty-bars";
      symbol: string;
    };

const scheduleWorkbenchTradeIntentRetry: WorkbenchTradeIntentRetryScheduler = (flush) => {
  queueMicrotask(flush);
};

export async function openWorkbenchSymbol(
  adapter: WorkbenchHostAdapter,
  intent: WorkbenchOpenSymbolIntent,
): Promise<WorkbenchOpenSymbolResult> {
  const descriptor = await adapter.resolveSymbol(intent.symbol);
  if (descriptor === null) {
    return {
      ok: false,
      reason: "symbol-not-found",
      symbol: intent.symbol,
    };
  }

  const timeframe = intent.timeframe ?? descriptor.defaultTimeframe ?? "1D";
  const payload = await adapter.loadBars(descriptor.symbol, timeframe);
  if (payload.bars.length === 0) {
    return {
      ok: false,
      reason: "empty-bars",
      symbol: descriptor.symbol,
    };
  }

  return {
    ok: true,
    source: intent.source,
    symbol: descriptor,
    payload,
  };
}

export function createWorkbenchTradeIntentBridge(
  scheduleRetry: WorkbenchTradeIntentRetryScheduler = scheduleWorkbenchTradeIntentRetry,
) {
  let pendingIntent: TradeLocationIntent | null = null;
  let locator: WorkbenchTradeIntentLocator | null = null;
  let retryScheduled = false;
  let flushInProgress = false;
  let rerunRequested = false;

  const flush = (): boolean => {
    if (flushInProgress) {
      rerunRequested = true;
      return false;
    }

    if (pendingIntent === null || locator === null) {
      return false;
    }

    flushInProgress = true;
    try {
      const applied = locator.locateTrade?.(pendingIntent) ?? false;
      if (applied) {
        pendingIntent = null;
        retryScheduled = false;
      } else if (!retryScheduled) {
        retryScheduled = true;
        scheduleRetry(() => {
          retryScheduled = false;
          flush();
        });
      }

      return applied;
    } finally {
      flushInProgress = false;
      if (rerunRequested) {
        rerunRequested = false;
        if (pendingIntent !== null) {
          flush();
        }
      }
    }
  };

  return {
    queue(intent: TradeLocationIntent): void {
      pendingIntent = intent;
      flush();
    },
    connect(nextLocator: WorkbenchTradeIntentLocator): void {
      locator = nextLocator;
      flush();
    },
    disconnect(): void {
      locator = null;
      retryScheduled = false;
      flushInProgress = false;
      rerunRequested = false;
    },
    publishSnapshot(): void {
      flush();
    },
    pendingIntent(): TradeLocationIntent | null {
      return pendingIntent;
    },
  };
}
