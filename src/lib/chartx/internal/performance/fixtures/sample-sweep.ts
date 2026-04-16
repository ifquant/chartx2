import type { ClosedTrade, EquitySnapshot, ParameterSweepModel, StrategyRunModel, StrategyRunSummary } from "../model/types";

const FAST_LENGTHS = [5, 9, 13, 21] as const;
const SLOW_LENGTHS = [21, 34, 55] as const;
const THRESHOLDS = [0.25, 0.5, 0.75] as const;

const BASE_TIME = Date.UTC(2026, 2, 1, 0, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

function createRunSummary(
  fastLength: number,
  slowLength: number,
  threshold: number,
  index: number,
): StrategyRunSummary {
  const runId = `sweep-run-${String(index + 1).padStart(3, "0")}`;
  const crossoverSpread = slowLength - fastLength;
  const efficiency = 1600 - Math.abs(crossoverSpread - 22) * 48;
  const thresholdPenalty = Math.abs(threshold - 0.5) * 920;
  const shapeNoise = Math.sin(fastLength * 0.8 + slowLength * 0.25 + threshold * 7) * 180;
  const netProfit = Math.round(efficiency - thresholdPenalty + shapeNoise);
  const winRate = Number((48 + crossoverSpread * 0.42 - Math.abs(threshold - 0.45) * 18).toFixed(2));
  const tradeCount = Math.max(18, Math.round(74 - fastLength * 1.1 - threshold * 20 + (slowLength - 20) * 0.2));
  const avgTrade = Number((netProfit / tradeCount).toFixed(2));
  const maxDrawdown = -Math.round(260 + Math.abs(crossoverSpread - 18) * 16 + threshold * 340);
  const grossProfit = Math.round(Math.max(netProfit * 1.55, 280));
  const grossLoss = -Math.round(Math.max(grossProfit - netProfit, 120));
  const profitFactor = Number((grossProfit / Math.max(Math.abs(grossLoss), 1)).toFixed(3));
  const sharpe = Number((0.6 + netProfit / 2200 - Math.abs(threshold - 0.5) * 0.65).toFixed(3));
  const sortino = Number((sharpe + 0.22).toFixed(3));
  const stabilityScore = Number(
    (
      55 +
      Math.max(0, 18 - Math.abs(crossoverSpread - 20)) * 1.2 -
      Math.abs(threshold - 0.5) * 28
    ).toFixed(2),
  );

  return {
    runId,
    strategyId: "mean-reversion-breakout",
    scope: "strategy",
    params: {
      fastLength,
      slowLength,
      threshold,
    },
    metrics: {
      netProfit,
      grossProfit,
      grossLoss,
      winRate,
      avgTrade,
      maxDrawdown,
      profitFactor,
      sharpe,
      sortino,
      tradeCount,
      stabilityScore,
    },
    period: {
      from: BASE_TIME,
      to: BASE_TIME + DAY * (20 + index),
    },
  };
}

export function createSampleParameterSweep(): ParameterSweepModel {
  const runs: StrategyRunSummary[] = [];
  let index = 0;

  for (const fastLength of FAST_LENGTHS) {
    for (const slowLength of SLOW_LENGTHS) {
      if (slowLength <= fastLength) {
        continue;
      }
      for (const threshold of THRESHOLDS) {
        runs.push(createRunSummary(fastLength, slowLength, threshold, index));
        index += 1;
      }
    }
  }

  return {
    id: "sample-ndx-parameter-sweep",
    strategyId: "mean-reversion-breakout",
    name: "NDX Parameter Sweep",
    parameterKeys: ["fastLength", "slowLength", "threshold"],
    runs,
  };
}

function splitAmount(total: number, count: number, phase: number): number[] {
  if (count <= 0) {
    return [];
  }
  const weights = Array.from({ length: count }, (_, index) => 1 + Math.abs(Math.sin(phase + index * 0.73)));
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const magnitudes = weights.map((weight) => Math.round((total * weight) / weightSum));
  let diff = total - magnitudes.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  while (diff !== 0 && magnitudes.length > 0) {
    const delta = diff > 0 ? 1 : -1;
    magnitudes[cursor % magnitudes.length] = Math.max(1, magnitudes[cursor % magnitudes.length]! + delta);
    diff -= delta;
    cursor += 1;
  }
  return magnitudes;
}

function createClosedTradesFromSummary(run: StrategyRunSummary): ClosedTrade[] {
  const tradeCount = Math.max(6, Math.round(run.metrics.tradeCount ?? 18));
  const winRate = Math.max(0, Math.min(100, run.metrics.winRate ?? 55));
  const winCount = Math.max(1, Math.min(tradeCount - 1, Math.round((winRate / 100) * tradeCount)));
  const lossCount = Math.max(1, tradeCount - winCount);
  const grossProfit = Math.max(Math.round(run.metrics.grossProfit ?? Math.abs(run.metrics.netProfit ?? 800)), 100);
  const grossLossAbs = Math.max(Math.abs(Math.round(run.metrics.grossLoss ?? -Math.max(grossProfit / 2, 80))), 50);
  const positivePnls = splitAmount(grossProfit, winCount, Number(run.params.fastLength ?? 7));
  const negativePnls = splitAmount(grossLossAbs, lossCount, Number(run.params.slowLength ?? 21)).map((value) => -value);
  const tradePnls: number[] = [];
  let winCursor = 0;
  let lossCursor = 0;

  for (let index = 0; index < tradeCount; index += 1) {
    const useWin = ((index + Math.round(Number(run.params.threshold ?? 0.5) * 10)) % 3 !== 1 && winCursor < positivePnls.length)
      || lossCursor >= negativePnls.length;
    if (useWin && winCursor < positivePnls.length) {
      tradePnls.push(positivePnls[winCursor]!);
      winCursor += 1;
    } else {
      tradePnls.push(negativePnls[lossCursor]!);
      lossCursor += 1;
    }
  }

  const expectedNet = Math.round(run.metrics.netProfit ?? 0);
  const currentNet = tradePnls.reduce((sum, value) => sum + value, 0);
  if (tradePnls.length > 0) {
    tradePnls[tradePnls.length - 1] = tradePnls[tradePnls.length - 1]! + (expectedNet - currentNet);
  }

  const baseTime = run.period?.from ?? BASE_TIME;
  const spacingHours = 3 + (Math.round(Number(run.params.threshold ?? 0.5) * 10) % 4);

  return tradePnls.map((netPnl, index) => {
    const tradeIndex = index + 1;
    const side = index % 4 === 1 ? "short" : "long";
    const entryTime = baseTime + index * spacingHours * 60 * 60 * 1000;
    const barsHeld = 3 + ((index + Math.round(Number(run.params.fastLength ?? 5))) % 7);
    const exitTime = entryTime + barsHeld * 60 * 60 * 1000;
    const qty = side === "long" ? 1 + (index % 3) : 1 + ((index + 1) % 2);
    const anchor = 17_600 + Math.round(Math.sin(index * 0.57 + Number(run.params.slowLength ?? 21) * 0.08) * 160);
    const entryPrice = anchor + Math.round(index * (Number(run.params.fastLength ?? 5) * 0.9));
    const priceMove = netPnl / Math.max(qty * 8, 1);
    const exitPrice = Number((side === "long" ? entryPrice + priceMove : entryPrice - priceMove).toFixed(2));
    const commission = 10 + (index % 3) * 3;
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
      mfe: Math.round(Math.max(netPnl, 0) * 1.22 + 60 + index * 4),
      mae: -Math.round(Math.max(-netPnl, 0) * 1.15 + 45 + index * 3),
      runup: Math.round(Math.max(netPnl, 0) * 1.08),
      drawdown: -Math.round(Math.max(-netPnl, 0) * 1.04),
    };
  });
}

function createEquitySnapshotsFromSummary(
  initialCapital: number,
  trades: readonly ClosedTrade[],
  run: StrategyRunSummary,
): EquitySnapshot[] {
  const targetMaxDrawdown = Math.round(run.metrics.maxDrawdown ?? 0);
  let equity = initialCapital;
  let peak = initialCapital;
  let worstDrawdown = 0;

  const snapshots = trades.map((trade) => {
    equity += trade.netPnl;
    peak = Math.max(peak, equity);
    const drawdown = equity - peak;
    worstDrawdown = Math.min(worstDrawdown, drawdown);
    return {
      time: trade.exitTime,
      tradeIndex: trade.tradeIndex,
      basis: "closed-trade" as const,
      equity,
      realizedPnl: equity - initialCapital,
      drawdown,
      runup: Math.max(0, equity - initialCapital),
    };
  });

  if (snapshots.length > 0 && targetMaxDrawdown < worstDrawdown) {
    const worstIndex = snapshots.reduce(
      (best, snapshot, index) => ((snapshot.drawdown ?? 0) < (snapshots[best]?.drawdown ?? 0) ? index : best),
      0,
    );
    snapshots[worstIndex] = {
      ...snapshots[worstIndex]!,
      drawdown: targetMaxDrawdown,
    };
  }

  return snapshots;
}

export function createSampleStrategyRunFromSummary(run: StrategyRunSummary): StrategyRunModel {
  const initialCapital = 100_000;
  const closedTrades = createClosedTradesFromSummary(run);
  return {
    id: run.runId,
    scope: run.scope,
    strategyId: run.strategyId,
    name: `NDX Strategy Run ${Object.entries(run.params)
      .map(([key, value]) => `${key}=${value}`)
      .join(" / ")}`,
    initialCapital,
    accountCurrency: "USD",
    assumptions: {
      commissionModelId: "fixed-contract-demo",
      slippageModelId: "one-tick-demo",
      marginModelId: "demo-index-margin",
      positionSizingModelId: "sweep-derived-demo",
    },
    period: {
      from: closedTrades[0]?.entryTime ?? BASE_TIME,
      to: closedTrades.at(-1)?.exitTime ?? BASE_TIME,
    },
    orders: [],
    fills: [],
    closedTrades,
    equitySnapshots: createEquitySnapshotsFromSummary(initialCapital, closedTrades, run),
    benchmarks: [
      {
        id: "buy-hold",
        kind: "buy-hold",
        points: closedTrades.map((trade, index) => ({
          time: trade.exitTime,
          tradeIndex: trade.tradeIndex,
          value: initialCapital + index * 95 + Math.sin(index * 0.6) * 360,
        })),
      },
    ],
  };
}
