# Active Script Use Remove V0

Date: 2026-04-25

## Goal

Add a workbench-owned remove action for active scripted indicators so saved
custom-script library rows can clear their `inUse` fences without deleting the
saved script definition.

## Scope

- expose a remove affordance for active scripted indicators in the active
  indicator list
- remove only the mounted scripted indicator instance and its workbench-created
  scripted pane
- refresh the Script Library row state so edit/delete unlock when no active
  use remains
- keep the behavior local to the demo workbench shell
- add focused visual coverage for clearing an in-use custom-script fence from
  the active indicator list

## Not In Scope

- deleting saved custom-script definitions
- chart-state-native scripted studies
- persisted undo or restore for removed active indicators
- broad active-indicator management for non-script indicators

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "active script use remove clears library in-use fence" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
