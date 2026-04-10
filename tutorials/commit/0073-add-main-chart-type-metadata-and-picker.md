# 背景

前面我们已经把 pane、source registry、study subtype、overlay/compare 这些基础对象关系理顺了，但主序列这条线还停留在“靠 `kind` 判断怎么画”。

这对继续对齐 TradingView 的对象模型是不够的。因为以后接 `Heikin Ashi / Renko / Kagi / Point & Figure` 时，变化点不只是“名字换了”，而是：

- 输入能力不同
- bar 构造方式不同
- 几何渲染方式不同
- 样式 schema 不同

同时，demo 里虽然已经有 `series` feature tab，但默认 workbench 还没有一个明确的“主图类型选择入口”，不利于直接演示主图切换。

# 主要目标

- 给主序列补上第一版 chart-type metadata
- 让 pane snapshot 能带出这些主序列元数据
- 在默认 workbench 里增加主图类型选择器

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 新增主序列类型元数据：
    - `PhaseOneMainSeriesInputCapability`
    - `PhaseOneMainSeriesBuilder`
    - `PhaseOneMainSeriesRenderer`
  - `MainSeriesSourceState` 现在会保存：
    - `inputCapability`
    - `builder`
    - `renderer`
    - `styleSchemaId`
  - 为现有主图类型建立第一版映射：
    - `candlestick -> ohlcv + time-bars + candles + candleStyle`
    - `bar -> ohlc + time-bars + bars + barStyle`
    - `line -> c + time-bars + line + lineStyle`
    - `area -> c + time-bars + area + areaStyle`
    - `baseline -> c + time-bars + baseline + baselineStyle`
  - `renderSeriesSource()` 不再只靠 `kind`，主序列开始优先按 `renderer` 决定绘制路径
  - `PhaseOnePaneSeriesState` 增加主序列 metadata 字段，pane event snapshot 现在能把这些信息带出来
- 更新 [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)
  - 导出主序列 metadata 类型
  - 导出 `PhaseOnePaneSeriesState`
- 更新 [src/lib/demo/chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)
  - workbench 增加 `mainChartType`
  - 默认主图支持直接切换：
    - `Candles`
    - `Bar`
    - `Line`
    - `Area`
    - `Baseline`
  - 切换主图时会重建 chart，并保持 volume pane / study pane 语义不变
- 更新 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)
  - 在 workbench 顶部工具条加入主图类型选择器
  - 将 workbench actions 分成：
    - `chart-type`
    - `chart-action`
  - 让当前激活的主图类型在 UI 上有明确高亮
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - pane snapshot 断言现在会检查主序列 metadata
  - overlay / compare 主图快照断言也会校验主序列 `builder/renderer`

# 关键知识

这次最重要的不是“多了几个按钮”，而是主序列模型终于不再把“图表类型”硬塞进一个 `kind` 字段里。

以后如果你要加 `Heikin Ashi`，本质上应该是：

- `builder = heikin-ashi`
- `renderer = candles`
- `styleSchemaId = haStyle`

也就是说，它不是另一棵新的 `ChartModel`，只是同一个主序列换了一套构造和渲染规则。

# 补充知识

- 对图表系统来说，`builder` 和 `renderer` 拆开非常关键。因为“怎么造显示数据”和“怎么把数据显示出来”不是一回事。TradingView 这类系统的复杂度，很多就来自这两层的组合。
- demo 里的“主图类型选择器”不是单纯 UI 装饰。它相当于一个小型验收台，让你以后每加一种 chart type，都能直接在同一张 workbench 里切换和观察，而不是散落在单独 feature 页里。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 这次只是给主序列铺了 metadata 地基，还没有正式提供 `setChartType()` 这类 public API
- `Heikin Ashi / Renko / Kagi / Point & Figure / Line Break` 还没有真正落到 builder 层
- study source 目前还没有对称的 `builder/renderer/styleSchema` 建模
