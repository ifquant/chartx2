# 0169 - 增加 Per-Series Readout Formatter

## 背景

上一刀已经把 readout / legend / axis 的显示规则收成 raw + formatted 双轨，但 formatter 仍主要是 chart-wide `priceFormatter`。这对主图价格够用，但对 compare、study、volume-like 数据和后续交易绩效图表不够：不同 series 很可能有不同单位，例如百分比、金额、手数、PnL 或自定义 label。

这次先补第一层 per-series formatter，不改变坐标轴语义，只让 legend/readout 的 series display value 可以按 series 自己格式化。

## 改动

- 所有 series options 增加 `valueFormatter?: (value: number) => string | null`。
- series `applyOptions()` 统一接收并保存 `valueFormatter`。
- `PhaseOneReadoutSeriesDetail.formattedValue` 优先使用 series 自己的 formatter。
- 如果 series 没有自定义 formatter，volume 继续走 compact volume formatter，其余 price-like series 继续走 chart-wide `priceFormatter`。
- API 测试覆盖 line series 自定义 formatter 会进入 readout 和 pane legend。

## 验证

- `pnpm check`
- `pnpm test:unit`
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "click subscriptions and series-level options"`

## 还没做

- per-series formatter 目前只影响 legend/readout，不影响对应 pane 的 price axis ticks。
- 还没有 formatter schema registry，也没有 snapshot/restore formatter 函数。
- 交易绩效图表的单位系统仍需要单独设计。
