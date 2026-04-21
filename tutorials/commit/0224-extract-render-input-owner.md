# 0224 - Extract Render Input Owner

This slice moves the render coordinator input/read side out of `chart-harness`.

Before this change, `renderCoordinator` received inline harness closures for layout, options, view state, source lists, drawing lists, pane/scale access, formatters, and active trade-location state.

## What Changed

- Added `chart-render-input-owner` for render input accessors.
- Rewired `chart-harness` so `renderCoordinator` consumes `renderInputOwner` plus the remaining render callback surface.
- Added focused tests for render input forwarding.
- Updated architecture notes with the new render input boundary.

## Why This Shape

This does not change the render pass. It only separates read access from the drawing/render callback functions, which keeps the frame coordinator stable while reducing the harness dependency bundle.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-render-input-owner chart-render-coordinator`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
