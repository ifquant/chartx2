# 0302 add script library import reset v0

## Why

After the expression-import bridge landed, the import field could intentionally
drift away from the current AST builder state. That was useful for trying a new
expression, but there was no quick way to pull the field back to the builder's
canonical expression text.

## What changed

- added a `Use builder expression` action beside the import apply action
- resync now copies the current builder expression into the import field
- resync clears stale import errors and disables itself when already in sync
- added focused visual coverage for the import-field resync flow

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "import field can resync to the current builder expression" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- no automatic two-way live sync between import text and builder edits
- no richer text-editor authoring surface
