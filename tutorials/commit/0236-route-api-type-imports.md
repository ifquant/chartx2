# 0236 Route API Type Imports

## Why This Commit Exists

After `chart-api-types.ts` became the owner of the public `PhaseOne*` type surface, internal modules still imported those types through `chart-harness`.

That kept the adapter shell acting as a type barrel for internal code. The harness re-export is useful for compatibility, but internal owner and runtime modules should depend directly on the type owner.

## What Changed

- Repointed internal `views` type imports from `chart-harness` to `chart-api-types`.
- Left `views/index.ts` and the harness re-export path intact for compatibility.
- Updated the architecture note to document that internal type imports should target the API-types module.

## Why This Is Safe

This is a mechanical type-import change. It does not change runtime imports, runtime behavior, public exports, or generated API shapes.

`pnpm check` validates that all moved imports resolve through the new type owner.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-api-types chart-public-api chart-factory chart-drawing-property-schema`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Tests that intentionally validate harness re-export compatibility are not rewritten.
- The public `views/index.ts` barrel still re-exports `chart-harness`.
- No runtime code path is intentionally changed.
