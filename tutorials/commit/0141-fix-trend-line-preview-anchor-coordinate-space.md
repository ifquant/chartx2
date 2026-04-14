# 0141: 修正趋势线创建预览的起点坐标系

这次修的是一个很典型的“最终对象是对的，但中间预览是错的”的问题。

用户反馈是：

- 点趋势线工具开始画线以后
- 最终创建出来的红色线段位置是对的
- 但创建过程里的蓝色预览线，起点明显偏了

## 根因

workbench 的趋势线 ghost preview 起点，之前直接用了 chart click event 里的 `event.point`。

问题在于，这个 `point` 不是 overlay 需要的整 canvas 坐标，而是 **chart plot 区内部坐标**：

- 它已经扣掉了 chart layout 的 `left`
- 也已经扣掉了 chart layout 的 `top`

而 workbench 的 SVG preview overlay 是直接铺在整个 `.chart-frame` 上的，所以它要的其实是：

- frame / canvas 层坐标

结果就是：

- 最终正式 drawing：走的是时间/价格坐标转换，所以是对的
- 中间 ghost preview：走的是错坐标系，所以起点向左上偏了一截

## 这次怎么修

没有去改引擎。

这次只在 workbench demo 层，把保存趋势线第一击锚点时的 preview point 从：

- `event.point`

改成：

- `event.point + canvas inset`

也就是把 plot-local 坐标重新平移回 frame/canvas 坐标。

当前补上的偏移是：

- `left: 18`
- `top: 28`

它对应的是 phase-one chart 当前的默认 layout inset。

## 为什么这次先这样修

因为这次的问题不是 drawing 几何错了，而是 preview overlay 和引擎 click event 用了两套坐标系。

在这种情况下，最小正确修法不是重写 engine，而是先把 demo 层的 preview 锚点拉回同一坐标系。

也就是说，这次修的是：

- workbench preview correctness

不是：

- chart engine drawing geometry

## 后面还可以怎么继续收

这次的修法虽然正确，但还带着一个明确的耦合点：  
workbench 现在知道了 phase-one chart 默认 layout 的 inset。

更长期的版本，可以考虑把这件事做得更干净：

1. 让 click event 直接暴露 canvas-space point
2. 或者给 demo/workbench 一个显式 layout metrics API

那样 UI 层就不需要自己记 `18 / 28` 这种 inset 常量。

## 这次验证了什么

- `pnpm check`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench drawing tools show a preview and let escape cancel an unfinished trend-line|workbench toolbar can create horizontal-line and trend-line drawings"`

## 一个给初学者的实现提醒

很多“预览错位、命中偏移、拖拽起点不对”的问题，真正的根因都不是绘制函数本身，而是：

- 你在用哪一层的坐标
- 这个坐标是不是已经扣过 padding / inset / axis 区域

同一个点，放在不同坐标系里，看起来会像“差几十个像素的神秘 bug”。  
这类问题第一步不是调样式，而是先把坐标系名字说清楚。
