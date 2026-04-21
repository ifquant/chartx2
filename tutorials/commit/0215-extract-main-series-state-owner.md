# 0215 - Extract Main Series State Owner

This slice moves main-series state read/apply composition out of `chart-harness`.

Before this change, the public `getMainSeriesState` and `applyMainSeriesState` methods still assembled snapshot projection and restore dependencies in the harness. The lower-level `chart-main-series-state.ts` use-cases already owned the actual snapshot logic, but the harness still wired current source lookup, attach/switch, option creation, rebuild, context sync, range reset, and render finalization.

## What Changed

- Added `createChartMainSeriesStateOwner`.
- Routed `getMainSeriesState` through the owner.
- Routed `applyMainSeriesState` through the owner.
- Added owner tests for active-source snapshot projection and restore callback sequencing.

## Why This Shape

Main-series state is part of the source/series runtime policy, not public API shell behavior. The new owner keeps the existing state use-cases intact while moving their runtime dependency composition behind one focused surface.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-main-series-state-owner chart-main-series-state chart-state-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

