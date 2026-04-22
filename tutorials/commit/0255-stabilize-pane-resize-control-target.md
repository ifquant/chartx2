# 0255: 在 pointer-down 时固定 pane resize 的 controlled target

前一笔 `0254` 已经把 secondary-secondary divider 的语义补完整了：

- divider hit-test 不再只认 upper secondary
- clamp policy 也开始区分：
  - primary-secondary
  - secondary-secondary

但那之后还有一个状态层面的脆点：

- pointer-down 时只记住 divider 两侧 pane 和起始高度
- pointer-move 时再重新推断到底谁是 controlled pane

这意味着拖拽 contract 仍然不是完全显式的。

## 1. 之前的问题是什么

当前 resize state 只保存：

- `dividerAfterPaneId`
- `dividerBeforePaneId`
- `startUpperHeight`
- `startLowerHeight`

所以 move 阶段真正要执行 resize 时，还得再跑一遍：

- 哪一侧是可调的 secondary pane

这在语义简单时还能勉强工作，但在我们已经补上：

- secondary-secondary divider
- lower pane controllable
- stale hint 需要校验

之后，就变成一条不必要地反复推断的路径。

更稳的 contract 应该是：

- pointer-down 既然已经确定这个 divider 可以开始 drag
- 那就应该顺手把 controlled pane 一次性确定下来

后续 pointer-move 只执行，不再重复“猜控制侧”。

## 2. 这次改了什么

### A. `PaneResizeState`

在 `chart-view-state.ts` 里，`PaneResizeState` 新增：

- `controlledPaneId`

这样 resize state 不再只是“某个 divider 开始拖了”，而是：

- 哪个 divider
- 哪个 pane 在这次 drag 中是 controlled pane

### B. `chart-pointer-runtime.ts`

pointer-down 现在在设置 `paneResizeState` 之前，会先调用：

- `resolveControlledPaneId(upperPaneId, lowerPaneId)`

只有确定了 control target，才会真正进入 pane resize drag 状态。

所以 resize contract 的决定点被前移到了 pointer-down。

### C. `chart-interaction-handlers.ts`

interaction handlers 现在引入 `chart-pane-layout-policy-owner`，专门用它来解析：

- `resolveControlledPaneId(...)`

这样 pointer path 不用自己重复写 pane policy 逻辑。

### D. `chart-pane-layout-policy-owner.ts`

`controlledPaneId` 现在只是一个 validated hint，不是无条件信任值：

- 如果它指向当前仍然有效、且可调的 secondary pane，就直接用
- 如果它已经失效或和当前 pane 语义不一致，就回退到 policy owner 的实时解析
- 如果两者都不成立，就拒绝继续 resize

这样既保留了“pointer-down 固定 control target”的稳定性，也不会把 stale state 硬套进当前 runtime。

## 3. 为什么这一步值得单独一笔

这笔不是再补一个字段而已。

它真正收紧的是 resize interaction contract：

- pointer-down 决定 control target
- pointer-move 执行 control target

把“决定”与“执行”分开后，后面如果继续扩 richer resize rule，就不会再把 control-target 解析散在多个时机里。

## 4. 测试

这次补跑的测试覆盖了这条 contract：

- `tests/unit/chart-pointer-runtime.test.ts`
  - 锁住 pointer-down 会把 `controlledPaneId` 放进 resize state
- `tests/unit/chart-view-state.test.ts`
  - 锁住 view state 能持有新的 resize state 结构
- `tests/unit/chart-pane-layout-policy-owner.test.ts`
  - 锁住 `controlledPaneId` 作为 validated hint 的语义
- `tests/unit/chart-pane-runtime.test.ts`
- `tests/unit/chart-pane-layout-runtime-owner.test.ts`
- `tests/unit/chart-pane-owner.test.ts`
  - 锁住下游 resize 执行链路能继续消费这份状态

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有改 pane frame allocation 算法
- 没有扩展 richer multi-pane linked resize policy
- 没有开始 multi-layout / host-level layout ownership
