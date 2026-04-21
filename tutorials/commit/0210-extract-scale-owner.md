# 0210 - Extract Scale Owner

This slice moves time-scale and price-scale public API construction out of `chart-harness`.

Before this change, `timeScaleApi()` and `priceScaleApi()` rebuilt dependency bags directly inside the harness. Those bags mixed several policies: visible logical range math, bar-spacing clamping, layout measurement, formatter routing, primary price-range override storage, secondary-scale fallback, and applying an override to the primary pane height.

The new `chart-scale-owner.ts` owns that composition while keeping the lower-level `chart-scale-commands.ts` use-cases unchanged.

## What Changed

- Added `createChartScaleOwner`.
- Routed `timeScaleApi()` and `priceScaleApi()` through the owner.
- Moved scale layout measurement, spacing resolution, formatter routing, visible-range fallback, and primary override application into the owner.
- Added focused owner tests covering time-scale state mutation and price-scale visible-range routing.

## Why This Shape

Scale state still belongs to the chart runtime, but the harness should not assemble public API callbacks every time the API is requested. This owner keeps `TimeScale`, `PriceScale`, and view-state ownership unchanged while removing another public API dependency bundle from the harness shell.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-scale-owner chart-scale-commands`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

