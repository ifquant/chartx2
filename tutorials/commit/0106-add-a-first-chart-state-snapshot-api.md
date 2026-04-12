# 0106: 给 chart 增加第一版统一状态快照 API

## 背景

上一提交已经把主序列自己的状态收成了：

- `getMainSeriesState()`
- `applyMainSeriesState()`

但这还不够，因为真正的图表保存通常不只包含主图类型和颜色，还会至少包含：

- chart layout / crosshair 外观
- viewport 数值状态
- pane 结构

如果这些还分散在 chart API 的不同角落里，就很难形成稳定的 chart-owned persistence boundary。

## 主要目标

这次不做完整 workspace / template 系统，而是先补一版更大的 `ChartStateSnapshot`，把当前 chart 自己拥有的状态收成一个对象：

- chart options
- time scale 数值状态
- price scale 数值状态
- secondary pane composition
- main series state

## 改动概览

1. 新增 `PhaseOneChartStateSnapshot`
   - 定义在 `chart-harness.ts`
   - 这是当前第一版 chart-owned snapshot 类型

2. 给 public chart API 增加：
   - `getChartState()`
   - `applyChartState()`

3. `applyChartState()` 当前会恢复：
   - `layout / crosshair` 配色
   - `timeScale` 的 `barSpacing / rightOffset / visibleLogicalRange`
   - `priceScale` 的 `visibleRange / scaleSeriesOnly`
   - secondary pane 的数量、首选高度、是否可 resize
   - main series state

4. 增加 browser parity test
   - 保存 chart state
   - 故意改乱 chart
   - 重新应用 snapshot
   - 断言恢复后的 `getChartState()` 与保存值一致

## 关键知识

### 1. 这次 snapshot 的目标是 chart-owned state，不是 full workspace

这次收进去的内容有一个共同点：都属于 chart 自己负责的状态。

比如：

- chart layout colors
- crosshair colors
- viewport numbers
- pane composition
- main-series mode

而还没收进去的内容，比如：

- compare / overlay / moving-average studies
- drawing entities
- watchlist / shell panels
- layout template 版本管理

这些都还不在这个边界里。

### 2. pane composition 先于 pane content

这次先恢复的是 pane 的“壳”：

- 有几个 secondary panes
- 每个 pane 高度是多少
- 是否允许 resize

而不是 pane 上挂了哪些 study。

这样做的原因是：

- pane 生命周期本身已经稳定
- pane 内容还涉及 study/drawing/data persistence，复杂度更高

先把容器层恢复机制做稳，再扩 study snapshot，会更干净。

## 补充知识

### 补充 1：为什么 `applyChartState()` 在删 pane 时是严格模式

如果当前多出来的 secondary pane 仍然挂着 series，`applyChartState()` 会直接报错，而不是偷偷删掉。

这是故意的，因为 silent data loss 比恢复失败更危险。

### 补充 2：viewport 恢复不能只记 `barSpacing`

如果只保存 `barSpacing`，恢复后你并不能保证看到的是同一段区域。

所以这次还一起保存并恢复：

- `rightOffset`
- `visibleLogicalRange`

这才更接近“看回同一块图”的语义。

## 验证

- `pnpm check`
- `pnpm test`

## 未覆盖项

- studies、compare、overlay、indicator panes 还没有纳入 chart snapshot
- drawing / template / workspace persistence 仍未建立
- chart snapshot 还没有 schema version 字段，后续如果要长期保存，需要补版本管理
