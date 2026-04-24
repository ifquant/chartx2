# 0294 add library-owned custom script launch v1

## Why

`User-Authored Script Library V0` made it possible to save local structured
script presets, but custom scripts still piggybacked on the generic Indicators
catalog for launch. The next adjacent slice was to make the Script Library a
real execution surface for saved custom scripts, while also making builtin
scripted entries easier to promote into that library as reusable presets.

## What Changed

- Added a public helper that can derive a structured custom-script draft from a
  supported scripted definition, which lets builtin presets be copied into the
  local library without inventing a separate authoring format.
- Kept builtin scripted indicators in the generic Indicators catalog, but added
  a `Save preset` path there so builtin scripts can seed the user library.
- Moved saved custom script launch to the Script Library rows themselves, with
  a local length override and a duplicate action for quick variant creation.
- Changed restore/import to resolve saved custom scripted indicators by
  `scriptId`, so mounted custom scripts no longer rely on synthetic
  indicator-catalog entries being rebuilt first.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library: custom authored scripts round-trip through layout export and import|script library: save builtin presets and duplicate custom scripts|layout import/export|adds indicators" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Saved custom scripts are still not engine-native chart studies.
- The authoring path is still a structured preset form, not a freeform script
  editor or parser.
- Broader script-library management such as search, tagging, folders, or Pine
  compatibility remains deferred.
