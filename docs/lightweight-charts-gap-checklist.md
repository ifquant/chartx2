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

### Time and price scales

`chartx2` already has working scale math and visible range behavior.

Current references:

- [src/lib/chartx/internal/model/time-scale.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/time-scale.ts)
- [src/lib/chartx/internal/model/price-scale.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/price-scale.ts)
- [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)

Why this is still simplified:

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

- no whitespace bars
- no richer historical merge behavior
- no broader time model coverage
- `line series` is normalized into OHLC-shaped rows to keep phase-one paths shared

## Phase-Two Must Close

These are the highest-signal gaps if the goal is to move from a phase-one floor to a serious `lightweight-charts`-class engine.

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

- more than one pane
- pane-local price scales
- pane sizing
- pane add/remove lifecycle

Why this matters:

- this is the bridge from single-chart engine to volume + indicators and to anything visually closer to TradingView
- `chartx2` now has the first fixed `primary + volume` pane split, but not yet pane sizing APIs, pane lifecycle, or arbitrary pane composition
- `chartx2` now has a first pane lifecycle surface, explicit pane targeting for candlestick, line, bar, and histogram, and a controlled multi-series path for managed secondary panes, but generalized composition rules are still intentionally narrow

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

1. chart-level API breadth
2. chart and series options
3. scale APIs and formatter hooks
4. markers / richer annotation surfaces / subscriptions
5. pane architecture
6. richer annotation and overlay surfaces

## Current Bottom Line

`chartx2` is no longer just a template shell or a chart toy.

It now has a real chart-engine floor.

But compared with `lightweight-charts`, it is still much closer to:

- `core rendering and interaction skeleton is proven`

than to:

- `drop-in lightweight-charts-class replacement`

That is the right place to be after phase one.
