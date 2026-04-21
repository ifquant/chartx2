# 0226 - Extract Demo Mount Helper

This slice moves the built-in demo mounting logic out of `chart-harness`.

Before this change, the harness file still imported demo data builders and assembled the demo candlestick/volume setup at the bottom of the runtime adapter file.

## What Changed

- Added `chart-demo-mount` for demo fixture setup.
- Rewired `mountPhaseOneChartHarness` to delegate to the helper.
- Removed demo data builder imports from `chart-harness`.
- Added focused tests for demo pane/series setup and cleanup.
- Updated architecture notes with the demo mount boundary.

## Why This Shape

Demo mounting is not runtime policy. Keeping it outside the harness keeps `chart-harness` closer to a composition root and public API handoff layer.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-demo-mount chart-public-api`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
