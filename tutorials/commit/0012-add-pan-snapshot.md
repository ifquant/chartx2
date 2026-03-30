# 0012 把最小拖拽平移拉进自动测试

## 背景

`0011` 已经把 wheel-driven zoom 拉进了自动测试，但 viewport 还缺另一半：平移。如果只有 zoom，没有 pan，后面继续做 chart 交互时，viewport state 依然是不完整的。

phase one 这里不需要一次把惯性、边缘阻尼、触摸手势全做出来。先把最基本的拖拽平移站住更重要。

## 主要目标

给浏览器 harness 增加最小 `pointerdown -> move -> up` 平移路径，并用一张 deterministic snapshot 把平移后的 viewport 钉住。

## 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)：
  - 增加最小 drag state
  - 根据拖拽位移调整 `rightOffset`
  - 在 `pointerup` / `pointercancel` 时清理状态
- 更新 [tests/visual/phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)，新增 `phase-one-harness-panned.png`
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)、[src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，同步 `pan` 已进入 baseline 自动测试

## 关键知识

为什么平移这里优先改 `rightOffset`，而不是先做一整套新的 data window？因为当前 phase one 的 time scale 已经天然支持用 `rightOffset` 改变可见范围位置，这正好是最小可用切口。

也就是说，这一步不是“发明一套新的平移系统”，而是让现有的 scale 参数真正动起来。

## 补充知识

- 拖拽交互里，`pointercancel` 和 `pointerup` 一样重要。只处理 `pointerup` 很容易在测试或真实浏览器里留下半截拖拽状态。
- 自动测试里的拖拽不需要很多步数，关键是用固定起点、固定终点和少量 steps，让结果稳定可重复。

## 验证

- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有惯性或更复杂的拖拽行为
- 还没有触摸手势平移
- 还没有 pan / zoom 对应的价格轴、时间轴标签更新验证
