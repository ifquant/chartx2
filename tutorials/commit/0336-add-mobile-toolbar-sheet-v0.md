# 0336 add mobile toolbar sheet v0

## Why

After the footer and bottom controls moved into mobile sheets, the desktop
toolbar still stayed inline on narrow screens as one long horizontal scroller.
That kept spending vertical and horizontal density above the chart even though
the rest of the mobile shell had already shifted toward overlay-based controls.

## What changed

- added a narrow-width toolbar summary with symbol and timeframe context plus a
  dedicated `Tools` trigger
- added a mobile toolbar sheet that carries the existing chart-type, replay,
  command, layout, transfer, and share actions without widening the runtime
  contract
- wired the toolbar sheet to yield to the sidebar sheet and to close after
  action taps that open another shell surface
- added focused Playwright coverage for mobile toolbar open, action-close, and
  overlay-yield behavior
- updated the alignment plan to mark mobile toolbar compaction progress

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile toolbar opens as a dedicated sheet|workbench mobile toolbar closes after opening commands|workbench mobile toolbar yields to the sidebar sheet" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice does not yet compact the workspace tab strip on narrow screens
- the toolbar sheet does not yet implement drag, snap sizes, or motion parity
