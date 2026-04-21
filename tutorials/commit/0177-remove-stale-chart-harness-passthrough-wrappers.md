# 0177 - 删除 Chart Harness 里的过期透传 Wrapper

## 背景

前面几刀已经把 `chart-harness` 的几条主线分别收进了 owner / coordinator：

- `stateCoordinator`
- `paneOwner`
- `drawingOwner`
- `renderInvalidation`

这会留下一个常见的重构尾巴：旧的 private helper 已经不再承担真正逻辑，但还留在 harness 里做一层纯透传。

例如：

```ts
private clearRestorableChartStudies(): void {
  this.stateCoordinator.clearRestorableChartStudies();
}
```

这种方法看起来无害，但它会让后续读代码的人误判：

- 以为 harness 仍然拥有 restore policy
- 以为 pane/drawing 的 read-model helper 还在 harness 本地
- 以为这些 helper 是稳定扩展点

所以这次不是继续抽新模块，而是删除已经失去职责的 harness-local wrapper。

## 改动

- 删除 state restore 相关的无引用 private wrapper：
  - `applyChartStateSnapshot`
  - `clearRestorableChartStudies`
  - `clearRestorableChartSeries`
  - `clearRestorableChartDrawings`
  - `restoreChartSeries`
  - `restoreChartStudies`
  - `restoreChartDrawings`
- 删除 pane 相关的无引用 private wrapper：
  - `subscribePaneResize`
  - `unsubscribePaneResize`
  - `getPaneById`
  - `getPaneHeight`
  - `getPaneOptions`
  - `applyPaneOptions`
  - `setPaneHeight`
  - `paneHasSeries`
  - `getPaneByHandle`
  - `emitPaneResize`
  - `buildPaneState`
  - `buildPaneStateSnapshot`
  - `getPaneSeriesStates`
- 删除 drawing 相关的无引用 private wrapper：
  - `createDrawingMeta`
  - `getAllDrawings`
- 清掉对应的过期 imports 和不再使用的 restorable series type。

## 这一刀真正解决了什么

### 1. 避免 harness 继续假装是 owner

如果一个方法只是调用 `this.stateCoordinator.xxx()`，那它不是 abstraction，只是噪音。

现在这些方法被删掉后，代码路径更明确：

- state restore 走 `stateCoordinator`
- pane read/model/runtime 走 `paneOwner`
- drawing registry/listing 走 `drawingOwner`

### 2. 让下一轮收口更容易判断真实剩余复杂度

删除 dead wrapper 后，剩下的方法更能代表真实责任。后续再看 `chart-harness`，不会被一堆已经失去职责的 private method 混淆。

### 3. 这是收口，不是行为修改

这次没有改命令行为、渲染时序、事件派发或 restore 顺序。所有改动都是删除无引用透传层和清理对应 import/type。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-state-coordinator chart-pane-owner chart-drawing-owner chart-render-invalidation`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- `chart-harness` 仍然有不少 owner deps assembly。
- 这次没有调整 public API forwarding。
- 这次没有继续抽 source / pane / drawing 的更高层 facade，只做 dead wrapper cleanup。
