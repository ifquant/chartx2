# 0265: 给 pane resize block 补显式成员 pane 列表

上一笔 `0264` 已经把 resize block 收成了显式模型：

- `controlledPaneId`
- `opposingPaneId`
- `mode`

这比更早期那种“靠条件分支现推断 block 语义”的写法已经干净很多。

但它还少一件事：

- block 知道“谁控制”
- block 知道“谁对抗”
- 可 block 还不知道“自己到底包含哪些 pane”

这在 adjacent case 里问题不大，因为 block 天然就是两块 pane。

但在 downstream linked-resize 里，真实 block 不是只有两端：

- 上面那个 divider 所在的 upper pane
- 中间若干 fixed pane
- 最下游真正接手 resize 的 controlled pane

如果模型只保留 `controlled/opposing` 两个端点，固定中间 pane 还是会被藏在实现细节里。

这次就把这层也补上。

## 1. 为什么只靠 `controlled/opposing` 还不够

在 downstream case 里，当前 block 的真实含义其实是：

- 从 `upperPaneId` 开始
- 一直到 `controlledPaneId` 结束
- 中间所有 pane 都属于这次 linked-resize 的活动块

举个例子：

- `primary`
- `pane-1` fixed
- `pane-2` fixed
- `pane-3` resizable

如果用户拖的是 `pane-1 / pane-2` 之间的 divider，而最终控制权被委托给 `pane-3`，那么这次 block 真正相关的是：

- `pane-1`
- `pane-2`
- `pane-3`

不是只有：

- `controlledPaneId = pane-3`
- `opposingPaneId = primary`

后者能支持 clamp 计算，但还不足以表达 block membership。

## 2. 这次补了什么

核心改动在：

- [pane-resize-block-policy.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/pane-resize-block-policy.ts)

现在 `PaneResizeBlock` 多了：

- `blockPaneIds: readonly string[]`

`PaneResizeBlockSnapshot` 也同步多了：

- `blockPaneIds: readonly string[]`

语义是：

- adjacent case：就是 `[upperPaneId, lowerPaneId]`
- downstream case：就是从 `upperPaneId` 到 `controlledPaneId` 的整段 pane id 列表

这意味着 resize block 现在不再只是“哪一侧可变、哪一侧对抗”，而是能明确说出“这次 block 覆盖哪些 pane”。

## 3. pointer-down state 为什么也要带上它

这次不只改 model policy，还把 `blockPaneIds` 往 pointer-down resize state 继续传了：

- [chart-pointer-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pointer-runtime.ts)
- [chart-view-state.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-view-state.ts)

以及相关 owner/runtime 的 `PaneResizeStateLike` 契约也一起补齐了：

- [chart-pane-layout-policy-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts)
- [chart-pane-runtime.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-runtime.ts)
- [chart-pane-layout-runtime-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-runtime-owner.ts)
- [chart-pane-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-owner.ts)

原因很直接：

- block membership 既然已经在 pointer-down 时被解析出来
- 就不该只停留在 model 函数的局部返回值里

把它放进 resize state，后面如果继续做：

- richer linked-resize policy
- block-aware debug/readout
- 真正的 pane block grouping

就不需要再临时回溯当前 block 包含哪些 pane。

## 4. 这一步的性质

这次仍然没有新增 linked-resize 的用户行为。

它的价值是结构性的：

- resize block 从“显式端点”
- 继续变成“显式成员集合”

所以这是 pane block model 的继续收口，不是新交互功能。

## 5. 测试

更新了：

- [pane-resize-block-policy.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/pane-resize-block-policy.test.ts)
- [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts)
- [chart-pane-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-runtime.test.ts)
- [chart-pointer-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pointer-runtime.test.ts)
- [chart-view-state.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-view-state.test.ts)
- [chart-pane-layout-runtime-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-runtime-owner.test.ts)
- [chart-pane-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-owner.test.ts)

重点覆盖：

- adjacent block 的 `blockPaneIds`
- downstream block 的 `blockPaneIds`
- pointer-down resize state 现在会持有整份 block 成员信息

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/pane-resize-block-policy.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有新增 linked-resize 用户行为
- 没有开始真正的 pane block grouping / block ownership
- `blockPaneIds` 目前还主要是状态契约，不是新的 runtime policy 输入
