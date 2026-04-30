# 0340 add script text editor mode v0

## Why

The custom script library already had an AST builder and a one-shot import
field, but it still lacked a real text editing surface. That left the script
system short of the richer authoring mode called for by the main alignment
plan.

## What changed

- added a `Builder / Text` mode switch to the custom script authoring form
- upgraded the old import field into a real multiline text editor mode that can
  apply supported expressions back into the same AST-backed script definition
- kept the existing builder expression sync/reset flow so text edits still
  round-trip through the canonical subset parser
- added focused Playwright coverage for saving a custom script from text mode
- updated the alignment plan to mark the richer text editor item complete

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library: text editor mode can apply a supported expression and save it" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- this slice still only supports the existing local subset parser
- Pine-compatible metadata and compatibility surfaces are still deferred
