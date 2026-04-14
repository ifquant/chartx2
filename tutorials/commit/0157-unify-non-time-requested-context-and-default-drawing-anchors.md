# 0157: 统一非时间主图下的 requested-context 与默认 drawings 锚点

本次切片不是继续调 workbench 外观，而是把两条还留在“半统一”状态的路径收进同一套非时间主图语义里：

1. `requested-context + merge`
2. workbench 默认 `horizontal-line / trend-line` drawings

之前的问题分成两类：

- `Line Break / Point Figure` 的 lower panes 虽然已经回到 chart-engine 的 `chart-context` secondary path，但 `requested-context` 的 `compare / moving-average` 还没有在非时间主图上被 API 契约直接锁住。
- workbench 的默认 drawings 仍然拿 raw `bars.at(-52)` / `bars.at(-18)` 这类时间图锚点去画线，所以即使主图已经切成 `Line Break / Renko / Kagi / P&F`，默认线的起止点语义也还是原始 K 线，不是当前主图 rows。

## 这次怎么改

### 1. 默认 drawings 改成按当前主图 rows 取锚点

在 `chartx-demo.ts` 里新增了两层 helper：

- `resolveMainDrawingRows(...)`
- `resolveDefaultDrawingAnchors(...)`

第一层负责决定“当前主图到底该用哪组 rows 做 drawing 锚点”：

- `Candles / Heikin / Hollow / Vol Candles / Bars` 继续用原始 `bars`
- `Line Break` 用 `buildLineBreakData(...)`
- `Point Figure` 用 `buildPointFigureData(...)`
- `Renko` 用 `buildRenkoData(...)`
- `Kagi` 用 `buildKagiData(...)`

第二层再从这些 rows 里选最后一个可见窗口，推导：

- 默认水平线价格
- 默认趋势线起点时间/价格
- 默认趋势线终点时间/价格

这样 workbench 的默认 drawings 不再和主图语义脱节，`Line Break / P&F` 也不需要继续 suppress 默认线。

### 2. 非时间主图下的 requested-context 变成 API 契约

新增了两条 API 级 visual/behavior contract：

- `Point Figure + requested-context compare`
- `Line Break + requested-context moving-average`

目的不是再看 workbench “像不像”，而是直接锁住引擎路径：

- primary/main 是 compressed non-time chart sequence
- study/compare 仍然可以请求另一上下文
- merge 结果会落回当前 synthetic chart bars

这样后面继续收 `Renko / Kagi / P&F / Line Break` 的 synthetic-study policy 时，不会只剩 workbench 这层截图做依据。

## 这次为什么值

因为它把“non-time chart 只是主图自己能画出来”推进成了：

- 主图语义
- requested-context study merge
- 默认 drawings

都开始围绕同一套 main rows 工作。

这比继续给某个图型单独调 demo 参数更接近真正的引擎收口。

## 还没做的

这次还没有把 default drawings 的锚点逻辑下沉成 engine-level API；它目前仍然是 workbench 在根据 builder rows 做推导。

如果后面继续收这条线，下一步最合理的是：

1. 提供 chart-level “current main rows / visible anchor rows” 能力
2. 让 default drawings / drawing presets 不再依赖 demo 自己复算 builder
3. 再把 `Renko / Kagi` 的 requested-context 契约补齐
