# chartx2 AGENTS

This file is the repo-local collaboration contract for `chartx2`.

Parent rules in [../AGENTS.md](/Users/dev/workspace2/hc_apps/AGENTS.md) still apply. This file only adds `chartx2`-specific truth, commands, boundaries, and commit workflow.

## 项目概览

- `chartx2` 是当前唯一活跃的 `chartx` 线路。
- 这个项目不是普通业务后台，也不是通用内容站；它是一个面向 K 线与技术分析场景的图表套件样例程序。
- 当前仓库正在重组为 library-first workspace：
  - `packages/chartx2` 负责纯图表库
  - `examples/tauri-svelte` 负责官方 `Tauri + Svelte` 使用案例
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

## TradingView 对象模型方向

`chartx2` 的长期实现方向，不应被建模成“一个页面里包着一个 canvas，再往里塞一些 series”。更接近 TradingView 的抽象应该是：

```text
WidgetShell / Layout
└─ Charts[]
   └─ ChartModel
      ├─ TimeScale
      ├─ Panes[]
      │  ├─ PriceScales[]
      │  └─ Sources (via entityRegistry)
      ├─ LegendViewModel
      ├─ ToolbarRegistry / CommandBus
      ├─ Theme / Overrides
      └─ LayoutSnapshot / Templates / UserSettings
```

实现和重构时，按下面这些规则判断路线是否偏了：

- `TimeScale` 是 `ChartModel` 级单例，所有 panes 共用一条时间轴；不要把它做成 pane 私有对象。
- `Pane` 是一等场景对象，不是“主图底下多塞一块区域”的样式技巧。
- `PriceScale` 是 pane 级对象，最终应具有 `id / side / mode / autoScale / visibleRange / attachedSourceIds` 这类身份与挂载语义；不要长期停留在“一个 `{ min, max }` 结构体”。
- 运行时图表内容应该走 `entityRegistry` / `SourceModel`，而不是只靠 pane children 的隐式树关系。
- `MainSeriesSource`、`StudySource`、`DrawingSource` 应分开建模；不要把所有附加图层都继续塞成“另一个 series”。
- `OverlayStudy` 和 `CompareStudy` 在方向上都属于 `StudySource` 的子类，不应作为漂浮在 chart 外面的特殊节点。
- `Legend` 是 source 状态的投影层，`Toolbar` 是命令入口层；二者都不应该反过来拥有或主导 chart runtime state。
- `Theme / Template / LayoutSnapshot / UserSettings` 是跨层配置与持久化模型，不等于运行时 `ChartModel`。

当前代码与这套模型的关系，要按“对齐中”理解：

- 现有 `chart-harness` 更像是 `ChartModel + render/view adapter` 的过渡承载层，不应无限膨胀成最终对象模型。
- 现有 primary/secondary series 状态只是过渡路径；后续继续做 study、drawing、compare 之前，应优先往 `SourceModel` / `entityRegistry` 迁移。
- 现有 pane lifecycle 和 shared time scale 是正确方向，但 price scale 还要继续朝显式 pane-local scale object 演进。
- demo shell 只负责展示 public API，不应成为 chart internals 的 owner。

## 适用范围

These rules apply to everything under `/Users/dev/workspace2/hc_apps/chartx2`.

Use this file especially when changing:

- reusable library code in `packages/chartx2`
- example app code in `examples/tauri-svelte`
- docs that describe product direction, module boundaries, or implementation stages
- commit tutorials under `tutorials/commit/`

## 目录导航

- [README.md](/Users/dev/workspace2/hc_apps/chartx2/README.md): current starter-template readme; not the final product spec
- [docs/develop.md](/Users/dev/workspace2/hc_apps/chartx2/docs/develop.md): historical session notes and roadmap fragments; useful for context, but may drift from the current filesystem
- [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md): historical phase-one execution floor; use it as the completed migration baseline, not as the full current capability map
- [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md): current parity and next-gap tracker against `lightweight-charts`
- [packages/chartx2](/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2): target home for reusable chart library code
- [examples/tauri-svelte](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte): target home for the official example app
- [packages/chartx2/src/lib/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/index.ts): public library barrel for `@chartx2/library`
- [packages/chartx2/src/lib/internal](/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/internal): chart engine internals; example/demo code should not cross this boundary casually
- [packages/chartx2/src/lib/ui](/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/ui): reusable host-facing and chart-adjacent Svelte shells
- [examples/tauri-svelte/src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/routes/+page.svelte): official example app shell that composes the library surfaces
- [examples/tauri-svelte/src/routes/+layout.ts](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/routes/+layout.ts): SPA boundary for the example app host
- [examples/tauri-svelte/src-tauri/src/lib.rs](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src-tauri/src/lib.rs): Tauri command registration and backend entry wiring for the example app
- [examples/tauri-svelte/src-tauri/src/main.rs](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src-tauri/src/main.rs): example desktop app bootstrap
- [tutorials/commit](/Users/dev/workspace2/hc_apps/chartx2/tutorials/commit): per-commit newcomer tutorials

## Alpha2 Boundary

`chartx2` must be treated as a chart/workbench UI library plus engine line, not as the owner of the entire trading-desktop application chrome.

What belongs in `chartx2`:

- chart engine internals
- chart runtime models and persistence models
- chart-facing public contracts
- reusable chart/workbench shells
- chart-context panels such as trading/strategy/share/sync shells when they are designed for host embedding
- reusable summary strips, docks, and host-facing composition helpers that are still centered on an active chart/symbol/timeframe context

What does **not** belong in `chartx2`:

- the full `alpha2` desktop application shell
- product-level menu bars
- top-level global toolbars that orchestrate the whole trading app
- left-side product navigation tabs
- global workspace routing across multiple non-chart products
- app-wide account/workspace chrome that still makes sense without any chart mounted

Practical rule:

- if a UI surface still makes sense when the chart is removed, it is usually `alpha2` host-app code
- if a UI surface only makes sense when attached to active chart context, it is usually `chartx2`

Workspace ownership rule:

- `packages/chartx2` owns reusable chart engine, public contracts, and reusable chart-adjacent UI shells
- `examples/tauri-svelte` owns demo composition, routes, Tauri host wiring, and showcase runtime fixtures
- do not keep public exports wired to `examples/` or example-owned `src/lib/example-app` paths once a library-owned home exists

Implementation consequence:

- do not move `alpha2` desktop shell chrome into `chartx2`
- do keep extracting stable chart-adjacent shells and contracts out of app repos and back into `chartx2`
- when a new reusable UI pattern appears for the second time around chart context, prefer promoting it into `chartx2` instead of letting sibling apps fork it

## 常用命令

From repo root:

```bash
pnpm check
pnpm test
pnpm build
```

From the official example app:

```bash
pnpm --filter @chartx2/example-tauri-svelte tauri
```

From the example app's Tauri host:

```bash
cargo check --manifest-path examples/tauri-svelte/src-tauri/Cargo.toml
cargo test --manifest-path examples/tauri-svelte/src-tauri/Cargo.toml
```

Notes:

- `pnpm-lock.yaml` is checked in. Keep dependency and script changes aligned with it.
- `pnpm test` exists and should be the default verification path for chart-engine behavior, unit coverage, and browser visual baselines.
- Do not claim `pnpm lint`, Storybook, or benchmark commands exist unless they are actually present on disk.

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
- Keep [examples/tauri-svelte/src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/routes/+page.svelte) from becoming a permanent dumping ground for chart internals. Once chart logic stops being trivial, extract it into dedicated modules.
- Avoid coupling future chart primitives to Tauri-only APIs unless the feature is genuinely desktop-specific.
- Keep public chart concepts explicit and stable when they appear:
  - time scale
  - price scale
  - pane
  - source
  - main series
  - study
  - overlay
  - compare
  - indicator
  - drawing
  - layout
- Prefer naming modules by chart responsibilities, not generic UI terms like `utils2`, `misc`, or `helpers-final`.
- `docs/develop.md` can keep session history, but it is not the source of truth for architecture on its own. If implementation diverges, update docs or add a narrower design note.
- When introducing new runtime structures, prefer names that fit the target object model directly:
  - `ChartModel`
  - `PaneModel`
  - `PriceScaleModel`
  - `SourceModel`
  - `StudySource`
  - `DrawingSource`
  - `LegendViewModel`
  - `LayoutSnapshot`

## 应用领域硬约束

- Do not frame `chartx2` as "just rebuilding the current template page".
- Do not optimize only for a single-chart demo if the change blocks later support for multi-pane or multi-chart layouts.
- Do not describe the goal as merely matching current `lightweight-charts` features; the intended direction is a broader charting system.
- When making architecture or scope decisions, prefer choices that keep the path open toward the explicitly stated end-state feature set above, even if the current slice only lands a much smaller subset.
- Do not silently treat the demo shell as the chart object model:
  - `examples/tauri-svelte/src/routes/+page.svelte` is a showcase host, not the owner of chart runtime state
  - toolbar/readout/watchlist panels are UI composition, not substitutes for engine entities
- Do not blur runtime models and persistence models:
  - runtime source state is not a layout snapshot
  - a drawing entity is not the same thing as a drawing template
  - theme overrides are not the same thing as pane/series ownership
- Do not silently treat stale starter text as product spec:
  - `README.md` is still starter-template text
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
- For chart engine, public API, interaction, renderer, or visual changes, run at least:
  - `pnpm test`
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
- [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)
- [docs/lightweight-charts-gap-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/lightweight-charts-gap-checklist.md)
- [examples/tauri-svelte/src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/routes/+page.svelte)
- [examples/tauri-svelte/src-tauri/src/lib.rs](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src-tauri/src/lib.rs)

## 子目录约定

- If a deeper subdirectory later gets its own `AGENTS.md`, it should narrow these rules rather than contradict them.
- If a future dedicated chart-engine package is introduced inside `chartx2`, it should get its own child `AGENTS.md` with module-specific rules for rendering, API shape, and performance boundaries.
