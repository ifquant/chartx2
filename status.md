# chartx2 status

Last updated: 2026-05-30

This file is the handoff entrypoint for a fresh session. It records the current
repo state, the project boundaries already agreed on, and the practical next
steps. Use `AGENTS.md` as the durable rulebook and this file as the current
snapshot.

## Current Git State

- Repo: `/Users/dev/workspace2/hc_apps/chartx2`
- Branch: `main`
- Remote: `origin/main`
- Latest observed state: `main...origin/main` with no ahead/behind marker and
  no uncommitted changes reported by `git status --short --branch`
- Latest pushed commit observed locally:
  - `cfc21b6 feat(chartx2-timeshare): add intraday market chart mode`

Recent relevant commits on main:

- `cfc21b6 feat(chartx2-timeshare): add intraday market chart mode`
- `8a5d2d1 feat(chartx2-orderbook): export compact ladder surface`
- `89352db feat(market-chart-surface): add inline right dock mode`
- `36eba35 fix(market-chart-surface): fill canvas host height`
- `ad13786 feat(market-chart-surface): add right dock slot`
- `466f4f6 feat(market-chart-surface): add integrated readout layout`
- `0067625 fix(market-chart-surface): fill host chart height`
- `2ffd0ac feat(market-chart-surface): add integrated indicator panes`
- `c29ea0b feat(chartx2-layout): add host-controlled plot layout options`
- `144597c chore(chartx2-release): default local tarballs to build directory`
- `582135a feat(chartx2-release): add a canonical local release check gate`
- `c66ca77 feat(chartx2-release): verify local tarballs through an external consumer`

## Project Direction

`chartx2` is the only active `chartx` line in `hc_apps`.

The project is library-first:

- `packages/chartx2` is the reusable chart library and public package surface.
- `examples/tauri-svelte` is the official Tauri + Svelte example app.
- The repo root is a workspace shell for orchestration, docs, and verification.

The product direction is engine-first:

- Short-term floor: reach and exceed a `lightweight-charts`-class K-line/charting
  engine.
- Long-term ceiling: move toward a modifiable TradingView-like chart workstation
  with richer layouts, panes, indicators, replay, alerts, custom chart types,
  and desktop-first integration.
- Do not treat current demo shell code as the final product architecture.

## Architecture Rules Already Agreed

The target object-model direction is closer to:

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

Important rules:

- `TimeScale` should be chart-level, shared by panes.
- `Pane` should be a first-class scene object, not a CSS trick under the main
  chart.
- `PriceScale` should evolve toward an explicit pane-local object with identity
  and attached sources.
- Runtime chart content should move toward `entityRegistry` / `SourceModel`
  instead of relying only on implicit pane children.
- Main series, studies, drawings, overlays, and compare sources should not all
  collapse into one generic series abstraction.
- Legend and toolbar should project or command runtime state; they should not
  own the chart runtime.

Current code is still a transition:

- Existing harness/runtime code is a bridge toward `ChartModel + render/view
  adapter`, not the final object model.
- Existing primary/secondary series state is transitional.
- Pane lifecycle and shared time scale are in the right direction.
- Demo app composition must stay separate from library ownership.

## Public Package Boundary

External consumers should import through:

```ts
import { ... } from "@chartx2/library";
```

Current public barrel:

- `packages/chartx2/src/lib/public/index.ts`

Current public export groups include:

- chart frame and market panel surfaces
- market chart surface and market data contracts
- order book ladder surface
- performance helpers
- account sync, sharing, strategy tester, trading ledger, and trading ticket
  shells
- workbench layout, host, indicator, alert, script, bottom-panel, workspace-tab,
  and drawing-inspector surfaces

Do not make sibling apps import from:

- `examples/tauri-svelte`
- `@chartx2/library/internal`
- raw `packages/chartx2/src/lib/...` paths

If `alpha2` or another app needs a stable seam, add it to the public package
surface first, run the release gate, then upgrade the consumer.

## Alpha2 Boundary

`chartx2` owns chart/workbench library surfaces. `alpha2` owns the full trading
desktop application shell.

Belongs in `chartx2`:

- chart engine internals
- chart runtime and persistence models
- chart-facing public contracts
- reusable chart/workbench shells
- chart-context panels and docks that only make sense when attached to an
  active chart, symbol, or timeframe

Belongs in `alpha2`:

- full trading desktop shell
- product-level menu bars
- top-level global toolbars
- left-side product navigation tabs
- app-wide workspace routing across non-chart products
- account/workspace chrome that still makes sense without a chart mounted

Practical test:

- If a UI surface still makes sense after removing the chart, keep it in
  `alpha2`.
- If it only makes sense while attached to active chart context, it is a
  candidate for `chartx2`.

## Local Release Flow

The local package release boundary is now canonical.

Default release command from repo root:

```bash
pnpm release:local:check
```

That gate runs, in order:

```bash
pnpm check
pnpm test:unit
pnpm release:local:verify
```

Release output directory:

```text
/Users/dev/workspace2/hc_apps/build/chartx2/
```

Expected local tarball shape:

```text
/Users/dev/workspace2/hc_apps/build/chartx2/chartx2-library-0.1.0.tgz
```

Sibling apps should consume it like:

```json
{
  "@chartx2/library": "file:../build/chartx2/chartx2-library-0.1.0.tgz"
}
```

Do not return to long-lived `link:` or source-path dependency as the committed
default. Source links are acceptable only for short debugging sessions.

## Current Implementation Snapshot

The library already has more than a starter shell:

- phase-one chart/workstation surfaces with pane, study, drawing, performance,
  and snapshot flows
- public host-facing shells for market chart, chart frame, market panels,
  trading ticket, trading ledger, strategy tester, sharing, account sync, and
  workbench UI components
- integrated market chart surface work:
  - host-controlled plot layout options
  - indicator panes
  - height-fill fixes for host/canvas containers
  - integrated readout layout
  - right-dock and inline right-dock modes
  - intraday timeshare market chart mode
- compact order book ladder surface exported through the public package
- canonical local release scripts and external consumer verification

The official example app still matters, but it should remain a demo/composition
host. Do not let it become the owner of library internals.

## Useful Files

- `AGENTS.md`: repo-local rules, boundaries, and command discipline
- `README.md`: current high-level overview and consumer boundary
- `docs/tradingview-alignment-plan.md`: long-range TradingView-like alignment
- `docs/lightweight-charts-gap-checklist.md`: parity and gap tracker
- `docs/post-harness-next-lines.md`: post-harness roadmap
- `docs/alpha2-host-integration.md`: host integration guide
- `docs/alpha2-host-surface-readiness.md`: readiness/audit notes for alpha2
  embedding
- `packages/chartx2/src/lib/public/index.ts`: public package barrel
- `packages/chartx2/src/lib/ui/`: reusable Svelte shells
- `examples/tauri-svelte/src/routes/+page.svelte`: official example app shell
- `tutorials/commit/`: newcomer-facing per-commit tutorials

## Commands

From repo root:

```bash
pnpm check
pnpm build
pnpm test
pnpm test:unit
pnpm test:visual
pnpm release:local
pnpm release:local:verify
pnpm release:local:check
```

Example app:

```bash
pnpm --filter @chartx2/example-tauri-svelte tauri
```

Tauri/Rust side:

```bash
cargo check --manifest-path examples/tauri-svelte/src-tauri/Cargo.toml
cargo test --manifest-path examples/tauri-svelte/src-tauri/Cargo.toml
```

Do not claim lint, Storybook, or benchmark commands exist unless they are
actually present.

## Next Best Work

Recommended next slices:

- Keep tightening the pure library vs example-app boundary. Anything stable and
  chart-adjacent that is still example-owned should be considered for promotion
  into `packages/chartx2`.
- Continue evolving `MarketChartSurface` toward real host embedding needs from
  `alpha2`, but keep app-level chrome in `alpha2`.
- Convert repeated public UI seams into clear public exports instead of letting
  sibling apps import internals.
- Continue moving toward explicit `ChartModel`, `PaneModel`, `PriceScaleModel`,
  `SourceModel`, `StudySource`, and `DrawingSource` concepts before adding too
  much more feature policy to the harness/demo layer.
- After any public API change needed by `alpha2`, run `pnpm release:local:check`,
  then update `alpha2` to the new tarball path/version.

## Known Risks

- The repo has many public shell exports now. Avoid widening the package API
  casually; prefer focused seams with tests.
- The example app can easily become a dumping ground again. Keep demo fixtures
  and library internals separate.
- The object model is still transitional. Feature work that adds panes, studies,
  overlays, drawings, alerts, or replay should avoid deepening the old
  primary/secondary-series shortcut.
- `alpha2` should not consume unpublished internals. If a needed surface is
  missing, add it to `@chartx2/library` and repack.
- Tarball path drift has happened before. The current default is
  `/Users/dev/workspace2/hc_apps/build/chartx2`, not `releases/chartx2`.

## Last Verified In This Handoff

Commands run while writing this file:

```bash
git -C /Users/dev/workspace2/hc_apps/chartx2 status --short --branch
git -C /Users/dev/workspace2/hc_apps/chartx2 log --oneline -12
cat /Users/dev/workspace2/hc_apps/chartx2/package.json
sed -n '1,280p' /Users/dev/workspace2/hc_apps/chartx2/AGENTS.md
sed -n '1,220p' /Users/dev/workspace2/hc_apps/chartx2/README.md
sed -n '1,260p' /Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public/index.ts
```

No build/test gate has been rerun for this documentation-only handoff yet.
