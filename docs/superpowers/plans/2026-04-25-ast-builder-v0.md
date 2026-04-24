# AST Builder V0

## Goal

Replace the textarea-driven custom-script authoring flow with a structured AST
builder for the existing workbench-owned expression subset, while preserving
the current save/run/persistence contracts.

## Scope

- [x] Add a recursive Script Expression Builder component for
  `input | sma(expr, length) | subtract(left, right)`.
- [x] Make the custom-script form edit AST state directly and derive canonical
  `expressionText` from the formatter.
- [x] Keep placement fenced to `separate-pane` and keep `length` as the shared
  numeric input.
- [x] Update script-library Playwright helpers to compose expressions through
  builder controls instead of raw text entry.
- [x] Keep existing demo/controller persistence boundaries unchanged.

## Boundaries

- [x] No engine-native scripted studies
- [x] No freeform text editing as the primary authoring mode
- [x] No additional operators beyond the existing runtime subset
- [x] No multi-input authoring beyond the shared `length`

## Verification

- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library" --reporter=line`
- [x] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- [ ] `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- [ ] `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- [ ] Advanced text import mode for arbitrary pasted formulas
- [ ] In-use edit blockers surfaced pre-emptively in the builder
- [ ] Numeric launch/default inputs upgraded from string drafts to typed local state
