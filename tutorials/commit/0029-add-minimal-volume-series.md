# 0029: 增加最小 `volume series` 路径

本次提交把前一版通用 `histogram` 往真正的成交量表达推进了一步。

目标不是一次做完多 pane，也不是马上复刻 TradingView 的主图加成交量叠加，而是先在现有单 canvas / 单 series 框架里，建立一条**语义上独立的 volume 入口**。这样后面做 `volume pane` 时，可以复用同一套数据、颜色和格式化约定，而不是把普通 histogram 再硬拗成成交量。

## 这次做了什么

- 在 public API 里新增 `addVolumeSeries()`
- 让 volume 继续复用 histogram 渲染器，但改成底部带状渲染，更接近真实成交量区域
- 支持 volume bar 的显式 `color` 和 `up` 方向语义，而不是默认全部按 `value >= 0` 着色
- 让右侧轴标签对 volume 使用 `K/M/B` 缩写格式
- 增加 volume 的 public API 视觉基线

## 为什么这样做

因为“有 histogram”不等于“有 volume”。  
真正的 volume 表达至少要满足三件事：

1. 视觉上更像成交量，而不是一张普通柱图
2. 颜色语义能和价格涨跌解耦
3. 后续能自然进入 `volume pane`

这次正是在补这三件事里的最小闭环。

## 两个实现知识点

### 1. 先分离语义，再分离 pane

很多图表系统会一开始就想做多 pane，但如果连 `volume` 的数据入口、颜色规则、数值格式都还没有独立语义，那么做出多 pane 以后还是会很乱。

更稳的顺序通常是：

- 先建立独立 series 语义
- 再把它迁到独立 pane

### 2. 成交量轴格式和价格轴格式通常不是一套

价格轴更适合保留小数精度，成交量轴更适合 `K/M/B` 这类紧凑缩写。  
如果两者共用完全相同的 formatter，视觉上会很快显得“不像图表软件”。

## 这次没有做什么

- 还没有主图 + volume 的双 series 叠加
- 还没有独立 volume pane
- crosshair readout 还没有切成 volume 专用栏位
- 还没有完整对齐 lightweight-charts 的 histogram / volume options 面
