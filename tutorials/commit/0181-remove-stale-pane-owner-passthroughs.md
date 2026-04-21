# 0181 - 删除 Pane Owner 稳定后的 Harness 透传层

## 背景

`chart-pane-owner` 已经接管了 pane runtime / command surface：

- pane handle 创建
- pane index 查询
- pane resize 应用
- pane removal
- pane event 发布

但 `chart-harness` 还残留了一组 private wrapper，只是把调用转发给 `paneOwner`。同时，旧 pane/drawing leaf runtime imports 和 `paneHandleIds` 字段也已经没有引用。

## 改动

- 将 drawing/render/state/interaction deps 里仍通过 harness wrapper 的 pane 调用改成直接调用 `paneOwner`。
- 删除 harness-local pane wrapper：
  - `createPaneHandle`
  - `getPaneIndex`
  - `applyPaneResize`
  - `removePaneById`
  - `emitPaneEvent`
- 删除旧 pane leaf imports：
  - `chart-pane-api-runtime`
  - `chart-pane-bookkeeping-runtime`
  - `chart-pane-event-runtime`
- 删除旧 drawing registry runtime imports，它们已经由 `drawingOwner` 持有。
- 删除不再使用的 `paneHandleIds` 字段。

## 为什么没有改变 pane 行为

pane owner 初始化时仍然保留自己的底层依赖：

```ts
getPaneIndex: (paneId) => {
  const index = this.panes.getIndex(paneId);
  if (index === -1) {
    throw new Error("chartx phase-one pane has been removed");
  }
  return index;
}
```

这次改的是 owner 外部的调用方式。原来路径是：

```ts
this.getPaneIndex(...)
  -> this.paneOwner.getPaneIndex(...)
```

现在路径是：

```ts
this.paneOwner.getPaneIndex(...)
```

所以错误语义和 resize/removal/event 行为仍由同一个 owner surface 提供。

## 这一刀的价值

### 1. pane owner 变成真实调用入口

读代码时不再需要判断 pane 相关行为到底在 harness wrapper 还是 pane owner 里。

### 2. 清掉旧 leaf import ownership

`chart-harness` 不再 import pane API/bookkeeping/event runtime helpers，也不再保留 drawing registry runtime helpers。这些 leaf module 应该由 owner 层持有，而不是继续暴露在 harness composition root。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-pane-owner chart-pane-runtime chart-pane-management chart-pane-api-runtime chart-pane-bookkeeping-runtime chart-pane-event-runtime chart-state-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 没有改 pane owner 内部实现。
- 没有改 public pane API shape。
- `resolveSeriesTarget` 仍保留为 harness-local wrapper，因为当前 public add-series 命令仍集中复用它，后续应和 add-series command 收口一起处理。
