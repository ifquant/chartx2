# 0026: 补上最小 applyOptions 和 scale handles

这次提交继续沿 chart-level API breadth 往前推，但仍然保持很窄。

核心变化：

- 给 `PhaseOneChartApi` 增加了最小 `applyOptions()`，目前只开放 chart 背景、pane 背景和 grid 颜色。
- 给 `chartx2` 增加了最小 `timeScale()` / `priceScale()` handles。
- `timeScale()` 目前支持读取可见 logical range，以及设置 `barSpacing` / `rightOffset`。
- `priceScale()` 目前支持读取当前可见 price range。
- 新增浏览器测试，把 options 应用和 scale handle 的基本可用性锁进 public API 层。

为什么这一步放在现在：

- 只有 `resize/removeSeries/subscribeCrosshairMove` 还不够，chart 对外还是太“不可配置”。
- `applyOptions + scale handles` 是从“受控图表对象”往“可复用图库 API”迈出的下一步。

这一步刻意没有做的事：

- 没有直接追完整 chart / series option surface
- 没有补 public `setVisibleLogicalRange` 之类更宽的 scale API
- 没有补 `subscribeClick()` 或 chart screenshot/export 能力

补充知识：

1. 图表库的 `applyOptions()` 很容易失控，因为你一旦把所有内部常量都暴露出去，后面每一项都要背兼容语义。早期更稳的方式是先公开少量高价值选项。
2. `timeScale()` / `priceScale()` handles 的一个重要意义，是把“内部状态可读”变成“公共接口可读”。这通常比先补更多绘图样式更能提升库的可用性。
