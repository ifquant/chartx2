# 背景

上一刀已经把主图 chart type registry 从 harness 挪到了 model 层，但还有一块关键逻辑仍然留在视图层：

- `Renko` 和 `Point & Figure` 的专属参数如何更新

也就是这些规则还写在 [chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts) 里：

- `renkoBoxSize`
- `renkoBoxSizeMode`
- `pointFigureBoxSize`
- `pointFigureBoxSizeMode`
- `pointFigureReversalBoxes`

这意味着：

- 图型定义在 model 层
- 但图型专属参数规则仍然在 view/runtime 层

边界还没完全收口。

# 这次要解决什么

把主图 style-specific option 规则抽成 model 层的纯配置变换：

- harness 只负责把 patch 应用到 source，然后触发重建
- model 负责决定某个 style schema 如何解释这些 patch

这比继续在 harness 里堆 `if (chartType === "renko")` / `if (chartType === "point-figure")` 更稳定。

# 改动概览

- 新增 [src/lib/chartx/internal/model/main-series-style-options.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/main-series-style-options.ts)
  - 定义：
    - `RenkoStyleOptionsState`
    - `PointFigureStyleOptionsState`
    - `MainSeriesStyleOptionsPatch`
    - `MainSeriesStyleOptionsTarget`
  - 导出：
    - `MAIN_SERIES_STYLE_OPTION_APPLIERS`
    - `applyMainSeriesStyleOptions()`
- 更新 [src/lib/chartx/internal/model/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/index.ts)
  - 重新导出新的 style-option 模块
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 删除本地的 `MAIN_SERIES_STYLE_OPTION_HANDLERS`
  - 改为调用 model 层 `applyMainSeriesStyleOptions()`
  - `Renko` / `Point & Figure` 的运行时 option state 类型也改为直接依赖 model 模块
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 增加 model-layer style-option registry 契约测试
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 记录这条边界已进入 model 层

# 关键知识

这次最重要的知识点是：

“style schema id” 只是身份，不是规则本身。

如果只有：

- `renkoStyle`
- `pnfStyle`

这种名字，而没有一套与之对应的 option 应用规则，那 schema 仍然只是标签，不是可运行的模型。

所以要继续逼近 TradingView 的抽象，必须同时具备：

- chart type registry
- style schema identity
- style schema option rules

# 补充知识

为什么这次仍然没有把“重建 chart context”挪到 model 层？

因为重建这件事依赖运行时对象：

- 当前 source state
- 当前 chart context
- 当前 canvas render 生命周期

这些还是 harness/runtime 的责任。

所以这次切的是：

- 规则归 model
- 执行时机仍归 harness

这比把两层强行糊在一起要干净得多。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 当前 model-layer style option registry 仍然只覆盖 `Renko` 和 `Point & Figure`
- 更完整的 per-style schema 配置面和更宽的 public style API 仍然没有展开
