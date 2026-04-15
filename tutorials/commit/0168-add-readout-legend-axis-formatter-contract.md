# 0168 - 固定 Readout / Legend / Axis Formatter 契约

## 背景

主图类型和 synthetic study 已经能跑通，但显示层还有一个结构性问题：axis、legend、readout、demo UI 各自格式化数值，长期会导致同一个价格在不同位置显示成不同口径。产品化收口需要先把“raw value”和“display text”的边界固定下来。

## 改动

- `PhaseOneReadoutDetail` 增加 `formatted` 字段，统一输出 `time / open / high / low / close / price` 的显示字符串。
- `PhaseOneReadoutSeriesDetail` 增加 `formattedValue`，pane legend 和 demo readout 都使用同一份 per-series 展示值。
- price formatter 现在不仅影响 price axis，也影响 OHLC readout、price readout、非 volume series legend/readout、price line 和 magnet price labels。
- time formatter 现在同时覆盖 time axis、magnet time label 和 readout time。
- volume series 保持独立的 compact volume formatter，避免被 chart-wide price formatter 污染。
- 新增 `docs/readout-legend-axis-formatter-contract.md` 记录这套规则。

## 验证

- `pnpm check`
- `pnpm test:unit`
- targeted Playwright formatter/options flow

## 还没做

- 还没有 per-series formatter registry。
- `priceFormatter` 仍然是 chart-wide price-like value formatter。
- `gaps` merge 仍未区分 whitespace bar 的显示语义。
