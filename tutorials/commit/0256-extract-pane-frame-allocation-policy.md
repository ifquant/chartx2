# 0256: 把 pane frame allocation 收成独立 policy

`pane/layout` 这条线前几笔主要收的是：

- divider geometry
- pane height runtime glue
- pane resize policy
- resize control target

但 `buildPaneFrames(...)` 里还剩一块没有被单独命名的规则：

- secondary pane 如何缩放
- primary pane 如何保底
- rounding remainder 最终落到哪里

这块之前都埋在 `pane-model.ts` 里。

## 1. 之前的问题是什么

`buildPaneFrames(...)` 之前同时做了几件事：

1. 计算 secondary `preferredHeight` 总量
2. 如果超出 primary 最小高度约束，就给 secondary 做统一缩放
3. 对缩放后的高度直接 `Math.round(...)`
4. 最后把剩余误差通过“最后一个 pane 吞掉 remainder”的方式补回去

这样虽然能跑，但有两个问题：

### A. frame allocation policy 没有单独边界

现在 repo 里已经把 pane/layout 分成：

- geometry
- runtime composition
- resize policy
- interaction state

但 frame allocation 还留在 `buildPaneFrames(...)` 内部，属于“还有真实 policy 却没有名字”的状态。

### B. rounding remainder 有隐式底部偏置

只要 secondary 缩放后出现小数，旧实现就会因为：

- 每个 secondary 先 `round`
- 最后再让最后一个 pane 吞掉剩余差值

导致底部 pane 总是更容易吃到 rounding error。

这不是一个明确设计过的 contract，只是旧实现里的隐式后果。

## 2. 这次新增了什么

新增：

- `src/lib/chartx/internal/model/pane-frame-policy.ts`

它现在承接：

- `normalizePaneHeight(...)`
- `resolvePaneFrameAllocation(...)`

`resolvePaneFrameAllocation(...)` 明确返回：

- `effectiveGap`
- `primaryHeight`
- `secondaryHeights`

也就是说，secondary 缩放和 frame allocation 不再只是 `buildPaneFrames(...)` 里的一段过程代码，而是被提成了单独的 policy。

## 3. 行为上有什么变化

这次不是只搬代码位置。

`resolvePaneFrameAllocation(...)` 现在会：

1. 先算 secondary 缩放后的原始 `rawHeight`
2. 先取 `floor`
3. 再按 fractional remainder 从大到小补单位高度

这样 rounding remainder 的分配规则就从：

- “最后一个 pane 吞掉”

变成了：

- “按分配余数显式决定”

在 fractional 一样时，当前实现用稳定顺序打平局，而不是默认让底部 pane 吃掉误差。

## 4. `buildPaneFrames(...)` 现在变成什么角色

`pane-model.ts` 里的 `buildPaneFrames(...)` 现在更接近：

- 用 frame allocation policy 的结果组装 pane frame

而不是自己同时定义 allocation policy。

这意味着后面如果继续改 multi-pane frame layout，不需要再从 `buildPaneFrames(...)` 里把 policy 挖出来。

## 5. 测试

新增：

- `tests/unit/pane-frame-policy.test.ts`

它锁住两件事：

- secondary pane height normalization
- rounding remainder 不再默认落到最后一个 pane

同时 `tests/unit/pane-model.test.ts` 也补了一条回归：

- `buildPaneFrames(...)` 走新 policy 后，不再对底部 pane 有隐式 remainder 偏置

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/pane-frame-policy.test.ts tests/unit/pane-model.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有改 pane divider hit-test
- 没有改 pane resize policy
- 没有开始 richer linked resize 或 host-level multi-layout ownership
