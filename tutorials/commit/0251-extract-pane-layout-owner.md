# 0251: 给 pane/layout model ownership 补第一层 shared owner

runtime-container 这条线连推几刀之后，再继续收 accessor 收益已经明显下降了。  
下一步更值得做的是正式切到 roadmap 里的第二条：

- `pane/layout model ownership`

这次先收最基础也最容易漂移的一组几何 read-model：

- pane frames
- active pane
- pane divider

## 1. 为什么从这组几何开始

这一组语义现在同时被几条路径依赖：

- render state
- pointer interaction
- drawing interaction

如果它们各自继续直接：

- `buildPaneFrames(...)`
- `resolvePaneDivider(...)`
- `resolveActivePane(...)`

那后面一旦 pane layout 规则变化，就很容易先在某一条路径更新，另一条路径还停在旧语义上。

所以这次不是改 pane mutation，而是先收 pane/layout 的 shared read-model。

## 2. 这次新增了什么

新增：

- `src/lib/chartx/internal/views/chart-pane-layout-owner.ts`

这个 owner 先只承接只读几何入口：

- `paneFrames(plotHeight)`
- `resolvePaneFrames(plotHeight, provided?)`
- `resolveActivePane(crosshair, plotHeight, provided?)`
- `resolvePaneDivider(y, plotHeight, hitSlop, provided?)`

它的作用很明确：

- 把 pane layout 的共享几何模型收成一个稳定 surface
- 让 render / interaction / drawing-interaction 不再各自重组同一套 frame/divider 语义

## 3. 哪些模块接过去了

改了：

- `src/lib/chartx/internal/views/chart-render-state.ts`
- `src/lib/chartx/internal/views/chart-interaction-handlers.ts`
- `src/lib/chartx/internal/views/chart-drawing-interaction-owner.ts`

具体变化：

### A. render-state

之前 `buildChartRenderState(...)` 自己直接：

- `buildPaneFrames(...)`
- `resolveActivePane(...)`

现在改成通过 `paneLayoutOwner` 统一得到：

- `paneFrames`
- `activePane`

### B. interaction-handlers

之前 pointer path 里自己直接：

- 生成 pane frames
- 调 `resolvePaneDivider(...)`

现在改成走同一个 `paneLayoutOwner`。

### C. drawing-interaction-owner

之前 drawing hit/drag 路径也自己在本地：

- `buildPaneFrames(...)`

现在改成用同一个 shared owner 去 resolve pane frames。

## 4. 这一步的意义

这次还没有开始：

- pane resize policy 重写
- pane preferred height 语义重构
- multi-layout / multi-chart ownership

但它先解决了一个更基础的问题：

- pane/layout 的几何 read-model 不再分散复制

这意味着后面如果继续推进 pane/layout model ownership，不需要先回头统一三套 frame/divider/active-pane 的入口。

## 5. 测试

新增：

- `tests/unit/chart-pane-layout-owner.test.ts`

它锁住两件事：

- `paneFrames + activePane`
- `paneDivider`

另外还补跑了直接依赖这组几何语义的单测：

- `tests/unit/chart-render-state.test.ts`
- `tests/unit/chart-interaction-handlers.test.ts`
- `tests/unit/chart-drawing-interaction-owner.test.ts`

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-pane-layout-owner.test.ts tests/unit/chart-render-state.test.ts tests/unit/chart-interaction-handlers.test.ts tests/unit/chart-drawing-interaction-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有改 pane mutation / resize 行为
- 没有把 pane height policy 下沉成新的 model owner
- 没有触及更大的 workstation multi-layout 方向
