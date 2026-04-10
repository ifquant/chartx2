# 背景

上一提交已经把 `overlay / compare` 作为最小 `StudySource` 接进了主 pane，但它们在行为上还几乎一样。这样虽然模型上有了 subtype，实际体验上还不能体现 compare 的特殊性。

这次提交的目标，就是先给 compare 落一条最小但真实的 scale 语义：主价格轴可以选择只按主序列缩放，不让 compare 把 autoscale 拉飞。

# 主要目标

- 给主价格轴增加最小 `scaleSeriesOnly` 选项
- 让 compare study 可以被主轴 autoscale 排除
- 用一组 visual/integration 测试把这条语义钉住

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 扩展 `PhaseOnePriceScaleApi.applyOptions()`
  - 新增 `scaleSeriesOnly?: boolean`
  - 新增内部 `primaryScaleSeriesOnly`
  - 当它为 `true` 时，主 pane 计算 autoscale range 会跳过 `studyKind === "compare"` 的 study source
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 新增 compare autoscale 行为测试
  - 用一组数值跨度很大的 compare 数据验证：
    - 默认情况下 compare 会把价格轴拉大
    - 开启 `scaleSeriesOnly` 后，主轴回到主序列范围
- 新增 visual baseline
  - [phase-one-api-compare-scale-series-only.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-compare-scale-series-only.png)
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 记录主价格轴已经有第一条 compare exclusion 语义

# 关键知识

这次真正推进的不是“多一个 options 字段”，而是让 compare 和 overlay 开始在行为上分开。

如果 `overlay` 和 `compare` 永远只有名字不同、渲染一样、scale 语义一样，那 subtype 只是表面上的。只要一条真实行为差异落地，对象模型才开始变得有价值。

# 补充知识

- 图表系统里，最先体现对象差异的地方常常不是“长得不一样”，而是“是否参与 autoscale、格式化、坐标系、联动范围”。这些规则通常比样式更早决定系统抽象。
- 做这类 scale 语义测试时，最稳的方法是把数据量做小、数值跨度做大。这样一眼就能看出 compare 是否还在影响主轴。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 当前只有 compare 被排除出主轴 autoscale，overlay 仍按主 pane study 正常参与缩放
- 还没有更完整的 compare 百分比模式、独立 formatter、独立 price scale 策略
- `scaleSeriesOnly` 目前只作用于主价格轴，不是完整的 pane 级 scale policy 系统
