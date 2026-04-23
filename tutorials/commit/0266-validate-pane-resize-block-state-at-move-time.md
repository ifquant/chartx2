# 0266: 让 move-time resize 真正消费 pointer-down 的 block state

上一笔 `0265` 已经把 `blockPaneIds` 带进了 pointer-down resize state。

但那一笔还有一个明显缺口：

- state 里虽然有了 block 成员信息
- move-time resize policy 实际上却没有用它

拖拽时的逻辑仍然会回到 divider 本身，再重新推一次：

- controlled pane 是谁
- 当前应该按 upper 还是 lower 语义算 delta

这会让 `blockPaneIds` 变成“写进 state 但不参与决策”的半成品。

这次就是把这层补完。

## 1. 之前的问题是什么

在：

- [chart-pane-layout-policy-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts)

里，`resolveControlledResizeHeight(...)` 之前会这样做：

1. 从 `dividerAfterPaneId / dividerBeforePaneId` 找上下两块 pane
2. 如果 `controlledPaneId` 正好还是相邻的一块 pane，就直接沿用
3. 否则再调用 `resolveControlledPaneId(...)`，重新从当前 divider 语义推一次 target

这意味着：

- pointer-down 时冻结下来的 block contract
- 在 move-time 没有真正被当作 authoritative input

如果 block membership 已经漂移，move-time 仍然可能继续 resize。

## 2. 这次补成了什么

核心改动在：

- [pane-resize-block-policy.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/pane-resize-block-policy.ts)
- [chart-pane-layout-policy-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts)

model 层新增了：

- `resolvePaneResizeBlockFromState(...)`

它的工作是：

1. 用当前 `dividerAfterPaneId / dividerBeforePaneId / controlledPaneId`
   先重建一份 canonical resize block
2. 再把 canonical block 的 `blockPaneIds`
   和 pointer-down state 里冻结下来的 `blockPaneIds` 逐项比对
3. 只有完全一致，才承认这份 state 仍然有效

换句话说：

- move-time 现在不再只是“看 divider 还能不能推导出某个 controlled pane”
- 而是“当前 block 仍然必须和 pointer-down 时冻结的 block 一致”

## 3. move-time policy 现在怎么变了

`resolveControlledResizeHeight(...)` 现在不再回退到：

- `resolveControlledPaneId(...)`

去重新猜 target。

它现在直接：

1. `resolvePaneResizeBlockFromState(...)`
2. 校验 block membership 没漂
3. 从这个 validated block 里拿：
   - `controlledPaneId`
   - `upperPaneId`
4. 再决定本次 delta 是加还是减

这样 `blockPaneIds` 才真正从：

- “状态描述字段”

变成：

- “运行时 correctness 输入”

## 4. 为什么这一步值得单独提交

这次仍然没有新增 linked-resize 用户行为。

但它把 pane block model 从“有显式 state”推进到了“state 真正被消费”。

这一步之后，后面要继续做：

- pane block grouping
- block ownership
- 更复杂的 linked-resize contract

就不需要再先解决“pointer-down state 到底算不算 authoritative”这个边界问题。

## 5. 测试

新增/更新的重点测试：

- [pane-resize-block-policy.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/pane-resize-block-policy.test.ts)
- [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts)

新增覆盖：

- pointer state 和 canonical block 一致时，能从 state 重建有效 resize block
- `blockPaneIds` 漂移时，即使 divider 还能重新推导 target，也会拒绝继续 resize

并继续补跑 linked-resize 相关链路：

- [chart-pane-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-runtime.test.ts)
- [chart-pointer-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pointer-runtime.test.ts)
- [chart-view-state.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-view-state.test.ts)
- [chart-pane-layout-runtime-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-runtime-owner.test.ts)
- [chart-pane-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-owner.test.ts)

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/pane-resize-block-policy.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check`

## 未包含

- 没有新增 linked-resize 用户行为
- 没有开始 pane block grouping / block ownership 的更高层模型
- 这一步只是让 pointer-down block state 成为 move-time 的 authoritative correctness input
