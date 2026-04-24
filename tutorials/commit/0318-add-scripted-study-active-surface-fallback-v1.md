# 0318 add scripted study active surface fallback v1

## Why

The scripted-study promotion line still has a mixed ownership phase:

- engine chart state can already restore `scripted-study`
- the workbench descriptor bridge still owns most local script persistence flows

That created a user-visible blind spot. If a chart was imported with an
engine-native `scripted-study` snapshot and no descriptor replay, the workbench
could restore the study into the chart but still claim:

- no active scripted indicator is mounted
- the related saved custom script is not in use

That was wrong, and it made the Script Library guards untrustworthy for this
middle-state path.

## What changed

- `chartx-demo.ts` now projects fallback scripted active-indicator rows from
  live `chartState.studies`
- the same fallback is reused by custom-script `inUse` checks
- fallback rows are marked non-removable unless the demo runtime has a real
  local pane/series remove handle for them
- Playwright now covers importing an engine-native-only scripted-study layout
  and verifies:
  - the active-indicator list reflects the mounted script
  - input values still show up
  - the saved custom script row is fenced as `in use`
  - no fake remove button is exposed

## Outcome

The workbench active surfaces are now closer to the actual engine state instead
of depending entirely on descriptor replay.

This does not solve full engine-native scripted-study ownership yet, but it
does remove a misleading UI gap in the current transition stage.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "engine-native scripted studies still surface active and in-use fallback state|active custom scripts surface in-use state and fence edit/delete|scripted studies round-trip through restore and import" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not included

- There is still no generic remove path for engine-native fallback scripted-study rows.
- Export/save policy for engine-native-only scripted-study layouts is still a separate follow-up.
