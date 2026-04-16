import type { ClosedTrade, EquitySnapshot, StrategyRunModel } from "../model/types";

const HOUR = 60 * 60 * 1000;
const BASE_TIME = Date.UTC(2026, 2, 9, 9, 30, 0);

const TRADE_PNLS = [
  420,
  -180,
  760,
  -320,
  260,
  910,
  -540,
  310,
  180,
  -220,
  680,
  -460,
  520,
  240,
  -150,
  880,
  -390,
  610,
] as const;

function createClosedTrades(): ClosedTrade[] {
  return TRADE_PNLS.map((netPnl, index) => {
    const tradeIndex = index + 1;
    const side = index % 4 === 1 ? "short" : "long";
    const entryTime = BASE_TIME + index * HOUR * 5;
    const barsHeld = 4 + (index % 7);
    const exitTime = entryTime + barsHeld * HOUR;
    const qty = side === "long" ? 2 + (index % 3) : 1 + (index % 2);
    const entryPrice = 18_000 + Math.round(Math.sin(index * 0.9) * 220 + index * 18);
    const priceMove = netPnl / Math.max(qty * 10, 1);
    const exitPrice = Number((side === "long" ? entryPrice + priceMove : entryPrice - priceMove).toFixed(2));
    const commission = 18 + (index % 3) * 4;
    const grossPnl = netPnl + commission;
    return {
      id: `T-${String(tradeIndex).padStart(3, "0")}`,
      tradeIndex,
      symbol: "NDX",
      side,
      entryTime,
      exitTime,
      entryPrice,
      exitPrice,
      qty,
      grossPnl,
      netPnl,
      commission,
      barsHeld,
      mfe: Math.round(Math.max(netPnl, 0) * 1.28 + 120 + index * 8),
      mae: -Math.round(Math.max(-netPnl, 0) * 1.18 + 80 + index * 5),
      runup: Math.round(Math.max(netPnl, 0) * 1.1),
      drawdown: -Math.round(Math.max(-netPnl, 0) * 1.05),
    };
  });
}

function createEquitySnapshots(initialCapital: number, trades: readonly ClosedTrade[]): EquitySnapshot[] {
  let equity = initialCapital;
  let peak = initialCapital;
  return trades.map((trade) => {
    equity += trade.netPnl;
    peak = Math.max(peak, equity);
    return {
      time: trade.exitTime,
      tradeIndex: trade.tradeIndex,
      basis: "closed-trade",
      equity,
      realizedPnl: equity - initialCapital,
      drawdown: equity - peak,
      runup: Math.max(0, equity - initialCapital),
    };
  });
}

export function createSampleStrategyRun(): StrategyRunModel {
  const initialCapital = 100_000;
  const closedTrades = createClosedTrades();
  return {
    id: "sample-ndx-run",
    scope: "strategy",
    strategyId: "mean-reversion-breakout",
    name: "NDX Strategy Run",
    initialCapital,
    accountCurrency: "USD",
    assumptions: {
      commissionModelId: "fixed-contract-demo",
      slippageModelId: "one-tick-demo",
      marginModelId: "demo-index-margin",
      positionSizingModelId: "fixed-risk-demo",
    },
    period: {
      from: closedTrades[0]?.entryTime ?? BASE_TIME,
      to: closedTrades.at(-1)?.exitTime ?? BASE_TIME,
    },
    orders: [],
    fills: [],
    closedTrades,
    equitySnapshots: createEquitySnapshots(initialCapital, closedTrades),
    benchmarks: [
      {
        id: "buy-hold",
        kind: "buy-hold",
        points: closedTrades.map((trade, index) => ({
          time: trade.exitTime,
          tradeIndex: trade.tradeIndex,
          value: initialCapital + index * 125 + Math.sin(index * 0.7) * 420,
        })),
      },
    ],
  };
}
