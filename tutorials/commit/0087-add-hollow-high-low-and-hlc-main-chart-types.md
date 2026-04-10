# 背景

上一刀已经把 `line-markers` 和 `stepline` 接进了主图类型链路，但那还只是 `line` 家族的扩展。

如果想让主图 breadth 更像真正的图表终端，下一批最划算的不是马上跳去做：

- `line-break`
- `kagi`
- `point-figure`
- `range`

而是先把仍然属于 `time-bars` 家族、但能明显拉宽主图选择面的这三种补上：

- `hollow-candles`
- `hlc-bars`
- `high-low`

# 主要目标

继续保持“同一批时间 bar，只换几何表达”的思路：

- 不引入新的 bar builder
- 不引入新的 public series API
- 只扩 renderer mode、主图 `chartType` spec、demo picker 和 API 视觉回归

# 改动概览

- 更新 [src/lib/chartx/internal/renderers/candlesticks-renderer.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/renderers/candlesticks-renderer.ts)
  - 新增 `bodyMode`
  - 现在支持：
    - `filled`
    - `hollow`
  - `hollow-candles` 的上涨柱体会画空心边框，下跌柱体保持实心
- 更新 [src/lib/chartx/internal/renderers/bar-renderer.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/renderers/bar-renderer.ts)
  - 新增 `mode`
  - 现在支持：
    - `bars`
    - `hlc-bars`
    - `high-low`
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneMainChartType` 新增：
    - `hollow-candles`
    - `hlc-bars`
    - `high-low`
  - 主图类型映射新增：
    - `hollowCandleStyle`
    - `hlcBarStyle`
    - `highLowStyle`
  - 渲染阶段会根据 `renderer` 分发到：
    - hollow candle 模式
    - HLC bar 模式
    - high-low 模式
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - workbench 主图按钮新增：
    - `Hollow`
    - `HLC`
    - `Hi-Lo`
  - rebuild / action 分支都能切换到这三种主图
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 增加 3 条主图类型切换回归
  - 锁住：
    - `chartType`
    - `renderer`
    - `styleSchemaId`
    - 首帧快照
- 新增 API 快照：
  - [phase-one-api-hollow-candles-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-hollow-candles-series.png)
  - [phase-one-api-hlc-bars-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-hlc-bars-series.png)
  - [phase-one-api-high-low-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-high-low-series.png)

# 关键知识

这次最重要的经验是：

`chartType` 不等于“必须重做整个图表内核”。

对这三种类型来说，真正变化的是：

- 蜡烛实体怎么画
- 柱形的左右 tick 要不要画
- close tick 是不是仍然保留

而不是：

- 横轴语义变了
- bar sequence 变了
- 主图上下文变了

所以它们非常适合先做，因为能快速增加主图宽度，又不会把 `ChartContext / ChartBarSequence` 的复杂度推高。

# 补充知识

这次也进一步证明了一个分层原则：

- `hollow-candles` 是 `candlestick renderer mode`
- `hlc-bars` / `high-low` 是 `bar renderer mode`

这比新建一堆平行 renderer 文件更稳，因为：

- 这些类型共享同一份输入结构
- 共享同一套 price scale / time scale 投影
- 差异主要在 geometry 细节

只要 mode 清晰，后面继续补同一家族的图型时，扩展成本会低很多。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这次仍然没有进入 `line-break / kagi / point-figure / range` 这些真正改变 builder 的图型
- `hollow-candles` 目前还没有更细的实体样式面，比如单独的边框色、边框宽度、实体填充配置
- `hlc-bars` 和 `high-low` 目前仍复用基础 `bar` 配色 options，没有更独立的 public style schema
