# 0108: 让 chart state snapshot 开始覆盖普通 managed secondary series

## 背景

上一提交已经让 chart snapshot 可以保存三类 study：

- `overlay`
- `compare`
- `moving-average`

但这还不够接近真正可保存的 chart template。

因为当前 `chartx2` 的很多副 pane 内容，并不是 study，而是普通的 managed secondary series：

- `line`
- `area`
- `baseline`
- `candlestick`
- `bar`
- `histogram`
- `volume`

如果 snapshot 只能恢复 studies，却不能恢复这些普通 secondary series，那么恢复后的 chart 仍然会丢掉很多实际图面。

## 主要目标

把 chart snapshot 从“能恢复主图和 study”推进到“也能恢复普通副 pane series”。

## 改动概览

1. 扩展 `PhaseOneChartStateSnapshot`
   - 新增 `series` 字段
   - 记录当前 managed secondary series 的：
     - `kind`
     - `paneIndex`
     - `options`
     - `data`

2. 实现 secondary series snapshot 提取
   - 从 `SourceRegistry` 中找出：
     - `role: "study"`
     - `studyKind: "series"`
   - 按 series 类型收集对应输入数据

3. 实现 secondary series restore
   - `applyChartState()` 先清掉当前可恢复 secondary series
   - 然后按 snapshot 重建：
     - `addCandlestickSeries()`
     - `addBarSeries()`
     - `addLineSeries()`
     - `addAreaSeries()`
     - `addBaselineSeries()`
     - `addHistogramSeries()`
     - `addVolumeSeries()`

4. 修正 secondary histogram / volume 的 visuals 丢失问题
   - 之前 secondary histogram-like series 在 `setData()` 时会先生成 visuals
   - 然后又在后续数据写入过程中把 visuals 清掉
   - 结果是：
     - snapshot 虽然能保存数据
     - 但恢复后图面颜色 / up-down 语义还是可能不对
   - 这次把顺序改正后，secondary histogram / volume 才能稳定恢复

5. 增加 browser parity test
   - 保存包含普通 secondary series 的 chart state
   - 删除这些 series
   - 通过 `applyChartState()` 恢复
   - 对比 `savedSeries === restoredSeries`

## 关键知识

### 1. “普通 secondary series” 和 “study” 不是一回事

当前 `chartx2` 里，副 pane 上能挂两类对象：

- 普通 managed secondary series
- study sources

它们都能被画出来，但对象语义不同。

这次把普通 secondary series 也纳入 snapshot，表示 chart persistence 开始覆盖：

- chart 壳层状态
- 主图状态
- 普通副图 series
- 一部分 study

这比上一版更接近真正的 chart template。

### 2. restore 时必须先清旧对象

恢复 secondary series 前，如果不先移除当前 chart 上已经存在的可恢复对象，会出现：

- 同一 pane 里 series 重复
- histogram / volume 重叠两层
- pane composition 和 snapshot 不一致

所以当前 restore 顺序是：

1. 清可恢复 studies
2. 清可恢复 secondary series
3. 恢复 panes / main series
4. 恢复 secondary series
5. 再恢复 studies

### 3. histogram / volume 这种 series 不能只恢复 data，还要恢复 visuals 语义

对 `line` 来说，恢复 `data + options` 基本就够了。  
但 `histogram / volume` 还依赖：

- `color`
- `up/down`
- 对应的内部 visuals map

如果内部 visuals 在写数据时被覆盖掉，外面看到的图面就会错。

这也是为什么这次虽然名义上是做 snapshot 扩展，但实际上必须顺手修掉内部 data-flow 顺序 bug。

## 补充知识

### 补充 1：为什么 snapshot 先保存输入数据，而不是保存渲染结果

真正该持久化的是：

- series 类型
- series 参数
- 原始输入数据

而不是 canvas 上已经画好的像素结果。

这是因为 renderer 是可替换的，视觉也会继续演进。  
只有保存对象状态，后续渲染器升级后，旧 snapshot 才还能继续恢复。

### 补充 2：为什么这一步还是不等于完整 template 系统

虽然 chart snapshot 现在已经覆盖：

- main series
- managed secondary series
- 一部分 studies

但它还没有覆盖：

- drawings
- 更广的 indicator families
- template versioning
- multi-chart layout
- workspace/user settings

所以这一步只是把 persistence 边界往正确方向推进，不是终点。

## 验证

- `pnpm check`
- `pnpm test`

## 未覆盖项

- drawings、template versioning、workspace persistence 仍未建立
- 更广的 indicator family 还没有统一的 snapshot schema
- multi-chart layout 和更完整的 workstation state 仍未进入当前持久化模型
