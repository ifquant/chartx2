# 0171 - 记录 Performance Chart 架构边界

## 背景

主图 v1 已经收住，下一阶段要做交易绩效图表。这里最重要的设计决策是不要把策略绩效报表当成 technical chart 的 study，也不要把 equity curve 当成另一种 main-series chart type。绩效分析的真相源是 strategy run，不是 market bars。

## 改动

- 新增 `docs/performance-chart-architecture.md`。
- 明确 technical chart 和 performance chart 的领域边界。
- 记录 `StrategyRunModel`、orders / fills / closed trades / equity snapshots / benchmarks 的真相源模型。
- 记录 generic analytics axis、dataset registry、metric engine、performance chart model 和 report section model。
- 明确 `TradeLocationIntent` 是 performance chart 和 technical chart 的唯一联动桥。
- 规划 Phase 1 / Phase 2 / Phase 3 的实现顺序。

## 验证

- `pnpm check`

## 还没做

- 没有实现 performance runtime model。
- 没有实现 performance demo。
- 没有把 `TradeLocationIntent` 接入 technical chart。
