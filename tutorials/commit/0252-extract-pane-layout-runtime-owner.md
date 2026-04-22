# 0252: 把 pane height 和 resize 组合收进 shared layout runtime owner

`pane/layout model ownership` 第一刀收的是几何只读模型：

- pane frames
- active pane
- divider

那一刀之后，`chart-pane-owner.ts` 里还剩下一块很明显的布局运行时组合没有收走：

- `getPaneHeight(...)`
- `getPaneOptions(...)`
- `applyPaneOptions(...)`
- `setPaneHeight(...)`
- `applyPaneResize(...)`

这几件事都在动同一组 pane layout/runtime 语义，但还挂在 pane owner 里面，导致 pane owner 同时承担：

- pane handle / command facade
- pane event publication
- pane layout runtime mutation glue

这次就是把第三块拆出来。

## 1. 为什么这次不直接重写 pane policy

这一步不是要一次性改完 pane/layout。

如果现在直接重写：

- preferred height normalization
- richer resize policy
- multi-layout model

那就会把“边界抽取”和“行为改写”混在一起，验证面会一下子变大。

所以这次只做一件更稳的事：

- 先把已经存在的 pane height / options / resize 组合逻辑收进一个共享 owner

先把边界立住，后面再决定要不要改更深的 pane policy。

## 2. 这次新增了什么

新增：

- `src/lib/chartx/internal/views/chart-pane-layout-runtime-owner.ts`

这个 owner 只承接 pane layout 运行时组合，不承接 pane API facade。

它现在负责：

- `getPaneHeight`
- `getPaneOptions`
- `applyPaneOptions`
- `setPaneHeight`
- `applyPaneResize`

实现上没有重写底层 leaf use-case，而是继续复用：

- `chart-pane-runtime.ts`

也就是说，这次加的是更高一层 composition surface，不是又把叶子逻辑改写一遍。

## 3. `chart-pane-owner.ts` 变薄了什么

抽取后，`chart-pane-owner.ts` 现在把下面这组接口直接委托给 `paneLayoutRuntimeOwner`：

- `getPaneHeight`
- `getPaneOptions`
- `applyPaneOptions`
- `setPaneHeight`
- `applyPaneResize`

这样 pane owner 更接近它应该做的事：

- pane handle construction
- pane lookup / target resolution
- pane add/remove orchestration
- pane event publication

而不是继续夹着一整块 layout runtime mutation glue。

## 4. 这次顺手修掉了什么类型问题

最开始抽出来后，`pnpm check` 没过。

原因不是新 owner 的行为逻辑，而是 `chart-pane-owner.ts` 里这类写法触发了 TS 返回类型递归：

- `type ChartPaneOwner = ReturnType<typeof createChartPaneOwner>`
- `let owner: ChartPaneOwner`
- 新 runtime owner 再闭包回调 `owner.emitPaneResize(...)` / `owner.emitPaneEvent(...)`

这样就变成：

- `createChartPaneOwner` 的返回类型依赖 `owner`
- `owner` 的类型又依赖 `createChartPaneOwner`

最后 `svelte-check` 报 circular type alias / implicit any。

修法没有走“大而全显式返回类型”那条路，而是更直接：

- 去掉自引用的 `ChartPaneOwner = ReturnType<...>`
- 改成局部 `emitPaneResizeRef` / `emitPaneEventRef`
- 先把这两个函数引用传给 `paneLayoutRuntimeOwner`
- owner 对象创建完后，再把引用回填到 `owner.emitPaneResize` / `owner.emitPaneEvent`

这样行为不变，但不会把整个 owner 类型卷进返回类型递归里。

## 5. 这一步实际锁住了什么边界

到这里，pane/layout 这条线已经有两层清晰边界：

1. `chart-pane-layout-owner.ts`
   负责 frame / active-pane / divider 这些共享只读几何模型
2. `chart-pane-layout-runtime-owner.ts`
   负责 pane height / options / resize 这些共享运行时组合

这意味着下一步如果继续推进 pane/layout model ownership，就不用再从 `chart-pane-owner.ts` 里拆第一刀了。

## 6. 测试

新增：

- `tests/unit/chart-pane-layout-runtime-owner.test.ts`

它锁住两类场景：

- pane height / option read + mutation composition
- divider drag resize + crosshair preservation

另外也补跑了直接相关的旧单测：

- `tests/unit/chart-pane-runtime.test.ts`
- `tests/unit/chart-pane-owner.test.ts`

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-layout-runtime-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-pane-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有重写 pane preferred-height normalization
- 没有扩展 richer multi-pane resize policy
- 没有开始 multi-layout / host-level layout ownership
