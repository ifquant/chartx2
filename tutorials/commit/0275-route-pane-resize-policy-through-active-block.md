# 0275: 让 pane resize move-time policy 直接吃 active block

上一笔 `0274` 已经把 pointer-down 交互状态改成了：

- `startClientY + activeBlock`

这意味着 move-time runtime 手里拿到的已经不是：

- 一个需要再恢复 active block 的 handle

而是：

- 一个已经验证过的 `PaneActiveResizeBlock`

但当时真正做 controlled resize math 的链路还是：

1. `pane runtime` 从 state 里拿 `activeBlock.handle`
2. `pane-layout policy owner` 继续吃 `resizeHandle`
3. `pane-resize-block owner` 再基于 handle 走 controlled resize math

这会留下一个明显的 ownership 回退：

- pointer-down 已经把 active block 解出来了
- move-time 却还是把逻辑重新压回 handle contract

所以这一步就是把 move-time 这条链补齐。

## 1. 这次具体改了什么

在：

- [chart-pane-resize-block-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-resize-block-owner.ts)

`resolveControlledResizeHeight(...)` 不再接：

- `PaneResizeHandle | null`

而是改成直接接：

- `PaneActiveResizeBlock | null`

这样 owner 不再需要在 resize math 入口重新调用：

- `resolveActiveResizeBlock(...)`

它现在假定：

- 如果调用者要算 move-time controlled resize height
- 那么调用者必须已经握有一个 validated active block

这就是更清晰的 runtime contract。

## 2. pane-layout policy owner 为什么也要跟着改

在：

- [chart-pane-layout-policy-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts)

`resolveControlledResizeHeight(...)` 也同步从：

- `resizeHandle`

改成：

- `activeResizeBlock`

这样 `pane-layout policy owner` 自己也不再假装还拥有：

- handle -> active block 的恢复职责

它现在只负责：

- pane-layout 语义上的 normalize 和 controlled resize forwarding

而不会把 pointer/runtime 已经做完的 active-block 解析再做一遍。

## 3. move-time runtime 现在怎么走

在：

- [chart-pane-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-runtime.ts)

现在 controlled resize 主路径变成：

1. `clientY - startClientY`
2. `resizeState.activeBlock`
3. `paneLayoutPolicyOwner.resolveControlledResizeHeight(...)`

也就是说，move-time runtime 不再绕回：

- `resizeState.activeBlock.handle`

去重新触发一层 handle-based 协调。

这一点很重要，因为它让 move-time path 和 pointer-down path 围绕的是同一个 runtime artifact：

- `PaneActiveResizeBlock`

而不是 pointer-down 用 active block，move-time 又退回 handle。

## 4. 为什么测试也要随之改口径

之前 [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts) 里还有一条测试，口径更接近：

- move-time policy 自己还要对 block membership 做最终拒绝

但这一步之后，这条边界已经不是 policy owner 的职责了。

新的 contract 是：

- block validation 发生在更上游的 active-block 解析阶段
- policy owner 只消费 validated active block

因此测试也改成了新的事实：

- policy owner 把 `active block` 当作 move-time 的已验证合同

如果后续要测试“无效 block 要被拒绝”，那应该落在：

- active block 解析
- pointer-down state 建立
- 或更上游的 runtime owner

而不是重新塞回 move-time policy。

## 5. 这一步的真正价值

这一步没有增加任何新的 linked-resize 用户行为。

它的价值是继续把 pane resize runtime root 收紧：

- pointer-down state 持有 `activeBlock`
- move-time runtime 传递 `activeBlock`
- resize math 直接消费 `activeBlock`

这样 runtime contract 就不再在中途回退到旧的 handle 形状。

换句话说，这一步不是在加功能，而是在让：

- pointer-down ownership
- move-time ownership
- resize math ownership

终于围绕同一个 runtime object 对齐。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-resize-block-owner.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有新增 linked-resize 用户行为
- active resize block 还没有升级成 identity-bearing runtime root
- block validation 还没有进一步从 active-block parsing 再往更稳定的 owned root 收口
