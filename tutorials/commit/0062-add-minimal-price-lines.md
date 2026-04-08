# 0062: 补上最小 `price lines`，并让 `Annotations` tab 转正

这次提交把 `chartx2` 从“基础系列已经齐了”继续往技术分析图表该有的能力推进了一步：新增了最小 `price lines`，并把前端 `Annotations` tab 从占位页改成真实示例页。

这一步的重点不是“又多一个 demo 效果”，而是：

- 底层 chart API 第一次有了真正的 annotation surface
- 前端例子程序不再只展示 series/panes/interactions，也开始展示技术分析表达层

## 为什么这一步现在最合适

在补完 `area` 和 `baseline` 之后，当前最明显的 gap 已经不再是 core series，而是：

- `price lines`
- `markers`
- 更宽的 annotation / overlay surface

这类能力和技术分析更直接相关。一个图表库如果只能换 series、缩放平移，但不能画最基本的支撑/阻力线，那它离“技术分析图表演示软件”还差得很远。

所以这一步的目标很清楚：

1. 先补最小 `price lines`
2. 立刻把 `Annotations` tab 变成真实页
3. 明确把 `markers` 留作下一块显式缺口

## 这次改了什么

### 1. 给所有现有 series API 补上 `price line` 能力

更新：

- [chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
- [index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)

新增公开类型：

- `PhaseOnePriceLineOptions`
- `PhaseOnePriceLineApi`

并把它接进当前所有 series API：

- `createPriceLine(options?)`
- `removePriceLine(line)`

目前支持的最小 options 是：

- `price`
- `color`
- `lineWidth`
- `title`

也就是说，这次不是只给某一种 series 特判，而是把 `price lines` 做成了真正的 series-level public capability。

### 2. 在渲染层补水平线和右侧标签

这次没有额外新增一个专门 renderer 文件，而是直接在 harness 的 pane render 流里加了 `drawPriceLines(...)`。

它做的事很窄：

- 按 price 算出当前 pane 内的 Y 坐标
- 画一条水平虚线
- 在右侧画一个小标签
- 标签文字来自 `title + price`

这样做的好处是：

- 当前切片很小
- 它直接复用现有 pane / priceScale / axis 样式系统
- 对 primary 和 secondary panes 都能工作

### 3. `Annotations` tab 从占位变成真实演示

更新：

- [chartx-demo.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/demo/chartx-demo.ts)

以前 `Annotations` 是显式 deferred placeholder。现在它已经变成真实 feature：

- `candlestick` 模式下展示 `Support / Resistance`
- `line study` 模式下展示 `Signal / Ceiling`
- 支持动作切换：
  - candles / line study
  - show / hide resistance
  - raise support

也就是说，前端现在已经能通过真实 public API 展示第一条 annotation 能力，而不是继续停留在“这块以后再做”的说明文字里。

### 4. 文档和视觉回归同步更新

更新：

- [lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
- [phase-one-api.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts)
- [phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)
- [phase-one-api-price-lines.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-api.spec.ts-snapshots/phase-one-api-price-lines.png)
- [demo-features-annotations.png](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts-snapshots/demo-features-annotations.png)

文档层面的意思也变了：

- `price lines` 不再是完全缺失
- `Annotations` 不再是 deferred tab
- 下一条更明确的 annotation gap 已经收束成 `markers`

## 验证

这次实际跑过并通过：

```bash
pnpm check
pnpm test:visual --update-snapshots
pnpm build
```

## 这次没有做的事

这一步没有把 `markers` 一起做掉，原因是要保持切片原子。`price lines` 是 annotation 层最自然的第一刀；`markers` 是下一刀，不应该在这次里顺手混进去。

另外也还没有做：

- richer price line options
- last value visibility control
- 更完整的 annotation 管理面

所以这次只是 `annotation surface` 的起点，不是终点。

## 给新人的 2 个知识点

### 1. 为什么 `price lines` 更适合作为 annotation 第一刀

因为它依赖关系最简单：

- 只需要 price scale
- 不需要额外的 time anchor 逻辑
- 不需要复杂图形或 marker 布局

所以它很适合作为“先把 annotation surface 打开”的第一步。

### 2. 为什么前端示例页也要同步从 placeholder 变成真实页

因为如果底层已经有 `price lines`，而 `Annotations` tab 还继续显示“以后再做”，那例子程序就会开始撒谎。演示软件必须跟着底层能力一起长，否则它会遮蔽进展，而不是展示进展。
