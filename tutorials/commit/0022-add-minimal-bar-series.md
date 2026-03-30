# 0022: 补上最小 bar series 闭环

这次提交继续扩充 `chartx2` 的 phase-one floor，把基础 series 从 `candlestick + line` 推进到 `candlestick + bar + line`。

核心变化：

- 新增 `bar-renderer`，用最小 OHLC 柱形绘制路径补上 bar series。
- 在公共 API 上新增 `addBarSeries()`，继续保持单图单序列约束，不引入多序列叠加。
- 补上一张 public API 的 bar series 浏览器基线，确保这条对外路径也被视觉回归锁住。
- 更新 phase-one checklist 和页面说明，让当前 parity floor 与实际实现保持一致。

为什么这一步放在现在：

- `bar series` 和 candlestick 一样都基于 OHLC 数据，比继续打磨单一 K 线细节更能验证当前 model 和 renderer 的通用性。
- 在 phase-one 里先把几种基础 series 面补齐，后面再进入更宽的选项面和更深的交互，节奏更稳。

这一步刻意没有做的事：

- 没有引入 area、baseline 或 custom series。
- 没有改变单图单序列限制，也没有做多序列图例或图层管理。

补充知识：

1. `bar series` 和 `candlestick series` 的一个常见复用点，是它们都可以共享同一份 OHLC 数据模型。区别主要发生在渲染层，而不是存储层。
2. 当不同 series 共享同一套 time/price scale 时，越早验证第二第三种 series，越能及时发现 API 和 renderer 是否被第一种 series 的假设绑死。
