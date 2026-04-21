# 0187 - 删除 Target Resolution 和 Marker Mutation 的 Harness 透传层

## 背景

`chart-harness` 里还剩两个典型的局部 wrapper：

- `resolveSeriesTarget`
- `setSecondaryMarkers`

前者只是转给 `paneOwner.resolveSeriesTarget`，后者只是拿到 source 后调用 `setSeriesMarkersUseCase`。

它们没有独立 policy，继续保留会让 harness 看起来仍然拥有 pane target resolution 和 marker mutation。

## 改动

- drawing owner 和 public add-series/add-study 命令直接调用 `paneOwner.resolveSeriesTarget`。
- primary series factory deps 中的 `setMarkers` 直接调用 `sourceOwner.getSourceByApi` 和 `setSeriesMarkersUseCase`。
- 删除 harness-local wrapper：
  - `resolveSeriesTarget`
  - `setSecondaryMarkers`

## 为什么没有行为变化

target resolution 仍然由 `paneOwner` 执行：

```ts
this.paneOwner.resolveSeriesTarget(...)
```

marker mutation 仍然由同一个 presentation use-case 执行：

```ts
setSeriesMarkersUseCase(...)
```

这次只是去掉 harness 中间层。

## 这一刀的价值

### 1. pane owner ownership 更完整

public add-series/add-study 命令不再绕过一层 harness-local target wrapper。

### 2. series presentation 更直接

marker 更新不再表现为 harness 自己拥有 mutation 方法，而是直接走 source owner lookup 和 presentation use-case。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-pane-owner chart-add-commands chart-series-presentation chart-primary-series-factory`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 没有改 `paneOwner.resolveSeriesTarget` 内部行为。
- 没有改 marker normalization。
- 没有重构 public add-series method family。
