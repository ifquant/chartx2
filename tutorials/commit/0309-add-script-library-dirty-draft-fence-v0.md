# 0309 add script library dirty draft fence v0

## Why

The Script Library already fenced active-use edits and one-click deletion, but
it could still silently throw away unsaved editor changes when the user clicked
`Edit` on a different saved script. That left the local management shell unsafe
for normal compare-and-tweak workflows.

## What changed

- added a local Script Library draft baseline plus pending replacement target in
  the workbench panel so dirty edit-target switches can be detected without
  widening any runtime contracts
- routed saved-script `Edit` through a discard/cancel fence that keeps the
  current draft intact on cancel and only loads the requested saved script after
  explicit discard
- cleared pending replacement state through reset, save, and delete-confirm
  paths so the panel does not keep stale row intents around
- added focused Playwright coverage for the dirty-switch fence, including both
  cancel and discard outcomes
- updated the TradingView alignment notes and recorded this execution slice in a
  dedicated plan note

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "switching edit targets fences unsaved draft changes" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no autosave or multi-draft Script Library workflow
- no browser navigation/unload confirmation prompts
- no changes to scripted-indicator persistence contracts beyond the local panel
  fence
