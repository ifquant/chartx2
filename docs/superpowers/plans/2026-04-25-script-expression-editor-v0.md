# Script Expression Editor V0

## Goal

Advance the script-library roadmap with a constrained text editor for saved
custom scripts, while keeping the runtime workbench-owned and preserving the
current layout/import/export contracts.

## Scope

- [x] Replace the saved-script authoring field picker with a constrained
  `Expression` editor based on the existing `sma(<field>, length)` shape.
- [x] Move expression validation into shared `workbench-scripts` helpers so the
  UI and demo controller reuse the same rules.
- [x] Keep the existing `defaultLength` input and continue compiling saved
  custom scripts into the same `WorkbenchScriptDefinition` shape.
- [x] Only clear the Script Library draft after a confirmed save succeeds.
- [x] Harden the visual export/import specs against transient empty export
  textarea reads.

## Boundaries

- [x] Keep the runtime limited to the existing V0 expression kinds.
- [x] Keep saved custom scripts workbench-owned and persisted through the
  existing layout schema.
- [x] Keep builtin scripted entries and library-owned launch behavior unchanged.
- [x] Do not introduce freeform arithmetic authoring, Pine parsing, or
  engine-native scripted studies in this slice.

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library|adds indicators|object tree reflects indicators" --reporter=line`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [x] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- [ ] Arbitrary AST editing beyond `sma(<field>, length)`
- [ ] Library search, folders, tags, or sharing
- [ ] Engine-native chart-state scripted studies
- [ ] Pine-compatible parsing or execution
