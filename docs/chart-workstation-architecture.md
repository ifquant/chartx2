# Chart Workstation Architecture

Date: 2026-04-18

This document defines the next stable product boundary for `chartx2`.

`chartx2` is not the final trading platform. It is the chart workstation module that a future trading product can embed and drive.

## Core Decision

The repository should be treated as three layers:

```text
Chart Engine
├─ ChartModel
├─ TimeScaleModel
├─ PaneModel
├─ PriceScaleModel
├─ SourceRegistry
├─ MainSeriesSource / StudySource / DrawingSource
└─ ChartSnapshot

Chart Workstation Shell
├─ TopToolbarModel
├─ LeftDrawingToolbarModel
├─ RightSidebarModel
├─ BottomPanelModel
├─ MultiChartLayoutModel
└─ ChartHosts[]

Host Integration Contract
├─ MarketDataAdapter
├─ WatchlistProvider
├─ AlertProvider
├─ PerformanceProvider
├─ WorkbenchPersistenceProvider
└─ HostIntentBridge
```

This means:

- `chartx2` is responsible for chart and chart-adjacent workstation behavior.
- the future host trading application is responsible for account, broker, orders, and full trading backend logic.
- `chartx2` must expose explicit contracts instead of requiring the host to reach into chart runtime internals.

## Workstation Scope

The workstation shell is intentionally chart-centered.

First-class shell zones:

- top toolbar
- left drawing toolbar
- right sidebar
- bottom panel
- multi-chart layout

First-class sidebar models in the initial line:

- `WatchlistPanelModel`
- `AlertPanelModel`

Deferred sidebar placeholders:

- news
- object tree
- screener
- symbol detail

## Market vs Performance

`performance` remains part of `chartx2`, but as a separate chart family.

It shares:

- rendering primitives
- layout slots
- selection plumbing

It does not share:

- market chart `TimeScaleModel`
- market chart `PriceScaleModel`
- market `SourceRegistry`
- market study/drawing runtime

The boundary stays:

```text
Parameter Surface -> Run -> Trade -> Market Chart
```

## Public Contract Direction

The public contract should be explicit enough that the future host app can:

- feed market data
- persist workbench state
- provide watchlists and alerts
- provide performance data
- open symbols and locate runs/trades through intents

The first public workstation contract lives in:

- [src/lib/chartx/public/workbench.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/workbench.ts)

This is a contract slice, not the full product.

## Implementation Rule

Near-term work should continue to protect the cleaned chart-core boundary:

- keep `chart-harness` as a thin composition root instead of re-centralizing runtime policy there
- move shared runtime policy into explicit model-layer or owner-layer code only when that changes real scalability or correctness
- workstation shell should consume chart runtime through contracts, not own it

Current status:

Post-harness shrink status:

- completed:
  - source, pane, drawing, render, scale, shell, runtime-query, and event-subscription composition now live behind focused owners and coordinators instead of one monolithic harness body
  - adapter-shell responsibilities now live behind focused state, state-shell, restore-shell, interaction-shell, public-shell, and entry-shell owners
  - chart entry exports, public API types, and caller imports now route through dedicated entry/api modules instead of using `chart-harness.ts` as a fallback barrel
  - `chart-harness.ts` now acts primarily as the phase-one composition root instead of also carrying entry glue and compatibility-export policy
  - the phase-one runtime graph now has a first explicit container boundary for `ChartModel`, `DrawingRegistry`, `TimeScale`, and renderer instances, so harness construction is less tied to direct object instantiation
  - the runtime container now also carries a first shared access surface for context snapshots, source registry queries/mutations, secondary scales, and drawing-registry removal, so harness wiring is less coupled to raw `ChartModel` calls
  - pane lookup/list/mutation access, primary price-scale access, time-scale access, and drawing-registry lookup now also route through the runtime container surface instead of through harness-local getters
  - render callback wiring and secondary visible-range reads now also route through explicit runtime-container accessors instead of reaching into renderer bags or scale arrays directly from the harness
  - pane frame, active-pane, and divider geometry now also route through a shared pane-layout owner instead of being reassembled separately in render, interaction, and drawing-interaction paths
  - pane height reads, pane option reads/mutation, and divider-driven pane resize composition now also route through a shared pane-layout runtime owner instead of remaining as inline pane-owner bookkeeping glue
  - pane preferred-height normalization and divider clamp policy now also route through a shared pane-layout policy owner, so pane runtime and pane-state restore no longer carry separate normalization logic
  - secondary-secondary pane dividers now stay interactive when either adjacent pane is resizable, and divider clamp policy now distinguishes primary-secondary from secondary-secondary resize spans
  - pane resize state now captures `controlledPaneId` at pointer-down time, so divider drags execute against one validated control target instead of re-deriving the resizable side on every move
  - pane frame allocation now routes through a dedicated pane-frame policy, so secondary scaling and rounding remainder distribution are no longer implicit inside `buildPaneFrames` or biased toward the last pane
  - pane runtime, scale, and readout frame consumers now route through a shared pane-layout owner surface instead of each module calling `buildPaneFrames` directly
- remaining:
  - keep this note honest about what is already done and stop using it as a parking lot for every past shrink subtask
  - drive new refactors from actual capability pressure, correctness pressure, or engine/workstation boundary pressure
  - treat `docs/post-harness-next-lines.md` as the active roadmap for the next architecture wave

## Next Architecture Lines

The next meaningful work is no longer "extract one more helper from `chart-harness`".

It is:

1. establish a real chart runtime container boundary
2. push pane/layout state toward model-layer ownership
3. strengthen the host/workbench contract surface
4. develop the separate `performance-chart` family without polluting the market-chart runtime

These are tracked in:

- [docs/post-harness-next-lines.md](/Users/dev/workspace2/hc_apps/chartx2/docs/post-harness-next-lines.md)

The rule from here:

- do not reopen already-finished harness shrink work unless a concrete regression or real scalability problem appears
- prefer owner/model extraction only when the target boundary is reusable outside the current harness body
- prioritize product capability lines over cosmetic internal decomposition
- source owner ownership should include specialized study accessors and secondary-scale helpers, so `chart-harness` should drop dead source runtime wrappers once those flows are handled inside the source owner
- pane owner ownership should include pane handles, pane index lookup, resize apply, removal, and event dispatch call sites, so `chart-harness` should not retain private pane runtime wrappers after the owner surface is stable
- pane owner ownership should include public pane list/add/remove command composition, so `chart-harness` only forwards pane API entrypoints instead of reassembling add/remove command dependencies
- source owner ownership should also include primary/secondary data mutation forwarding, so `chart-harness` should not keep local set/update wrappers once public commands and series APIs can call the owner directly
- source mutation ownership should sit behind a shared mutation owner, so primary rebuild, secondary display resolution, canonical updates, histogram normalization, viewport reset, and render invalidation are not duplicated across source and secondary API wiring
- study source ownership should sit behind a source creation owner, so pane-aware study state construction, default compare options, secondary price-scale allocation, meta/options creation, and registration do not remain inline in `chart-harness`
- main-series switch ownership should sit behind a switch owner, so preserved-state cloning, old-main removal, range reset, attach, render, and chart-type event publication are not assembled inline in `chart-harness`
- chart-state snapshot input ownership should sit behind a state input owner, so options, time/price scale readout, trade-location snapshot, drawing list, magnet resolution, and drawing validation do not remain inline in the `stateCoordinator` harness dependency bundle
- chart-state restore command ownership should sit behind a restore command owner, so selection clearing, source/drawing removal, pane rebuilds, series/study add commands, scale application, trade restore, drawing restore, and final render commands are not assembled inline in `chart-harness`
- adapter-shell mutable runtime state should sit behind a focused state owner, so canvas refs, drawing ordinals, viewport spacing/offset, axis formatter callbacks, and primary-scale override flags stop being threaded as scattered `chart-harness` fields
- chart-state shell composition should sit behind a focused state-shell owner, so snapshot input wiring, restore command wiring, and coordinator assembly stop living as one more high-fanout composition block inside `chart-harness`
- restore command assembly should sit behind a focused restore-shell owner, so pane rebuild commands, series/study restore adders, trade restore wiring, scale restore wiring, and render finalize callbacks stop living as an inline adapter bundle inside `chart-harness`
- interaction and canvas lifecycle composition should sit behind a focused interaction-shell owner, so pointer/keyboard/wheel handler assembly, canvas attach/detach wiring, resize listener registration, and teardown cleanup stop living as another adapter-shell block inside `chart-harness`
- public api handoff should sit behind a focused public-shell owner, so stable owner-to-public-surface wiring stops living as another harness-local dependency bundle and `chart-harness` keeps collapsing toward a thin composition root
- chart entry and demo handoff should sit behind a focused entry-shell owner, so attached-chart creation and demo mount composition stop living at the bottom of `chart-harness` as one more adapter-shell glue block
- internal views exports should point entry creation at `chart-entry.ts` instead of `chart-harness.ts`, so the harness file stays focused on the composition root while compatibility type/template re-exports remain available only for direct legacy imports
- test and caller imports should point at `chart-api-types.ts` or `chart-entry.ts` directly instead of using `chart-harness.ts` as a compatibility barrel, so the harness module can stay focused on runtime composition only
- once compatibility imports are gone, `chart-harness.ts` should aggressively drop stale leaf helpers and public-type imports that no longer participate in composition, so the composition root stays legible instead of preserving historical extraction residue
- render input ownership should sit behind a render input owner, so layout, option, view-state, source, drawing, scale, formatter, and active-trade read access does not remain inline in the `renderCoordinator` harness dependency bundle
- render callback ownership should sit behind a render callback owner, so renderer runtime, grid/chrome drawing callbacks, readout/crosshair publication, background color, and spacing resolution are no longer assembled inline in the `renderCoordinator` harness dependency bundle
- demo mount ownership should live outside `chart-harness`, so fixture bar generation and demo pane/series setup do not remain in the runtime adapter shell
- chart factory ownership should live outside `chart-harness`, so canvas validation, harness construction, attach, and public API handoff do not remain inline in the runtime adapter shell
- interaction ownership should sit behind an interaction owner, so view-state mutation, drawing hit/drag routing, pane resize application, readout publication, and keyboard command routing are not assembled inline in the runtime adapter shell
- internal restore and state-owner wiring should call stable owners directly instead of routing through public harness methods, so the public API surface can be collapsed without changing runtime behavior
- public surface ownership should sit behind a public surface owner, so the harness exposes one API handoff surface instead of implementing every public command as a class method
- default option ownership should live outside `chart-harness`, with per-instance factory functions for mutable chart, drawing, series, study, and price-line defaults so adapter-shell cleanup does not accidentally introduce shared mutable state
- runtime type ownership should live outside `chart-harness`, so drawing descriptor, source state, series API, and restore helper aliases do not keep the adapter shell as the de facto type dumping ground
- drawing property schema ownership should live outside `chart-harness`, so public drawing editor schema data can be tested and evolved without expanding the adapter shell
- public API type ownership should live outside `chart-harness`, with `chart-harness` re-exporting compatibility while the actual `PhaseOne*` public types and template helpers live in a focused API-types module
- internal type imports should point at `chart-api-types` directly instead of using `chart-harness` as a type barrel, leaving the harness re-export only for compatibility paths and external callers
- owner import ownership should be cleaned up after wrapper deletion, so `chart-harness` does not keep stale leaf imports for source, study, or trade helpers that are now owned by composition modules
- secondary series factory ownership should flow through `sourceOwner` directly, so `chart-harness` should not keep local factory-deps or formatter passthrough wrappers around stable owner/use-case surfaces
- secondary series API ownership should flow through a dedicated owner, so secondary data mutation, markers, price lines, compare options, and moving-average options no longer sit as a high-fanout closure block inside `chart-harness`
- primary series factory ownership should flow through `primarySeriesOwner` directly, so `chart-harness` no longer owns the high-fanout add/attach/API callback dependency bundle for the main series
- public series command ownership should flow through `seriesCommandOwner`, so targeted series/study/volume add routing and remove-series cleanup stop living as another switch-heavy harness block
- chart-state study restore should reuse `seriesCommandOwner` direct-pane study add methods, so restore callbacks do not keep secondary API factory imports alive in `chart-harness`
- main-series state read/apply ownership should flow through a main-series state owner, so snapshot projection, style restore, data rebuild, context sync, and render finalize are no longer assembled inside public harness methods
- source accessor ownership should flow through `sourceOwner` directly, so `chart-harness` should not keep local get-main/get-source/get-study forwarding methods around stable owner accessors
- terminal event and context-sync closures should call their registry/use-case targets directly, so `chart-harness` does not keep one-line methods solely for crosshair, chart-type, study-sync, or bar-sequence forwarding
- pane target resolution and marker mutation should use their owner/use-case surfaces directly, so `chart-harness` does not keep local wrappers around `paneOwner.resolveSeriesTarget` or marker presentation updates

That is the path toward a reusable chart workstation module rather than a demo page that accidentally becomes the product.
