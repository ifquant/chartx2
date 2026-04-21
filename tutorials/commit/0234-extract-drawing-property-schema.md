# 0234 Extract Drawing Property Schema

## Why This Commit Exists

`chart-harness` still contained the public drawing property schema data for horizontal lines and trend lines.

That schema is configuration for drawing public state and editor surfaces. It does not belong in the adapter shell, and keeping it inline made the harness grow whenever drawing property UI metadata changed.

## What Changed

- Added `chart-drawing-property-schema.ts` for drawing property schema data.
- Rewired `chart-harness` to import the schema instead of defining it inline.
- Added focused coverage for drawing schema section shape and magnet fields.
- Updated the architecture note to record the drawing schema boundary.

## Why This Is Safe

The schema values are unchanged. The harness still passes the same schema record to `drawingOwner`.

The new module imports public schema types with `import type`, so it does not add a runtime dependency cycle.

## Verification

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-drawing-property-schema chart-drawing-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git -C /Users/dev/workspace2/hc_apps/chartx2 diff --check`

## Not Included

- Public `PhaseOne*` API type aliases still live in `chart-harness`.
- Drawing creation, selection, option application, and restore behavior are unchanged.
