# 0204 - Extract Drawing Interaction Owner

## 背景

`chart-harness` 还保留了三段 drawing interaction private methods：

- `resolveHitDrawing`
- `resolveSelectedTrendLineDragHandle`
- `applyDrawingDrag`

这三段不是 public API，也不是 drawing geometry 算法本身。它们主要负责把 runtime dependencies 接到已有 leaf use-case：

- pane frame assembly
- primary / secondary price scale lookup
- chart context axis bars
- drawing registry lookup
- selected drawing state
- magnet / snap options
- snap guide view-state mutation

这些 dependency wiring 应该属于 drawing interaction owner，而不是继续留在 harness。

## 本次改动

新增 `chart-drawing-interaction-owner.ts`，集中承接：

- hit drawing resolution
- selected trend-line drag handle resolution
- active trend-line drag application

owner 内部继续复用已有模块：

- `chart-drawing-hit-test`
- `chart-drawing-runtime`
- `chart-drawing-snap`

## 对 harness 的影响

`chart-harness` 删除了三个 private methods，并在 interaction handler deps 中改为调用：

```ts
this.drawingInteractionOwner.resolveHitDrawing(...)
this.drawingInteractionOwner.resolveSelectedTrendLineDragHandle(...)
this.drawingInteractionOwner.applyDrawingDrag(...)
```

这样 harness 只负责创建 owner 和传入 chart runtime dependencies，不再自己拼 hit-test / drag / snap-guide runtime policy。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-drawing-interaction-owner chart-drawing-hit-test chart-drawing-runtime chart-drawing-snap chart-interaction-handlers chart-pointer-runtime chart-canvas-runtime`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-drawing-interaction-owner.ts tests/unit/chart-drawing-interaction-owner.test.ts docs/chart-workstation-architecture.md tutorials/commit/0204-extract-drawing-interaction-owner.md`

## Not included

- 没有改 drawing hit tolerance。
- 没有改 magnet / snap policy。
- 没有改 drawing render ordering。
