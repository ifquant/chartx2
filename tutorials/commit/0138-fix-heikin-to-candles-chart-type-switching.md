# 0138: 修掉 `Heikin -> Candles` 切不回去的 chart-type bug

这次是一个很典型的“对象模型对了一半，判断条件却用错层级”的问题。

用户现象很直接：

- 点 `Heikin`
- 再点 `Candles`
- 图还是 `Heikin Ashi`

这不是“差异太小”，而是切换真的没有成功。

## 根因

`setChartType(type)` 里原来写的是：

- `if (current.kind === type) return`

问题在于：

- `current.kind` 是底层 `series kind`
- `type` 是主图 `chart type`

而在我们的模型里：

- `candlestick`
- `heikin-ashi`

这两个 chart type 最终都会落到同一个底层 `series kind`：

- `"candlestick"`

所以从 `Heikin Ashi` 切回 `Candles` 时：

- `current.kind` 已经是 `"candlestick"`
- `type` 也是 `"candlestick"` 语义对应的 tab

结果就被错误当成“已经是目标类型”，直接提前返回了。

## 正确判断应该看什么

应该看的是：

- `current.chartType`

而不是：

- `current.kind`

因为：

- `kind` 解决的是底层 renderer/series 族类
- `chartType` 才是用户实际切换的主图模式

这也再次说明一个很重要的建模原则：

- `chart type` 和 `series kind` 不是一回事

## 这次改动

只改了一行：

- `if (current.chartType === type) return`

这样：

- `Heikin Ashi -> Candles`
- `Hollow Candles -> Candles`
- 以及以后所有“共享底层 series kind，但 chart type 不同”的切换

都不会再被错误短路。

## 补的回归

新增了一条 workbench 契约：

- 先切到 `Heikin`
- 再切回 `Candles`
- 断言 readout 标签回到 `Candlestick 1`
- 并且不再保留 `Heikin Ashi 1`

这条测试锁住的是这类模型层 bug，不只是 UI 文案。

## 这次的教训

主图体系现在已经明确分成：

- `chartType`
- `builder`
- `renderer`
- `styleSchema`
- `series kind`

那么所有切换和判等逻辑都必须问清楚：

- 这次到底是在比较哪一层？

只要把 `chartType` 和 `series kind` 混用，就会出现这种“按钮亮了，但主图其实没换回去”的假切换问题。
