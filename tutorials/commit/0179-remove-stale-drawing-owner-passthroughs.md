# 0179 - 删除 Drawing Owner 稳定后的 Harness 透传层

## 背景

`chart-drawing-owner` 已经接管了 drawing 生命周期和 public 状态：

- drawing 创建
- drawing registry 查询
- pane-local drawing 列表和计数
- selection 更新
- selected drawing 删除
- restore 时的 drawing 重建

因此 `chart-harness` 里继续保留 `getDrawingById()`、`selectDrawing()`、`removeSelectedDrawing()` 这类 private wrapper，会让职责边界重新变模糊。

## 改动

- `addHorizontalLineDrawing()` 直接调用 `drawingOwner.addHorizontalLine()`。
- `addTrendLineDrawing()` 直接调用 `drawingOwner.addTrendLine()`。
- pane owner、state coordinator、interaction handlers、render coordinator deps 里需要 drawing 查询或 selection 时，直接调用 `drawingOwner`。
- 删除 harness-local drawing private wrapper：
  - `createHorizontalLineDrawing`
  - `createTrendLineDrawing`
  - `resolveTrendLineDefaults`
  - `getDrawingById`
  - `getDrawingsByPane`
  - `getDrawingCountForPane`
  - `selectDrawing`
  - `removeDrawing`
  - `removeSelectedDrawing`
- 删除不再需要的 drawing command/factory imports。

## 为什么 public drawing 命令仍然安全

之前 public 方法的路径是：

```ts
addHorizontalLineDrawingCommandUseCase(...)
  -> this.resolveSeriesTarget(...)
  -> this.createHorizontalLineDrawing(...)
  -> this.drawingOwner.addHorizontalLine(...)
```

现在路径是：

```ts
this.drawingOwner.addHorizontalLine(...)
```

`drawingOwner` 内部已经封装了同一个 drawing command use-case，并且它的 `resolveTarget` 依赖仍来自 harness 注入的 `resolveSeriesTarget`。所以这次只是去掉外层重复中转，没有改变 target 解析语义。

## 这一刀的价值

### 1. drawing owner 成为真实调用入口

之前虽然 drawing owner 已经存在，但 harness 还保留一组同名 helper。读者需要多跳一次才能确认逻辑到底在哪里。

现在 drawing lifecycle/public/registry/selection 的入口更集中：

- harness public API 调 `drawingOwner`
- interaction runtime 调 `drawingOwner`
- state/render/pane deps 调 `drawingOwner`

### 2. harness 更接近 adapter shell

这一刀没有抽新模块，而是清理 owner 稳定后的尾巴。它减少的是“看起来像 policy、实际只是 forwarding”的代码。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-drawing-owner chart-drawing-registry-runtime chart-drawing-runtime chart-interaction-handlers chart-render-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 没有改 drawing hit-test 或 drag geometry。
- 没有调整 drawing render ordering。
- source/pane 的剩余 harness wrapper 仍留给后续切片。
