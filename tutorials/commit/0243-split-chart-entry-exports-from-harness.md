# 0243 Split Chart Entry Exports From Harness

## Why This Commit Exists

After the entry-shell extraction, `chart-harness.ts` still owned the exported chart entry functions:

- `createPhaseOneChart(...)`
- `mountPhaseOneChartHarness(...)`

That meant the harness file was still acting as both:

- the composition-root implementation file
- the external entry/export file

This kept one unnecessary responsibility attached to the harness module even though the actual entry composition had already been pushed into a dedicated owner.

## What Changed

- Added `chart-entry.ts` as the dedicated module for chart creation and demo mount exports.
- Moved `createPhaseOneChart(...)` and `mountPhaseOneChartHarness(...)` out of `chart-harness.ts` and into `chart-entry.ts`.
- Kept compatibility type/template re-exports on `chart-harness.ts` for direct legacy imports that still expect them.
- Updated `internal/views/index.ts` so entry exports come from `chart-entry.ts`, while the harness module only exports `PhaseOneChartHarness` instead of acting as another broad barrel.
- Updated the architecture note to record the entry-export split.

## Why This Is Safe

This does not change chart construction behavior, demo mount behavior, or public API shape.

The same `chart-entry-shell-owner`, `createAttachedChart(...)`, and `mountPhaseOneChartDemo(...)` path still runs. This commit only moves the export location so `chart-harness.ts` stays focused on the composition root instead of also serving as the chart entry module.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-api-types.test.ts tests/unit/chart-entry-shell-owner.test.ts`

## Not Included

- Legacy direct imports of entry functions from `chart-harness.ts` are not preserved.
- Runtime behavior is unchanged; this is an export-boundary cleanup only.
