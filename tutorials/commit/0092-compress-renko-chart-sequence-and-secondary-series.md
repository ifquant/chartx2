# 背景

前面 `chartx2` 为了让 `Renko` 主图和 volume / study panes 共存，走的是一条过渡路线：

- 主图是 synthetic bars
- 但横轴长度仍然按原始 time bars 计算
- secondary panes 也继续按原始 time bars 参与共享 `TimeScale`

这能避免主图直接被甩出视口，但会留下一个明显副作用：

- `Renko` 没有新砖块的时间槽位仍然会保留
- 最终就会在主图里看到一列一列的空缝

用户截图里标红的问题，根因就在这里。

# 主要目标

把 `Renko` 从“投影回原始时间槽位的过渡方案”推进到第一条真正的 compressed price-based chart sequence：

- `Renko` 主图横轴长度改为当前 chart bars 的长度
- secondary pane 的普通 `series` 在 price-based chart 下默认 carry-forward 到当前 chart bars
- shared `TimeScale` 不再被原始 secondary 数据重新撑回去

# 改动概览

- 更新 [src/lib/chartx/internal/model/chart-bar-sequence.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/chart-bar-sequence.ts)
  - 新增 `createCompressedPriceBasedChartBarSequence()`
  - 允许 price-based 主图直接把当前 synthetic rows 作为 canonical `bars + axisBars`
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - `Renko` 的 `createMainBarSequenceFromSource()` 现在走 compressed price-based sequence
  - `Point & Figure / Kagi` 仍然保持旧的 projected 过渡路径
  - `resolveStudyDisplayData()` 现在会让 secondary `series` 在 price-based chart 下默认 carry-forward 到当前 chart bars
  - 渲染时的 `pointCount` 不再只看 `rows.length`，而是按最后一个 logical index 推导，避免再次被不一致的 row 集合带偏
- 更新 [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)
  - 增加 compressed price-based sequence 单测
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 保留并重命名 `Renko + secondary panes` 回归测试，明确它现在验证的是 compressed sequence 行为
- 更新快照：
  - [phase-one-api-renko-secondary-alignment.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-renko-secondary-alignment.png)
- 更新文档：
  - [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 现在明确记录：`Renko` 已经进入 compressed price-based sequence，而 `Kagi / Point & Figure` 还没有

# 关键知识

这次最重要的知识点是：

空隙不是 renderer 画错了，而是 `TimeScale` 还在被错误的 canonical sequence 驱动。

只改主图 renderer 没用。  
只改主图 builder 也不够。  
必须同时改两件事：

1. chart 自己承认当前主图 bars 才是 canonical horizontal domain
2. secondary panes 也愿意跟到这条 domain 上

否则 shared `TimeScale` 迟早会被原始数据重新拉回去。

# 补充知识

这次仍然是受控切片，不是所有 non-time chart 都一起完成：

- `Renko` 现在是 compressed
- `Kagi / Point & Figure` 还没切到 compressed
- requested-context merge 仍然只是第一版

也就是说，这次先把用户最直观看到的 `Renko` 空缝问题解决掉，再把同一模式推广到其他 price-based builders。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- `Kagi / Point & Figure` 仍然还没有切到 compressed price-based sequence
- secondary `series` 目前在 price-based chart 下仍是最小 `carry-forward` 口径，不是更精细的聚合/重采样
- 更完整的 requested-context merge policy 仍需继续扩展
