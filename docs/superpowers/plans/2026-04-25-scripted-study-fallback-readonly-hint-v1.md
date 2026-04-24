## Scripted Study Fallback Readonly Hint V1

### Goal

Make fallback-only engine-restored scripted-study rows read as intentionally read-only in the active-indicator surface.

### Scope

- Mark fallback-only scripted rows as `engine-restored`.
- Keep the remove affordance hidden for those rows.
- Add focused visual coverage.

### Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "engine-native scripted studies still surface active and in-use fallback state" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

### Not included

- No export/save policy change for native-only scripted-study layouts.
- No generic remove path for engine-restored fallback rows.
