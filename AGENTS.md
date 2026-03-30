# chartx2 AGENTS

This file is the repo-local collaboration contract for `chartx2`.

Parent rules in [../AGENTS.md](/Users/dev/workspace2/hc_apps/AGENTS.md) still apply. This file only adds `chartx2`-specific truth, commands, boundaries, and commit workflow.

## 项目概览

- `chartx2` 是当前唯一活跃的 `chartx` 线路。
- 这个项目不是普通业务后台，也不是通用内容站；它是一个面向 K 线与技术分析场景的图表套件样例程序。
- 当前仓库里可运行的部分仍然是 `Tauri + SvelteKit` 宿主壳。
- 已确认的实现路线是：
  - 先用 `Svelte` 实现一个接近 `lightweight-charts` 的基础图表软件
  - 再逐步把它扩展成更完整的图表系统，而不是停在轻量图库级别
- 长期目标不是停留在 `lightweight-charts` 级别，而是逐步逼近 TradingView 图表页那类完整图表体验：
  - 多图布局
  - 指标体系
  - drawing / replay / alert
  - 自定义周期与图表类型
  - 桌面端优先，同时保留走向 Web / mobile 的可能
- 目标参考效果以用户给出的 TradingView 页面为准：
  - [TradingView chart example](https://www.tradingview.com/chart/ScC5PLvy/?symbol=NASDAQ%3ANDX)
- 用户给出的最终特性图片应视为目标能力清单参考，而不是“当前已实现能力”说明。当前已明确提到的目标能力包括：
  - `16 charts per tab`
  - `50 indicators per chart`
  - `40K historical bars`
  - `200 parallel chart connections`
  - `1,000 price alerts`
  - `1,000 technical alerts`
  - `15 watchlist alerts`
  - `Web, desktop and mobile apps`
  - `No ads`
  - `Volume profile`
  - `Custom timeframes`
  - `Custom Range Bars`
  - `Multiple watchlists`
  - `Bar Replay`
  - `Indicators on indicators`
  - `Chart data export`
  - `Intraday Renko, Kagi, Line Break, Point & Figure charts`
  - `Charts based on custom formulas`
  - `Multi-condition alerts`
  - `Time price opportunity`
  - `Volume footprint`
  - `Volume candles`
- 任何当前模板代码、占位命令、草稿文件，都不应被误判为最终架构。

## 适用范围

These rules apply to everything under `/Users/dev/workspace2/hc_apps/chartx2`.

Use this file especially when changing:

- Svelte host app in `src/`
- Tauri shell and Rust bridge in `src-tauri/`
- chart-engine scaffolding or future chart library code under this repo
- docs that describe product direction, module boundaries, or implementation stages
- commit tutorials under `tutorials/commit/`

## 目录导航

- [README.md](/Users/dev/workspace2/hc_apps/chartx2/README.md): current starter-template readme; not the final product spec
- [docs/develop.md](/Users/dev/workspace2/hc_apps/chartx2/docs/develop.md): historical session notes and roadmap fragments; useful for context, but may drift from the current filesystem
- [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte): current Svelte entry page, still mostly template code
- [src/routes/+layout.ts](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+layout.ts): SPA/SSR boundary for the Tauri host
- [src-tauri/src/lib.rs](/Users/dev/workspace2/hc_apps/chartx2/src-tauri/src/lib.rs): current Tauri command registration and backend entry wiring
- [src-tauri/src/main.rs](/Users/dev/workspace2/hc_apps/chartx2/src-tauri/src/main.rs): desktop app bootstrap
- [chart-model.ts](/Users/dev/workspace2/hc_apps/chartx2/chart-model.ts): currently points to a missing path; treat as stale scaffolding until repaired
- [tutorials/commit](/Users/dev/workspace2/hc_apps/chartx2/tutorials/commit): per-commit newcomer tutorials

## 常用命令

From repo root:

```bash
pnpm check
pnpm build
pnpm tauri dev
```

From `src-tauri/`:

```bash
cargo check
cargo test
```

Notes:

- `package.json` exists and defines `pnpm`-style scripts, but there is no lockfile checked in right now. Confirm package-manager expectations before introducing workspace-level tooling.
- `pnpm test`, `pnpm lint`, Storybook, and benchmark commands are not wired yet. Do not claim they exist until they are actually added.

## 开发原则

- Treat `chartx2` as a chart-engine project first and a demo shell second.
- Prefer engine boundaries that can later support web, desktop, and multi-chart use rather than baking chart behavior directly into one Svelte page.
- Keep the Tauri host thin when possible:
  - Svelte handles product shell and interaction surfaces.
  - reusable chart behavior should move toward explicit chart modules, not stay trapped in page-local code.
  - Rust should only own desktop integration, local services, and performance-sensitive native work that truly belongs there.
- Build in slices that can be verified independently:
  - viewport / scale
  - series model
  - render pipeline
  - crosshair / interaction
  - panes / overlays
  - indicators
  - persistence / replay / alerts
- When docs describe future architecture that is not on disk yet, mark it as planned rather than implemented.

## 代码约定

- Current frontend stack is `Svelte 5 + SvelteKit + TypeScript + Vite`.
- Current desktop shell is `Tauri 2`.
- Keep `src/routes/+page.svelte` from becoming a permanent dumping ground for chart internals. Once chart logic stops being trivial, extract it into dedicated modules.
- Avoid coupling future chart primitives to Tauri-only APIs unless the feature is genuinely desktop-specific.
- Keep public chart concepts explicit and stable when they appear:
  - time scale
  - price scale
  - pane
  - series
  - overlay
  - indicator
  - drawing
  - layout
- Prefer naming modules by chart responsibilities, not generic UI terms like `utils2`, `misc`, or `helpers-final`.
- `docs/develop.md` can keep session history, but it is not the source of truth for architecture on its own. If implementation diverges, update docs or add a narrower design note.

## 应用领域硬约束

- Do not frame `chartx2` as "just rebuilding the current template page".
- Do not optimize only for a single-chart demo if the change blocks later support for multi-pane or multi-chart layouts.
- Do not describe the goal as merely matching current `lightweight-charts` features; the intended direction is a broader charting system.
- When making architecture or scope decisions, prefer choices that keep the path open toward the explicitly stated end-state feature set above, even if the current slice only lands a much smaller subset.
- Do not silently treat stale scaffolding as production API:
  - `chart-model.ts` currently references a missing module
  - `README.md` is still starter-template text
  - `src/routes/+page.svelte` and `src-tauri/src/lib.rs` are template-level examples
- Non-standard files such as `/a`, `/b`, and `/temp_page.html` should be treated as scratch or imported artifacts unless they are deliberately promoted and documented.
- Compatibility-sensitive areas should be called out before casual refactors once they exist:
  - chart public API
  - persisted layout / template schema
  - indicator registration contracts
  - datafeed adapter contracts
  - drawing serialization formats

## 测试与验收

- For Svelte / TypeScript changes, run at least:
  - `pnpm check`
- For production-build-affecting frontend changes, prefer also running:
  - `pnpm build`
- For Rust / Tauri changes, run at least:
  - `cargo check`
- If a user-visible chart interaction changes, prefer one real manual verification note in addition to static checks, such as:
  - manual desktop flow check
  - manual browser interaction check
  - screenshot comparison
- Do not claim test coverage that does not exist.
- If tests were skipped because the project still lacks the relevant harness, say that explicitly in both the commit message and the tutorial.

## 禁止事项

- Do not keep piling real chart functionality into template welcome code without extracting structure.
- Do not claim TradingView-grade capability from roadmap text alone.
- Do not invent package scripts, test harnesses, or module directories that are not actually present.
- Do not broaden desktop integration work into unrelated backend systems unless the user explicitly asks for that.
- Do not delete or rewrite historical notes in `docs/develop.md` just to make the file look clean; preserve history unless there is a clear documentation migration.
- Do not mix unrelated slices such as rendering refactors, indicator experiments, and desktop packaging tweaks into one commit.

## 需要先确认的情况

Confirm with the user before:

- changing or freezing the public chart API surface for external consumers
- introducing a new top-level package layout such as a dedicated `chartx/` engine package
- changing persistence schema for layouts, indicators, drawings, replay state, or alerts
- adopting a new package manager or adding workspace-level tooling assumptions
- removing historical or scratch files when it is unclear whether the user still wants them as reference
- adding heavy native/Rust dependencies for performance work that materially change build complexity

## 提交 / PR 要求

Follow the root commit format in [../AGENTS.md](/Users/dev/workspace2/hc_apps/AGENTS.md).

For `chartx2`, also require:

- Use a meaningful scope such as:
  - `chartx2-shell`
  - `chartx2-renderer`
  - `chartx2-model`
  - `chartx2-series`
  - `chartx2-interaction`
  - `chartx2-layout`
  - `chartx2-indicator`
  - `chartx2-tauri`
  - `chartx2-docs`
- When a change is only one step of a larger TradingView-like feature, name the current slice honestly and list the deferred pieces in `Not included:`.
- If the work touched stale scaffolding, say whether it was repaired, replaced, or intentionally left as-is.
- If verification is limited to static checks, say so plainly. Do not imply runtime validation that never happened.

### 自动提交规则

Unless the user explicitly says not to commit yet:

- once a discrete feature slice is complete, verified, and documented, the agent should commit it without waiting for a second reminder
- a valid feature slice in `chartx2` usually means one coherent charting capability or one coherent documentation/process improvement, for example:
  - extracting one chart core module from the page shell
  - landing one render or interaction primitive end-to-end
  - adding one indicator or layout capability with its wiring
  - tightening repo process docs such as `AGENTS.md` and commit tutorials
- before auto-committing, the agent must:
  - write or update the matching tutorial in `tutorials/commit/`
  - prepare a high-signal multi-line commit message
  - include truthful verification
- do not auto-commit exploratory half-migrations, broken scaffolding, or mixed unrelated edits

### 提交教程规则

- Every non-trivial commit should add exactly one new tutorial under `tutorials/commit/NNNN-short-topic.md`.
- Use the next available four-digit number.
- Tutorials should teach a Chinese-speaking newcomer what changed and why.
- Keep commands, file paths, API names, and code symbols in original form when that makes the tutorial more usable.
- Default tutorial sections:
  - `背景`
  - `主要目标`
  - `改动概览`
  - `关键知识`
  - `补充知识`
  - `验证`
  - `未覆盖项`
- `补充知识` should include 1 to 2 short beginner-friendly lessons drawn from the real work, such as:
  - a Svelte / Rust / rendering concept that mattered
  - a chart-architecture design choice
  - a debugging or agent-collaboration tactic that helped
- Tutorials must explain partial boundaries honestly when a larger charting capability is still incomplete.

## 参考资料

- [../AGENTS.md](/Users/dev/workspace2/hc_apps/AGENTS.md)
- [README.md](/Users/dev/workspace2/hc_apps/chartx2/README.md)
- [docs/develop.md](/Users/dev/workspace2/hc_apps/chartx2/docs/develop.md)
- [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte)
- [src-tauri/src/lib.rs](/Users/dev/workspace2/hc_apps/chartx2/src-tauri/src/lib.rs)

## 子目录约定

- If a deeper subdirectory later gets its own `AGENTS.md`, it should narrow these rules rather than contradict them.
- If a future dedicated chart-engine package is introduced inside `chartx2`, it should get its own child `AGENTS.md` with module-specific rules for rendering, API shape, and performance boundaries.
