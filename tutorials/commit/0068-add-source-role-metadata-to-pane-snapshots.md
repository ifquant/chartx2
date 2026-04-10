# 背景

前一提交已经把主序列和 secondary pane series 收进了第一版 `SourceRegistry`。但如果 `pane event snapshot` 里仍然只有 `id / label / kind / pointCount`，外部看到的还是“pane 里有几条 series”，还看不出它们是主序列还是 study，也看不出它们挂在哪条 scale 上。

这会让后面继续推进 `StudySource / Overlay / Compare / DrawingSource` 时，对外事件面缺少稳定语义。

# 主要目标

- 给 pane snapshot 增加更明确的 source metadata
- 让 chart-level pane event bus 正式区分 `main-series` 和 `study`
- 把 source 的 price-scale attachment 也稳定暴露出来

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 扩展 `PhaseOnePaneSeriesState`
  - 新增 `sourceRole`
  - 新增 `priceScaleId`
  - `buildPaneState()` 现在从 registry snapshot 中把这两个字段一并带出
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 扩展 pane event bus 测试里的 snapshot 类型
  - 对主序列和 volume study 的 `sourceRole / priceScaleId` 做显式断言
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 记录 pane snapshot 已开始带出 source role 和 scale attachment metadata

# 关键知识

这次看起来只是多加两个字段，但它解决的是“事件快照的语义密度”问题。

当系统还小的时候，`kind: "line"` 就够用；但一旦同一个 chart 里既有 main series，又有 overlay/compare/study/drawing，单靠 `kind` 已经不够判断这个对象在模型里的位置。`sourceRole` 和 `priceScaleId` 就是在补这层结构语义。

# 补充知识

- 对图表系统来说，snapshot/event payload 不只是调试信息，它经常会被外层 shell、面板、联动系统直接消费。所以这类结构字段应该尽早稳定，不要等 UI 长出来再倒逼补齐。
- 做这类“加元数据但不改视觉”的提交时，最适合用现有 visual/integration tests 做回归保护，因为它能证明新字段没有意外影响渲染和交互路径。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这次只增强了 pane snapshot，并没有引入单独的 public source API
- `StudySource`、`OverlayStudy`、`CompareStudy` 仍未拆成更明确的运行时子类型
