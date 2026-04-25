# 0322 add mobile bottom panel sheet v0

## 背景

`Mobile Sidebar Sheet V0` 已经让右侧栏不再默认挤压窄视口图表空间，但底部大面板还是会在
窄视口里直接 inline 展开。

对 `Strategy Tester` 和 `Trading Ticket` 这种内容更重的壳来说，这仍然会过早吃掉移动端
画布。

## 这次要解决什么

- 在窄视口下，把当前 active 的底部重面板改成 on-demand sheet
- 保持底部 tab/range/action strip 继续 inline，避免这次切片改动过大
- 不改 bottom-panel runtime contract，只改 shell 呈现模式

## 改动概览

- 在 `src/lib/demo/components/MarketWorkbenchPanel.svelte` 中增加
  `mobileBottomPanelOpen` 状态和 `data-mobile-bottom-panel-trigger`
- 当 active bottom tab 对应 `StrategyTesterPanel` 或 `TradingTicketPanel` 时，在窄
  视口下通过 fixed bottom sheet 呈现它们
- 为 mobile bottom sheet 增加 backdrop、close 按钮和稳定 selector
- 在 `tests/visual/phase-one-harness.spec.ts` 中增加 focused mobile trading-panel
  用例，证明 trading shell 不再被迫常驻 inline
- 在 `docs/tradingview-alignment-plan.md` 的 `Multi-Device Productization` 章节补上这条进度说明

## 为什么这样做

### 1. 先处理“重面板”，不重写整个 footer

底部 footer 里有两类内容：

- 轻量控制：tab、range、mode、action
- 重量内容：strategy/trading 面板

这次只把第二类收成 sheet，因为它们才是移动端空间压力的主要来源。

### 2. 不新增第二套 bottom-panel 模型

和 sidebar 一样，这次避免复制一套“移动端 strategy/trading 组件”。现有
`StrategyTesterPanel` 和 `TradingTicketPanel` 直接复用，只改变挂载方式。

### 3. 为什么先用 trade shell 验证

trade shell 比 strategy panel 更像真实产品里的重面板：字段密、信息密度高、用户会频繁开关。

所以用它做 focused visual，能更快证明这个 seam 是否站得住。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "workbench mobile trading panel opens as a bottom sheet instead of staying inline" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## 未覆盖项

- 还没有移动端 strategy panel focused visual
- 还没有 drag-to-dismiss、snap heights、safe-area 适配
- `logs`、`replay` 这些轻量底部区域仍然保持 inline，不在这次切片里一起改
