# 0334 add mobile footer controls drag dismiss v0

## Why

After the footer controls moved into their own mobile sheet, they still felt
different from the sidebar and bottom-panel overlays because they could only be
closed with the explicit close button or backdrop. The other mobile overlays
already supported handle-based downward dismissal.

## What changed

- extended the shared mobile drag state to include the footer controls sheet
- added a footer-controls drag handle and live drag offset rendering
- reused the existing downward dismiss threshold so footer controls now close on
  a long enough downward handle drag
- added focused Playwright coverage for footer-controls drag-dismiss and
  below-threshold no-op behavior
- updated the alignment plan to mark footer-controls drag-dismiss parity

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile footer controls can be drag-dismissed from the handle|workbench mobile footer controls ignore short drag gestures below the dismiss threshold|workbench mobile footer controls open as a dedicated sheet" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- footer controls still do not have snap sizes or a separate expanded/full state
- this slice does not change the existing footer controls content model
