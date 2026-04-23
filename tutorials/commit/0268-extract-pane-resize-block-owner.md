# 0268: 把 pane resize target/block/group 收成 shared owner

前面几笔已经把 pane resize 这条线拆出了不少 model 能力：

- target resolution
- block snapshot
- block membership validation
- grouping

但到 `0267` 为止，还有一个很现实的问题：

- pointer-down 交互在自己拼一套 target/block snapshot
- move-time pane layout policy 也在自己拼一套 validated group

虽然它们底层都调用同一批 model helper，但“怎么把这些 helper 组合起来”仍然散在两个地方。

这会带来两个坏处：

- 以后再改 pane block contract，要同时改 interaction 和 policy 两边
- repo 里已经开始出现“相同边界，不同 owner 各自拼”的味道

所以这次不再继续加 model helper，而是把这条组合边界本身收成一个 shared owner。

## 1. 新增了什么

新增：

- [chart-pane-resize-block-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-resize-block-owner.ts)

这个 owner 负责三件事：

- `resolveControlledPaneId(...)`
- `resolvePaneResizeBlockSnapshot(...)`
- `resolvePaneResizeGroup(...)`

也就是把 pane resize 里最关键的三步组合收进一个稳定 surface：

1. target 是谁
2. pointer-down snapshot 是什么
3. move-time validated group 是什么

注意这里收的是“views 层共享组合边界”，不是再往 model 层塞一个大而全 helper。

## 2. 现在谁开始用它了

### 2.1 pointer-down interaction

在：

- [chart-interaction-handlers.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-interaction-handlers.ts)

里，pointer-down 现在不再通过 `chart-pane-layout-policy-owner` 间接拿：

- controlled pane id
- resize block snapshot

而是直接通过：

- `chart-pane-resize-block-owner`

来拿 pointer-down 需要的 block 信息。

这让 interaction handler 对 pane resize 这条线的依赖更直接：

- 它依赖的是“pane resize block surface”
- 不是“顺便也有这几个方法的 pane layout policy owner”

### 2.2 move-time pane layout policy

在：

- [chart-pane-layout-policy-owner.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-pane-layout-policy-owner.ts)

里，move-time resize 也开始通过同一个 owner 来拿：

- controlled pane id
- validated resize group
- pointer-down block snapshot

所以这次的结果不是“又多一个 helper 文件”，而是：

- pointer-down
- move-time policy

终于共享了同一条 pane block boundary。

## 3. 为什么这一步值得单独提交

这次没有新增 linked-resize 用户行为。

但它解决的是 architecture cleanliness：

- pane resize block 这条边界
- 不该继续寄生在 `chart-pane-layout-policy-owner`
- 也不该继续在 interaction handler 里临时拼装

把它抽成 shared owner 之后，后面如果继续做：

- pane block ownership
- richer block-aware resize policy
- block-level debug/readout

就有了一个明确的挂点，而不是继续在两个调用点同时扩。

## 4. 测试

新增：

- [chart-pane-resize-block-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-resize-block-owner.test.ts)

覆盖：

- controlled pane target 解析
- pointer-down block snapshot 组合
- move-time validated group 组合
- stale `blockPaneIds` 拒绝

并继续补跑：

- [chart-pane-layout-policy-owner.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pane-layout-policy-owner.test.ts)
- [chart-pointer-runtime.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/chart-pointer-runtime.test.ts)
- [pane-resize-block-policy.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/pane-resize-block-policy.test.ts)

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-resize-block-owner.test.ts tests/unit/chart-pane-layout-policy-owner.test.ts tests/unit/chart-pointer-runtime.test.ts tests/unit/pane-resize-block-policy.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check`

## 未包含

- 没有新增 linked-resize 用户行为
- 还没有把 pane block surface 提升成真正独立的 runtime owner / ownership root
- 这一步先收的是 shared composition boundary，不是最终的 pane block ownership 终态
