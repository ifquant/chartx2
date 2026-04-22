# 0242 Extract Chart Entry Shell Owner

## Why This Commit Exists

`chart-harness` had already become much thinner internally, but the file still ended with one last entry-point glue block:

- create an attached chart from a new harness instance
- mount the demo/workbench starter chart through the attached-chart entry

That logic was small, but it was still another adapter-shell responsibility left at the bottom of the harness file.

## What Changed

- Added `chart-entry-shell-owner.ts` as a focused owner for chart creation and demo mount handoff.
- Rewired `createPhaseOneChart(...)` and `mountPhaseOneChartHarness(...)` to delegate through the entry shell owner.
- Added `chart-entry-shell-owner.test.ts` to cover attached-chart and demo-mount composition through one stable entry surface.
- Updated the architecture note to record chart entry/demo handoff as another responsibility that no longer belongs inline in `chart-harness`.

## Why This Is Safe

This does not change harness internals, the public API contract, or demo data behavior.

The existing `createAttachedChart(...)` and `mountPhaseOneChartDemo(...)` functions still own the actual behavior. This commit only moves the final entry composition behind a small owner so `chart-harness` keeps collapsing toward a composition root plus minimal compatibility exports.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-entry-shell-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-factory.test.ts tests/unit/chart-demo-mount.test.ts`

## Not Included

- Factory and demo algorithms are unchanged.
- Public exports remain the same.
- This does not remove the compatibility exports from `chart-harness`; it only routes them through the entry shell owner.
