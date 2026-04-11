# 背景

虽然 `Point & Figure` 的 builder 和 compressed sequence 之前都已经接进了引擎，但视觉层还停在一个明显的过渡态：

- 数据语义是 `Point & Figure`
- 画出来却还是 `brick`

这会带来一个很直接的问题：

- 名字叫 `OX 图`
- 但用户看到的不是 `X` 和 `O`

所以这一步不再碰 builder，而是专注把视觉补到最小正确方向。

# 主要目标

给 `Point & Figure` 增加一条专用 `X / O renderer`：

- 主图 metadata 不再伪装成 `brick`
- `up` 列画成 `X`
- `down` 列画成 `O`
- 先保持最小可用，不在这一刀里扩展 box size / reversal 语义

# 改动概览

- 新增 [src/lib/chartx/internal/renderers/point-figure-renderer.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/renderers/point-figure-renderer.ts)
  - 提供最小 `PointFigureRenderer`
  - 每个 synthetic box 现在会按方向绘制成 `X` 或 `O`
- 更新 [src/lib/chartx/internal/renderers/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/renderers/index.ts)
  - 导出新的 renderer
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `PhaseOneMainSeriesRenderer` 新增 `point-figure`
  - `point-figure` 主图类型现在映射到专用 renderer，而不是 `brick`
  - render pipeline 新增 `point-figure` 分支
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - `point-figure` 主图契约现在锁定 `renderer: "point-figure"`
  - 对应视觉快照更新为真正的 `X / O` 形态
- 更新快照：
  - [phase-one-api-point-figure-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-point-figure-series.png)
- 更新文档：
  - [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 现在明确写明 `Point & Figure` 已经有第一版专用 `X / O` renderer

# 关键知识

这次最重要的知识点是：

图表类型不能只在 builder 上对，renderer 也必须说真话。

如果对象模型里写的是 `Point & Figure`，但 renderer 仍是 `brick`，那 chart runtime state 就在对外撒谎。  
这会影响：

- pane snapshot
- event metadata
- visual baseline
- 后面继续补更完整 P&F 语义时的分层判断

所以这次虽然只改视觉，但本质上也是在修正对象模型表达。

# 补充知识

这版 `X / O` renderer 仍然是最小实现：

- `X` 用交叉线表示
- `O` 用空心圆表示
- 每个 synthetic row 仍对应一个最小 box

这已经比 `brick` 明显更接近真实 `OX 图`，但还不是 TradingView 级完整渲染：

- 列间分组视觉还可以继续加强
- 更细的 box spacing 和 lineWidth 还可以继续调
- 真正完整的 P&F 参数体系还没展开

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- `Point & Figure` 仍然缺少更完整的 X/O 列级视觉强化和参数面
- builder 规则这次没有变化，仍然是当前最小 `3-box reversal` 路径
