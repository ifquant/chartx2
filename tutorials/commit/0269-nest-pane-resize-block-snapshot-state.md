# 0269: 把 pane resize state 收成显式 block snapshot object

上一笔 `0268` 已经把 pane resize 的共享组合边界收成了：

- [chart-pane-resize-block-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-resize-block-owner.ts)

但当时还有一个明显的结构问题没收：

- `PaneResizeState` 还是一堆散字段
- `controlledPaneId`
- `blockPaneIds`
- `startControlledHeight`
- `startVariableSpan`
- `minOpposingHeight`

虽然这些字段在语义上其实都属于同一件事：

- “pointer-down 时冻结下来的 block snapshot”

如果还把它们散着挂在 state 顶层，后面继续做 pane block ownership 时，runtime 还是会被迫把这些字段当作松散约定来搬运。

这次就是把这层真正收成对象。

## 1. 新的 state 形状

现在 pane resize interaction state 不再长这样：

- `dividerAfterPaneId`
- `dividerBeforePaneId`
- `controlledPaneId`
- `blockPaneIds`
- `startClientY`
- `startControlledHeight`
- `startVariableSpan`
- `minOpposingHeight`

而是变成：

- `dividerAfterPaneId`
- `dividerBeforePaneId`
- `startClientY`
- `block`

其中 `block` 本身是显式 snapshot object：

- `controlledPaneId`
- `blockPaneIds`
- `startControlledHeight`
- `startVariableSpan`
- `minOpposingHeight`

也就是说：

- divider 信息仍然是 interaction state 自己的
- block snapshot 则不再是散字段，而是一个真正的子对象

## 2. pointer-down 也开始直接构造完整 state

这次不只改了 state 类型，还把 pointer-down 的 state 构建也收进了：

- [chart-pane-resize-block-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-resize-block-owner.ts)

新增的是：

- `resolvePaneResizeState(...)`

它现在一步负责：

1. 找 controlled pane
2. 生成 block snapshot
3. 组装出完整的 nested interaction state

这样 [chart-pointer-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pointer-runtime.ts) 就不再自己拼：

- `controlledPaneId`
- `blockPaneIds`
- `start*`

而是直接拿 owner 给出的完整 resize state。

## 3. move-time policy 现在怎么消费它

在：

- [chart-pane-layout-policy-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts)

里，move-time 现在统一走：

- `resizeState.block.startControlledHeight`
- `resizeState.block.startVariableSpan`
- `resizeState.block.minOpposingHeight`

而不是继续在 state 顶层抓散字段。

这件事看起来像是机械整理，但它其实很关键，因为：

- pane resize 的 block snapshot
- 现在终于被 runtime 明确承认为“一份对象”
- 而不再只是“几项恰好相关的字段”

## 4. 为什么这一步值得单独提交

这次仍然没有新增 linked-resize 用户行为。

它的价值是 ownership 准备：

- pane resize shared owner 已经有了
- grouping 已经有了
- validated block surface 已经有了

如果 state 还是散字段，后面的 ownership root 仍然会被旧形状拖住。

把 state 收成 `block` object 之后，下一步要继续推：

- block handle
- block snapshot object
- block ownership root

都会顺得多。

## 5. 测试

更新了：

- [chart-pointer-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pointer-runtime.test.ts)
- [chart-view-state.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-view-state.test.ts)
- [chart-pane-resize-block-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-resize-block-owner.test.ts)
- [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts)
- [chart-pane-layout-runtime-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-runtime-owner.test.ts)
- [chart-pane-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-owner.test.ts)
- [chart-pane-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-runtime.test.ts)

重点验证：

- pointer-down 会直接写入完整 nested resize state
- move-time 仍然能正确消费 nested block snapshot
- view-state / pane runtime / pane owner 都已经切到新的 state contract

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-resize-block-owner.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check`

## 未包含

- 没有新增 linked-resize 用户行为
- 还没有把 pane resize state 进一步升级成 block handle 或更独立的 ownership root
- 这一步先收的是 nested snapshot state contract，不是最终 block ownership 终态
