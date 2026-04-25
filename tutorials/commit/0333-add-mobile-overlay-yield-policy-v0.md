# 0333 add mobile overlay yield policy v0

## Why

By this point the mobile shell had three separate overlay surfaces: sidebar,
bottom panel, and footer controls. They already tended to close each other via
reactive state, but the trigger behavior was still implicit and vulnerable to
ordering noise or transient overlap.

## What changed

- added explicit toggle helpers for the mobile sidebar, bottom panel, and
  footer controls triggers
- each trigger now closes the competing overlay surfaces before opening its own
- added focused Playwright coverage for footer-to-sidebar, footer-to-bottom,
  and bottom-to-footer yield behavior
- updated the alignment plan to mark explicit mobile overlay yield policy

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile footer controls yield to the sidebar sheet|workbench mobile footer controls yield to the bottom panel trigger|workbench mobile footer controls replace an open bottom panel|workbench mobile footer controls open as a dedicated sheet" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this still does not add drag-sizing or velocity behavior for the footer controls sheet
- overlay layering is still local shell policy and not a new reusable host contract
