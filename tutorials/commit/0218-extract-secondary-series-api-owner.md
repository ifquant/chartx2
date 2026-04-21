# 0218 - Extract Secondary Series API Owner

This slice moves the remaining secondary-series API callback bundle out of `chart-harness`.

Before this change, `sourceOwner` was already responsible for secondary/study attach and lookup, but the harness still assembled the high-fanout API glue for secondary data updates, marker mutation, price lines, compare options, and moving-average study options.

## What Changed

- Added `chart-secondary-series-api-owner` as the internal owner for secondary-series API callbacks.
- Replaced the inline `secondarySeriesApi` object in `chart-harness` with a narrow owner construction call.
- Added focused unit coverage for secondary data mutation, marker normalization, price-line creation, compare options, and moving-average study options.
- Updated the architecture notes to record secondary-series API ownership as part of the harness shrink path.

## Why This Shape

Secondary API commands are runtime policy, not harness policy. Keeping this block behind one owner means `sourceOwner` can continue to own secondary/study attach while `chart-harness` only supplies runtime dependencies such as source lookup, viewport reset, render invalidation, and price-line creation.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-secondary-series-api-owner chart-source-owner chart-series-command-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
