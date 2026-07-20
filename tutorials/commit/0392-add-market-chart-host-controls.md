# 为 Market Chart 增加宿主可控能力

## 背景

`PhaseOneMarketChartSurface` 已经能承载 K 线、分时和指标 pane，但 alpha2
这类宿主还需要控制价格格式、指标叠加、信号标记、hover 信息和可见数据窗口。
这些能力属于图表公共边界，应在 `chartx2` 实现，宿主只提供数据和配置。

## 主要目标

扩展 public market-surface seam，使低频和高频宿主可以组合多条指标线、显示
开平仓标记及理由、控制坐标轴格式，并在用户接近数据边缘时获得虚拟范围通知，
同时保持 shared time axis、pane 和 renderer ownership 不变。

## 改动概览

- `PhaseOneMarketChartSurfaceModel` 新增多 overlay、markers、price/time
  formatter、visible price range 和 virtual-range policy；
- marker 支持 `solid` / `hollow` fill 与只在 hover readout 中显示的 tooltip；
- surface 支持 inline 或 cursor tooltip 形式的 OHLC/volume readout；
- price axis 支持 left/right，边缘标签被限制在 pane 内；
- wheel、方向键和宿主回调共同支持可观察的虚拟范围；
- 指标和 secondary pane rows 投影到主图 shared time axis，避免 warm-up 缺口
  把指标错误对齐到最新 K 线；
- 虚拟范围模式在 surface capture 阶段接管 wheel，避免与 canvas 默认 zoom
  重复变换 viewport；
- 超出当前主图时间窗的研究点会被丢弃，已匹配的点不会退回局部数组索引；
- 指标颜色进入 pane 重建签名，运行时换色不会保留旧 renderer options；
- left price axis 自动获得最小 plot inset，超长 formatter 和 magnet label 会在
  axis slot 内省略，右边缘不会覆盖绘图区；
- autoscale 优先使用已经投影的 row values；
- 更新受坐标轴位置修正影响的 Playwright visual baselines。

## 关键知识

### 时间索引不是数组下标

EMA 等指标开头通常存在 warm-up 空缺。若指标自己的第一条数据重新从 index 0
开始，图形会整体向左错位。`projectRowsToTimeAxis` 按时间把指标 row 映射到主图
axis index，使缺口保留在正确位置。

若某个研究点的时间不在当前主图窗口内，它没有合法的 shared-axis coordinate。
此时只丢弃该点；不能因为一个 unmatched row 就让整组指标退回自己的 index 0，
否则剩余可匹配点仍会错位。

### 宿主提供配置，图表拥有交互状态

alpha2 可以提供 formatter、overlay 数据和边缘加载回调，但 pan/zoom、pane、
price scale 和 marker rendering 仍由 chartx2 管理。这样不会在宿主应用中形成第二
套图表状态机。

## 补充知识

1. Visual baseline 的少量像素变化也要检查原因。本次最普遍的差异来自顶部和
   底部价格标签被夹回 pane 内，属于防裁切修正，而不是直接批量接受未知差异。
2. 数据更新时盲目 `fitContent` 会把用户刚查看的历史窗口拉回最新位置。
   `preserveVisibleRangeOnDataUpdate` 允许同一 symbol/timeframe 更新时保留 viewport。

## 验证

```bash
pnpm test
pnpm release:local:check
git diff --check
```

预期结果：565 个 library unit tests、16 个 example unit tests 和 195 个
Playwright visual tests 通过，外部临时 consumer 能从本地 tarball 安装、类型
检查、构建并运行测试。

## 未覆盖项

- virtual range 只发布边缘状态，不负责网络请求、缓存合并或数据去重；
- 不实现指标计算，宿主仍应提供后端计算结果；
- 不引入通用 indicator registry 或指标参数配置面板；
- 不改变 alpha2 桌面 shell、策略或订单执行逻辑。
