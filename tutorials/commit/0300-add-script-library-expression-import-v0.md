# 0300 add script library expression import v0

## Why

The AST builder is safer than freeform text authoring, but it was missing a
practical bridge from an existing expression string into the structured editor.
That made simple copy/paste authoring awkward even though the parser already
understood the supported subset.

## What changed

- added an `Import expression` input plus `Apply expression` action to the
  Script Library form
- reused the existing workbench parser so imported text only accepts the
  supported subset
- successful imports now replace the builder expression and canonical preview
- failed imports now show an inline error without clobbering the current builder
  state
- added a focused Playwright case that covers both successful import and
  failed-import no-op behavior

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "imports expression text into the builder" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- richer text-editor authoring beyond one-shot import
- chart-state-native scripted study persistence
