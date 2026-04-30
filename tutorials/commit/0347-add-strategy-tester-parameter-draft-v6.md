# 0347 add strategy tester parameter draft v6

## Why

The strategy tester shell could already switch between readonly run snapshots,
but it still had no editable parameter-set surface. That left an obvious hole
for `alpha2`, which will want to host draft parameter editing long before
`chartx2` owns any real rerun callback or strategy execution path.

## What changed

- extended the public strategy tester contract with host-supplied parameter
  fields per run
- added a local parameter draft shell to the reusable strategy tester panel,
  including dirty-state tracking and reset behavior
- kept the boundary UI-only: editing parameters still does not rerun the
  strategy or call a host callback
- added focused Playwright coverage for local dirty/reset behavior and run-aware
  parameter defaults
- updated the alignment plan to record the thicker tester shell

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "strategy tester parameter shell tracks local draft state per run|strategy tester run options switch the visible run shell locally" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not add a rerun callback, optimization-surface linkage, or parameter validation beyond the browser control type
- parameter drafts are still local panel state and do not persist through layout or workspace saves
