# 背景

这几轮虽然一直在补主图类型，但实现方式还带着明显的过渡痕迹：

- `chartType` 映射散在 `switch` 里
- `Renko` / `Point & Figure` 的专属参数更新直接写在 `applyOptions()` 里
- `styleSchemaId` 虽然已经存在，但更像附带字段，还不是一等对象

这和我们想对齐的目标不一致。目标不是“很多不同 chart 类”，而是：

- 一个统一的 main series
- 挂不同 `chartType`
- 每个 `chartType` 决定自己的
  - input capability
  - builder
  - renderer
  - style schema

# 这次要解决什么

先不拆文件，也不继续加图型，而是先把主图路由模型钉住：

- 提炼显式 `chart type registry`
- 提炼显式 `style schema id`
- 提炼显式 `type-specific option handler`

这样后面新增图型或扩展参数面时，不需要继续把 `chart-harness.ts` 变成条件分支堆。

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 新增 `PhaseOneMainStyleSchemaId`
  - 新增 `MainSeriesChartTypeSpec`
  - 新增显式注册表：
    - `MAIN_SERIES_CHART_TYPE_SPECS`
    - `MAIN_SERIES_KIND_BY_CHART_TYPE`
    - `MAIN_SERIES_STYLE_OPTION_HANDLERS`
  - `mainSeriesChartTypeSpec()` 现在从注册表取配置，而不是继续靠大 `switch`
  - `createPrimaryCandlestickSeriesApi().applyOptions()` 改成通过 `applyMainSeriesTypeSpecificOptions()` 分发图型专属参数
- 更新 [tests/unit/chart-types.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-types.test.ts)
  - 增加主图注册表契约测试，锁住 `Renko` / `Point & Figure` / `Line Markers` 的 registry 映射
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 明确记录主图体系已经有第一版显式 registry 和 style-schema 分发路径

# 关键知识

这次最重要的知识点是：

“统一主序列”不等于“所有图型都共用一套通用配置”。

真正稳定的抽象应该是：

- 主序列对象统一
- 图型注册表统一
- 但 builder / renderer / style schema 是按图型分开的

也就是：

```text
MainSeries
└─ chartType
   ├─ builder
   ├─ renderer
   └─ styleSchema
```

这比“一个大 options 对象 + 很多 if/else”更接近 TradingView。

# 补充知识

为什么这一步值得先做，而不是继续补新图型？

因为再往后无论补：

- 更完整 `PnF`
- 更完整 `Kagi`
- `Range`
- `Volume Candles` 的更多参数

都需要一个稳定入口，来决定：

- 这个图型如何构造数据
- 这个图型如何渲染
- 这个图型接受哪些专属参数

如果这个入口还是散的，后面每补一个图型，代码复杂度都会线性变坏。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 主图 registry 目前仍然定义在 `chart-harness.ts` 内，还没有拆进更明确的 model / registry 模块
- 目前只有 `Renko` 和 `Point & Figure` 走了专属 options handler，其他图型的样式 schema 仍然主要停留在 identity 层
