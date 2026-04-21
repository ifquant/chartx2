# 0213 - Extract Series Command Owner

This slice moves public series add/remove command routing out of `chart-harness`.

Before this change, the harness still owned the largest public command block: targeted primary/secondary series adds, volume-series secondary defaults, overlay/compare/moving-average study adds, and remove-series cleanup. The lower-level source, primary-series, and pane owners already owned the real runtime behavior, so the harness block was mostly command routing glue.

## What Changed

- Added `createChartSeriesCommandOwner`.
- Routed public series add methods through the new owner.
- Routed public study add methods through the new owner.
- Routed `removeSeries` cleanup through the new owner.
- Kept chart-state restore study rebuilds unchanged for this slice.
- Added focused owner tests for primary/secondary routing, volume/study target defaults, moving-average indicator options, and remove cleanup.

## Why This Shape

The command owner is intentionally a composition layer. It does not own source lifecycle or pane lookup itself. Instead, it coordinates `paneOwner`, `primarySeriesOwner`, and `sourceOwner` so public API methods stop reassembling the same target resolution and add/remove command dependencies inside `chart-harness`.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-series-command-owner chart-add-commands chart-structure-commands`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

