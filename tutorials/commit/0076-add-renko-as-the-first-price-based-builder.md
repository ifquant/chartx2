# 背景

上一提交已经把 `Heikin Ashi` 接进了主图类型系统，证明我们现在的主序列模型不仅能处理“同一批时间 bars 的不同画法”，也能处理“先合成、再渲染”的 time-aligned builder。

但 `Heikin Ashi` 仍然共享原始时间 bar 的节奏。它还不是真正的 price-based / non-time-based 图表。

所以再往前一步，最值得先做的就是 `Renko`。因为它会逼着系统面对一个更本质的问题：

- 输入仍然是时间 OHLC
- 输出却不再按每根原始时间 bar 一一对应
- 同一根时间 bar 里可能生成多块 brick

# 主要目标

- 把 `Renko` 接进 `setChartType()` 主图切换系统
- 落第一版 price-based builder
- 补算法级和 API 级测试，确认对象模型没有被 non-time 输出打穿

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneMainChartType` 新增 `renko`
  - `createPrimarySeriesApi()` 允许 `renko` 复用 candlestick-style 主序列 API
  - `applyMainSeriesBuilderData()` 新增 `renko` 分支
  - 新增：
    - `inferRenkoBoxSize()`
    - `buildRenkoData()`
  - `seriesKindForMainChartType("renko")` 仍映射到 `candlestick`
  - `mainSeriesChartTypeSpec("renko")` 定义为：
    - `inputCapability = "ohlcv"`
    - `builder = "renko"`
    - `renderer = "brick"`
    - `styleSchemaId = "renkoStyle"`
  - `renderSeriesSource()` 现在允许 `renderer = "brick"`，并复用现有 candle-like 绘制路径作为第一版最小 brick 表达
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - workbench 主图类型选择器新增 `Renko`
  - demo 可以直接切进 `Renko`
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 新增 `buildRenkoData()` 算法测试
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 新增 `setChartType("renko")` 契约测试
  - 断言 pane snapshot 中：
    - `chartType = "renko"`
    - `builder = "renko"`
    - `renderer = "brick"`
    - `styleSchemaId = "renkoStyle"`

# 关键知识

这次推进最重要的不是“多支持了一个图表类型”，而是对象模型第一次真正承受了 non-time builder。

`Renko` 的关键在于：显示出来的 brick 数量，不再等于原始 bars 数量。这会直接考验你之前做的两层数据分离是不是正确：

- canonical input data
- builder-derived rendered data

如果这两层没分清，price-based 图表一接进来，时间轴、缩放、readout、切回普通 candles 的行为都会一起乱掉。

# 补充知识

- 这次的 `Renko` 还属于“最小可用 builder”，不是完整 TradingView 级 `Renko`。它目前先用基于 close 变化的推导规则和推断 box size，让对象模型先站住。
- `renderer = "brick"` 并不意味着必须马上引入全新的 renderer 类。第一步完全可以先复用 candle-like 绘制路径，只要对象模型、API 和数据语义先对上。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 当前 `Renko` box size 还是内部推断值，还没有公共 options 面
- 还没有 reversal rules、ATR box size、传统/百分比 box mode 等高级 `Renko` 语义
- `Kagi / Line Break / Point & Figure` 仍未实现
