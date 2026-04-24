# 0295 add script expression editor v0

## Why

The previous script-library slices could save and launch local custom scripts,
but authoring was still locked to a field picker plus default length control.
The next adjacent step was to start the deferred editor line in a safe way:
introduce a constrained text-based expression editor without expanding the
runtime or pretending scripts are engine-native studies.

## What Changed

- Replaced the custom-script `field` picker with a constrained `Expression`
  editor that uses the existing SMA shape, `sma(<field>, length)`, as the only
  accepted authoring format for this slice.
- Added shared helpers in `workbench-scripts.ts` to format, parse, and validate
  those expression drafts so the UI and demo controller enforce the same rules.
- Kept the saved-script runtime and persistence contracts unchanged by compiling
  the editor draft back into the existing `WorkbenchScriptDefinition` shape.
- Changed the Script Library form to clear its draft only after a confirmed
  save succeeds, which avoids dropping typed content on an early no-op.
- Hardened the visual export/import specs by waiting for the hidden exported
  layout textarea to receive a non-empty value before parsing it.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library|adds indicators|object tree reflects indicators" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- The editor still only accepts `sma(<field>, length)` and does not expose the
  full internal AST or arithmetic expressions.
- Saved scripts remain workbench-owned metadata rather than engine-native chart
  studies.
- Library search, tagging, folders, and Pine-compatible authoring remain
  deferred.
