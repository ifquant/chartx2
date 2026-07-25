# Alpha2 W6 chartx2 prerequisite fresh review

日期：2026-07-25
审查范围：`63d6ea208f26bca6736423789803910f35b737e9..8783cd3f43b4257a4b3e5e986f3f333553e9e081`（一个 commit：`8783cd3`）
性质：fresh Terra-high、只审查。本报告为未跟踪交付物；未修改 chartx2 源码、未提交或 push。

## Verdict

**NO-GO — P0=0 / P1=1 / P2=1。**

该提交正确完成了 W6 所授权的两条窄 presentation seam：ticket 的 optional Svelte
`Snippet` replacement，以及不解释 domain facts 的 ledger columns/cells。它没有把 alpha2、
accounting authority、generation、Tauri、command、persistence 或 full workbench 类型带入
chartx2；package-root source/build declaration/runtime 也一致。打包 consumer 确实在 workspace
外从 tgz root mount 新旧 ticket/ledger，而非只做 type import。

但 ledger 的 ARIA IDs 是按 component-local tab index 写死的。两个 panel 同时存在时，它们生成
重复 document IDs；恰好当前 packed consumer 正同时 mount legacy 和 generic ledger，却没有检出
这个问题。`aria-controls` / `aria-labelledby` 因而不能唯一指向本 panel 的 tab/panel，未达到 W6
要求的 reusable tablist/tab/tabpanel accessibility contract。修复 P1，并补齐 P2 的 explicit
keyboard/replacement matrix 后，才可重新审查。

## Findings

### P1-01 — 多个 ledger 实例产生重复的 tab/panel IDs，破坏 ARIA association

`TradingLedgerPanel.svelte:49-51` 永远从 `trading-ledger-panel-${index}` 生成 panel ID，
`90-93` 同样把 tab ID 固定为 `trading-ledger-tab-${index}`。因此同一 document 内任意两个
`TradingLedgerPanel` 都会拥有 `trading-ledger-tab-0` 与 `trading-ledger-panel-0` 等重复 ID。
这个组件是 public reusable shell；其 own release consumer 也在
`scripts/verify-chartx2-local-release-consumer.mjs:209-215` 同时 mount 了 legacy 和 generic
ledger，故这不是假设性的单实例限制。

后果是 generic ledger `aria-labelledby="trading-ledger-tab-0"`（component line 112）会解析到
document 中第一个同名 tab，可能是 legacy panel；两个 tab 的 `aria-controls` 也指向同一个重复
panel ID。视觉 click/controlled state 可以继续工作，但 assistive technology 的 tab/panel
relationship 已不可信，不能作为 W6 prerequisite 放行。

最小修复：为每个 mounted panel 分配稳定的 instance prefix（host-provided optional ID 或 Svelte
生成的 per-instance ID），并用该 prefix 构造 tab 与 panel IDs；保留 tab index 作为实例内部
association。更新 packed consumer，使其断言 document ID 唯一、每个 `aria-controls` /
`aria-labelledby` 在自己的 panel 内精确对应。

### P2-01 — consumer 只证明“两个 snippets 同时提供 + row ArrowDown”，未覆盖所要求的独立替换与完整键盘矩阵

实现本身为 `editor` 和 `actions` 提供了独立的条件分支（`TradingTicketPanel.svelte:87-108,
116-137`），ledger 也实现了 Arrow/Home/End（`TradingLedgerPanel.svelte:53-79`）。但现有
packed consumer 只 mount 同时提供两种 snippet 的 ticket（script `199-206`），只断言该联合
case；它没有证明：

- 仅提供 `editor` 时默认 summary/submit 仍存在且 default fields 不重复；
- 仅提供 `actions` 时默认 fields 仍存在且 default summary/submit 不重复；
- tabs 的 Arrow/Home/End，以及 rows 的 Home/End，都会移动 focus 并调用受控 callback。

W6 plan `§4.1` 要求 optional seam 的 exact replacement，且明确要求 pointer + Arrow/Home/End
selection。代码阅读表明这些路径很可能可用，但缺少 required focused/packed behavior evidence；
不能用 `pnpm check` 或 one ArrowDown assertion 替代。

最小修复：在已存在的 external packed browser probe（或等价 focused component test）新增上述
one-sided snippet、tab-keyboard、row Home/End cases。保留 legacy ticket `onSubmit`、legacy five
columns与四种 heterogeneous headers 的现有断言。

## Positive evidence and boundary check

- `TradingTicketPanel.svelte:22-27,87-137` 的 `editor?: Snippet` / `actions?: Snippet` 是窄的
  region replacement；两者都省略时旧 model/default submit/onSubmit 路径仍在，联合 custom case
  不 duplicate default fields/actions。
- `trading-ledger-surface.ts:9-23,48-104` 仅公开 text `columns`/`cells` presentation model，
  并保留 `LEGACY_TRADING_LEDGER_COLUMNS` 和 five-column fallback；没有订单、账户、broker 或
  command protocol。
- packed consumer 从 workspace 外临时目录安装 `file:<tgz>`（verify script `27-50`），从
  `@chartx2/library` package root import、真实 mount legacy/custom ticket 与 legacy/generic
  ledger（`194-226`），并断言 legacy `onSubmit`、replacement 无 duplicate、orders/fills/
  positions/account 各自表头、tab semantics、click 与 ArrowDown row selection（`274-316`）。
- public barrel source/build declaration/runtime 一致：source `src/lib/public/index.ts:8,11-12`，
  built `dist/public/index.js:8,11-12` 与 `dist/public/index.d.ts:8,11-12`；built ticket declaration
  含两个 `Snippet` props，ledger declaration 引用扩展后的 panel model。
- 教程 `tutorials/commit/0397-add-bounded-trading-host-seams.md:63-65` 记录了 actual
  release-probe mutation：移除 root `TradingTicketPanel` export 得到 TS2724 RED，恢复后
  `release:local:check` GREEN。当前 source range `git diff --check` 通过且审查前 chartx2
  worktree clean；未发现 mutation 残留。此处只核验 implementer evidence/script，未将本轮称为
  authoritative post-review release。
- commit `8783cd3` 的 message、scope、tutorial numbering `0397` 和 deferred boundary 均符合
  本仓 AGENTS.md；range 未触及 Rust/Tauri、chart renderer、alpha2 source 或 persistence。

## Verification performed

- `git diff --check 63d6ea2..8783cd3` — PASS.
- `pnpm check` — PASS; both workspace Svelte checks report 0 errors / 0 warnings.
- `pnpm test:unit` — PASS; library 164 files / 576 tests, example 4 files / 16 tests.
- static inspection of source, built declarations/runtime, package-root exports, packed-consumer script,
  commit/tutorial and existing release-probe evidence.

Not run by this review: Cargo/debug, `pnpm release:local:check`, authoritative committed-HEAD release,
or alpha2 installation. Per requested sequence, `release:local:check` remains an implementer-evidence
inspection item and must be run only after a fresh review returns GO from a clean committed chartx2 HEAD.

## Release disposition

Do **not** proceed to the authoritative release yet. After P1/P2 are fixed, independently reviewed with
`P0=P1=P2=0`, committed and clean, this chartx2 HEAD may run the authoritative
`pnpm release:local:check`, record HEAD/tgz digests/SRI, and then enter alpha2 installed-package proof.

## Fix re-review — `8783cd3..c9680a4e`

日期：2026-07-25
性质：fresh Terra-high re-review；继续只读源码与已允许的前端验证。本节只追加审查结论；未修改
产品源码、未提交或 push。

### Re-review verdict

**NO-GO — P0=0 / P1=0 / P2=1。**

原 P1 与 P2 的产品/验证问题均已关闭：`$props.id()` 给每个 ledger instance 一个 SSR/hydration-safe
prefix；每个 tab 都拥有持续存在的、唯一关联的 panel，只有 active panel 渲染 rows；external packed
consumer 在 workspace 外真实验证同页多 ledger、exact ARIA relationship、replacement matrix 和完整
keyboard matrix。没有新增 public seam 或把 alpha2/domain/accounting/generation/Tauri/command/
persistence authority 带进 chartx2，source/build/runtime package root 也一致。

但本仓 `AGENTS.md` 要求每个 non-trivial commit 在 `tutorials/commit/NNNN-*.md` 增加一篇新的、连续
编号教程。`c9680a4` 是独立的 157-line product/test fix，却只更新了已有的 `0397`，没有新增
`0398-*.md`；这使 commit tutorial history 不完整。该 P2 是协作/交付纪律问题，而不是 ticket/ledger
功能或 package correctness 问题；在补齐独立教程并对其小范围复核前，不授权 authoritative release。

### Original findings closure

#### CLOSED P1-01 — instance-local ARIA IDs and panel association

- `TradingLedgerPanel.svelte:24-35` 使用 runes props，`$props.id()` 在 line 32 生成 component-tree
  identity；line `61-67` 用该 prefix 形成 tab/panel IDs，避免不同 mounted ledger 重名，并适合 SSR
  和 hydration。
- `100-131` 为每个 tab 生成 `role=tab`、unique `id`、`aria-controls`，以及存在的
  `role=tabpanel`、matching `aria-labelledby`。`hidden` 只隐藏 inactive panels；`133-183` 只在 active
  panel mount rows/detail，所以 row button bindings 不会保留在 hidden tab 或跨 tab 复用。
- packed consumer `318-337` 检查全 document `[id]` 无重复，并对 legacy 与 generic ledger 的每个
  tab 验证 `aria-controls -> existing panel` 和 `panel aria-labelledby -> same tab id`。`338-375` 再经
  tab 切换后验证 active visible panel、headers、focus 和 row selection，覆盖 active/hidden panel 与
  row focus binding 不串的实际运行路径。

#### CLOSED P2-01 — exact replacement and full keyboard evidence

- probe `199-220,297-312` 现在独立 mount `editor+actions`、editor-only 与 actions-only ticket；分别
  验证 replacement 已 mount、被替换的 default region 不重复、未替换 region 保留。legacy model/default
  DOM/onSubmit assertion 保持在 `291-295`。
- probe `349-357` 验证 tab `End/Home/ArrowRight/ArrowLeft` 的 callback-driven
  `aria-selected` 和 focus；`365-375` 验证 row pointer、`Home/ArrowDown/ArrowUp/End` 的 selected state
  与 focus。library source `69-95` 对应实现，`pnpm check` 为 0 errors/warnings。

### Remaining finding

#### P2-02 — `c9680a4` 缺少本仓要求的独立连续 commit tutorial

`c9680a4` 的 message 将本次定位为独立 shell correctness fix，且改变
`TradingLedgerPanel.svelte`、packed consumer 与 0397 tutorial；它不是微小格式化。当前
`tutorials/commit/` 最大编号仍为 `0397-add-bounded-trading-host-seams.md`，没有 `0398-*.md`。
repo-local `AGENTS.md` 的 commit tutorial rule 要求 every non-trivial commit 新增 exactly one next
four-digit tutorial；仅重写上一 feature commit 的 tutorial 不能留下这次 review-fix 的独立、可审计
解释与验证记录。

最小修复：新增 `tutorials/commit/0398-<topic>.md`，以中文说明为什么 `$props.id()` 和 all-panels
association 修复多实例 a11y，记录 one-sided snippet/keyboard packed evidence、实际运行命令与不含
scope；使用符合本仓格式的独立 docs commit。无需再触碰 chartx2 product source、public API 或 release
script。完成后只需小范围 re-review tutorial/commit/status，再从 clean committed HEAD 执行
authoritative release。

### Verification performed for re-review

- `git diff --check 63d6ea2..c9680a4` — PASS.
- `pnpm check` — PASS; library and example Svelte checks both 0 errors / 0 warnings.
- `pnpm test:unit` — PASS; library 164 files / 576 tests, example 4 files / 16 tests.
- `pnpm release:local:verify` — PASS; rebuilt and packed the tgz, installed it in a temporary workspace-outside
  consumer, and completed the actual browser probe.
- inspected public root source/build declarations/runtime and confirmed no new export/type seam beyond the
  original ticket snippets and ledger presentation model.

Not run: Cargo/debug, `pnpm release:local:check`, alpha2 install, or authoritative committed-HEAD release.
The only chartx2 worktree dirt after review is this requested untracked report; there is no product-source dirt.

### Release disposition after re-review

**Not yet authorized.** Close P2-02 with the required independent `0398` tutorial commit and a small fresh
review. If that re-review returns `P0=P1=P2=0`, authorize `pnpm release:local:check` from the exact clean,
committed chartx2 HEAD, then record its HEAD/tgz digests/SRI before alpha2 installed-package proof.

## Bounded process re-review — `c9680a4..d1f84d3d`

日期：2026-07-25
性质：只读 process/tutorial re-review；不运行 release、不修改或提交。

### Final verdict

**GO — P0=0 / P1=0 / P2=0。**

`d1f84d3d` 是一个纯文档提交：range 只新增
`tutorials/commit/0398-explain-isolated-ledger-semantics.md`，没有 source、test、public API、package
artifact 或 release-script diff；`git diff --check c9680a4..d1f84d3d` PASS。它补齐本仓 AGENTS.md 要求的
独立、连续四位编号教程（0397 后为 0398），其 commit message、purpose、changes、verification 和
not-included 均如实描述为 c9680a4 repair 的解释文档，而没有伪称重新运行 authoritative release。

教程的技术叙述与已核对的事实一致：

- `$props.id()` 的 per-instance SSR/hydration-safe prefix 与
  `TradingLedgerPanel.svelte:18-35,61-67` 相符；没有增加 host-provided public ID seam。
- per-tab `aria-controls` / `aria-labelledby`、persistent panel 与 active-only rows/detail 的说明，
  与 `100-185` 一致；没有把 hidden panel row focus 说成仍挂载。
- editor-only/actions-only/both、unique document IDs、exact tab/panel association，以及 tab/row
  Arrow/Home/End callback, `aria-selected`, focus evidence，与 packed consumer `297-375` 一致。
- 列出的 `pnpm check`、`pnpm test:unit`、`pnpm release:local:verify` 明确归属 c9680a4 已运行证据；
  `pnpm release:local:check` 仍被正确保留为 review GO 后才执行的 authoritative gate。

范围内没有新 domain/accounting/generation/Tauri/command/persistence authority、第三 public seam，
也没有 legacy/default、build/runtime 或 release-flow 漂移。此前 P2-02 已关闭。

### Final release authorization

**Authorized:** 从 exact committed chartx2 HEAD `d1f84d3d9a20faffb4c3760278266ba1bd0a2a22`（product
source 仍为已审查的 `c9680a4`）执行 authoritative `pnpm release:local:check`。执行时保留本报告为
requested untracked review artifact，但不得混入任何产品源码或 package 变更；随后记录 exact HEAD、tgz
SHA-256、SHA-512 与 pnpm SRI，才进入 alpha2 ordinary-install / installed-package proof。

### Bounded verification

- inspected `d1f84d3d` commit message, name-status and full diff — only 0398 tutorial added.
- `git diff --check c9680a4..d1f84d3d` — PASS.
- checked tutorial sequence `0397 -> 0398`, its required newcomer-oriented sections and its factual references
  against the already-reviewed c9680a4 source and packed consumer script.
- did not run release, Cargo, debug, tests, or write product source. The only worktree dirt is this requested
  untracked review report.
