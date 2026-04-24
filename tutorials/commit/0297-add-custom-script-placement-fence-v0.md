# 0297 add custom script placement fence v0

## Why

The workbench script editor exposed `overlay` as a placement option, but custom
script execution still rendered through a separate pane and relied on stripping
those script-only panes back out of persisted chart state. Leaving overlay
selectable was a correctness trap: it implied behavior the runtime could not
deliver safely.

## What Changed

- Added a validation fence that rejects `overlay` for custom authored scripts.
- Marked the Script Library overlay option as disabled and added inline copy
  that explains custom scripted indicators currently save as separate-pane
  studies only.
- Added focused unit and browser coverage so the placement fence is explicit in
  both the shared contract and the visible workbench UI.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/workbench-scripts.test.ts tests/unit/workbench-indicators.test.ts tests/unit/workbench-layout.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "script library" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- This does not implement real scripted overlay rendering.
- Custom scripts still remain workbench-owned rather than engine-native chart
  state.
- The editor is still a textarea-driven authoring surface rather than a
  structured AST builder.
