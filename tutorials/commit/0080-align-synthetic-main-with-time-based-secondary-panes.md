# 背景

上一版为了避免 `Renko` 主图在 workbench 里“看起来空白”，临时把 time-based 的 volume pane 和 study pane 关掉了。

这能止血，但不是真正的引擎修复。真正的问题是：

- 主图是 `synthetic main`，例如 `Renko`
- 副 pane 仍然是原始 time-based 数据
- 两边共享一条 `TimeScale`
- 但之前的实现默认“数组下标就是 logical index”

这个前提对 `Renko` 不成立。

# 主要目标

把 phase-one 引擎补到至少能正确支持：

- `Renko` 这类 synthetic main series
- 和 time-based secondary panes 同时存在
- 共享横轴时不再把主图甩出可视区

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 为主序列增加 `buildMainRenderRows()` / `buildMainTimeAxisRows()` / `getMainPointCount()`
  - `Renko` 主图渲染时不再直接使用 builder 产物的顺序 index，而是把 synthetic rows 投影回 canonical input timeline
  - crosshair readout、series readout、time axis anchor 全部改成按 `row.index` 查最近点，而不是按数组位置取值
  - 共享 `pointCount` 对 synthetic main 改为基于 `inputData.length`，保证副 pane 仍按原始时间域布局
  - 主图 price range 继续从 builder 后的数据本体计算，不受投影后的 fractional logical index 干扰
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - 去掉 `Renko` 模式下关闭 volume/study panes 的临时降级
  - workbench 恢复为 `Renko + volume pane + study pane` 共存
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 增加 `Renko main + time-based secondary panes` 的专门视觉回归测试
- 更新视觉基线
  - [tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-renko-secondary-alignment.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-renko-secondary-alignment.png)
  - [tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-panes.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-panes.png)
  - [tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-interactions.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-interactions.png)
  - [tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-annotations.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-annotations.png)
  - [tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-series.png)

# 关键知识

`logical index` 不等于“数组第几个元素”。

当主图是 `Renko`、`Line Break`、`Kagi` 这类 synthetic builder 产物时，一个原始 bar 可能对应多个显示砖块，也可能对应零个显示砖块。此时：

- 数据存储顺序还可以连续
- 但渲染与交互层看到的 logical position 必须是投影后的值

否则 `TimeScale`、crosshair、time axis、legend/readout 会互相打架。

# 补充知识

新手很容易把“时间轴共享”理解成“所有 pane 必须拥有一模一样的行数”。这不对。更准确的说法是：

- 所有 pane 共享的是同一个 logical domain
- 不同 series 需要自己决定如何映射到这个 domain

另一个实用经验是：一旦引入 fractional logical index，所有依赖横轴定位的功能都要一起检查，至少包括：

- renderer
- crosshair
- readout / legend
- time axis labels

只修其中一个，通常会留下更隐蔽的错位 bug。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这次只把 `Renko` 这条 synthetic-main 路径补通，`Kagi / Line Break / Point & Figure / Range` 还没接入同一套 builder+projection
- 目前的 logical index alignment 还是 phase-one 级实现，还没有沉淀成独立的 `TimeScaleModel / SourceModel` 协作层
