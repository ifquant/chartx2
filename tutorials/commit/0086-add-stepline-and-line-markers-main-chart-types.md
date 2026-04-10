# 背景

前一版虽然已经有：

- `candlestick`
- `heikin-ashi`
- `renko`
- `bar`
- `line`
- `area`
- `baseline`
- `histogram`

但主图类型的 breadth 还是偏窄，距离真正的 TradingView / Advanced Charts 风格还有一段距离。

这次的目标不是直接跳去做 `Kagi / Point & Figure / Line Break` 这类更重的 price-based builder，而是先补一批更便宜、但能明显拉宽主图面子的类型：

- `line-markers`
- `stepline`

# 主要目标

在不引入新数据模型的前提下，把两种新的主图类型接进现有主图切换链路：

- 复用已有 `time-bars` builder
- 复用已有 `line` 家族数据路径
- 只扩 `renderer` 行为、`chartType` 枚举、demo picker 和视觉回归

# 改动概览

- 更新 [src/lib/chartx/internal/renderers/line-renderer.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/renderers/line-renderer.ts)
  - `LineRenderer` 现在支持：
    - 普通 line
    - `stepline`
    - `showMarkers`
  - marker 半径跟随线宽做最小推导，不额外引入一套新的 public options
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneMainChartType` 新增：
    - `line-markers`
    - `stepline`
  - `createPrimarySeriesApi()` 让这两个类型复用主图 line API
  - `mainSeriesChartTypeSpec()` 新增：
    - `lineWithMarkersStyle`
    - `steplineStyle`
  - 渲染阶段根据 `renderer` 选择：
    - 普通折线
    - 阶梯线
    - 带点折线
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - workbench 主图类型按钮新增：
    - `Markers`
    - `Step`
  - rebuild 和按钮 action 都能切到这两个新主图
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 增加两条主图类型切换回归
  - 锁住：
    - `chartType`
    - `renderer`
    - `styleSchemaId`
    - 首帧视觉基线
- 新增 API 快照：
  - [phase-one-api-line-markers-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-line-markers-series.png)
  - [phase-one-api-stepline-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-stepline-series.png)

# 关键知识

这次的关键取舍是：

不要把所有“图表类型”都理解成“必须新建一套 ChartModel 子类”。

对 `line-markers` 和 `stepline` 这种类型，更合理的拆法是：

- builder 还是 `time-bars`
- 输入能力还是 `c`
- series kind 还是 `line`
- 变化只在 renderer 和 style schema

这和 TradingView 的方向是吻合的，因为很多 chart type 实际上只是：

- 同一批 bar
- 不同几何表达
- 不同样式 schema

不是每次都要重建横轴和数据构造逻辑。

# 补充知识

这次也顺手验证了一件事：

demo shell 的主图按钮虽然变宽了，但现有 workbench / features baseline 没被冲坏。

这说明当前顶部类型条还有余量，短期内继续补几种 line/candle 家族类型，不需要马上重做 shell 布局。

另一个现实边界是：

`line-markers` 和 `stepline` 只是 renderer breadth 扩展，不代表更重的 synthetic / price-based chart type 也可以照这个成本做。

下一批如果进入：

- `line-break`
- `kagi`
- `point-figure`
- `range`

就会重新碰到 `ChartContext / ChartBarSequence` 的更深问题。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这次只补了 `time-bars` 家族里的两种轻量主图类型，还没有进入 `hollow candles`、`high-low`、`hlc bars`
- 这次没有新增更细的 line-marker public style surface，例如 marker size、marker shape、marker fill/border 选项
- 更重的 `line-break / kagi / point-figure / range` 仍然是 builder 层的后续工作
