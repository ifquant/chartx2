# 0032: 把 secondary pane 从 `volume-only` 推进到基础 study series

这次提交继续沿着 pane lifecycle 往前走了一步。

之前的状态是：

- 可以新增/删除 pane
- 可以给 secondary pane 调高度
- 但是只有 `volume` 能真正挂到 secondary pane

这次把这个限制放宽成：

- 每个 secondary pane 仍然最多一个 series
- 但这个 series 不再只能是 `volume`
- 现在 `line / bar / histogram / volume` 都能挂到 secondary pane

## 这次做了什么

- 扩展 chart API，让：
  - `addLineSeries({ pane })`
  - `addBarSeries({ pane })`
  - `addHistogramSeries({ pane })`
  - `addVolumeSeries({ pane })`
  都能把 series 挂到 secondary pane
- 把内部 secondary pane 状态从单一 `volume` 专用状态推广成通用 secondary series state
- 保持“每个 pane 仅一个 series”的约束，避免提前引入 overlay complexity
- 增加 secondary line pane 的 public API 快照

## 为什么这样切

因为只有 `volume` 能上 secondary pane，说明 pane architecture 还没有真正完成泛化。

一旦 `line / bar / histogram` 这些基础 study series 也能上 secondary pane，后面的：

- RSI
- Stoch
- CCI
- 自定义 study

才有一条真实可复用的落点。

## 两个实现知识点

### 1. “每个 pane 一个 series” 仍然是很有价值的中间层

很多系统会在这一步急着做“一个 pane 放多个 series”。  
那当然最终要做，但不是这一步最该做的事情。

先把：

- pane lifecycle
- pane target routing
- pane-local scale/render state

跑通，收益更高。

### 2. secondary series 最好抽成统一状态，而不是继续给每种 series 单独开一套字段

如果每新增一种 secondary 系列，都再加：

- 一个 store
- 一个 priceScale
- 一组 data
- 一组 visuals

代码会很快失控。  
所以更好的做法是先引入统一的 secondary series state，再按 `kind` 分支渲染。

## 这次没有做什么

- 还没有一个 pane 里挂多个 series
- 还没有 `candlestick` 挂到 secondary pane
- 还没有 overlay series / compare series
- 还没有 pane reorder 或拖拽 resize
- 还没有 pane-local public scale API
