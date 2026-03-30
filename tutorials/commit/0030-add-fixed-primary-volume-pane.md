# 0030: 增加固定的主图 + volume 双 pane 架构

这次提交的目标不是把 `chartx2` 一次做成完整的 pane 系统，而是先跨过最重要的结构门槛：

从“单 pane 图表”进入“真正的主图 + volume 双 pane 图表”。

也就是说，现在 chart engine 内部已经不是只有一个 `store + priceScale + renderer` 组合了，而是：

- 主图 pane
- volume pane
- 共享时间轴
- 各自独立的 price scale

这一步是后面做指标 pane、pane resize、pane lifecycle 的前置条件。

## 这次做了什么

- 把 `chart-harness` 的内部状态从单系列改成：
  - 一个 primary series 槽位
  - 一个 volume series 槽位
- 主图和 volume 分别维护自己的：
  - 数据
  - store
  - price scale
- 渲染时按 pane 分开绘制，而不是把 volume 伪装成主图底部的一条带
- 默认 browser harness 改成 `candlestick + volume pane`
- public API 增加了一个明确的双 pane 场景快照

## 为什么这样切

因为“把成交量画在主图底部”虽然能看，但还不算 pane architecture。

真正的 pane 结构至少要有：

1. 共享横轴
2. 独立纵轴
3. 分开的可见区域
4. 后续能继续扩成更多 pane

如果没有这一步，后面的 RSI / MACD / Stoch RSI 都只能继续在单 pane 上打补丁。

## 两个实现知识点

### 1. 先做固定双 pane，比一开始做通用 pane 管理更稳

工程上最容易犯的错，是在第一次进入多 pane 时就急着做：

- 动态 pane 列表
- pane 增删
- pane resize
- pane reordering

这样会把“验证结构是否成立”和“做完整系统”混在一起。

这次先固定成 `primary + volume`，是更稳的切法。  
一旦这套共享时间轴 + 独立纵轴跑通，再泛化会容易很多。

### 2. 多 pane 的关键不是多画几块背景，而是状态必须拆开

如果还是只保留一个 `priceScale` 和一个 `store`，视觉上切成两块 pane 也还是假的。

真正的 pane 架构，至少要让每个 pane 有自己的：

- 数据解释
- 价格范围
- 坐标映射

这次的重心就在这里。

## 这次没有做什么

- 还没有通用 `addPane()` / `removePane()`
- 还没有 pane 高度拖拽调整
- 还没有多指标 pane
- 还没有 pane 级 public API
- crosshair readout 仍然以主图 OHLC 为主，不是完整的 pane-aware readout 系统
