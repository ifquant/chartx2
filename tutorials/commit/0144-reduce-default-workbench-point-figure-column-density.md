# 0144: 继续降低 workbench 默认 OX 图的列密度

在 `0143` 里，我们已经把 `Point & Figure` 从普通 K 线样例中拆出来，给它单独的 workbench demo profile。

但用户继续反馈：  
默认 `P&F` 视图里，列还是太多，虽然比之前好一点，但仍然不够可读。

这说明问题不只是“样例 profile 对不对”，还包括：

- 默认喂给 P&F 的 bar 数量还是太多
- 趋势腿还不够明确
- 局部抖动还会继续制造过多反转列

所以这次继续收紧 workbench 层，不碰 engine builder。

## 这次改了什么

文件：

- `/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts`

### 1. 进一步减少 P&F 默认样例 bar 数

原来：

- `createPointFigureWorkbenchBars(220)`

现在改成：

- `createPointFigureWorkbenchBars(96)`

这一步很直接：  
workbench 默认视口里，不应该一次塞进那么多 `P&F` 列。  
列太多时，哪怕单列语义是对的，用户也只会看到一整面字符噪声。

### 2. 把 P&F 样例改成更明确的趋势段

原来的 `createPointFigureWorkbenchBars(...)` 还是偏连续波动函数，虽然比普通 K 线样例强一些，但趋势腿不够清楚。

现在改成：

- 用固定 drift 段数组控制方向
- 每 12 根切一次 regime
- 明显减弱 `openGap`
- 明显减弱 body 内的高频摆动
- 同时收窄上下影线

结果是：

- 趋势段更长
- 列切换更少
- 默认 `P&F` 看起来更像“价格结构图”，而不是“很多个来回震荡的小字符”

## 为什么这次还没动 builder

因为这次的问题仍然主要发生在：

- workbench 默认体验层

而不是：

- API 层 P&F 是否能构造出 X/O

在用户还没有先看到一个基本可读的默认 OX 图之前，直接下沉去改 builder，反馈周期太慢，也很难确认“是 builder 有问题，还是 demo 仍然在误导人”。

所以这次仍然先把：

- 默认 bars 数量
- 趋势段形状
- workbench 可读性

收紧到更合理的范围。

## 这次没有做什么

这次仍然没有动：

- `buildPointFigureData(...)`
- `createDirectionColumnPriceBasedChartBarSequence(...)`
- P&F 的 renderer 布局规则
- ATR / percentage / traditional box-size modes

也就是说，如果用户在这一刀之后仍然觉得 `P&F` 不对，下一步就该明确进入：

- **builder / column construction 层**

而不是继续只调 demo。

## 一个经验

像 `P&F` 这种非标准图，workbench 默认视图的“柱数预算”本身就是产品体验约束。

不是所有图都适合把同样多的数据一次塞进视口。  
普通 K 线能承受的 bars 数量，对 OX 图未必可读。
