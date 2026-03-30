# chartx2

`chartx2` is the active `chartx` line in `hc_apps`.

This project is not a generic frontend app. It is a charting-suite sample program built with `Svelte`, `SvelteKit`, and `Tauri`, with a long-term goal of growing from a `lightweight-charts`-class K-line engine into a more complete TradingView-like chart workstation.

## Current Direction

- Phase one floor:
  - fully implement `lightweight-charts`-class chart capability
- Long-term ceiling:
  - move toward a modifiable TradingView-like chart experience
  - support richer layouts, indicators, replay, alerts, custom chart types, and local integration

The current repository state is still early:

- the desktop host is a `Tauri + SvelteKit` shell
- the main page is still close to the starter template
- `docs/develop.md` contains planning history and should be read as roadmap context, not proof that all planned modules already exist on disk

## Why This Exists

The intended first real user is the founder.

The goal is not only to avoid paying for `TradingView`. The real goal is to own and modify the chart system freely, instead of being limited by a closed product boundary. `chartx2` is meant to become a chart engine and workstation that can be extended without waiting on a third-party vendor.

## Repo Layout

- [AGENTS.md](/Users/dev/workspace2/hc_apps/chartx2/AGENTS.md)
  - local collaboration rules, commit discipline, and project boundaries
- [docs/develop.md](/Users/dev/workspace2/hc_apps/chartx2/docs/develop.md)
  - session notes, roadmap fragments, and historical planning context
- [src](/Users/dev/workspace2/hc_apps/chartx2/src)
  - Svelte host app
- [src-tauri](/Users/dev/workspace2/hc_apps/chartx2/src-tauri)
  - Tauri desktop shell and Rust bridge
- [tutorials/commit](/Users/dev/workspace2/hc_apps/chartx2/tutorials/commit)
  - one newcomer-facing tutorial per non-trivial commit

## Commands

From the repo root:

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

- `pnpm check` currently depends on a complete frontend install. If local `node_modules` is incomplete, it will fail before type-checking.
- `cargo check` is the lowest-cost real validation for the Rust/Tauri side right now.

## Near-Term Priority

Before chasing the full TradingView feature surface, establish a clean engine-first foundation:

- chart model
- render pipeline
- time and price scales
- K-line series behavior
- interaction primitives such as crosshair, pan, and zoom

The project should avoid turning `src/routes/+page.svelte` into the permanent home of chart internals. As chart logic grows, it should move into dedicated modules with clear boundaries.
