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

That is the path toward a reusable chart workstation module rather than a demo page that accidentally becomes the product.
