# 0027: 补上 click 订阅和更宽的 option surface

这次提交继续沿 `lightweight-charts` 的 API gap 往前推，但仍然坚持小步。

核心变化：

- 给 chart public API 增加了 `subscribeClick()` / `unsubscribeClick()`。
- 扩宽了 chart `applyOptions()`，现在除了背景和 grid，还能调整 frame、axis label 和 crosshair 颜色。
- 给三种基础 series 都加了最小 `applyOptions()`：
  - candlestick: `up/down/wick`
  - bar: `up/down`
  - line: `color/lineWidth`
- 补了浏览器级 public API 测试，锁住 click 订阅和 series-level options 的可用性。

为什么这一步现在最值：

- 只有 chart object 能控制自己还不够，图表库真正开始“像库”的时刻，是 chart 和 series 都能通过 public API 被配置。
- `subscribeClick()` 也补上之后，最基础的指针事件对外能力已经比之前完整不少。

这一步刻意没有做的事：

- 没有补更复杂的 option tree
- 没有补 markers、price lines、histogram、pane architecture
- scale handles 也还只是最小子集

补充知识：

1. 图表库的 option surface 最好优先开放“高频、低歧义”的项，例如颜色、线宽、bar spacing。这些值语义清晰，测试成本也低。
2. `click` 和 `crosshairMove` 都是指针事件，但用途不同。前者更适合触发交互动作，后者更适合驱动 header、tooltip、legend 等持续更新的 UI。
