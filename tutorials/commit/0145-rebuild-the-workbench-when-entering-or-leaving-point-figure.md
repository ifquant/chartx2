# 0145: 切到 P&F 时必须真正重建 workbench

用户继续反馈：

- `P&F` 看起来还是不对

进一步检查后发现，这次已经不只是 builder 或 demo 参数的问题了，workbench 本身存在一个切换 bug：

## 根因

`mountWorkbenchDemo(...)` 虽然已经有了：

- `workbenchSeries(chartType)`

并且在 `rebuild()` 时能根据 `chartType` 选择：

- 普通 K 线样例
- `P&F` 专用样例

但是实际点击顶部 chart-type tab 时，`runAction(...)` 走的是：

- `chart.setChartType(...)`

而不是：

- `rebuild()`

这意味着：

- workbench 初始加载时用的是普通 `Candles` 数据
- 用户点击 `P&F` 后，只是把这份已经挂上的普通样例切成了 `point-figure`
- 并没有真正切到 `P&F` 专用 demo profile

所以用户看到的“还是不对”，至少有一部分是因为：

- **workbench 在切图型时，根本没换到正确的数据 profile**

## 这次改了什么

文件：

- `/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts`

### 1. 新增 chart-type 切换 helper

新增：

- `switchMainChartType(nextType)`

这个 helper 会先判断：

- 当前图型是不是 `point-figure`
- 目标图型是不是 `point-figure`

### 2. 进入或离开 P&F 时，强制 rebuild

现在只要：

- 从别的图切到 `point-figure`
- 或者从 `point-figure` 切回别的图

就会直接：

- `rebuild()`

而不是只做 `setChartType(...)`

这样才会真正切换：

- `bars`
- `volume`
- `line`
- 以及基于这组数据生成的默认 drawing 锚点

## 为什么这一步必须先做

如果 workbench 在切到 `P&F` 时还没换到对的输入数据，那继续讨论：

- `buildPointFigureData(...)` 对不对
- 列构造逻辑对不对
- box size / reversal 是不是要调

都会混进错误前提。

也就是说，这一步修的是：

- **先保证 workbench 至少真的在展示它宣称正在展示的那个图型输入 profile**

## 这次没有做什么

这次仍然没有动：

- `buildPointFigureData(...)`
- `createDirectionColumnPriceBasedChartBarSequence(...)`
- `Point Figure` renderer

所以如果在这一步之后，`P&F` 仍然不可读，下一步就应该直接进入：

- **builder / column construction 层**

而不是再继续纠缠 workbench 切换流程。

## 一个经验

当 demo 开始按 chart type 分 profile 时，  
`setChartType(...)` 和 `rebuild()` 就不再是等价操作。

前者只切图型模式，后者才会重新选择整套输入数据。  
一旦某个图型依赖自己的 demo profile，切换时就必须显式考虑是否需要重建。
