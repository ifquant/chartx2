# 背景

`point-figure` 落地后，`chartx2` 已经有了第二条真正的 synthetic builder 路径，但 price-based family 还缺一个很关键的成员：

- `kagi`

它的重要性不在于“又多一个主图按钮”，而在于它和 `renko / point-figure / line-break` 的建模压力不一样：

- 它更像段线而不是砖块
- 它要求 builder 不只是“不断 append 新 bar”，还要能在同方向延伸时更新当前段
- 它会逼着 renderer 和 builder 的边界更清楚

# 主要目标

给 `chartx2` 增加一条最小可用的 `kagi` 主图路径：

- 主图可以切到 `kagi`
- 引擎真的走 `builder = "kagi"`，而不是 time-bars 伪装
- 先用最小 reversal 阈值语义构造 synthetic segments
- 先复用现有 line renderer，把 `segment` 作为专门的主图 renderer metadata

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneMainChartType` 新增 `kagi`
  - 新增 `buildKagiData()`
  - `applyMainSeriesBuilderData()` 现在会在 `builder = "kagi"` 时返回 synthetic segments
  - `createMainBarSequenceFromSource()` 现在把 `kagi` 和 `renko / point-figure` 一样归到 projected price-based sequence
  - 主图类型映射新增：
    - `builder: "kagi"`
    - `renderer: "segment"`
    - `styleSchemaId: "kagiStyle"`
  - 渲染层新增 `segment` 分支：按每段的 `open -> close` 生成同 `x` 的竖线点，再依靠相邻段之间的横向连接形成最小 Kagi 外观
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - workbench 主图按钮新增 `Kagi`
  - rebuild / action 路径都能切到该主图
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 增加 `buildKagiData()` 单测
  - 当前单测锁住的是最小 reversal builder 输出，以及“同方向延伸时合并为当前段”的行为
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 增加 `kagi` 主图切换回归
  - 锁住：
    - `chartType`
    - `builder`
    - `renderer`
    - `styleSchemaId`
    - `pointCount`
    - 视觉基线
- 新增快照：
  - [phase-one-api-kagi-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-kagi-series.png)

# 关键知识

这次最重要的知识点是：

`kagi` 不是“line chart 换个名字”，而是“synthetic sequence + 特定几何连接规则”。

所以这次故意把它拆成两层：

1. builder 决定哪些转折和延伸会留下来
2. renderer 只负责把这些段画出来

这个拆法后面继续做：

- 真正的 Kagi 粗细切换
- shoulder / waist 语义
- 更多 price-based builders

都会更稳。

# 补充知识

这版 `kagi` 仍然是受控最小实现，不是完整 TradingView 级语义：

- reversal 阈值仍复用当前 `inferRenkoBoxSize()` 推导
- 还没有 `yang / yin` 粗细切换
- 还没有公开参数面去调 reversal 规则

这次先把“主图对象模型里能承载 Kagi”做对，再考虑把它做得更像真实交易软件。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 当前 `kagi` 仍是最小 reversal 版本，没有公开参数配置
- 还没有完整的粗细切换、肩/腰突破语义
- `range` 仍未进入 synthetic builder family
