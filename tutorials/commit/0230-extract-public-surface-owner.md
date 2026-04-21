# 0230 Extract Public Surface Owner

## Why This Commit Exists

After internal state and restore wiring stopped calling public harness methods, the remaining public passthrough methods on `PhaseOneChartHarness` were no longer runtime dependencies. They only existed so `createChartPublicApi` could wrap a harness-shaped facade.

This slice moves that facade into a dedicated public surface owner. `chart-harness` now exposes one public API handoff method instead of implementing every public command as a class method.

## What Changed

- Exported the internal `ChartHarnessPublicLike` surface type from `chart-public-api`.
- Added `chart-public-surface-owner.ts` to assemble the harness public facade from stable owners.
- Updated `chart-factory` to request `publicApiSurface()` from the harness before building the external `PhaseOneChartApi`.
- Removed the large public passthrough method block from `PhaseOneChartHarness`.
- Kept `attach` on the harness as the lifecycle entrypoint used by the factory.
- Added focused unit coverage for public surface command routing.
- Updated the factory unit test to validate the new attach plus public-surface handoff shape.

## Why This Is Safe

The external `PhaseOneChartApi` contract still comes from `createChartPublicApi`. The new owner only supplies the same facade methods that the harness previously implemented directly.

The previous commit already routed internal state and restore dependencies away from public methods, so removing those methods from the class does not change internal runtime paths.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-public-surface-owner chart-public-api chart-factory chart-state chart-interaction-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- `PhaseOneChartApi` type definitions still live in `chart-harness`.
- `createChartPublicApi` still owns the final external API wrapper.
- Canvas attach/detach lifecycle ownership is unchanged.
