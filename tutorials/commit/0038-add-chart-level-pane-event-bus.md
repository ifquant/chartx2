# 0038: 给 chart API 补上 pane event bus

这次提交把 pane 的可观察性又往前推了一步：不再要求外部代码先拿到某个 pane handle 才能监听变化，而是让 chart API 直接发出 pane 级事件。

## 为什么值得现在做

前一轮已经有了每个 pane 自己的 `subscribeResize()`，但这还不够：

- pane 新增和移除不在这条订阅里
- host 层如果想统一管理 pane 状态，还得自己保存每个 pane handle
- 这会让 pane system 的事件模型太分散

所以这次先补一个最小的 chart-level bus，把 pane lifecycle 和 resize 都汇总到 chart 这一层。

## 这次做了什么

1. 给 `PhaseOneChartApi` 增加：
   - `subscribePaneEvents()`
   - `unsubscribePaneEvents()`
2. event bus 现在覆盖的类型有：
   - `added`
   - `options`
   - `resized`
   - `removed`
3. 增加 API 回归，验证 chart 层能收到 pane add/remove/resize/options 事件，并且取消订阅后不会继续收到。

## 给新人的两个提示

1. per-object callback 和 chart-level event bus 不是互斥关系。前者更贴近对象本身，后者更适合 host 层做统一状态管理。
2. 事件总线第一版最怕“一开始就太大”。先把最核心的事件类型做实，比先设计一套巨大的全局事件系统更可靠。
