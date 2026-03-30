# 0010 补 crosshair 的 deterministic snapshot

## 背景

前面的 phase-one 测试已经覆盖了：

- baseline candle render
- 窄屏 resize-sensitive snapshot
- model/scales/data 的 unit tests
- 一组有限的 parity contract tests
- 最小 public API 的 happy path

但 checklist 里还缺一个更接近交互层的测试口子：`crosshair / viewport update snapshot`。如果这里一直空着，后面一旦开始补交互，就很容易出现“图能画出来，但指针位置和图形已经悄悄错开”的问题。

## 主要目标

给 phase-one 浏览器 harness 增加最小 crosshair 行为，并用一张固定鼠标位置的截图把它钉住。

## 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)：
  - 增加 pointer move / leave 监听
  - 在 pane 内记录 crosshair 位置
  - 重绘 vertical line、horizontal line 和中心点
- 更新 [tests/visual/phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)，增加固定鼠标位置触发的 `phase-one-harness-crosshair.png`
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)、[src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，同步当前交互测试状态

## 关键知识

为什么 crosshair snapshot 值得在 phase one 就做？因为 crosshair 不只是“画两条线”，它也是 scale、layout、pointer coordinate 三条路径交汇的地方。

只要这三条里有一条偏了，视觉上最早暴露问题的通常就是 crosshair。

## 补充知识

- 交互类 visual regression 不一定非得模拟完整拖拽。很多时候，先锁一个固定指针位置的结果，就已经足够抓住最早一批错位问题。
- `pointerleave` 也要显式清状态。否则 canvas 重绘后很容易留下旧的交互痕迹，测试看起来偶尔通过，实际上状态已经脏了。

## 验证

- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有 pan / zoom 自动测试
- 还没有 viewport update 的交互式 snapshot
- 还没有 crosshair 对应的价格/时间标签
