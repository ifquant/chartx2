# 背景

前一版已经把 `StudySource.inputContext` 变成了显式状态，但还只是“有这个字段”，没有真正影响运行时数据。

也就是说，当时的系统只能表达：

- 这个 compare study 想吃 `requested-context`

却还不能真的把那份数据合并回当前 chart bars。

# 主要目标

让 `compare` 成为第一条真正可运行的 `requested-context` 路径：

- 用户提供另一上下文的数据
- chart 仍保持单一横轴
- compare series 把那份数据 merge 回当前 chart bars 再显示

# 改动概览

- 新增 [src/lib/chartx/internal/model/study-data-merge.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/study-data-merge.ts)
  - 定义 `mergeStudyDataToChartContext()`
  - 当前实现支持：
    - `carry-forward`
    - `exact`
  - 其中 `gaps` 现阶段先按 `exact` 语义处理
- 更新 [src/lib/chartx/internal/model/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/index.ts)
  - 导出新的 merge 模块
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 给 `PhaseOneCompareSeriesOptions` 增加：
    - `inputContextMode`
    - `requestedSymbol`
    - `requestedResolution`
    - `requestedSession`
    - `requestedTimezone`
    - `mergePolicy`
  - `compareSeries.applyCompareOptions()` 现在会真正更新 `inputContext`
  - `compareSeries.getCompareOptions()` 会返回完整 compare/requested-context 配置
  - study runtime 现在区分：
    - `inputData`：原始输入数据
    - `data`：合并到当前 chart bars 后用于渲染的数据
  - 当主图 context 变化时，会重新同步需要依赖 chart context 的 studies
- 更新 [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)
  - 增加 `carry-forward` merge 单测
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 扩展 compare options 断言
  - 增加 “compare requested-context merge back” 的浏览器回归测试

# 关键知识

`requested-context` 的关键不是“多一条横轴”，而是“另一份数据如何落回当前 chart bars”。

这次实现里，chart 仍然只有一套横轴：

- main chart bars 决定横向 domain
- compare requested-context 数据被 merge 后，重新变成这套 domain 上的 series

这和 TradingView 的方向是一致的。

# 补充知识

这次把 study state 分成了：

- `inputData`
- `data`

这个拆分很重要。

如果你把 merge 后的数据直接当成原始输入保存，后面做：

- update
- chart type switch
- bar sequence rebuild

就会把“显示态数据”误当成“输入态数据”，导致 requested-context 语义越来越乱。

另一个现实边界是：当前 phase-one renderer 还没有真正的 whitespace/gap 支持，所以 `gaps` 目前只能先退化处理，不能假装已经完整实现。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这次只把 `compare` 做成第一条 requested-context 路径，其他 studies 还没有接这套机制
- `gaps` 目前仍然是过渡语义，不是最终可视化上的真正 gap 表达
