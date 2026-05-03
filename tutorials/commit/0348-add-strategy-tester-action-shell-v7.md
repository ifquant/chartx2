# 0348 add strategy tester action shell v7

## Why

The strategy tester shell could already switch runs and hold local parameter
drafts, but it still had no action surface. That left an obvious gap for
`alpha2`, which will need rerun/compare/save affordances long before `chartx2`
owns any real strategy execution runtime.

## What changed

- extended the public strategy tester contract with host-supplied run actions
- added a local action shell to the reusable tester panel with rerun, compare,
  and save-variant buttons
- made the action shell draft-aware: actions can show inline guidance when the
  current parameter shell has not diverged yet, without pretending to execute a
  real rerun
- added focused Playwright coverage for draft-aware action feedback
- updated the alignment plan to record the thicker tester shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester action shell gates run actions behind the local parameter draft|strategy tester parameter shell tracks local draft state per run" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not add real rerun execution, compare queue plumbing, or save persistence
- action feedback is still local panel state and does not reach a backend or Rust core
