# 0222 - Extract State Snapshot Input Owner

This slice moves the chart-state snapshot input side out of `chart-harness`.

Before this change, `stateCoordinator` received inline harness closures for options, time scale, price scale, trade-location snapshot data, drawing list, drawing magnet resolution, and drawing restore validation.

## What Changed

- Added `chart-state-snapshot-input-owner` for state readout and drawing validation inputs.
- Rewired `chart-harness` so `stateCoordinator` consumes the state input owner for snapshot-facing dependencies.
- Added focused tests for option/scale/trade/drawing readout and drawing pane validation.
- Updated architecture notes with the new state input boundary.

## Why This Shape

This is the low-risk half of state ownership: it changes where snapshot inputs are assembled, but does not change restore ordering or content application. That keeps the state restore path stable while continuing to shrink the harness dependency object.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-state-snapshot-input-owner chart-state-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
