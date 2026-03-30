# 0014 把 readout 从 canvas 内挪到宿主 OHLC 栏

## 背景

`0013` 已经让 crosshair 能在图里显示最小 time / price readout，但它仍然属于 canvas 内部绘制。对真实 chart UI 来说，这还不够自然，因为宿主层拿不到这份状态，也就很难做更像交易软件的 OHLC 明细栏。

所以这一步不继续堆更多图内装饰，而是把 readout 正式提升到 host shell。

## 主要目标

让 engine 通过事件把 readout 状态抛给宿主，让 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte) 直接渲染 OHLC 明细栏。

## 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)：
  - 移除 canvas 内部 readout 盒子
  - 在每次渲染后派发 `chartx:readout`
  - 事件 detail 包含 `time / open / high / low / close / price`
- 更新 [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)，导出 `PhaseOneReadoutDetail` 类型
- 更新 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)：
  - 监听 `chartx:readout`
  - 在 `chart-frame` 顶部渲染宿主级 OHLC 明细栏
- 更新 [tests/visual/phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)，除了视觉基线外，还直接断言 crosshair 后 OHLC 明细栏不再是 `--`
- 更新 [src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和页面文案，同步能力说明

## 关键知识

为什么这一步比继续做更多 canvas 标签更值？因为一旦宿主层能拿到 readout 状态，后面要做更真实的 chart toolbar、OHLC 条、状态栏，路线就清楚了。

也就是说，这一步真正推进的是“engine -> host UI”这条边界能力，而不只是视觉效果。

## 补充知识

- 用 `CustomEvent` 在 canvas 和宿主之间传递只读状态，是一个很轻的过渡方案。它不会把 engine 反向绑到页面组件上，但已经足够让宿主消费实时数据。
- OHLC 明细栏属于“读数界面”，不是图形本身。把它放在宿主层，后面扩展成更完整的 UI 会比继续塞进 canvas 容易很多。

## 验证

- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有完整价格轴 / 时间轴标签
- 还没有 OHLC 变化颜色、涨跌幅等 richer metadata
- 还没有把 readout 状态接到更宽的 public chart API
