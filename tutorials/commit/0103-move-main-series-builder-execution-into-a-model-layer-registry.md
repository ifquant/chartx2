# 背景

前面几刀已经把主图模型拆成了：

- chart type registry
- style schema registry
- style option registry

但还有一个很明显的结构残留一直没拔掉：

- `applyMainSeriesBuilderData()`

它虽然已经是统一入口，但真正的 builder 执行仍然都堆在 [chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts) 里：

- `buildHeikinAshiData()`
- `buildRenkoData()`
- `buildLineBreakData()`
- `buildPointFigureData()`
- `buildKagiData()`
- 再加一层 `switch`

这意味着 builder 还没有真正成为 model 层能力。

# 这次要解决什么

把主图 builder 执行从 harness 搬到 model，并把运行入口收成真正的 builder registry。

这一步不是加新图型，而是把现有图型的构造规则放到正确层级。

# 改动概览

- 新增 [src/lib/chartx/internal/model/main-series-builders.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/main-series-builders.ts)
  - 定义：
    - `MainSeriesBuilderDataPoint`
    - `MainSeriesBuilderContext`
    - `MainSeriesBuilderExecutor`
  - 导出：
    - `MAIN_SERIES_BUILDERS`
    - `applyMainSeriesBuilder()`
    - `buildHeikinAshiData()`
    - `buildRenkoData()`
    - `buildLineBreakData()`
    - `buildPointFigureData()`
    - `buildKagiData()`
- 更新 [src/lib/chartx/internal/model/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/index.ts)
  - 重新导出 builder 模块
- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 删除本地 builder 实现
  - `applyMainSeriesBuilderData()` 现在只做一件事：调用 model-layer `applyMainSeriesBuilder()`
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - builder 单测改为直接从 model 模块导入
  - 新增 builder registry 契约测试
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 记录 builder execution path 已进入 model 层

# 关键知识

这次最重要的知识点是：

“builder 有枚举值” 不等于 “builder 已经是 registry”。

只有当下面两件事同时成立，builder registry 才算真的存在：

1. chart type 能映射到 builder id
2. builder id 能映射到实际执行函数

这次补的就是第 2 条。

# 补充知识

为什么这一步比继续补 renderer 更优先？

因为主图的核心语义先发生在 builder：

- Heikin Ashi 怎么合成
- Renko 怎么出砖
- PnF 怎么出 OX
- Kagi 怎么反转

如果 builder 仍然在 harness 里，chart engine 的核心“造主序列”能力其实还没有彻底脱离视图层。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- builder registry 已经进入 model 层，但 renderer execution registry 仍然主要停留在 harness 内
- `line-break` 和 `kagi` 这类 builder 仍然是当前最小规则，还没有继续扩成更完整的专业语义
