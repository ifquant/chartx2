# 0328 add mobile replay bottom sheet v0

## Why

The mobile workbench already routed trading and strategy content into the
bottom-sheet seam, but replay still depended on the sidebar card. That left the
replay workflow inconsistent on narrow screens and forced users to keep the
sidebar sheet involved for a bottom-oriented task.

## What changed

- extracted the replay UI into a reusable `ReplayPanel.svelte` component
- reused that replay panel in the sidebar and in a new mobile bottom-sheet
  branch for the `replay` bottom tab
- extended the mobile bottom-panel availability gate so replay can open through
  the existing trigger, size controls, and drag behavior
- added focused Playwright coverage that opens the replay sheet on mobile and
  drives `enter / step / play / pause / exit` through the sheet
- updated the TradingView alignment plan to mark replay bottom-sheet parity

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile trading panel opens as a bottom sheet instead of staying inline|workbench mobile strategy panel opens as a bottom sheet instead of staying inline|workbench mobile replay panel opens as a bottom sheet and drives replay controls|workbench mobile bottom sheet can be drag-dismissed from the handle|workbench mobile bottom sheet supports upward drag-to-snap and live drag follow|workbench mobile bottom sheet auto-closes when bottom-tab navigation changes" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- mobile treatment for `logs` or `time-presets`
- velocity-aware settle or spring motion after replay-sheet drags
