# 0276: 压平 active pane resize block 的形状

上一笔 `0275` 已经把 move-time resize policy 改成直接吃：

- `PaneActiveResizeBlock`

这已经比早期那条：

- `interaction state -> handle -> active block -> resize math`

干净很多。

但当时 `PaneActiveResizeBlock` 自己的形状还是：

- `handle`
- `group`
- `controlledPaneId`
- `controlsUpperPane`

而 `handle` 里面又再包一层：

- `dividerAfterPaneId`
- `dividerBeforePaneId`
- `block`

于是 move-time consumer 虽然已经不再回退到“只传 handle”，但还是会继续写出这种访问：

- `activeBlock.handle.dividerAfterPaneId`
- `activeBlock.handle.block.startControlledHeight`

这说明 runtime object 虽然换了名字，但 consumer 仍然被旧的 handle 嵌套形状绑着。

所以这一步做的不是新增行为，而是把 `active block` 自己收正成更像 runtime root。

## 1. 这次具体改了什么

在：

- [chart-pane-resize-block-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-resize-block-owner.ts)

`PaneActiveResizeBlock` 现在不再把核心数据藏在 `handle` 里，而是直接提升成一等字段：

- `dividerAfterPaneId`
- `dividerBeforePaneId`
- `snapshot`

保留的结构是：

- `group`
- `controlledPaneId`
- `controlsUpperPane`

这样 `active block` 现在表达的是：

1. 这个 resize block 对应哪条 divider
2. 这次 resize 的冻结 snapshot 是什么
3. 当前 validated group 是什么
4. 受控 pane 和控制方向是什么

这比“先拿 active block，再从里面拿 handle，再从 handle 里拿 block”更像一个真正的 owned runtime object。

## 2. move-time runtime 为什么会因此更稳定

在：

- [chart-pane-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-runtime.ts)

这次最直接的变化是 divider 追踪不再写成：

- `resizeState.activeBlock.handle.dividerAfterPaneId`
- `resizeState.activeBlock.handle.dividerBeforePaneId`

而是直接写成：

- `resizeState.activeBlock.dividerAfterPaneId`
- `resizeState.activeBlock.dividerBeforePaneId`

同样，在 resize math 里，也不再通过：

- `activeResizeBlock.handle.block.*`

去取 snapshot 字段，而是直接走：

- `activeResizeBlock.snapshot.*`

这意味着 move-time consumer 现在依赖的是 active block 的真实 contract，而不是 handle 的历史结构。

## 3. 这一步和上一笔 `0275` 的区别

`0275` 解决的是：

- move-time policy 不该再吃 handle

这次 `0276` 解决的是：

- 就算 move-time 已经吃 active block，也不该继续通过 active block 内部的 handle/block 嵌套去读核心状态

所以两步的关系是：

1. 先把调用链从 handle 提升到 active block
2. 再把 active block 自己压平成真正的消费边界

如果不做第二步，第一步虽然成立，但 consumer 仍然会把 `active block` 当“包着旧 handle 的壳”。

## 4. 哪些地方一起跟着改了

这一步同步切了这些运行时和测试夹具：

- [chart-pointer-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pointer-runtime.ts)
- [chart-pane-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-runtime.ts)
- [chart-pane-layout-runtime-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-runtime-owner.ts)
- [chart-pane-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-owner.ts)
- [chart-view-state.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-view-state.ts)

以及相关测试：

- [chart-pane-resize-block-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-resize-block-owner.test.ts)
- [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts)
- [chart-pointer-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pointer-runtime.test.ts)
- [chart-view-state.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-view-state.test.ts)
- [chart-pane-layout-runtime-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-runtime-owner.test.ts)
- [chart-pane-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-owner.test.ts)
- [chart-pane-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-runtime.test.ts)

这样整个 move-time path 的夹具都和新的 active-block 形状对齐了。

## 5. 这一步的价值

这一步仍然没有新增 linked-resize 行为。

它的价值是继续减少 runtime 对历史嵌套结构的依赖：

- 不再是 `activeBlock.handle.block`
- 而是 `activeBlock.snapshot`

这意味着后面如果继续把 pane resize runtime root 收口成更稳定的 owned object，consumer 已经不会再被 `handle` 当中的旧层级结构拖住。

换句话说，这一步是在让：

- `active block` 从“新的名字 + 旧的嵌套”
- 变成“真正可消费的 runtime contract”

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-resize-block-owner.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts tests/unit/chart-pane-runtime.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有新增 linked-resize 用户行为
- active resize block 还没有升级成 identity-bearing runtime root
- 这一步先把 active block 从“包着旧 handle 的外壳”继续压成更直接的 runtime contract
