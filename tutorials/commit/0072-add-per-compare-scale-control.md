# 背景

上一提交已经给 compare 落了第一条 scale 语义：`priceScale().applyOptions({ scaleSeriesOnly: true })` 可以让主轴忽略 compare studies。但那还是 chart 级的总开关。

这意味着如果一张图里有多个 compare studies，或者同一张图里既有 overlay 又有 compare，控制粒度还不够细。

# 主要目标

- 给 `compare` 增加 series 级 scale 选项
- 让单条 compare 自己决定是否影响主轴 autoscale
- 保留原来的 chart-level `scaleSeriesOnly` 作为更粗粒度的总开关

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 新增 `PhaseOneCompareSeriesOptions`
  - 扩展 `PhaseOneCompareSeriesApi`
    - `applyCompareOptions()`
    - `getCompareOptions()`
  - `StudySourceState` 为 compare study 增加 `compareOptions`
  - 新增默认 `affectMainScale: true`
  - 主轴 autoscale 现在会同时考虑：
    - chart-level `scaleSeriesOnly`
    - series-level `compareOptions.affectMainScale`
- 更新 [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)
  - 导出 `PhaseOneCompareSeriesOptions`
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 新增 compare series options 行为测试
  - 断言 `applyCompareOptions({ affectMainScale: false })` 后：
    - 主轴范围回到主序列附近
    - `getCompareOptions()` 返回稳定值
- 新增 visual baseline
  - [phase-one-api-compare-series-options.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-compare-series-options.png)
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 记录 compare 已经有 series-level 的主轴影响控制

# 关键知识

这次推进的重点，是把 compare 的 scale 行为从“整张图的策略”收成“单个对象的策略”。

这是对象模型成熟的重要信号。因为真正的图表系统里，很多规则都不应该是 chart 级唯一开关，而应该落到具体 source 上，让不同对象拥有不同语义。

# 补充知识

- 当一个 chart-level 配置开始显得过粗时，下一步通常不是把它删掉，而是保留它作为默认/总开关，再补一层 per-object override。这样兼容性和表达力都更稳。
- `getCompareOptions()` 这种读取接口虽然看起来简单，但对自动化测试和外层 UI 面板很重要，因为它让运行时状态变得可检查，而不是只能“改完看看图对不对”。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- compare 仍未具备百分比模式、独立 formatter、独立 scale pane 或独立 scale id
- 目前只支持 `affectMainScale` 这一条 compare-specific option
- overlay 还没有对应的 per-series scale policy 选项
