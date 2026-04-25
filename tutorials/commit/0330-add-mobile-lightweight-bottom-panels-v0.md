# 0330 add mobile lightweight bottom panels v0

## Why

The mobile bottom-sheet seam already covered trading, strategy, and replay, but
the lighter bottom workflows still felt inconsistent. `Logs` only existed in
the sidebar, and `Time presets` still depended on the always-inline footer
strip.

## What changed

- added a reusable `ActivityLogPanel.svelte` for the activity/event log surface
- added a reusable `TimePresetsPanel.svelte` for the range preset surface
- extended the mobile bottom-sheet availability gate so `logs` and
  `time-presets` can open through the existing trigger
- mounted dedicated mobile sheet branches for `logs` and `time-presets`
- added focused Playwright coverage for opening both lightweight panels on a
  narrow viewport
- updated the alignment plan to mark lightweight bottom-panel mobile parity

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "workbench mobile logs panel opens as a bottom sheet instead of relying on the sidebar|workbench mobile time presets open as a bottom sheet|workbench mobile replay panel opens as a bottom sheet and drives replay controls|workbench mobile bottom sheet auto-closes when bottom-tab navigation changes" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- range preset buttons still reflect the current read-only demo model
- logs and time presets still use the existing sheet snap and dismiss behavior
