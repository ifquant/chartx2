# 背景

上一提交已经把 `Renko` 接进了主图类型系统，让 chart runtime 可以从 canonical OHLC 输入派生第一版 price-based bricks。

但那时 `Renko` 仍然只有一个内部推断的 box size。也就是说，虽然图能切到 `Renko`，但最关键的 builder 参数还没有公共控制面。

这对后续继续扩展 `Renko / Kagi / Line Break / Point & Figure` 来说不够，因为 price-based 图表真正的分水岭，本来就不只是“有没有 builder”，更是“builder 参数是不是 runtime 可控”。

# 主要目标

- 给 `Renko` 增加第一版 public options 面
- 让主序列 `applyOptions()` 能影响 `Renko` builder 结果
- 补算法级和 API 级测试，把这条契约钉死

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneCandlestickSeriesOptions` 新增：
    - `renkoBoxSize`
    - `renkoBoxSizeMode`
  - `MainSeriesSourceState` 新增 `renkoOptions`
  - `createMainSourceState()` 现在会为主序列初始化默认 `Renko` 参数
  - `createPrimaryCandlestickSeriesApi().applyOptions()` 现在支持：
    - 当当前主图类型是 `renko` 时，更新 `renkoOptions`
    - 重新派生 builder 数据并重绘
  - `buildRenkoData()` 新增 options 参数，支持：
    - `boxSizeMode = "auto"` 时继续走推断值
    - `boxSizeMode = "fixed"` 且 `boxSize > 0` 时走固定砖块大小
  - `applyMainSeriesBuilderData()` 现在不再只看 builder 名称，也会读取主序列的 `renkoOptions`
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 新增固定 `Renko` box size 的算法测试
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 新增 `Renko` 主序列 `applyOptions()` 契约测试
  - 断言固定 box size 后 brick 数会比 auto 模式更多

# 关键知识

这次推进的重点，是把 `Renko` 从“可切换的图表类型”推进到“参数可控的图表类型”。

也就是说，chart runtime 现在不仅知道：

- 当前主图是不是 `renko`

还知道：

- 当前 `renko` 应该用什么 box size 策略来构造砖块

这一步对 price-based builder 很关键，因为它说明 builder 已经开始脱离“内部黑盒算法”，进入“可配置运行时对象”的阶段。

# 补充知识

- 这次没有额外造一个 `RenkoSeriesApi`，而是先把最小参数面挂进现有主序列 `applyOptions()`。这是一个典型的 phase-one 做法：先把能力接进已有稳定 API，再决定是否需要单独拆更宽的专用 options 面。
- `renkoBoxSize = null + renkoBoxSizeMode = "auto"` 的组合，是一种很实用的状态表达：它把“未固定数值”和“策略选择”分开了，避免了拿 `0` 或负数去做隐式语义。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- `Renko` 目前还没有 ATR box size、reversal options、percent mode 等更完整参数
- 目前的 options 面还挂在 candlestick-style 主序列 options 上，后续可能需要独立 chart-type-specific options 结构
- demo 现在能切 `Renko`，但还没有单独暴露 `Renko` 参数调节控件
