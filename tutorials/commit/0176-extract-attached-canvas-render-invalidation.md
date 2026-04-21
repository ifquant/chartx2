# 0176 - 抽出 Attached Canvas Render Invalidation

## 背景

上一刀已经把 canvas attach / detach 的 lifecycle 装配从 `chart-harness` 收成了 lifecycle owner。继续往 adapter-shell 收口时，harness 里还剩下一类非常高频的噪音：

```ts
if (this.canvas !== null) {
  this.render(this.canvas);
}
```

这段逻辑散落在很多 owner deps 和 command callbacks 里，包括 source owner、pane owner、drawing owner、state coordinator、public commands、scale APIs、trade-location 等路径。

它不是业务逻辑，但它会让每个 owner 的 deps object 都显得更重，也让“触发重绘”这个概念继续表现成 harness-local 条件判断。

## 改动

- 新增 `src/lib/chartx/internal/views/chart-render-invalidation.ts`。
- 这个模块只做一件事：
  - 如果当前有 attached canvas，就调用 render。
  - 如果没有 canvas，就跳过。
- `chart-harness.ts` 新增 `renderInvalidation` owner，并把散落的 nullable-canvas render guard 全部替换成：

```ts
this.renderInvalidation.renderIfAttached();
```

- 补了 `tests/unit/chart-render-invalidation.test.ts`，锁住：
  - 无 canvas 时不 render
  - 有 canvas 时只 render attached canvas

## 这一刀真正解决了什么

### 1. “触发重绘”不再到处复制条件判断

之前每个 callback 都自己知道：

- harness 有一个 nullable canvas
- render 只能在 canvas 存在时执行
- 调用方式是 `this.render(this.canvas)`

这些都不是各个 owner 应该关心的事。现在它们只表达“需要 invalidation”，具体是否有 canvas、要不要 render，由 shared invalidation owner 处理。

### 2. 继续降低 owner deps 装配噪音

`chart-harness` 当前最大的剩余复杂度之一，是大量 owner/coordinator 的 deps assembly。把 repeated render guard 收成一个统一出口后，后续继续看 source/pane/drawing/public command glue 时，真正有意义的依赖会更显眼。

### 3. 这不是调度系统，也不是 debounce

这次故意没有引入 requestAnimationFrame、dirty flag、debounce 或 render queue。

原因是当前目标是结构收口，不是改变渲染时序。现有行为是“同步地，如果 canvas attached 就 render”，这次保持这个语义，只把判断从各个调用点收成一个 owner。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-render-invalidation chart-canvas-lifecycle-owner chart-render-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 没有引入异步 render scheduling。
- 没有改 `chart-public-api.ts` 的 forwarding shape。
- harness 里还剩下不少 owner deps assembly，后续仍然可以继续按单一责任切片往外收。
