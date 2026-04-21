# 0175 - 从 Chart Harness 抽出 Canvas Lifecycle Owner

## 背景

前几刀已经把 source、pane、drawing、render、state 这些大块 owner / coordinator 都从 `chart-harness` 收出去了。继续往 adapter-shell 收口时，剩下最明显的一块不是业务逻辑，而是 canvas 生命周期装配：

- `attach(canvas)`
- `detach()`
- resize observer 状态读写
- window resize listener
- pointer / wheel / click / keydown handler bag
- detach 时清理 canvas ref、interaction state、subscriptions

这些逻辑本身不复杂，但它们有一个重要特点：必须保持 attach 和 detach 的 listener identity 完全一致。也就是说，不能为了“拆文件”随便重建 handler，否则 teardown 会移除不到原来的 listener。

所以这次没有改底层 listener 绑定顺序，也没有重写 `chart-canvas-lifecycle.ts`。这次只把 `chart-harness` 里那层重复的装配对象抽成一个小 owner。

## 改动

- 新增 `src/lib/chartx/internal/views/chart-canvas-lifecycle-owner.ts`。
- 这个 owner 负责：
  - 保存 attach/detach 共用的 handler bag
  - 把 canvas ref、resize observer、manual layout、render callback 接到已有 lifecycle module
  - detach 时统一清理 canvas ref、interaction state 和 subscriptions
- `chart-harness.ts` 现在只保留：
  - `assertCanvasElement(canvas)`
  - `canvasLifecycleOwner.attach(canvas)`
  - `canvasLifecycleOwner.detach()`
- 补了 `tests/unit/chart-canvas-lifecycle-owner.test.ts`，锁住：
  - attach 会设置 canvas、触发 render、注册 resize/window/listener
  - detach 会清理 canvas ref、observer、interaction state、subscriptions，并复用同一组 handlers

## 这一刀真正解决了什么

### 1. harness 不再内联 lifecycle deps object

之前 `attach()` 和 `detach()` 虽然已经调用 shared lifecycle use-case，但 harness 仍然自己拼两份很相似的 deps object。

这意味着 harness 还在直接知道：

- resize observer 怎么存
- handler bag 怎么组成
- detach 时要清哪些状态
- canvas ref 怎么 reset

现在这些都通过 lifecycle owner 组合，harness 更像一个入口，而不是 lifecycle policy holder。

### 2. 没有破坏 listener identity

这类代码最容易犯的错是每次 attach/detach 都重新生成 handler 对象，导致 `removeEventListener` 拿不到同一个引用。

这次 owner 使用 harness 已经创建好的 interaction handlers，只搬走装配层，不改变底层 handler identity 和底层 lifecycle module 的事件顺序。

### 3. adapter-shell 收口继续变具体

这一步之后，`chart-harness` 在 canvas 这条线上进一步退化成：

- 验证 canvas
- 委托 lifecycle owner

这和最终目标一致：`chart-harness` 应该逐渐只剩 composition root、public API handoff、少量不可避免的 adapter glue。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-canvas-lifecycle-owner chart-canvas-lifecycle chart-canvas-runtime`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 这次没有抽更广的 render invalidation helper，避免把多个 public command 分支混进 lifecycle slice。
- 这次没有改变 `chart-public-api.ts` 的 forwarding shape。
- `chart-harness` 里仍然还有一些 public command / owner deps assembly，可以后续继续按同样方式收。
