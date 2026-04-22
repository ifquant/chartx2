# 0249: 把 pane 和 scale access 也继续收进 runtime container

`0247` 收的是 runtime graph 的创建。  
`0248` 收的是一层常用 context/source/secondary-scale access。

但 `chart-harness.ts` 里还保留着另一组很像“本地 runtime getters”的入口：

- `panes`
- `primaryPriceScale`
- `timeScale`
- `drawingRegistry`

这组东西如果继续挂在 harness 上，就说明 container 仍然还没真正接住 runtime-owned read model surface。

## 1. 这次的目标

这次不扩到更大的 owner graph，也不改行为。  
只继续做一件事：

- 把 pane collection / primary scale / time scale / drawing registry 这些 runtime-owned access 入口，继续从 harness-local getter 收到 runtime container

## 2. container 这次新增了什么

改了：

- `src/lib/chartx/internal/views/chart-runtime-container.ts`

新增/明确的 surface 包括：

- `getDrawingRegistry()`
- `timeScaleApi()`
- `primaryPriceScale()`
- `getPaneById(...)`
- `getPaneByIndex(...)`
- `getPaneIndex(...)`
- `listPanes()`
- `addSecondaryPane(...)`
- `removePaneById(...)`
- `rendererRuntime()` 作为 renderer bag 的显式访问入口

也就是说，container 不再只是 source/context 相关 access 的集合，而是开始承接更完整的 runtime-owned structural access。

## 3. harness 这次怎么变

改了：

- `src/lib/chartx/internal/views/chart-harness.ts`

现在这些 wiring 不再依赖 harness 自己的本地 getter：

- `paneOwner`
- `drawingOwner`
- `drawingInteractionOwner`
- `renderInputOwner`
- `scaleOwner`
- `primarySeriesOwner`
- `stateRestoreShellOwner`
- `stateShellOwner`
- `interactionShellOwner`

它们更多直接走 `runtime.*` surface。

结果是：

- harness 里删掉了 `panes / primaryPriceScale / timeScale / drawingRegistry` 这组 getter glue
- runtime container 继续从“对象集合”往“runtime structural boundary”演进

## 4. 为什么这一步值

如果 runtime container 只管 source/context，而 pane/scale/registry 还都挂在 harness 自己的 getter 上，那么 runtime ownership 还是分裂的。

这次把这组 access 也收过去之后，`chart-harness` 更接近真正的 composition root：

- owner wiring 直接吃 runtime surface
- harness 不再顺手扮演一个局部 runtime facade

这一步仍然不大，但边界更一致了。

## 5. 测试补充

更新：

- `tests/unit/chart-runtime-container.test.ts`

新增了 pane collection 相关 contract：

- `getPaneById`
- `getPaneByIndex`
- `getPaneIndex`
- `addSecondaryPane`
- `removePaneById`

这样 runtime container 对 pane access 的第一层承诺也被锁住了。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-runtime-container.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有把 renderer usage 全部改成 `rendererRuntime()` 入口
- 没有把完整 pane/layout model ownership 做成下一层模型边界
- 没有继续吸收更大的 owner graph
