# TradingView Alignment Plan

Date: 2026-04-23

This document is the long-range alignment plan for `chartx2`.

`chartx2` should not be treated as a one-page chart demo. The target is a
modifiable TradingView-like chart workstation, with `lightweight-charts` parity
as the first floor and a broader workstation/platform surface as the ceiling.

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

## Layer 3: Platform Parity

Goal: add TradingView-like platform capabilities only after the engine and
workstation layers have stable contracts.

Layer 3 is intentionally later. These features are high-leverage but dangerous
if started too early because they can force unstable engine assumptions into
public compatibility contracts.

### 1. Script System Roadmap

Purpose:

- Enable user-defined indicators and strategies without copying Pine Script
  blindly at the start.

Scope:

- Design a `chartx script` runtime or DSL.
- AST, type system, sandbox, execution budget, and deterministic data access.
- Indicator script output.
- Drawing/plot output channels.
- Versioned script metadata.
- Later Pine-compatible subset evaluation.

Acceptance:

- A script-created indicator can run in a sandbox and attach to a chart through
  the indicator/source system.
- Script failures are isolated and visible.

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
- [ ] Persist scripted indicators as first-class chart-state studies
- [ ] Richer text editor and broader script-library management beyond preset cloning
- [ ] Pine-compatible subset evaluation

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
- Planned `Active Script Use Remove V0` should add a workbench-owned remove
  action for active scripted indicators so users can clear library `inUse`
  fences from the active indicator list without deleting the saved custom
  script definition or changing chart-state persistence.
- Demo-local host/workspace snapshot capture strips scripted panes back out of
  exported layout/chart state, but the workbench layout schema now carries
  scripted indicator descriptors separately so save/restore/export/import can
  reapply them without pretending they are chart-state-native studies.
- This does not yet mean scripts are chart-state-native. V0 does not persist
  scripted indicators as distinct study definitions through `getChartState()`
  or `applyChartState()`. The current authoring path is still a structured
  workbench form for saved SMA presets, not a general text editor, parser, or
  Pine-compatible authoring surface.

### 2. Strategy Tester

Purpose:

- Support backtesting and performance review as a platform capability.

Scope:

- Strategy script output.
- Simulated orders and positions.
- Entry, exit, bracket, stop, target, commission, slippage.
- PnL, drawdown, win rate, trade list, equity curve.
- Link trades back to market chart locate-trade behavior.

Acceptance:

- A strategy can produce a trade list and performance report.
- Performance chart family remains separate from market chart runtime.

### 3. Paper Trading And Broker Adapter

Purpose:

- Add chart trading without putting broker logic inside the engine.

Scope:

- Host trading adapter.
- Paper trading adapter first.
- Order ticket.
- Order lines.
- Drag-to-modify with confirmation.
- Bracket order preview.
- Audit trail for all trading intents.

Acceptance:

- Paper orders can be created and modified from the chart.
- Real broker integration remains behind explicit adapters and confirmations.

### 4. Cloud, Sync, And Account Boundary

Purpose:

- Make persistence pluggable instead of making cloud state a chart-engine
  dependency.

Scope:

- Persistence provider for layouts, watchlists, alerts, scripts, indicator
  presets, and templates.
- Local provider first.
- Private backend provider later.
- Import/export fallback.
- Conflict handling and offline mode.

Acceptance:

- Cloud or backend persistence can be added without changing chart runtime
  models.
- Local-only usage remains possible.

### 5. Publishing, Sharing, And Marketplace

Purpose:

- Add community/product surfaces only after core user workflows are stable.

Scope:

- Share chart layout.
- Share indicator preset.
- Share script.
- Version, permission, signature, audit, and rollback.
- Optional marketplace or private library.

Acceptance:

- Shared artifacts are versioned and safe to import.
- Untrusted scripts or layouts cannot mutate privileged host state.

### 6. Multi-Device Productization

Purpose:

- Decide how far beyond desktop the product should go.

Scope:

- Tauri desktop as primary target.
- Web as compatible target.
- Mobile as later productization, not a first constraint.
- Responsive fallbacks for key panels.
- Shortcut profiles and workspace sync.

Acceptance:

- Desktop remains the primary high-density workflow.
- Web/mobile support does not force engine compromises.

### Layer 3 Gate

Layer 3 is acceptable when:

- Script indicators can attach, render, save, restore, and fail safely.
- Strategy tester produces trades and reports from deterministic input data.
- Paper trading uses an adapter boundary and auditable intents.
- Persistence providers can swap local and backend implementations.
- No platform feature reaches directly into private chart runtime internals.

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
