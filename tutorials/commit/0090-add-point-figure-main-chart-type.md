# 背景

上一刀已经把 `line-break` 作为第一条真正的 synthetic builder 拉进了主图体系，但这还不能说明 `chartx2` 已经具备更广的 price-based/non-time chart family 承载能力。

因为 `line-break` 虽然会重构 bar sequence，但它仍然比较接近“确认哪些收盘转折被保留”。

要再往前一步，最合适的就是：

- `point-figure`

它比 `kagi` 更适合作为第二条 builder 路径，因为：

- 规则足够明确
- reversal 机制比 Kagi 的粗细/突破语义更简单
- 可以先复用现有 `brick` 几何表达

# 主要目标

给 `chartx2` 增加一条最小可用的 `point-figure` 主图路径：

- 主图能切到 `point-figure`
- builder 真的构造 synthetic box sequence
- 先采用最小 `3-box reversal` 语义
- 先复用现有 `brick` renderer，而不急着实现完整 X/O 视觉体系

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneMainChartType` 新增 `point-figure`
  - 新增 `buildPointFigureData()`
  - `applyMainSeriesBuilderData()` 现在会在 `builder = "point-figure"` 时返回 synthetic boxes
  - `createMainBarSequenceFromSource()` 现在把 `point-figure` 和 `renko` 一样归到 projected price-based sequence
  - 主图类型映射新增：
    - `builder: "point-figure"`
    - `renderer: "brick"`
    - `styleSchemaId: "pnfStyle"`
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - workbench 主图按钮新增 `P&F`
  - rebuild / action 路径都能切到该主图
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 增加 `buildPointFigureData()` 单测
  - 当前单测锁住的是最小 3-box reversal + 当前 `inferRenkoBoxSize()` 推导下的 builder 输出
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 增加 `point-figure` 主图切换回归
  - 锁住：
    - `chartType`
    - `builder`
    - `renderer`
    - `styleSchemaId`
    - `pointCount`
    - 视觉基线
- 新增快照：
  - [phase-one-api-point-figure-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-point-figure-series.png)

# 关键知识

这次最重要的不是“又多了一个主图类型”，而是：

`point-figure` 和 `renko` 一样，都开始逼着 chart engine 承认“当前 chart 的 canonical bar sequence 可以不是原始 time bars”。

这就是为什么：

- `point-figure` 不能只写成一个新的 renderer 名字
- 它必须走 builder
- 它必须进入 chart-level bar sequence 路径

否则后面做多 pane、study merge、crosshair 和 viewport 时，模型会越来越乱。

# 补充知识

这次的 `point-figure` 是刻意收窄的最小版本：

- 固定 3-box reversal
- box size 仍复用当前 `inferRenkoBoxSize()` 风格
- 渲染先复用 `brick`

这有两个现实原因：

1. 先把 synthetic sequence 路径做对，比一开始追完整 X/O 视觉更重要
2. 当前 chartx2 更需要验证“builder 家族能否持续扩”，而不是马上做完 P&F 的所有显示细节

也就是说，这次更像是在搭承重梁，而不是做完整装修。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 当前 `point-figure` 仍是最小 3-box reversal 口径，没有 public 参数配置
- 视觉层还没有真正的 X/O 专用 renderer，现阶段仍复用 `brick` 形态
- `kagi` 和 `range` 仍然是下一批 synthetic builder 工作
