# 0335 add mobile footer controls snap sizes v0

## Why

After footer controls gained handle-based dismiss, they still felt shallower
than the other mobile overlays because they had no size states and no upward
drag-to-snap path. Sidebar and bottom panels already supported that richer
sheet behavior.

## What changed

- added `default / expanded / full` local size state for the footer controls
  sheet
- added a footer-controls size toggle that cycles through those size states
- extended the shared mobile drag handler so upward drags promote the footer
  controls sheet through its size states and live offset rendering
- added focused Playwright coverage for footer-controls size cycling and
  upward drag-to-snap/live follow
- updated the alignment plan to mark footer-controls snap-size parity

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile footer controls support size toggle cycling|workbench mobile footer controls support upward drag-to-snap and live drag follow|workbench mobile footer controls can be drag-dismissed from the handle|workbench mobile footer controls ignore short drag gestures below the dismiss threshold" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- footer controls still do not have a separate velocity-aware settle model
- this slice does not change which controls appear inside the footer controls sheet
