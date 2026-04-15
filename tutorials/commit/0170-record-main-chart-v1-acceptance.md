# 0170 - 记录 Main Chart V1 Acceptance

## 背景

主图这轮已经补过主序列类型、synthetic study policy、readout / legend / axis formatter contract、per-series formatter 和 acceptance 测试。继续在这条线上打磨当然还有空间，但现在更重要的是把“这一版算收住”的边界写清楚，避免下一阶段做交易绩效图表时又把需求混回 technical-analysis main series。

## 改动

- 新增 `docs/main-chart-v1-acceptance.md`。
- 记录本轮 accepted scope，包括 unified main series、non-time chart semantics、Kagi / P&F usability、readout/formatter contract、drawing baseline 和 snapshot baseline。
- 记录实际跑过的 verification commands。
- 明确 known limits，尤其是 TradingView parity、`gaps` merge、source-context registry、formatter persistence、drawing completeness 和 template migration。
- 明确下一阶段 `performance-chart` 应该是单独产品线，而不是继续塞进主图 chart type。

## 验证

- `pnpm check`

## 还没做

- 没有实现新的交易绩效图表。
- 没有修改 runtime chart behavior。
- 没有处理当前未跟踪的参考文件。
