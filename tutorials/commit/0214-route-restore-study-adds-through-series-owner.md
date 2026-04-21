# 0214 - Route Restore Study Adds Through Series Owner

This slice makes chart-state restore reuse the series command owner for direct-pane study creation.

After extracting `seriesCommandOwner`, normal public overlay/compare/moving-average adds no longer needed secondary API factory imports in `chart-harness`. Restore callbacks still created those study APIs directly, which kept one duplicate factory path alive in the harness.

## What Changed

- Added direct-pane study add methods to `chart-series-command-owner`.
- Routed chart-state restore overlay, compare, and moving-average study callbacks through those owner methods.
- Removed the remaining secondary study API factory imports from `chart-harness`.
- Extended series command owner tests to cover direct-pane restore-style study creation.

## Why This Shape

Restore already needs pane-id-specific add callbacks, so it cannot call the target-based public API methods directly. The owner now exposes narrow direct-pane methods for that restore path while preserving the same study-kind and moving-average indicator defaults as the public commands.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-series-command-owner chart-state-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

