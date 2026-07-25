# Alpha2 W6 chartx2 prerequisite release

日期：2026-07-25
性质：已审查的 committed-HEAD 本地 library release 记录；它是 alpha2 W6 Market 工作台接入前的 package 证据，不是 alpha2 已安装或桌面运行的证明。

## 结论和范围

**Prerequisite release：GO — P0=0 / P1=0 / P2=0。**

fresh review 的最终结论记录在
[`alpha2-w6-chartx2-prerequisite-review.md`](./alpha2-w6-chartx2-prerequisite-review.md)。本次 release
只交付两条 chart-context presentation seam：

1. `TradingTicketPanel` 的 optional `editor` / `actions` Svelte `Snippet` region replacement；
2. `TradingLedgerPanel` 的 host-owned text `columns` / row `cells` presentation model。

它们允许 alpha2 在图表附近组合自己的受控输入和订单、成交、持仓、账户事实，但不把
alpha2 application chrome、accounting authority、strategy generation、broker/order command、Tauri、
persistence 或 live/CTP 行为带入 `chartx2`。chartx2 仍拥有渲染和 chart-adjacent shell；alpha2
仍是产品流程、数据与账户事实的 host/orchestrator。

## 已审查的 source 和 authoritative gate

| 项目 | 精确值 |
| --- | --- |
| source repository | `/Users/dev/workspace2/hc_apps/chartx2` |
| committed source HEAD | `d1f84d3d9a20faffb4c3760278266ba1bd0a2a22` |
| product-source commit | `c9680a4`（`d1f84d3d` 仅新增 0398 tutorial） |
| review disposition | GO — P0=0 / P1=0 / P2=0 |
| authoritative command | `pnpm release:local:check` |
| command definition | `pnpm check` → `pnpm test:unit` → `pnpm release:local:verify` |
| result | PASS：library 576 tests、example 16 tests、workspace-external packed consumer PASS |

该 gate 的最后一步会从 package root 安装本地 `.tgz` 到 workspace 外 consumer，再真实运行
Svelte/browser probe；因此它覆盖 source check 以外的 package export、built declarations、runtime
import 和交互行为。它不是 Rust/Cargo、Tauri desktop 或 alpha2 integration 验证。

## 产物身份链

| 项目 | 精确值 |
| --- | --- |
| artifact | `/Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz` |
| package | `@chartx2/library@0.1.0` |
| size | `234821` bytes |
| SHA-256 | `42ad1deb059a19b92968f8bc31ed424de775c5611094260b35b3d4e918403bcc` |
| SHA-512 | `a1e55e5ff93fe0ee6821aa22492ca144477e86b494c52bd4e690a0ba3c8e9d681bfe6ad0c855696cc36983c1afd8b9baa332e3ffb7c1f8cad35a270c5212383a` |
| pnpm SRI | `sha512-oeVeX/k/4O5oIaoiSSyhREd+hrSUxSvU5pCgujyOnWgb/mrQyFVpbMNpg8Gv2Lm6ozLj/7fB+MrTWicMUhI4Og==` |

复核时使用：

```bash
shasum -a 256 /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
shasum -a 512 /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
wc -c /Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
```

三项结果分别匹配上表。SRI 是同一 SHA-512 digest 的 base64 表达；消费者的 lockfile integrity
必须与此处一致，不能用“路径相同”代替 artifact identity。

## Package declaration 和 runtime 证明

- `packages/chartx2/package.json` 声明 publishable package `@chartx2/library@0.1.0`，`files` 仅为
  `dist`，root export 的 `types`、`svelte`、`default` 都指向 `./dist/index.*`；另有既存的
  `./workbench-drawing-inspector` subpath。
- source public barrel、built `dist/index.js` 与 `dist/index.d.ts` 对 root exports 一致；ticket
  的两个 optional `Snippet` props 和 ledger 的扩展 presentation model 均可从 package root 获得。
- `release:local:verify` 在 workspace 外 consumer 从 `.tgz` 的
  `@chartx2/library` root import 并真实 mount legacy/default 与新 ticket/ledger 表现；它还覆盖
  multi-instance ledger 的 unique ARIA IDs、tab/panel association、one-sided/both snippet replacement
  与 tab/row Arrow/Home/End。不是只靠 type import 的证明。

## 后续 alpha2 install gate（尚未完成）

此 release 允许进入下一步，但 **alpha2 尚未安装这个 tgz，也没有 installed-package、Market
workbench 或 Tauri runtime proof**。下一阶段必须：

1. 在 alpha2 将依赖精确指向上表 artifact，并让 lockfile 的 integrity 与 SRI 对齐；
2. 在 alpha2 的 ordinary install 后，从其实际 `node_modules/@chartx2/library` 证明 root public
   exports、type declarations 和 runtime mount 来自该 tarball，而不是 workspace/source link；
3. 以 alpha2 自己的 host-owned facts/callbacks 验证 W6 flow，且不得由 chartx2 接管 account、order
   或 live execution authority。

上述完成前，本文件只能证明 chartx2 prerequisite package 已经就绪，不能声称 alpha2 集成完成。
