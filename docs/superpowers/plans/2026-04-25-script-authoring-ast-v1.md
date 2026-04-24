# Script Authoring AST V1

## Goal

Widen saved custom-script authoring from a single `sma(field, length)` shape to
the recursive V0 AST subset that the local runtime already supports, while
keeping scripts workbench-owned and preserving the existing layout contract.

## Scope

- [x] Expand custom-script `Expression` parsing from one SMA shape to the
  recursive subset `field | sma(expr, length) | subtract(left, right)`.
- [x] Serialize supported custom-script definitions back into expression text so
  saved library entries, cloning, edit, and restore round-trip the broader AST.
- [x] Keep one shared numeric input, `length`, for custom authored scripts.
- [x] Update Script Library preview and the end-to-end visual scenario to cover
  a broader composed expression.
- [x] Add unit coverage for parse/format/validate/round-trip of the broader
  AST subset.

## Boundaries

- [x] Keep scripts workbench-owned and persisted through the existing custom
  script + scripted indicator layout schema.
- [x] Keep authoring in function-call syntax only; no infix operators, Pine
  parsing, or engine-native scripted studies.
- [x] Keep the numeric-input model limited to the existing shared `length`
  input.

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library: custom authored scripts round-trip through layout export and import|script library: save builtin presets and duplicate custom scripts" --reporter=line`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [x] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- [ ] Additional operators beyond `subtract`
- [ ] Multiple numeric inputs or free numeric literals in authoring
- [ ] Engine-native scripted studies
- [ ] Pine-compatible authoring or execution
