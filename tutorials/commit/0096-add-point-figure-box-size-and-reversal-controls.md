# 背景

前几刀已经把 `Point & Figure` 做到了：

- 有 builder
- 有压缩后的 chart sequence
- 有专用 `X / O` renderer
- 还开始按列组织 chart bars

但用户看到的图仍然可能“满屏密麻麻”，原因并不在 renderer 本身，而在框架层缺一条关键能力：

- `Point & Figure` 没有自己的参数面

之前它仍然在借用基于平均 close 波动的隐式推导，这对 demo 假数据还能勉强凑合，但对真实价格量级很容易把 `box size` 算得过小，最终导致 OX 列数量爆炸。

# 主要目标

把 `Point & Figure` 从“只有隐式推导”推进到真正可控的图表类型参数面：

- 独立 `pointFigureBoxSizeMode`
- 独立 `pointFigureBoxSize`
- 独立 `pointFigureReversalBoxes`
- demo workbench 暴露一组最小 preset，让默认图先回到合理密度

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneCandlestickSeriesOptions` 新增：
    - `pointFigureBoxSize`
    - `pointFigureBoxSizeMode`
    - `pointFigureReversalBoxes`
  - `MainSeriesSourceState` 新增 `pointFigureOptions`
  - `buildPointFigureData()` 改成接收完整 options，而不是只吃隐式 reversal 数
  - `createPrimaryCandlestickSeriesApi().applyOptions()` 现在能真正更新 `Point & Figure` 主图参数并重建 chart context
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - workbench 新增 `point-figure-option` 分组
  - 当前提供：
    - `P&F Auto`
    - `Box 60`
    - `Box 120`
    - `Box 240`
  - workbench 指标面板现在会显示当前 `P&F` box 和 reversal 配置
  - 默认把 `Point & Figure` 放在 `fixed 120 / reversal 3` 的更可读配置上
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 增加固定 box size 的 builder 单测
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 增加 `Point & Figure` 固定 box size options 回归
  - 主图快照和 point-count 断言同步更新到新的参数行为
- 更新快照：
  - [phase-one-api-point-figure-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-point-figure-series.png)
- 更新文档：
  - [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 现在明确记录 `Point & Figure` 已经有独立的 box-size / reversal option surface

# 关键知识

这次最重要的知识点是：

`OX 图` 的“看起来对不对”，第一责任往往不是 renderer，而是 `box size`。

如果 `box size` 太小：

- builder 会疯狂出 box
- 列数和列内字符数都会爆
- 即使 renderer 画的是对的 `X / O`，结果还是会像噪声墙

所以这是一个对象模型问题，不是美术问题。

# 补充知识

这次的解决方式是“框架层可配置”，而不是“只把默认值调大”：

- API 能配
- runtime state 能记住
- demo 能切换
- tests 能锁住

这样后面无论接真实行情、接 datafeed，还是继续补更细的 P&F 语义，都不会再回到“所有 box size 都靠隐式猜”的状态。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- `Point & Figure` 仍然还没有完整的 public 参数面文档和更丰富的 preset 体系
- builder 仍是当前最小 P&F 规则，没有继续扩展到更复杂的高低价取样或更专业的 OX 变体
