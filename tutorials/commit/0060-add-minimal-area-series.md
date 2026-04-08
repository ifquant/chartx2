# 0060: 补上最小 `area series` 路径

本次提交把 `chartx2` 的基础序列能力从 `candlestick / bar / line / histogram / volume` 扩展到了 `area`，并且不是只停留在底层 renderer，而是马上接进了前端示例程序的 `Series` tab，让这条能力在演示界面里直接可见。

## 为什么要做这一步

当前 `chartx2` 的目标不是只做一个能画 K 线的壳，而是逐步把 `lightweight-charts` 补成更完整的图表系统。按这个方向看，`area` 是一个很明确的缺口：

- 它属于基础系列类型，不是高阶功能
- 它能验证当前 chart API 和 pane/render 架构是不是只对蜡烛图特化
- 它应该在 demo shell 里立刻看得见，否则底层能力变宽了，前端仍然像没变化

所以这一步的原则是：`底层补一类 series，前端同一个切片就把它用起来。`

## 具体改了什么

### 1. 新增 `AreaRenderer`

新增文件：

- [area-renderer.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/renderers/area-renderer.ts)

这个 renderer 做的事情很窄：

- 根据 line 数据生成折线顶边
- 用顶部折线和 pane 底边围成闭合区域
- 画出顶部描边
- 用渐变把区域填充出来

这一步没有新造一套 area 专属数据模型，而是复用了 line 风格的数据归一化结果。

### 2. 在 chart harness 里补公开 `addAreaSeries()`

更新：

- [chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
- [index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)

新增了最小公开接口：

- `addAreaSeries(target?)`
- `PhaseOneAreaSeriesApi`
- `PhaseOneAreaSeriesOptions`

支持的能力保持最小闭环：

- `setData`
- `update`
- `applyOptions`

其中 `applyOptions` 先只开放 area 最关键的样式面：

- `lineColor`
- `lineWidth`
- `topColor`
- `bottomColor`

### 3. primary / secondary pane 都能挂 area

这次不是只给主图补一个 area。`area` 也进入了 secondary pane 的受控系列体系，所以它和现有的 `line / bar / histogram / volume` 一样，能在 pane target 体系里工作。

这很重要，因为这一步在验证：

- 现有 pane 架构不是只给某一种 series 定制的
- 当前多 pane 渲染通路确实能承载新的基础系列类型

### 4. 直接在前端 `Series` 演示里接上

更新：

- [chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)

`Series` tab 现在已经能直接切到 `Area`，而不是文档里说支持、界面里看不到。

同时也把缺口提示同步更新了：

- 之前的显式 gap 是 `area / baseline`
- 现在只剩 `baseline`

这让 demo shell 更像“能力展示程序”，而不是“未来计划说明板”。

### 5. 文档和视觉基线同步

更新：

- [lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
- [phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
- [phase-one-api-area-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-area-series.png)
- [demo-features-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-series.png)

也就是说，这次不是“代码看起来有了”，而是：

- gap 文档缩小了一块
- public API 多了一条可见回归
- 前端系列展示页的基线也跟着更新了

## 验证

实际运行并通过：

```bash
pnpm check
pnpm test:visual --update-snapshots
pnpm build
```

## 还没做的部分

这次没有顺手把 `baseline series` 一起做掉，原因是要保持切片原子。`area` 是一个明确、完整、可演示的基础系列扩展；`baseline` 仍然是下一块显式缺口。

另外，`markers / price lines / annotations` 这些也还没有因为 `area` 自动补上，它们仍然属于后续 chart breadth 的工作。

## 给新人的 2 个知识点

### 1. 为什么 `area` 可以复用 `line` 数据

因为 area 图和 line 图在“数据点的横纵坐标”上其实是同一种信息。差别不在数据，而在渲染：

- `line`: 只画折线
- `area`: 画折线，再把折线到基线之间的区域填满

所以复用 line 数据归一化逻辑，通常比复制一套 area 专属数据管道更稳。

### 2. 为什么每加一个底层能力，都要立刻接到 demo 里

因为图表库项目很容易陷入“底层已经很强，但外部看不出来”。把新能力立刻接进例子程序，有两个好处：

- 你自己能马上看到这条能力是不是活的
- 回归测试也能覆盖到真实用法，而不是只覆盖内部类
