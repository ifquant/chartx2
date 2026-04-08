# 0061: 补上最小 `baseline series` 路径

这次提交把 `chartx2` 的基础系列面再补完整一块：新增了最小 `baseline series`，并且同样遵守项目当前的工作方式：

- 先补底层 renderer 和 public API
- 再立刻接进前端 demo shell
- 最后用视觉回归把这条能力钉住

这样新能力不是“代码里有了”，而是“用户在例子程序里马上能看到，也能被回归测试覆盖到”。

## 为什么现在做 `baseline`

在上一轮补完 `area series` 之后，`baseline` 就成了最明显的基础系列缺口。对 `lightweight-charts` 这一层来说，它不是高级玩法，而是正常系列面的一部分。

如果 `baseline` 还缺着，会有两个问题：

1. `chartx2` 还不能说基础系列面已经补齐  
2. 当前的 pane/render/public API 架构还没有再被验证一次，确认它不是只对某几种 series 特化

所以这一步的价值，不只是“多一种图”，而是继续证明当前架构能稳妥承载新的基础系列类型。

## 这次具体做了什么

### 1. 新增 `BaselineRenderer`

新增文件：

- [baseline-renderer.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/renderers/baseline-renderer.ts)

它的实现策略很克制，没有新发明一套模型，而是：

- 继续复用 line 风格的数据点
- 按 `baseValue` 算出一条基准线
- 基准线上下分别用不同颜色和填充渐变
- 同一条折线在基准线上下分段显示不同线色

这是一个“最小但真实”的 baseline 实现，不是占位图。

### 2. 在 public API 补 `addBaselineSeries()`

更新：

- [chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
- [index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)

新增了：

- `PhaseOneBaselineSeriesOptions`
- `PhaseOneBaselineSeriesApi`
- `addBaselineSeries(target?)`

保持的能力面和 `line / area` 一致：

- `setData`
- `update`
- `applyOptions`

当前开放的 baseline 样式面包括：

- `baseValue`
- `lineWidth`
- 上半区 line/fill 颜色
- 下半区 line/fill 颜色

### 3. primary / secondary pane 都支持 `baseline`

这一步不是只把 baseline 塞到主图里。secondary pane 也能挂 baseline，所以它已经进入当前受控 pane 体系，而不是额外写一条旁路。

这在工程上很重要，因为它继续验证了：

- pane target 机制对新 series 是通用的
- readout / legend / pane metadata 这套逻辑能承载新 kind
- public API 的 series 扩展方式没有被 area 那一轮锁死

### 4. 直接接进 `Series` tab

更新：

- [chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)

现在 `Series` tab 已经能直接切到：

- `Candles`
- `Bar`
- `Line`
- `Area`
- `Baseline`
- `Histogram`
- `Volume`

这意味着前端展示面已经从“还缺一块 core series”变成“当前基础系列 floor 已经完整可见”。所以原先 `Missing: baseline` 的提示也被收掉，改成更准确的说法：下一个差距已经不在 core series，而在更宽的 chart breadth。

### 5. 文档和视觉基线同步

更新：

- [lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
- [phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
- [phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)
- [phase-one-api-baseline-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-baseline-series.png)
- [demo-features-series.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-series.png)

这也意味着：

- 新的 public API 路径有单独快照
- `Series` 分组演示的截图也更新到了现在的 breadth
- gap 文档不再把 `baseline` 记成当前缺口

## 验证

这次实际跑过并通过：

```bash
pnpm check
pnpm test:visual --update-snapshots
pnpm build
```

## 这次没有做的事

这一步没有顺手把 `markers / price lines / annotations` 一起做掉。原因很简单：虽然 `baseline` 补完之后，下一批差距确实会往这些方向移动，但它们不应该和这次基础 series 补齐混成一个提交。

也没有新加 model 层 unit tests，因为这次 `baseline` 复用的是现有 line 数据归一化通路，新增工作主要集中在：

- 渲染层
- public API
- demo shell 展示层
- visual regression

## 给新人的 2 个知识点

### 1. 为什么 `baseline` 也能复用 line 数据归一化

因为它和 line/area 一样，本质上都是：

- 一个时间点
- 一个数值

差别主要在渲染表达：

- `line`: 只画线
- `area`: 画线并向底部填充
- `baseline`: 按一条基准线把同一条线分成上下两种语义和颜色

所以真正的差异点主要在 renderer，而不是 data model。

### 2. 为什么基础 series 补齐以后，gap 的重心会变化

图表系统的差距不是永远都在“多一类 series”。当 core series 面补得差不多以后，下一轮真正有价值的差距通常会转移到：

- markers
- price lines
- richer options
- scale/formatter hooks
- pane/chart 管理面

这也是为什么每完成一个切片，都要同步更新 gap 文档。否则你会继续盯着已经解决的问题打转。
