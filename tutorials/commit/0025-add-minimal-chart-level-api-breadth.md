# 0025: 补上最小 chart-level API breadth

这次提交开始补 `chartx2` 和 `lightweight-charts` 之间最明显的一块库级差距，也就是 chart-level API breadth。

核心变化：

- 给 `PhaseOneChartApi` 增加了最小的 `resize()`、`removeSeries()`、`subscribeCrosshairMove()`、`unsubscribeCrosshairMove()`。
- 让 series 在被 `removeSeries()` 之后会显式失效，而不是继续偷偷改 chart 状态。
- 补了浏览器级 public API 测试，锁住 resize、生效中的 crosshair 订阅、以及 remove 之后的显式失败语义。

为什么这一步现在最值：

- phase one 已经证明“能画图”，接下来最重要的是证明这个引擎开始像一个真正可调用的图库，而不是只能被 demo 页面控制。
- `resize/removeSeries/subscribeCrosshairMove` 是最小但最关键的一批 chart-level API，能直接拉开“演示 harness”和“可复用图表引擎”的差距。

这一步刻意没有做的事：

- 没有直接追完整 `IChartApi`
- 还没有补 `applyOptions()`、`timeScale()`、`priceScale()`、`subscribeClick()`
- 也还没有引入更宽的 chart 或 series options surface

补充知识：

1. 图表库里的 `removeSeries()` 如果只把图上内容清掉、却不让旧 series handle 失效，后面会出现非常隐蔽的状态污染问题。显式报错通常比静默 no-op 更好排查。
2. `subscribeCrosshairMove()` 这类 API 的价值不只是拿坐标，而是把引擎内部状态通过稳定公共接口暴露出来，后面 header、legend、tooltip、marker UI 都会依赖它。
