# 0037: 给 pane handle 补上 resize 订阅

这次提交把 `pane resize` 从“可配置、可拖拽”继续推进成“可观察”。

## 为什么这一步重要

如果 pane 高度会变，但 host 层和外部调用者拿不到通知，那很多后续能力都不好接，比如：

- 自定义 pane header
- 持久化 pane 高度
- resize 后同步其它布局信息

这时 pane resize 还只是一个内部实现行为，不算完整的公开 contract。

## 这次做了什么

1. 给 `PhaseOnePaneApi` 增加：
   - `subscribeResize()`
   - `unsubscribeResize()`
2. 让两条路径都会发出 resize 事件：
   - `setHeight()` / `applyOptions({ height })`
   - divider 拖拽调高
3. 增加 API 回归，验证：
   - 订阅后能收到事件
   - 取消订阅后不再继续收到

## 两个新人提示

1. 一个状态变化如果既能由 API 触发，也能由交互触发，最稳的做法通常是把两条路径都汇总到同一条事件语义上。
2. 订阅 API 的最小可用版本不一定要一开始就设计成全局 event bus。先把单对象、单事件做清楚，往往更稳。
