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

Near-term work should continue to prioritize chart-core ownership cleanup:

- `chart-harness` should keep shrinking toward an adapter
- chart runtime ownership should keep moving into explicit model-layer objects
- workstation shell should consume chart runtime through contracts, not own it

Current direction on that path:

- a new internal `ChartModel` owner should aggregate pane collection, source registry, chart context, and pane price-scale state so `chart-harness` can degrade toward an adapter instead of staying the runtime container
- pane list, pane height normalization, and pane frame/divider layout logic should live in dedicated model-layer code instead of remaining embedded in `chart-harness`
- source-state construction should keep moving out of `chart-harness`, starting with model-layer helpers for main-series descriptors, default study context, and empty runtime state allocation
- `ChartModel` should now own source registration, source removal, and main-source context binding, while broader restore/mutation orchestration can move later in smaller slices
- source enumeration and bulk-remove cleanup paths should continue moving into `ChartModel`, while snapshot restore and template rebuild logic can remain in `chart-harness` until a later slice
- role-aware source lookup should be modeled as typed owner APIs so `chart-harness` can stop re-checking source roles and stop relying on local casts
- chart state restore should evolve as an explicit internal use-case module, so snapshot application order and pane reconciliation are no longer trapped inside one `chart-harness` method
- series/study content rebuild should follow the same path, moving snapshot-kind dispatch into dedicated internal restore modules rather than leaving switch-heavy restore code embedded in `chart-harness`
- drawing restore should follow the same path, so `chart-harness` no longer owns a third snapshot-type dispatch loop for state rebuild
- chart state serialization should now follow the same direction, with series/study/drawing snapshot builders extracted from `chart-harness` into a dedicated internal module
- chart state read/apply orchestration should also become an explicit internal use-case, so `chart-harness` no longer inlines full snapshot build/apply flows
- main-series state snapshot/apply should follow the same direction, so chart-type switching and style-state sanitation stop living as a long harness-local procedure
- chart template create/normalize/apply should also be treated as a dedicated internal use-case instead of staying as thin harness-local wrappers
- main-series source construction and attach orchestration should follow the same direction, so preserved-source restore and main-source registration stop living as one harness-local branch
- primary-series API factories should follow the same direction, so chart-harness stops owning the method glue between series APIs and main-series mutation/render callbacks
- primary and secondary series mutation paths should follow the same direction, so canonical data replacement/update, histogram visual sync, and viewport-reset orchestration stop living as harness-local procedures
- compare and moving-average study option flows should follow the same direction, so default merge, input-context updates, display rebuild, and readback stop living as harness-local branches
- secondary and study-family API factories should follow the same direction, so chart-harness stops owning the method glue between secondary series APIs, study hooks, and attach wiring
- study-source state construction and attach wiring should follow the same direction, so primary-vs-secondary price-scale selection and study source registration stop living as harness-local procedures
- study display/context resolution should follow the same direction, so merge-to-chart-context rules and moving-average rebuild inputs stop living as harness-local branches
- study restore wiring should follow the same direction, so pane-index resolution and overlay/compare/moving-average restore dispatch stop living as harness-local procedures
- series restore wiring should follow the same direction, so pane-index resolution and per-series-kind restore dispatch stop living as harness-local procedures
- readout composition should follow the same direction, so active-pane selection and primary-vs-secondary readout assembly stop living as a harness-local orchestration branch
- readout series entry composition should follow the same direction, so per-series value lookup, formatting, and color resolution stop living as harness-local helpers
- pane legend selection should follow the same direction, so primary-vs-secondary legend entry routing and pane-local crosshair selection stop living as harness-local render branches
- pane content render orchestration should follow the same direction, so primary-vs-secondary pane content ordering stops living as one large harness-local render branch
- axis render orchestration should follow the same direction, so primary/secondary price-axis routing and time-axis row-source selection stop living as harness-local render branches
- pane chrome orchestration should follow the same direction, so legend dispatch, pane-local crosshair routing, and frame-border drawing stop living as harness-local render branches
- pane chrome drawing primitives should live with pane chrome rendering, so crosshair and legend paint details are tested outside `chart-harness`
- render-state preparation should follow the same direction, so row-set materialization, point-count calculation, pane-frame resolution, and active-pane selection stop living as one large harness-local pre-render block
- point-count read-model calculation should follow the same direction, so interaction scaling consumers can depend on a small source/context use-case instead of harness-owned traversal policy
- pane scale setup should follow the same direction, so primary/secondary range merge rules and price-scale application stop living as harness-local pane render setup branches
- pane decoration preparation should follow the same direction, so pane price-line merge rules and pane-local snap-guide selection stop living as harness-local pane render wiring
- render tail orchestration should follow the same direction, so time-axis selection, readout publication, and crosshair-move event assembly stop living as a harness-local render tail branch
- readout CustomEvent publication should live with render-tail helpers, so `chart-harness` does not own browser event construction
- render surface setup should follow the same direction, so canvas backing-store initialization and empty-plot frame rendering stop living as harness-local render entry branches
- drawing hit testing, drag application, drawing option mutation, magnet override mutation, and magnet/snap resolution should follow the same direction, so pane-local geometry checks, drawing target patching, per-drawing magnet patching, and time/price snap policy resolution stop living as harness-local interaction branches
- drawing creation state assembly should follow the same direction, so drawing ids/titles, initial target validation, and trend-line default derivation stop living as harness-local create branches
- drawing selection/remove session handling should follow the same direction, so active drawing lookup, selected-drawing state assembly, selection change dispatch, and removal cleanup stop living as harness-local session branches
- drawing API wrapper construction should follow the same direction, so apply/select/remove/pane-index behavior for horizontal-line and trend-line drawings stops living as harness-local API glue
- drawing register/create orchestration should follow the same direction, so drawing state creation, API wrapper construction, registry registration, and initial render dispatch stop living as one harness-local create branch
- selected-drawing command entrypoints should follow the same direction, so snapshot lookup, property-schema resolution, selected apply-options, and clear-selection commands stop living as harness-local public branches
- drawing interaction ownership should live behind a shared owner, so hit-test dependency wiring, selected trend-line drag resolution, and active drag snap-guide application stop living as harness-local private methods
- public add-series, add-study, add-volume, and add-drawing command routing should follow the same direction, so target normalization and family dispatch stop living as repeated harness-local public branches
- primary add-series routing should not keep one-shot harness wrappers when the public add command can call the shared primary factory directly
- secondary add-series wiring should share one harness integration point for factory deps instead of repeating the owner dependency handoff in every series kind wrapper
- secondary add-series ownership should live on source owner, so secondary/study attach orchestration no longer needs a harness-local add helper
- secondary plain-series routing should not keep one-shot harness wrappers when public add commands can call the shared secondary integration point directly
- secondary study routing should not keep one-shot harness wrappers when public and restore add commands can call the shared secondary integration point directly
- series build ownership should live behind a shared owner, so series ordinal allocation, labels, default options, main options, and main-source state creation stop living as harness-local private builders
- study context ownership should live behind a shared owner, so main-source context sync, study display-data resolution, study reflow, and trade-location refresh triggers stop living as harness-local private methods
- public remove-series, add-pane/remove-pane, and pane-handle wrapper construction should follow the same direction, so chart structure commands and pane API glue stop living as repeated harness-local public branches
- time-scale and price-scale API wrapper construction should follow the same direction, so visible-range logic, formatter wiring, and scale option apply paths stop living as harness-local public branches
- chart-wide applyOptions and resize command routing should follow the same direction, so layout/crosshair/drawing option patching and manual layout updates stop living as harness-local public branches
- bottom-level chart public API wrapper construction should follow the same direction, so createPhaseOneChart degrades toward attach-plus-factory instead of owning the full harness-to-public glue surface
- built-in demo data generation should live outside `chart-harness`, so the harness only mounts the sample chart instead of owning fixture construction
- DOM boundary guards should live outside `chart-harness`, so canvas validation is tested as shell input validation rather than harness policy
- runtime subscription and trade-location command routing should follow the same direction, so handler-set mutation and trade location public commands stop living as harness-local public branches
- runtime query ownership should live behind a shared owner, so point-count calculation and active-series guards stop living as harness-local private methods
- pane/chart/crosshair/click event publish paths should follow the same direction, so event assembly and fanout stop living as harness-local emitter branches
- pointer-leave, pointer-up, wheel, and keyboard viewport commands should follow the same direction, so settled input-state transitions stop living as harness-local interaction branches
- pointer-down and pointer-move orchestration should now follow the same direction, so divider detection, drawing-drag start, drag-pan routing, hover resolution, and cursor selection stop living as one large harness-local interaction branch
- click routing and canvas attach/detach lifecycle should follow the same direction, so canvas event binding, resize-observer wiring, selection-on-click, and detach cleanup stop living as harness-local shell/runtime branches
- pane state and pane snapshot builders should follow the same direction, so pane event payloads and pane API read-model assembly stop living as harness-local bookkeeping branches
- selected-drawing public commands and generic subscription routing should follow the same direction, so selection queries, property-schema lookup, apply/clear commands, and top-level handler-set mutation stop living as harness-local public branches
- pane resize subscriptions, pane option mutation, pane height measurement, and pane handle resolution should follow the same direction, so pane runtime bookkeeping stops living as harness-local helper branches
- price-line state construction, API wrapper creation, and active/remove validation should follow the same direction, so price-line bookkeeping stops living as harness-local helper branches
- price-line cloning for preserved main-series state should live with price-line runtime helpers instead of remaining as harness-local map-copy policy
- series meta/label builders, default series option builders, and main-source state assembly should follow the same direction, so source bootstrap logic stops living as harness-local builder branches
- main-source lookup, bar-sequence rebuild, chart-context sync, and trade-location refresh should follow the same direction, so source-context runtime logic stops living as harness-local owner branches
- study/secondary source lookup, study accessor guards, secondary scale lookup, and primary-pane series assembly should follow the same direction, so source accessor logic stops living as harness-local lookup branches
- series formatter patching, marker mutation, and readout value formatting should follow the same direction, so source presentation glue stops living as harness-local helper branches
- marker normalization should stay with series presentation, so default marker style and ordering policy are tested outside `chart-harness`
- series data transforms should follow the same direction, so line/histogram normalization, canonical updates, main-builder application, and histogram visual derivation stop living as harness-local bottom helpers
- main-series factory wiring should keep removing harness-local passthrough wrappers when existing model use-cases can be called directly
- shared series-kind label formatting should live outside `chart-harness`, so series and drawing title builders use a tested presentation helper
- secondary study replace/update and histogram-like replace/update should follow the same direction, so study data mutation orchestration stops living as harness-local mutation branches
- main-series replace/update and histogram-like replace/update should follow the same direction, so primary data mutation orchestration stops living as harness-local mutation branches
- main-series chart-type replacement should follow the same direction, so remove-preserve-reattach orchestration stops living as a harness-local public branch
- main-series attach/add orchestration should follow the same direction, so primary api creation, source attachment, and add-primary command wiring stop living as harness-local factory branches
- secondary/study attach/add orchestration should follow the same direction, so secondary api deps, study-source attachment, and add-secondary/add-study command wiring stop living as harness-local factory branches
- pane removal guards, pane-state snapshot assembly, and pane resize/event fanout should follow the same direction, so pane management bookkeeping stops living as scattered harness-local branches
- price-line ordinal allocation, api registration, and active/remove bookkeeping should follow the same direction, so price-line handle state stops living as a harness-local helper branch
- readout detail formatting and series value formatting should follow the same direction, so readout presentation glue stops living as a harness-local formatting branch
- price/time/volume axis label formatting should follow the same direction, so shared axis and readout formatter helpers stop living at the bottom of chart-harness
- price-axis/time-axis tag assembly and magnet tag builders should follow the same direction, so axis-tag presentation stops living as a large harness-local render branch
- price-line, marker, and trade-overlay pane decoration rendering should follow the same direction, so pane decoration presentation stops living as another harness-local render block
- pane drawing rendering and drawing snap-guide rendering should follow the same direction, so pane drawing presentation stops living as another harness-local render block
- drawing time-coordinate interpolation and line-distance geometry should follow the same direction, so shared drawing geometry stops living as duplicated harness-local and hit-test-local helpers
- crosshair readout assembly should follow the same direction, so nearest-row OHLC payloads stop living as duplicated harness-local and readout-local helpers
- pane layout geometry should follow the same direction, so active-pane lookup, local crosshair transforms, layout measurement, and bar-spacing helpers stop living as duplicated harness-local and module-local helpers
- interaction handler construction should follow the same direction, so pointer, keyboard, wheel, click, and resize runtime wiring stops living as one large harness-local closure block
- canvas lifecycle assembly should follow the same direction, so observer wiring, window resize hooks, and interaction reset cleanup stop living as another harness-local lifecycle block
- handler registry bookkeeping should follow the same direction, so public subscriptions, pane resize subscriptions, and event fanout stop living as scattered harness-local Set and Map state
- view-state bookkeeping should follow the same direction, so selected/hovered drawing state, snap-guide state, crosshair state, manual layout overrides, drag state, pane-resize state, and resize-observer ownership stop living as scattered harness-local mutable fields
- drawing runtime composition should follow the same direction, so selected-drawing changes, drawing removal, trend-line drag-handle resolution, and drag-apply orchestration stop living as separate harness-local branches over lower-level drawing modules
- drawing pane-aware creation glue should follow the same direction, so active-api validation, registry lookups, kind guards, and pane-existence checks stop living as harness-local wrappers around drawing factories
- selected-drawing public state and command routing should follow the same direction, so snapshot lookup, property-schema resolution, selected apply-options, and clear-selection commands stop living inside the generic public-state branch or as harness-local drawing glue
- drawing registry access should follow the same direction, so drawing id lookup, pane-local listing, pane drawing counts, and bulk drawing clear stop living as scattered harness-local registry traversal branches
- drawing render and snapshot inputs should follow the same direction, so pane-local drawing lists and all-drawing snapshot inputs stop bypassing the shared drawing accessor layer from chart-harness
- drawing snapshot validation and restore pane-index error semantics should follow the same direction, so chart-state apply no longer depends on another harness-local drawing validation branch
- series, study, and drawing restore should share the same invalid-pane semantics, so missing-pane restore guards stop drifting across three adjacent restore modules
- chart-state restore runtime should continue moving toward shared modules, so secondary-pane restore, time-scale apply, and price-scale apply stop living as another harness-local dependency-assembly block
- chart-state content clearing should follow the same direction, so restore-time study/series/drawing cleanup stops living as another harness-local branch before restore runs
- chart-state content rebuild should follow the same direction, so restore-time add/apply glue for series studies and drawings stops living as three harness-local restore methods
- chart-state apply runtime should continue moving toward shared modules, so main-series restore apply, trade-location restore, and finalize-on-render stop living as another harness-local execution branch
- chart-state apply should also own its grouped restore dependency builder, so applyChartStateSnapshot stops carrying the full restore dependency object inline inside chart-harness
- trade-location command and refresh composition should follow the same direction, so locate/clear/get/refresh no longer live as another harness-local runtime cluster
- pane API handle construction and resize subscription wiring should follow the same direction, so createPaneHandle no longer owns another harness-local pane runtime composition block
- pane read-model bookkeeping should follow the same direction, so pane series-state assembly, pane-state assembly, and pane snapshot assembly stop living as another harness-local bookkeeping cluster
- source accessor/runtime composition should follow the same direction, so study lookup, source api guards, compare/moving-average specialization, secondary-scale access, and primary-pane series assembly stop living as another harness-local lookup cluster
- pane event and resize composition should follow the same direction, so handler-registry deps assembly for pane events stops living as another harness-local runtime branch
- drawing registry and selection composition should follow the same direction, so drawing lookup, pane-local listing, selected-drawing updates, and selected removal stop living as another harness-local glue cluster
- source/series ownership should now continue through a single source owner composition surface, so chart-type switching, primary/secondary mutation, typed source lookup, study attach wiring, and trade-location refresh triggers stop being spread across unrelated harness-local helpers
- pane ownership should now continue through a single pane owner composition surface, so pane handles, pane target resolution, pane option/height mutation, pane removal, and pane state/event publication stop being reassembled in multiple harness-local branches
- drawing lifecycle and public ownership should now continue through a single drawing owner composition surface, so drawing creation, registry lookup/listing, selected-drawing public state, and drawing restore stop being split across separate harness-local wrappers
- once source, pane, and drawing owners are stable, the next major extraction should be one render coordinator module, so frame render orchestration, readout assembly, axis dispatch, and render-tail publication stop being the last large fanout cluster inside `chart-harness`
- render/readout/axis/tail orchestration should now continue through a single render coordinator composition surface, so `chart-harness` stops owning the full frame pass and can keep collapsing toward a composition root plus adapter shell
- chart state snapshot/template/restore should now continue through a single state coordinator composition surface, so `chart-harness` stops owning the full state read/apply/template orchestration and can keep collapsing toward a thinner adapter shell
- canvas attach/detach lifecycle should now continue through a small lifecycle owner, so `chart-harness` no longer reassembles listener bags, resize-observer state, canvas refs, and teardown cleanup inline
- render invalidation should now continue through a shared attached-canvas invalidation owner, so command and owner callbacks stop duplicating nullable-canvas render guards throughout `chart-harness`
- stale harness-local passthrough wrappers should be removed once their owner/coordinator surfaces are stable, so `chart-harness` keeps moving toward direct composition instead of accumulating dead adapter methods
- render coordinator ownership should include import ownership too, so `chart-harness` should not keep stale render/readout/axis leaf imports once all remaining calls route through the coordinator
- drawing owner ownership should include public drawing commands and interaction lookups, so `chart-harness` should not retain private drawing registry/selection wrappers after the owner surface is stable
- source owner ownership should include specialized study accessors and secondary-scale helpers, so `chart-harness` should drop dead source runtime wrappers once those flows are handled inside the source owner
- pane owner ownership should include pane handles, pane index lookup, resize apply, removal, and event dispatch call sites, so `chart-harness` should not retain private pane runtime wrappers after the owner surface is stable
- source owner ownership should also include primary/secondary data mutation forwarding, so `chart-harness` should not keep local set/update wrappers once public commands and series APIs can call the owner directly
- owner import ownership should be cleaned up after wrapper deletion, so `chart-harness` does not keep stale leaf imports for source, study, or trade helpers that are now owned by composition modules
- secondary series factory ownership should flow through `sourceOwner` directly, so `chart-harness` should not keep local factory-deps or formatter passthrough wrappers around stable owner/use-case surfaces
- source accessor ownership should flow through `sourceOwner` directly, so `chart-harness` should not keep local get-main/get-source/get-study forwarding methods around stable owner accessors
- terminal event and context-sync closures should call their registry/use-case targets directly, so `chart-harness` does not keep one-line methods solely for crosshair, chart-type, study-sync, or bar-sequence forwarding
- pane target resolution and marker mutation should use their owner/use-case surfaces directly, so `chart-harness` does not keep local wrappers around `paneOwner.resolveSeriesTarget` or marker presentation updates

That is the path toward a reusable chart workstation module rather than a demo page that accidentally becomes the product.
