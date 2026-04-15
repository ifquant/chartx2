## 为什么做这一刀

前面把主图类型数目对到了 TradingView/Advanced Charts 的口径，但 `Columns` 和 `HLC Area` 仍然停在“底层 renderer 预留”阶段：

- `Columns` 只有 renderer，没有真正的 chart type
- `HLC Area` 连 renderer 逻辑都还是空的

这会带来两个问题：

1. registry / snapshot / workbench / API 测试口径不一致
2. 用户侧看起来像“还差 2 种主图”，但代码里又已经有一半名字

所以这刀的目标很明确：把这两种类型从“占位能力”补成“真实主图类型”。

## 这次改了什么

### 1. 把 `Columns` 接成真正 chart type

在 `main-series-chart-types.ts` 里新增了：

- `columns`
- `columnsStyle`

并且明确它：

- `inputCapability = "ohlcv"`
- `builder = "time-bars"`
- `renderer = "columns"`

这里故意没有让它继续复用旧的 histogram main-chart 语义，而是让它吃原始 OHLCV 主图输入。这样它和 TradingView 的 `Columns` 更一致，也不会被 line-only 输入限制住。

### 2. 补了 `HLC Area` 的 renderer

`hlc-area` 之前只是一个空函数。现在它会：

- 从每根 bar 取 `(high + low + close) / 3`
- 用这个值生成 area points
- 继续复用现有 `AreaRenderer`

也就是说，这不是单纯把普通 `area` 换个名字，而是让它真的基于 HLC 数据画。

### 3. 让 workbench 能真的切到这两个主图

workbench 现在新增了：

- `Columns`
- `HLC Area`

两颗主图按钮，并且在 rebuild 路径里：

- `Columns` 用 `addCandlestickSeries().setData(bars)` 后再 `setChartType("columns")`
- `HLC Area` 用 `addCandlestickSeries().setData(bars)` 后再 `setChartType("hlc-area")`

这里的关键点是：两者都继续吃原始 K 线输入，而不是偷懒走 line data。

### 4. 补齐 registry / schema / unit / API 契约

除了 workbench 入口之外，还同步补了：

- chart type registry
- style schema registry
- renderer registry 覆盖
- unit 测试
- 两条新的 public API visual 契约

这样这两种主图以后不再是“demo 能点，但引擎没有正式承认”的状态。

## 这刀之后的状态

如果按我们一直对齐的主图 breadth 口径看：

- `Columns` 已补上
- `HLC Area` 已补上

所以当前 `chartx2` 的主图类型 breadth，已经基本对齐之前整理的那一批 TradingView/Advanced Charts 常见主图集合。

## 还没收的部分

这刀解决的是“类型存在性”和“主图可切换性”，不是更深层的 parity：

- `HLC Area` 目前采用的是 `(H + L + C) / 3` 的 area 语义，和 TradingView 的完全一致性还没有专门做 parity 校验
- `Columns` 现在是新的主图类型，但旧的 `histogram` chart type 仍然保留着，两者的长期产品命名关系还没完全收口
- workbench 只补了主图切换，没有额外加这两类的专属控制面，因为它们当前不需要像 `P&F / Kagi / Renko` 那样的 type-specific builder 参数
