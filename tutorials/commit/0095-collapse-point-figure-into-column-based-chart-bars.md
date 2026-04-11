# 背景

前一刀虽然已经把 `Point & Figure` 画成了 `X / O`，但视觉上还是不够像真正的 `OX 图`。

根因不是符号本身，而是横轴语义还不对：

- 当时 chart sequence 还是“每个 box 一个逻辑槽位”
- 所以即使画的是 `X / O`
- 看起来仍然更像“按 box 展开的散列”，而不是“按列组织的 OX 图”

这一步真正要修的是：

- `Point & Figure` 的 chart bar sequence 应该按列，而不是按 box

# 主要目标

让 `Point & Figure` 在 chart-sequence 层就开始按列建模：

- 连续同方向的 box 归到同一列
- 同列共享一个 `logical index`
- 时间轴、主图几何、secondary panes merge 都跟着这条列级 sequence 走

# 改动概览

- 更新 [src/lib/chartx/internal/model/chart-bar-sequence.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/chart-bar-sequence.ts)
  - 新增 `createDirectionColumnPriceBasedChartBarSequence()`
  - 会把连续同方向的 price-based rows 收进同一列
  - `bars` 中同列共享同一个 `index`
  - `axisBars` 只保留每列的代表 row
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `point-figure` 主图现在不再走普通 compressed box sequence
  - 改为走新的 direction-column price-based sequence
- 更新 [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)
  - 增加按方向收列的模型单测
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - `point-figure` 相关快照更新为列级表现
- 更新快照：
  - [phase-one-api-point-figure-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-point-figure-series.png)
- 更新文档：
  - [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 现在明确写明 `Point & Figure` 已经开始按列组织 chart bars

# 关键知识

这次最重要的知识点是：

真正的 `OX 图` 不只是“把 box 画成 X 和 O”，而是“列本身就是横轴单位”。

如果横轴单位还是 box，那图看起来就会散。  
只有当：

- 同方向 box 共享一列
- 反转才进入下一列

视觉和对象模型才会开始像你平常看到的 OX 图。

# 补充知识

这一步仍然是最小列模型，不代表 `Point & Figure` 已经完全完成：

- 列模型是靠连续方向收列得出的
- builder 仍然还是当前最小 `3-box reversal`
- 还没有更完整的列级 spacing / annotation / 参数面

但至少现在改的已经不是“画法皮肤”，而是：

- `Point & Figure` 的 horizontal domain 真正更接近列模型

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- `Point & Figure` 仍然缺少可配置 box size / reversal 参数面
- 列级视觉还可以继续强化，比如更稳定的列间距和更清楚的列分组表达
