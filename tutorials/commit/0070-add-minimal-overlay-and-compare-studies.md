# 背景

前面的几次提交，已经把 `SourceRegistry`、`StudySource` subtype、`studyKind` 都立起来了，但运行时只有 `studyKind: "series"` 一种实际落地。也就是说，模型已经在为 `overlay / compare` 预留位置，但还没有真正把这两类对象接进 public API 和渲染路径。

这次提交的目标，就是把这一步补上，而且只做最小可运行版本。

# 主要目标

- 增加最小 `addOverlaySeries()` / `addCompareSeries()` 创建路径
- 让它们作为真正的 `StudySource` subtype 进入主 pane
- 让主 pane 的 readout / legend / render path 正确包含这些 study sources

# 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
  - 新增 `addOverlaySeries()` 和 `addCompareSeries()`
  - 两者当前都走最小 line-style study 路径
  - `studyKind` 分别为：
    - `overlay`
    - `compare`
  - 主 pane 渲染不再只画 main series，也会把 primary-pane study sources 一起画出来
  - 主 pane readout / legend / price lines / markers 也会一起读取 primary-pane study sources
- 更新 [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)
  - 导出 `PhaseOneOverlaySeriesApi`
  - 导出 `PhaseOneCompareSeriesApi`
- 更新 [tests/visual/phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
  - 新增 `overlay + compare` 集成测试
  - 断言主 pane snapshot 里的 `studyKind`
  - 断言 readout 中主 pane 三条 source 都可见
- 新增 visual baseline
  - [phase-one-api-overlay-compare-primary.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-overlay-compare-primary.png)
- 更新 [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
  - 记录“第一条真正的 overlay / compare study 路径已经落地”

# 关键知识

这次最关键的不是“多了两个 API 名字”，而是主 pane 从“只能有一个 main source”开始走向“main source + studies”。

TradingView 风格图表里，主 pane 上经常不只是主 K 线，还会挂 compare、overlay、价格型指标。只要主 pane 仍然写死成“只渲染 main series”，模型就还是没真正转过去。

# 补充知识

- 做这种最小 subtype 落地时，最稳的方式通常不是一次性引入所有样式和参数，而是先复用最接近的已存在表达。这次 `overlay / compare` 先复用了 line-style study path，就是这个思路。
- 只要某类对象开始进入主 pane，就要同步检查四个地方是否一致：
  - render
  - readout
  - legend
  - snapshot/event payload  
  少检查一个，后面就会出现“图上看得到，但事件里没有”或者“事件里有，但图上不画”的不一致。

# 验证

- `pnpm check`（PASS）
- `pnpm test`（PASS）

# 未覆盖项

- 当前 `overlay` 和 `compare` 仍然只是 line-style minimal expression，还没有独立样式体系
- 没有加入 symbol-level compare 语义、百分比模式、独立 scale 策略等更完整 compare 逻辑
- `indicator` 仍未开始做真正的运行时创建路径
