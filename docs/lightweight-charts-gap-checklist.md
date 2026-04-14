# chartx2 vs lightweight-charts Gap Checklist

This document records the current gap between `chartx2` and TradingView `lightweight-charts` after phase one.

It is also now paired with a demo-shell question:

`Can chartx2 show its current engine breadth clearly, or does the example program still hide too much of the chart surface?`

This is still not a product roadmap for the full TradingView-style workstation.

It answers a narrower question:

`How far is chartx2 from lightweight-charts itself, and what should be closed next?`

The categories below are intentionally practical and now split into three lenses:

- `Engine Gap`
  - what is still missing versus `lightweight-charts`
- `Demo / Showcase Gap`
  - what the example program still fails to expose clearly even when the engine support already exists
- `Deferred TradingView Workstation Gap`
  - what matters for the long-term terminal shape but sits beyond the current library-comparison line

## Mapping The Gap To The TradingView Object Model

The lightweight-charts comparison is still useful, but future work should be judged against the longer-term runtime model, not only against a feature list.

Target direction:

```text
WidgetShell / Layout
└─ Charts[]
   └─ ChartModel
      ├─ ChartContext
      ├─ TimeScale
      ├─ Panes[]
      │  ├─ PriceScales[]
      │  └─ Sources (via entityRegistry)
      ├─ ChartBarSequence
      ├─ LegendViewModel
      ├─ MergeEngine
      ├─ ToolbarRegistry / CommandBus
      └─ LayoutSnapshot / Templates / UserSettings
```

Current `chartx2` status against that model:

- `WidgetShell / Layout`
  - the Svelte workbench exists as a demo shell
  - real multi-chart layout ownership and persistence do not exist yet
- `ChartModel`
  - there is a real chart-level public API and shared runtime state
  - part of that state still lives in a harness-shaped implementation rather than a fully explicit model layer
  - main-chart routing now has a first explicit `chart type -> input capability -> builder -> renderer -> style schema` registry instead of relying only on scattered switch branches, which is closer to the TradingView-style `one main series, many chart modes` model
  - that registry now lives in the model layer rather than staying defined inside the harness, which is a better boundary for future reuse by datafeeds, studies, and persistence
  - the main-series builder execution path now also routes through a model-layer builder registry instead of staying as a harness-local switch
  - the main-series renderer execution path now routes through a renderers-layer registry instead of staying as a harness-local conditional chain, although style/runtime specialization is still narrower than the long-term target
- `TimeScale`
  - already chart-level and shared across panes, which matches the intended direction
  - but the canonical owner of the horizontal domain is still implicit; it should move under an explicit chart-level `ChartContext -> ChartBarSequence` model
- `ChartContext / ChartBarSequence`
  - the chart now owns an explicit `ChartBarSequence`
  - `Renko`, `Kagi`, and `Point & Figure` now use compressed price-based chart sequences instead of being projected back into raw time slots
  - secondary pane `series` can now carry-forward onto that compressed chart sequence so the shared time scale no longer reintroduces empty columns on these price-based mains
  - the broader model is still incomplete because other non-time builders and richer merge policies are still transitional
  - `Point & Figure` now also has a first dedicated `X / O` renderer instead of staying on the temporary brick visual path
  - `Point & Figure` now collapses consecutive boxes into direction columns at the chart-sequence level, so the horizontal domain is closer to real OX charts than the earlier box-by-box layout
  - `Point & Figure` now has its own box-size and reversal option surface instead of reusing Renko-style inference only, which is necessary to stop dense OX over-generation on real-looking price scales
- `Panes`
  - pane lifecycle, pane resize, pane event bus, and managed multi-series secondary panes now exist
  - collapse/maximize/move/reorder breadth is still missing
- `PriceScales`
  - pane-local scales exist and public scale control has started
  - the primary price scale now has a first `scaleSeriesOnly` path to exclude compare studies from autoscale
  - compare studies now also have a first per-series `affectMainScale` option, so exclusion no longer has to be chart-global
  - scales are still narrower than the target pane-level object model with richer identity, modes, and attachments
- `Sources via entityRegistry`
  - current code now has a first explicit source-registry path for main-series and study sources
  - pane attachment, pane snapshots, and active-series lifecycle now read through that registry instead of only through pane-local arrays
  - the deeper model is still incomplete because `StudySource` and `DrawingSource` are not yet split into richer subtypes and the registry is still harness-owned
- `StudySource`
  - extra pane series now act as the first explicit `StudySource` runtime subtype, currently with `studyKind: "series"`
  - the first `overlay` and `compare` runtime creation paths now exist as primary-pane study subtypes
  - chart state snapshots can now also persist and restore the current `overlay`, `compare`, and `moving-average` study set as a first study-aware template slice
  - chart state snapshots now also persist and restore ordinary managed secondary series, so chart-owned persistence no longer drops pane content that sits outside the main series and explicit studies
  - broader indicator studies are not yet modeled as first-class study entities
  - study inputs still need a clearer split between `chart-context` and future `requested-context` execution
- `MainSeries style schemas`
  - the main series now has an explicit style-schema identity per chart type and the first type-specific option dispatch path
  - `Renko` and `Point & Figure` now use a model-layer style-option registry instead of keeping those rules inline in the harness
  - style schemas now also have a first explicit registry that describes which option surface a schema uses and which fields are type-specific
  - main-series chart-type switches now project shared style fields across schemas instead of always resetting all style state to defaults on every mode change
  - the chart API now also exposes a first unified main-series state snapshot/apply path, so chart type, style options, and builder-specific options can move through one serializable chart-owned object instead of only through scattered imperative calls
  - the broader schema map is still much narrower than TradingView
 - `Renderer registry`
   - main-series renderer ids are no longer only metadata; the actual draw dispatch now routes through an explicit renderer registry in the renderers layer
   - renderer execution is still only partially generalized because style-specific transforms and richer non-time visuals remain thin compared with TradingView
- `MergeEngine`
  - this does not exist yet
  - it will be required once studies can request a different timeframe or standard-vs-nonstandard source context and then merge those results back onto the current chart sequence
- `DrawingSource`
- markers and price lines exist as early annotation paths
- chart-owned drawings now have a first independent registry and snapshot path through minimal `horizontal-line` and `trend-line` objects, but drawings are still far from a full entity system with grouping, hit-testing, and z-order control
- `LegendViewModel`
  - workbench readouts and pane-aware legend payloads already point in the right direction
  - pane event snapshots now also carry stable source role and price-scale attachment metadata
  - pane snapshots now also carry main-series style schema metadata, so downstream UI and future persistence code can see option-surface and type-specific style fields without reopening engine internals
  - these should stay projection/viewmodel layers rather than becoming data owners
- `ToolbarRegistry / CommandBus`
  - the demo shell has command surfaces
  - there is no generalized toolbar/command architecture yet
- `LayoutSnapshot / Templates / UserSettings`
  - this remains largely deferred and must stay separate from runtime chart entities when it appears
  - the new main-series state snapshot is only a first chart-owned persistence primitive, not a full layout/template system yet
  - the chart API now also has a first chart-owned state snapshot for layout colors, viewport numbers, pane composition, and main-series state, but that is still a narrow runtime persistence slice rather than a full template/workspace model
  - the chart API now also has a first explicit `chart template v1` wrapper with `kind/version/chart` fields and a normalize/apply path, and those version helpers now live in the model layer instead of only inside the harness boundary
  - the model layer now also has a first explicit template serialization helper and golden contract test, so template JSON shape changes have to cross an intentional review boundary
  - template normalization now also routes through an explicit migration pipeline, even though the only supported schema is still `v1`; this is the first real hook for future template evolution

The capability categories below are intentionally practical:

- `Done` means `chartx2` already covers the capability at the current phase-one floor.
- `Done But Simplified` means `chartx2` covers the shape, but still in a narrower or harder-coded way than `lightweight-charts`.
- `Phase-Two Must Close` means the gap is material if `chartx2` wants to be a serious `lightweight-charts`-class engine.
- `Deferred Beyond Lightweight-Charts` means the work matters for the long-term TradingView-style workstation, but is not required just to close the library gap.

## Done

- chart mounts into one HTML canvas through a real public boundary
  - current entrypoints: [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)
- one pane renders deterministic data end to end
  - current harness: [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)
- a fixed two-pane path now exists for primary series plus volume
  - shared time scale
  - pane-local price scales
  - deterministic browser harness coverage
- a first pane lifecycle surface now exists
  - `panes()`
  - `addPane()`
  - `removePane()`
  - `setHeight()` on secondary panes
  - `getOptions() / applyOptions() / isResizable()` on pane handles
  - `subscribeResize() / unsubscribeResize()` on pane handles
  - `subscribePaneEvents() / unsubscribePaneEvents()` on the chart API, with pane-state snapshots that also describe attached series metadata, identity, and labels
  - pointer-driven divider resize in the browser harness
  - controlled multi-series composition in managed secondary panes
  - pane-aware readout payloads and in-pane legend summaries for managed multi-series panes
- a first primary-pane study path now exists
  - `addOverlaySeries()`
  - `addCompareSeries()`
  - both currently map to minimal line-style `StudySource` variants
- secondary panes are no longer volume-only
  - `candlestick`
  - `line`
  - `bar`
  - `histogram`
  - `volume`
- four core series paths exist, plus one volume-flavored bridge path
  - candlestick
  - bar
  - line
  - area
  - baseline
  - histogram
  - volume (rendered through a dedicated histogram-style path for future pane work)
- basic data write flow exists
  - `setData()`
  - minimal `update()`
- basic interaction floor exists
  - crosshair
  - wheel zoom
  - drag pan
- baseline browser verification exists
  - public API snapshots
  - harness snapshots
  - high-DPI snapshot
  - local 2K/5K performance smoke
- model and scale unit tests exist
- a small upstream parity contract layer exists
- a first series-marker path now exists
  - `setMarkers()` on all current series APIs
  - canvas marker rendering for the common `aboveBar / belowBar / inBar` positions
  - basic `circle / square / arrowUp / arrowDown` marker shapes
- a first real scale-control path now exists
  - time scale visible logical range getter/setter
  - time axis formatter hook
  - price scale visible range getter/setter
  - price axis formatter hook

## Done But Simplified

### Public API shape

`chartx2` already has a real chart API surface, but it is much narrower than `lightweight-charts`.

Current state:

- `createChartxPhaseOneChart(canvas)`
- `applyOptions()`
- `addCandlestickSeries()`
- `addCandlestickSeries({ pane })`
- `addBarSeries()`
- `addLineSeries()`
- `addAreaSeries()`
- `addBaselineSeries()`
- `addHistogramSeries()`
- `addVolumeSeries()`
- `addLineSeries({ pane })`
- `addAreaSeries({ pane })`
- `addBaselineSeries({ pane })`
- `addBarSeries({ pane })`
- `addHistogramSeries({ pane })`
- `panes()`
- `addPane()`
- `removePane()`
- `removeSeries()`
- `resize()`
- `timeScale()`
- `priceScale()`
- `subscribeCrosshairMove()`
- `unsubscribeCrosshairMove()`
- `subscribeClick()`
- `unsubscribeClick()`
- series-level `createPriceLine() / removePriceLine()`
- `setData()`
- `update()`
- `destroy()`

Current references:

- [src/lib/chartx/public/index.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts)
- [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)

Why this is still simplified:

- `applyOptions()` now covers a meaningful but still narrow chart color surface
- series options exist, but only as a small styling subset
- click and crosshair move subscriptions exist, but other event and interaction surfaces are still missing
- public scale objects exist but still expose only a small subset of useful behavior
- pane lifecycle now exists, and the first study series can target secondary panes
- pane targeting is now more explicit, but the primary slot is still special and volume still stays secondary-only
- pane handles now expose a small options surface, a resize callback, a chart-level pane event bus with stable pane/series metadata snapshots, and pane-aware readout payloads, but pane-local APIs are still much narrower than lightweight-charts
- pane resize now obeys public pane options and can be observed, but it still lacks richer pane interaction APIs and full pane management breadth
- the chart now has a first `getMainSeriesState() / applyMainSeriesState()` path, but only for the main series; panes, studies, and full chart layout persistence are still outside that snapshot
- the chart now also has a first `getChartState() / applyChartState()` path for chart-owned options, pane composition, the main-series state, managed secondary series, and the current `overlay / compare / moving-average` studies
- ordinary managed secondary histogram/volume visuals now survive the internal `setData()` path instead of being dropped by an ordering bug in the secondary-series update flow
- the chart now also has a first `getChartTemplate() / applyChartTemplate()` path that wraps this chart-owned state in a versioned `chart-template` schema and still accepts raw state through a normalize layer for backward compatibility
- the template create/normalize helpers now live in the model layer, which is a better boundary for future persistence, migration, and non-harness consumers
- the template path now also has a first stable JSON contract test and explicit unsupported-version rejection, which is the start of real schema-discipline rather than ad hoc snapshot growth
- the template path now also exposes a first explicit migration function and latest-version constant, so later schema upgrades no longer need to overload the normalize helper with hidden branching
- chart snapshots/templates now also persist first chart-owned drawing objects (`horizontal-line` and `trend-line`), but broader drawing tools, richer template versioning, and workspace persistence still remain outside the current persistence boundary

### Time and price scales

`chartx2` already has working scale math and visible range behavior.

Current references:

- [src/lib/chartx/internal/model/time-scale.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/time-scale.ts)
- [src/lib/chartx/internal/model/price-scale.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/price-scale.ts)
- [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)

Why this is still simplified:

- the current chart-level time scale is correct, but it still derives its working domain from harness-local source state rather than an explicit `ChartBarSequence`
- axis tick generation is still local and minimal
- formatter hooks now exist, but the tick-generation strategy is still local and narrow
- public scale APIs now exist for visible range control and formatter injection, but only as a first subset
- no overlay scales, percentage mode, log mode, invert mode, or richer localization

### Rendering and styling

`chartx2` already renders real series on canvas, but the renderer side is still phase-one narrow.

Current references:

- [src/lib/chartx/internal/renderers](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/renderers)
- [src/lib/chartx/internal/views/chart-harness.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/views/chart-harness.ts)

Why this is still simplified:

- colors and widths are mostly internal constants
- no public style options per chart or series
- no theme/layout options surface
- no screenshot export or richer invalidation strategy

### Data model semantics

`chartx2` already supports ordered OHLC ingestion and minimal incremental update.

Current references:

- [src/lib/chartx/internal/model/series-data.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/series-data.ts)
- [tests/unit/upstream-parity-contracts.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/upstream-parity-contracts.test.ts)

Why this is still simplified:

- the engine still lacks an explicit chart-level `ChartContext` that owns `symbol / resolution / chartType / barSequence`
- `Renko` alignment currently works by projecting synthetic rows back onto a time-based logical domain; that is useful for transition, but not the final TradingView-like model
- studies still read mostly from direct series state instead of a first-class `chart-context` input model
- no whitespace bars
- no richer historical merge behavior
- no broader time model coverage
- `line series` is normalized into OHLC-shaped rows to keep phase-one paths shared

## Phase-Two Must Close

These are the highest-signal gaps if the goal is to move from a phase-one floor to a serious `lightweight-charts`-class engine.

### 0. Promote chart context into a first-class model

Must-close items:

- define a chart-level `ChartContext` that owns `symbol / resolution / chartType / barSequence`
- make `TimeScale` read from one canonical `ChartBarSequence`, not from whichever source rows the harness happens to assemble
- keep `Pane` time-scale-free; panes should continue to own only `PriceScale`
- let non-time builders such as `Renko` redefine the chart bar sequence instead of permanently projecting back into raw time slots
- prepare `StudySource` for `inputContext = chart-context | requested-context`
- add a future `mergePolicy = carry-forward | gaps | exact` path for studies that request another context and map it back onto the current chart sequence

Why this matters:

- this is the architectural line between “synthetic charts are a rendering trick” and “synthetic charts are real chart contexts”
- TradingView-like behavior depends on the chart owning one shared horizontal domain while studies decide whether they consume the current chart context or a separately requested one
- without this, `Renko` and future non-time chart types will keep accumulating special-case alignment logic instead of moving toward a stable runtime model

### 1. Expand chart API breadth

Add a real chart-level API layer roughly in this order:

- `applyOptions`
- `resize`
- `removeSeries`
- `timeScale()`
- `priceScale()`
- `subscribeCrosshairMove`
- `subscribeClick`

Why it matters:

- without this, `chartx2` is still closer to a controlled harness than a reusable chart library

### 2. Expand series coverage

Next series types to add:

- no remaining core lightweight-charts series hole at the current floor

Why this matters:

- these are part of the normal `lightweight-charts` expectation surface
- histogram is already in place and acts as the direct bridge toward future volume rendering
- a first dedicated volume expression now exists, but it is still single-pane and not yet a real pane-local volume overlay
- the next meaningful breadth gaps now move past core series shapes into markers, price lines, richer scale/options surfaces, and broader pane/chart behavior

### 3. Add public options surfaces

Must-close option groups:

- chart layout/background/grid options
- series-level color and line/bar style options
- price scale visibility and formatting options
- time scale visibility and formatting options

Why this matters:

- even when raw rendering exists, the gap still feels large until users can configure the chart in lightweight-charts-like ways

### 4. Add scale APIs and richer axis behavior

Must-close items:

- richer tick generation
- overlay or pane-aware scale handles beyond the current first subset
- richer localization and scale modes
- richer compare/overlay scale semantics beyond the first `scaleSeriesOnly` exclusion path

Why this matters:

- scale behavior is one of the places where a chart engine stops feeling like a demo and starts feeling like infrastructure

### 5. Add series annotations and overlays

Must-close items:

- last value visibility control
- crosshair/price/time readout subscriptions through public API

Why this matters:

- the first public price-line path and the first public marker path now exist, which moves the next explicit annotation gap to richer marker options and visibility controls
- many real integrations need annotation/marker layers before they need multi-pane workstation UI

### 6. Add pane architecture

This is the last item in this section because it is structurally larger, but it is still a must-close gap versus modern `lightweight-charts`.

Must-close items:

- promote current pane support into a fuller pane object model
- widen pane controls beyond resize/add/remove
- keep pane-local price scales explicit as pane-owned objects
- stop treating secondary-pane series composition as the final source architecture

Why this matters:

- this is the bridge from single-chart engine to volume + indicators and to anything visually closer to TradingView
- `chartx2` already has pane sizing APIs, pane lifecycle, pane event snapshots, and controlled multi-series secondary panes
- the remaining architectural gap is no longer "do panes exist", but "are panes, scales, and sources modeled explicitly enough to scale into studies, drawings, and richer workstation behavior"

### 7. Promote sources into an explicit runtime object model

Must-close items:

- widen the first source registry into a fuller `SourceModel` / entity-registry path
- keep `MainSeriesSource` and `StudySource` explicit and add future `DrawingSource`
- treat `Overlay` / `Compare` as study-like entities instead of ad-hoc extra series

Why this matters:

- this is the main architectural bridge from lightweight-charts parity into the larger TradingView-style system
- `chartx2` now has the first registry-driven source ownership, which reduces pane-local special cases and gives pane snapshots stable source metadata from one place
- the remaining gap is turning that first registry into the true owner of study, overlay, compare, and drawing entities rather than leaving those concerns partly embedded in the harness

## Deferred Beyond Lightweight-Charts

These matter for `chartx2` long term, but they are not required just to close the `lightweight-charts` gap.

- full TradingView-style top toolbar
- left drawing-tools rail
- right watchlist / symbol detail panels
- full workstation routing and layout persistence
- multi-chart page management
- alert / replay / indicator-management workflows

## Demo / Showcase Gap

Even after phase one, `chartx2` can still look thinner than it really is if the example program exposes only one evolving homepage.

The current demo-shell priorities are:

- keep `Workbench` as the default complete example
  - this should communicate the long-term direction in one coherent chart workstation
- keep the chart capability examples as first-class sibling tabs
  - `Series`
  - `Panes`
  - `Interactions`
  - `Scales`
  - `Data`
  - `Styling`
  - `Events`
  - `Annotations`
- avoid fake placeholders
  - if `markers`, `price lines`, or other still-missing public features are absent, the demo should say so directly
- keep all example tabs on the public API
  - the route shell and demo composition layer should not import chart internals directly

The main demo/showcase gaps still open after the shell reframe are:

- `Annotations` now shows the first public price-line path, but still needs markers and richer annotation breadth
- the workbench still shows only one coherent workstation slice, not a broader set of terminal workflows
- the sibling demo tabs still need to grow alongside future engine work so the showcase stays honest

## Deferred TradingView Workstation Gap

This section is intentionally broader than `lightweight-charts`.

It tracks the long-term direction that `chartx2` is supposed to grow toward once the library-class floor keeps rising:

- richer top toolbar flows for symbol, timeframe, compare, and replay
- left-side drawing and annotation tools
- watchlist, symbol detail, and market context panels that react to real chart state
- multi-pane indicator workflows closer to the TradingView page shape
- eventually, multi-chart layouts, alert surfaces, and richer workstation state management
- alerts
- replay
- multi-chart layout workspace
- indicator marketplace breadth
- desktop-specific workflows beyond the engine/demo shell

These belong to the broader product direction already recorded in:

- [docs/phase-one-checklist.md](/Users/dev/workspace2/hc_apps/chartx2/docs/phase-one-checklist.md)

## Recommended Next Audit-to-Execution Order

If the next goal is still `close the gap to lightweight-charts`, the best order is:

1. chart-context / bar-sequence promotion
2. chart-level API breadth
3. chart and series options
4. scale APIs and formatter hooks
5. markers / richer annotation surfaces / subscriptions
6. pane architecture
7. richer annotation and overlay surfaces

## Current Bottom Line

`chartx2` is no longer just a template shell or a chart toy.

It now has a real chart-engine floor.

But compared with `lightweight-charts`, it is still much closer to:

- `core rendering and interaction skeleton is proven`

than to:

- `drop-in lightweight-charts-class replacement`

That is the right place to be after phase one.
