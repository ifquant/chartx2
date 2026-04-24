# 0288 add workbench empty-state surface v0

## Why

The workstation shell already exposed adapter status, but several sidebar panels could still collapse into silent blank lists. That made missing providers and empty local data look like rendering bugs instead of explicit product state.

## What Changed

- Added `emptyLabel` support to the public watchlist and alerts panel contracts.
- Updated the demo runtime to publish provider-aware empty labels for watchlist, screener, and alerts.
- Removed the fallback demo-alert seeding path when no alerts provider is attached, so the alerts panel now reflects the real degraded state.
- Rendered watchlist and alerts empty states directly in the shell and extended verification to cover the missing-provider alerts path.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- tests/unit/workbench-contract.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "adapter status|workspace tabs|layout import/export|command|screener|workbench replays|layout"`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Full multi-document workspace tabs are still pending.
- Empty-state work stops at deterministic copy and panel rendering; it does not add retries or remote diagnostics.
