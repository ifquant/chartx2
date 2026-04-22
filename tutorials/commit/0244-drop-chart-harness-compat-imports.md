# 0244 Drop Chart Harness Compatibility Imports

## Why This Commit Exists

After splitting chart entry exports out of `chart-harness.ts`, the harness module still carried compatibility type/template re-exports only because a handful of tests were still importing old symbols from the harness path.

That meant the harness file was no longer the runtime entry module, but it still had to act like a compatibility barrel for unrelated callers.

## What Changed

- Repointed remaining unit tests from `chart-harness.ts` to `chart-api-types.ts` for public types and template helpers.
- Removed the now-unneeded compatibility re-exports from `chart-harness.ts`.
- Kept the runtime/export split introduced by `chart-entry.ts`, so `chart-harness.ts` now focuses on the harness class itself instead of entry or compatibility concerns.
- Updated the architecture note to record that callers should import from `chart-api-types.ts` or `chart-entry.ts`, not from `chart-harness.ts`.

## Why This Is Safe

This does not change chart runtime behavior, public API behavior, or template helper behavior.

The same symbols still exist; they now come from the modules that actually own them. This commit only removes obsolete compatibility imports so the harness module stops acting as a fallback barrel.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec vitest run tests/unit/chart-api-types.test.ts tests/unit/chart-pane-owner.test.ts tests/unit/chart-drawing-owner.test.ts tests/unit/chart-primary-series-owner.test.ts tests/unit/chart-secondary-series-api-owner.test.ts tests/unit/chart-state-coordinator.test.ts tests/unit/chart-state-snapshot-input-owner.test.ts`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-harness.spec.ts -g "workbench opens by default and renders the baseline chart"`

## Not Included

- No runtime composition logic is changed.
- No public API names are changed.
- This commit does not yet prune every now-unused import in `chart-harness.ts`; it only removes the obsolete compatibility-export role.
