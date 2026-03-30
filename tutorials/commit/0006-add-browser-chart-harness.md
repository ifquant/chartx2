# 0006 增加最小浏览器 chart harness

## 背景

在 `chartx2` 里先后落下 helper 和 model/core/scales/data 之后，下一步必须把这些东西真正画到屏幕上。不然前面的 range、scale、plot row 只是“看起来像图表内核”的代码，还不能证明它们在渲染路径里真的成立。

这一步的任务不是做完整 chart UI，也不是做完整 public API。目标更窄：

- 先在浏览器里建立一个稳定的 canvas harness
- 用 deterministic OHLC 数据把第一张 candle chart 画出来
- 继续保持 host shell 只通过 public chartx entrypoint 接触它

## 主要目标

建立 `renderers/views` 的最小闭包，让现有 model 数据能够通过 canvas 真正渲染出来，并且在宿主页里挂载成功。

## 改动概览

- 新增 `src/lib/chartx/internal/renderers/`：
  - `grid-renderer`
  - `candlesticks-renderer`
- 新增 `src/lib/chartx/internal/views/chart-harness.ts`：
  - 创建 deterministic sample OHLC 数据
  - 组装 `SeriesDataStore`、`TimeScale`、`PriceScale`
  - 在 canvas 中渲染网格和 candle bars
  - 处理 resize 重绘
- 更新 [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)，导出 `mountChartxPhaseOneHarness`
- 重写 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，把宿主页升级成浏览器 harness 宿主，并在初始化失败时显示可见错误状态
- 更新 [src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)，同步当前阶段已经进入 `Renderers Views` 和 `Host Integration`

## 关键知识

为什么先做浏览器 harness，而不是直接把它塞进更复杂的桌面 UI？因为 phase one 现在验证的是图表内核路径，不是桌面壳环境本身。

浏览器 harness 的价值在于：

- 固定尺寸
- 固定数据
- 固定 canvas 渲染路径
- 出问题时更容易判断是 model/scale/render 问题，还是宿主环境问题

这一步等于把之前的数学层真正闭合成了一条链：

`OHLC data -> plot rows -> scales -> renderer items -> canvas output`

只要这条链能稳定跑起来，后面的 renderer/view 迁移就不再是抽象讨论。

## 补充知识

- 对图表项目来说，“先看到 deterministic 图像”比“先把 API 设计漂亮”更重要。因为图表的很多错误，只有真的画出来才会暴露。
- 可见错误态不是锦上添花。canvas 初始化失败时如果页面只是空白，后面排错会很痛。宿主壳至少要让人知道“图表没起来”，而不是假装没事。

## 验证

- `pnpm check` (`PASS`, `svelte-check found 0 errors and 0 warnings`)
- `pnpm build` (`PASS`)
- `cargo check` (`PASS`)

## 未覆盖项

- 还没有 visual regression snapshot
- 还没有 pan / zoom / crosshair 交互
- 还没有把 renderer/view 路径和 upstream parity contract tests 对齐
