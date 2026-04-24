# 0319 add scripted study fallback readonly hint v1

## Why

The previous fallback slice made engine-native scripted-study rows visible in the
active-indicator list, but the row still had one ambiguous part:

- it showed up like a normal active script
- it had no remove action

That was technically correct, but the UI did not explain whether the missing
remove button was intentional or a bug.

## What changed

- fallback-only scripted rows now render an `engine-restored` hint
- the focused visual test locks that behavior together with the hidden remove
  affordance

## Outcome

The current transition-stage contract is more legible:

- descriptor/runtime-owned script rows can expose local remove
- engine-restored fallback rows are visible, but clearly read as read-only

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts --grep "engine-native scripted studies still surface active and in-use fallback state" --reporter=line`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`

## Not included

- Native-only scripted-study export/save policy is still unresolved.
- There is still no generic remove path for engine-restored fallback rows.
