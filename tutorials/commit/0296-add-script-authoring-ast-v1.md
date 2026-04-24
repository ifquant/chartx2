# 0296 add script authoring ast v1

## Why

`Script Expression Editor V0` introduced a text-based authoring surface, but it
still only accepted one special case, `sma(<field>, length)`. The next adjacent
slice was to stop artificially constraining custom-script authoring below what
the runtime and layout model already supported.

## What Changed

- Expanded the saved custom-script authoring grammar to the recursive subset
  `field | sma(expr, length) | subtract(left, right)`.
- Generalized expression parsing and formatting in `workbench-scripts.ts` so
  custom scripts can now be compiled from and serialized back to broader AST
  compositions.
- Kept the existing workbench-owned contract intact by still using one shared
  numeric input, `length`, and by persisting the same `WorkbenchScriptDefinition`
  and `WorkbenchLayoutState` shapes.
- Updated the Script Library preview and the main end-to-end custom-script
  round-trip scenario to use a broader expression,
  `subtract(close, sma(close, length))`.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library: custom authored scripts round-trip through layout export and import|script library: save builtin presets and duplicate custom scripts" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Authoring still uses constrained function-call syntax rather than infix math.
- Custom scripts still only expose the shared `length` input when they need a
  numeric parameter.
- Scripts remain workbench-owned metadata and are not promoted into engine
  chart state.
