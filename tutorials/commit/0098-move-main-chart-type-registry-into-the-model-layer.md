# 背景

上一刀已经把主图体系收成了显式注册表：

- `chartType`
- `inputCapability`
- `builder`
- `renderer`
- `styleSchema`

但当时它仍然定义在 [chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts) 里。

这有一个明显问题：

- 视图层在拥有本来应该属于模型层的图型定义

如果后面要继续做：

- 更完整的 datafeed
- studies 默认跟随 `chart-context`
- persistence / templates
- 更明确的 chart type option surface

这些能力都不应该依赖“先 import 一个 harness 文件”。

# 这次要解决什么

把主图注册表真正移动到 model 层，让它成为 chart engine 的基础定义，而不是视图实现的附带产物。

这次不扩功能，只修边界。

# 改动概览

- 新增 [src/lib/chartx/internal/model/main-series-chart-types.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/main-series-chart-types.ts)
  - 定义：
    - `PhaseOneMainChartType`
    - `PhaseOneMainSeriesInputCapability`
    - `PhaseOneMainSeriesBuilder`
    - `PhaseOneMainSeriesRenderer`
    - `PhaseOneMainStyleSchemaId`
    - `MainSeriesChartTypeSpec`
    - `MainSeriesChartKind`
  - 导出：
    - `MAIN_SERIES_CHART_TYPE_SPECS`
    - `MAIN_SERIES_KIND_BY_CHART_TYPE`
    - `mainSeriesChartTypeSpec()`
    - `mainSeriesKindForChartType()`
- 更新 [src/lib/chartx/internal/model/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/index.ts)
  - 重新导出新的主图 registry 模块
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 改为从 model 层导入主图 chart type 定义和 registry
  - 删除 harness 内部的主图 registry 常量副本
  - 保留 type-specific option dispatch 在 harness 内，因为它仍依赖 source runtime state
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - registry 契约测试现在直接从 model 模块取 `mainSeriesChartTypeSpec()`
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 明确记录主图 registry 已进入 model 层

# 关键知识

这次最重要的知识点是：

“显式注册表” 和 “注册表放在哪一层” 是两件不同的事。

前一刀解决的是：

- 不再散落分支

这一刀解决的是：

- 让注册表站在正确的层级

如果 registry 继续留在 harness，那么 chart engine 的很多能力还是会被视图层反向拥有。

# 补充知识

为什么 `type-specific option handler` 这次没有一起挪走？

因为它现在依赖的是：

- `MainSeriesSourceState`
- runtime `source` 实例
- 重建 chart context 的具体行为

这些仍然是 harness runtime 的责任。

所以这次的边界选择是：

- 图型定义挪到 model
- 运行时参数应用继续留在 harness

这是比“一次性全拆完”更稳的切法。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- `type-specific option handlers` 仍在 harness 内，尚未进一步抽成更完整的 style-schema runtime 层
- 主图 registry 还没有被 persistence / template / datafeed 路径消费，目前主要还是 chart runtime 和测试在使用
