# 0247: 给 phase-one runtime graph 补第一层 container 边界

上一刀我们已经把 post-harness 之后真正要做的路线图写清楚了。  
接下来第一条最自然的主线，就是把 `PhaseOneChartHarness` 从“自己 new 出整套 runtime graph”的状态，再往真正的 composition root 推进一步。

这次先收第一刀：不碰行为，不碰 public API，只把核心 runtime graph 的实例化集中起来。

## 1. 为什么先做这个

虽然 `chart-harness.ts` 已经不再是以前那种大而杂的单体文件，但它顶部仍然直接 new 了这几组核心对象：

- `ChartModel`
- `DrawingRegistry`
- `TimeScale`
- 一整组 renderer instances

这意味着它虽然在“逻辑装配”层已经收薄了，但在“runtime graph ownership”层仍然是直接持有者。

如果后面真的要往：

- runtime container
- pane/layout model ownership
- market vs performance chart family split

这些方向继续走，那么首先就不该再让 harness 自己逐个实例化这些核心 runtime objects。

## 2. 这次怎么收

新增：

- `src/lib/chartx/internal/views/chart-runtime-container.ts`

这个模块先做最小但明确的一件事：把 phase-one runtime graph 的创建收成一个 container surface。

它现在集中负责：

- `chartModel`
- `drawingRegistry`
- `timeScale`
- `renderers`
- `panes()`
- `primaryPriceScale()`

注意，这次还没有把全部 runtime policy 都搬进去。  
它目前只是把“哪几个核心对象构成 runtime graph”先收成一个边界，让 harness 不再直接写一排 `new ...`。

## 3. harness 这次怎么变化

改了：

- `src/lib/chartx/internal/views/chart-harness.ts`

做法很克制：

- 新增 `private readonly runtime = createChartRuntimeContainer()`
- 删除 harness 顶部直接实例化的 `ChartModel / DrawingRegistry / TimeScale / renderer bag`
- 改成通过 runtime container 提供的 surface 访问这些对象

这次故意没有把所有调用点重写成另一种大结构，只做了最小 rewiring：

- `chartModel`
- `drawingRegistry`
- `timeScale`
- `panes`
- `primaryPriceScale`
- render callback 里的 renderer runtime

这样这刀仍然是一个窄切片，而不是把整个 harness 重新组织一遍。

## 4. 为什么这刀值

价值不在于“又少了几行代码”，而在于边界开始变了：

- harness 更像 composition root
- runtime graph 更像一个可单独讨论、单独扩展的内部单元
- 后面如果继续往 runtime container 推，就不需要先从 scattered object construction 开始收拾

这才是 post-harness 下一阶段真正该做的事情，而不是继续拆已经完成的 owner。

## 5. 测试补了什么

新增：

- `tests/unit/chart-runtime-container.test.ts`

它先锁住最基础的 container contract：

- `panes()` 确实代理 `chartModel.panes()`
- `primaryPriceScale()` 确实代理 `chartModel.primaryScale()`
- renderer bag 在 container 上一次性可用

这不是复杂行为测试，但足够锁住这次边界的存在。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-runtime-container.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有把完整 runtime policy 都移进 container
- 没有改变 phase-one public API
- 没有启动 pane/layout model ownership 那条主线
