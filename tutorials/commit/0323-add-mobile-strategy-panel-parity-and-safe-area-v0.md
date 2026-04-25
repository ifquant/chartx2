# 0323 add mobile strategy panel parity and safe-area v0

## 背景

上一轮已经把窄视口下的 right sidebar 和 trading bottom panel 收成了 on-demand
sheet，但还有两个明显缺口：

- `Strategy Tester` 还没有自己的 mobile focused parity coverage
- mobile sheet 的 bottom offset 还没有考虑设备 safe-area inset

## 这次要解决什么

- 证明 `performance-link` 这条 strategy shell 在移动宽度下也走同一条 bottom-sheet seam
- 给移动端 sidebar / bottom sheet 增加 safe-area-aware 的底部偏移

## 改动概览

- 在 `tests/visual/phase-one-harness.spec.ts` 中增加 strategy mobile bottom-sheet focused 用例
- 在 `src/lib/demo/components/MarketWorkbenchPanel.svelte` 的窄视口样式里，让
  `workbench-sidebar` 和 `bottom-panel-body` 的底部位置叠加
  `env(safe-area-inset-bottom, 0px)`
- 在 `docs/tradingview-alignment-plan.md` 的 `Multi-Device Productization`
  小节补充这条进展和边界说明

## 为什么这样做

### 1. trading 通过了，不代表 strategy 也一定安全

两者虽然共享同一套 mobile bottom-sheet shell，但内容密度和 DOM 结构并不一样。
给 strategy 加 focused parity coverage，可以防止后面只盯 trading 路径。

### 2. safe-area 是低成本高收益的壳层硬化

这一步不需要引入新的 host profile，也不需要重写布局模型。只要把移动 sheet 的
底部位置对齐到 `safe-area-inset-bottom`，就能避免在带 home indicator 的设备上
贴边过紧。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "workbench mobile trading panel opens as a bottom sheet instead of staying inline|workbench mobile strategy panel opens as a bottom sheet instead of staying inline" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 还没有做 drag-to-dismiss 或多段 sheet 高度
- 还没有为 safe-area 做真实设备截图基线
- `logs`、`replay` 这些轻量底部区域仍然保持 inline
