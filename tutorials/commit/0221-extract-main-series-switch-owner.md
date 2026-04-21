# 0221 - Extract Main Series Switch Owner

This slice moves main-series switch dependency assembly out of `chart-harness`.

Before this change, `sourceOwner` still received an inline `mainSeriesSwitch` object that removed the old main source, cloned preserved runtime state, attached the new main series, rendered, and published chart-type changes.

## What Changed

- Added `chart-main-series-switch-owner` for main-series switch callback composition.
- Moved preserved-state cloning, including visual and price-line cloning, into the new owner.
- Rewired `chart-harness` so `sourceOwner` consumes `mainSeriesSwitchOwner.mainSeriesSwitch`.
- Added focused tests for preserved-state cloning and switch callback routing.
- Updated architecture notes with the main-series switch ownership boundary.

## Why This Shape

Chart-type switching is source lifecycle policy. Keeping the preserved-state clone and callback group together keeps `sourceOwner` focused on orchestration while `chart-harness` only supplies model mutation, attach, render, and event endpoints.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-main-series-switch-owner chart-source-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
