# 背景

上一提交已经把主序列从“只有 `kind`”推进到了“带 `inputCapability / builder / renderer / styleSchemaId` 的内部模型”，也让 workbench 顶部出现了主图类型选择器。

但那时候真正的切换动作仍然发生在 demo 层：示例代码通过重建整张 chart 来模拟“切主图类型”。

这条路不能长期成立。因为真正对齐 TradingView 的方向，图表类型切换应该是 chart runtime 自己的能力，而不是宿主页面的重建技巧。

# 主要目标

- 给 phase-one chart 增加第一版 chart-type public API
- 让 workbench 使用引擎原生切换，而不是重建 chart
- 补一条自动测试，锁定“切类型后数据保留、旧 handle 失效”的契约

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 新增：
    - `PhaseOneMainChartType`
    - `PhaseOneMainSeriesApi`
    - `PhaseOneChartTypeChangeHandler`
  - 扩展 `PhaseOneChartApi`
    - `getChartType()`
    - `setChartType()`
    - `subscribeChartTypeChange()`
    - `unsubscribeChartTypeChange()`
  - 新增 `attachPrimarySeries()` / `createPrimarySeriesApi()`，把主序列挂载和主图类型切换收进统一路径
  - `setChartType()` 现在会：
    - 移除旧主序列 handle
    - 保留已有主序列数据、markers、price lines、visual state
    - 重新挂上新类型的主序列 runtime
    - 触发 chart-type change 事件
  - 旧主序列 handle 在切类型后会变成失效对象，继续调用会报 `series has been removed`
- 更新 [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)
  - 导出新的 chart-type API 类型
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - workbench 主图类型按钮现在直接调用 `chart.setChartType()`
  - 不再为了切主图而重建整张 chart
  - demo 同时订阅 `subscribeChartTypeChange()`，把状态和事件日志同步回 UI
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 新增 chart type API 测试
  - 断言：
    - `getChartType()` 会返回当前主图类型
    - `setChartType("line")` 后主序列 metadata 会变成 line
    - 旧 candlestick handle 会失效
    - chart-type change 事件会触发

# 关键知识

这次的关键不是“多几个 API 方法”，而是主图类型切换终于从 demo 行为上升成了 chart runtime 的一等能力。

这会直接影响后续 `Heikin Ashi / Renko / Kagi / Point & Figure` 的落法。因为后面再加 builder 时，不应该再让宿主页面负责拆旧图、建新图；它应该只是告诉 chart：

- 把当前主序列切到另一种构造/渲染语义

# 补充知识

- 当一个对象切换后会改变自己的“方法语义”时，最稳的做法通常不是偷偷复用旧 handle，而是让旧 handle 明确失效，再返回一个新的 handle。这样状态边界更清楚，也更容易测试。
- `setChartType()` 目前保留了主序列的数据和图上对象，但没有尝试做“跨类型样式映射”。这其实是合理的第一步，因为“保留数据”比“猜测如何把 candleStyle 自动翻译成 lineStyle”更基础。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 目前只支持 phase-one 已实现的主图类型：`candlestick / bar / line / area / baseline / histogram`
- 还没有 `Heikin Ashi / Renko / Kagi / Line Break / Point & Figure` builder
- `setChartType()` 目前不会做跨类型样式迁移，也没有暴露更细的 chart-type state snapshot
