# 背景

前几刀已经把主图样式模型收到了 model 层：

- chart type registry
- style schema registry
- style option registry
- schema-aware style projection

但这些信息仍然主要停留在引擎内部。

外部如果只通过 pane event bus / pane snapshot 看图表状态，拿到的还只有：

- `styleSchemaId`

这对后面要做：

- schema-aware UI
- layout/template persistence
- external inspector/debug panel

还不够。因为只知道 `styleSchemaId`，不知道：

- 它属于哪种 option surface
- 它有哪些字段
- 哪些字段是图型专属字段

# 这次要解决什么

把主图 style schema metadata 显式带进 pane snapshot / pane event bus，让外部运行时读到的 series metadata 更接近内部真实模型。

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOnePaneSeriesState` 新增：
    - `styleOptionSurface`
    - `styleOptionKeys`
    - `styleTypeSpecificOptionKeys`
  - `getPaneSeriesStates()` 对 main series 现在会从 style schema registry 注入这些字段
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - pane event bus 契约测试现在锁定这批 schema metadata
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 记录 pane snapshots 已经能暴露 main-series style schema metadata

# 关键知识

这次最重要的知识点是：

“内部模型已经存在” 和 “外部可观测到这个模型” 是两件事。

如果 metadata 只存在于 engine 内部：

- UI 侧仍然只能靠猜
- persistence 层仍然只能重新推导
- debug tooling 仍然不稳

把 schema metadata 放进 pane snapshot，等于是给 runtime 外层一个稳定观测面。

# 补充知识

为什么这次选择挂在 pane snapshot，而不是立刻做独立的 template API？

因为 pane snapshot 已经是：

- 稳定 public 事件面
- 已有系列/scale/pane metadata
- 适合继续扩展的观察层

先把 metadata 带出来，后面再做 template/persistence 才不会盲飞。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这批 schema metadata 目前主要通过 pane snapshots 暴露，还没有形成独立的 template/layout snapshot API
- study series 仍然没有对应的 style schema metadata 体系
