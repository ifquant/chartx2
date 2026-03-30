# chartx2 Phase-One Checklist

This document turns the approved design direction and eng review decisions into an execution checklist.

Phase one is not "build TradingView."

Phase one is:

- define what `lightweight-charts` parity means for `chartx2`
- create a clean internal engine boundary
- migrate the minimum engine layers in dependency order
- prove the result with tests and a real host integration path

If a task does not help those four things, it is probably not phase-one work.

## Scope

Phase one includes:

- repo hygiene needed to make migration work readable
- engine/shell boundary definition
- `lightweight-charts` parity checklist for the phase-one floor
- staged migration in this order:
  - `typings/helpers`
  - `model core/scales/data`
  - `renderers/views`
  - `minimal public chart API`
  - `host integration`
- baseline tests:
  - unit tests for model and scale logic
  - browser-based visual regression for rendering
  - a small set of upstream parity contract tests

Phase one does not include:

- plugin system
- indicator platform
- multi-chart layouts
- workstation toolbar breadth
- Tauri-level automated visual regression
- independent package publishing pipeline
- final TradingView-grade performance targets such as `40K historical bars`

## Hard Rules

- Do not leave chart internals in [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte) once real chart logic begins.
- Do not migrate `lightweight-charts` by copying large directory chunks without a validation step after each layer.
- Do not build the public API before the core model/render path exists.
- Do not treat `docs/develop.md` as proof that planned modules already exist.
- Do not skip tests for "temporary" migration steps. Temporary code has a way of becoming permanent.

## Module Boundary

The plan assumes an internal engine boundary inside this repo, not a separate publishable package yet.

Required dependency direction:

```text
host shell
  src/routes
  src-tauri
      |
      v
public chart API
  chart engine entrypoints
      |
      v
engine internals
  typings/helpers
  model
  renderers/views
```

Allowed:

- host shell imports the public chart API
- public chart API imports engine internals
- engine internals import lower-level engine internals

Not allowed:

- host shell importing model or renderer internals directly
- Tauri bridge talking to renderer internals directly
- renderers reaching upward into host UI code

Current phase-one boundary artifact:

- [x] public entrypoint created at `src/lib/chartx/public/index.ts`
- [x] first internal foundation module created at `src/lib/chartx/internal/foundation.ts`
- [x] host shell reads boundary summary data through the public entrypoint

## Repo Hygiene Checklist

- [x] Decide the engine root directory and write it down before adding files
  - engine root: `src/lib/chartx`
- [x] Add ignore rules or explicit decisions for local-only folders such as `.vscode/` and `.trae/`
- [ ] Delete, archive, or explicitly document scratch files:
  - [x] `a`
  - [x] `b`
  - [x] `temp_page.html`
- [x] Repair or remove stale scaffolding:
  - [x] [chart-model.ts](/Users/dev/workspace2/hc_apps/chartx2/chart-model.ts)
- [ ] Keep `git status` clean enough that future migration work shows only meaningful diffs

## Parity Definition Checklist

Before migration starts, write a narrower checklist answering:

`What does chartx2 mean by lightweight-charts parity for phase one?`

Required sections:

- [x] chart primitives
- [x] time scale behavior
- [x] price scale behavior
- [x] data model and update semantics
- [x] supported series types in scope
- [x] pane model in scope
- [x] render pipeline assumptions
- [x] baseline public API surface
- [x] baseline interaction support
- [x] test expectations
- [x] performance floor
- [x] explicit deferrals

Phase-one parity for `chartx2` means the current implementation can satisfy the following narrow floor. Anything outside this list is not silently assumed.

### Chart primitives

Pass means:

- one chart instance can mount into one HTML canvas
- one pane is rendered inside that canvas
- one candlestick series can be attached and drawn
- deterministic sample OHLC data can be rendered repeatedly without host-side chart logic

Not pass:

- multi-pane rendering
- multi-series composition
- overlay studies
- non-canvas rendering targets

### Time scale behavior

Pass means:

- logical indexes map to x coordinates and back through the current `TimeScale`
- `rightOffset` changes the visible viewport position
- `barSpacing` changes the visible viewport density
- visible logical range and visible strict range math are stable enough to lock with fixed-input tests

Not pass:

- custom sessions or trading calendars
- business-day parsing
- custom tick mark generation
- timezone-aware formatting

### Price scale behavior

Pass means:

- prices map to pane y coordinates and back through the current `PriceScale`
- the visible price range is derived from the rendered series subset
- zero-length ranges collapse to a stable midpoint behavior instead of exploding

Not pass:

- logarithmic scale
- percentage scale
- inverted scale options
- auto precision or instrument-aware formatting

### Data model and update semantics

Pass means:

- ordered OHLC arrays can be ingested through the current series store
- empty datasets do not crash
- single-bar datasets do not crash
- unordered bars are rejected explicitly
- the current minimal public path supports replacing the full dataset through `setData`
- the current minimal public path supports replacing the latest bar or appending one new bar through `update`

Not pass:

- partial historical backfill merge behavior
- whitespace bars
- mixed time types in one series

### Supported series types in scope

Pass means:

- candlestick series
- line series

Not pass:

- bar series
- area/baseline series
- custom series types

### Pane model in scope

Pass means:

- one pane
- one rendered plotting area
- one host-level OHLC bar above the canvas

Not pass:

- secondary panes
- pane resizing
- pane separators
- synchronized pane cursors

### Render pipeline assumptions

Pass means:

- rendering is canvas 2D only
- the harness owns the draw order: background -> pane fill -> grid -> candles -> crosshair -> frame
- high-DPI output is handled through canvas backing-store scaling
- resize recomputes layout from the host container width

Not pass:

- WebGL acceleration
- layer invalidation optimization
- partial redraw regions
- theme packs or runtime skinning

### Baseline public API surface

Pass means:

- `mountChartxPhaseOneHarness(canvas)` mounts the demo path
- `createChartxPhaseOneChart(canvas)` creates one narrow chart instance
- `addCandlestickSeries()` and `addLineSeries()` are the in-scope series attachment paths
- `setData()` is the only in-scope data write path
- `update()` supports only replace-last-bar or append-one-bar semantics
- unsupported host or multi-series usage fails explicitly

Not pass:

- full `lightweight-charts` API breadth
- option setters for layout, scales, or styling
- public subscription APIs
- plugin extension hooks

### Baseline interaction support

Pass means:

- pointer-driven crosshair
- wheel-driven zoom through `barSpacing`
- drag-driven pan through `rightOffset`
- host-visible OHLC readout fed by engine state
- crosshair-following time and price axis labels

Not pass:

- kinetic scrolling
- touch gestures
- selection or drawing tools
- replay, magnet, or snapping modes

### Test expectations

Pass means:

- unit tests lock current scale math and data ingestion behavior
- parity contract tests lock a small fixed input/output set for scale math and data ingestion
- browser visual regression covers:
  - baseline render
  - narrow layout render
  - crosshair render
  - zoomed viewport render
  - panned viewport render
  - minimal public API happy path

Not pass:

- full upstream mirrored test suite
- Tauri-level automated visual tests
- interaction fuzzing

### Performance floor

Pass means:

- one chart, one pane, one candlestick series
- deterministic interaction baselines remain visually stable under browser test runs
- the founder reference workflow for current sample data does not show obvious frame hitch during hover, zoom, or drag pan

Not pass:

- `40K historical bars`
- multi-chart stress
- indicator-heavy stress
- production benchmark claims

### Explicit deferrals

Explicitly deferred from phase one:

- parity for bar, area, baseline, and custom series types
- parity for full `lightweight-charts` option surface
- public `update` and subscription APIs
- richer tick generation, axis options, and time/price formatting
- indicators, plugins, drawings, alerts, replay, layouts, and desktop-specific workflows
- final TradingView-grade performance targets

Required outcome:

- [x] every item is specific enough to verify as pass/fail
- [x] every deferred capability is named, not silently omitted

## Migration Order Checklist

### Step 1: Typings And Helpers

Goal:

- establish low-level types and helpers needed by later layers

Checklist:

- [x] identify the minimal upstream `typings/helpers` subset required by model and renderer work
- [x] migrate only the subset needed for the next layer
- [ ] keep names and semantics close enough to upstream that parity comparison remains possible
- [ ] avoid adding convenience helpers that only serve `chartx2` host UI at this stage

Current migrated subset:

- [x] `assertions`
- [x] `delegate`
- [x] `idestroyable`
- [x] `isubscription`
- [x] `mutable`
- [x] `nominal`
- [x] `strict-type-checks`

Exit criteria:

- [x] TypeScript compiles with the migrated helper layer in place
- [ ] no host-shell code imports these files directly unless they are intentionally public

### Step 2: Model Core, Scales, Data

Goal:

- make chart state, scale math, and data ingestion behave predictably

Checklist:

- [x] migrate the minimal model state required for a single chart and single pane
- [x] migrate visible-range logic
- [x] migrate time-scale transform logic
- [x] migrate price-scale transform logic
- [x] migrate baseline data ingestion and replacement/update flow
- [ ] document any intentional differences from upstream

Current migrated subset:

- [x] `range-impl`
- [x] `coordinate`
- [x] `time-data`
- [x] `time-scale-visible-range`
- [x] `time-scale`
- [x] `price-range-impl`
- [x] `price-scale`
- [x] `plot-data`
- [x] `plot-list`
- [x] `series-data`

Exit criteria:

- [x] unit tests cover visible range math
- [x] unit tests cover time-scale transforms
- [x] unit tests cover price-scale transforms
- [x] unit tests cover empty, single-bar, and normal dataset ingestion

### Step 3: Renderers And Views

Goal:

- get deterministic candle/bar output on screen in a browser harness

Checklist:

- [x] migrate the minimum renderer/view set required for one chart and one pane
- [x] render deterministic sample data
- [x] support resize without axis/body desync
- [x] support high-DPI baseline rendering
- [x] keep rendering testable outside the Tauri shell

Current migrated subset:

- [x] `grid-renderer`
- [x] `candlesticks-renderer`
- [x] `chart-harness`

Exit criteria:

- [x] browser harness renders a baseline chart reliably
- [x] visual regression snapshot exists for baseline candle/bar render
- [x] visual regression snapshot exists for at least one resize or DPR-sensitive case

### Step 4: Minimal Public Chart API

Goal:

- expose only the API needed to mount and drive the phase-one chart

Checklist:

- [x] define one narrow entry for chart creation
- [x] define one narrow path for adding the in-scope series type(s)
- [x] define one narrow path for setting or updating data
- [x] reject or defer unsupported API breadth explicitly

Exit criteria:

- [x] integration test covers `create chart -> add series -> set data -> first render`
- [x] invalid host usage has a defined failure mode

### Step 5: Host Integration

Goal:

- prove the engine can live inside the current app shell without collapsing the boundary

Checklist:

- [x] replace the template welcome flow in [src/routes/+page.svelte](/Users/dev/workspace2/hc_apps/chartx2/src/routes/+page.svelte) with a chart host path
- [x] keep chart setup behind the public API boundary
- [x] ensure the host can mount deterministic sample data
- [x] add a visible error state when engine initialization fails

Exit criteria:

- [x] app launch shows a single chart with deterministic sample data
- [x] pan works
- [x] zoom works
- [x] crosshair works at the baseline level
- [x] engine init failure produces a visible host error instead of a silent blank page

## Test Strategy Checklist

### Unit Tests

Required:

- [x] visible range math
- [x] time-scale transforms
- [x] price-scale transforms
- [x] data ingestion with empty dataset
- [x] data ingestion with single-bar dataset
- [x] baseline update/replace semantics

### Visual Regression

Required:

- [x] browser-based harness, not Tauri-first
- [x] fixed dataset
- [x] fixed viewport size
- [x] fixed device pixel ratio or equivalent deterministic setup
- [x] baseline candle/bar snapshot
- [x] one resize-sensitive snapshot
- [x] one crosshair or viewport update snapshot if deterministic enough

### Upstream Parity Contract Tests

Required:

- [ ] scale math parity for a small fixed input/output set
- [x] scale math parity for a small fixed input/output set
- [x] data ingestion parity for a small fixed dataset
- [x] baseline API happy path parity where phase-one API overlaps upstream behavior
- [ ] baseline render parity check through controlled snapshots

Not required:

- [ ] full 1:1 mirror of the upstream test suite

## Performance Checklist

### Phase-One Floor

- [ ] define a reference machine or repeatable local baseline
- [ ] single chart
- [ ] single pane
- [ ] candle/bar baseline render
- [ ] `2K-5K bars`
- [ ] pan/zoom/crosshair have no obvious frame hitch in the founder's baseline workflow

### Phase-Two Target

Record, but do not use as phase-one gate:

- [ ] `40K historical bars`
- [ ] multi-chart layouts
- [ ] heavier indicator load
- [ ] broader TradingView-like pressure scenarios

## Failure Modes Checklist

These failure modes must have both handling and tests where applicable.

- [ ] engine init fails -> host shows visible error state
- [x] empty dataset -> safe empty state
- [x] single-bar dataset -> no crash, no nonsense rendering
- [ ] resize -> axes and bars stay aligned
- [ ] high-DPI -> output remains stable
- [x] pan/zoom -> viewport updates without silent desync
- [x] crosshair -> inspected position stays aligned with rendered bars

## Verification Checklist

Minimum verification for each migration slice:

- [x] `pnpm check`
- [x] `pnpm build` when frontend output shape changes
- [x] browser harness verification for render-affecting work
- [ ] `cargo check` when Tauri-side code changes
- [x] commit tutorial updated for each non-trivial slice

## Suggested Implementation Order

```text
1. Repo hygiene
2. Parity definition document
3. Engine directory and dependency boundary
4. typings/helpers migration
5. model core/scales/data migration
6. unit tests for model/scales/data
7. renderers/views migration
8. browser visual regression harness
9. minimal public chart API
10. host integration on /
11. host error state
12. parity contract tests
13. phase-one performance check
```

## Done Means

Phase one is done when all of these are true:

- [ ] the engine has a real internal boundary and the host uses only the public chart API
- [ ] the phase-one parity checklist is complete and reviewed
- [ ] a single-chart, single-pane candle/bar flow works end-to-end
- [x] pan, zoom, and crosshair work at baseline level
- [ ] browser-based visual regression exists
- [ ] model and scale logic has unit tests
- [ ] selected upstream parity contract tests exist
- [ ] host initialization failure is visible and tested
- [ ] phase-one performance floor is checked on a reference machine

If any one of these is missing, phase one is not done yet.

## Phase-Two Direction

Phase two starts only after the phase-one floor is stable enough to stop arguing about whether `chartx2` is still just a demo harness.

Phase two is not a separate product direction. It is the same long-term plan continuing upward:

- first align `chartx2` with the `lightweight-charts` floor
- then use that floor to move toward a TradingView-style chart workspace like the reference image shared by the user

This means there is one long-term plan with two stages, not two unrelated plans.

### Phase-Two Goal

Turn the single-chart phase-one engine into the foundation of a TradingView-like workstation:

- main price chart plus supporting panes
- volume pane under the main chart
- indicator panes such as RSI / Stoch RSI / CCI
- richer chart header and timeframe/symbol controls
- left-side tool rail and chart interaction affordances
- right-side market context panels such as watchlist or instrument detail

### Phase-Two Entry Condition

Do not start phase two broadly until these are true:

- phase-one parity definition is written and accepted as the floor
- single-chart candlestick flow is stable under current unit and visual tests
- pan / zoom / crosshair / update semantics are no longer changing every commit
- the host/public-engine boundary is holding

### Phase-Two Priorities

Build in this order unless a later item becomes a hard blocker:

1. multi-pane layout model
2. volume pane
3. indicator pane container and lifecycle
4. richer time/price axis behavior and chart legend/header
5. top toolbar / bottom timeframe bar / left tool rail shell
6. right-side watchlist / instrument info shell

### Phase-Two Scope

In scope first:

- multiple panes inside one chart workspace
- pane sizing and vertical layout rules
- volume as the first built-in supporting pane
- at least one indicator pane path that proves the container model
- host-level UI shells that make the app structurally resemble the target TradingView layout

Explicitly later, not immediate phase-two entry:

- full drawing suite
- alerts
- replay
- multi-chart grids
- watchlist trading actions
- Pine-level scripting
- the whole feature list from the final target image

### Phase-Two Success Condition

Phase two is succeeding when `chartx2` no longer reads as "one canvas demo with extras", but as "a chart workspace with a real pane model and UI shell" that is visibly on the path toward the reference TradingView-style product.
