# 0278: 添加 Workbench Host Adapter 与 Watchlist Symbol Open

这次把 Workbench 从静态 demo 往真实 workstation 推了一步。

以前 watchlist 只是 `chartx-demo.ts` 里硬编码的展示数据。点击列表不会打开 symbol，页面也没有统一的 host adapter 边界。这样继续做 saved layout、indicator catalog 或 alerts 时，很容易继续把产品逻辑塞进 demo page。

这次新增的边界是：

- public `WorkbenchHostAdapter`
- fixture host adapter
- controller-level `openSymbol`
- Svelte watchlist click forwarding

## 1. 为什么先做 host adapter

TradingView-like workstation 的核心不是“页面上多几个按钮”，而是宿主能明确提供：

- symbol metadata
- watchlist rows
- chart-ready bars
- later persistence and alert providers

所以第一步要先建立 adapter，而不是直接在 Svelte 里写点击后换数据。

## 2. 这次具体改了什么

- 新增 `src/lib/chartx/public/workbench-host.ts`，定义 symbol resolve、bar loading、open-symbol helper。
- 新增 `src/lib/demo/workbench-fixtures.ts`，把 demo 的 watchlist 和 market bars 放到 fixture host adapter 后面。
- 更新 `src/lib/demo/chartx-demo.ts`，让 workbench controller 维护 active symbol 和 active payload。
- 更新 `MarketWorkbenchPanel.svelte`，让 watchlist row 成为可点击按钮并显示 active state。
- 更新 `+page.svelte`，只做 shell-level forwarding，不拥有 symbol-open policy。

## 3. 这次没有做什么

没有实现 saved layout。当前 active symbol 还不会跨刷新保存。

没有实现 multi-chart routing。watchlist click 仍然只打开当前 single workbench chart。

没有接真实行情源。当前 adapter 是 deterministic fixture adapter。

## 验证

- `pnpm check`
- `pnpm test:unit -- tests/unit/workbench-host-adapter.test.ts tests/unit/workbench-contract.test.ts`
- `pnpm exec playwright test tests/visual/phase-one-harness.spec.ts -g "watchlist symbol"`
- `pnpm build`

## 未包含

- 真实 market data adapter
- saved layout persistence
- indicator catalog
- alerts
- multi-chart target routing
