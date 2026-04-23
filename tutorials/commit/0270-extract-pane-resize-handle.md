# 0270: 给 pane resize interaction state 补显式 handle

上一笔 `0269` 已经把 pane resize state 里的 block 数据收成了：

- `resizeState.block`

这比更早的散字段状态已经干净很多，但还有一个结构问题：

- `startClientY` 在 state 顶层
- divider identity 也在 state 顶层
- block snapshot 又在另一个嵌套对象里

也就是说：

- pointer-down 的 resize state
- 虽然已经不像以前那么散
- 但“这次 resize 到底握着什么对象”还是不够明确

这次就把它再推进一层，变成显式 handle。

## 1. 新的 state 形状

现在 `PaneResizeInteractionState` 不再是：

- `dividerAfterPaneId`
- `dividerBeforePaneId`
- `startClientY`
- `block`

而是：

- `startClientY`
- `handle`

其中 `handle` 本身是一个命名对象：

- `dividerAfterPaneId`
- `dividerBeforePaneId`
- `block`

所以当前 runtime 持有的语义变成：

- pointer-down 起点时间/坐标信息
- 一个显式的 resize handle

而不是：

- 几个 state 顶层字段
- 再加一份 block snapshot

## 2. 为什么 handle 比匿名嵌套结构更好

这一步不是为了“多套一层对象”，而是为了把 runtime payload 命名清楚。

现在 pointer-down/move-time 之间传递的不再只是：

- “某个 state 恰好带了 divider 和 block”

而是：

- “一个 resize handle”

这对后续继续做 pane block ownership 有实际价值，因为：

- handle 可以继续长出稳定身份或附加元数据
- state 本身则可以继续保持只承载 interaction 生命周期字段

也就是说：

- `startClientY` 属于 interaction state
- `handle` 属于 resize block payload

边界更清楚了。

## 3. 这次还顺手收了什么

在：

- [chart-pane-resize-block-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-resize-block-owner.ts)

里，`resolvePaneResizeState(...)` 现在会先构造：

- `resolvePaneResizeHandle(...)`

再把它包进 interaction state。

同时 move-time 的 validated group 也改成从：

- `resizeState.handle`

读取 divider identity 和 block snapshot，而不是再假设这些字段挂在 state 顶层。

对应地，以下 consumer 都已经切到 `handle.block`：

- [chart-pointer-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pointer-runtime.ts)
- [chart-pane-layout-policy-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts)
- [chart-pane-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-runtime.ts)
- [chart-view-state.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-view-state.ts)

## 4. 为什么这一笔值得单独提交

这次还是没有新增 linked-resize 用户行为。

它的价值是继续把 pane resize 从“结构上看起来像散字段协议”往“结构上看起来像一个 runtime-owned object”推进。

现在 repo 里已经有了：

- shared pane-resize-block owner
- nested block snapshot
- explicit resize handle

下一步再继续做真正的 ownership root，就不需要再先清理 state 形状了。

## 5. 测试

更新了：

- [chart-pane-resize-block-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-resize-block-owner.test.ts)
- [chart-pointer-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pointer-runtime.test.ts)
- [chart-view-state.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-view-state.test.ts)
- [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts)
- [chart-pane-layout-runtime-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-runtime-owner.test.ts)
- [chart-pane-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-owner.test.ts)
- [chart-pane-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-runtime.test.ts)

重点覆盖：

- pointer-down 直接写入 `startClientY + handle`
- move-time validated group 继续能从 handle 里取 block
- 现有 pane runtime / owner / view state 都已经切到新的 handle contract

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-resize-block-owner.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check`

## 未包含

- 没有新增 linked-resize 用户行为
- 还没有把 resize handle 升级成更稳定的 runtime identity 或 ownership root
- 这一步先把 handle 作为显式 payload 收出来，不是最终 pane block runtime 终态
