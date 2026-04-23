# Post-Harness Next Lines

Date: 2026-04-22

This document replaces the old habit of keeping a giant "remaining shrink work" list inside the architecture note.

`chart-harness.ts` is already sufficiently collapsed to act as a phase-one composition root. The next work should not be "extract another tiny helper". The next work should answer what new boundary the repo actually needs in order to scale toward a TradingView-like workstation without re-centralizing policy.

The broader three-layer TradingView alignment plan is tracked in
[tradingview-alignment-plan.md](/Users/dev/workspace2/hc_apps/chartx2/docs/tradingview-alignment-plan.md). This note remains the narrower post-harness execution guide.

## What Is Done

These are treated as finished baseline, not active roadmap items:

- source, pane, drawing, render, scale, runtime-query, public-shell, entry-shell, restore-shell, interaction-shell, and adapter-state composition no longer live as one monolithic harness body
- chart entry exports and public API types no longer route through `chart-harness.ts` as a compatibility barrel
- phase-one market-chart API, workbench demo flows, snapshot/template flows, and visual safety coverage are already established

If a future task mentions these as if they are still open, that task should be challenged before implementation starts.

## What Is Actually Next

### 1. Chart Runtime Container

The current `PhaseOneChartHarness` is thinner, but it still instantiates and owns a broad runtime graph:

- `ChartModel`
- `TimeScale`
- renderer instances
- `DrawingRegistry`
- option state
- several owner/coordinator objects

The next structural line should define a runtime-container boundary that owns this graph as one internal unit. The goal is not another naming pass. The goal is to make the chart runtime easier to host, reset, extend, and eventually embed in richer workstation shells.

Target outcome:

- `chart-harness` becomes a composition root over a runtime container instead of being the runtime container itself
- container-owned dependencies are grouped by runtime responsibility instead of by historical extraction order
- future market-chart and performance-chart families can share shell patterns without sharing one accidental runtime object graph

Current slice status:

- first slice landed: core runtime graph creation now routes through a dedicated runtime container module
- second slice landed: common runtime access and mutation paths now route through the same container surface instead of scattering raw `ChartModel` calls through the harness
- third slice landed: pane collection access, primary/time scale access, and drawing-registry access now also flow through the runtime container instead of through harness-local getter glue
- fourth slice landed: renderer runtime access and secondary visible-range reads now also flow through explicit runtime-container accessors
- not done yet: the broader runtime container still needs to absorb more ownership than object construction plus access glue

### 2. Pane And Layout Model Ownership

Pane state is no longer scattered as badly as before, but pane list semantics, preferred height semantics, divider/frame layout, and related read models still deserve a cleaner model-layer home.

This line should focus on:

- pane collection semantics
- pane height normalization and resize rules
- frame/divider geometry inputs used by render and interaction
- pane read models that should not require the harness to reassemble runtime state

This should be driven by one question: can pane behavior scale to richer workstation layouts without putting more policy back into the shell?

Current slice status:

- first slice landed: pane frame, active-pane, and divider geometry now route through a shared pane-layout owner instead of being rebuilt separately by render and interaction modules
- second slice landed: pane height reads, pane option mutation, and divider-driven resize composition now route through a shared pane-layout runtime owner instead of staying embedded in `chart-pane-owner`
- third slice landed: pane preferred-height normalization and divider clamp policy now route through a shared pane-layout policy owner, and pane-state restore now reuses that same policy instead of normalizing heights on its own
- fourth slice landed: secondary-secondary dividers now remain interactive when either adjacent pane is resizable, and resize clamp policy now distinguishes primary-secondary from secondary-secondary spans
- fifth slice landed: pane resize state now records the validated `controlledPaneId` at pointer-down time, so move-time resize execution no longer has to rediscover which side owns the drag
- sixth slice landed: pane frame allocation now routes through a dedicated pane-frame policy, and secondary rounding remainder no longer defaults to the last pane
- seventh slice landed: pane runtime, scale, and readout frame consumers now go through the shared pane-layout owner instead of each path re-reading frame layout directly
- eighth slice landed: primary-pane dividers now stay interactive when their immediate lower pane is fixed but a downstream secondary pane is resizable, and resize state now carries that downstream pane's starting height so linked drags can execute against the validated target
- ninth slice landed: downstream primary-divider clamp math now uses the controlled pane span instead of the fixed intermediary span, so linked resize can grow the downstream pane to the real primary-min-height limit
- tenth slice landed: fixed secondary-secondary dividers can now also delegate to the first downstream resizable pane, and generalized downstream clamp math now uses `primary + controlled` as the real variable span
- eleventh slice landed: linked-resize target resolution now routes through one shared pane resize policy in the model layer instead of being duplicated between divider hit-testing and runtime pane policy code
- twelfth slice landed: pointer-down resize state now stores a shared pane resize block snapshot (`startVariableSpan` + `minOpposingHeight`) so move-time resize policy no longer reconstructs block semantics from primary/upper/lower start-height fields
- thirteenth slice landed: pane resize blocks now have an explicit `controlledPaneId + opposingPaneId + mode` model contract, and resize block snapshots now derive from that block instead of re-deriving adjacent vs downstream semantics inline
- fourteenth slice landed: pane resize blocks now also carry explicit `blockPaneIds`, so downstream linked-resize state exposes the full participating pane span instead of only the controlled/opposing endpoints
- fifteenth slice landed: move-time pane resize now validates the frozen pointer-down block membership against the current model-layer block before applying height changes, so `blockPaneIds` is a real runtime input instead of dead state metadata
- sixteenth slice landed: pane resize policy now has an explicit grouping layer with `participatingPaneIds + variablePaneIds + fixedPaneIds`, so downstream linked-resize can model fixed middle panes separately from the actual variable span
- seventeenth slice landed: pane resize target, block snapshot, and validated grouping resolution now route through one shared pane-resize-block owner, so pointer-down interaction and move-time pane policy consume the same boundary
- eighteenth slice landed: pane resize interaction state now stores one explicit block snapshot object instead of scattering `controlledPaneId + blockPaneIds + start*` fields across every consumer
- nineteenth slice landed: pane resize interaction state now carries an explicit resize handle object, so divider identity and block snapshot move through runtime as one named payload
- twentieth slice landed: move-time pane layout policy now consumes `resizeHandle + deltaY` instead of the full interaction state, so pane resize policy no longer depends on drag-lifecycle fields like `startClientY`
- twenty-first slice landed: controlled resize height resolution now routes through the shared pane-resize-block owner, so pane layout policy stops duplicating block validation, grouping, and resize math
- twenty-second slice landed: pane-resize-block owner now exposes an explicit active resize block object, so validated group, controlled-pane choice, and control direction move through one owned runtime artifact
- twenty-third slice landed: pointer-down pane resize state now stores that active resize block directly, so move-time runtime paths no longer have to recover the active block from a handle-shaped payload they already validated
- twenty-fourth slice landed: move-time pane layout policy now consumes the active resize block directly, so controlled resize math no longer re-enters the move path through a handle-shaped contract after pointer-down already resolved the active block
- twenty-fifth slice landed: active resize blocks now expose divider identity and block snapshot directly, so runtime consumers no longer depend on `activeBlock.handle.block` nesting once the active block has already been resolved
- not done yet: richer resize rules and multi-layout ownership still remain broader follow-up lines

### 3. Host And Workbench Contract

The repo now has a phase-one public chart API and an early workstation contract, but the next growth bottleneck is the host boundary, not one more private helper extraction.

This line should make it easier for a future host to:

- open symbols and chart families intentionally
- provide watchlists, alerts, performance datasets, and persistence through explicit adapters
- treat the workbench as a chart-centered module instead of a page-level demo that knows too much

The target is a stable contract slice that a future trading product can embed without reaching into chart runtime internals.

### 4. Performance Chart Family

`performance` should continue as a separate chart family, not as a branch inside the technical-analysis market chart runtime.

That means:

- reuse rendering and shell primitives where they are truly generic
- keep market-chart `TimeScale`, `PriceScale`, source registry, study runtime, and drawing runtime separate
- let the workstation host both chart families without pretending they share the same domain model

The architecture note in [performance-chart-architecture.md](/Users/dev/workspace2/hc_apps/chartx2/docs/performance-chart-architecture.md) remains the reference for this line.

## Decision Rule

When choosing the next refactor or feature slice, prefer work that satisfies at least one of these:

- removes a real correctness risk
- unlocks a real workstation capability
- defines a reusable engine/workstation boundary
- prevents market-chart and performance-chart responsibilities from collapsing together

Avoid work that is only:

- another tiny harness extraction with no new reusable boundary
- a rename-only decomposition of already-stable owners
- a large internal shuffle that does not improve correctness, extensibility, or host integration
