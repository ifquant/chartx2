# Script Library Expression Import V0

Date: 2026-04-25

## Goal

Add a small text-import bridge that can load a supported expression string into
the Script Library AST builder without turning the builder into a full text
editor.

## Scope

- add a local `Import expression` field in the Script Library form
- parse imported text through the existing workbench script parser
- on success, sync the parsed expression into the builder and canonical preview
- on failure, show an inline import error and keep the current builder state
- add focused visual coverage for successful import and failed import no-op

## Not In Scope

- broader text-editor authoring
- engine-native scripted studies
- layout/import/export behavior changes

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "imports expression text into the builder" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
