# Script Library In-Use Fence V0

Date: 2026-04-25

## Goal

Surface the existing custom-script in-use guard in the Script Library row UI so
the shell does not advertise edit/delete actions that the runtime will reject.

## Scope

- publish per-script `inUse` state from the demo runtime snapshot
- show inline in-use messaging in saved custom-script rows
- disable edit/delete while a saved custom script is active on a chart
- keep duplicate/add flows unchanged
- add focused visual coverage for the in-use row contract

## Not In Scope

- new active-indicator remove controls
- runtime policy changes for save/delete rejection
- engine-native scripted-study behavior

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test /Users/dev/workspace2/hc_apps/chartx2/tests/visual/phase-one-harness.spec.ts --grep "active custom scripts surface in-use state and fence edit/delete" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`
