# 0018 把最小轴标签推进成 crosshair 跟随标签

## 背景

`0017` 已经让 phase-one harness 拥有了最小时间轴和价格轴标签，但这些标签还是静态锚点。它们能让图看起来更像 chart UI，却还不能直接跟着用户当前 inspection 点走。

如果下一步目标是继续逼近真实图表软件的体验，那比继续重做整套 tick 算法更值的一步，是先把 crosshair 直接投到轴上。

## 主要目标

让当前 crosshair 的时间和价格不仅出现在 OHLC 明细栏里，也直接体现在底部时间轴和右侧价格轴上。

## 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)：
  - 让 `drawPriceAxis` 接受当前 crosshair
  - 让 `drawTimeAxis` 接受当前 crosshair
  - 为当前 inspection 点绘制一层深色 active axis tag
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)、[src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，同步当前 phase-one 范围说明
- 依赖现有 visual regression 重新固定 baseline，因为 crosshair 场景和普通场景的画面结构都变了

## 关键知识

为什么这里优先做 crosshair 跟随标签，而不是先推更复杂的刻度生成？因为对用户来说，当前 inspection 点能不能直接落在轴上，感知收益通常比“静态刻度是不是更聪明”更大。

也就是说，这一步优先提高的是交互反馈质量。

## 补充知识

- 在 chart UI 里，静态刻度和 active tag 是两层不同信息：前者负责提供背景参考，后者负责告诉用户“你现在指到的是哪”。
- 只要 active tag 先站住，后面再重做 tick 生成算法时，用户对交互的核心认知不会丢。

## 验证

- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有更复杂的 tick density 控制
- 还没有 instrument-aware precision 和时间格式化
- 还没有 axis options 或完整轴主题配置
