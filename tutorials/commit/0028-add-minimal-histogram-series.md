# 0028: 补上最小 histogram series

这次提交把 `chartx2` 的基础 series 面又往前推了一步，加入了 `histogram series`。

核心变化：

- 新增 `histogram-renderer`
- 在 public chart API 上新增 `addHistogramSeries()`
- 复用现有 time/value store，把 histogram 作为单值序列接入，而不是重新发明一套独立模型
- 补上一张 histogram 的 public API 浏览器基线

为什么这一步现在最值：

- `histogram` 本身就是 `lightweight-charts` 的核心 series 之一
- 它同时又是以后做 `volume pane` 最自然的桥梁，所以这一步既补 series coverage，也给 phase-two 铺路

这一步刻意没有做的事：

- 没有开始多 pane
- 没有开始 volume pane layout
- 没有补 area / baseline

补充知识：

1. `histogram series` 很适合先复用现有 time/value 数据存储，因为它的关键区别主要发生在渲染方式，而不是时间轴或可见区间的数学。
2. 对后续 `volume pane` 来说，先把 histogram 作为独立 series 做稳，比一开始就把“成交量面板”当成特殊逻辑更干净。
