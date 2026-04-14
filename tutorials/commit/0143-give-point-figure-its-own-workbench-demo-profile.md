# 0143: 不再让 OX 图复用普通 K 线样例

上一刀把 `P&F` 的默认 `box size` 调大了，但用户继续反馈：图还是不可读。

这说明问题不只是“默认值小了一点”，而是 workbench 还在把 `Point & Figure` 和普通 `Candles` 共用同一套高频振荡样例数据。对 K 线这还能看，但对 OX 图会直接导致：

- 列反转过于频繁
- 横向列数被打爆
- 最终变成一面 `X/O` 噪声墙

所以这次不再继续单独调一个数，而是把 `P&F` 的 demo profile 独立出来。

## 这次改了什么

### 1. 给 P&F 单独准备 workbench 样例数据

文件：

- `/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts`

新增：

- `createPointFigureWorkbenchBars(...)`

这套数据和普通 `createWorkbenchBars(...)` 不同，特征是：

- 更长的趋势段
- 更弱的短周期振荡
- 更适合 `Point & Figure` 这种按价格结构而不是按逐 bar 噪声来读图的主图类型

这不是引擎层“作弊”，而是 demo 层的正确做法：  
不同主图类型不一定应该共用同一份样例，如果共用样例会误导用户判断图型是否可用。

### 2. workbench 在 P&F 模式下切到专用 series profile

`mountWorkbenchDemo(...)` 里新增了 `workbenchSeries(chartType)` helper。

当主图类型是：

- `point-figure`

时，workbench 会改用专门的 `bars/volume/line` 组合；其余主图仍保持原来的样例数据。

这样改完之后，P&F 不再和普通 K 线共享一套过于嘈杂的输入。

### 3. 提高 P&F 默认 reversal

同时把 workbench 的：

- `pointFigureReversalBoxes`

从 `3` 提到 `5`。

这会让默认列切换更克制，不至于在 demo 中过度敏感。

## 为什么这比继续调 box size 更对

如果问题的根因是：

- 数据样例不适合这个图型

那继续把 `box size` 从 `360` 调到 `480`、`720`、`960`，只是不断拿参数去对冲错误的输入特征。

更稳的做法是：

1. 让 demo 输入先像这个图型该吃的数据
2. 再在这个基础上调默认 box/reversal

这样 workbench 才能真正回答一个问题：

`P&F 这个主图类型本身现在到底可不可用？`

## 这次没有做什么

这次仍然没有动：

- `buildPointFigureData(...)` 的核心列构造规则
- ATR / percentage / traditional 等 box size 模式
- 更专业的 P&F 参数面
- 通用“不同主图自动选择不同 demo dataset”的完整系统化配置

所以这次的定位仍然是：

- **先把 workbench 上的 P&F 从误导用户，改成基本可读**

而不是：

- **P&F 已经完全达到 TradingView 级别**

## 一个经验

“所有图型共用一套 demo 数据”听起来省事，但对非标准图往往是错的。

像：

- `Heikin Ashi`
- `Renko`
- `Kagi`
- `Point & Figure`

这类主图，demo 样例本身就是产品的一部分。  
如果样例没有帮助用户理解图型，用户会把 demo 的坏观感误判成引擎坏了。
