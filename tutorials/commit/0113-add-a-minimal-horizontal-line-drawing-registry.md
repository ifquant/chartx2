# 0113: 加入最小 horizontal-line drawing registry

本次提交把 `drawings` 从 “还没进入对象模型” 推进到 “已有最小 chart-owned 实体线”。这一刀没有做完整画线工具，也没有做拖拽编辑；重点是先把 drawing 从 `series/study` 语义里分离出来，建立独立 registry、最小 API、渲染复用，以及 snapshot/restore 闭环。

## 这次改了什么

- 在 model 层新增 `DrawingRegistry`
  - 文件：`src/lib/chartx/internal/model/drawing-registry.ts`
  - 作用：像 `SourceRegistry` 一样管理 drawing，但不把 drawing 混成 source。
- 在 chart API 上新增最小 drawing：
  - `addHorizontalLineDrawing(target?, options?)`
  - 返回 `PhaseOneHorizontalLineDrawingApi`
  - 支持 `applyOptions()`、`remove()`、`paneIndex()`
- 把 drawing 纳入 `getChartState() / applyChartState()`
  - snapshot 现在多了 `drawings`
  - restore 时会重新挂回对应 pane
- 复用现有 `drawPriceLines()` 渲染路径
  - 这次没有重新发明一套 canvas drawing renderer
  - 先把 `horizontal-line` drawing 映射成 pane 级 price-line 集合一起画
- 给 pane 删除加了保护
  - pane 上有 drawing 时，不能直接删 pane，避免出现悬挂 drawing

## 为什么这样做

如果直接把 drawing 做成 `study` 或普通 `series`，后面对象模型会越来越乱：

- drawing 不该参与 indicator / compare 的数据管线
- drawing 也不该被误认为 price-scale 上的 series source
- template / workspace 后面一定要把 drawing 当成独立对象保存

所以先独立 registry，比先堆交互更重要。

## 这次没有做什么

- 没有做 drawing toolbar
- 没有做拖拽、选中、hit-test
- 没有做 trend line / ray / box / multipoint shape
- 没有做 drawing z-order / grouping
- 没有把 drawing 纳入 pane event 的独立对象快照

这意味着它现在只是“最小 drawing object line”，不是完整画图系统。

## 验证

- `pnpm check`
- `pnpm test`
- `pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "horizontal-line drawings" --config /tmp/chartx2.playwright.drawing.config.ts`

## 这一刀的两个知识点

### 1. Drawing 和 Price Line 不是同一个对象层

虽然这次复用了 `drawPriceLines()`，但这是 **渲染复用**，不是 **模型复用**。

- `PriceLine` 目前还是 series-owned
- `HorizontalLineDrawing` 现在是 chart-owned drawing

后面即使视觉一样，它们也应该是两套不同对象边界。

### 2. 先做 snapshot/restore，比先做交互更稳

如果一个对象连 “创建 -> 保存 -> 删除 -> 恢复” 都没有闭环，后面再加拖拽、编辑、模板迁移时，状态很容易失控。  
所以 drawing 的第一刀先做 persistence 边界，是更稳的工程顺序。
