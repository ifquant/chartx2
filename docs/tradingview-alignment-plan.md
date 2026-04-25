# TradingView Alignment Plan

Date: 2026-04-23

This document is the long-range alignment plan for `chartx2`.

`chartx2` should not be treated as a one-page chart demo. The target is a
modifiable TradingView-like chart workstation for the chart product surface,
with `lightweight-charts` parity as the first floor and a reusable
workstation/platform UI surface as the ceiling.

The plan is intentionally split into three layers:

1. Foundation Parity
2. Workstation Parity
3. Platform Parity

Each layer has its own acceptance gates. Later layers should not force chart
runtime policy back into the demo page or into `chart-harness`.

## Current Position

Current repo state should be understood as:

- The project is already past the "can render a chart" stage.
- The market chart runtime has panes, source ownership, drawing ownership,
  render coordination, state snapshots/templates, and visual safety coverage.
- The harness shrink line has mostly moved policy into focused owners and
  coordinators.
- The workstation shell exists, but it is still closer to a demo/workbench than
  a complete TradingView-like product.
- Platform features such as script execution, strategy testing, broker
  integration, cloud sync, publishing, and account-level services have not
  started and should not be mixed into the chart engine.
- For the long-range split, `chartx2` should own chart-facing UI/components and
  typed host contracts, while `alpha2` is the intended place to consume those
  components and connect them to a future Rust core.

Approximate alignment status:

- Chart engine foundation: partial but meaningful.
- Workstation product surface: early.
- Platform ecosystem surface: not started.

## Alignment Principles

- Keep the engine first: `lightweight-charts`-class correctness is the floor,
  not the final goal.
- Keep `chartx2` chart-centered: trading accounts, broker state, and full
  order backends belong to host products or adapters.
- Keep runtime and persistence separate: `ChartModel` state is not the same as
  saved layout/template state.
- Keep market and performance chart families separate: they may share shell and
  rendering primitives, but not market chart runtime models.
- Prefer explicit contracts over page-local knowledge: watchlists, alerts,
  datafeeds, persistence, and host intents should enter through typed adapters.
- Do not start Pine-like scripting or broker integration before the engine and
  workstation contracts are stable enough to host them.
- Treat Layer 3 in `chartx2` as UI-first productization: panels, inspectors,
  editors, tickets, status surfaces, and persistence/share shells belong here;
  heavy execution, broker logic, backtesting engines, sync engines, and account
  services should be expected to move behind `alpha2` plus a Rust core.
- Prefer reusable chart-workstation components and typed view models over
  embedding product logic in demo-only state machines.

## Layer 1: Foundation Parity

Goal: reach and exceed `lightweight-charts`-class engine capability while
keeping the chart runtime modular enough to support a TradingView-like
workstation.

### 1. Runtime Container Closeout

Purpose:

- Make the chart runtime graph a real internal unit instead of a loose group of
  objects assembled by the harness.

Scope:

- Move remaining runtime graph ownership into a chart runtime container.
- Container should own or expose stable access to `ChartModel`, `TimeScale`,
  pane models, source registry, drawing registry, renderers, runtime options,
  and scale state.
- `chart-harness` should become a composition root plus lifecycle adapter, not
  the owner of runtime policy.

Acceptance:

- Harness construction no longer knows detailed creation order for most runtime
  internals.
- Runtime container has a narrow surface that can be reused by future chart
  hosts.
- Existing phase-one public API behavior remains compatible.

### 2. Core Chart Behavior Parity

Purpose:

- Stabilize the behaviors that users expect from a serious market chart before
  adding more workstation panels.

Scope:

- Data replace/update behavior.
- Visible range, logical range, bar spacing, right offset, and fit-content.
- Crosshair, readout, keyboard/mouse pan, zoom, wheel, and resize semantics.
- Primary and secondary price scale behavior.
- Autoscale, manual scale override, formatter routing, and empty-data guards.
- HiDPI and canvas resize handling.

Acceptance:

- Core viewport and scale operations are covered by unit or browser tests.
- Public API semantics are stable enough that workstation features do not need
  to reach into internals.
- Large and empty data cases do not silently corrupt range or readout state.

### 3. Series And Chart-Type Parity

Purpose:

- Treat series/chart-type support as an engine registry surface, not as scattered
  special cases in the shell.

Scope:

- Keep candlestick, bar, line, area, baseline, histogram, volume, compare, and
  moving average stable.
- Continue hardening heikin, renko, line break, kagi, point-and-figure, volume
  candles, hollow candles, HLC, and stepline paths.
- Build a per-series style schema registry and preserve style state across
  chart-type switches.
- Track which non-time chart types are usable implementations versus strict
  TradingView-compatible behavior.

Acceptance:

- Every registered chart type has deterministic data transformation, renderer
  dispatch, default style, snapshot state, and workbench controls.
- Non-time chart types document their behavioral gaps instead of pretending to
  be complete TradingView clones.

### 4. Price Scale And Pane Model Maturity

Purpose:

- Move from "pane has a rendered range" toward explicit pane-local scale
  ownership.

Scope:

- Price scale identity: `id`, side, mode, visibility, source attachments.
- Pane collection semantics and stable pane state snapshots.
- Pane height normalization, resize groups, fixed/resizable panes, divider
  geometry, and multi-layout readiness.
- Overlay scale and secondary scale semantics.

Acceptance:

- Pane/scale behavior can support multi-pane and future multi-chart layouts
  without demo-page policy.
- Restore and runtime mutation use the same pane/scale ownership rules.

### 5. Drawing Foundation V1

Purpose:

- Move drawing support from a few hard-coded tools into a real drawing engine.

Scope:

- Drawing tool registry.
- Drawing entity model and property schema registry.
- Selection, inspector routing, remove/restore, visibility, and pane ownership.
- Next tools: ray, extended line, rectangle, fib retracement, text label,
  measure tool, vertical line, parallel channel.
- Keep hit-testing, drag geometry, snapping, and render order tested.

Acceptance:

- Drawings can be created, selected, edited, removed, snapshotted, restored, and
  inspected through stable internal/public surfaces.
- Drawing state restore rejects invalid payloads instead of producing silent
  broken objects.

### 6. Study And Indicator Foundation

Purpose:

- Make studies/indicators first-class source objects before introducing a large
  indicator catalog or script runtime.

Scope:

- `StudySource` and `CompareStudy` ownership.
- Study input context and requested context merge.
- Indicator option schemas.
- Indicators-on-indicators as a planned contract, not a page-level shortcut.
- Initial catalog: moving average, compare, RSI, MACD, Bollinger Bands, VWAP,
  volume profile prototype.

Acceptance:

- Studies can be added to overlay or separate panes through the same source
  ownership surface.
- Indicator state is saved/restored with enough schema information to support
  later catalog growth.
- Engine-owned chart-state study snapshots can carry both built-in indicator
  state and a scripted-study descriptor shape before restore/execution
  promotion is wired.

### 7. State, Layout, Template, And Migration

Purpose:

- Turn runtime snapshots into durable chart layout state.

Scope:

- Versioned chart layout state.
- Forward migration for layout/template versions.
- Invalid-state rejection.
- Saved panes, sources, studies, drawings, viewport, scales, chart options, and
  formatter metadata.
- Import/export hooks for local and future cloud persistence.

Acceptance:

- A saved single-chart layout can be restored across app reloads.
- Schema migrations are explicit and tested.
- Runtime-only objects are not serialized accidentally.

### 8. Foundation Performance Gate

Purpose:

- Keep the engine measurable as feature density grows.

Scope:

- Large historical datasets.
- Multi-pane and multi-series scenarios.
- Drawing-heavy scenes.
- Indicator-heavy scenes.
- Interaction latency and frame budget smoke tests.

Acceptance:

- Performance regressions are visible through repeatable tests or benchmark
  scripts.
- Visual safety tests remain green for the main engine flows.

### Layer 1 Gate

Layer 1 is acceptable when:

- `pnpm check`, `pnpm test`, and `pnpm build` are green.
- A single chart can open, update, render, save, restore, and survive layout
  changes without demo-page policy.
- The public chart API remains compatible.
- The engine exposes stable boundaries for data, panes, sources, drawings,
  studies, scales, state, and render coordination.

## Layer 2: Workstation Parity

Goal: build the TradingView-like analyst workstation around the engine, without
turning the page shell into the owner of chart runtime policy.

### 1. Workbench Host Adapter

Purpose:

- Make host-provided data and persistence explicit.

Scope:

- `WorkbenchHostAdapter`.
- Symbol metadata.
- Bar loading.
- Watchlist loading.
- Layout persistence.
- Alert persistence.
- Performance dataset provider.
- Host intent bridge for open-symbol and locate-trade flows.

Acceptance:

- Fixture/local adapters can drive the workstation without runtime internals.
- A future app can replace fixture data with real market data without rewriting
  chart internals.

Implementation note:

- The first executable slice landed the public host adapter and fixture-driven
  watchlist symbol-open path before saved layouts, indicator catalog, or
  alerts.

### 2. Watchlist And Symbol Open

Purpose:

- Turn the workbench from a static demo into a symbol-driven workstation.

Scope:

- Watchlist model.
- Multiple watchlists.
- Symbol search and resolve.
- Click-to-open active chart.
- Recent symbols.
- Symbol metadata display.

Acceptance:

- A watchlist item can open a chart through a typed adapter path.
- The page shell does not manually stitch market data into chart internals.

### 3. Saved Layout V0

Purpose:

- Make workstation state durable.

Scope:

- `WorkbenchLayoutState`.
- Active chart hosts.
- Active symbol.
- Chart snapshot/layout payloads.
- Sidebar/bottom-panel state.
- LocalStorage persistence adapter first, provider-based persistence later.

Acceptance:

- Save, restore, reset, and import/export flows work locally.
- Saved layout state is versioned separately from runtime state.

Implementation note:

- The first saved-layout slice persists the active symbol, timeframe, chart type,
  chart state snapshot, and basic panel metadata through a versioned localStorage
  provider.
- The Svelte page remains a shell: it creates the browser provider and forwards
  save, restore, and reset actions to the workbench controller instead of
  owning persistence policy.
- Reset currently means resetting the active workbench view to the default
  `NDX` / `1D` state; it intentionally does not delete the saved layout, so a
  user can reset the view and still restore the saved layout.

### 4. Indicator Catalog V0

Purpose:

- Create a user-facing indicator entrypoint without starting scripting too
  early.

Scope:

- Typed indicator catalog.
- Indicator palette.
- Default option schemas.
- Overlay versus separate pane placement policy.
- Initial user-facing indicators: MA, compare, RSI, MACD, Bollinger, VWAP.

Acceptance:

- Users can add/remove/configure catalog indicators through workstation UI.
- Catalog entries map to engine study sources instead of page-local branches.

### 5. Alerts V0

Purpose:

- Add local alert semantics before cloud or broker integrations.

Scope:

- Price cross alerts.
- Drawing line cross alerts.
- Indicator value cross alerts.
- Enabled, triggered, acknowledged, disabled states.
- Alert panel and badge.
- Local persistence provider.

Acceptance:

- Alerts evaluate against chart state without owning chart internals.
- Triggered alert state survives local restore.

Implementation note:

- Alerts V0 now has a separate public V1 state contract and localStorage
  provider instead of storing alert records inside the saved layout snapshot.
- The demo controller owns the Workbench alert runtime list, projects persisted
  alert records into the sidebar summary model, and creates deterministic
  active-symbol price-cross alerts from the Workbench Alerts card.
- V0 intentionally remains local and narrow: no drawing alerts, indicator
  alerts, cloud sync, notification delivery, edit/delete flows, or
  broker/order behavior are included yet.

### 6. Object Tree And Inspector

Purpose:

- Make complex charts manageable.

Scope:

- Object tree for panes, sources, studies, drawings, price lines, and alerts.
- Select, hide/show, rename, remove.
- Shared property schema between drawing inspector and object tree.
- Stable object identity in snapshots.

Acceptance:

- Users can manage chart objects without direct canvas hit-testing.
- Object tree operations call public/internal owners, not ad-hoc page logic.

Implementation note:

- Object tree V0 is read-only and intentionally does not implement selection,
  collapse, or click routing yet.
- The public workbench contract includes `ObjectTreePanelModel` +
  `WorkbenchObjectTreeNodeModel` in `src/lib/chartx/public/workbench.ts`. This is
  a UI-facing projection, not the chart runtime graph.
- The demo controller builds the object-tree projection in
  `src/lib/demo/chartx-demo.ts` by deriving `nodes` from
  `PhaseOneChartStateSnapshot` plus pane snapshots and persisted workbench
  alerts. The projection is shallow and deterministic (labels, detail labels,
  muted state, and a `depth` number), rather than exposing mutable runtime
  objects.
- The UI renders the projection in
  `src/lib/demo/components/MarketWorkbenchPanel.svelte` as a read-only tree
  (`role="tree"` and `role="treeitem"` with `aria-level`), without wiring click
  handlers, selection state, or expand/collapse.
- Visual coverage for the V0 contract lives in `tests/visual/phase-one-harness.spec.ts`
  under the "object tree" workbench tests.

### 7. Multi-Chart Layout V0

Purpose:

- Start the path toward multi-chart TradingView layouts.

Scope:

- Single, two-column, and 2x2 layouts.
- `ChartHost` runtime instances.
- Active chart routing.
- Optional symbol link group.
- Optional crosshair and interval sync after basic layout is stable.

Acceptance:

- Multiple chart hosts can coexist without sharing runtime state accidentally.
- Watchlist open and saved layout flows target the active chart.

Implementation note:

- Multi-Chart Layout V0 is currently shell-first. The public workbench contract
  already models layout presets, slots, and active-host routing, and the demo
  workbench can render a visible split host shell with main/secondary host
  cards plus active-host switching.
- The executable slice is still limited to one live market chart runtime/canvas.
  In split mode, the active host owns that single live canvas while inactive
  hosts render summary cards only; there is not yet true simultaneous
  multi-runtime rendering.
- Active-host routing is real in the current code: watchlist symbol-open and
  saved-layout save/restore/reset flows operate on the active host record, with
  split-layout logs explicitly marked as active-host-only.
- The broader scope listed above remains deferred: no real 2x2 runtime layout
  yet, no simultaneous multi-runtime/canvas layout, and no sync groups for
  symbol, interval, or crosshair behavior.

### 8. Bar Replay V0

Purpose:

- Support historical playback as a workstation capability.

Scope:

- Replay cursor.
- Play, pause, step, speed.
- Replay data window.
- Indicator and drawing behavior under replay time.
- Future multi-chart replay sync.

Acceptance:

- Replay works on local fixture/history data.
- Normal live/static chart state can return after replay stops.

Implementation note:

- Bar Replay V0 is now active-chart-only in the demo workbench. The shell
  enables the replay bottom tab, but replay policy remains in
  `src/lib/demo/chartx-demo.ts` rather than moving into `+page.svelte`.
- The current slice supports enter, play, pause, step, and exit controls over
  local fixture/history bars for the active market chart only.
- Replay works by truncating the displayed `bars`, `line`, and `volume` payload
  to a replay cursor, then reusing the existing rebuild/render path. Exiting
  replay restores the full current dataset.
- This slice is intentionally narrower than full TradingView-style replay:
  there is no multi-chart replay sync, no cloud persistence, and no promise yet
  that indicator/drawing replay semantics are stable beyond the current rebuild
  behavior.
- Saved-layout save/restore/reset is blocked while replay is active so replay
  does not silently persist a truncated chart state as if it were the normal
  layout snapshot.

Implementation note:

- Bar Replay V0 is now live in the workbench demo as an active-chart-only local
  fixture/history capability. The public workbench shell enables the replay
  bottom tab through `enabledBottomTabs`, but replay policy and state ownership
  remain in the demo controller instead of `+page.svelte`.
- The current slice supports enter, play, pause, step, and exit from the
  workbench controller and replay card UI. Replay works by truncating the
  displayed bars, line payload, and volume payload to the replay cursor, then
  reusing the existing rebuild/render pipeline for the active chart host.
- Exiting replay restores the full active dataset by leaving replay mode and
  rebuilding against the current payload again. Save/restore/reset layout are
  intentionally blocked while replay is active so persisted layout state cannot
  silently capture replay-truncated chart state.
- This is intentionally still a V0 slice: no multi-chart replay sync, no cloud
  persistence, and no promise yet that indicator or drawing semantics under
  replay are stable enough to treat as final behavior.

### 9. Screener V0

Purpose:

- Add chart-adjacent scanning without building a full market-data platform yet.

Scope:

- Local fixture screener.
- Watchlist subset scanning.
- Basic filters: price, change, volume, indicator values.
- Results table and open-symbol integration.

Acceptance:

- Screener results open symbols through the same host adapter path.
- Screener logic does not depend on a single demo chart instance.

Implementation note:

- Screener V0 is now a local workbench sidebar panel instead of a standalone
  surface. The public workbench shell carries a thin `rightSidebar.screener`
  model, while the demo controller builds deterministic screener rows from the
  existing watchlist/fixture symbols.
- The current slice exposes a small local filter set only: falling-only and an
  optional price-floor toggle. Results are ranked by absolute percentage move,
  then rendered in the right sidebar alongside the other workbench panels.
- Result clicks route through the same existing open-symbol path used by the
  watchlist and active-host workbench routing. `+page.svelte` remains a thin
  shell that only forwards screener result clicks to the controller.
- This is intentionally still demo-local V0 behavior: no remote screener feed,
  no query DSL, no saved screener presets, and no multi-watchlist management
  are included yet.

### 10. Workstation UX And Command Surface

Purpose:

- Make the product usable as a daily analyst tool.

Scope:

- Toolbar command registry.
- Keyboard shortcuts.
- Command palette.
- Theme presets.
- Workspace tabs.
- Import/export buttons.
- Error and empty states for missing data/adapters.

Acceptance:

- Common actions are command-driven and testable.
- UI panels remain thin projections of workstation models.

Progress checklist:

- [x] Toolbar command registry
- [x] Keyboard shortcuts
- [x] Command palette
- [x] Theme presets
- [x] Workspace focus tabs
- [x] Layout import/export buttons
- [x] Missing adapter status surface for local persistence/providers
- [x] Broader missing-data empty/error states across workstation panels
- [x] Full multi-document workspace tabs

Implementation note:

- Command Surface V0 is now real as a thin workbench command palette, not just
  a future toolbar idea. The public workbench shell carries a small
  `commandPalette` model, while the demo controller publishes deterministic
  command entries for theme, layout, layout persistence, and replay entry/exit.
- `src/routes/+page.svelte` still does not own workstation policy. It only
  keeps the open/closed state for the palette and wires `Cmd/Ctrl+K` plus
  `Escape` into the existing controller-backed command execution path.
- `src/lib/demo/components/MarketWorkbenchPanel.svelte` renders the palette
  overlay with stable selectors so browser coverage can prove that keyboard
  open/close and command execution both work against the current workbench
  shell.
- The next executable workstation slice is also now live in the same boundary:
  the public workbench shell carries focused `workspaceTabs`, active sidebar
  focus, import/export button state, and a thin status notice surface. The
  demo controller owns workspace focus, layout JSON import/export, and
  controller-backed success/error reporting, while `+page.svelte` stays a thin
  browser I/O shell for file download/upload only.
- The shell now also carries a real multi-document workspace-tab model instead
  of only four fixed focus toggles. Each tab has its own id, label, view kind,
  symbol/timeframe labels, closeability, and persisted layout snapshot. Tab
  switches re-open the corresponding chart document, and create/close actions
  stay inside the existing thin shell boundary.
- Layout import/export is local JSON only. Export downloads the current focused
  layout snapshot, and import validates the same `WorkbenchLayoutState`
  contract before applying it back through the existing symbol-open and chart
  restore path. The same contract now optionally carries a workspace-documents
  block, so local save/restore/import/export round-trips the entire workspace
  tab set instead of only the active tab.
- The shell now also exposes persistent adapter-status rows for market data,
  layout persistence, and alerts persistence. When storage-backed providers are
  missing, the workbench shows explicit `missing` adapter state and disables
  save/restore actions instead of failing only through activity-log messages.
- Watchlist, screener, alerts, and object-tree panels now all carry explicit
  empty-state copy instead of silently rendering blank lists. The demo runtime
  publishes provider-aware labels such as `Local alerts persistence
  unavailable.` and stops seeding fake demo alerts when no alerts provider is
  attached, so the shell reflects real workstation capability.
- This is intentionally still a V0 workstation shell: there is no fuzzy search,
  no free-text command parsing, no multi-step command routing, no cloud
  workspace sync, and no cloud/shared workspace document model yet.

### Layer 2 Gate

Layer 2 is acceptable when:

- A user can maintain watchlists, open symbols, add indicators, draw, save
  layouts, set local alerts, run replay, and use a basic screener.
- `src/routes/+page.svelte` acts as a shell, not the owner of workstation
  policy.
- Main user paths have browser or visual tests.
- Workstation capabilities are exposed through explicit public/internal
  contracts.

## Layer 3: Platform UI Parity

Goal: add TradingView-like platform-facing UI capabilities only after the
engine and workstation layers have stable contracts.

Layer 3 is intentionally later. These features are high-leverage but dangerous
if started too early because they can force unstable engine assumptions into
public compatibility contracts.

Boundary:

- `chartx2` should implement the chart product's UI/components/contracts for
  these platform-facing areas.
- `chartx2` may keep lightweight demo or fixture-backed behavior where needed
  to exercise the UI, but it should not become the long-term home for the full
  execution logic.
- `alpha2` is the intended host product for these surfaces.
- Heavy logic such as script execution engines, strategy simulation, broker
  logic, cloud/sync backends, and account services should be assumed to land in
  a Rust core plus host-product adapters rather than in `chartx2` itself.

### 1. Script System Roadmap

Purpose:

- Deliver a TradingView-like script authoring and inspection UI surface without
  forcing the final script engine to live in `chartx2`.

Scope:

- Script editor, library, metadata, parameter editing, status/error UI, and
  chart/workbench integration points.
- Script output configuration UI for plots, panes, and display metadata.
- Versioned script metadata and host-facing script execution contracts.
- Demo/runtime scaffolding only where needed to exercise the UI and contracts.
- Later Pine-compatible subset evaluation as a compatibility target for the UI
  and contract layer, not as a promise that `chartx2` owns the final engine.

Acceptance:

- A script-created indicator UI can attach to a chart through the
  indicator/source system and exercise a host execution seam.
- Script failures are isolated and visible in the UI.
- Script editing, script library, and indicator attachment surfaces are
  reusable by `alpha2`.

Progress checklist:

- [x] Local scripted indicator runtime with typed V0 expression model
- [x] Execution budget and isolated failure result
- [x] Catalog-visible canned scripted indicator
- [x] Scripted catalog entries expose numeric input metadata
- [x] Demo/workbench execution against active bars
- [x] Demo/workbench add flow accepts scripted input values
- [x] Active-indicator and object-tree reflection for the scripted entry
- [x] Active-indicator summaries surface scripted input values
- [x] Workbench-owned scripted layout/workspace persistence through save, restore, export, and import
- [x] Scripted input values persist through workbench save, restore, export, and import
- [x] Workbench-owned custom script library persisted through save, restore, export, and import
- [x] Local create/edit/delete flow for user-authored structured SMA presets
- [x] Builtin scripted entries can be saved into the local custom-script library
- [x] Saved custom scripts launch from the script library instead of the generic indicator catalog
- [x] Local duplicate flow for saved custom scripts
- [x] Invalid custom-script length inputs are blocked in the Script Library before save/add
- [x] Script Library can import supported expression text into the AST builder
- [x] Saved custom-script rows surface in-use state and fence edit/delete affordances
- [x] Script Library import text can resync to the current builder expression
- [x] Script Library can locally filter saved scripts without touching runtime state
- [x] Script Library can locally sort saved scripts for management views
- [x] Script Library empty filter states can recover in place
- [x] Script Library delete uses an explicit confirm/cancel row state before removing a saved custom script
- [x] Script Library fences dirty draft replacement before switching saved edit targets
- [x] Workbench layout exposes a normalized scripted-study descriptor bridge ahead of chart-state-native promotion
- [x] Persist separate-pane scripted indicators as first-class chart-state studies
- [x] Engine chart-state restore replays separate-pane scripted-study snapshots through the shared study coordinator path
- [x] Workbench scripted-study descriptors now reuse engine `studyOptions` as the migration seam and normalize legacy saved layouts on load/import
- [x] Object tree scripted-study rendering now consumes a single study projection path instead of a parallel workbench-only script node path
- [x] Layout restore/import/workspace/host scripted-study replay now shares one apply path and surfaces partial scripted-study restore warnings
- [x] Workbench layout sanitization strips trailing separate-pane scripted panes back out of persisted chart state when the descriptor bridge is present
- [x] Workbench scripted-indicator descriptor serialization now uses a shared bridge creator instead of hand-built `studyOptions` defaults in the demo shell
- [x] Active indicator and custom-script in-use surfaces now fall back to engine-native scripted-study chart-state snapshots when descriptor replay is absent
- [x] Engine-native fallback scripted-study rows now render an explicit `engine-restored` read-only hint instead of a silent missing remove affordance
- [x] Script editor and library rows now expose a reusable execution-status surface instead of hiding script attach state inside demo-only callbacks
- [x] Script library rows distinguish local-runtime and host-adapter execution ownership
- [x] Script attach results now flow through an explicit host-facing execution adapter contract
- [x] Visual coverage now exercises adapter-driven script failure state without crashing the panel
- [ ] Richer text editor and broader script-library management beyond preset cloning
- [ ] Pine-compatible subset-oriented editor/metadata/compatibility surface

Implementation note:

- `Scripted Indicator V0` is intentionally a workbench-owned slice, not a new
  first-class chart study contract yet. The local script runtime lives in
  `src/lib/chartx/public/workbench-scripts.ts` with a small typed expression
  model, a bounded execution budget, and structured success/failure results.
- The workbench indicator catalog now exposes canned scripted entries together
  with numeric input metadata. The current local library includes
  `Scripted SMA 20` and `Scripted HLC3 SMA 10`, each with a bounded `Length`
  input that stays owned by the workbench script/runtime layer.
- The demo add-indicator flow now accepts numeric input values for scripted
  entries before executing the script against the active OHLC payload and
  attaching the output as a normal line study in a separate pane.
- Script failures are isolated through status/log surfaces rather than leaking
  uncontrolled exceptions into the shell.
- Active-indicator summaries and workbench-owned scripted layout descriptors now
  carry `inputValues`, so save/restore/export/import can round-trip
  parameterized scripted entries without promoting them into chart-state-native
  studies.
- `User-Authored Script Library V0` keeps the same boundary and adds a local
  custom-script library on top: the Indicators panel can create, edit, and
  delete structured SMA presets, the catalog is rebuilt from the saved custom
  library, and layout save/restore/export/import now carries those custom
  script definitions before replaying mounted scripted indicators.
- `Library-Owned Custom Script Launch V1` tightens that ownership boundary:
  builtin scripted catalog entries can now be saved into the local library as
  presets, saved custom scripts launch directly from the Script Library itself,
  and restore/import now reattach custom scripted indicators by `scriptId`
  instead of depending on synthetic catalog entries.
- `Script Expression Editor V0` starts the deferred editor line without
  widening the runtime boundary: saved custom scripts are now authored through
  a constrained `Expression` editor (`sma(<field>, length)`), validation lives
  in the shared workbench-script helpers, and the Script Library only clears
  the local draft after a confirmed save instead of resetting on a no-op
  callback.
- `Script Authoring AST V1` widens that authoring subset to the recursive
  runtime shape the engine already understands: custom-script library entries
  can now round-trip `field`, `sma(expr, length)`, and
  `subtract(left, right)` compositions through the same workbench-owned
  definition and layout persistence contract.
- `Custom Script Placement Fence V0` keeps that boundary honest: until scripted
  overlays can be stripped back out of engine chart state safely, custom script
  authoring now explicitly fences placement to `separate-pane` instead of
  advertising a false overlay mode in the workbench editor.
- `AST Builder V0` moves the custom-script editor off raw text entry: the
  workbench now edits the existing recursive expression subset through a
  structured builder and treats canonical `expressionText` as derived
  compatibility output instead of the live form state.
- `Script Library Invalid Length Fence V0` closes a correctness gap in the
  local authoring shell: Script Library default-length and launch-length
  validation now feed explicit reactive derived state in the panel, so invalid
  values surface immediately and block save/add actions before the runtime
  boundary is reached.
- `Script Library Expression Import V0` adds a narrow bridge between copied
  expression text and the structured AST builder: the Script Library can now
  parse a supported expression string into the builder, but failed imports keep
  the current builder state intact instead of clobbering it.
- `Script Library In-Use Fence V0` brings the shell back in line with the
  existing runtime guard: saved custom-script rows now publish `inUse` state
  and disable edit/delete affordances while that script is active on a chart.
- `Script Library Import Reset V0` closes a smaller authoring drift gap: the
  one-shot import field can now be pulled back to the current canonical builder
  expression without overwriting the builder itself.
- `Script Library Filter V0` starts the broader management UX line without
  widening runtime scope: saved custom scripts can now be filtered locally by
  metadata or expression text, and the empty/count states follow the filtered
  view instead of the raw library length.
- `Script Library Sort V0` continues that local management line: saved scripts
  can now be reordered by recency, alphabetical label, or in-use priority
  without changing any runtime or persistence contracts.
- `Script Library Filter Recovery V0` tightens the filter UX loop: when a local
  saved-script query produces no matches, the empty state can now clear that
  query in place instead of forcing the user back to the top controls.
- `Script Library Delete Confirm V0` closes the remaining one-click destructive
  row action in the local library shell: saved custom-script rows now require an
  explicit confirm/cancel step before deletion, while keeping in-use rows
  fenced and clearing the editor back to create mode if the deleted row was the
  current edit target.
- `Script Library Dirty Draft Fence V0` closes the remaining silent-replacement
  gap in that local editor shell: when the current custom-script draft diverges
  from its last loaded baseline, clicking `Edit` on another saved script now
  raises a local discard/cancel fence instead of silently replacing the dirty
  draft, and save/reset/delete flows clear the pending replacement state.
- `Scripted Study Descriptor Bridge V0` starts the first explicit promotion seam
  without widening into engine-native study ownership: the workbench layout
  layer now normalizes scripted descriptors through a dedicated helper before
  save/export/import/restore paths touch them, and the demo bridge uses that
  helper instead of open-coded descriptor copies.
- `Engine Scripted Study State Shape V0` promotes the snapshot contract itself:
  engine chart state now has a dedicated `scripted-study` study variant, and
  chart-state builders can serialize scripted-study indicator sources into that
  shape without depending on workbench-local descriptor replay.
- `Scripted Study Chart-State Restore V0` hardens the next step of that seam:
  demo-local host and workspace records now keep scripted studies in the same
  normalized descriptor shape used by layout persistence, and restore/import
  both rebuild mounted scripted studies through one descriptor-based helper
  instead of ad hoc `DemoActiveIndicator` replay.
- `Engine Scripted Study Restore Mount Seam V0` closes the restore regression in
  the engine path itself: `applyChartState()` now clears, mounts, and reapplies
  `scripted-study` snapshots through the same coordinator/restore chain used by
  other restorable studies, so `chart.getChartState(); chart.applyChartState(saved);`
  no longer drops separate-pane scripted studies.
- `Scripted Study Layout Bridge Seam V1` tightens the migration contract between
  those engine snapshots and the remaining workbench-owned descriptor bridge:
  layout/workspace scripted descriptors now carry the engine
  `scripted-study.studyOptions` shape directly, and load/import normalizes older
  top-level `scriptId`/`inputValues` payloads into that canonical seam before
  demo restore or script-library `inUse` checks touch them.
- `Scripted Study Projection And Restore Seams V1` removes two remaining
  promotion leaks above that bridge. First, the object tree no longer renders
  scripted studies through a second workbench-only append path; it consumes one
  study projection that can enrich engine/native or workbench-owned scripted
  studies with display metadata. Second, layout restore/import, workspace tab
  activation, and host activation now all reuse the same chart-state-plus-
  scripted-descriptor apply helper and downgrade to warning state when one or
  more scripted studies fail to remount instead of silently claiming a clean
  restore.
- The same seam now hardens persistence cleanup for workbench-owned scripted
  panes: when the descriptor bridge is present, layout sanitization strips
  trailing separate panes back out of persisted chart state so export/save
  stops leaking duplicate script panes alongside the descriptor-owned restore
  path.
- `Scripted Study Descriptor Creator Seam V1` closes a smaller but still real
  drift point inside the remaining bridge: demo/workbench scripted-indicator
  serialization no longer hand-builds `studyOptions` defaults locally and now
  routes through a shared layout helper, so future engine/default-field changes
  do not need a second manual update in `chartx-demo.ts`.
- `Scripted Study Active Surface Fallback V1` closes the next user-facing gap in
  that same middle state: when a chart imports or restores engine-native
  `scripted-study` snapshots without descriptor replay, the active-indicator
  list and custom-script library `inUse` guard now project fallback scripted
  entries from live chart state instead of pretending no scripted study is
  mounted. Those fallback rows intentionally do not expose a remove action
  unless the demo runtime has an actual local remove handle for that pane.
- `Scripted Study Fallback Readonly Hint V1` makes that limitation explicit in
  the shell: fallback-only active scripted rows now render an `engine-restored`
  marker so the missing remove action reads as intentional read-only behavior
  rather than a broken button gap. Export/save policy for native-only scripted
  studies remains a separate follow-up.
- `Scripted Study Promotion Review Pass` is now partly superseded: the workbench
  descriptor bridge is still useful for surrounding layout/library flows, but
  engine chart state now owns the separate-pane scripted-study snapshot and
  restore seam instead of treating scripted studies as descriptor-only state.
- Planned `Active Script Use Remove V0` should add a workbench-owned remove
  action for active scripted indicators so users can clear library `inUse`
  fences from the active indicator list without deleting the saved custom
  script definition or changing chart-state persistence.
- This still does not mean full scripted-study parity. The current engine seam
  only covers separate-pane scripted-study snapshots that are already present
  in chart state. This wave does not add Pine compatibility, overlay scripted
  studies, or broader layout/chart-state migration beyond the restore/mount
  seam itself.
- The long-term expectation is that `chartx2` keeps the editor/library and
  host-facing script contract surfaces, while deeper execution semantics move
  into a Rust core consumed by `alpha2`.
- `Script Execution Adapter Surface V0` starts that contract-first split in the
  current shell: the public script helpers now export a typed execution adapter
  and status model, the workbench demo consumes that adapter instead of calling
  local execution directly from the panel-owned attach flow, and the Indicators
  panel renders adapter-owned owner/state/message UI that can be reused by a
  real host product.

### 2. Strategy Tester

Purpose:

- Provide a TradingView-like strategy tester UI surface and chart/performance
  integration shell.

Scope:

- Strategy tester panel layout, tabs, filters, summaries, trade list, equity
  curve viewport, and chart locate-trade affordances.
- Host-facing data contracts for trades, metrics, equity points, runs, and
  parameter sets.
- Fixture/demo-backed behavior where needed to exercise the UI.
- No commitment that `chartx2` owns the final backtest engine.

Progress checklist:

- [x] A public `StrategyTesterPanelModel` now exists as a reusable host-facing UI contract
- [x] The workbench demo mounts a fixture-backed strategy tester shell through the existing `performance-link` bottom-tab seam
- [x] Focused visual coverage asserts the panel shell, metrics, and trade rows without relying on a real backtest engine

Acceptance:

- A strategy tester UI can display a trade list and performance report through
  typed host contracts.
- Performance chart family remains separate from market chart runtime.
- The resulting components are reusable by `alpha2`.

Implementation note:

- `Strategy Tester Shell V0` keeps the boundary narrow: `chartx2` now ships the
  public panel contract and a fixture-backed workbench shell path, while real
  strategy execution, parameter sweeps, and run storage stay deferred to
  `alpha2` plus the future Rust core.

### 3. Paper Trading And Broker Adapter

Purpose:

- Add chart-trading UI components without putting broker logic inside the
  engine or `chartx2`.

Scope:

- Order ticket UI, order line UI, drag-to-modify affordances, confirmation
  flows, bracket preview UI, and audit/status surfaces.
- Host trading adapter contracts and local fixture/demo adapters.
- No real broker implementation in `chartx2`; the final execution path should
  be expected to live behind host adapters and a Rust core.

Progress checklist:

- [x] Public host-facing trading, sync, and sharing surface contracts now exist
- [x] The workbench demo mounts a fixture-backed trading ticket shell through the existing trade bottom-panel seam
- [x] Focused visual coverage asserts the ticket shell without relying on a broker backend

Acceptance:

- Paper-trading-style UI flows can be exercised through local fixture adapters.
- Real broker integration remains behind explicit adapters and confirmations.
- The resulting trading widgets are reusable by `alpha2`.

Implementation note:

- `Trading Ticket Shell V0` keeps the slice deliberately narrow: `chartx2` now
  ships a reusable ticket contract and a fixture-backed panel path in the
  workbench shell, while order validation, broker routing, and execution
  confirmation remain deferred to host adapters and the future Rust core.

### 4. Cloud, Sync, And Account Boundary

Purpose:

- Make persistence and account-facing surfaces pluggable instead of making
  cloud state a chart-engine dependency.

Scope:

- Persistence/sync/account settings UI, provider status UI, conflict dialogs,
  offline indicators, import/export fallback UI, and typed provider contracts.
- Local provider first.
- Backend/cloud implementations are expected to live outside `chartx2`.

Acceptance:

- Cloud or backend persistence can be added without changing chart runtime
  models.
- Local-only usage remains possible.
- The resulting settings/status surfaces are reusable by `alpha2`.

Progress checklist:

- [x] The workbench sidebar now mounts a fixture-backed account sync status card as its own host-oriented shell surface
- [x] Refresh status uses the shell notice path only for transient outcomes instead of reusing adapter status as the primary sync UI
- [x] Focused visual coverage asserts the separate sync card and refresh selector path

Implementation note:

- `Sync Status Shell V0` keeps the slice UI-only: `chartx2` now renders a
  dedicated account sync status card in the workbench sidebar, while provider
  auth, real cloud persistence, and conflict handling remain deferred to the
  external host-owned sync boundary.

### 5. Publishing, Sharing, And Marketplace

Purpose:

- Add community/product UI surfaces only after core user workflows are stable.

Scope:

- Share dialogs, version/history views, permission/status UIs, import/review
  flows, and typed artifact contracts for layouts, presets, and scripts.
- Optional marketplace/private-library shell UI.
- No requirement that `chartx2` owns publication backends or trust services.

Acceptance:

- Shared artifact UIs are versioned and reviewable through typed contracts.
- Untrusted scripts or layouts cannot mutate privileged host state through the
  `chartx2` shell.
- The resulting sharing components are reusable by `alpha2`.

Implementation note:

- `Share Dialog Shell V0` is now a fixture-backed workbench slice. The toolbar
  mounts a dedicated share trigger beside layout import/export, while the demo
  controller publishes a separate `shareDialog` model backed by the public
  `sharing-surface.ts` contract instead of overloading `adapterStatus`.
- The dialog is intentionally host-adapter-oriented: `chartx2` owns only the
  shell, visibility choices, deterministic fixture publish action, and stable
  selectors for browser coverage. Real publication, permissions, review, and
  marketplace flows remain external-host responsibilities.
- This V0 does not add version history, copy-link UX, import/review queues,
  script trust policy, or any real backend persistence. It is a narrow UI seam
  proving where those host-backed flows will mount.

### 6. Multi-Device Productization

Purpose:

- Decide how the chart product UI should scale beyond the current desktop-first
  shell.

Scope:

- Tauri desktop as primary target.
- Web as compatible target.
- Mobile as later productization, not a first constraint.
- Responsive fallbacks for key panels, component density variants, input-mode
  adaptations, and host profile contracts.
- No requirement that `chartx2` owns the final cross-device sync engine.

Acceptance:

- Desktop remains the primary high-density workflow.
- Web/mobile support does not force engine compromises.
- The resulting responsive components and host contracts are reusable by
  `alpha2`.

Progress checklist:

- [x] Narrow-width workbench now exposes a dedicated `Panels` trigger instead of
  always forcing the right sidebar inline below the chart shell
- [x] The mobile panel surface reuses the existing sidebar content as a
  sheet-style overlay, keeping the responsive slice UI-only and host-neutral
- [x] Focused visual coverage asserts the mobile panel trigger, open state, and
  close path at a narrow viewport
- [x] Fixture-backed strategy/trading bottom content can now open as a mobile
  bottom sheet instead of permanently consuming inline chart space on narrow
  screens
- [x] The same mobile bottom-sheet seam now covers both trading and strategy
  shells, and sheet offsets account for device safe-area bottom insets
- [x] Mobile sidebar and bottom sheets now expose a compact/expanded size
  toggle so dense panel content can open deeper without changing runtime state
- [x] Mobile sidebar and bottom sheets now expose handle-based downward
  drag-dismiss with a fixed threshold, and the threshold is covered by focused
  narrow-screen tests
- [x] Mobile sidebar and bottom sheets now cycle through
  `default -> expanded -> full -> default`, and navigation actions auto-close
  them before shell focus changes
- [x] Mobile sidebar and bottom sheets now expose live drag follow and
  upward drag-to-snap between size steps before the dismiss path takes over
- [x] The mobile bottom-sheet seam now covers the replay workflow too, so
  narrow-screen replay controls no longer depend on the sidebar sheet staying
  open
- [x] Entering replay from the narrow-screen toolbar now auto-opens the replay
  bottom sheet, so the active replay controls stay visible without a second tap

Implementation note:

- `Mobile Sidebar Sheet V0` keeps this layer intentionally narrow. `chartx2`
  now provides a mobile-friendly shell affordance that protects chart space on
  small screens, while deeper touch gesture tuning, density profiles, and
  device-specific host policy stay deferred to later productization work and
  the future Rust-backed host stack.
- `Mobile Bottom Panel Sheet V0` extends the same idea to fixture-backed bottom
  shells such as trading and strategy panels. The slice still avoids any new
  runtime or host contract; it only changes how existing content mounts at
  narrow widths.
- `Mobile Strategy Parity + Safe-Area V0` keeps the follow-up equally narrow:
  it reuses the same sheet path for strategy shells and hardens the narrow
  layout with safe-area-aware bottom spacing instead of introducing new
  device-specific host models.
- `Mobile Sheet Size Controls V0` keeps the next step shell-only as well: it
  adds local expand/compact controls for dense mobile sheets without adding any
  new public device profile or runtime layout model.
- `Mobile Sheet Drag Dismiss V0` still stays on the same boundary. It adds a
  deterministic handle-and-threshold dismiss path instead of jumping straight
  to full gesture physics or device-specific motion policy.
- `Mobile Snap Heights + Navigation Close V0` keeps the next step just as
  bounded: it upgrades local sheet sizing from a binary flag to a small snap
  enum and ensures workspace/bottom-tab navigation does not leave stale mobile
  overlays hanging around.
- `Mobile Drag-To-Snap + Live Follow V0` stays shell-only too. It adds transient
  drag state and live offset rendering on the existing handles, without pulling
  chart/runtime models into device-specific gesture concerns.
- `Mobile Replay Bottom Sheet V0` keeps the next step on the same boundary. It
  reuses a shared replay panel surface and mounts replay controls through the
  existing mobile bottom-sheet seam, without widening the host/runtime replay
  contract.
- `Mobile Replay Auto-Open V0` keeps the follow-up equally bounded: when replay
  becomes active on a narrow viewport, the shell automatically opens the replay
  bottom sheet instead of forcing the user to enter replay and then open the
  sheet manually.

### Layer 3 Gate

Layer 3 is acceptable when:

- Script indicators can attach, render, save, restore, and fail safely through
  a reusable editor/library/contract surface.
- Strategy tester, trading, sync, and sharing surfaces exist as reusable UI
  components with typed host contracts.
- Fixture/demo adapters are sufficient to exercise the intended UI behavior.
- No platform feature reaches directly into private chart runtime internals.
- `chartx2` remains a chart/workstation component suite rather than absorbing
  the full product backend.

## Execution Order

Recommended sequence:

1. Foundation closeout.
2. Workstation v0.
3. Platform v0.

Foundation closeout:

- Runtime container ownership.
- Chart state/layout schema hardening.
- Pane/price-scale ownership.
- Drawing and study registries.
- Performance gate.

Workstation v0:

- Workbench host adapter.
- Watchlist and symbol open.
- Saved layout.
- Indicator catalog.
- Local alerts.
- Object tree.
- Multi-chart layout.
- Bar replay.
- Screener.

Platform v0:

- Script runtime design doc.
- Script indicator prototype.
- Strategy tester prototype.
- Paper trading adapter.
- Persistence provider abstraction.

## Parallelization Rules

Safe parallel work:

- Independent owner/model modules with disjoint write sets.
- Tests for those new modules.
- Docs that describe separate boundaries.
- Fixture adapters that do not rewrite shared shell files.

Serial work:

- `src/routes/+page.svelte` rewiring.
- `chart-harness` rewiring.
- Public API shape changes.
- Layout snapshot schema changes.
- State migration changes.

Rule:

- Parallel workers may build modules and tests, but one integration pass should
  wire shared entrypoints that overlap in the same files.

## Verification Policy

Every implementation slice should record:

- What changed.
- What external contract stayed stable.
- What verification ran.
- What is intentionally not included.

Default verification:

- `pnpm check` for Svelte/TypeScript changes.
- `pnpm test` for engine, public API, interaction, renderer, or visual changes.
- `pnpm build` for production-build-affecting frontend changes.
- `cargo check` for Tauri/Rust changes.
- Browser or visual verification for user-facing chart interaction changes.

## Documentation Policy

Every meaningful phase should update at least one durable artifact:

- Architecture note when boundaries change.
- Roadmap/checklist when scope changes.
- Tutorial under `tutorials/commit` when committing a non-trivial slice.
- Acceptance note when a parity milestone is closed.

## Explicit Non-Goals For The Next Stage

Do not start these before Layer 1 and the early Layer 2 host contracts are
stable:

- Pine Script compatibility.
- Real broker integration.
- Cloud account sync.
- Public marketplace/community features.
- Full mobile TradingView parity.
- A second market chart runtime hidden inside the workstation shell.

## Immediate Next Line

The next practical line should be:

1. Close the runtime-container and layout-state foundation gaps that block
   reliable hosting.
2. Add a workbench host adapter with watchlist and symbol-open flow.
3. Persist local workbench layout state.
4. Move indicator catalog and alerts into typed workstation models.

This gets `chartx2` out of the demo-only phase without prematurely committing
to platform-level scripting, broker integration, or cloud services.
