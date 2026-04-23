# 0267: 给 pane resize block 补显式 grouping

上一笔 `0266` 已经让 move-time resize 真正开始信任 pointer-down 的 block state。

但到那一步为止，block model 仍然有一个明显空洞：

- 它知道 `controlledPaneId`
- 它知道 `opposingPaneId`
- 它知道 `blockPaneIds`

可它还不知道：

- 哪些 pane 真正参与这次 resize group
- 哪些 pane 只是固定中间层
- 哪些 pane 才是实际的 variable span

这在 downstream linked-resize 里会非常别扭。

因为 downstream case 的真实结构其实是：

- `primary` 是 opposing variable pane
- 最下游 resizable pane 是 controlled variable pane
- 中间 fixed panes 只是参与 block，但不属于 variable span

如果没有显式 grouping，这个结构只能靠 snapshot 公式和条件分支去隐式表达。

这次就是把这层补成模型。

## 1. 新增了什么模型

核心改动还在：

- [pane-resize-block-policy.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/pane-resize-block-policy.ts)

这次新增了：

- `PaneResizeGroup`

字段是：

- `controlledPaneId`
- `opposingPaneId`
- `blockPaneIds`
- `participatingPaneIds`
- `variablePaneIds`
- `fixedPaneIds`
- `mode`

其中最关键的三组是：

- `participatingPaneIds`
  这次 resize group 实际覆盖哪些 pane
- `variablePaneIds`
  真正构成 variable span 的 pane
- `fixedPaneIds`
  参与 block 但不参与 variable span 的固定 pane

## 2. downstream case 现在终于能被说清楚

以下面这个 case 为例：

- `primary`
- `pane-1` fixed
- `pane-2` fixed
- `pane-3` resizable

如果 divider 在 `pane-1 / pane-2` 之间，但控制权被委托给 `pane-3`，现在模型会明确给出：

- `blockPaneIds = ["pane-1", "pane-2", "pane-3"]`
- `participatingPaneIds = ["primary", "pane-1", "pane-2", "pane-3"]`
- `variablePaneIds = ["primary", "pane-3"]`
- `fixedPaneIds = ["pane-1", "pane-2"]`

这比以前清楚很多，因为：

- fixed middle panes 不再只是“出现在 blockPaneIds 里”
- 它们现在被明确归类成 `fixedPaneIds`

## 3. 这次不只是加类型

这次不只是多了一个模型类型，还把现有逻辑接到了 grouping 上。

### 3.1 snapshot 现在走 grouping

`resolvePaneResizeBlockSnapshot(...)` 现在不再直接假设：

- variable span 永远就是 `controlled + opposing`

而是先把 block 提升成 group，再通过：

- `variablePaneIds`

去求 `startVariableSpan`。

这让 snapshot 公式终于依赖显式 grouping，而不是依赖“调用方记得 downstream 只算 primary + controlled”。

### 3.2 move-time policy 也走 grouping

在：

- [chart-pane-layout-policy-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts)

里，move-time resize 现在也不再用：

- `controlledPane.id === resizeBlock.upperPaneId`

这种比较去隐式判断 delta 方向。

而是先把 block 转成 group，再用：

- `variablePaneIds`

来判断 controlled pane 在 variable span 里的位置。

也就是说：

- grouping 不只是“为了以后”
- 它已经进入当前 runtime 决策了

## 4. 为什么这是 pane block model 的下一刀

前几笔分别解决了：

- target resolution
- block snapshot
- explicit block contract
- block member ids
- pointer state validation

这次解决的是：

- block 内部结构的显式分层

也就是：

- “哪些 pane 属于 block”
- “哪些 pane 只是固定参与者”
- “哪些 pane 才是真正可变边界”

如果没有这一步，后面谈 pane block ownership 其实还是会退回到 ad-hoc 判断。

## 5. 测试

更新了：

- [pane-resize-block-policy.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/pane-resize-block-policy.test.ts)

新增覆盖：

- adjacent group 的 `participating/variable/fixed` 结构
- downstream group 的 `participating/variable/fixed` 结构

并继续补跑：

- [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts)
- [chart-pane-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-runtime.test.ts)
- [chart-pointer-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pointer-runtime.test.ts)

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/pane-resize-block-policy.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pointer-runtime.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check`

## 未包含

- 没有新增 linked-resize 用户行为
- 还没有把 grouping 继续提升成独立的 pane block ownership/runtime owner
- 这一步仍然只是在 model-layer 和现有 runtime policy 中把 block grouping 显式化
