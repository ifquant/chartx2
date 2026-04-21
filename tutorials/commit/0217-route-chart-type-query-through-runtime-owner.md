# 0217 - Route Chart Type Query Through Runtime Owner

This slice routes the public chart-type read through `chart-runtime-query-owner`.

Before this change, `getChartType` still read the chart model context directly from `chart-harness`, while nearby runtime reads such as point-count already flowed through `runtimeQueryOwner`.

## What Changed

- Added `getChartType` to `chart-runtime-query-owner`.
- Routed `chart-harness.getChartType` through the runtime query owner.
- Extended runtime query owner tests to cover chart-type reads from the shared context snapshot.

## Why This Shape

Chart type is a context snapshot read, not harness policy. Keeping it with runtime query ownership avoids one more direct public method dependency on `chartModel.context()`.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-runtime-query-owner chart-public-api`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

