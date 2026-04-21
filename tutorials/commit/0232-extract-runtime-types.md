# 0232 Extract Runtime Types

## Why This Commit Exists

`chart-harness` still contained a dense block of runtime-only type aliases for drawing descriptors, series APIs, source states, row sets, and pane target resolution.

Those types describe internal owner wiring. They are not lifecycle logic and they are not the public chart API contract, so keeping them inside the harness kept the adapter shell acting as the type dumping ground.

This slice moves those aliases into a dedicated type module.

## What Changed

- Added `chart-runtime-types.ts` for drawing runtime descriptors, series API unions, source state aliases, row set aliases, and resolved series target types.
- Rewired `chart-harness` to import those aliases as type-only dependencies.
- Removed stale type-only imports from `chart-harness` that are now owned by the runtime type module.
- Updated the architecture note to record the runtime type boundary.

## Why This Is Safe

This is a type-only extraction. No runtime behavior, public API method, owner dependency, render path, restore path, or interaction path is changed.

The new module imports public harness types only through `import type`, so it does not add a runtime dependency cycle.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Public `PhaseOne*` API types still live in `chart-harness`.
- Pane geometry constants are still passed from the harness composition root.
- No runtime policy or behavior is intentionally changed.
