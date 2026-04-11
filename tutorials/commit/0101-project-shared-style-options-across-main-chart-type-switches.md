# 背景

前几刀已经把主图模型拆成了：

- chart type registry
- style schema registry
- style option registry

但运行时还有一个很实际的问题没有解决：

- `setChartType()` 切换主图类型时，数据会保留
- 标记和 price lines 会保留
- 但样式 options 基本重新回到默认值

这和“统一 main series 切换模式”的方向并不一致。

如果主序列真的是同一个对象在切模式，那么切图型时至少应该尽量保留：

- 共享 surface 的样式字段

例如：

- `candlestick -> renko`
  - `upColor / downColor / wickColor` 应该能保留
  - `renkoBoxSize` 则用 `renko` 自己的默认值

# 这次要解决什么

把主图图型切换从“裸重建”推进成“schema-aware 样式迁移”：

- 共享字段保留
- 不兼容字段丢弃
- 目标 schema 的专属字段继续走自己的默认值

# 改动概览

- 更新 [src/lib/chartx/internal/model/main-series-style-schemas.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/main-series-style-schemas.ts)
  - 新增 `projectMainSeriesStyleOptions()`
  - 根据 `fromSchema -> toSchema` 计算可携带的共享字段
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `setChartType()` 现在会把当前主图的 style options 和旧 schema 一起传给新的主图 source
  - 新主图 source 会基于目标 schema 默认值，再叠加从旧 schema 投影过来的共享字段
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 增加 schema-aware style projection 的契约测试
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 记录主图图型切换已经不再是无条件样式重置

# 关键知识

这次最重要的知识点是：

“统一主序列”不只是数据 continuity，也应该有 style continuity。

但这种 continuity 不能靠盲目拷贝所有字段，因为不同图型的字段并不兼容。

所以正确做法不是：

- 全拷贝

也不是：

- 全重置

而是：

- 按 schema 做投影

# 补充知识

为什么这次只做“共享字段投影”，没有做更复杂的 schema migration？

因为第一版最稳的规则就是：

- 只保留两个 schema 都认识的字段
- 目标 schema 的专属字段保持默认值

这已经比“每次切主图样式全丢”更合理，而且实现风险低很多。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 当前 style projection 仍然只按字段名交集做迁移，没有更复杂的 schema transform 规则
- 这条能力目前主要体现在 runtime 切图型，模板/持久化层还没有直接复用这份迁移逻辑
