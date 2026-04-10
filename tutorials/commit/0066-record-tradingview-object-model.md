# 背景

`chartx2` 之前已经完成了 phase-one，也已经开始补 `lightweight-charts` 的差距。但如果只看“又加了一个 series”或“又补了一个 pane API”，后面的实现很容易重新退化成“页面里塞一个大 chart-harness，再一点点堆功能”。

这次提交的目的，不是改运行时代码，而是把后续开发必须遵守的对象模型方向写死在文档里，避免之后继续把 demo shell、pane 逻辑、series 状态、持久化语义混在一起。

# 主要目标

- 把 TradingView 风格的对象模型方向写进 `chartx2/AGENTS.md`
- 把现有 `phase-one` 和 `lightweight-charts gap checklist` 映射到这套模型上
- 顺手修正文档里已经过时的仓库说明，避免后续协作继续参考错误信息

# 改动概览

- 在 [AGENTS.md](/Users/dev/workspace2/hc_apps/chartx2/AGENTS.md) 新增 `TradingView 对象模型方向`
  - 明确 `WidgetShell / Layout -> ChartModel -> TimeScale / Panes / PriceScales / Sources`
  - 明确 `Legend` 是投影层，`Toolbar` 是命令层，不应该拥有 chart runtime state
  - 明确 `OverlayStudy` / `CompareStudy` 应归入 `StudySource`
  - 明确 runtime model 和 `LayoutSnapshot / Templates / UserSettings` 必须分开
- 更新 [AGENTS.md](/Users/dev/workspace2/hc_apps/chartx2/AGENTS.md) 里已经陈旧的仓库说明
  - 补上 `pnpm test`
  - 去掉“没有 lockfile”“`+page.svelte` 还是模板页”“`chart-model.ts` 还是活跃入口”这类旧描述
  - 增加当前真实入口与文档导航
- 在 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md) 新增对象模型映射
  - 把 phase-one 定义成“迁移基线”，不是当前全量架构说明
  - 说明 `engine/shell boundary`、`model core/scales/data`、`renderers/views` 在新模型中各自对应什么
- 在 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md) 新增对象模型映射
  - 说明当前 `TimeScale`、`Panes`、`PriceScales`、`LegendViewModel` 分别已经走到哪一步
  - 把下一阶段重点明确到 `SourceModel / entityRegistry`

# 关键知识

这次最重要的不是“加一层类”，而是确定哪几层本来就不该混在一起：

1. `ChartModel` 不等于 demo 页面。
   `src/routes/+page.svelte` 只负责展示 public API；如果它开始拥有 pane/source 真状态，后续多图布局、布局保存、study/drawing 管理都会变形。

2. `Pane`、`PriceScale`、`Source` 需要显式身份。
   如果它们只是一些散落在 harness 里的数组和字段，短期能工作，但一旦要做 study、compare、drawing、模板存储，就会出现“谁挂在哪个 pane / 哪个 scale / 谁拥有序列”的混乱问题。

3. `Legend` 和 `Toolbar` 不是 scene graph 的 owner。
   它们是投影和命令入口。真正的运行时状态应该留在 chart model / entity registry，而不是从 UI 侧反向主导引擎。

# 补充知识

- 做架构文档时，最有价值的内容通常不是“理想结构图”，而是“哪些错误方向以后不能再走”。这种文档对多人协作和 AI 协作都更有效。
- 当一个 checklist 已经完成后，最好的处理方式不是删除它，而是补一层“它在新模型里的位置”。这样既保留历史，又不会让人误把旧清单当成现状全貌。

# 验证

- `pnpm check`（PASS）

# 未覆盖项

- 这次没有做运行时代码迁移，`SourceModel / entityRegistry` 仍然是后续实现任务
- 没有新增 datafeed、broker、layout persistence、drawing system 等第二阶段能力
