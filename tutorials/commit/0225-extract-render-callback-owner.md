# 0225 - Extract Render Callback Owner

This slice moves the render coordinator callback side out of `chart-harness`.

Before this change, `renderCoordinator` still received inline harness closures for renderer runtime access, grid drawing, pane legend/crosshair drawing, readout event publication, crosshair-move publication, background color, and bar-spacing resolution.

## What Changed

- Added `chart-render-callback-owner` for render callback dependencies.
- Rewired `chart-harness` so `renderCoordinator` consumes both `renderInputOwner` and `renderCallbackOwner`.
- Removed direct pane chrome and render-tail imports from `chart-harness`.
- Added focused tests for render callback forwarding.
- Updated architecture notes with the new render callback boundary.

## Why This Shape

Render inputs and render callbacks are different dependency classes. Splitting them keeps the coordinator's frame pass unchanged while leaving `chart-harness` closer to a composition root.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-render-callback-owner chart-render-input-owner chart-render-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
