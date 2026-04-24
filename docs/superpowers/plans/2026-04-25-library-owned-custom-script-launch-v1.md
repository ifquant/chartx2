# Library-Owned Custom Script Launch V1

## Goal

Tighten script-library ownership by letting builtin scripted indicators be
saved into the local library and by launching saved custom scripts directly
from the Script Library instead of routing them through the generic indicator
catalog.

## Scope

- [x] Add a contract helper for deriving structured custom-script drafts from
  supported scripted definitions.
- [x] Let builtin scripted catalog entries save themselves into the local
  custom-script library as presets.
- [x] Let saved custom scripts launch directly from the Script Library with a
  local length override.
- [x] Add a duplicate flow for saved custom scripts.
- [x] Restore/import custom scripted indicators by `scriptId` so they no longer
  depend on synthetic indicator-catalog entries.

## Boundaries

- [x] Keep builtin scripted entries in the generic indicator catalog.
- [x] Keep saved custom scripts workbench-owned and launched from the Script
  Library UI.
- [x] Keep the authoring model structured and AST-backed; no text editor,
  parser, or Pine work in this slice.

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library: custom authored scripts round-trip through layout export and import|script library: save builtin presets and duplicate custom scripts|layout import/export|adds indicators" --reporter=line`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [x] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- [ ] Freeform script text editing
- [ ] Richer library search, folders, tagging, or sharing
- [ ] Engine-native scripted studies or Pine-compatible evaluation
