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
- render-state preparation should follow the same direction, so row-set materialization, point-count calculation, pane-frame resolution, and active-pane selection stop living as one large harness-local pre-render block
- pane scale setup should follow the same direction, so primary/secondary range merge rules and price-scale application stop living as harness-local pane render setup branches
- pane decoration preparation should follow the same direction, so pane price-line merge rules and pane-local snap-guide selection stop living as harness-local pane render wiring
- render tail orchestration should follow the same direction, so time-axis selection, readout publication, and crosshair-move event assembly stop living as a harness-local render tail branch
- render surface setup should follow the same direction, so canvas backing-store initialization and empty-plot frame rendering stop living as harness-local render entry branches
- drawing hit testing, drag application, and magnet/snap resolution should follow the same direction, so pane-local geometry checks, trend-line endpoint mutation, and time/price snap policy resolution stop living as harness-local interaction branches

That is the path toward a reusable chart workstation module rather than a demo page that accidentally becomes the product.
