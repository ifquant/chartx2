# 0147: 修正 Point & Figure 的自动尺寸与默认视口

这次不是继续改 demo 假数据，而是把 `P&F` 真正影响可读性的三条链路收正：

1. `auto box size` 以前会被整段原始数据的总区间拉得过大，导致默认只剩很少几列。
2. `timeScale` 以前在 `P&F` 上还会错误地拿原始 K 线的 `data.length` 当 `pointCount`，结果默认视口按 10000 根 bar 去算，图形直接被推到屏幕外。
3. `X/O` 渲染尺寸对列宽约束不够严格，列一旦挤就容易互相压住。

## 这次改了什么

- `inferPointFigureBoxSize(...)`
  - 改成只看最近一段共享原始 K 线窗口，而不是整段历史。
  - 同时参考总区间、平均波动和目标列数来反推 auto box size。
- `getPointCount()`
  - 改成按真正渲染行的 logical index 计算，而不是直接拿 `state.data.length`。
  - 这样 `setVisibleLogicalRange()` 在 `P&F` 上不会再把视口按原始 10000 根 bar 处理。
- `PointFigureRenderer`
  - 再缩小 `X/O` 字形和线宽上限，让列宽较小时也不容易重叠。
- workbench
  - `P&F` 不再用专有原始数据，改回和其他主图共用 `createWorkbenchBars(10_000)`。
  - 增加 `Auto scale` 滑杆，作为 auto box size 的放大/缩小系数。
  - 显示当前 `Auto box`、`reversal`、`visible columns`。
  - `P&F` 进入时的默认 visible range 改成围绕真实生成列数自动落点。
- harness test
  - `P&F` 基线测试现在会等到 `cols` 指标出现后再截图，避免截到半渲染状态。

## 为什么之前你看到的图和我测试图不一样

因为之前的 harness 截图时机太早，再叠加 `P&F` 视口按错误 `pointCount` 计算，测试里能截到空白图；而你本地手动切换时，页面已经继续渲染了一段时间，所以还能看到右边残留的几列。

这次把视口根因修掉后，测试截图和手动页面终于回到同一套结果。

## 验证

- `pnpm check` PASS
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "point-figure" --update-snapshots` PASS

## 还没做

- 这还不是 TradingView 水平的 `P&F`。
- 目前仍然只有一种 auto 推导，不支持 ATR / Percentage 等更完整的 box size 模式。
- `P&F` builder 仍然是 phase-one 版本，后续还要继续收列构造和参数面。
