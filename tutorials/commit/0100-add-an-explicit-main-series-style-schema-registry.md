# 背景

前几刀已经把主图模型拆成了几层：

- chart type registry
- style option rules

但 `styleSchemaId` 本身仍然偏弱，它更像一个名字，而不是可查询的 schema 对象。

例如：

- `renkoStyle`
- `pnfStyle`
- `lineStyle`

这些名字已经存在，但如果后面要做：

- templates
- style persistence
- 更宽的 public style API
- schema-aware UI

光有名字还不够，还需要知道：

- 这个 schema 属于哪一类 option surface
- 它有哪些字段
- 哪些字段是图型专属字段

# 这次要解决什么

给主图 style schema 增加一层显式 registry，让 schema 不再只是 identity，而是开始拥有结构信息。

这次仍然不扩行为，只补模型表达。

# 改动概览

- 新增 [src/lib/chartx/internal/model/main-series-style-schemas.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/main-series-style-schemas.ts)
  - 定义：
    - `MainSeriesStyleOptionSurfaceKind`
    - `MainSeriesStyleSchemaSpec`
  - 导出：
    - `MAIN_SERIES_STYLE_SCHEMAS`
    - `mainSeriesStyleSchemaSpec()`
  - 当前 schema 会描述：
    - `optionSurface`
    - `optionKeys`
    - `typeSpecificOptionKeys`
- 更新 [src/lib/chartx/internal/model/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/index.ts)
  - 导出新的 style-schema registry
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 新增 `createMainSeriesOptions(styleSchemaId)`
  - 主图 source 的默认 options 现在通过 schema registry 决定 option surface，而不再只靠 `kind`
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 增加 style schema registry 契约测试
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 记录 style schema registry 已经存在

# 关键知识

这次最重要的知识点是：

“style schema” 不是“某个 chart type 的别名”。

它至少还应该表达两件事：

1. 它继承哪种 option surface  
例如：
- `renkoStyle` 目前仍然挂在 `candlestick` surface 上
- `lineStyle` 挂在 `line` surface 上

2. 它有哪些类型专属字段  
例如：
- `renkoBoxSize`
- `pointFigureReversalBoxes`

只有这样，后面做模板、序列化、UI 或 public style API 才不会完全靠手写分支。

# 补充知识

这次为什么还没有把 public API 也改成 schema-aware？

因为当前 public API 仍然是 phase-one 风格：

- 主要是按 series kind 暴露 options

这次先把 model 补齐，后面如果要做更宽的 style API，再决定 public surface 要不要同步改成 schema-aware。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- schema registry 目前只描述 option surface 和字段，不包含默认值、序列化策略或模板兼容策略
- public style API 仍然没有直接消费这份 schema metadata
