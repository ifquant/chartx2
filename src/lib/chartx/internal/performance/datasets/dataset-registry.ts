import type {
  BreakdownDataset,
  BreakdownSpec,
  ClosedTrade,
  DistributionDataset,
  DistributionSpec,
  EquitySeries,
  EquitySeriesSpec,
  ExcursionSeries,
  RangeCompareDataset,
  ScalarSeries,
  SideSlice,
  StrategyRunModel,
  TradeListRow,
} from "../model/types";

function filterTrades(trades: readonly ClosedTrade[], side: SideSlice): ClosedTrade[] {
  if (side === "all") {
    return [...trades];
  }
  return trades.filter((trade) => trade.side === side);
}

function normalizeEquity(value: number, initialCapital: number, normalization: EquitySeriesSpec["normalization"]): number {
  if (normalization === "percent") {
    return ((value - initialCapital) / initialCapital) * 100;
  }
  if (normalization === "indexed") {
    return (value / initialCapital) * 100;
  }
  if (normalization === "vami") {
    return (value / initialCapital) * 1000;
  }
  return value;
}

function distributionValue(trade: ClosedTrade, field: DistributionSpec["field"]): number {
  switch (field) {
    case "trade-gross-pnl":
      return trade.grossPnl;
    case "bars-held":
      return trade.barsHeld;
    case "mfe":
      return trade.mfe ?? 0;
    case "mae":
      return trade.mae ?? 0;
    case "runup":
      return trade.runup ?? 0;
    case "drawdown":
      return trade.drawdown ?? 0;
    case "trade-net-pnl":
    default:
      return trade.netPnl;
  }
}

export class PerformanceDatasetRegistry {
  constructor(private readonly run: StrategyRunModel) {}

  getEquitySeries(spec: EquitySeriesSpec): EquitySeries {
    const trades = filterTrades(this.run.closedTrades, spec.side);
    let equity = this.run.initialCapital;
    const points = trades.map((trade) => {
      equity += trade.netPnl;
      return {
        x:
          spec.xDomain === "time"
            ? trade.exitTime
            : spec.xDomain === "bar-index"
              ? trade.tradeIndex - 1
              : trade.tradeIndex,
        time: trade.exitTime,
        tradeIndex: trade.tradeIndex,
        tradeId: trade.id,
        equity: normalizeEquity(equity, this.run.initialCapital, spec.normalization),
        netPnl: trade.netPnl,
      };
    });

    return { spec, points };
  }

  getDistribution(spec: DistributionSpec): DistributionDataset {
    const values = filterTrades(this.run.closedTrades, spec.side).map((trade) =>
      distributionValue(trade, spec.field),
    );
    if (values.length === 0) {
      return { spec, bins: [] };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const bucketCount = Math.max(1, Math.floor(spec.bins));
    const span = max - min;
    if (span === 0) {
      return {
        spec,
        bins: [{ index: 0, from: min, to: max, count: values.length }],
      };
    }

    const width = span / bucketCount;
    const bins = Array.from({ length: bucketCount }, (_, index) => ({
      index,
      from: min + width * index,
      to: index === bucketCount - 1 ? max : min + width * (index + 1),
      count: 0,
    }));

    for (const value of values) {
      const rawIndex = Math.floor((value - min) / width);
      const index = Math.min(bucketCount - 1, Math.max(0, rawIndex));
      bins[index]!.count += 1;
    }

    return { spec, bins };
  }

  getBenchmarkSeries(label = "Buy & hold"): ScalarSeries | null {
    const benchmark = this.run.benchmarks.find((series) => series.kind === "buy-hold") ?? this.run.benchmarks[0];
    if (benchmark === undefined) {
      return null;
    }
    return {
      id: benchmark.id,
      label,
      unit: "currency",
      points: benchmark.points.map((point) => ({
        x: point.tradeIndex ?? point.time,
        time: point.time,
        tradeIndex: point.tradeIndex ?? 0,
        value: point.value,
      })),
    };
  }

  getUnderwaterSeries(side: SideSlice = "all"): ScalarSeries {
    const trades = filterTrades(this.run.closedTrades, side);
    let equity = this.run.initialCapital;
    let peak = this.run.initialCapital;
    const points = trades.map((trade) => {
      equity += trade.netPnl;
      peak = Math.max(peak, equity);
      return {
        x: trade.tradeIndex,
        time: trade.exitTime,
        tradeIndex: trade.tradeIndex,
        tradeId: trade.id,
        value: equity - peak,
      };
    });

    return {
      id: "underwater",
      label: "Underwater",
      unit: "currency",
      points,
    };
  }

  getExcursionSeries(side: SideSlice = "all"): ExcursionSeries {
    const points = filterTrades(this.run.closedTrades, side).map((trade) => ({
      tradeId: trade.id,
      tradeIndex: trade.tradeIndex,
      time: trade.exitTime,
      mfe: trade.mfe ?? 0,
      mae: trade.mae ?? 0,
      netPnl: trade.netPnl,
    }));

    return {
      id: "trade-excursions",
      label: "MFE / MAE",
      points,
    };
  }

  getBreakdown(spec: BreakdownSpec): BreakdownDataset {
    if (spec.kind === "win-loss-breakeven") {
      const win = this.run.closedTrades.filter((trade) => trade.netPnl > 0);
      const loss = this.run.closedTrades.filter((trade) => trade.netPnl < 0);
      const breakeven = this.run.closedTrades.filter((trade) => trade.netPnl === 0);
      return {
        spec,
        slices: [
          {
            key: "win",
            label: "Win",
            count: win.length,
            value: win.reduce((sum, trade) => sum + trade.netPnl, 0),
            color: "#16845f",
          },
          {
            key: "loss",
            label: "Loss",
            count: loss.length,
            value: loss.reduce((sum, trade) => sum + trade.netPnl, 0),
            color: "#c54d3f",
          },
          {
            key: "breakeven",
            label: "Break-even",
            count: breakeven.length,
            value: 0,
            color: "#a1a1aa",
          },
        ],
      };
    }

    if (spec.kind === "profit-structure") {
      const trades = this.run.closedTrades;
      const grossProfit = trades.filter((trade) => trade.grossPnl > 0).reduce((sum, trade) => sum + trade.grossPnl, 0);
      const grossLoss = trades.filter((trade) => trade.grossPnl < 0).reduce((sum, trade) => sum + Math.abs(trade.grossPnl), 0);
      const fees = trades.reduce((sum, trade) => sum + trade.commission, 0);
      return {
        spec,
        slices: [
          {
            key: "profit",
            label: "Gross profit",
            count: trades.filter((trade) => trade.grossPnl > 0).length,
            value: grossProfit,
            color: "#16845f",
          },
          {
            key: "loss-total",
            label: "Gross loss",
            count: trades.filter((trade) => trade.grossPnl < 0).length,
            value: grossLoss,
            color: "#c54d3f",
          },
          {
            key: "fees",
            label: "Fees",
            count: trades.length,
            value: fees,
            color: "#c47b23",
          },
        ],
      };
    }

    return { spec, slices: [] };
  }

  getBenchmarkingSummary(side: SideSlice = "all"): RangeCompareDataset {
    const trades = filterTrades(this.run.closedTrades, side);
    const strategy = trades.reduce((sum, trade) => sum + trade.netPnl, 0);
    const benchmarkSeries = this.getBenchmarkSeries();
    const benchmarkValue = benchmarkSeries?.points.at(-1)?.value ?? this.run.initialCapital;
    const benchmark = benchmarkValue - this.run.initialCapital;
    const outperformance = strategy - benchmark;
    const values = [strategy, benchmark, outperformance];
    return {
      id: "benchmarking-summary",
      title: "Benchmarking",
      points: [
        { key: "strategy", label: "Strategy", value: strategy, color: "#365cb7" },
        { key: "benchmark", label: "Buy & hold", value: benchmark, color: "#c47b23" },
        { key: "outperformance", label: "Alpha", value: outperformance, color: outperformance >= 0 ? "#16845f" : "#c54d3f" },
      ],
      range: {
        min: Math.min(...values, 0),
        max: Math.max(...values, 0),
      },
    };
  }

  getTradeRows(side: SideSlice = "all"): TradeListRow[] {
    return filterTrades(this.run.closedTrades, side).map((trade) => ({
      tradeId: trade.id,
      tradeIndex: trade.tradeIndex,
      symbol: trade.symbol,
      side: trade.side,
      entryTime: trade.entryTime,
      exitTime: trade.exitTime,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      qty: trade.qty,
      netPnl: trade.netPnl,
      barsHeld: trade.barsHeld,
    }));
  }
}
