# 0021: 补上最小 line series 闭环

这次提交把 `chartx2` 的 phase-one floor 从“只有 candlestick”推进到了“candlestick + line”。

核心变化：

- 在内部渲染层新增 `line-renderer`，让 phase-one chart 可以绘制最小折线序列。
- 在公共 API 上新增 `addLineSeries()`，保持仍然只允许单图单序列，但不再把基础 series 限死为 K 线。
- 新增 line series 的浏览器视觉基线，避免这条新路径只存在于代码里却没有回归保护。
- 更新 phase-one checklist，把支持的 series 范围改成 `candlestick + line`。

为什么这一步值得现在做：

- 只支持一种 series 时，engine 很容易偷偷长成“专为 K 线硬编码”的结构。
- 多一条最小 line 路径，可以更早验证当前 model、scale、render、public API 的边界是不是泛化得住。

这一步刻意没有做的事：

- 没有补 `bar / area / baseline` 等其它 series。
- 没有引入多序列叠加；phase one 仍然坚持单图单序列。

补充知识：

1. 很多图表系统里的 `line series` 并不一定要单独维护一整套数据存储结构。只要内部统一成“时间 + 数值数组”的 plot row 形式，就可以在渲染层决定画蜡烛、线还是柱。
2. 当你给新渲染路径补 visual baseline 时，优先补“public API 场景”而不是直接测内部类。这样更能锁住真实对外行为，而不是只锁住实现细节。
