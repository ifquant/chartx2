# Scripted Indicator Inputs V1

## Goal

Make the local scripted-indicator path parameterizable by carrying numeric input
metadata from the scripted catalog through the workbench add flow and
workbench-owned persistence, without promoting scripts into chart-state-native
studies.

## Scope

- [x] Expose numeric input definitions on scripted indicator catalog entries.
- [x] Render scripted numeric inputs in the demo indicator panel and seed them
  from script defaults.
- [x] Pass selected input values through `addIndicatorFromCatalog()` for
  scripted entries.
- [x] Surface `inputValues` in active scripted-indicator summaries.
- [x] Persist scripted `inputValues` through workbench layout save/restore and
  import/export.

## Boundaries

- [x] Keep scripted inputs workbench-owned metadata layered on top of the
  existing scripted-indicator flow.
- [x] Keep chart-state persistence unchanged; scripted indicators still replay
  through workbench layout metadata instead of `getChartState()` or
  `applyChartState()`.

## Verification Targets

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "layout import/export|adds indicators|object tree reflects indicators and drawings|saves and restores the active layout locally" --reporter=line`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [x] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- [ ] First-class chart-state scripted studies
- [ ] Editable user-authored scripts or script-library management
- [ ] Non-numeric scripted input types
- [ ] Pine-compatible parsing, authoring, or strategy execution
