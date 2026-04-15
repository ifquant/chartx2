## 为什么做这一刀

主图 breadth 这条线已经基本补齐，再继续加能力的收益很低。  
这时更值钱的是做一轮收尾验收，确认现有主图在三个方面没有明显倒退：

1. 主图 correctness
2. readout / axis / workbench 展示稳定性
3. synthetic-study 路径在非时间主图上的契约稳定性

## 这次实际上做了什么

### 1. 跑了一轮针对性验收

这次没有再扩新功能，而是集中回归：

- unit tests
- phase-one API visual contracts
- workbench visual contracts

重点覆盖：

- `Heikin`
- `Line Break`
- `Renko`
- `Kagi`
- `Point Figure`
- `Columns`
- `HLC Area`

以及它们相关的 requested-context / secondary-pane / snapping 契约。

### 2. 修了 workbench drawing inspector 的测试稳定性

之前那条 inspector 测试是“在整张图上扫点找可选中的 drawing”。

这类测试的问题很明显：

- 默认 drawing 锚点一变，命中位置就漂
- 主图 viewport 一变，测试就开始超时

所以这次把它改成了确定性路径：

- 先用左侧工具创建一条 `horizontal-line`
- 再创建一条 `trend-line`
- 然后直接在 inspector 里做字段验证和 cross-field validation 检查

这样它测试的是“真实用户路径”，但不再依赖默认 drawing 正好落在哪。

### 3. 更新了两张 workbench 基线

这轮验收里，只有两张基线发生了小漂移：

- 默认 workbench 基线
- `Point Figure` 可读性基线

在确认不是功能退化之后，直接刷新成了当前正确状态。

## 这刀的意义

这刀不是“加了什么新能力”，而是确认：

- 当前主图族已经能以更稳定的方式被验收
- workbench inspector 不再靠脆弱扫点测试维持
- 非时间主图这条线至少在现有契约上是稳定的

## 这刀没做什么

- 没有新增主图类型
- 没有继续扩 drawing 功能
- 没有继续深入 template / persistence
- 没有新增更深的 TradingView parity 公式

也就是说，这是一刀真正的“收尾验收”，不是又绕回功能扩张。
