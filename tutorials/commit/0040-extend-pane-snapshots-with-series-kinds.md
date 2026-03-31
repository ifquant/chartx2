# 0040: 让 pane snapshot 直接描述 series kinds

这次提交没有继续扩大 pane event bus 的事件种类，而是把同一条事件里的 snapshot 变得更有用。

## 为什么要补这一步

如果 pane snapshot 只有：

- 高度
- 是否主 pane
- 是否可调整
- 是否有 series

那 host 层还是不知道这个 pane 里到底是什么：

- 主图 candlestick
- volume
- line study
- histogram study

于是外部还要再自己猜或者再查一次 chart 状态。既然 pane event 已经在发 snapshot，就应该直接把这层最关键的信息带出来。

## 这次做了什么

1. 给 `PhaseOnePaneState` 增加：
   - `seriesCount`
   - `seriesKinds`
2. 主 pane 会根据当前 primary series 填这两个字段
3. secondary pane 会根据当前挂载的 secondary series 填这两个字段
4. 对应的 chart-level pane event regression 也补了断言，确保 snapshot 里真的带出了 `candlestick` 和 `volume` 这样的类型信息

## 给新人的两个提示

1. 一个 snapshot 如果不够“可直接消费”，host 层最后还是会被迫自己拼状态，那 snapshot 的价值就会打折。
2. `seriesKinds` 这种字段看起来像小事，但它是以后做 pane header、study legend、layout persistence 的基础数据。
