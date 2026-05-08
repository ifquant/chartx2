# Chartx2 Host Surface Readiness

Date: 2026-05-04

This note audits the current `chartx2` host-facing surfaces from the viewpoint
of `alpha2`.

The goal is practical:

- which surfaces are ready for direct host consumption now
- which surfaces are usable but still demo-leaning
- which seams still need to be formalized before they should be treated as
  stable host boundaries

This is not a product roadmap. It is a host-integration readiness review.

## Ready Now

These surfaces are ready for direct `alpha2` consumption through the public
barrel.

### Contracts

- `sharing-surface.ts`
- `strategy-tester.ts`
- `trading-surface.ts`
- `account-sync-surface.ts`
- `workbench.ts`

Reason:

- the models are explicitly typed
- the public barrel exports them
- the current host integration guide and example both rely on them
- the repo now treats them as the intended public seam rather than incidental
  demo state

### Components

- `ShareDialogShell`
- `ShareArtifactSummaryCard`
- `StrategyTesterPanel`
- `StrategyTesterSummaryCard`
- `TradingTicketPanel`
- `TradingTicketSummaryCard`
- `AccountSyncStatusCard`
- `AccountSyncSummaryCard`
- `WorkbenchHostSummaryStrip`
- `WorkbenchHostSurfaceDock`
- `Alpha2HostIntegrationExample`

Reason:

- these now export through the public barrel
- the host-facing component graph no longer depends on chartx2-only `$lib/...`
  import paths for its own internal wiring
- they compile through the repo's normal `svelte-check` and `build` flow
- they represent the current intentional host-facing UI layer

## Usable But Still Demo-Leaning

These surfaces can already help `alpha2`, but should be treated as thin UI
shells rather than long-term backend or runtime boundaries.

### `ShareDialogShell`

Good now:

- publish shell layout
- metadata rows
- history preview
- review queue
- permission rows

Still demo-leaning:

- `onRunAction(...)` is still host-defined by convention, not by a richer typed
  action protocol
- no backend lifecycle or result protocol beyond the current surface model

### `StrategyTesterPanel`

Good now:

- tabs
- run switching
- selected trade detail
- locate affordance
- parameter draft shell
- draft-aware action shell

Still demo-leaning:

- no formal rerun/compare request protocol
- no stable async action/result contract for strategy execution
- shell is UI-complete enough for `alpha2`, but not engine-complete

### `TradingTicketPanel`

Good now:

- structured ticket fields
- review-oriented shell
- summary card

Still demo-leaning:

- only the callback seam is provided; the host still owns request/result policy
- shell remains review-oriented until the host wires a real submission runtime

### `AccountSyncStatusCard`

Good now:

- provider status
- target rows
- summary shell

Still demo-leaning:

- refresh is still a narrow host callback
- no richer sync event/state machine contract beyond the readonly surface model

## Not Yet A Stable Host Boundary

These areas should not yet be treated as stable `alpha2` integration seams.

### `MarketWorkbenchPanel`

Reason:

- it is still the demo shell, even though parts of its inner composition have
  been extracted
- it owns too much shell policy, responsive behavior, and demo wiring to be the
  recommended public host component

### Demo Runtime Assembly

- `chartx-demo.ts`

Reason:

- this remains fixture and demo orchestration
- hosts should not depend on its model creation or callback semantics

### Script Runtime / Workbench Script Execution

Reason:

- the script UI and metadata surfaces are intentionally ahead of the eventual
  Rust-backed runtime
- hosts can reuse the current script-facing UI ideas, but should not treat the
  current execution path as the long-term engine boundary

## Remaining Formalization Gaps

The biggest remaining host-boundary gaps are:

- a stronger typed callback/result seam for host shell actions
- a more explicit submission/request contract for trading and strategy shells
- a package-level import/distribution story beyond repo-local barrel exports
- a decision on whether some smaller shell components should move out of
  `demo/components` lineage into a dedicated public-ui directory

None of these block `alpha2` from starting integration. They do block us from
calling the host UI boundary fully mature.

## Recommendation For `alpha2`

`alpha2` should start from:

- public contracts in [packages/chartx2/src/lib/public](/Users/dev/workspace2/hc_apps/chartx2/packages/chartx2/src/lib/public)
- public host shell components from the same barrel
- `Alpha2HostIntegrationExample.svelte` as the minimal compiled reference
- [alpha2-host-integration.md](/Users/dev/workspace2/hc_apps/chartx2/docs/alpha2-host-integration.md)
  as the human-readable integration rulebook

`alpha2` should avoid:

- importing `MarketWorkbenchPanel`
- reusing `chartx-demo.ts`
- depending on `internal/` or `demo/components/` paths directly

## Bottom Line

Today the host-facing boundary is good enough to begin real `alpha2`
integration.

It is strongest for:

- sharing UI
- strategy tester UI
- trading ticket UI
- sync status UI
- summary dock composition

It is weaker for:

- formal host action protocols
- backend result lifecycles
- long-term script execution ownership

That means the correct next move is not more shell invention inside `chartx2`.
The correct next move is host-side adoption plus selective seam hardening where
`alpha2` finds real friction.
