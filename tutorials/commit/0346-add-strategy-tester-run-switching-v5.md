# 0346 add strategy tester run switching v5

## Why

The strategy tester shell could already show readonly run metadata, but it was
still locked to one fixture run. That left the host-facing tester contract too
thin for `alpha2`, which will eventually need to switch between run snapshots
even before `chartx2` owns any real backtest engine or run-loading callback.

## What changed

- extended the public strategy tester contract with host-supplied run options
  that each carry a readonly shell snapshot
- updated the reusable strategy tester panel to switch between those run
  snapshots locally, including run label, parameter chips, filters, trades,
  trade detail, and equity view
- kept the boundary UI-only: switching runs still does not call an engine,
  reload data, or emit a new host callback
- added focused Playwright coverage for local run switching
- updated the alignment plan to record the thicker tester shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester run options switch the visible run shell locally|strategy tester selected trade detail can drive the existing locate-trade shell" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not add engine-backed run loading or optimization-surface integration
- run switching is still local panel state and does not yet persist through layout saves
