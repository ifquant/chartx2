# 0104: 把主序列 renderer 分发移入统一 registry

本次提交把 `chart-harness.ts` 里那段很长的主序列渲染 `if/else` 分支收掉，改成统一走 renderers 层的 registry。

## 这次改动做了什么

1. 新增 `src/lib/chartx/internal/renderers/main-series-renderer-registry.ts`
   - 这里集中维护 `renderer id -> draw executor`
   - 当前主图 renderer 包括 `line`、`area`、`baseline`、`bars`、`candles`、`point-figure`、`columns` 等，都统一从这里调度

2. `chart-harness.ts` 不再自己决定每种 renderer 怎么画
   - harness 现在只负责准备运行时依赖：
     - `timeToX`
     - `priceToY`
     - 当前 rows / options / visuals
     - 各个具体 renderer 实例
   - 然后把这些参数交给 `drawMainSeriesRenderer()`

3. 补了一条最小 unit test
   - 用来锁定“renderer lookup 已经通过统一 registry 暴露”，避免后面又把分支塞回 harness

## 为什么这一步重要

之前我们已经做了：

- `ChartTypeSpec registry`
- `MainSeriesStyleSchema registry`
- `builder registry`

但 renderer 执行还留在 harness 里，所以“主序列 = chart type + builder + renderer + style schema”这条链路只收了一半。

这次改完之后，主图运行时边界更清楚了：

```text
main chart type
-> spec
-> builder registry
-> renderer registry
-> concrete renderer
```

这样后面继续做两件事会更顺：

- 给 `Kagi / Point & Figure / Renko` 补更真实的专用 renderer 语义
- 把 style schema / template / persistence 接到主序列运行时上

## 一个实现细节

`volume-candles` 之前依赖的 `buildVolumeWidthScale()` 也一起从 harness 挪走了。

这个细节的意义是：

- 它不是 chart 级业务规则
- 它属于某个 renderer family 的局部绘制准备逻辑

放回 renderer registry 旁边之后，职责会更干净。

## 这一步还没做什么

- 还没有把所有 renderer 的样式变换抽成完整的 schema-aware transform
- `hlc-area` 这种更窄的 renderer 仍然只是占位
- renderer registry 目前主要覆盖主序列，不代表整个 study/drawing 渲染系统已经完全统一
