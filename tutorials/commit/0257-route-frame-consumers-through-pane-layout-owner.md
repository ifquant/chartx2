# 0257: 把 frame consumer 收进 shared pane-layout owner

上一笔 `0256` 已经把 pane frame allocation policy 从 `pane-model.ts` 里拆出来了：

- `normalizePaneHeight(...)`
- `resolvePaneFrameAllocation(...)`

但那之后还有一个明显的不一致：

- frame allocation policy 虽然已经单独命名
- 可是真正消费 pane frame 的几个路径，还是各自直接调用 `buildPaneFrames(...)`

这意味着 repo 里虽然已经有 shared pane-layout owner，但 frame consumer 还没有真正统一收口。

## 1. 之前分散在哪里

至少这几条路径还在自己直连 frame 组装：

- `chart-pane-runtime.ts`
  - `getPaneHeight(...)`
  - `applyPaneResize(...)` 里的 divider 位置更新
- `chart-scale-owner.ts`
  - primary pane height 读取
- `chart-render-coordinator.ts`
  - readout 用的 pane frames

这些路径虽然都在读同一份 pane frame 语义，但入口并不统一。

## 2. 这次具体新增了什么

这次没有再开新的 owner 文件，而是把已有的：

- `chart-pane-layout-owner.ts`

补成真正能服务 frame consumer 的 shared surface。

新增的方法有：

- `paneFrameById(...)`
- `primaryPaneFrame(...)`
- `resolvePaneDividerByIds(...)`

这样它不再只是：

- `paneFrames(...)`
- `resolveActivePane(...)`
- `resolvePaneDivider(...)`

而是也能给 runtime / scale / readout 这些路径提供统一 frame query。

## 3. 哪些模块接过去了

### A. `chart-pane-runtime.ts`

这里之前自己直接：

- `buildPaneFrames(...)`
- `resolvePaneDividerByIds(...)`

现在改成通过 `createChartPaneLayoutOwner(...)` 走：

- `paneFrameById(...)`
- `resolvePaneDividerByIds(...)`

这样 pane runtime 已经不再自己展开 frame 读取逻辑。

### B. `chart-scale-owner.ts`

price-scale API 之前为了算 primary pane height，也是在本地：

- `buildPaneFrames(...).find((pane) => pane.kind === "primary")`

现在直接走：

- `paneLayoutOwner.primaryPaneFrame(...)`

### C. `chart-render-coordinator.ts`

readout 之前直接内联：

- `buildPaneFrames(getPaneSpecs(), ...)`

现在改成走：

- `paneLayoutOwner.paneFrames(...)`

这样 readout 也不再绕开 shared pane-layout owner。

## 4. 这一步的意义

这次没有改 pane frame 行为本身。

真正改变的是：

- frame allocation policy 已经独立
- frame consumer 也开始统一走一个 shared owner surface

也就是说，现在 pane/layout 这条线不只是把 policy 拆出来了，还开始把 consumer 收口了。

后面如果继续改：

- frame allocation
- divider semantics
- active pane read model

这些调用点就不用再逐个去找直连 `buildPaneFrames(...)` 的代码。

## 5. 测试

`tests/unit/chart-pane-layout-owner.test.ts`

这次补了 owner 自己的 frame query coverage：

- `primaryPaneFrame(...)`
- `paneFrameById(...)`
- `resolvePaneDividerByIds(...)`

同时补跑了直接受影响的 consumer tests：

- `tests/unit/chart-pane-runtime.test.ts`
- `tests/unit/chart-scale-owner.test.ts`
- `tests/unit/chart-render-coordinator.test.ts`

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-layout-owner.test.ts tests/unit/chart-pane-runtime.test.ts tests/unit/chart-scale-owner.test.ts tests/unit/chart-render-coordinator.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有改 pane resize behavior
- 没有改 pane frame allocation policy 本身
- 没有开始 richer linked resize 或 multi-layout ownership
