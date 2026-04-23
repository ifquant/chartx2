# 0263: 把 pointer resize state 收成 pane resize block snapshot

前面几笔已经把 linked-resize 的 target 解析和 clamp 规则逐步补起来了：

- `0258` primary divider 可以代理 downstream resizable pane
- `0259` downstream clamp 不再错误使用 fixed intermediary span
- `0260` fixed secondary-secondary divider 也能代理 downstream resizable pane
- `0262` target-resolution 已经收成 shared model policy

但 move-time resize policy 还留着一个结构问题：

- pointer-down 虽然已经能选对 controlled pane
- 可 state 里存的仍然是
  - `startPrimaryHeight`
  - `startUpperHeight`
  - `startLowerHeight`
  - `startControlledHeight`
- move-time 再根据当前 case 去猜
  - 哪两个 pane 才是这次 resize 的真实 variable span
  - 对侧的 minimum height 应该取 primary 还是 controlled minimum

这还是一种 ad-hoc 公式，不是显式模型。

这次就是把它再往前推一刀：

- pointer-down 先把 resize block snapshot 算好
- move-time 只消费这份 snapshot

## 1. 之前为什么还是不够稳

之前 `chart-pane-layout-policy-owner.ts` 里的 `resolveControlledResizeHeight(...)` 已经能处理 generalized downstream linked resize，但仍然依赖多组 start fields：

- `startPrimaryHeight`
- `startControlledHeight`
- `startUpperHeight`
- `startLowerHeight`

然后再在 move-time 分支里判断：

- 是相邻上侧控制？
- 是相邻下侧控制？
- 还是 downstream controlled？

再据此拼：

- `totalResizableSpan`
- `minOpposingHeight`

这虽然能工作，但语义上还是“每次 move 时重建 block 模型”。

## 2. 这次提成了什么

新加了 model-layer helper：

- [pane-resize-block-policy.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/pane-resize-block-policy.ts)

核心函数：

- `resolvePaneResizeBlockSnapshot(...)`

它在 pointer-down 阶段一次性产出：

- `controlledPaneId`
- `startControlledHeight`
- `startVariableSpan`
- `minOpposingHeight`

也就是说：

- 这次 resize 的真实可变 span 是多少
- 对侧最小高度是多少

这两个最关键的 block 语义，不再延迟到 move-time 去猜。

## 3. 哪些地方接过去了

### A. `chart-pointer-runtime.ts`

pointer-down 不再自己塞一堆原始 height 字段，而是改成：

- 先通过 `resolvePaneResizeBlock(...)`
- 拿到 block snapshot
- 再把这份 snapshot 写进 `paneResizeState`

### B. `chart-view-state.ts`

`PaneResizeState` 现在改成更接近 block contract：

- `startControlledHeight`
- `startVariableSpan`
- `minOpposingHeight`

已经不再继续保留：

- `startPrimaryHeight`
- `startUpperHeight`
- `startLowerHeight`

### C. `chart-pane-layout-policy-owner.ts`

move-time policy 现在只需要：

- 根据 controlled pane 在上侧还是下侧决定 delta 方向
- 用 `startVariableSpan - minOpposingHeight` 算 maxControlled

它已经不再负责重新解释“哪两块 pane 才是这次 resize block”。

## 4. 为什么这一步重要

这一笔没有新增用户行为，但它让 linked-resize 语义真正往“显式 block model”靠了一步。

从现在开始：

- target 解析是单独 policy
- block snapshot 也是单独 policy
- move-time policy 只是消费 block

这比之前的结构更适合后面继续做：

- richer linked resize
- pane block grouping
- 更复杂的 downstream grouping 或 block ownership

因为核心 block 语义已经不再埋在 pointer 和 runtime 之间的临时字段里了。

## 5. 测试

新增：

- [pane-resize-block-policy.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/pane-resize-block-policy.test.ts)

覆盖：

- 相邻 primary-secondary block
- downstream linked-resize block
- stale controlled target 时返回 `null`

同时补跑了相关链路测试：

- `pane-linked-resize-policy.test.ts`
- `pane-model.test.ts`
- `chart-pane-layout-policy-owner.test.ts`
- `chart-pane-runtime.test.ts`
- `chart-pointer-runtime.test.ts`
- `chart-view-state.test.ts`
- `chart-pane-layout-runtime-owner.test.ts`
- `chart-pane-owner.test.ts`

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/pane-resize-block-policy.test.ts tests/unit/pane-linked-resize-policy.test.ts tests/unit/pane-model.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/chart-view-state.test.ts tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有新增 linked-resize 用户行为
- 没有改 browser-level regression
- 还没有开始真正的 pane block grouping / block ownership 模型
