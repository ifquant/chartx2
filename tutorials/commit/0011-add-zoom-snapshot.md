# 0011 把第一个 viewport 交互拉进自动测试

## 背景

前面已经把 crosshair 做成了 deterministic snapshot，但 phase-one 还差一个更接近 viewport state 的交互测试。继续往前推 `lightweight-charts` 迁移时，如果 viewport 永远是静态的，就很难知道之后补的交互到底是真的改变了图，还是只是重绘了一遍同样的结果。

在 `pan` 和 `zoom` 之间，这一步先选 `zoom`，因为它更容易先做成稳定的自动测试。

## 主要目标

让浏览器 harness 拥有最小 viewport state，并用一张固定的 wheel-driven snapshot 把第一次 zoom 行为钉住。

## 改动概览

- 更新 [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)：
  - 引入最小 `barSpacing` viewport state
  - 在 `setData` 时重置 baseline spacing
  - 监听 `wheel` 事件，根据滚轮方向调整 bar spacing
- 更新 [tests/visual/phase-one-harness.spec.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts)，新增 `phase-one-harness-zoomed.png`
- 更新 [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)、[src/lib/chartx/internal/foundation.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/foundation.ts) 和 [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)，同步 `zoom works` 的当前状态

## 关键知识

为什么做 viewport 交互时，先别把 state 每次 render 都重算？因为只要 render 一次就把 spacing 写回默认值，用户的 wheel 或 drag 看起来像是触发了事件，但图根本没有真正变化。

所以这一步最关键的不是 `wheel` 本身，而是先让 viewport state 真正存活下来。

## 补充知识

- `wheel` 交互做自动测试时，直接在 canvas 上派发固定 `WheelEvent`，通常比模拟真实鼠标滚轮更稳定，因为它不依赖当前光标是不是正好悬停在目标节点上。
- phase one 的交互测试不必一下子做到“像用户真实操作一样复杂”。先有一张确定会变的 viewport snapshot，比先写一堆复杂手势脚本更值。

## 验证

- `pnpm test:visual --update-snapshots` (`PASS`)
- `pnpm test:visual` (`PASS`)
- `pnpm check` (`PASS`)
- `pnpm build` (`PASS`)

## 未覆盖项

- 还没有 pan 自动测试
- 还没有 drag 导航或惯性之类的更复杂 viewport 行为
- 还没有 zoom 对应的价格/时间轴标签更新验证
