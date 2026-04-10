# 背景

前面我们已经把主序列和 secondary pane series 收进了 `SourceRegistry`，也让 pane snapshot 能带出 `sourceRole`。但如果 registry 里所有 source 仍然都是一个大一统结构，后面继续做 `Overlay / Compare / Indicator` 时，还是要靠 `role === "study"` 再临时分流。

这次提交的目的，就是把 `study` 从一个字段判断，正式提升成一个运行时 subtype。

# 主要目标

- 把 source runtime state 明确拆成 `MainSeriesSourceState` 和 `StudySourceState`
- 给 `StudySourceState` 加入 `studyKind`
- 让 pane snapshot 也带出这个 subtype 信息

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 新增 `StudySourceKind`
  - 把 source state 拆成：
    - `MainSeriesSourceState`
    - `StudySourceState`
    - `SeriesSourceState`
  - 把原来的 `createSourceState()` 分成：
    - `createMainSourceState()`
    - `createStudySourceState()`
  - 当前 secondary pane series 统一按 `studyKind: "series"` 注册
- 扩展 pane snapshot
  - `PhaseOnePaneSeriesState` 新增 `studyKind`
  - 主序列为 `null`
  - 当前 secondary series 为 `"series"`
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 对主序列和 volume study 的 `studyKind` 做显式断言
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 记录“extra pane series 现在已经是第一版 `StudySource` subtype”

# 关键知识

这次的重点不是增加新功能，而是把“以后要扩展的分叉点”提前固定。

如果一个模型未来一定会长出几类不同对象，那最好尽早把 subtype 边界立起来。这样后面加 `overlay`、`compare` 时，是往已有的 subtype 体系里填，而不是再做一轮更疼的结构迁移。

# 补充知识

- `role` 和 `subtype` 不是一回事。`role` 适合表达“大类归属”，比如 main/study；`subtype` 适合表达“这个大类里面具体是哪一种”，比如 `series / overlay / compare / indicator`。
- 当你不想一次性把未来所有类型都实现完时，可以先把 subtype 枚举和当前最小值立起来。这种做法比继续维持“以后再说”的通用对象更稳。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 目前只有 `studyKind: "series"` 真正在运行时落地
- `overlay / compare / indicator` 还没有单独的 add/create 路径
- 这次没有新增 public source api，只是让内部模型和 pane snapshot 更接近目标对象模型
