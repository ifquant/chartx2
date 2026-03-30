# 0005 迁移最小 model core/scales/data 闭包

## 背景

在 `chartx2` 里完成最小 helper 闭包之后，phase-one 的下一步是把真正的模型层地基立起来。但这一步仍然不能贪大。`lightweight-charts` 的 `model/` 目录很大，里面混着 `chart-model`、`pane`、`series`、`crosshair`、`grid`、`data-layer` 等不同重量级别的东西。

如果这一刀直接整层搬，会马上把大量还无法验证的依赖和行为一起带进仓库。那不是迁移计划，是 import 风暴。

## 主要目标

只落地后续 `renderers/views` 最可能立刻依赖的最小模型闭包：

- range
- time visible range
- price range
- plot row / plot list
- time scale
- price scale
- baseline series data ingestion

## 改动概览

- 增加 `algorithms` helper，为后续二分查找型的时间可见范围和 plot row 搜索提供底层支持。
- 在 `src/lib/chartx/internal/model/` 下加入最小模型文件：
  - `range-impl`
  - `coordinate`
  - `time-data`
  - `time-scale-visible-range`
  - `time-scale`
  - `price-range-impl`
  - `price-scale`
  - `plot-data`
  - `plot-list`
  - `series-data`
  - `index`
- 更新 [src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts)，把当前活动步骤推进到 `Model Core Scales Data`。
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)，记录已经迁入的模型闭包。

## 关键知识

这一步最重要的判断是：先迁“可以单独成立的数学和数据结构”，而不是先迁“名字听起来像总控中心”的文件。

比如：

- `range-impl`、`time-scale-visible-range`、`price-range-impl` 这类文件本身就有清晰边界
- `time-scale` 和 `price-scale` 这种缩放映射，也是后续渲染必然会用到的硬基础
- `series-data`、`plot-list` 则让数据从 `OHLC input` 走到 `plot rows` 有了第一版结构

反过来，像 `chart-model.ts`、`pane.ts`、`series.ts` 这些总控类，目前还没有足够多的周边依赖能支撑它们健康落地。现在先搬它们，后面只会不停补窟窿。

## 补充知识

- 图表项目里“先把 scale math 立住”非常值钱。因为后面的渲染正确性，本质上都建立在坐标映射是不是稳定。
- `series-data` 里把输入数据先转成 `plot rows`，是后续 renderers 能消费的关键一步。哪怕现在还没有真正的 renderer，这一步也比直接让 UI 读原始 OHLC 数据更对。

## 验证

- `pnpm check` (`PASS`, `svelte-check found 0 errors and 0 warnings`)
- `cargo check` (`PASS`)

## 未覆盖项

- 还没有迁移 `chart-model`、`pane`、`series class` 或 `renderers/views`
- 还没有为这批模型层补上 unit tests
- 还没有建立 visual regression 或 upstream parity contract tests
