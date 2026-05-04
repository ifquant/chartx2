# 0359 extract workbench host summary strip

## Why

The public workbench registry now says which host summary shells belong in the
footer, but `MarketWorkbenchPanel` still owned the strip markup itself. That
left downstream hosts with one more branchy footer fragment to copy.

## What changed

- added a reusable `WorkbenchHostSummaryStrip` component over the public
  host-summary registry
- moved the footer summary-card branching out of `MarketWorkbenchPanel` and into
  the new strip component
- kept the existing specialized summary cards, actions, and test selectors
  unchanged

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester projects into a reusable summary shell outside the panel body|trading ticket projects into a reusable summary shell outside the panel body|account sync projects into a reusable summary shell outside the sidebar card" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no new public host-summary action contract beyond the existing per-surface
  callbacks
- no generic renderer for share summary cards or non-footer host surfaces
