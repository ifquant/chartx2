# 0024: 写出 lightweight-charts 差距清单

这次提交没有改实现，而是把一轮口头审计固定成了文档。

核心变化：

- 新增 `docs/lightweight-charts-gap-checklist.md`
- 把当前 `chartx2` 与 `lightweight-charts` 的差距按四类拆开：
  - `Done`
  - `Done But Simplified`
  - `Phase-Two Must Close`
  - `Deferred Beyond Lightweight-Charts`
- 给出下一轮最合理的执行顺序，避免后面又回到“边做边想”的状态

为什么这一步有价值：

- phase one 完成之后，最容易出现的问题不是“没方向”，而是“方向太多”。
- 这份文档的作用，就是把“还差哪些是库级差距，哪些已经是 TradingView 工作台差距”分开。

这一步刻意没有做的事：

- 没有开始实现 chart-level API breadth
- 没有开始做 histogram / area / baseline / pane architecture

补充知识：

1. 做 gap audit 时，最好把“功能存在”与“功能已经可配置、可复用、可公开调用”分开。很多项目会误把“内部能画出来”当成“已经接近兼容”。
2. 对图表引擎来说，真正拉开差距的常常不是第一根 K 线，而是 API breadth、scale behavior 和 annotations 这三层。
