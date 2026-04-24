# 0299 add script library invalid length fence v0

## Why

The Script Library already validated custom-script lengths when save or add
calls reached the runtime boundary, but the workbench UI did not reliably
surface invalid length state early enough. That left a gap between what the
user typed and what the panel visibly allowed.

## What changed

- added a tiny shared `ScriptLengthInput` component for the Script Library
  length fields
- moved default-length preview/error and saved-script launch error/payload
  handling onto explicit reactive derived state in the workbench panel
- disabled save/add actions when the current length input is invalid
- added a focused Playwright scenario that covers invalid default and launch
  lengths before the action handlers run

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "invalid length inputs are blocked before save or add" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- broader script-library import/export and round-trip visual coverage changes
- engine-native scripted-study persistence
