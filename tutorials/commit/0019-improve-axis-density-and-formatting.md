# 0019 提高轴标签的 tick density 和格式化质量

## 背景

`0018` 已经让 crosshair 能跟随到时间轴和价格轴上，但轴本身仍然比较粗糙：

- 静态标签数量固定
- 时间标签还不够像真正图表
- 宿主 OHLC 栏在 demo 数据下会直接显示原始时间戳

所以这一步不做完整刻度系统，而是先把当前 phase-one 的轴体验从“能用”推到“更像真实图表”。

## 主要目标

改进这三件事：

- 根据空间生成更合理的最小 tick density
- 对价格和时间标签做更合理的基础格式化
- 让宿主 OHLC 栏的时间显示也和图表标签保持一致

## 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)：
  - demo bars 改成真实分钟时间戳
  - 价格轴根据 pane 高度生成 3 到 7 个标签
  - 时间轴根据可用宽度和 visible range 生成 3 到 7 个标签
  - 增加基础价格格式化和时间格式化
- 更新 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，让宿主 OHLC 栏也使用更合理的 time / price 格式
- 更新 [src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和页面能力说明，反映当前轴标签能力

## 关键知识

为什么这里先做动态 density，而不是立刻移植完整 upstream tick generator？因为 phase one 现在需要的是“轴不要看起来像写死的 demo”，而不是一下子把所有刻度策略搬完。

也就是说，这一步优先解决的是感知质量和结构合理性。

## 补充知识

- 对图表 UI 来说，标签数量是否跟随空间变化，比标签内容本身更早影响“像不像真的图表”。
- 只要 demo 数据先用真实分钟时间戳，哪怕完整交易日历和 session 还没做，整体视觉和交互读感也会明显更接近成品。

## 验证

- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有完整 tick generation 策略
- 还没有 instrument-aware precision、timezone 配置或 session-aware labels
- 还没有更复杂的 axis options 和主题配置
