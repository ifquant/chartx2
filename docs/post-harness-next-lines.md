# Post-Harness Next Lines

Date: 2026-04-22

This document replaces the old habit of keeping a giant "remaining shrink work" list inside the architecture note.

`chart-harness.ts` is already sufficiently collapsed to act as a phase-one composition root. The next work should not be "extract another tiny helper". The next work should answer what new boundary the repo actually needs in order to scale toward a TradingView-like workstation without re-centralizing policy.

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
- not done yet: pane height normalization policy, richer resize rules, and multi-layout ownership still remain broader follow-up lines

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
