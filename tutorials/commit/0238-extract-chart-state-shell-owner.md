# 0238 Extract Chart State Shell Owner

## Why This Commit Exists

Even after the earlier owner extractions, `chart-harness` still had one dense composition block for chart state:

- snapshot input collection
- restore command wiring
- state coordinator assembly

That code was no longer implementing state logic itself, but it was still reassembling a large internal dependency graph inline. That kept the harness too close to the restore/template orchestration path.

## What Changed

- Added `chart-state-shell-owner.ts` as a focused composition owner for chart state shell wiring.
- Moved `createChartStateSnapshotInputOwner(...)`, `createChartStateRestoreCommandOwner(...)`, and `createChartStateCoordinator(...)` assembly behind that new owner.
- Rewired `chart-harness.ts` to request the state coordinator from the shell owner instead of assembling the full state block inline.
- Added `chart-state-shell-owner.test.ts` as a focused composition-level regression test.
- Updated the architecture note to record state shell composition as its own adapter-shell responsibility.

## Why This Is Safe

This does not change chart-state algorithms, restore order, snapshot schema, or public API behavior.

The existing state modules still own all business logic. This commit only moves their composition out of `chart-harness`, which makes the harness closer to a composition root plus adapter shell.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-state-shell-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

## Not Included

- State snapshot algorithms are unchanged.
- Restore/public shell composition is not fully collapsed yet; this only removes the state assembly block from the harness body.
- No public API contract is renamed or expanded.
