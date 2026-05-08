# chartx2

`chartx2` is the active `chartx` line in `hc_apps`.

This repo is being reorganized into a library-first workspace. The product goal is unchanged: grow from a `lightweight-charts`-class K-line engine into a more complete TradingView-like chart workstation. The ownership split is changing:

- `packages/chartx2`
  - the pure reusable chart library
- `examples/tauri-svelte`
  - the official Tauri + Svelte example app that uses the library

The repo root is no longer meant to be the app itself. It becomes the workspace shell for orchestration, docs, and verification.

## Current Direction

- Phase one floor:
  - fully implement `lightweight-charts`-class chart capability
- Long-term ceiling:
  - move toward a modifiable TradingView-like chart experience
  - support richer layouts, indicators, replay, alerts, custom chart types, and local integration

The current repository state is still early, but it is no longer just a starter shell:

- the desktop host is a `Tauri + SvelteKit` shell
- the main page now hosts a working phase-one chart workstation/demo surface with pane, study, drawing, performance, and snapshot flows
- the chart runtime has already been split across focused owners and coordinators instead of keeping all runtime policy in one harness file
- `docs/develop.md` contains planning history and should be read as roadmap context, not proof that every planned future module already exists on disk

## Why This Exists

The intended first real user is the founder.

The goal is not only to avoid paying for `TradingView`. The real goal is to own and modify the chart system freely, instead of being limited by a closed product boundary. `chartx2` is meant to become a chart engine and workstation that can be extended without waiting on a third-party vendor.

## Workspace Layout

- [packages/chartx2](/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2)
  - reusable chart library package
- [examples/tauri-svelte](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte)
  - official desktop example app using the library

## Current Repo Layout

- [AGENTS.md](/Users/dev/workspace2/hc_apps/chartx2/AGENTS.md)
  - local collaboration rules, commit discipline, and project boundaries
- [docs/develop.md](/Users/dev/workspace2/hc_apps/chartx2/docs/develop.md)
  - session notes, roadmap fragments, and historical planning context
- [docs/post-harness-next-lines.md](/Users/dev/workspace2/hc_apps/chartx2/docs/post-harness-next-lines.md)
  - the current post-harness roadmap for what is actually next versus what is already done
- [docs/tradingview-alignment-plan.md](/Users/dev/workspace2/hc_apps/chartx2/docs/tradingview-alignment-plan.md)
  - the three-layer plan for aligning `chartx2` with a modifiable TradingView-like workstation
- [packages/chartx2/src/lib](/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib)
  - reusable chart engine internals, public contracts, and reusable Svelte shells
- [examples/tauri-svelte/src](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src)
  - official example app routes, demo composition, and example-local runtime fixtures
- [examples/tauri-svelte/src-tauri](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src-tauri)
  - Tauri host for the official example app
- [tutorials/commit](/Users/dev/workspace2/hc_apps/chartx2/tutorials/commit)
  - one newcomer-facing tutorial per non-trivial commit

## Commands

From the repo root:

```bash
pnpm check
pnpm build
pnpm test
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

- `pnpm check` is the workspace gate across the library package and the official example app.
- `cargo check` is the lowest-cost real validation for the Rust/Tauri side right now.

## Near-Term Priority

Before chasing the full TradingView feature surface, establish a clean engine-first foundation:

- chart model
- render pipeline
- time and price scales
- K-line series behavior
- interaction primitives such as crosshair, pan, and zoom

The project should avoid turning [examples/tauri-svelte/src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/examples/tauri-svelte/src/routes/+page.svelte) into the permanent home of chart internals. As chart logic grows, it should move into dedicated library or example-specific modules with clear boundaries.

The full long-range alignment plan is tracked in
[docs/tradingview-alignment-plan.md](/Users/dev/workspace2/hc_apps/chartx2/docs/tradingview-alignment-plan.md).

## Current Implementation Snapshot

Today the most important implemented surfaces are:

- a phase-one public chart API with managed panes, main-series switching, compare and moving-average studies, drawing tools, state snapshots, and chart templates
- a workstation-style demo page that exercises workbench, feature, and performance flows against the same chart engine
- a visual safety suite that covers both the phase-one API and the harness/workbench demos end-to-end

The most important remaining work is no longer "can this render a chart at all", but "how far can this engine/workstation boundary scale toward richer TradingView-class behavior without re-centralizing policy in the harness or demo shell".
