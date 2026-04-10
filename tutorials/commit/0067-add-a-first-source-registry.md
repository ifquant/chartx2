# 背景

前面的 `chartx2` 已经支持多 pane、多 series、pane snapshot、pane event bus，但这些能力还主要挂在 `chart-harness` 里，通过 primary/secondary 两套状态分支在跑。这样继续往上加 `indicator / overlay / compare / drawing`，很容易越做越乱。

这次提交的目标，就是先把“source 的身份和挂载关系”收口成一个最小 registry，让 pane、series、readout、render path 都先共享同一套 source 元数据。

# 主要目标

- 引入最小 `SourceRegistry`
- 把主序列和 secondary pane series 统一收编成 source state
- 让 pane snapshot、pane attachment、series removal、readout、render path 都从 registry 读 source
- 增加 registry 级 unit tests，并确保现有 visual baselines 不回退

# 改动概览

- 新增 [src/lib/chartx/internal/model/source-registry.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/source-registry.ts)
  - 提供 `SourceRegistry`
  - 记录 source 的 `id / label / kind / role / paneId / priceScaleId / visible / api`
  - 支持 `register / list / listByPane / getByApi / move / setVisible / removeByApi`
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 用 `sourceRegistry` 替代原来分散的 `secondarySeries` 挂载关系
  - 主图序列也进入 source state，统一走 `currentMainSourceId`
  - pane snapshot、pane 是否有 series、readout legend、render path、`removeSeries()`、`assertSeriesActive()` 都改为从 registry 读取
  - primary/study series 都改为把 options、markers、priceLines、visuals 存在 source state 上
- 更新 [src/lib/chartx/internal/model/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/index.ts)
  - 导出 `source-registry`
- 新增 [tests/unit/source-registry.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/source-registry.test.ts)
  - 覆盖 source 注册、按 pane 列举、move、visibility、按 api remove
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 把“source registry 仍是未来项”更新成“已有第一版，但还不是最终 owner”

# 关键知识

这次最关键的设计点，不是“把代码搬到新文件”，而是让下面三件事开始共享同一个 source 身份：

1. pane 里挂了什么
2. 渲染时该画什么
3. public API 收到的 series handle 对应谁

如果这三件事各有一套状态，短期看没问题，但只要一加 overlay、compare、drawing，就会开始出现同步问题。source registry 的价值，就是先把“谁是谁、挂在哪、还活着吗”这层收紧。

# 补充知识

- 做受控重构时，优先先统一“身份层”，再统一“行为层”。这次先统一 source identity 和 attachment，而不是一次性把所有 renderer/pane API 全部重写。
- 对图表系统来说，`removeSeries()`、pane snapshot、legend/readout 往往能最快暴露对象模型是否一致，因为这几个地方最依赖“稳定 identity”。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这次的 registry 仍由 `chart-harness` 持有，还没有独立成长为完整 `ChartModel` owner
- `StudySource`、`OverlayStudy`、`CompareStudy`、`DrawingSource` 还没有拆成明确子类型
- `PriceScaleModel` 仍未升级成带完整 attachment/mode 的显式对象模型
