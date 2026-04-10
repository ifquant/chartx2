# 0047 - 补上最小 series markers，继续向 lightweight-charts 对齐

这次把重心拉回到了图表库本体，而不是 demo 外壳。当前 `chartx2` 和 `lightweight-charts` 的差距里，最明显的一块已经不是基础 series 形状，而是注释和覆盖层能力。`price line` 前面已经补了，下一步最值的就是 `markers`，因为很多真实图表集成需要先标出买卖点、信号点、提示点，才会继续往更复杂的 pane/workstation 走。

## 本次做了什么

1. 给所有当前 series API 补了 `setMarkers()`
   - `candlestick`
   - `bar`
   - `line`
   - `area`
   - `baseline`
   - `histogram`
   - `volume`

2. 落了第一版 marker 数据模型
   - 支持 `time`
   - 支持 `position`
   - 支持 `shape`
   - 支持 `color`
   - 支持 `text`

3. 在 canvas 渲染链路里真正把 markers 画出来
   - 先支持最常用的位置：`aboveBar / belowBar / inBar`
   - 先支持最常用的形状：`circle / square / arrowUp / arrowDown`

## 为什么先做这个

因为这是很典型的“图库能力”，不是演示页能力。  
如果没有 markers，图能画出来，但很多策略、告警、买卖点、研究结果都只能靠宿主 UI 自己补。这会让 `chartx2` 更像一个画图引擎，而不像一个真正能拿来集成的 chart library。

## 新人需要知道的两件事

1. markers 不一定要先做成复杂系统  
   先把 `setMarkers()` 这种一口气替换整组 markers 的 API 做稳，值通常比一开始就做增删改单个 marker 高。简单、稳定、容易测。

2. 注释层最好跟 series 自己走  
   这次 markers 是挂在 series API 上，而不是做成 chart 级全局散弹接口。这样后面做多 series、多 pane 时，marker 的归属更清楚，也更接近 upstream 的使用心智。

## 这次还没做

- markers 现在还是最小 options 面，还没有完整的大小、字体、offset、可见性控制
- 还没有更丰富的 annotation family，比如真正的 series markers 管理器或更复杂的 overlay primitives
