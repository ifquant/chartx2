## 这次提交做了什么

这次继续把 `multi-series per pane` 往可用状态推进了一步，不再只是“能把两条线挂在一个 pane 里”。

补齐的三件事是：

- `pane-aware readout`
- `in-pane legend`
- `per-series options`

也就是说，现在同一个 secondary pane 里的多条 series：

- 能在 readout 里区分出来
- 能在 pane 顶部 legend 里看到
- 不会再因为调用 `applyOptions()` 而互相串样式

## 为什么这一步很关键

如果没有这层，`multi-series per pane` 其实还是半成品。

因为用户虽然能把两条 series 挂进去，但会马上遇到三个问题：

1. 不知道当前看到的是哪条线
2. 不知道当前 crosshair 对应每条线的值
3. 改一条线的颜色，另一条线也跟着变

这三个问题都属于“结构已经打开，但使用体验还没跟上”的典型信号，所以这一步必须尽快补。

## 这次实现的切法

这次没有去发明完整 legend 系统，而是做了一个更克制的版本：

- readout detail 增加 `paneIndex` 和 `series[]`
- canvas 内每个 pane 顶部画最小 legend
- secondary series 状态里持有自己的 options 副本

这样实现后：

- host shell 可以直接消费 `chartx:readout`
- 同 pane 多条 series 的值和颜色都能被宿主知道
- renderer 也能按 series 自己的样式来画

## 新人知识点 1：为什么 per-series options 不能继续共用全局样式对象

在只有一条 series 的时候，全局样式对象很省事。

但一旦一个 pane 里允许两条 `line series` 同时存在，如果它们都引用同一个 `lineOptions`，那你改其中一条的颜色，另一条也会一起变。

这就说明：

`“系列的样式”属于 series 自己，不属于整个图表。`

所以进入 multi-series 阶段后，样式存储必须下沉到每条 series 的状态里。

## 新人知识点 2：为什么 legend 和 readout 要共享同一套 series 摘要思路

legend 和 readout 看起来是两个 UI，但本质上都在回答同一个问题：

`当前 pane 里有哪些 series，它们现在是什么值、什么颜色、什么身份。`

如果 legend 自己算一套、readout 自己算一套，很容易越写越分叉。

所以这次实现把它们都建立在统一的 series summary 上，这样以后要做更完整的 pane header、study inspector、hover tooltip 时，就不用再拆一套新的状态模型。
