# 0264: 给 pane resize block 补显式 `controlled/opposing/mode` 模型

上一笔 `0263` 已经把 pointer-down resize state 收成了 block snapshot：

- `startControlledHeight`
- `startVariableSpan`
- `minOpposingHeight`

这比原先的：

- `startPrimaryHeight`
- `startUpperHeight`
- `startLowerHeight`

干净很多，但还有一个问题：

- snapshot 里虽然已经没有那些 ad-hoc 字段了
- 可 block snapshot 自己在生成时，还是会隐含判断
  - 是 adjacent upper？
  - 是 adjacent lower？
  - 还是 downstream？

换句话说：

- “这次 resize block 到底由哪两个 pane 组成”

还不是一个显式模型对象。

这次就是把它再往前提一层。

## 1. 之前缺的是什么

在 `pane-resize-block-policy.ts` 里，`resolvePaneResizeBlockSnapshot(...)` 之前直接：

- 接收 `upperPaneId / lowerPaneId / controlledPaneId`
- 再通过条件判断，推断：
  - `controlsUpperPane`
  - `downstreamControlled`
  - 应该拿哪个 frame 作为 opposing side

虽然最后产物已经是 snapshot，但 block 本身仍然是隐式的。

这会让后面更复杂的 pane block grouping 难以继续扩，因为：

- 先要还原 block
- 再才能在 block 上做事情

## 2. 这次提成了什么

还是在：

- [pane-resize-block-policy.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/pane-resize-block-policy.ts)

这次新增了显式 block 模型：

- `PaneResizeBlock`

字段是：

- `upperPaneId`
- `lowerPaneId`
- `controlledPaneId`
- `opposingPaneId`
- `mode`

其中 `mode` 现在明确区分三类：

- `adjacent-upper`
- `adjacent-lower`
- `downstream`

也就是说，这次真正把“block 是什么”先变成了模型对象。

## 3. 现在 snapshot 怎么来

新的关系变成：

1. `resolvePaneResizeTargetId(...)`
   - 决定 controlled pane 是谁
2. `resolvePaneResizeBlock(...)`
   - 决定 block 由谁控制、谁是 opposing side、属于哪种模式
3. `resolvePaneResizeBlockSnapshot(...)`
   - 只根据 block 去算：
     - `startControlledHeight`
     - `startVariableSpan`
     - `minOpposingHeight`

这比以前更干净，因为：

- target 解析
- block 结构
- snapshot 数值

三者终于分层了。

## 4. 为什么这一步值得单独提交

这次没有新增 linked-resize 用户行为。

它的价值在于：

- downstream / adjacent 这三种 case
- 不再只是 if/else 里的分支知识
- 而是先变成了一个显式 model contract

这样后面如果真的要继续做：

- pane block grouping
- richer multi-pane linked resize
- block ownership

就不需要再从 snapshot 或 pointer state 里反推 block。

## 5. 测试

`pane-resize-block-policy.test.ts`

这次新增覆盖：

- adjacent primary-secondary block
- adjacent secondary-secondary block
- downstream block
- stale controlled target 拒绝

同时继续补跑和 linked-resize 直接相关的 unit：

- `chart-pane-layout-policy-owner.test.ts`
- `chart-pane-runtime.test.ts`
- `chart-pointer-runtime.test.ts`

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/pane-resize-block-policy.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pointer-runtime.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有新增 linked-resize 用户行为
- 没有改 browser-level regression
- 还没有实现真正的 pane block grouping / block ownership，只是把 block contract 显式化
