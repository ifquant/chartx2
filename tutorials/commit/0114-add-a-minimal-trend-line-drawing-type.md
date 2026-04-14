# 0114: 加入最小 trend-line drawing 类型

上一刀只把 drawing 对象线立起来了，但还只有 `horizontal-line` 一种静态对象。  
这次继续沿同一条路推进：加入第二种 chart-owned drawing，最小 `trend-line`，让 `drawings` 真正变成多类型 union，而不是“水平线特例集合”。

## 这次改了什么

- 在 chart API 上新增：
  - `addTrendLineDrawing(target?, options?)`
  - 返回 `PhaseOneTrendLineDrawingApi`
  - 支持 `applyOptions()`、`remove()`、`paneIndex()`
- `drawings` snapshot union 扩成两类：
  - `horizontal-line`
  - `trend-line`
- 新增最小 `trend-line` 渲染
  - 使用统一 `chartContext.barSequence.axisBars + timeScale + priceScale`
  - 不给 pane 或 drawing 再造第二套坐标系统
- 继续复用同一条 drawing registry / template / restore 流程
  - 说明 drawing 对象模型已经开始能承载多类型

## 为什么这样做

如果 drawing 永远只有 `horizontal-line`，那对象模型很容易继续停留在“像 price-line 的特例”。

加入 `trend-line` 之后，系统被迫面对这些事实：

- drawing 是多类型 union
- 不同 drawing 需要不同字段 schema
- snapshot/restore 必须走 discriminated union
- 渲染层要按 drawing kind 分发

这比继续往 `horizontal-line` 上堆参数更有价值。

## 这次没有做什么

- 没有做 trend-line 的拖拽端点编辑
- 没有做 hit-testing / select / hover
- 没有做 ray / extended line / channel / box
- 没有做 drawing z-order / grouping
- 还没有因为 drawing union 扩大而切 `chart-template v2`

也就是说，这一刀是“第二种 drawing object”，不是“画线工具系统”。

## 验证

- `pnpm check`
- `pnpm test:unit`
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "trend-line drawings" --config /tmp/chartx2.playwright.drawing.config.ts`

## 这一刀的两个知识点

### 1. TradingView 风格里，drawing 的关键不是画法，而是对象类型

同样是一条线：

- `horizontal-line` 更像单点 + 样式
- `trend-line` 是双点 + 样式

真正决定对象边界的，不是它最终画成什么，而是它需要什么状态模型、怎样保存、怎样恢复。

### 2. 统一横轴比“给 drawing 单独做坐标系统”更稳

这次 `trend-line` 没有自己维护独立横轴，而是继续挂在 chart 的统一 `TimeScale` 上。  
这和前面一直对齐的 TradingView 模型是一致的：pane 有自己的 price scale，但 chart 仍然共享一条横轴。
