# User-Authored Script Library V0

## Goal

Add the first workbench-owned custom script library so users can create, edit,
delete, execute, and persist saved structured script presets without promoting
scripts into engine-native studies.

## Scope

- [x] Add a saved custom-script definition path on top of the existing
  workbench script AST/runtime contract.
- [x] Rebuild the indicator catalog from builtin scripts plus saved custom
  scripts.
- [x] Render a custom-script authoring/editor surface inside the Indicators
  card.
- [x] Allow adding saved custom scripts to the chart through the same scripted
  indicator flow.
- [x] Persist custom script definitions through workbench layout save/restore
  and import/export before replaying scripted indicators.

## Boundaries

- [x] Keep all authoring workbench-owned; do not promote scripts into
  `chartState`, `getChartState()`, or `applyChartState()`.
- [x] Keep the authoring shape structured and AST-backed; this slice does not
  add a text editor, parser, or Pine compatibility layer.
- [x] Keep script execution limited to the current typed expression model and
  single-output line-study behavior.

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library: custom authored scripts round-trip through layout export and import|layout import/export|adds indicators|object tree reflects indicators and drawings|saves and restores the active layout locally" --reporter=line`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [x] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- [ ] First-class chart-state scripted studies
- [ ] A freeform script text editor or parser
- [ ] Multi-output plots, alerts, strategy actions, or Pine-compatible authoring
- [ ] Remote/shared script-library sync beyond the local workbench layout flow
