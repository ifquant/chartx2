# 0248: 把常用 runtime access 继续收进 container

`0247` 已经把 phase-one runtime graph 的“对象创建”收进了 container。  
但那还只是第一层边界：`chart-harness.ts` 虽然不再自己 `new ChartModel()`，却仍然到处直接调：

- `ChartModel`
- `TimeScale`
- `DrawingRegistry`

这次继续把常用 access/mutation surface 收进同一个 container。

## 1. 这次要解决什么问题

如果 container 只负责创建对象，而 harness 仍然在几十个位置直接写：

- `chartModel.listSourcesByRole(...)`
- `chartModel.getOrCreateSecondaryScale(...)`
- `chartModel.context().snapshot()`
- `drawingRegistry.removeByApi(...)`

那么 runtime ownership 其实还没有真的往 container 移动，只是把 `new` 挪了个地方。

所以这次不做大改造，只做一件更有实义的事：

- 让 container 开始承接一层共享 runtime access surface

## 2. container 这次新增了什么

改了：

- `src/lib/chartx/internal/views/chart-runtime-container.ts`

新增的 surface 主要覆盖四类常用访问：

1. context
   - `contextSnapshot()`
   - `clearMainSource()`
   - `bindMainSource(...)`

2. source registry
   - `mainSourceId()`
   - `registerSource(...)`
   - `removeSourceByApi(...)`
   - `removeSourcesWhere(...)`
   - `getSourceByIdAndRole(...)`
   - `getSourceByApiOrThrow(...)`
   - `listSources*`
   - `hasSourceApi(...)`

3. secondary scales
   - `getOrCreateSecondaryScale(...)`
   - `getSecondaryScale(...)`
   - `removeSecondaryScale(...)`
   - `secondaryScales()`

4. drawing registry
   - `removeDrawingByApi(...)`

这一步的重点不是把所有逻辑塞进 container，而是先把高频 runtime access 收成一个明确入口。

## 3. harness 这次怎么变

改了：

- `src/lib/chartx/internal/views/chart-harness.ts`

现在这些 owner/coordinator wiring 更少直接碰 `ChartModel`：

- `studyContextOwner`
- `studySourceOwner`
- `mainSeriesSwitchOwner`
- `sourceOwner`
- `paneOwner`
- `drawingInteractionOwner`
- `renderInputOwner`
- `runtimeQueryOwner`
- `scaleOwner`
- `primarySeriesOwner`
- `seriesCommandOwner`
- `stateRestoreShellOwner`
- `stateShellOwner`

它们改成更多地通过 `runtime` surface 取：

- context snapshot
- source lookup / list / register / remove
- secondary scale lookup / removal
- drawing removal

这样 harness 继续朝“组合根消费 runtime container”移动，而不是一边说有 container，一边继续散着写 raw model access。

## 4. 为什么这刀仍然是窄切片

这次仍然没有做下面这些更重的事：

- 没有把完整 owner graph 都塞进 container
- 没有重写 `pane` 或 `layout` 模型
- 没有把 public API surface 改成另一层 facade

所以这刀的定位很明确：

- 不是 runtime container 完成
- 而是 runtime container 从“创建器”变成了“开始承载真实 access glue 的边界”

## 5. 测试补了什么

更新：

- `tests/unit/chart-runtime-container.test.ts`

新断言锁住了这类最基础的 container contract：

- 空 runtime 下的 source lists
- secondary scale lookup
- context snapshot
- drawing/source removal passthrough

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-runtime-container.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 未包含

- 没有把 runtime graph 的全部读写都收进 container
- 没有开始 pane/layout model ownership 主线
- 没有改动 visual baseline 或 public API 行为
