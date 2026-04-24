## Scripted Study Active Surface Fallback V1

### Goal

Keep workbench active-indicator and custom-script in-use surfaces truthful when engine-native `scripted-study` snapshots are present in live chart state without descriptor replay.

### Scope

- Project fallback scripted active-indicator rows from live `chartState.studies`.
- Reuse that fallback for custom-script `inUse` checks.
- Hide scripted remove affordances for fallback-only rows that do not have a local remove handle.
- Add focused visual coverage for engine-native scripted-study import.

### Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "engine-native scripted studies still surface active and in-use fallback state|active custom scripts surface in-use state and fence edit/delete|scripted studies round-trip through restore and import" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

### Not included

- Engine-native scripted-study remove support.
- Export/save migration policy for engine-native scripted-study-only layouts.
