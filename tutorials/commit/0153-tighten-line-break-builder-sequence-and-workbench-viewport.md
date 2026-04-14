# 0153: 大范围收口 `Line Break` 主图

这次不是只修一张 workbench 截图，而是把 `Line Break` 当成真正的 synthetic 主图类型来收。

## 现象

在 workbench 里切到 `Line Break` 时，主图会接近空白：

- 右侧状态显示已经切到了 `Line Break`
- 但主 pane 里几乎看不到主图
- volume / study pane 仍然还在正常显示

这说明问题不只是 renderer 没画，而是主图 sequence、默认视口和 workbench 数据/布局策略没有收成一套。

## 根因

根因分成三层：

1. `Line Break` 虽然有自己的 builder，但主图 sequence 之前还被当成普通 `time-based` 处理。
2. workbench 没有给 `Line Break` 单独的默认 visible range，导致 synthetic bars 仍然会被原始时间长度的语义拖散。
3. workbench 的 secondary panes 还在喂 raw time-based demo 数据，这和 `Line Break` 这种 synthetic main chart 不是同一条 chart-context。

结果就是：

- API 小夹具里看起来还能出图
- 真实 workbench 里，主图会被 point-count / viewport 关系压到几乎不可见

## 这次改法

这次一起收了三层：

1. 给 `Line Break` 增加第一条 chart-type-specific 选项面
   - `lineBreakCount`
   - 进入 candlestick option surface
   - 进入 main-series state snapshot
   - 进入 style schema registry

2. 把 `Line Break` 主图 sequence 改成 compressed price-based sequence
   - 不再继续走普通 `time-based` main bar sequence
   - 让 synthetic main chart 真正按自己的 logical length 工作

3. 给 workbench 加 `Line Break` 的默认视口和控制面
   - 默认 visible range 按真实 `Line Break` bars 数量来定
   - 增加 `2-Line / 3-Line / 5-Line` 按钮
   - 右侧面板增加 `Line Break` 卡片，显示 line count 和 visible columns

另外，当前 workbench 里仍然暂时 suppress 了 `Line Break` 的 secondary panes。

这是刻意的，不是漏做：

- volume / study pane 现在还是 raw time-based demo 数据
- 如果直接挂回去，会再次把主图逻辑长度拖回原始时间长度
- 要真正恢复这些副 pane，必须先把 synthetic chart-context studies 做对

## 验证

- `pnpm check` PASS
- `pnpm test:unit` PASS
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "line-break|heikin" --update-snapshots` PASS
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "line-break" --update-snapshots` PASS

## 还没做的

- `Line Break` builder 公式还只是 phase-one 版本，没有继续对齐更严格的 TradingView 细节
- `Line Break` workbench 还没有恢复 secondary panes，因为 synthetic main + study chart-context 还没一起收完整
