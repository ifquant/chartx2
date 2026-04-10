# 背景

前面几轮补的主图类型，大多还是：

- 同一批 `time-bars`
- 不同 renderer / style schema

这类工作很值钱，但它们并不会真正推动 `ChartContext / ChartBarSequence` 往 non-time synthetic chart 的方向前进。

如果继续只补这些类型，chart engine 会越来越像“很多外观模式”，而不是“已经能承载另一种 bar 构造语义”。

所以这次开始补第一条真正的 builder 家族：

- `line-break`

# 主要目标

给 `chartx2` 增加第一条最小可用的 `line-break` 主图路径：

- 主图能切到 `line-break`
- builder 真的会重构 bar 序列
- 仍然沿用现有 candle renderer 展示 synthetic bars
- 先固定最小 `3-line-break` 语义，不扩参数面

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneMainChartType` 新增 `line-break`
  - 新增 `buildLineBreakData()`
  - `applyMainSeriesBuilderData()` 现在会在 `builder = "line-break"` 时返回 synthetic bars，而不是继续透传原始 time bars
  - 主图类型映射新增：
    - `builder: "line-break"`
    - `renderer: "candles"`
    - `styleSchemaId: "lineBreakStyle"`
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - workbench 主图按钮新增 `Line Break`
  - rebuild / action 分支都能切换到该主图
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 增加 `buildLineBreakData()` 单测
  - 明确锁住当前最小 3-line-break 规则
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 增加 `line-break` 主图切换回归
  - 锁住：
    - `chartType`
    - `builder`
    - `renderer`
    - `styleSchemaId`
    - visual baseline
- 新增快照：
  - [phase-one-api-line-break-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-line-break-series.png)

# 关键知识

这次最重要的一点是：

`line-break` 不该被实现成“普通 candles 的另一个样式名”。

它和前面的 `hollow-candles / hlc-bars / line-markers` 的根本差异在于：

- 前者只改“怎么画”
- `line-break` 改的是“哪些 bar 被确认进入当前 chart 序列”

也就是说，它第一次把主图类型真正推进到了：

- 不同主图类型
- 可能拥有不同的 synthetic main sequence

这就是后面进入：

- `kagi`
- `point-figure`
- `range`

之前必须先跨过的一条线。

# 补充知识

这次的 `line-break` 是刻意收窄的最小版本：

- 固定 3-line-break
- 不做额外 public options
- 不在这一步追 TradingView 的全部细节口径

这样做的原因是，当前更重要的是先验证：

- builder 路径可落地
- synthetic bars 能稳定进现有主图切换
- 浏览器层和测试层能承接新的主图语义

先把这条 runtime path 建出来，比一开始就追完整参数面更值钱。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 当前 `line-break` 仍是最小固定 3-line-break 语义，还没有 public 参数配置
- 这次没有为 `line-break` 增加更专门的 renderer，仍然复用 candle 形态展示 synthetic bars
- `kagi / point-figure / range` 仍然是下一批 builder 级主图类型工作
