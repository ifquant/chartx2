# 0235 Extract API Types

## Why This Commit Exists

`chart-harness` still contained the public `PhaseOne*` API type surface and template helper functions.

Those types are the external chart API contract. They should remain available through the old harness import path for compatibility, but the adapter shell should not own their definitions.

This slice moves the public API type surface into a focused module while keeping `chart-harness` as a compatibility re-export.

## What Changed

- Added `chart-api-types.ts` for public `PhaseOne*` data, option, event, API, state, template, and drawing property schema types.
- Moved `createPhaseOneChartTemplate` and `normalizePhaseOneChartTemplate` into the API-types module.
- Rewired `chart-harness` to import the public types it needs and re-export the API-types module for existing import compatibility.
- Added focused coverage proving template helpers work from the new module and through the harness re-export.
- Updated the architecture note to record the public API type boundary.

## Why This Is Safe

Existing imports from `chart-harness` still work because the harness re-exports the new module. Runtime behavior is unchanged because the moved helper functions still delegate to the same chart-template helpers.

The migration is intentionally compatibility-first; it does not force every internal module to update import paths in the same commit.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-api-types chart-public-api chart-factory`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Existing internal imports from `chart-harness` are not bulk-rewritten yet.
- The harness remains the composition root and lifecycle adapter.
- No public API contract or template schema behavior is intentionally changed.
