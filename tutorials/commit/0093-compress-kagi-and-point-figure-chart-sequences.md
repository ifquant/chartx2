# 背景

上一刀已经把 `Renko` 从 projected timeline 切到了 compressed price-based sequence，直接解决了主图空缝问题。

但如果只停在 `Renko`，对象模型还是不一致的：

- `Renko` 用 compressed sequence
- `Kagi / Point & Figure` 还在 projected sequence

这会带来两个问题：

1. 同一家族的 non-time main chart 行为不一致
2. secondary panes 跟随 price-based chart context 的逻辑只能覆盖一部分主图类型

所以这一步的目标很直接：

- 把 `Kagi / Point & Figure` 也切到和 `Renko` 一样的 compressed 模式

# 主要目标

让 `Kagi / Point & Figure` 在 chart-level horizontal domain 上和 `Renko` 采用同一规则：

- 当前 synthetic bars 直接成为 canonical chart bars
- shared `TimeScale` 不再回退到原始 input timeline
- secondary pane 的普通 `series` 也能沿同一条 compressed chart sequence 对齐

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `createMainBarSequenceFromSource()` 现在对 `Renko / Kagi / Point & Figure` 统一返回 compressed price-based sequence
  - 删除这些主图在 harness 里的 projected 分流
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 新增两条回归：
    - `point-figure` 在带 secondary pane 时保持 compressed 对齐
    - `kagi` 在带 secondary pane 时保持 compressed 对齐
  - 更新主图视觉快照：
    - [phase-one-api-point-figure-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-point-figure-series.png)
    - [phase-one-api-kagi-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-kagi-series.png)
- 更新文档：
  - [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 现在明确记录 `Renko / Kagi / Point & Figure` 都已经进入 compressed price-based chart sequence

# 关键知识

这次最重要的知识点是：

`compressed sequence` 不是 `Renko` 专属补丁，而是 price-based main chart 的统一基线。

如果只有一个 chart type 这么做，那是特判。  
当 `Renko / Kagi / Point & Figure` 都这么做时，才开始像真正的 chart-model 规则。

也就是说，这次推进的不是单个图表类型，而是：

- 一条更统一的 non-time chart runtime 规则

# 补充知识

虽然三种 price-based main chart 现在都切到了 compressed sequence，但这不等于它们已经“完全完成”：

- `Kagi` 还没有完整的粗细切换 / shoulder / waist 语义
- `Point & Figure` 还没有真正的 X/O renderer
- secondary pane 的跟随仍然是最小 `carry-forward`，不是更细的图表类型专属聚合

所以这次解决的是“横轴模型一致性”，不是“每种主图都达到 TradingView 细节完整度”。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- `Kagi` 仍然缺少更完整的突破语义和视觉粗细切换
- `Point & Figure` 仍然缺少真正的 X/O renderer
- 其他 non-time / synthetic builders 仍需继续按同一模式推进
