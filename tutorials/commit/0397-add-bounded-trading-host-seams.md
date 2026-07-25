# 增加有界的交易宿主呈现 seam

## 背景

alpha2 的 Market 工作台需要把图表旁的委托输入和不同类型的账本事实放进同一个
chartx2 shell，但 chartx2 不能因此变成订单、账户或 Tauri 命令的 owner。本提交只补足
两个可复用的呈现边界：ticket 的宿主内容插槽，以及 ledger 的异构列/cell 显示能力。

## 主要目标

- 让 `TradingTicketPanel` 的 `editor` 和 `actions` 可替换默认只读字段区、默认摘要加提交区。
- 让 `TradingLedgerPanel` 在保留旧五列行为的同时，显示 orders、fills、positions、account
  这类不同表头的宿主事实。
- 把 tab、tabpanel 和行选择补成可键盘操作的语义，并在 workspace 外的 tgz consumer 中真实挂载。

## 改动概览

- `TradingTicketPanel.svelte` 增加 optional `Snippet` props：`editor` 只替换 field region，
  `actions` 只替换 summary/submit region。两者都未传时，原有 DOM、`model` 和 `onSubmit`
  仍走原路径；传入时默认区域不会重复 mount。
- `trading-ledger-surface.ts` 增加窄的 `columns` 与每行 `cells` 文本呈现模型，并保留
  `LEGACY_TRADING_LEDGER_COLUMNS` 与固定五字段 fallback。它不解释单元格是订单、成交、持仓
  还是账户事实，也不接收取消或提交命令。
- `TradingLedgerPanel.svelte` 继续拥有 tab、表头、行、detail 与选择交互；它增加
  `role="tablist"`、`role="tab"`、`role="tabpanel"`、`role="grid"`，并支持 Arrow/Home/End
  切换 tab 或行。
- `verify-chartx2-local-release-consumer.mjs` 现在从打包 tgz 的 package root 实际挂载 legacy
  ticket、custom ticket、legacy ledger 和四种异构 ledger view，而不是只做 import/type probe。

## 关键知识

### Snippet 是“区域替换”，不是任意应用协议

Svelte 的 `Snippet` 让宿主在指定位置提供 UI。这里 `editor` 与 `actions` 各自只有一个固定
落点，因此 chartx2 仍控制 ticket 外壳、状态和布局；alpha2 可以放受控输入或按钮，却不能把
broker schema、risk 规则或 Tauri 调用传进 chartx2。

### 异构 ledger 不等于把账务模型搬到图表库

`columns`/`cells` 的职责只是“这一列显示什么文字”。canonical order、fill、position、account
数据仍由宿主维护。这样一个复用 panel 可以正确显示不同事实表头，也不会在 chartx2 形成第二份
accounting authority。

## 补充知识

- 组件的 source test 只能证明本仓逻辑；packed consumer 在 workspace 外安装 `.tgz` 并运行浏览器
  才能同时覆盖 package-root export、声明文件、运行时 Svelte 编译与默认兼容性。
- keyboard row selection 不应只依赖鼠标 click。这里保留按钮原生 Enter/Space 行为，并显式处理
  ArrowUp/ArrowDown/Home/End，让 host callback 与焦点移动保持同一行。

## 验证

```bash
pnpm check
pnpm --filter @chartx2/library test:unit
pnpm test:unit
pnpm release:local:check
```

结果：全部通过；library unit 为 164 files / 576 tests，example unit 为 4 files / 16 tests。
`release:local:check` 的外部浏览器 consumer 验证了 legacy/default 与新 seam 的真实挂载。

还执行了一次有界 mutation：临时从 package root 移除 `TradingTicketPanel` runtime export，外部
consumer 的 `type-probe.ts` 以 `TS2724` RED；恢复该行并重建 library 后，完整
`pnpm release:local:check` GREEN。该 mutation 已完全 revert，没有新增 mutation framework。

## 未覆盖项

- 不新增 alpha2 types、订单/撤单命令、broker/account schema、Tauri 调用、持久化或完整
  `MarketWorkbenchPanel`。
- 不改变 chart renderer、chart persistence、live/CTP 行为，且没有在此提交接入 alpha2。
- committed-HEAD 的最终 release 仍由 fresh chartx2 review 后单独运行和记录。
