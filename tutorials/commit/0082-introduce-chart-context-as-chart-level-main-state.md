# 背景

上一刀已经把 `ChartBarSequence` 抽成了模型对象，但 chart 级状态本身还没有真正集中起来。

当时的情况更像是：

- 文档里已经说“Chart 应该拥有 context”
- 代码里却还是 `currentMainSourceId + getMainSource() + 各种 helper` 在共同维持主图状态

这会让后续的 `requested-context`、`mergePolicy`、多种非标准图表类型继续被散落在 harness 里。

# 主要目标

把 chart 级的“当前主图上下文”开始正式收进一个模型对象里，让主图类型、主 source 身份、当前 bar sequence 不再只是零散字段。

# 改动概览

- 新增 [src/lib/chartx/internal/model/chart-context.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/chart-context.ts)
  - 定义 `ChartContext`
  - 管理：
    - `chartType`
    - `mainSourceId`
    - `barSequence`
- 更新 [src/lib/chartx/internal/model/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/index.ts)
  - 导出 `ChartContext`
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 移除 `currentMainSourceId` 作为主 source 真相来源
  - 改为通过 `chartContext.snapshot().mainSourceId` 找当前主图
  - 在 `attachPrimarySeries()`、`setData()`、`update()`、`setChartType()`、`removeSeries()`、`Renko applyOptions()` 这些路径里同步 chart context
  - 把“从 source 现算主图 sequence”和“从 chart context 读取当前 sequence”拆开，避免 context 更新时引用到旧 sequence

# 关键知识

`ChartContext` 的价值不在于“多一个类”，而在于统一 chart 级真相来源。

只要一个概念影响这些能力：

- 当前主图类型
- 当前横轴 bar sequence
- studies 默认吃哪个 context

它就应该逐步从 view/harness 的临时字段搬进 chart-level model。

# 补充知识

这次顺手修掉了一个典型的状态模型陷阱：

- 如果 `syncChartContextFromMainSource()` 直接复用“读当前 context”的 helper
- 而当前 context 又已经绑定了同一个 `mainSourceId`
- 就会把旧 sequence 再写回自己，形成“状态更新时命中旧缓存”的错误

所以这里必须分开：

- `createMainBarSequenceFromSource()`：从 source 现算
- `buildMainBarSequence()`：优先读 chart context 当前值

这种“写路径不能偷懒走读缓存”的原则，后面做 `requested-context merge` 时同样适用。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- `ChartContext` 目前还是最小版本，还没有纳入 `symbol / resolution / session / timezone`
- studies 仍然没有 `inputContext = chart-context | requested-context` 的运行时分流
