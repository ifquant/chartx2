# 0107: 让 chart state snapshot 开始覆盖 study sources

## 背景

上一提交已经让 chart snapshot 可以保存：

- chart layout / crosshair 外观
- viewport
- pane composition
- main series state

但如果 snapshot 还不包含 study sources，它离真正可保存的 chart template 仍然差很远。

这次先把当前已经稳定的三类 study 拉进来：

- `overlay`
- `compare`
- `moving-average`

## 主要目标

把 chart snapshot 从“只保存 chart 壳层”推进到“开始保存实际图表分析对象”。

## 改动概览

1. 扩展 `PhaseOneChartStateSnapshot`
   - 新增 `studies` 字段
   - 当前只收录三类可恢复 study

2. 实现 study snapshot 提取
   - 从 `SourceRegistry` 中找出：
     - `studyKind: "overlay"`
     - `studyKind: "compare"`
     - `studyKind: "indicator"` 且 `moving-average`
   - 记录：
     - `paneIndex`
     - line 系列样式
     - compare / study 专属选项
     - overlay / compare 的输入数据

3. 实现 study restore
   - `applyChartState()` 先清掉可恢复 studies
   - 然后按 snapshot 重建：
     - `addOverlaySeries()`
     - `addCompareSeries()`
     - `addMovingAverageStudy()`

4. 增加 browser parity test
   - 保存 `overlay + compare + moving-average`
   - 删除它们
   - 再通过 `applyChartState()` 恢复
   - 对比 `savedStudies === restoredStudies`

## 关键知识

### 1. 这一步的对象边界第一次碰到了真正的 `StudySource`

`mainSeries` 还是 chart 的核心 source。  
但当 snapshot 开始收 study 时，chart template 才真正开始接近 TradingView 那种“图 + 分析层”的概念。

这也是为什么这一步很重要：

- chart snapshot 不再只是 UI 外观状态
- 它开始保存分析对象

### 2. restore 前要先清旧 studies

如果不先移除现有的 restorable studies，直接重建，会出现：

- pane 中重复挂 study
- compare / overlay 叠两层
- moving-average 的 pane 数量和内容不一致

所以这次 restore 的顺序是：

1. 清掉当前可恢复 studies
2. 恢复 panes / main series
3. 再恢复 studies

## 补充知识

### 补充 1：为什么这次不把普通 secondary series 一起纳入 snapshot

当前 `chartx2` 里有两类东西都能挂在 secondary pane：

- managed secondary series
- study sources

它们虽然都能画出来，但在对象模型上不是一回事。

这次先只纳入真正有 `studyKind` 语义的对象，是为了避免把“series management”和“study persistence”混成一个模糊层。

### 补充 2：为什么 moving-average snapshot 不保存 data

`moving-average` 的正确语义是：

- 它主要由 `studyOptions + inputContext + main chart context` 决定
- 不是像 overlay/compare 那样主要依赖外部喂入的独立序列

所以 restore 时更重要的是恢复：

- `length`
- `inputContextMode`
- requested context 参数

而不是保存一份已经算好的结果线。

## 验证

- `pnpm check`
- `pnpm test`

## 未覆盖项

- 普通 secondary series 还没有纳入 chart snapshot
- 更广的 indicator families 还没有统一的 study snapshot schema
- drawing entities、template versioning、workspace persistence 仍未建立
