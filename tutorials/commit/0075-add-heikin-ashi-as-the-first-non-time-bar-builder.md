# 背景

上一提交我们已经把主图类型切换做成了 chart runtime 的原生 API：`getChartType()` / `setChartType()` / `subscribeChartTypeChange()`。

但那时所有已支持的主图类型，本质上仍然都属于同一家族：`time-bars`。也就是说，它们只是“同一批时间 bar 的不同画法”。

要验证当前对象模型是不是走对了，下一步最应该做的不是继续加更多同类 renderer，而是落第一个“先合成，再渲染”的 builder。

`Heikin Ashi` 就是这条线上最合适的第一块试金石。

# 主要目标

- 把 `Heikin Ashi` 接入 `setChartType()` 主图切换路径
- 给主序列补 canonical input data，避免在 `Heikin Ashi -> Candles` 往返时丢失原始 OHLC
- 补算法级 unit test 和 API 级契约测试

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneMainChartType` 新增 `heikin-ashi`
  - `MainSeriesSourceState` 新增：
    - `chartType`
    - `inputData`
  - `PhaseOnePaneSeriesState` 新增 `chartType`
  - `setPrimaryData()` / `updatePrimary()` 不再只维护当前渲染数据，而是先维护 canonical input data，再按 builder 派生运行时显示数据
  - 新增：
    - `buildHeikinAshiData()`
    - `applyMainSeriesBuilderData()`
    - `seriesKindForMainChartType()`
    - `updateCanonicalData()`
  - `Heikin Ashi` 在对象模型里的落法是：
    - `chartType = "heikin-ashi"`
    - `kind = "candlestick"`
    - `builder = "heikin-ashi"`
    - `renderer = "candles"`
    - `styleSchemaId = "haStyle"`
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - workbench 主图类型选择器新增 `Heikin`
  - rebuild 时支持直接以 `Heikin Ashi` 作为默认主图类型进入
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 新增 `buildHeikinAshiData()` 的算法测试
  - 断言合成结果正确且不会污染输入数据
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 新增 `setChartType("heikin-ashi")` 契约测试
  - pane snapshot 现在会带 `chartType`

# 关键知识

这次最重要的推进，不只是多支持了一个图表类型，而是主序列现在终于分清了两类数据：

- canonical input data：用户真正喂进来的原始序列
- rendered data：当前 builder 为了显示而派生出来的数据

如果没有这层区分，`Heikin Ashi` 这种合成型图表一旦切回普通蜡烛，图上看到的就会是“合成后的假原始数据”。那说明对象模型是错的。

# 补充知识

- `Heikin Ashi` 很适合拿来检验对象模型，因为它仍然共享时间轴，但已经不是“原始 OHLC 直接画出来”。它正好卡在 time-based 和 synthetic 之间。
- 在图表系统里，`chartType` 和 `kind` 不一定相同。`Heikin Ashi` 就是典型例子：
  - 从视觉几何上看，它仍然是 candle-like
  - 但从数据构造语义上看，它已经不是普通 candlestick

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 目前只落了 `Heikin Ashi`，还没有 `Renko / Kagi / Line Break / Point & Figure`
- `Heikin Ashi` 目前复用 candle options，还没有单独的 `haStyle` 公共 options 面
- workbench 现在能切到 `Heikin Ashi`，但还没有专门的 legend/readout 文案去明确区分它和普通 candles
