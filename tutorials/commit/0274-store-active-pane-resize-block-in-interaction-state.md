# 0274: 让 pane resize interaction state 直接保存 active resize block

上一笔 `0273` 已经把：

- `PaneActiveResizeBlock`

提成了显式 runtime artifact。

也就是说，`chart-pane-resize-block-owner` 已经能明确给出：

- 当前 divider/handle 对应的 validated group
- 实际 controlled pane
- 当前拖动到底控制 upper 还是 lower 一侧

但当时 pointer-down 存进 state 的还是：

- `startClientY`
- `handle`

这会留下一个不干净的结构问题：

- pointer-down 明明已经验证过 active resize block
- move-time consumer 却还要把 `handle` 再当 lookup key，用它重新恢复 active block

这并不影响行为，但 ownership 还是不够收口。

## 1. 这次改了什么

在：

- [chart-pane-resize-block-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-resize-block-owner.ts)

现在 `PaneResizeInteractionState` 不再是：

- `startClientY + handle`

而是改成：

- `startClientY + activeBlock`

同时 `resolvePaneResizeState(...)` 也不再只返回 handle，而是直接：

1. 先解析 handle
2. 再解析 active resize block
3. 最后把 active block 放进 pointer-down state

这样 pointer-down 冻结下来的 runtime state 就和真正 move-time 需要消费的对象对齐了。

## 2. 为什么这是更好的边界

`handle` 的含义更像：

- divider identity
- block snapshot payload

而 move-time 真正关心的是：

- 当前 active block 是什么
- controlled pane 是谁
- resize direction 怎么解释

所以如果 interaction state 只保存 handle，就会造成一种不必要的二次恢复：

- state 里存的是 A
- move-time 真正使用的是 B
- 但 B 每次又都要从 A 现算回来

这一步把 state 存储对象和 runtime 消费对象统一了：

- pointer-down 存 active block
- move-time 读 active block

这样后面如果继续把 pane resize 往更稳定的 runtime root 推进，路径会更顺。

## 3. 哪些模块一起切过来了

除了 owner 本身，这次还把这些 consumer 一起改到新 state 形状：

- [chart-pointer-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pointer-runtime.ts)
- [chart-pane-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-runtime.ts)
- [chart-pane-layout-runtime-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-runtime-owner.ts)
- [chart-pane-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-owner.ts)
- [chart-view-state.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-view-state.ts)

其中最关键的运行时变化是：

- pane resize 应用路径现在通过 `resizeState.activeBlock.handle`
- 而不是继续通过 `resizeState.handle`

也就是说，`handle` 现在退回成 active block 内部的一部分，而不是 interaction state 的顶层 contract。

## 4. 测试为什么也要一起改

这一步如果只改运行时代码，不改测试，很容易出现一个错觉：

- 行为没变，所以测试结构也不用动

但这里要保护的不只是行为，还有 ownership contract。

因此这次一起更新了：

- [chart-pane-resize-block-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-resize-block-owner.test.ts)
- [chart-pointer-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pointer-runtime.test.ts)
- [chart-view-state.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-view-state.test.ts)
- [chart-pane-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-runtime.test.ts)
- [chart-pane-layout-runtime-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-runtime-owner.test.ts)
- [chart-pane-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-owner.test.ts)

这些测试现在共同锁住了一件事：

- pane resize interaction state 的顶层 owned object 已经从 `handle` 变成 `activeBlock`

## 5. 这一步的价值

这一步仍然没有新增 linked-resize 用户行为。

它的价值在于继续把 pane resize runtime root 往正确方向推：

- `block` 是显式对象
- `handle` 是显式对象
- `activeBlock` 是显式对象
- 现在 interaction state 也直接围绕 `activeBlock` 建

这样 move-time runtime 不再需要把“已经验证过的 active block”再恢复一次。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-resize-block-owner.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有新增 linked-resize 用户行为
- active resize block 还不是 identity-bearing runtime root
- 这一步先把 pointer-down state 和 move-time runtime 消费对象对齐
