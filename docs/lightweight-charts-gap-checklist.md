# chartx2 vs lightweight-charts Gap Checklist

This document records the current gap between `chartx2` and TradingView `lightweight-charts` after phase one.

It is not a product roadmap for the full TradingView-style workstation.

It answers a narrower question:

`How far is chartx2 from lightweight-charts itself, and what should be closed next?`

The categories below are intentionally practical:

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
  - `subscribePaneEvents() / unsubscribePaneEvents()` on the chart API, with pane-state snapshots that also describe attached series metadata
  - pointer-driven divider resize in the browser harness
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
- `addHistogramSeries()`
- `addVolumeSeries()`
- `addLineSeries({ pane })`
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
- pane handles now expose a small options surface, a resize callback, and a chart-level pane event bus with pane/series metadata snapshots, but pane-local APIs are still much narrower than lightweight-charts
- pane resize now obeys public pane options and can be observed, but it still lacks richer pane interaction APIs and full pane management breadth

### Time and price scales

`chartx2` already has working scale math and visible range behavior.

Current references:

- [src/lib/chartx/internal/model/time-scale.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/time-scale.ts)
- [src/lib/chartx/internal/model/price-scale.ts](/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/internal/model/price-scale.ts)
- [tests/unit/model-core.test.ts](/Users/dev/workspace2/hc_apps/chartx2/tests/unit/model-core.test.ts)

Why this is still simplified:

- axis tick generation is still local and minimal
- formatting is hard-coded
- no public scale APIs
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

- area
- baseline

Why this matters:

- these are part of the normal `lightweight-charts` expectation surface
- histogram is already in place and acts as the direct bridge toward future volume rendering
- a first dedicated volume expression now exists, but it is still single-pane and not yet a real pane-local volume overlay

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

- public scale handles
- richer tick generation
- formatter hooks
- visible range getters/setters

Why this matters:

- scale behavior is one of the places where a chart engine stops feeling like a demo and starts feeling like infrastructure

### 5. Add series annotations and overlays

Must-close items:

- price lines
- markers
- last value visibility control
- crosshair/price/time readout subscriptions through public API

Why this matters:

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
- `chartx2` now has a first pane lifecycle surface and explicit pane targeting for candlestick, line, bar, and histogram, but generalized multi-series composition is still constrained

## Deferred Beyond Lightweight-Charts

These matter for `chartx2` long term, but they are not required just to close the `lightweight-charts` gap.

- full TradingView-style top toolbar
- left drawing-tools rail
- right watchlist / symbol detail panels
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
4. markers / price lines / subscriptions
5. pane architecture
6. area / baseline series

## Current Bottom Line

`chartx2` is no longer just a template shell or a chart toy.

It now has a real chart-engine floor.

But compared with `lightweight-charts`, it is still much closer to:

- `core rendering and interaction skeleton is proven`

than to:

- `drop-in lightweight-charts-class replacement`

That is the right place to be after phase one.
