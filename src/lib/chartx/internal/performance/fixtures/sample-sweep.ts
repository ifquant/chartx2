import type { ParameterSweepModel, StrategyRunSummary } from "../model/types";

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
