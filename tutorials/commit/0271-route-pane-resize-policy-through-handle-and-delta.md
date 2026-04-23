# 0271: 让 move-time pane resize policy 只吃 `handle + delta`

上一笔 `0270` 已经把 pane resize interaction state 收成了：

- `startClientY`
- `handle`

这已经比早期散字段状态好很多，但当时还有一个职责越界：

- `chart-pane-layout-policy-owner`
- 在 move-time 里仍然要吃整个 `resizeState`

这意味着 policy 层虽然已经拿到了显式 handle，却还是被迫看到：

- `startClientY`

这种明显属于 drag interaction lifecycle 的字段。

这次就是把这层再切干净。

## 1. 现在 policy 的输入是什么

在：

- [chart-pane-layout-policy-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts)

里，`resolveControlledResizeHeight(...)` 现在不再接收：

- 整份 `resizeState`

而是只接收：

- `deltaY`
- `resizeHandle`

也就是说，policy 层现在只知道：

- 本次拖动已经产生了多少位移
- 当前 resize handle 对应哪条 divider 和哪份 block snapshot

它不再需要知道：

- pointer-down 时的原始 clientY

这一步很关键，因为：

- `startClientY` 是 interaction lifecycle 的事情
- `handle + deltaY` 才是 pane resize policy 真正该看的输入

## 2. 谁现在负责算 delta

责任已经被明确推回到 runtime：

- [chart-pane-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-runtime.ts)

这里现在会先做：

- `clientY - resizeState.startClientY`

然后把结果连同：

- `resizeState.handle`

一起交给 pane layout policy。

所以当前边界变成：

- runtime 负责 interaction lifecycle 和 delta 计算
- policy owner 负责根据 `handle + delta` 求 controlled pane 的下一个高度

这是更合理的分层。

## 3. 为什么这一步值得单独提交

这次还是没有新增 linked-resize 用户行为。

它的价值是 ownership 进一步清晰化：

- pane resize state 已经有了 handle
- 现在 policy 终于也只吃 handle

这意味着 pane resize policy 已经不再依赖完整 interaction state，而是依赖一个更接近 domain payload 的输入。

后面如果继续做：

- pane block runtime owner
- handle identity
- richer block-aware resize policy

就不需要再先把 `startClientY` 之类的 lifecycle 字段从 policy 里剥离出来。

## 4. 测试

更新了：

- [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts)
- [chart-pane-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-runtime.test.ts)
- [chart-pane-resize-block-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-resize-block-owner.test.ts)
- [chart-pointer-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pointer-runtime.test.ts)
- [chart-view-state.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-view-state.test.ts)

重点覆盖：

- policy owner 现在直接用 `deltaY + handle`
- pane runtime 仍然能正确把 `clientY - startClientY` 转成 delta
- pointer / view state / resize block owner 的新 handle contract 保持一致

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pane-resize-block-owner.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check`

## 未包含

- 没有新增 linked-resize 用户行为
- 还没有把 resize handle 提升成更稳定的 runtime identity 或 ownership root
- 这一步只是在 policy boundary 上完成 `interaction state -> handle + delta` 的职责切分
