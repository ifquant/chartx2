# 0137: 让 workbench 里的 Heikin Ashi 不再看起来像普通 Candles

这次不是修一个底层 builder bug，而是修一个很典型的“功能存在，但样例把它藏掉了”的可用性问题。

用户看到的是：

- `Candles`
- `Heikin`

两个 tab 来回切，图几乎没变化。

这会直接让人怀疑：

- chart type 根本没切成功
- 或者 `Heikin Ashi` 还没真正实现

但实际检查下来，结论不是这个。

## 先判断到底是哪一层的问题

先核对了主图切换链路：

- `chart.setChartType("heikin-ashi")`
- `attachPrimarySeries(...)`
- `applyMainSeriesBuilderData(...)`
- `buildHeikinAshiData(...)`

这条链路是通的。  
也就是说：

- `Heikin Ashi` 不是假按钮
- builder 也确实在产出 synthetic OHLC

真正的问题出在 workbench 的默认样例数据太平滑：

- 连续趋势段太长
- open/close 的节奏太规整
- `Heikin Ashi` 虽然已经在平滑，但视觉上还是和普通 candles 很像

所以用户感知到的是“没有切换”。

## 这次做了什么

### 1. 单独给 workbench 换一套更适合辨认 chart type 的主图数据

没有去改所有 feature tabs 共用的 `createBars(...)`。  
而是新增了：

- `createWorkbenchBars(...)`

只让 workbench 用更有：

- gap
- open noise
- body variation
- wick variation

的主图样例。

这样改的好处是：

- workbench 里的主图类型更容易分辨
- 其他 feature tabs 不会被一起打散

## 2. 主图切换后，主序列标签也跟着变

之前主图从 `Candles` 切到 `Heikin Ashi` 后，图例标签仍然可能保留成：

- `Candlestick 1`

这会进一步加强“其实没切换”的错觉。

现在主序列 label 在主图切换时会按目标 chart type 重新生成，所以切到：

- `Heikin Ashi`

后，readout / legend 也会同步显示：

- `Heikin Ashi 1`

## 3. 补了一条专门的 workbench 契约

新增浏览器测试会验证两件事：

- `Candles -> Heikin` 切换后，主序列标签确实变成 `Heikin Ashi 1`
- chart frame 截图 buffer 不再和切换前完全一样

这条测试的意义不是证明 `Heikin Ashi` 数学公式对不对，而是锁住一个更产品化的问题：

- “用户在 demo 里真的能看出 chart type 切换了”

## 为什么这一步值钱

因为它解决的是主图“基本可用性”问题。

对于图表软件来说，很多 bug 不是：

- 算法没实现

而是：

- 功能已经实现，但默认演示让人看不出来

这类问题如果不主动修，会让用户对整个引擎成熟度产生错误判断。

## 这次没做什么

- 没有重写 `Heikin Ashi` builder，本次不是底层公式修复
- 也还没有系统性补每一种主图类型的“更适合辨认差异”的 demo 数据
- 其他主图类型的 label/readout 语义虽然跟着改善了，但还没有逐个做专门可用性审计

所以这一步是：

- 先把 `Heikin Ashi` 这个最明显的主图可用性问题修到用户一眼能看出来

而不是一次性完成所有主图类型的 demo polish。
