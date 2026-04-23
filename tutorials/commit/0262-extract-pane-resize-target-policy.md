# 0262: 把 linked-resize target 解析收成 model-layer policy

前面几笔 `0258` 到 `0261` 已经把 pane/layout 里的 linked resize 做到了一个更完整的行为面：

- primary divider 可以代理 downstream resizable pane
- fixed secondary-secondary divider 也可以代理 downstream resizable pane
- clamp 已经改成按 `primary + controlled` 的真实可变 span 算
- browser 级回归也已经补上

但还有一个结构问题没收：

- `pane-model.ts`
  - 自己在判断 divider 是否 interactive
- `chart-pane-layout-policy-owner.ts`
  - 自己又实现了一套 controlled target 解析

两边虽然现在碰巧一致，但它们其实都在重复同一个规则：

- “这个 divider 最终应该由哪个 pane 来接手 resize”

这就是一个典型会慢慢漂掉的点。

## 1. 之前重复在哪里

### A. `pane-model.ts`

这里做的是 hit-test 入口：

- divider 是否可交互

判断标准其实已经不只是：

- 相邻 pane 有没有 resizable side

而是：

- 相邻 pane 没有时，是否还能在 downstream 找到 resizable secondary pane

### B. `chart-pane-layout-policy-owner.ts`

这里做的是 runtime policy：

- `resolveControlledPaneId(...)`

它也要回答几乎同一个问题：

- 真正应该被 resize 的 pane 是谁

如果两边以后分别演进，很容易出现一种坏状态：

- divider hit-test 说“可以拖”
- move-time policy 却说“没有 controlled pane”

或者反过来。

## 2. 这次提成了什么

新加了 model-layer helper：

- [pane-linked-resize-policy.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/pane-linked-resize-policy.ts)

里面只做一件事：

- `resolvePaneResizeTargetId(...)`

输入是：

- 当前 pane 列表
- divider 的 `upperPaneId`
- divider 的 `lowerPaneId`

输出是：

- 应该接手 resize 的 pane id
- 或 `null`

这条规则现在统一包含三层语义：

1. 优先相邻 resizable secondary pane
2. 相邻两侧都 fixed 时，向下扫描第一个 downstream resizable secondary pane
3. 如果下面根本没有 resizable secondary pane，就返回 `null`

## 3. 哪些地方接过去了

### A. `pane-model.ts`

`resolvePaneDivider(...)` 不再自己重复判断：

- upper 是否 resizable
- lower 是否 resizable
- downstream 是否存在 resizable pane

现在直接看：

- `resolvePaneResizeTargetId(...) !== null`

这样 divider 是否 interactive 的规则就和 runtime target policy 统一了。

### B. `chart-pane-layout-policy-owner.ts`

`resolveControlledPaneId(...)` 也不再自己扫描 pane list。

现在直接调用同一个：

- `resolvePaneResizeTargetId(...)`

这意味着：

- hit-test 入口
- runtime controlled target 解析

终于共享了一条真正单一的规则。

## 4. 为什么这一步值得单独提交

这次没有新增 pane 行为，也没有改 public API。

但它消掉了一个非常危险的结构风险：

- 同一条 linked-resize 语义
- 之前在 model 和 policy owner 里各实现一遍

一旦后面继续做 richer linked resize，比如：

- pane block model
- 更复杂的 downstream grouping
- 额外的 clamp source

如果 target-resolution 还分散着，两边很快就会失同步。

这次把它收成 model-layer policy，本质上是在给后面的 pane/layout 语义继续扩展打地基。

## 5. 测试

新增：

- [pane-linked-resize-policy.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/pane-linked-resize-policy.test.ts)

覆盖：

- 相邻 resizable pane 优先
- fixed/fixed divider 向下游找第一个 resizable pane
- 下方没有 resizable pane 时返回 `null`

同时补跑：

- `pane-model.test.ts`
- `chart-pane-layout-policy-owner.test.ts`
- `chart-pane-runtime.test.ts`

确认旧路径仍然一致。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/pane-linked-resize-policy.test.ts tests/unit/pane-model.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有新增 linked-resize 用户行为
- 没有改 browser-level regression
- 没有开始 pane block model 或更复杂的 multi-pane resize grouping
