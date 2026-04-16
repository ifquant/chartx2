import type { ClosedTrade, TradeLocationIntent } from "./types";

export function createTradeLocationIntent(
  trade: ClosedTrade,
  sourceChartId: string,
): TradeLocationIntent {
  return {
    kind: "locate-trade",
    tradeId: trade.id,
    symbol: trade.symbol,
    entryTime: trade.entryTime,
    exitTime: trade.exitTime,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    side: trade.side,
    quantity: trade.qty,
    realizedPnl: trade.netPnl,
    sourceChartId,
  };
}
