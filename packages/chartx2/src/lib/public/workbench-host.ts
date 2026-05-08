import type {
  PhaseOneCandlestickData,
  PhaseOneLineData,
  PhaseOneVolumeData,
} from "./market";
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
