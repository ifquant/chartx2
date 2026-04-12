# 0105: 给主序列增加统一状态快照与恢复 API

## 背景

前面几步已经把主图体系拆成了几条明确的链路：

- `ChartTypeSpec registry`
- `MainSeriesStyleSchema registry`
- `builder registry`
- `renderer registry`

但对外仍然缺一个统一入口，把“当前主图是什么、用了什么样式、有哪些图型专属参数”收成一个可保存对象。

这会直接卡住两类后续工作：

- chart template / layout snapshot
- 图型切换后的主图状态恢复

## 主要目标

这次的目标不是一次性做完整 layout persistence，而是先把主序列自己的状态收成一个 chart-owned snapshot：

- 能读出来
- 能重新应用
- 能覆盖 chart type、style schema、style options、builder-specific options

## 改动概览

1. 新增 `main-series-state.ts`
   - 定义 `MainSeriesStateSnapshot`
   - 定义 `createMainSeriesStateSnapshot()`
   - 把主图状态序列化为一个稳定对象

2. 给 chart API 增加：
   - `getMainSeriesState()`
   - `applyMainSeriesState()`

3. `chart-harness` 现在可以：
   - 从当前 main source 提取统一状态
   - 在图型切换后把这份状态重新应用回新的 main source

4. 增加测试
   - unit test 锁定 snapshot 结构
   - browser API test 锁定“保存 Renko 主图状态 -> 切到 line -> 再恢复 Renko 状态”

## 关键知识

### 1. 持久化对象不等于 runtime source

`MainSeriesSourceState` 是运行时对象，它里面有：

- `store`
- `priceScale`
- `visuals`
- `markers`
- `api`

这些都不是好的持久化字段。

所以这次专门新建了 `MainSeriesStateSnapshot`，只保留真正适合保存和恢复的内容：

- `chartType`
- `inputCapability`
- `builder`
- `renderer`
- `styleSchemaId`
- `styleOptionSurface`
- `styleOptions`
- `renkoOptions`
- `pointFigureOptions`

这一步是在强制分离“运行时实体”和“持久化快照”。

### 2. 主图恢复不能只靠 `setChartType()`

单独调用 `setChartType()` 只能切换主图类型。

但如果要恢复一张图的主图状态，通常还需要一起恢复：

- 同图型的颜色
- `Renko` 的 box size
- `Point & Figure` 的 reversal

所以这次把恢复做成 `applyMainSeriesState()`，而不是继续往 `setChartType()` 上堆参数。

## 补充知识

### 补充 1：为什么 snapshot 里还保留了 `builder / renderer`

这些字段理论上可以从 `chartType` 重新推导出来。

保留它们的意义不是“运行时必须依赖它们”，而是让：

- 调试输出更完整
- 未来 template / snapshot 更自描述
- 下游 UI 不用重新进 engine registry 查一次

### 补充 2：先做 main-series snapshot，是为了给后面的 layout persistence 探路

完整的 TradingView 式持久化最终还会涉及：

- panes
- studies
- compare / overlay
- price scales
- user settings

先把 main series 收成一个可保存对象，能把 schema、切换、恢复这套机制先验证清楚，再往 layout 扩会稳很多。

## 验证

- `pnpm check`
- `pnpm test`

## 未覆盖项

- 还没有把 pane composition / studies / scales 一起纳入统一 chart snapshot
- 还没有正式引入 chart template / layout template 的独立 schema 版本管理
- 当前 `applyMainSeriesState()` 仍然主要面向完整恢复，不是一个细粒度 patch API
