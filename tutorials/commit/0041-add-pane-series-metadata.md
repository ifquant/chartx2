# 0041: 给 pane snapshot 补上 series 元数据

这次提交继续沿 pane snapshot 往前推，但没有直接跳进 `multi-series per pane`。我先把当前这套单 series pane 模型里最值得暴露的信息补齐了。

## 为什么要补这一步

上一轮 snapshot 已经能告诉 host：

- pane 高度
- 是否主 pane
- 是否可调整
- series kinds

但这还不够“可直接消费”。比如 host 想画 pane header、study legend，或者只是想知道这个 pane 当前有没有数据，就还得再回查 chart 内部状态。

所以这次直接把当前可稳定提供的 series 元数据补进 snapshot：

- `kind`
- `pointCount`

## 这次做了什么

1. 新增 `PhaseOnePaneSeriesState`
2. 给 `PhaseOnePaneState` 增加 `series`
3. 主 pane 和 secondary pane 都会把当前挂载 series 的 `kind/pointCount` 填进去
4. 对应的 chart-level pane event regression 也补了断言，确保 `candlestick` 和 `volume` 的数据量能直接从 snapshot 里读出来

## 给新人的两个提示

1. 做 snapshot 设计时，最好优先加“当前就稳定、当前就有用”的字段，而不是为未来想象一大堆暂时拿不准的元数据。
2. `pointCount` 这种字段很朴素，但对调试和 UI 展示非常有价值，因为它能直接回答“这个 pane 里现在到底有没有数据”。 
