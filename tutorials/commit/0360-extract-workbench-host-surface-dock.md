# 0360 extract workbench host surface dock

## Why

Even after the footer summary strip became reusable, the demo shell still had
to compose the share summary card separately. That left host consumers one more
piece of summary-shell assembly to reconstruct themselves.

## What changed

- added a reusable `WorkbenchHostSurfaceDock` component that mounts the share
  summary card and the workbench host summary strip together
- rewired `MarketWorkbenchPanel` to use the new dock instead of composing share
  summary and runtime summaries inline
- kept the underlying summary cards, selectors, and per-surface callbacks
  unchanged

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "share dialog: published artifacts project into a reusable summary card shell|strategy tester projects into a reusable summary shell outside the panel body|trading ticket projects into a reusable summary shell outside the panel body|account sync projects into a reusable summary shell outside the sidebar card" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no public callback registry for host-surface actions; the dock still takes
  explicit per-surface callbacks
- no attempt to fold dialogs, panels, and summary shells into a single
  host-surface runtime model
