# 0343 add strategy tester filters v2

## Why

The strategy tester shell could now switch tabs and cross-highlight trades, but
it still had no way to exercise the filter-shaped part of a TradingView-like
tester surface. That left the host contract too thin for an `alpha2` UI that
wants to narrow visible trades without attaching a real backtest engine.

## What changed

- extended the public strategy tester contract with host-supplied filter
  descriptors that carry labels, badges, and trade membership
- mounted those filters in the reusable panel as local shell controls instead
  of introducing new callbacks or query plumbing
- applied the active filter to the visible trade rows and equity points while
  keeping the underlying fixture data static
- added focused Playwright coverage for switching between winner and loser
  filters inside the panel
- updated the alignment plan to mark the thicker filter shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester filters narrow the visible trades and equity shell locally" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not add server-side or engine-owned strategy queries
- filter selection is still local panel state and does not persist across host layout saves
