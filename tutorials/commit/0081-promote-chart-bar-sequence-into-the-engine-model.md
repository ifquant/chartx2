# 背景

前一版我们已经把 `Renko` 主图和 time-based 副 pane 的“看不见主图”问题修掉了，但那一版的逻辑仍然主要写在 harness 里。

这意味着两个问题还没有真正解决：

- 文档里虽然已经知道长期要走 `chart-context + shared TimeScale + requested-context merge`
- 代码里却还没有一个明确的模型对象来表达“当前 chart 到底在使用哪一串 bars”

如果继续往下做 `MACD on Renko`、`standard-context MACD on Renko`、`Kagi / Line Break / P&F`，就会继续在视图层堆更多特殊判断。

# 主要目标

把“当前 chart 的 bar sequence”从隐含状态提升成一个显式模型，作为后续 `ChartContext` 的第一块地基。

# 改动概览

- 新增 [src/lib/chartx/internal/model/chart-bar-sequence.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/chart-bar-sequence.ts)
  - 定义 `ChartBarSequence`
  - 区分 `time-based` 与 `price-based`
  - 同时输出：
    - `bars`
    - `axisBars`
    - `logicalLength`
  - 提供 `createTimeBasedChartBarSequence()`
  - 提供 `createProjectedPriceBasedChartBarSequence()`
  - 提供 `findNearestRowByLogical()`
- 更新 [src/lib/chartx/internal/model/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/index.ts)
  - 导出新的模型模块
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 用 `buildMainBarSequence()` 代替原来分散的 render/time-axis/point-count 拼装逻辑
  - 让主图渲染、时间轴和横向 logical length 都从同一个 sequence 读取
  - 把“按 logical index 找最近 row”的能力移到模型层复用
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 正式写入 `ChartContext / ChartBarSequence / MergeEngine` 的目标模型
  - 明确记录当前 `Renko` 对齐只是过渡策略，不是最终 TradingView-like 行为
- 更新 [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)
  - 为 `ChartBarSequence` 增加基础单测

# 关键知识

一个图表系统里，“当前 chart bars”应该是显式模型，不应该只是几段辅助函数临时算出来的结果。

因为下面这些能力都依赖同一个事实来源：

- `TimeScale`
- crosshair
- readout
- study input
- requested-context merge

如果这串 bars 没有明确 owner，后面每加一种图表类型，就会多一层分叉。

# 补充知识

`bars` 和 `axisBars` 不一定是一回事。

在普通 time-based 图里，它们可以相同；但在 `Renko` 这种 price-based 图里：

- `bars` 更接近当前主图真正要渲染的东西
- `axisBars` 更接近当前横轴如何表达和定位

把这两个概念拆开，后面才有空间演进到真正的 TradingView 风格 chart context。

另一个实用点是：把“最近 logical row 查找”放进模型层，而不是散在 view 层，能减少后续 renderer / interaction / study 三边重复写二分查找逻辑。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这次只抽出了 `ChartBarSequence`，还没有把完整 `ChartContext` 类型和生命周期引入引擎
- `requested-context` 和 `mergePolicy` 还停留在文档与目标模型层，尚未开始实现
