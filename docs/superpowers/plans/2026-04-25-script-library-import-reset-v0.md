# Script Library Import Reset V0

Date: 2026-04-25

## Goal

Keep the Script Library import field from drifting away from the current AST
builder state by adding a quick way to reset it back to the builder's canonical
expression text.

## Scope

- add a small `Use builder expression` action next to `Apply expression`
- reset the import field to the current canonical builder expression
- clear stale import errors when resyncing
- add focused visual coverage for import-field resync behavior

## Not In Scope

- broader freeform text editing
- automatic live overwrite of user-typed import text
- runtime or persistence changes

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "import field can resync to the current builder expression" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
