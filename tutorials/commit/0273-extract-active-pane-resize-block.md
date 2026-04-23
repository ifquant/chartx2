# 0273: 给 pane-resize-block owner 补显式 active resize block

上一笔 `0272` 已经把 controlled resize math 收回到了：

- [chart-pane-resize-block-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-resize-block-owner.ts)

这比之前 `chart-pane-layout-policy-owner` 自己握着公式已经干净很多。

但当时还有一个结构问题：

- owner 里还是先临时拿 validated group
- 再临时找 controlled pane
- 再临时判断 `controlsUpperPane`
- 然后立即算高度

也就是说：

- “当前这个有效 resize block 到底是什么”

还不是一个显式 runtime object，而是一次方法调用里临时拼出来的几段值。

这次就是把它再提一层。

## 1. 新增了什么

在：

- [chart-pane-resize-block-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-resize-block-owner.ts)

这次新增了：

- `PaneActiveResizeBlock`

它显式包含：

- `handle`
- `group`
- `controlledPaneId`
- `controlsUpperPane`

也就是说，现在 owner 能明确给出：

- 当前 handle 对应的 validated group 是什么
- 实际 controlled pane 是谁
- 拖动方向是按 upper 还是 lower 语义解释

这不再只是临时算出来的中间变量。

## 2. 现在 resize math 怎么用了它

`resolveControlledResizeHeight(...)` 现在不再自己临时：

- `resolvePaneResizeGroup(...)`
- 再找 controlled pane
- 再算 `controlsUpperPane`

而是先拿：

- `resolveActiveResizeBlock(...)`

之后才基于这个 active block 算：

- `requestedHeight`
- `maxControlled`
- `nextHeight`

所以当前链路变成：

1. handle
2. active resize block
3. controlled resize height

这比以前更像一个真正的 runtime-owned surface。

## 3. 为什么这一步值得单独提交

这次没有新增 linked-resize 用户行为。

它的价值在于 ownership 继续显式化：

- `group` 已经是显式模型
- `handle` 已经是显式 payload
- 现在 `active resize block` 也变成了显式 runtime artifact

这样后面如果继续往“pane resize runtime root”推进，就不需要再在 owner 内部反复重建：

- validated group
- controlled pane
- control direction

这些 runtime 决策点已经开始汇聚到一个对象上了。

## 4. 测试

更新了：

- [chart-pane-resize-block-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-resize-block-owner.test.ts)

新增覆盖：

- 从 handle 解析 active resize block
- active resize block 明确暴露 `group + controlledPaneId + controlsUpperPane`
- controlled resize math 继续建立在这份 active block 之上

并继续补跑：

- [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts)
- [chart-pane-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-runtime.test.ts)

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-resize-block-owner.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pane-runtime.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check`

## 未包含

- 没有新增 linked-resize 用户行为
- 还没有把 active resize block 升级成更稳定的 identity-bearing runtime root
- 这一步先把“validated group + controlled pane + control direction”收成一个 owned runtime object
